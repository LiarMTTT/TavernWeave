[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [string]$PluginRoot,
    [Parameter(Mandatory = $true)]
    [string]$TargetSkillRoot,
    [ValidateSet('None', 'Codex', 'Claude')]
    [string]$AgentHost = 'None',
    [ValidateSet('Recommend', 'Prompt', 'Preview', 'Install', 'Skip')]
    [string]$HostFrontDoorAction = 'Recommend',
    [string]$TargetInstructionFile,
    [switch]$KeepBackup
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot).TrimEnd([char]92, [char]47)
$sourceSkillRoot = [System.IO.Path]::GetFullPath((Join-Path $PluginRoot 'skills')).TrimEnd([char]92, [char]47)
$TargetSkillRoot = [System.IO.Path]::GetFullPath($TargetSkillRoot).TrimEnd([char]92, [char]47)

function Test-SamePath([string]$Left, [string]$Right) {
    return $Left.Equals($Right, [System.StringComparison]::OrdinalIgnoreCase)
}

function Test-SameOrChildPath([string]$Path, [string]$Parent) {
    if (Test-SamePath $Path $Parent) { return $true }
    $prefix = $Parent.TrimEnd([char]92, [char]47) + [System.IO.Path]::DirectorySeparatorChar
    return $Path.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
}

$driveRoot = [System.IO.Path]::GetPathRoot($TargetSkillRoot).TrimEnd([char]92, [char]47)
$profileRoot = [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('UserProfile')).TrimEnd([char]92, [char]47)
if ((Test-SamePath $TargetSkillRoot $driveRoot) -or (Test-SamePath $TargetSkillRoot $profileRoot)) {
    throw "Refusing broad installation target: $TargetSkillRoot"
}
if ([System.IO.Path]::GetFileName($TargetSkillRoot) -ne 'skills') {
    throw "TargetSkillRoot must be an explicit directory named 'skills': $TargetSkillRoot"
}
if (Test-SameOrChildPath $TargetSkillRoot $PluginRoot) {
    throw 'Refusing to install into the TavernWeave source repository.'
}

$installManifestPath = Join-Path $PluginRoot 'tavernweave-install-manifest.json'
$verifyScript = Join-Path $PSScriptRoot 'verify-install.ps1'
$frontDoorManager = Join-Path $PSScriptRoot 'manage-host-front-door.ps1'
foreach ($requiredFile in @($installManifestPath, $verifyScript, $frontDoorManager)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required installer file is missing: $requiredFile"
    }
}
$installManifest = Get-Content -LiteralPath $installManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$expectedSkills = @($installManifest.skills | ForEach-Object { [string]$_ })
if ($expectedSkills.Count -ne [int]$installManifest.skillCount) {
    throw 'Installation manifest skillCount does not match its skills array.'
}
foreach ($skillName in $expectedSkills) {
    if (-not (Test-Path -LiteralPath (Join-Path (Join-Path $sourceSkillRoot $skillName) 'SKILL.md') -PathType Leaf)) {
        throw "Source skill is missing or invalid: $skillName"
    }
}

if ($AgentHost -eq 'None' -and $HostFrontDoorAction -in @('Prompt', 'Preview', 'Install')) {
    throw "HostFrontDoorAction $HostFrontDoorAction requires -AgentHost Codex or -AgentHost Claude."
}
if ($TargetInstructionFile -and $AgentHost -eq 'None') {
    throw 'TargetInstructionFile requires -AgentHost Codex or -AgentHost Claude.'
}

function Invoke-HostFrontDoorStep([bool]$PreviewOnly = $false) {
    if ($HostFrontDoorAction -eq 'Skip') {
        Write-Output 'Host Front Door: skipped by explicit choice. Soul activation remains dependent on Skill discovery.'
        return
    }
    if ($AgentHost -eq 'None') {
        Write-Output 'HOST FRONT DOOR RECOMMENDED: install it into the current agent client global instruction file for the best Soul activation, A0 loop, and cross-project TavernWeave routing experience.'
        Write-Output 'Choose the host explicitly: -AgentHost Codex or -AgentHost Claude; then use -HostFrontDoorAction Prompt, Preview, or Install.'
        return
    }

    $resolvedAction = if ($PreviewOnly) { 'Preview' } else { $HostFrontDoorAction }
    if ($resolvedAction -eq 'Recommend') { $resolvedAction = 'Check' }
    if ($resolvedAction -eq 'Prompt') {
        Write-Output "HOST FRONT DOOR RECOMMENDED for ${AgentHost}: global installation provides the best Soul activation and A0 loop experience."
        $choice = (Read-Host 'Choose [I]nstall (recommended), [V]iew proposed block, or [S]kills only').Trim().ToUpperInvariant()
        $resolvedAction = switch ($choice) {
            'I' { 'Install' }
            'V' { 'Preview' }
            'S' { 'Check' }
            default { throw "Unknown Host Front Door choice: $choice" }
        }
    }

    $managerArgs = @{
        PluginRoot = $PluginRoot
        AgentHost = $AgentHost
        Action = $resolvedAction
    }
    if ($TargetInstructionFile) { $managerArgs.TargetInstructionFile = $TargetInstructionFile }
    if ($resolvedAction -in @('Install', 'Remove')) { $managerArgs.Confirm = $false }
    & $frontDoorManager @managerArgs
}

