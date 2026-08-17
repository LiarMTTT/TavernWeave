[CmdletBinding()]
param(
    [string]$PluginRoot,
    [Parameter(Mandatory = $true)]
    [string]$TargetRoot,
    [ValidateSet('auto', 'plugin', 'skills')]
    [string]$Layout = 'auto',
    [ValidateSet('None', 'Codex', 'Claude')]
    [string]$AgentHost = 'None',
    [string]$TargetInstructionFile,
    [switch]$Json,
    [switch]$AllowSourceTree
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot).TrimEnd([char]92, [char]47)
$TargetRoot = [System.IO.Path]::GetFullPath($TargetRoot).TrimEnd([char]92, [char]47)
if (-not $AllowSourceTree -and $TargetRoot.Equals($PluginRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to verify the source repository as an installed target. Point TargetRoot at the host-scanned plugin or skills directory.'
}
if ($TargetInstructionFile -and $AgentHost -eq 'None') {
    throw 'TargetInstructionFile requires -AgentHost Codex or -AgentHost Claude.'
}

function Get-PortableFileHash([string]$Path) {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $hashBytes = $bytes
    try {
        $text = [System.Text.UTF8Encoding]::new($false, $true).GetString($bytes)
        $normalized = $text.Replace("`r`n", "`n").Replace("`r", "`n")
        $hashBytes = [System.Text.UTF8Encoding]::new($false).GetBytes($normalized)
    } catch [System.Text.DecoderFallbackException] {
        # Binary and non-UTF-8 files retain byte-exact fingerprints.
    }
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        return ([System.BitConverter]::ToString($algorithm.ComputeHash($hashBytes))).Replace('-', '').ToLowerInvariant()
    } finally {
        $algorithm.Dispose()
    }
}

