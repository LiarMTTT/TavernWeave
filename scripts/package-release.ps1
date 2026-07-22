[CmdletBinding()]
param(
    [string]$PluginRoot,
    [string]$OutputDirectory,
    [string]$ExpectedVersion
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $PluginRoot 'dist' }
& (Join-Path $PSScriptRoot 'validate-release.ps1') -PluginRoot $PluginRoot

$manifest = Get-Content -LiteralPath (Join-Path $PluginRoot '.codex-plugin\plugin.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($ExpectedVersion -and $manifest.version -ne $ExpectedVersion) {
    throw "Release tag version '$ExpectedVersion' does not match manifest version '$($manifest.version)'."
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$zipPath = Join-Path $OutputDirectory "$($manifest.name)-$($manifest.version).zip"
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath }

$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("tavernweave-release-" + [guid]::NewGuid().ToString('N'))
$pluginStage = Join-Path $staging $manifest.name
New-Item -ItemType Directory -Path $pluginStage -Force | Out-Null
try {
    $trackedFiles = @(git -C $PluginRoot -c core.quotepath=false ls-files)
    if ($LASTEXITCODE -ne 0 -or $trackedFiles.Count -eq 0) { throw 'Release packaging requires a Git repository with tracked files.' }
    $forbiddenTracked = @($trackedFiles | Where-Object {
        $path = $_ -replace '\\', '/'
        $path -match '(^|/)(?:\.private|dist)(/|$)' -or
        $path -match '(^|/)(?:\.env(?:\..*)?|id_rsa|id_ed25519|credentials(?:\..*)?|secrets?(?:\..*)?)$' -or
        $path -match '(?i)\.(?:pem|key|p12|pfx)$'
    })
    if ($forbiddenTracked.Count -gt 0) {
        throw "Release contains forbidden tracked paths: $($forbiddenTracked -join ', ')"
    }
    foreach ($relativePath in $trackedFiles) {
        $sourcePath = Join-Path $PluginRoot ($relativePath -replace '/', '\')
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) { throw "Tracked file is missing: $relativePath" }
        $destinationPath = Join-Path $pluginStage ($relativePath -replace '/', '\')
        New-Item -ItemType Directory -Path (Split-Path -Parent $destinationPath) -Force | Out-Null
        Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
    }
    & (Join-Path $pluginStage 'scripts\validate-release.ps1') -PluginRoot $pluginStage
    Compress-Archive -LiteralPath $pluginStage -DestinationPath $zipPath -CompressionLevel Optimal
    $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath ($zipPath + '.sha256') -Value "$hash  $([System.IO.Path]::GetFileName($zipPath))" -Encoding ascii
} finally {
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
}

Write-Output $zipPath
