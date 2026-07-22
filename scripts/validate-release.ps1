[CmdletBinding()]
param(
    [string]$PluginRoot
)

$ErrorActionPreference = 'Stop'
if (-not $PluginRoot) { $PluginRoot = Split-Path -Parent $PSScriptRoot }
$PluginRoot = [System.IO.Path]::GetFullPath($PluginRoot).TrimEnd([char]92, [char]47)
$pluginRootPrefix = $PluginRoot + [System.IO.Path]::DirectorySeparatorChar
$utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
$errors = [System.Collections.Generic.List[string]]::new()

function Add-ValidationError([string]$Message) {
    $errors.Add($Message)
}

function Get-SkillFingerprint([string]$Directory) {
    $directoryFull = [System.IO.Path]::GetFullPath($Directory).TrimEnd([char]92, [char]47)
    $rows = foreach ($file in (Get-ChildItem -LiteralPath $directoryFull -File -Recurse | Sort-Object FullName)) {
        if ($file.FullName -match '[\\/]__pycache__[\\/]' -or $file.Extension -ieq '.pyc') { continue }
        $relative = $file.FullName.Substring($directoryFull.Length).TrimStart([char]92, [char]47).Replace([char]92, [char]47)
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
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

$manifestPath = Join-Path $PluginRoot '.codex-plugin\plugin.json'
if (-not (Test-Path -LiteralPath $manifestPath)) {
    Add-ValidationError "Missing plugin manifest: $manifestPath"
} else {
    try {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($manifest.name -ne 'tavernweave-agent-skills') { Add-ValidationError 'Plugin name does not match the repository folder.' }
        if ($manifest.version -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') { Add-ValidationError 'Plugin version is not valid SemVer.' }
        if ($manifest.license -ne 'PolyForm-Noncommercial-1.0.0') { Add-ValidationError 'Plugin license must remain PolyForm-Noncommercial-1.0.0.' }
    } catch {
        Add-ValidationError "Invalid plugin manifest JSON: $($_.Exception.Message)"
    }
}

$licensePath = Join-Path $PluginRoot 'LICENSE'
if (-not (Test-Path -LiteralPath $licensePath -PathType Leaf)) {
    Add-ValidationError "Missing repository license: $licensePath"
} else {
    $licenseText = Get-Content -LiteralPath $licensePath -Raw -Encoding UTF8
    if ($licenseText -notmatch '(?m)^# PolyForm Noncommercial License 1\.0\.0$' -or
        $licenseText -notmatch '(?m)^Required Notice: Copyright 2026 TavernWeave Maintainers$') {
        Add-ValidationError 'Repository license text or required notice does not match the declared noncommercial license.'
    }
}

$skillRoot = Join-Path $PluginRoot 'skills'
$skillDirs = @(Get-ChildItem -LiteralPath $skillRoot -Directory | Sort-Object Name)
if ($skillDirs.Count -eq 0) { Add-ValidationError 'No skill directories were found.' }

foreach ($skillDir in $skillDirs) {
    $skillPath = Join-Path $skillDir.FullName 'SKILL.md'
    $openAiPath = Join-Path $skillDir.FullName 'agents\openai.yaml'
    if (-not (Test-Path -LiteralPath $skillPath)) {
        Add-ValidationError "Missing SKILL.md: $($skillDir.Name)"
        continue
    }
    $skillText = Get-Content -LiteralPath $skillPath -Raw -Encoding UTF8
    $frontmatterMatch = [regex]::Match($skillText, '\A---\r?\n(?<yaml>.*?)\r?\n---', 'Singleline')
    if (-not $frontmatterMatch.Success) {
        Add-ValidationError "Invalid frontmatter: $($skillDir.Name)"
    } else {
        $keys = @([regex]::Matches($frontmatterMatch.Groups['yaml'].Value, '(?m)^([a-zA-Z0-9_-]+):') | ForEach-Object { $_.Groups[1].Value })
        $unexpected = @($keys | Where-Object { $_ -notin @('name', 'description') })
        if ($unexpected.Count -gt 0) { Add-ValidationError "Unexpected frontmatter keys in $($skillDir.Name): $($unexpected -join ', ')" }
        if ($frontmatterMatch.Groups['yaml'].Value -notmatch "(?m)^name:\s*$([regex]::Escape($skillDir.Name))\s*$") {
            Add-ValidationError "Skill name does not match its folder: $($skillDir.Name)"
        }
    }
    if (-not (Test-Path -LiteralPath $openAiPath)) {
        Add-ValidationError "Missing agents/openai.yaml: $($skillDir.Name)"
    } else {
        $openAiText = Get-Content -LiteralPath $openAiPath -Raw -Encoding UTF8
        if ($openAiText -notmatch [regex]::Escape('$' + $skillDir.Name)) {
            Add-ValidationError "default_prompt does not name `$${skillDir.Name}: $($skillDir.Name)"
        }
    }
    if ($skillText -match '(?i)\bTODO\b|\[TODO:') { Add-ValidationError "TODO marker in $($skillDir.Name)/SKILL.md" }
    $forbiddenDocs = @(Get-ChildItem -LiteralPath $skillDir.FullName -File -Recurse | Where-Object {
        $_.Name -in @('README.md', 'CHANGELOG.md', 'RELEASE.md', 'RELEASE_NOTES.md')
    })
    foreach ($forbiddenDoc in $forbiddenDocs) {
        Add-ValidationError "Repository documentation is not allowed inside a skill package: $($forbiddenDoc.FullName)"
    }
}

$textExtensions = @('.md', '.json', '.yaml', '.yml', '.py', '.ps1', '.mjs', '.js', '.ts', '.css', '.html')
$textFiles = @(Get-ChildItem -LiteralPath $PluginRoot -File -Recurse | Where-Object {
    $_.FullName -notmatch '[\\/](?:\.git|\.private|dist)[\\/]' -and $_.Extension.ToLowerInvariant() -in $textExtensions
})

$publicFiles = @(Get-ChildItem -LiteralPath $PluginRoot -File -Recurse | Where-Object {
    $_.FullName -notmatch '[\\/](?:\.git|\.private|dist)[\\/]'
})
foreach ($file in $publicFiles) {
    $relative = $file.FullName.Substring($PluginRoot.Length).TrimStart([char]92, [char]47).Replace([char]92, [char]47)
    if ($relative -match '(^|/)(?:\.env(?:\..*)?|id_rsa|id_ed25519|credentials(?:\..*)?|secrets?(?:\..*)?)$' -or
        $relative -match '(?i)\.(?:pem|key|p12|pfx)$') {
        Add-ValidationError "Credential-sensitive path is not allowed in a release: $relative"
    }
}

foreach ($file in $textFiles) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $text = $utf8Strict.GetString($bytes)
    } catch {
        Add-ValidationError "Invalid UTF-8: $($file.FullName)"
        continue
    }
    if ($text -match '(?i)-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----') {
        Add-ValidationError "Private key material detected: $($file.FullName)"
    }
    if ($text -match '(?i)(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["''][^"'']{8,}["'']') {
        Add-ValidationError "Credential-shaped literal detected: $($file.FullName)"
    }
    if ($text -match '(?i)[A-Z]:\\Users\\[^\\\s]+\\') {
        Add-ValidationError "Private absolute Windows path detected: $($file.FullName)"
    }
    if ($file.Extension -ieq '.md') {
        foreach ($match in [regex]::Matches($text, '\[[^\]]+\]\((?<target>[^)]+)\)')) {
            $target = $match.Groups['target'].Value.Trim().Trim('<', '>')
            if ($target -match '^(?:https?://|mailto:|codex:|#)') { continue }
            $target = ($target -split '#', 2)[0]
            if (-not $target) { continue }
            try { $target = [System.Uri]::UnescapeDataString($target) } catch { }
            $resolved = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $target))
            if (-not $resolved.StartsWith($pluginRootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                Add-ValidationError "Markdown link escapes plugin root: $($file.FullName) -> $target"
            } elseif (-not (Test-Path -LiteralPath $resolved)) {
                Add-ValidationError "Broken Markdown link: $($file.FullName) -> $target"
            }
        }
    }
}

