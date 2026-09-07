[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [string]$PluginRoot,
    [Parameter(Mandatory = $true)]
    [ValidateSet('Codex', 'Claude')]
    [Alias('Host')]
    [string]$AgentHost,
    [ValidateSet('Check', 'Preview', 'Install', 'Remove')]
    [string]$Action = 'Check',
    [string]$TargetInstructionFile,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot).TrimEnd([char]92, [char]47)

$adapterRoot = Join-Path $PluginRoot 'host-adapters'
$hostMapPath = Join-Path $adapterRoot 'host-map.json'
$templatePath = Join-Path $adapterRoot 'tavernweave-front-door.md'
$guidanceManager = Join-Path $PluginRoot 'skills\consult-tavernweave-library\scripts\manage-guidance-preference.mjs'
foreach ($requiredFile in @($hostMapPath, $templatePath, $guidanceManager)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Host Front Door source is missing: $requiredFile"
    }
}

$hostMap = Get-Content -LiteralPath $hostMapPath -Raw -Encoding UTF8 | ConvertFrom-Json
$hostKey = $AgentHost.ToLowerInvariant()
$hostProperty = $hostMap.hosts.PSObject.Properties[$hostKey]
if (-not $hostProperty) { throw "Host mapping is missing: $AgentHost" }
$hostConfig = $hostProperty.Value
if ($hostConfig.support -ne 'formal') {
    throw "Host $AgentHost is not supported by the global-file adapter: $($hostConfig.support)"
}

$userProfilePath = [System.IO.Path]::GetFullPath([Environment]::GetFolderPath('UserProfile')).TrimEnd([char]92, [char]47)
if (-not $TargetInstructionFile) {
    $hostHome = $null
    if ($hostConfig.homeOverrideEnvironment) {
        $overrideValue = [Environment]::GetEnvironmentVariable([string]$hostConfig.homeOverrideEnvironment)
        if ($overrideValue) { $hostHome = [System.IO.Path]::GetFullPath($overrideValue) }
    }
    if (-not $hostHome) { $hostHome = Join-Path $userProfilePath ([string]$hostConfig.defaultDirectory) }
    $TargetInstructionFile = Join-Path $hostHome ([string]$hostConfig.instructionFileName)
    if ($hostKey -eq 'codex') {
        $overridePath = Join-Path $hostHome 'AGENTS.override.md'
        if (Test-Path -LiteralPath $overridePath -PathType Leaf) {
            $overrideText = Get-Content -LiteralPath $overridePath -Raw -Encoding UTF8
            if (-not [string]::IsNullOrWhiteSpace($overrideText)) {
                $TargetInstructionFile = $overridePath
            }
        }
    }
}
$TargetInstructionFile = [System.IO.Path]::GetFullPath($TargetInstructionFile)

$expectedFileName = [string]$hostConfig.instructionFileName
$allowedFileNames = @($expectedFileName)
if ($hostKey -eq 'codex') { $allowedFileNames += 'AGENTS.override.md' }
if ([System.IO.Path]::GetFileName($TargetInstructionFile) -notin $allowedFileNames) {
    throw "The $AgentHost Host Front Door target must end with ${expectedFileName}: $TargetInstructionFile"
}
if (Test-Path -LiteralPath $TargetInstructionFile -PathType Container) {
    throw "Host Front Door target is a directory, not a file: $TargetInstructionFile"
}

function Test-ReparsePoint([System.IO.FileSystemInfo]$Item) {
    return (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
}

if (Test-Path -LiteralPath $TargetInstructionFile) {
    $targetItem = Get-Item -LiteralPath $TargetInstructionFile -Force
    if (Test-ReparsePoint $targetItem) { throw "Refusing a linked instruction file: $TargetInstructionFile" }
}
$targetParent = Split-Path -Parent $TargetInstructionFile
$ancestor = $targetParent
while ($ancestor) {
    if (Test-Path -LiteralPath $ancestor) {
        $ancestorItem = Get-Item -LiteralPath $ancestor -Force
        if (Test-ReparsePoint $ancestorItem) { throw "Refusing a Host Front Door path through a linked directory: $ancestor" }
    }
    $nextAncestor = Split-Path -Parent $ancestor
    if (-not $nextAncestor -or $nextAncestor -eq $ancestor) { break }
    $ancestor = $nextAncestor
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw '需要 Node.js 来核对用户挡位和有效规则位置；请先安装项目要求的 Node.js。' }
$guidanceOutput = & $nodeCommand.Source $guidanceManager --host $hostKey --scope-root $targetParent --target $TargetInstructionFile
if ($LASTEXITCODE -ne 0) { throw '有效全局规则或用户挡位检查失败；未修改全局入口。' }
$guidanceState = ($guidanceOutput | Out-String) | ConvertFrom-Json
if ($Action -in @('Install', 'Remove') -and $guidanceState.statusAfter -notin @('unset', 'selected')) {
    throw '用户挡位区块损坏、重复或结构不受支持；请先核对修复范围，未覆盖用户选择。'
}

$utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
function Read-Utf8File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return [pscustomobject]@{ Exists = $false; Text = ''; HasBom = $false; Newline = "`n" }
    }
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    $offset = if ($hasBom) { 3 } else { 0 }
    try {
        $text = $utf8Strict.GetString($bytes, $offset, $bytes.Length - $offset)
    } catch {
        throw "Instruction file is not valid UTF-8: $Path"
    }
    $newline = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
    return [pscustomobject]@{ Exists = $true; Text = $text; HasBom = $hasBom; Newline = $newline }
}

