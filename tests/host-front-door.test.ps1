[CmdletBinding()]
param([string]$PluginRoot)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot).TrimEnd([char]92, [char]47)
$managerScript = Join-Path $PluginRoot 'scripts\manage-host-front-door.ps1'
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('tavernweave-host-front-door-' + [guid]::NewGuid().ToString('N'))

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

function Read-Receipt([string]$JsonText) {
    return ($JsonText | ConvertFrom-Json).receipt
}

try {
    New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
    $codexTarget = Join-Path $testRoot 'codex\AGENTS.md'

    $missingReceipt = Read-Receipt (& $managerScript -PluginRoot $PluginRoot -Host Codex -Action Check -TargetInstructionFile $codexTarget -Json)
    Assert-True ($missingReceipt.statusBefore -eq 'missing-file') 'A missing Codex global file was not diagnosed.'

    & $managerScript -PluginRoot $PluginRoot -Host Codex -Action Preview -TargetInstructionFile $codexTarget | Out-Null
    Assert-True (-not (Test-Path -LiteralPath $codexTarget)) 'Preview unexpectedly wrote the Codex global file.'

    New-Item -ItemType Directory -Path (Split-Path -Parent $codexTarget) -Force | Out-Null
    $unicodeRule = -join ([char[]]@(0x4FDD, 0x7559, 0x8FD9, 0x6761, 0x4E2D, 0x6587, 0x89C4, 0x5219, 0x3002))
    $original = "# user global rules`r`n`r`n- $unicodeRule`r`n"
    [System.IO.File]::WriteAllText($codexTarget, $original, [System.Text.UTF8Encoding]::new($true))
    $installReceipt = Read-Receipt (& $managerScript -PluginRoot $PluginRoot -Host Codex -Action Install -TargetInstructionFile $codexTarget -Confirm:$false -Json)
    Assert-True ($installReceipt.statusAfter -eq 'current') 'The installed Codex front door was not current.'
    Assert-True ($installReceipt.changed -eq $true) 'The first install did not report a change.'
    Assert-True (Test-Path -LiteralPath $installReceipt.backupPath -PathType Leaf) 'The first install did not retain a backup.'
    $installedText = Get-Content -LiteralPath $codexTarget -Raw -Encoding UTF8
    Assert-True ($installedText.Contains("- $unicodeRule")) 'The installer discarded existing Chinese instructions.'
    Assert-True ($installedText.Contains('soul-killer-portable')) 'The managed block omitted the Soul Killer route.'
    Assert-True ($installedText.Contains('orchestrate-project-blueprint')) 'The managed block omitted the brainstorm route.'
    Assert-True ($installedText.Contains('reflect-on-vibe-code-growth')) 'The managed block omitted the mirror-growth route.'
    Assert-True ($installedText.Contains('soul-ensemble-portable')) 'The managed block omitted the Soul ensemble route.'
    Assert-True ($installedText.Contains('runtimePersistentBlueprintBudget = 0')) 'The managed block omitted the persistent-blueprint execution guard.'
    Assert-True ($installedText.Contains('return to the parent step')) 'The managed block omitted the temporary problem-refinement return contract.'
    $installedBytes = [System.IO.File]::ReadAllBytes($codexTarget)
    Assert-True ($installedBytes[0] -eq 0xEF -and $installedBytes[1] -eq 0xBB -and $installedBytes[2] -eq 0xBF) 'The installer did not preserve the UTF-8 BOM.'

    $secondReceipt = Read-Receipt (& $managerScript -PluginRoot $PluginRoot -Host Codex -Action Install -TargetInstructionFile $codexTarget -Confirm:$false -Json)
    Assert-True ($secondReceipt.statusBefore -eq 'current' -and $secondReceipt.changed -eq $false) 'A repeated install was not idempotent.'
    Assert-True (-not $secondReceipt.backupPath) 'An idempotent install created an unnecessary backup.'

    $outdatedText = $installedText.Replace('begin version=1.3.0', 'begin version=1.0.0')
    [System.IO.File]::WriteAllText($codexTarget, $outdatedText, [System.Text.UTF8Encoding]::new($true))
    $outdatedReceipt = Read-Receipt (& $managerScript -PluginRoot $PluginRoot -Host Codex -Action Check -TargetInstructionFile $codexTarget -Json)
    Assert-True ($outdatedReceipt.statusBefore -eq 'outdated') 'An outdated marker version was not diagnosed.'
    $upgradeReceipt = Read-Receipt (& $managerScript -PluginRoot $PluginRoot -Host Codex -Action Install -TargetInstructionFile $codexTarget -Confirm:$false -Json)
    Assert-True ($upgradeReceipt.statusAfter -eq 'current') 'The outdated block did not upgrade to current.'

    $removeReceipt = Read-Receipt (& $managerScript -PluginRoot $PluginRoot -Host Codex -Action Remove -TargetInstructionFile $codexTarget -Confirm:$false -Json)
    Assert-True ($removeReceipt.statusAfter -eq 'missing-block') 'Removal did not remove only the managed block.'
    $removedText = Get-Content -LiteralPath $codexTarget -Raw -Encoding UTF8
    Assert-True ($removedText.Contains("- $unicodeRule")) 'Removal discarded the user-owned global instructions.'
    Assert-True (-not $removedText.Contains('tavernweave-host-front-door:begin')) 'Removal left the managed begin marker behind.'

    $badMarkerTarget = Join-Path $testRoot 'bad\AGENTS.md'
    New-Item -ItemType Directory -Path (Split-Path -Parent $badMarkerTarget) -Force | Out-Null
    [System.IO.File]::WriteAllText($badMarkerTarget, '<!-- tavernweave-host-front-door:begin version=0.0.0 -->', [System.Text.UTF8Encoding]::new($false))
    $badInstallFailed = $false
    try {
        & $managerScript -PluginRoot $PluginRoot -Host Codex -Action Install -TargetInstructionFile $badMarkerTarget -Confirm:$false | Out-Null
    } catch {
        $badInstallFailed = $true
    }
    Assert-True $badInstallFailed 'The manager modified an instruction file with invalid markers.'

    $wrongNameFailed = $false
    try {
        & $managerScript -PluginRoot $PluginRoot -Host Claude -Action Check -TargetInstructionFile (Join-Path $testRoot 'claude\AGENTS.md') | Out-Null
    } catch {
        $wrongNameFailed = $true
    }
    Assert-True $wrongNameFailed 'The Claude adapter accepted a non-CLAUDE.md target.'

    $junctionSource = Join-Path $testRoot 'junction-source'
    $junctionPath = Join-Path $testRoot 'linked-codex'
    New-Item -ItemType Directory -Path $junctionSource -Force | Out-Null
    New-Item -ItemType Junction -Path $junctionPath -Target $junctionSource | Out-Null
    $linkedPathFailed = $false
    try {
        & $managerScript -PluginRoot $PluginRoot -Host Codex -Action Install -TargetInstructionFile (Join-Path $junctionPath 'AGENTS.md') -Confirm:$false | Out-Null
    } catch {
        $linkedPathFailed = $true
    }
    Assert-True $linkedPathFailed 'The manager accepted a path through a linked directory.'

    Write-Output 'Host Front Door tests passed: missing/preview/install/idempotence/upgrade/remove/UTF-8/invalid-marker/wrong-host/linked-path gates passed.'
} finally {
    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd([char]92, [char]47)
    $resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot).TrimEnd([char]92, [char]47)
    $tempPrefix = $tempRoot + [System.IO.Path]::DirectorySeparatorChar
    if ($resolvedTestRoot.StartsWith($tempPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
        $resolvedTestRoot -match '[\\/]tavernweave-host-front-door-[0-9a-f]{32}$' -and
        (Test-Path -LiteralPath $resolvedTestRoot)) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
    }
}