foreach ($scriptFile in @($publicFiles | Where-Object { $_.Extension -ieq '.ps1' })) {
    $parseTokens = $null
    $parseErrors = $null
    [System.Management.Automation.Language.Parser]::ParseFile($scriptFile.FullName, [ref]$parseTokens, [ref]$parseErrors) | Out-Null
    foreach ($parseError in @($parseErrors)) {
        Add-ValidationError "PowerShell parse error in $($scriptFile.FullName): $($parseError.Message)"
    }
}

$casePath = Join-Path $PluginRoot 'tests\replay\cases.json'
$adversarialPath = Join-Path $PluginRoot 'tests\replay\adversarial-cases.json'
$resultsPath = Join-Path $PluginRoot 'tests\replay\results.json'
if (-not (Test-Path -LiteralPath $casePath -PathType Leaf) -or
    -not (Test-Path -LiteralPath $adversarialPath -PathType Leaf) -or
    -not (Test-Path -LiteralPath $resultsPath -PathType Leaf)) {
    Add-ValidationError 'Replay cases, adversarial cases, and results.json are all required.'
} else {
    try {
        $cases = Get-Content -LiteralPath $casePath -Raw -Encoding UTF8 | ConvertFrom-Json
        $adversarial = Get-Content -LiteralPath $adversarialPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $results = Get-Content -LiteralPath $resultsPath -Raw -Encoding UTF8 | ConvertFrom-Json

        $caseIds = @($cases.cases | ForEach-Object { [string]$_.id })
        $adversarialIds = @($adversarial.cases | ForEach-Object { [string]$_.id })
        if ($caseIds.Count -ne @($caseIds | Sort-Object -Unique).Count) { Add-ValidationError 'Replay case IDs must be unique.' }
        if ($adversarialIds.Count -ne @($adversarialIds | Sort-Object -Unique).Count) { Add-ValidationError 'Adversarial replay IDs must be unique.' }

        $skillNames = @($skillDirs | ForEach-Object { $_.Name })
        $routedSkills = @($cases.cases | ForEach-Object { [string]$_.expectedPrimarySkill } | Sort-Object -Unique)
        foreach ($routedSkill in $routedSkills) {
            if ($routedSkill -notin $skillNames) { Add-ValidationError "Replay case routes to an unknown skill: $routedSkill" }
        }
        foreach ($skillName in $skillNames) {
            if ($skillName -notin $routedSkills) { Add-ValidationError "Skill has no primary forward replay case: $skillName" }
        }

        $caseResultMap = @{}
        foreach ($result in @($results.caseResults)) {
            $id = [string]$result.id
            if ($caseResultMap.ContainsKey($id)) { Add-ValidationError "Duplicate replay result: $id" } else { $caseResultMap[$id] = $result }
        }
        $adversarialResultMap = @{}
        foreach ($result in @($results.adversarialResults)) {
            $id = [string]$result.id
            if ($adversarialResultMap.ContainsKey($id)) { Add-ValidationError "Duplicate adversarial result: $id" } else { $adversarialResultMap[$id] = $result }
        }
        foreach ($id in $caseIds) {
            if (-not $caseResultMap.ContainsKey($id)) {
                Add-ValidationError "Missing forward replay result: $id"
            } elseif ($caseResultMap[$id].pass -ne $true -or -not [string]$caseResultMap[$id].evidence) {
                Add-ValidationError "Forward replay did not pass with evidence: $id"
            }
        }
        foreach ($id in $adversarialIds) {
            if (-not $adversarialResultMap.ContainsKey($id)) {
                Add-ValidationError "Missing adversarial replay result: $id"
            } elseif ($adversarialResultMap[$id].pass -ne $true -or -not [string]$adversarialResultMap[$id].evidence) {
                Add-ValidationError "Adversarial replay did not pass with evidence: $id"
            }
        }
        foreach ($extra in @($caseResultMap.Keys | Where-Object { $_ -notin $caseIds })) { Add-ValidationError "Unknown forward replay result: $extra" }
        foreach ($extra in @($adversarialResultMap.Keys | Where-Object { $_ -notin $adversarialIds })) { Add-ValidationError "Unknown adversarial replay result: $extra" }

        foreach ($skillDir in $skillDirs) {
            $property = $results.skillFingerprints.PSObject.Properties[$skillDir.Name]
            $actualFingerprint = Get-SkillFingerprint $skillDir.FullName
            if (-not $property -or [string]$property.Value -ne $actualFingerprint) {
                Add-ValidationError "Replay evidence is stale for skill: $($skillDir.Name)"
            }
        }
    } catch {
        Add-ValidationError "Invalid replay evidence: $($_.Exception.Message)"
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Output "ERROR: $_" }
    exit 1
}

Write-Output "Validation passed: $($skillDirs.Count) skills, $($textFiles.Count) text files."