function Get-TreeFingerprint([string]$Directory) {
    $root = [System.IO.Path]::GetFullPath($Directory).TrimEnd([char]92, [char]47)
    [string[]]$relativePaths = @(foreach ($file in (Get-ChildItem -LiteralPath $root -File -Recurse -Force)) {
        if ($file.FullName -match '[\\/]__pycache__[\\/]' -or $file.Extension -ieq '.pyc') { continue }
        $file.FullName.Substring($root.Length).TrimStart([char]92, [char]47).Replace([char]92, [char]47)
    })
    [System.Array]::Sort($relativePaths, [System.StringComparer]::Ordinal)
    $rows = foreach ($relative in $relativePaths) {
        $nativeRelative = $relative.Replace([char]47, [System.IO.Path]::DirectorySeparatorChar)
        "$relative`t$(Get-PortableFileHash (Join-Path $root $nativeRelative))"
    }
    $material = ($rows -join "`n") + "`n"
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($material)
        return ([System.BitConverter]::ToString($algorithm.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    } finally {
        $algorithm.Dispose()
    }
}

function ConvertTo-DisplayList([object[]]$Values) {
    if (-not $Values -or $Values.Count -eq 0) { return 'none' }
    return ($Values -join ', ')
}

$installManifestPath = Join-Path $PluginRoot 'tavernweave-install-manifest.json'
if (-not (Test-Path -LiteralPath $installManifestPath -PathType Leaf)) {
    throw "Installation manifest not found: $installManifestPath"
}
$installManifest = Get-Content -LiteralPath $installManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$expectedSkills = @($installManifest.skills | ForEach-Object { [string]$_ })
$sourceSkillRoot = Join-Path $PluginRoot 'skills'

if ($expectedSkills.Count -ne [int]$installManifest.skillCount) {
    throw 'Installation manifest skillCount does not match its skills array.'
}
if ($expectedSkills.Count -ne @($expectedSkills | Sort-Object -Unique).Count) {
    throw 'Installation manifest contains duplicate skill names.'
}
foreach ($skillName in $expectedSkills) {
    $sourceSkill = Join-Path $sourceSkillRoot $skillName
    if (-not (Test-Path -LiteralPath (Join-Path $sourceSkill 'SKILL.md') -PathType Leaf)) {
        throw "Installation manifest references an invalid source skill: $skillName"
    }
}

if ($Layout -eq 'auto') {
    $hasPluginSkills = Test-Path -LiteralPath (Join-Path $TargetRoot 'skills') -PathType Container
    $hasPluginManifest = (Test-Path -LiteralPath (Join-Path $TargetRoot '.codex-plugin\plugin.json') -PathType Leaf) -or
        (Test-Path -LiteralPath (Join-Path $TargetRoot '.claude-plugin\plugin.json') -PathType Leaf)
    $Layout = if ($hasPluginSkills -and $hasPluginManifest) { 'plugin' } else { 'skills' }
}

$targetSkillRoot = if ($Layout -eq 'plugin') { Join-Path $TargetRoot 'skills' } else { $TargetRoot }
$targetDirectories = @()
if (Test-Path -LiteralPath $targetSkillRoot -PathType Container) {
    $targetDirectories = @(Get-ChildItem -LiteralPath $targetSkillRoot -Directory -Force | Where-Object {
        -not $_.Name.StartsWith('.tavernweave-', [System.StringComparison]::OrdinalIgnoreCase)
    } | ForEach-Object { $_.Name })
}

$presentSkills = [System.Collections.Generic.List[string]]::new()
$missingSkills = [System.Collections.Generic.List[string]]::new()
$driftedSkills = [System.Collections.Generic.List[string]]::new()
foreach ($skillName in $expectedSkills) {
    $targetSkill = Join-Path $targetSkillRoot $skillName
    if (-not (Test-Path -LiteralPath (Join-Path $targetSkill 'SKILL.md') -PathType Leaf)) {
        $missingSkills.Add($skillName)
        continue
    }
    $presentSkills.Add($skillName)
    if ((Get-TreeFingerprint (Join-Path $sourceSkillRoot $skillName)) -ne (Get-TreeFingerprint $targetSkill)) {
        $driftedSkills.Add($skillName)
    }
}

$missingRequiredPaths = [System.Collections.Generic.List[string]]::new()
foreach ($requiredPathValue in @($installManifest.requiredPaths)) {
    $requiredPath = [string]$requiredPathValue
    $targetRelative = if ($Layout -eq 'plugin') { $requiredPath } else { $requiredPath -replace '^skills[\\/]', '' }
    $targetPath = Join-Path $TargetRoot ($targetRelative.Replace([char]47, [System.IO.Path]::DirectorySeparatorChar))
    if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
        $missingRequiredPaths.Add($requiredPath)
    }
}

$manifestVersionMismatches = [System.Collections.Generic.List[string]]::new()
if ($Layout -eq 'plugin') {
    foreach ($relativeManifest in @('.codex-plugin\plugin.json', '.claude-plugin\plugin.json')) {
        $targetManifestPath = Join-Path $TargetRoot $relativeManifest
        if (Test-Path -LiteralPath $targetManifestPath -PathType Leaf) {
            $targetManifest = Get-Content -LiteralPath $targetManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ([string]$targetManifest.version -ne [string]$installManifest.version) {
                $manifestVersionMismatches.Add("$relativeManifest=$($targetManifest.version)")
            }
        }
    }
}

$extraTargetDirectories = @($targetDirectories | Where-Object { $_ -notin $expectedSkills } | Sort-Object)
$matchedSkills = @($presentSkills | Where-Object { $_ -notin $driftedSkills })
$frontDoorReceipt = $null
if ($AgentHost -ne 'None') {
    $frontDoorManager = Join-Path $PluginRoot 'scripts\manage-host-front-door.ps1'
    if (-not (Test-Path -LiteralPath $frontDoorManager -PathType Leaf)) {
        throw "Host Front Door manager is missing: $frontDoorManager"
    }
    $frontDoorArgs = @{ PluginRoot = $PluginRoot; AgentHost = $AgentHost; Action = 'Check'; Json = $true }
    if ($TargetInstructionFile) { $frontDoorArgs.TargetInstructionFile = $TargetInstructionFile }
    $frontDoorPayload = (& $frontDoorManager @frontDoorArgs | Out-String) | ConvertFrom-Json
    $frontDoorReceipt = $frontDoorPayload.receipt
}
$failures = [System.Collections.Generic.List[string]]::new()
if ($missingSkills.Count -gt 0) { $failures.Add('missing-skills') }
if ($driftedSkills.Count -gt 0) { $failures.Add('content-drift') }
if ($missingRequiredPaths.Count -gt 0) { $failures.Add('missing-required-paths') }
if ($manifestVersionMismatches.Count -gt 0) { $failures.Add('manifest-version-mismatch') }