if (-not $PSCmdlet.ShouldProcess($TargetSkillRoot, "Install TavernWeave $($installManifest.version) with $($installManifest.skillCount) complete skills")) {
    Write-Output "WHATIF: would install $($installManifest.skillCount) TavernWeave skills into $TargetSkillRoot"
    Invoke-HostFrontDoorStep -PreviewOnly $true
    return
}

if (-not (Test-Path -LiteralPath $TargetSkillRoot -PathType Container)) {
    New-Item -ItemType Directory -Path $TargetSkillRoot -Force | Out-Null
}

$transactionId = [guid]::NewGuid().ToString('N')
$stageRoot = Join-Path $TargetSkillRoot ".tavernweave-stage-$transactionId"
$backupRoot = Join-Path $TargetSkillRoot ".tavernweave-backup-$transactionId"
$backedUp = [System.Collections.Generic.List[string]]::new()
$installed = [System.Collections.Generic.List[string]]::new()
$success = $false
$rollbackFailed = $false

try {
    New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

    foreach ($skillName in $expectedSkills) {
        $source = Join-Path $sourceSkillRoot $skillName
        $staged = Join-Path $stageRoot $skillName
        Copy-Item -LiteralPath $source -Destination $staged -Recurse -Force
    }

    & $verifyScript -PluginRoot $PluginRoot -TargetRoot $stageRoot -Layout skills | Out-Null

    foreach ($skillName in $expectedSkills) {
        $destination = Join-Path $TargetSkillRoot $skillName
        $staged = Join-Path $stageRoot $skillName
        $backup = Join-Path $backupRoot $skillName
        if (Test-Path -LiteralPath $destination) {
            $existingItem = Get-Item -LiteralPath $destination -Force
            if (($existingItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "Refusing to replace a linked skill directory: $destination"
            }
            Move-Item -LiteralPath $destination -Destination $backup
            $backedUp.Add($skillName)
        }
        Move-Item -LiteralPath $staged -Destination $destination
        $installed.Add($skillName)
    }

    $receipt = @(& $verifyScript -PluginRoot $PluginRoot -TargetRoot $TargetSkillRoot -Layout skills)
    $success = $true
    Write-Output $receipt
    Write-Output 'Install complete. Start a new task or restart the host before claiming Skill discovery.'
    if ($KeepBackup -and $backedUp.Count -gt 0) {
        Write-Output "Backup retained: $backupRoot"
    }
} catch {
    $installError = $_
    [string[]]$rollbackSkills = @($expectedSkills)
    [System.Array]::Reverse($rollbackSkills)
    foreach ($skillName in $rollbackSkills) {
        $destination = Join-Path $TargetSkillRoot $skillName
        $backup = Join-Path $backupRoot $skillName
        try {
            if ($skillName -in $installed -and (Test-Path -LiteralPath $destination)) {
                Remove-Item -LiteralPath $destination -Recurse -Force
            }
            if ($skillName -in $backedUp -and (Test-Path -LiteralPath $backup)) {
                Move-Item -LiteralPath $backup -Destination $destination
            }
        } catch {
            $rollbackFailed = $true
        }
    }
    if ($rollbackFailed) {
        throw "TavernWeave install failed and rollback was incomplete. Preserve and inspect: $backupRoot. Original error: $($installError.Exception.Message)"
    }
    throw "TavernWeave install failed and prior official skills were restored: $($installError.Exception.Message)"
} finally {
    if (Test-Path -LiteralPath $stageRoot) {
        Remove-Item -LiteralPath $stageRoot -Recurse -Force
    }
    if (($success -and -not $KeepBackup) -or (-not $success -and -not $rollbackFailed)) {
        if (Test-Path -LiteralPath $backupRoot) {
            Remove-Item -LiteralPath $backupRoot -Recurse -Force
        }
    }
}

if ($success) {
    try {
        Invoke-HostFrontDoorStep
    } catch {
        throw "TavernWeave Skills installed and verified, but the Host Front Door step failed without rolling back the Skills: $($_.Exception.Message)"
    }
}
