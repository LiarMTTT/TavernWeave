[CmdletBinding()]
param(
    [string]$Python = 'python',
    [string]$PluginRoot
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$target = Join-Path $PluginRoot '.private\venv'
if (-not (Test-Path -LiteralPath (Join-Path $target 'Scripts\python.exe'))) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    & $Python -m venv $target
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create the local validation environment.' }
}
$venvPython = Join-Path $target 'Scripts\python.exe'
& $venvPython -m pip install --disable-pip-version-check -r (Join-Path $PluginRoot 'requirements-dev.txt')
if ($LASTEXITCODE -ne 0) { throw 'Failed to install local validation dependencies.' }
Write-Output $venvPython