$receipt = [pscustomobject][ordered]@{
    status = if ($failures.Count -eq 0) { 'PASS' } else { 'FAIL' }
    package = [string]$installManifest.package
    version = [string]$installManifest.version
    layout = $Layout
    targetRoot = $TargetRoot
    expectedSkills = [int]$installManifest.skillCount
    installedSkills = $presentSkills.Count
    matchedSkills = $matchedSkills.Count
    missingSkills = @($missingSkills)
    driftedSkills = @($driftedSkills)
    missingRequiredPaths = @($missingRequiredPaths)
    manifestVersionMismatches = @($manifestVersionMismatches)
    extraTargetDirectories = $extraTargetDirectories
    librarySkill = if ('consult-tavernweave-library' -in $matchedSkills) { 'present-and-matched' } else { 'missing-or-drifted' }
    libraryPicker = if ('skills/consult-tavernweave-library/assets/picker/index.html' -notin $missingRequiredPaths) { 'present' } else { 'missing' }
    soulSkill = if ('activate-tavernweave-soul' -in $matchedSkills) { 'present-and-matched' } else { 'missing-or-drifted' }
    hostFrontDoor = if ($frontDoorReceipt) { [string]$frontDoorReceipt.statusAfter } else { 'not-checked' }
    hostFrontDoorTarget = if ($frontDoorReceipt) { [string]$frontDoorReceipt.targetInstructionFile } else { $null }
    hostFrontDoorVersion = if ($frontDoorReceipt) { [string]$frontDoorReceipt.adapterVersion } else { $null }
    hostRediscovery = [string]$installManifest.hostRediscovery
    failures = @($failures)
}

if ($Json) {
    Write-Output ($receipt | ConvertTo-Json -Depth 6)
} else {
    Write-Output 'TavernWeave installation receipt'
    Write-Output "Status: $($receipt.status)"
    Write-Output "Version: $($receipt.version)"
    Write-Output "Layout: $($receipt.layout)"
    Write-Output "Target: $($receipt.targetRoot)"
    Write-Output "Skills: $($receipt.matchedSkills)/$($receipt.expectedSkills) matched"
    Write-Output "Missing skills: $(ConvertTo-DisplayList @($receipt.missingSkills))"
    Write-Output "Drifted skills: $(ConvertTo-DisplayList @($receipt.driftedSkills))"
    Write-Output "Missing required paths: $(ConvertTo-DisplayList @($receipt.missingRequiredPaths))"
    Write-Output "Manifest version mismatches: $(ConvertTo-DisplayList @($receipt.manifestVersionMismatches))"
    Write-Output "Unrelated target directories preserved: $(ConvertTo-DisplayList @($receipt.extraTargetDirectories))"
    Write-Output "Library: $($receipt.librarySkill)"
    Write-Output "Library picker: $($receipt.libraryPicker)"
    Write-Output "Soul: $($receipt.soulSkill)"
    Write-Output "Host Front Door: $($receipt.hostFrontDoor)"
    if ($receipt.hostFrontDoorTarget) { Write-Output "Host Front Door target: $($receipt.hostFrontDoorTarget)" }
    Write-Output "Host rediscovery: $($receipt.hostRediscovery)"
}

if ($failures.Count -gt 0) {
    throw "TavernWeave installation verification failed: $($failures -join ', ')"
}
if (-not $Json) {
    Write-Output "INSTALLATION VERIFIED: $($receipt.matchedSkills)/$($receipt.expectedSkills)"
}
