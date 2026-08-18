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

function Assert-VerifyFails([string]$TargetRoot, [string]$Message) {
    $failed = $false
    try {
        & $verifyScript -PluginRoot $PluginRoot -TargetRoot $TargetRoot -Layout skills | Out-Null
    } catch {
        $failed = $true
    }
    Assert-True $failed $Message
}

try {
    New-Item -ItemType Directory -Path $testRoot -Force | Out-Null

    $legacyRoot = Join-Path $testRoot 'legacy\skills'
    New-Item -ItemType Directory -Path $legacyRoot -Force | Out-Null
    foreach ($skillName in @($manifest.skills | Where-Object { $_ -ne 'reflect-on-vibe-code-growth' })) {
        Copy-Item -LiteralPath (Join-Path $sourceSkillRoot $skillName) -Destination (Join-Path $legacyRoot $skillName) -Recurse -Force
    }
    New-Item -ItemType Directory -Path (Join-Path $legacyRoot 'unrelated-user-skill') -Force | Out-Null
    Assert-VerifyFails $legacyRoot 'A 19-skill legacy install must fail before it can claim current TavernWeave source completeness.'

    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $legacyRoot -Confirm:$false | Out-Null
    $legacyReceipt = @(& $verifyScript -PluginRoot $PluginRoot -TargetRoot $legacyRoot -Layout skills)
    Assert-True ($legacyReceipt -contains 'INSTALLATION VERIFIED: 20/20') 'The upgraded legacy target did not reach 20/20.'
    Assert-True (Test-Path -LiteralPath (Join-Path $legacyRoot 'reflect-on-vibe-code-growth\SKILL.md') -PathType Leaf) 'The upgrade did not create the new mirror-growth Skill.'
    Assert-True (Test-Path -LiteralPath (Join-Path $legacyRoot 'unrelated-user-skill') -PathType Container) 'The installer removed an unrelated user skill.'

    $cleanRoot = Join-Path $testRoot 'clean\skills'
    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -Confirm:$false | Out-Null
    $cleanReceipt = @(& $verifyScript -PluginRoot $PluginRoot -TargetRoot $cleanRoot -Layout skills)
    Assert-True ($cleanReceipt -contains 'INSTALLATION VERIFIED: 20/20') 'A clean install did not reach 20/20.'

    $frontDoorTarget = Join-Path $testRoot 'host-front-door\AGENTS.md'
    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -AgentHost Codex -HostFrontDoorAction Install -TargetInstructionFile $frontDoorTarget -Confirm:$false | Out-Null
    $frontDoorCheck = ((& $frontDoorManager -PluginRoot $PluginRoot -AgentHost Codex -Action Check -TargetInstructionFile $frontDoorTarget -Json) | Out-String) | ConvertFrom-Json
    Assert-True ($frontDoorCheck.receipt.statusAfter -eq 'current') 'The integrated installer did not install the Codex Host Front Door.'
    $frontDoorVerify = ((& $verifyScript -PluginRoot $PluginRoot -TargetRoot $cleanRoot -Layout skills -AgentHost Codex -TargetInstructionFile $frontDoorTarget -Json) | Out-String) | ConvertFrom-Json
    Assert-True ($frontDoorVerify.hostFrontDoor -eq 'current') 'The installation receipt did not report the current Host Front Door.'
    & $installScript -PluginRoot $PluginRoot -TargetSkillRoot $cleanRoot -AgentHost Codex -HostFrontDoorAction Install -TargetInstructionFile $frontDoorTarget -Confirm:$false | Out-Null
    $frontDoorAfterSecondInstall = ((& $frontDoorManager -PluginRoot $PluginRoot -AgentHost Codex -Action Check -TargetInstructionFile $frontDoorTarget -Json) | Out-String) | ConvertFrom-Json
    Assert-True ($frontDoorAfterSecondInstall.receipt.statusAfter -eq 'current') 'The integrated Host Front Door update was not idempotent.'

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
    Assert-True ($sourceReceipt -contains 'INSTALLATION VERIFIED: 20/20') 'Maintainer source verification must require and honor AllowSourceTree.'

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

    Write-Output 'Install gate tests passed: legacy gap rejected, 20/20 upgrade passed, clean install passed, Host Front Door install/receipt/idempotence passed, drift rejected, picker loss rejected, unsafe target rejected, source-tree impersonation rejected, linked-target rollback passed.'
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
