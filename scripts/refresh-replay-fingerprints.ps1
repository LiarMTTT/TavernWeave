[CmdletBinding()]
param(
    [Parameter(Mandatory)] [switch]$ConfirmedManualReplay,
    [string]$PluginRoot
)

$ErrorActionPreference = 'Stop'
if (-not $ConfirmedManualReplay) { throw 'Pass -ConfirmedManualReplay only after rerunning every forward and adversarial case.' }
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot)
$resultsPath = Join-Path $PluginRoot 'tests\replay\results.json'
if (-not (Test-Path -LiteralPath $resultsPath -PathType Leaf)) { throw "Replay results not found: $resultsPath" }

function Get-PortableFileHash([string]$Path) {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $hashBytes = $bytes
    try {
        $text = [System.Text.UTF8Encoding]::new($false, $true).GetString($bytes)
        $normalized = $text.Replace("`r`n", "`n").Replace("`r", "`n")
        $hashBytes = [System.Text.UTF8Encoding]::new($false).GetBytes($normalized)
    } catch [System.Text.DecoderFallbackException] {
        # Binary or non-UTF-8 files retain byte-exact fingerprints.
    }
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        return ([System.BitConverter]::ToString($algorithm.ComputeHash($hashBytes))).Replace('-', '').ToLowerInvariant()
    } finally {
        $algorithm.Dispose()
    }
}

function Get-SkillFingerprint([string]$Directory) {
    $directoryFull = [System.IO.Path]::GetFullPath($Directory).TrimEnd([char]92, [char]47)
    [string[]]$relativePaths = @(foreach ($file in (Get-ChildItem -LiteralPath $directoryFull -File -Recurse)) {
        if ($file.FullName -match '[\\/]__pycache__[\\/]' -or $file.Extension -ieq '.pyc') { continue }
        $file.FullName.Substring($directoryFull.Length).TrimStart([char]92, [char]47).Replace([char]92, [char]47)
    })
    [System.Array]::Sort($relativePaths, [System.StringComparer]::Ordinal)
    $rows = foreach ($relative in $relativePaths) {
        $nativeRelative = $relative.Replace([char]47, [System.IO.Path]::DirectorySeparatorChar)
        $hash = Get-PortableFileHash (Join-Path $directoryFull $nativeRelative)
        "$relative`t$hash"
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

$results = Get-Content -LiteralPath $resultsPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($collectionName in @('caseResults', 'adversarialResults')) {
    foreach ($result in @($results.$collectionName)) {
        if ($result.pass -ne $true -or -not [string]$result.evidence) {
            throw "Replay result is not a documented pass: $($result.id)"
        }
    }
}

$fingerprints = [ordered]@{}
foreach ($skill in (Get-ChildItem -LiteralPath (Join-Path $PluginRoot 'skills') -Directory | Sort-Object Name)) {
    $fingerprints[$skill.Name] = Get-SkillFingerprint $skill.FullName
}
$results.skillFingerprints = [pscustomobject]$fingerprints
$results.evaluatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$json = ($results | ConvertTo-Json -Depth 8).Replace("`r`n", "`n").Replace("`r", "`n")
[System.IO.File]::WriteAllText($resultsPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Output $resultsPath
