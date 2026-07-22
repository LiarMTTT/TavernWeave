[CmdletBinding()]
param(
    [string]$Python,
    [string]$PluginRoot,
    [string]$CodexHome
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
if (-not $CodexHome) {
    $CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex' }
}

if (-not $Python) { $Python = Join-Path $PluginRoot '.private\venv\Scripts\python.exe' }
if (-not (Test-Path -LiteralPath $Python)) { throw 'Local validation Python is missing. Run scripts/bootstrap-dev.ps1 first.' }

$skillValidator = Join-Path $CodexHome 'skills\.system\skill-creator\scripts\quick_validate.py'
$pluginValidator = Join-Path $CodexHome 'skills\.system\plugin-creator\scripts\validate_plugin.py'
foreach ($validator in @($skillValidator, $pluginValidator)) {
    if (-not (Test-Path -LiteralPath $validator)) { throw "Codex validator not found: $validator" }
}

$oldPythonUtf8 = $env:PYTHONUTF8
try {
    $env:PYTHONUTF8 = '1'
    foreach ($skill in (Get-ChildItem -LiteralPath (Join-Path $PluginRoot 'skills') -Directory | Sort-Object Name)) {
        & $Python $skillValidator $skill.FullName
        if ($LASTEXITCODE -ne 0) { throw "Skill validation failed: $($skill.Name)" }
    }
    & $Python $pluginValidator $PluginRoot
    if ($LASTEXITCODE -ne 0) { throw 'Plugin validation failed.' }
} finally {
    $env:PYTHONUTF8 = $oldPythonUtf8
}

Write-Output 'Official Codex validators passed.'