function Normalize-Newlines([string]$Text) {
    return $Text.Replace("`r`n", "`n").Replace("`r", "`n")
}

$templateText = (Get-Content -LiteralPath $templatePath -Raw -Encoding UTF8).TrimEnd([char]13, [char]10)
$beginPrefix = '<!-- tavernweave-host-front-door:begin version='
$endMarker = '<!-- tavernweave-host-front-door:end -->'
$templateVersionMatch = [regex]::Match($templateText, '(?m)^<!-- tavernweave-host-front-door:begin version=(?<version>[^ ]+) -->$')
if (-not $templateVersionMatch.Success -or ([regex]::Matches($templateText, [regex]::Escape($endMarker))).Count -ne 1) {
    throw 'Host Front Door template markers are invalid.'
}
$templateVersion = $templateVersionMatch.Groups['version'].Value
$managedBlockPattern = '(?ms)^<!-- tavernweave-host-front-door:begin version=(?<version>[^ ]+) -->\r?\n.*?^<!-- tavernweave-host-front-door:end -->[ \t]*'

function Get-FrontDoorState([pscustomobject]$FileState) {
    if (-not $FileState.Exists) {
        return [pscustomobject]@{ Status = 'missing-file'; Match = $null; InstalledVersion = $null }
    }
    $beginCount = ([regex]::Matches($FileState.Text, [regex]::Escape($beginPrefix))).Count
    $endCount = ([regex]::Matches($FileState.Text, [regex]::Escape($endMarker))).Count
    if ($beginCount -ne $endCount -or $beginCount -gt 1) {
        return [pscustomobject]@{ Status = 'invalid-markers'; Match = $null; InstalledVersion = $null }
    }
    if ($beginCount -eq 0) {
        return [pscustomobject]@{ Status = 'missing-block'; Match = $null; InstalledVersion = $null }
    }
    $match = [regex]::Match($FileState.Text, $managedBlockPattern)
    if (-not $match.Success) {
        return [pscustomobject]@{ Status = 'invalid-markers'; Match = $null; InstalledVersion = $null }
    }
    $installedVersion = $match.Groups['version'].Value
    $same = (Normalize-Newlines $match.Value).TrimEnd([char]10) -ceq (Normalize-Newlines $templateText).TrimEnd([char]10)
    $status = if ($same) { 'current' } elseif ($installedVersion -ne $templateVersion) { 'outdated' } else { 'drifted' }
    return [pscustomobject]@{ Status = $status; Match = $match; InstalledVersion = $installedVersion }
}

function Get-InstalledText([pscustomobject]$FileState, [pscustomobject]$FrontDoorState) {
    $block = (Normalize-Newlines $templateText).Replace("`n", $FileState.Newline)
    if (-not $FileState.Exists -or -not $FileState.Text) { return $block + $FileState.Newline }
    if ($FrontDoorState.Status -eq 'missing-block') {
        $prefix = $FileState.Text.TrimEnd([char]13, [char]10)
        return $prefix + $FileState.Newline + $FileState.Newline + $block + $FileState.Newline
    }
    if ($FrontDoorState.Status -in @('current', 'outdated', 'drifted')) {
        $before = $FileState.Text.Substring(0, $FrontDoorState.Match.Index)
        $after = $FileState.Text.Substring($FrontDoorState.Match.Index + $FrontDoorState.Match.Length)
        return $before + $block + $after
    }
    throw 'Cannot install into a file with invalid TavernWeave markers.'
}

function Get-RemovedText([pscustomobject]$FileState, [pscustomobject]$FrontDoorState) {
    if ($FrontDoorState.Status -in @('missing-file', 'missing-block')) { return $FileState.Text }
    if ($FrontDoorState.Status -eq 'invalid-markers') { throw 'Cannot remove an invalid TavernWeave marker block.' }
    $before = $FileState.Text.Substring(0, $FrontDoorState.Match.Index).TrimEnd([char]13, [char]10)
    $after = $FileState.Text.Substring($FrontDoorState.Match.Index + $FrontDoorState.Match.Length).TrimStart([char]13, [char]10)
    if ($before -and $after) { return $before + $FileState.Newline + $FileState.Newline + $after }
    if ($before) { return $before + $FileState.Newline }
    if ($after) { return $after }
    return ''
}

