[CmdletBinding()]
param([string]$PluginRoot)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot).TrimEnd([char]92, [char]47)
$installScript = Join-Path $PluginRoot 'scripts\install-tavernweave.ps1'
$verifyScript = Join-Path $PluginRoot 'scripts\verify-install.ps1'
$frontDoorManager = Join-Path $PluginRoot 'scripts\manage-host-front-door.ps1'
$manifestPath = Join-Path $PluginRoot 'tavernweave-install-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$sourceSkillRoot = Join-Path $PluginRoot 'skills'
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('tavernweave-install-gate-' + [guid]::NewGuid().ToString('N'))

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

function Assert-VerifyFails([string]$TargetRoot, [string]$Message, [string]$Layout = 'skills') {
    $failed = $false
    try {
        & $verifyScript -PluginRoot $PluginRoot -TargetRoot $TargetRoot -Layout $Layout | Out-Null
    } catch {
        $failed = $true
    }
    Assert-True $failed $Message
}

try {
    New-Item -ItemType Directory -Path $testRoot -Force | Out-Null

    $legacyRoot = Join-Path $testRoot 'legacy\skills'
    New-Item -ItemType Directory -Path $legacyRoot -Force | Out-Null
    foreach ($skillName in @($manifest.skills | Where-Object { $_ -ne 'build-work-library' })) {
        Copy-Item -LiteralPath (Join-Path $sourceSkillRoot $skillName) -Destination (Join-Path $legacyRoot $skillName) -Recurse -Force
    }
    Assert-True (@(Get-ChildItem -LiteralPath $legacyRoot -Directory).Count -eq 21) 'The v1.5.0 inventory fixture must contain exactly 21 official skills.'
    New-Item -ItemType Directory -Path (Join-Path $legacyRoot 'unrelated-user-skill') -Force | Out-Null
    Assert-VerifyFails $legacyRoot 'A 21-skill legacy inventory must fail before it can claim current TavernWeave source completeness.'

    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $legacyRoot -Confirm:$false | Out-Null
    $legacyReceipt = @(& $verifyScript -PluginRoot $PluginRoot -TargetRoot $legacyRoot -Layout skills)
    Assert-True ($legacyReceipt -contains 'INSTALLATION VERIFIED: 22/22') 'The upgraded legacy target did not reach 22/22.'
    Assert-True (Test-Path -LiteralPath (Join-Path $legacyRoot 'build-work-library\scripts\work_library.py') -PathType Leaf) 'The upgrade did not create the new work-library Skill and its self-contained local tool.'
    Assert-True (Test-Path -LiteralPath (Join-Path $legacyRoot 'unrelated-user-skill') -PathType Container) 'The installer removed an unrelated user skill.'

    $cleanRoot = Join-Path $testRoot 'clean\skills'
    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -Confirm:$false | Out-Null
    $cleanReceipt = @(& $verifyScript -PluginRoot $PluginRoot -TargetRoot $cleanRoot -Layout skills)
    Assert-True ($cleanReceipt -contains 'INSTALLATION VERIFIED: 22/22') 'A clean install did not reach 22/22.'

    $frontDoorTarget = Join-Path $testRoot 'host-front-door\AGENTS.md'
    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -AgentHost Codex -HostFrontDoorAction Install -TargetInstructionFile $frontDoorTarget -Confirm:$false | Out-Null
    $frontDoorCheck = ((& $frontDoorManager -PluginRoot $PluginRoot -AgentHost Codex -Action Check -TargetInstructionFile $frontDoorTarget -Json) | Out-String) | ConvertFrom-Json
    Assert-True ($frontDoorCheck.receipt.statusAfter -eq 'current') 'The integrated installer did not install the Codex Host Front Door.'
    $frontDoorVerify = ((& $verifyScript -PluginRoot $PluginRoot -TargetRoot $cleanRoot -Layout skills -AgentHost Codex -TargetInstructionFile $frontDoorTarget -Json) | Out-String) | ConvertFrom-Json
    Assert-True ($frontDoorVerify.hostFrontDoor -eq 'current') 'The installation receipt did not report the current Host Front Door.'
    Assert-True ($frontDoorVerify.guidancePreferenceStatus -eq 'unset' -and -not $frontDoorVerify.guidanceLevel) 'Install assigned a guidance level without a user choice.'
    $guidanceManager = Join-Path $cleanRoot 'consult-tavernweave-library\scripts\manage-guidance-preference.mjs'
    $chosenLevel = -join ([char[]]@(0x5165, 0x95E8))
    $guidanceArgs = @('--host', 'codex', '--scope-root', (Split-Path -Parent $frontDoorTarget), '--target', $frontDoorTarget)
    $guidancePreview = (& node $guidanceManager @guidanceArgs --action preview --level $chosenLevel | Out-String) | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw 'Copied preference manager preview failed.' }
    & node $guidanceManager @guidanceArgs --action set --level $chosenLevel --approved --expected-token $guidancePreview.previewToken --backup-dir (Join-Path $testRoot 'preference-backups') | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Copied preference manager save failed.' }
    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -AgentHost Codex -HostFrontDoorAction Install -TargetInstructionFile $frontDoorTarget -Confirm:$false | Out-Null
    $frontDoorAfterSecondInstall = ((& $frontDoorManager -PluginRoot $PluginRoot -AgentHost Codex -Action Check -TargetInstructionFile $frontDoorTarget -Json) | Out-String) | ConvertFrom-Json
    Assert-True ($frontDoorAfterSecondInstall.receipt.statusAfter -eq 'current') 'The integrated Host Front Door update was not idempotent.'
    Assert-True ($frontDoorAfterSecondInstall.receipt.guidanceLevel -ceq $chosenLevel) 'Reinstallation changed the selected guidance level.'
    Assert-True ($frontDoorAfterSecondInstall.receipt.hostLoading -eq 'not-verified') 'Installer claimed real host loading from files.'

    [System.IO.File]::AppendAllText((Join-Path $cleanRoot 'consult-tavernweave-library\SKILL.md'), "`ninstallation drift`n", [System.Text.UTF8Encoding]::new($false))
    Assert-VerifyFails $cleanRoot 'A modified Library skill must fail content verification.'

    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -Confirm:$false | Out-Null
    $pickerPath = Join-Path $cleanRoot 'consult-tavernweave-library\assets\picker\index.html'
    Remove-Item -LiteralPath $pickerPath -Force
    Assert-VerifyFails $cleanRoot 'A missing Library picker must fail required-path verification.'

    $unsafeTargetFailed = $false
    try {
        & $installScript -PluginRoot $PluginRoot -TargetSkillRoot (Join-Path $testRoot 'not-a-skill-root') -WhatIf -Confirm:$false | Out-Null
    } catch {
        $unsafeTargetFailed = $true
    }
    Assert-True $unsafeTargetFailed 'The installer must reject a write target whose final directory is not named skills.'

    $sourceTreeVerificationFailed = $false
    try {
        & $verifyScript -PluginRoot $PluginRoot -TargetRoot $PluginRoot -Layout plugin | Out-Null
    } catch {
        $sourceTreeVerificationFailed = $true
    }
    Assert-True $sourceTreeVerificationFailed 'The verifier must not let the source repository impersonate an installed target.'

    $sourceReceipt = @(& $verifyScript -PluginRoot $PluginRoot -TargetRoot $PluginRoot -Layout plugin -AllowSourceTree)
    Assert-True ($sourceReceipt -contains 'INSTALLATION VERIFIED: 22/22') 'Maintainer source verification must require and honor AllowSourceTree.'

    $pluginFixture = Join-Path $testRoot 'codex-plugin'
    New-Item -ItemType Directory -Path $pluginFixture -Force | Out-Null
    Copy-Item -LiteralPath $sourceSkillRoot -Destination (Join-Path $pluginFixture 'skills') -Recurse
    foreach ($directory in @('.codex-plugin', '.claude-plugin')) {
        New-Item -ItemType Directory -Path (Join-Path $pluginFixture $directory) -Force | Out-Null
        Copy-Item -LiteralPath (Join-Path $PluginRoot "$directory\plugin.json") -Destination (Join-Path $pluginFixture "$directory\plugin.json")
    }
    $codexManifestPath = Join-Path $pluginFixture '.codex-plugin\plugin.json'
    $codexManifest = Get-Content -LiteralPath $codexManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $codexManifest.version = "$($manifest.version)+codex.20260907040405"
    [System.IO.File]::WriteAllText($codexManifestPath, ($codexManifest | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
    $cacheReceipt = (& $verifyScript -PluginRoot $PluginRoot -TargetRoot $pluginFixture -Layout plugin -Json | Out-String) | ConvertFrom-Json
    Assert-True ($cacheReceipt.status -eq 'PASS' -and $cacheReceipt.matchedSkills -eq 22) 'An official Codex cache suffix must not hide a matching installation.'
    Assert-True ($cacheReceipt.codexCachebusterVersion -ceq $codexManifest.version) 'The receipt must retain the actual Codex cache version.'
    Assert-True ($cacheReceipt.hostLoading -eq 'not-verified') 'Cache version recognition must not claim host loading.'
    foreach ($badVersion in @('0.0.0+codex.20260907040405', "$($manifest.version)+other.20260907040405", "$($manifest.version)+codex.", "$($manifest.version)+codex.first+codex.second")) {
        $codexManifest.version = $badVersion
        [System.IO.File]::WriteAllText($codexManifestPath, ($codexManifest | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
        Assert-VerifyFails $pluginFixture "Unsupported version must fail: $badVersion" 'plugin'
    }
    $codexManifest.version = "$($manifest.version)+codex.local-20260907-040405"
    [System.IO.File]::WriteAllText($codexManifestPath, ($codexManifest | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
    & $verifyScript -PluginRoot $PluginRoot -TargetRoot $pluginFixture -Layout plugin | Out-Null
    $claudeManifestPath = Join-Path $pluginFixture '.claude-plugin\plugin.json'
    $claudeManifest = Get-Content -LiteralPath $claudeManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $claudeManifest.version = $codexManifest.version
    [System.IO.File]::WriteAllText($claudeManifestPath, ($claudeManifest | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
    Assert-VerifyFails $pluginFixture 'Codex cache suffixes must not be accepted for the Claude manifest.' 'plugin'
    Copy-Item -LiteralPath (Join-Path $PluginRoot '.claude-plugin\plugin.json') -Destination $claudeManifestPath -Force
    [System.IO.File]::AppendAllText((Join-Path $pluginFixture 'skills\consult-tavernweave-library\SKILL.md'), "`ncache fixture drift`n", [System.Text.UTF8Encoding]::new($false))
    Assert-VerifyFails $pluginFixture 'A valid Codex suffix must not bypass Skill content verification.' 'plugin'

    $rollbackRoot = Join-Path $testRoot 'rollback\skills'
    New-Item -ItemType Directory -Path $rollbackRoot -Force | Out-Null
    foreach ($skillName in @('activate-tavernweave-soul', 'code-quality-workflow')) {
        Copy-Item -LiteralPath (Join-Path $sourceSkillRoot $skillName) -Destination (Join-Path $rollbackRoot $skillName) -Recurse -Force
    }
    $rollbackMarker = Join-Path $rollbackRoot 'activate-tavernweave-soul\local-marker.txt'
    [System.IO.File]::WriteAllText($rollbackMarker, 'preserve me', [System.Text.UTF8Encoding]::new($false))
    $junctionTarget = Join-Path $testRoot 'linked-library-target'
    New-Item -ItemType Directory -Path $junctionTarget -Force | Out-Null
    New-Item -ItemType Junction -Path (Join-Path $rollbackRoot 'consult-tavernweave-library') -Target $junctionTarget | Out-Null
    $rollbackInstallFailed = $false
    try {
        & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $rollbackRoot -Confirm:$false | Out-Null
    } catch {
        $rollbackInstallFailed = $true
    }
    Assert-True $rollbackInstallFailed 'The installer must refuse a linked official skill directory.'
    Assert-True (Test-Path -LiteralPath $rollbackMarker -PathType Leaf) 'A failed install did not restore the previously replaced official skill.'

    Write-Output 'Install gate tests passed: legacy gap rejected, 22/22 upgrade passed, clean install passed, Host Front Door install/receipt/idempotence passed, Codex cache suffix recognized with version/content checks preserved, drift rejected, picker loss rejected, unsafe target rejected, source-tree impersonation rejected, linked-target rollback passed.'
} finally {
    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd([char]92, [char]47)
    $resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot).TrimEnd([char]92, [char]47)
    $tempPrefix = $tempRoot + [System.IO.Path]::DirectorySeparatorChar
    if ($resolvedTestRoot.StartsWith($tempPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
        $resolvedTestRoot -match '[\\/]tavernweave-install-gate-[0-9a-f]{32}$' -and
        (Test-Path -LiteralPath $resolvedTestRoot)) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
    }
}
