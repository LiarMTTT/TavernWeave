[CmdletBinding()]
param(
    [Parameter(Mandatory)] [hashtable]$Sources,
    [string]$PluginRoot,
    [ValidatePattern('^[A-Za-z0-9._-]+\.json$')] [string]$OutputName = 'source-baseline.json'
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$records = foreach ($name in ($Sources.Keys | Sort-Object)) {
    $root = [System.IO.Path]::GetFullPath([string]$Sources[$name])
    if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Source not found: $name" }
    foreach ($file in (Get-ChildItem -LiteralPath $root -File -Recurse | Sort-Object FullName)) {
        [pscustomobject]@{
            source = $name
            relativePath = $file.FullName.Substring($root.Length).TrimStart('\', '/') -replace '\\', '/'
            sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            size = $file.Length
        }
    }
}

$privateDir = Join-Path $PluginRoot '.private'
New-Item -ItemType Directory -Path $privateDir -Force | Out-Null
$outputPath = Join-Path $privateDir $OutputName
$json = $records | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($outputPath, $json, [System.Text.UTF8Encoding]::new($false))
Write-Output $outputPath
