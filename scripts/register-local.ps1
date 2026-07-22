[CmdletBinding()]
param(
    [string]$PluginRoot,
    [string]$MarketplacePath
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot)

$profileRoot = [Environment]::GetFolderPath('UserProfile')
if (-not $MarketplacePath) {
    $MarketplacePath = Join-Path $profileRoot '.agents\plugins\marketplace.json'
}
$MarketplacePath = [System.IO.Path]::GetFullPath($MarketplacePath)

$manifestPath = Join-Path $PluginRoot '.codex-plugin\plugin.json'
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Plugin manifest not found: $manifestPath"
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$expectedPluginPath = Join-Path $profileRoot ("plugins\" + $manifest.name)
if (-not (Test-Path -LiteralPath $expectedPluginPath -PathType Container)) {
    throw "Personal marketplace source is missing. Clone the repository or create a directory junction at: $expectedPluginPath"
}

function Resolve-PluginTarget([string]$Path) {
    $item = Get-Item -LiteralPath $Path
    if ($item.LinkType -and $item.Target) {
        $target = @($item.Target)[0]
        if (-not [System.IO.Path]::IsPathRooted($target)) {
            $target = Join-Path $item.Parent.FullName $target
        }
        return [System.IO.Path]::GetFullPath($target)
    }
    return [System.IO.Path]::GetFullPath($item.FullName)
}

$actualTarget = Resolve-PluginTarget $PluginRoot
$marketplaceTarget = Resolve-PluginTarget $expectedPluginPath
if (-not $actualTarget.Equals($marketplaceTarget, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Personal marketplace path resolves to a different plugin: $expectedPluginPath"
}

if (Test-Path -LiteralPath $MarketplacePath -PathType Leaf) {
    $marketplace = Get-Content -LiteralPath $MarketplacePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $marketplace -or -not $marketplace.PSObject.Properties['name'] -or -not [string]$marketplace.name) {
        throw "Marketplace must contain a non-empty name: $MarketplacePath"
    }
} else {
    $marketplace = [pscustomobject][ordered]@{
        name = 'personal'
        interface = [pscustomobject][ordered]@{ displayName = 'Personal' }
        plugins = @()
    }
}

if (-not $marketplace.PSObject.Properties['plugins']) {
    $marketplace | Add-Member -NotePropertyName plugins -NotePropertyValue @()
}
if ($marketplace.plugins -isnot [System.Array]) {
    throw "Marketplace plugins must be an array: $MarketplacePath"
}

$entry = [pscustomobject][ordered]@{
    name = [string]$manifest.name
    source = [pscustomobject][ordered]@{
        source = 'local'
        path = "./plugins/$($manifest.name)"
    }
    policy = [pscustomobject][ordered]@{
        installation = 'AVAILABLE'
        authentication = 'ON_INSTALL'
    }
    category = 'Developer Tools'
}

$updated = [System.Collections.Generic.List[object]]::new()
$replaced = $false
foreach ($plugin in @($marketplace.plugins)) {
    if ($plugin -and $plugin.PSObject.Properties['name'] -and $plugin.name -eq $manifest.name) {
        if (-not $replaced) { $updated.Add($entry) }
        $replaced = $true
    } else {
        $updated.Add($plugin)
    }
}
if (-not $replaced) { $updated.Add($entry) }
$marketplace.plugins = @($updated)

$marketplaceDirectory = Split-Path -Parent $MarketplacePath
New-Item -ItemType Directory -Path $marketplaceDirectory -Force | Out-Null
$temporaryPath = Join-Path $marketplaceDirectory ('.marketplace-' + [guid]::NewGuid().ToString('N') + '.tmp')
try {
    $json = $marketplace | ConvertTo-Json -Depth 8
    [System.IO.File]::WriteAllText($temporaryPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporaryPath -Destination $MarketplacePath -Force
} finally {
    if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -LiteralPath $temporaryPath -Force }
}

Write-Output "Registered $($manifest.name) in marketplace '$($marketplace.name)'."
Write-Output "Install or refresh with: codex plugin add $($manifest.name)@$($marketplace.name)"