function Write-Utf8File([string]$Path, [string]$Text, [bool]$HasBom) {
    $encoding = [System.Text.UTF8Encoding]::new($HasBom)
    [System.IO.File]::WriteAllText($Path, $Text, $encoding)
}

$fileState = Read-Utf8File $TargetInstructionFile
$frontDoorState = Get-FrontDoorState $fileState
$proposedText = if ($Action -eq 'Remove') {
    Get-RemovedText $fileState $frontDoorState
} else {
    Get-InstalledText $fileState $frontDoorState
}
$changed = $fileState.Text -cne $proposedText
$backupPath = $null
$didWrite = $false

if ($Action -in @('Install', 'Remove') -and $changed) {
    if ($frontDoorState.Status -eq 'invalid-markers') {
        throw 'Refusing to modify a file with invalid TavernWeave Host Front Door markers.'
    }
    if ($PSCmdlet.ShouldProcess($TargetInstructionFile, "$Action TavernWeave Host Front Door $templateVersion for $AgentHost")) {
        if (-not (Test-Path -LiteralPath $targetParent -PathType Container)) {
            New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
        }
        if ($fileState.Exists) {
            $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
            $suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
            $backupPath = "$TargetInstructionFile.tavernweave-backup-$stamp-$suffix.bak"
            Copy-Item -LiteralPath $TargetInstructionFile -Destination $backupPath
        }
        Write-Utf8File $TargetInstructionFile $proposedText $fileState.HasBom
        $afterFileState = Read-Utf8File $TargetInstructionFile
        $afterState = Get-FrontDoorState $afterFileState
        $expectedAfterStatus = if ($Action -eq 'Install') { 'current' } else { if ($afterFileState.Exists) { 'missing-block' } else { 'missing-file' } }
        if ($afterState.Status -ne $expectedAfterStatus) {
            throw "Host Front Door post-write verification failed: expected $expectedAfterStatus, got $($afterState.Status)"
        }
        $didWrite = $true
    }
}

$finalFileState = if ($Action -in @('Install', 'Remove') -and (Test-Path -LiteralPath $TargetInstructionFile -PathType Leaf)) {
    Read-Utf8File $TargetInstructionFile
} else {
    $fileState
}
$finalState = Get-FrontDoorState $finalFileState
$receipt = [pscustomobject][ordered]@{
    schemaVersion = 1
    host = [string]$hostConfig.displayName
    action = $Action.ToLowerInvariant()
    targetInstructionFile = $TargetInstructionFile
    adapterVersion = $templateVersion
    statusBefore = $frontDoorState.Status
    installedVersionBefore = $frontDoorState.InstalledVersion
    statusAfter = $finalState.Status
    changed = $didWrite
    wouldChange = $changed
    backupPath = $backupPath
    rediscovery = [string]$hostConfig.rediscovery
    guidancePreferenceStatus = [string]$guidanceState.statusAfter
    guidanceLevel = $guidanceState.level
    hostLoading = 'not-verified'
    recommendation = '全局入口负责持续大白话与任务路由；挡位由你选择并单独保存。文件检查后仍需用新任务确认客户端实际加载。'
}

if ($Json) {
    $payload = [ordered]@{ receipt = $receipt }
    if ($Action -eq 'Preview') { $payload.proposedManagedBlock = $templateText }
    Write-Output ($payload | ConvertTo-Json -Depth 6)
} else {
    Write-Output 'TavernWeave 全局入口检查结果'
    Write-Output "Host: $($receipt.host)"
    Write-Output "Action: $($receipt.action)"
    Write-Output "Target: $($receipt.targetInstructionFile)"
    Write-Output "Status: $($receipt.statusBefore) -> $($receipt.statusAfter)"
    Write-Output "Adapter version: $($receipt.adapterVersion)"
    Write-Output "Changed: $($receipt.changed)"
    Write-Output "Backup: $(if ($receipt.backupPath) { $receipt.backupPath } else { 'none' })"
    Write-Output "Rediscovery: $($receipt.rediscovery)"
    Write-Output "引导挡位：$(if ($receipt.guidanceLevel) { $receipt.guidanceLevel } elseif ($receipt.guidancePreferenceStatus -eq 'unset') { '尚未选择' } else { '记录无效，请核对' })"
    Write-Output $receipt.recommendation
    if ($Action -eq 'Preview') {
        Write-Output '--- proposed managed block ---'
        Write-Output $templateText
        Write-Output '--- end proposed managed block ---'
    }
}
