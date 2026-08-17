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

$manifest = $null
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

$claudeManifest = $null
$claudeManifestPath = Join-Path $PluginRoot '.claude-plugin\plugin.json'
if (-not (Test-Path -LiteralPath $claudeManifestPath -PathType Leaf)) {
    Add-ValidationError "Missing Claude Code plugin manifest: $claudeManifestPath"
} else {
    try {
        $claudeManifest = Get-Content -LiteralPath $claudeManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($claudeManifest.name -ne 'tavernweave-agent-skills') { Add-ValidationError 'Claude Code plugin name must match the Codex plugin name.' }
        if ($claudeManifest.author.name -ne 'LiarMTTT') { Add-ValidationError 'Claude Code plugin author must be LiarMTTT.' }
        if ($claudeManifest.license -ne 'PolyForm-Noncommercial-1.0.0') { Add-ValidationError 'Claude Code plugin license must remain PolyForm-Noncommercial-1.0.0.' }
        if ($manifest -and $claudeManifest.name -ne $manifest.name) { Add-ValidationError 'Codex and Claude Code plugin names do not match.' }
        if ($manifest -and $claudeManifest.version -ne $manifest.version) { Add-ValidationError 'Codex and Claude Code plugin versions do not match.' }
        if ($manifest -and $claudeManifest.license -ne $manifest.license) { Add-ValidationError 'Codex and Claude Code plugin licenses do not match.' }
    } catch {
        Add-ValidationError "Invalid Claude Code plugin manifest JSON: $($_.Exception.Message)"
    }
}

$claudeMarketplacePath = Join-Path $PluginRoot '.claude-plugin\marketplace.json'
if (-not (Test-Path -LiteralPath $claudeMarketplacePath -PathType Leaf)) {
    Add-ValidationError "Missing Claude Code marketplace manifest: $claudeMarketplacePath"
} else {
    try {
        $claudeMarketplace = Get-Content -LiteralPath $claudeMarketplacePath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($claudeMarketplace.name -ne 'tavernweave') { Add-ValidationError 'Claude Code marketplace name must be tavernweave.' }
        if ($claudeMarketplace.owner.name -ne 'LiarMTTT') { Add-ValidationError 'Claude Code marketplace owner must be LiarMTTT.' }
        $claudeEntries = @($claudeMarketplace.plugins | Where-Object { $_.name -eq 'tavernweave-agent-skills' })
        if ($claudeEntries.Count -ne 1) {
            Add-ValidationError 'Claude Code marketplace must contain exactly one TavernWeave plugin entry.'
        } else {
            $claudeSource = $claudeEntries[0].source
            if ($claudeSource.source -ne 'github' -or $claudeSource.repo -ne 'LiarMTTT/TavernWeave') {
                Add-ValidationError 'Claude Code marketplace source must point to LiarMTTT/TavernWeave on GitHub.'
            }
        }
    } catch {
        Add-ValidationError "Invalid Claude Code marketplace JSON: $($_.Exception.Message)"
    }
}

$licensePath = Join-Path $PluginRoot 'LICENSE'
if (-not (Test-Path -LiteralPath $licensePath -PathType Leaf)) {
    Add-ValidationError "Missing repository license: $licensePath"
} else {
    $licenseText = Get-Content -LiteralPath $licensePath -Raw -Encoding UTF8
    if ($licenseText -notmatch '(?m)^# PolyForm Noncommercial License 1\.0\.0$' -or
        $licenseText -notmatch '(?m)^Required Notice: Copyright 2026 LiarMTTT$') {
        Add-ValidationError 'Repository license text or required notice does not match the declared noncommercial license.'
    }
}

$skillRoot = Join-Path $PluginRoot 'skills'
$skillDirs = @(Get-ChildItem -LiteralPath $skillRoot -Directory | Sort-Object Name)
if ($skillDirs.Count -eq 0) { Add-ValidationError 'No skill directories were found.' }

$installManifest = $null
$installManifestPath = Join-Path $PluginRoot 'tavernweave-install-manifest.json'
if (-not (Test-Path -LiteralPath $installManifestPath -PathType Leaf)) {
    Add-ValidationError "Missing installation manifest: $installManifestPath"
} else {
    try {
        $installManifest = Get-Content -LiteralPath $installManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $installSkills = @($installManifest.skills | ForEach-Object { [string]$_ })
        $sourceSkills = @($skillDirs | ForEach-Object { $_.Name })
        if ($installManifest.schemaVersion -ne 2) { Add-ValidationError 'Installation manifest schemaVersion must be 2.' }
        if ($installManifest.package -ne 'tavernweave-agent-skills') { Add-ValidationError 'Installation manifest package name is invalid.' }
        if ($manifest -and $installManifest.version -ne $manifest.version) { Add-ValidationError 'Installation manifest and Codex manifest versions do not match.' }
        if ($claudeManifest -and $installManifest.version -ne $claudeManifest.version) { Add-ValidationError 'Installation manifest and Claude manifest versions do not match.' }
        if ([int]$installManifest.skillCount -ne $installSkills.Count) { Add-ValidationError 'Installation manifest skillCount does not match its skills array.' }
        if ($installSkills.Count -ne @($installSkills | Sort-Object -Unique).Count) { Add-ValidationError 'Installation manifest contains duplicate skill names.' }
        if (($installSkills -join "`n") -ne (($installSkills | Sort-Object) -join "`n")) { Add-ValidationError 'Installation manifest skills must remain sorted.' }
        if ((($installSkills | Sort-Object) -join "`n") -ne (($sourceSkills | Sort-Object) -join "`n")) { Add-ValidationError 'Installation manifest skill names do not exactly match the source skill directories.' }
        if ($installManifest.hostRediscovery -ne 'required-new-task') { Add-ValidationError 'Installation manifest must keep host rediscovery as a separate new-task gate.' }
        if (-not $installManifest.hostFrontDoor -or $installManifest.hostFrontDoor.version -ne $installManifest.version) { Add-ValidationError 'Host Front Door version must match the installation manifest.' }
        if ($installManifest.hostFrontDoor.recommended -ne $true) { Add-ValidationError 'Host Front Door must remain an explicit recommended install choice.' }
        if ($installManifest.hostFrontDoor.dshSupport -ne 'preview-preset-only') { Add-ValidationError 'DSH Host Front Door support must remain preview-preset-only.' }

        $requiredInstallPaths = @(
            'skills/activate-tavernweave-soul/SKILL.md',
            'skills/consult-tavernweave-library/SKILL.md',
            'skills/consult-tavernweave-library/assets/picker/index.html'
        )
        $declaredRequiredPaths = @($installManifest.requiredPaths | ForEach-Object { [string]$_ })
        foreach ($requiredInstallPath in $requiredInstallPaths) {
            if ($requiredInstallPath -notin $declaredRequiredPaths) { Add-ValidationError "Installation manifest omits a v1 hard gate: $requiredInstallPath" }
        }
        foreach ($requiredInstallPath in $declaredRequiredPaths) {
            $nativePath = $requiredInstallPath.Replace([char]47, [System.IO.Path]::DirectorySeparatorChar)
            $resolvedPath = [System.IO.Path]::GetFullPath((Join-Path $PluginRoot $nativePath))
            if (-not $resolvedPath.StartsWith($pluginRootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                Add-ValidationError "Installation manifest path escapes plugin root: $requiredInstallPath"
            } elseif (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
                Add-ValidationError "Installation manifest required path is missing: $requiredInstallPath"
            }
        }
        foreach ($requiredSourcePathValue in @($installManifest.hostFrontDoor.requiredSourcePaths)) {
            $requiredSourcePath = [string]$requiredSourcePathValue
            $nativePath = $requiredSourcePath.Replace([char]47, [System.IO.Path]::DirectorySeparatorChar)
            $resolvedPath = [System.IO.Path]::GetFullPath((Join-Path $PluginRoot $nativePath))
            if (-not $resolvedPath.StartsWith($pluginRootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                Add-ValidationError "Host Front Door source path escapes plugin root: $requiredSourcePath"
            } elseif (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
                Add-ValidationError "Host Front Door source path is missing: $requiredSourcePath"
            }
        }
        foreach ($dshPathValue in @($installManifest.dshPreview.contract, $installManifest.dshPreview.fullPreset, $installManifest.dshPreview.entryPreset)) {
            $dshPath = [string]$dshPathValue
            $resolvedDshPath = [System.IO.Path]::GetFullPath((Join-Path $PluginRoot ($dshPath.Replace([char]47, [System.IO.Path]::DirectorySeparatorChar))))
            if (-not $resolvedDshPath.StartsWith($pluginRootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $resolvedDshPath -PathType Leaf)) {
                Add-ValidationError "DSH Preview source path is missing or unsafe: $dshPath"
            }
        }
    } catch {
        Add-ValidationError "Invalid installation manifest: $($_.Exception.Message)"
    }
}

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
    if ($relative -match '(?i)(^|/)(?:logs?|development-logs?|debug-output|debug-artifacts|run-logs?)(/|$)' -or
        $relative -match '(?i)\.(?:log|trace|har|cpuprofile|heapsnapshot)$') {
        Add-ValidationError "Development log or debug artifact is not allowed in a release: $relative"
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
        $markdownForLinks = [regex]::Replace($text, '(?ms)^```.*?^```\s*$', '')
        $markdownForLinks = [regex]::Replace($markdownForLinks, '`[^`\r\n]*`', '')
        foreach ($match in [regex]::Matches($markdownForLinks, '\[[^\]]+\]\((?<target>[^)]+)\)')) {
            $target = $match.Groups['target'].Value.Trim().Trim('<', '>')
            if ($target -match '^(?:https?://|mailto:|codex:|#)') { continue }
            $target = ($target -split '#', 2)[0]
            if (-not $target) { continue }
            try { $target = [System.Uri]::UnescapeDataString($target) } catch { }
            try {
                $resolved = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $target))
            } catch {
                Add-ValidationError "Invalid Markdown link target: $($file.FullName) -> $target"
                continue
            }
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

$installGateTest = Join-Path $PluginRoot 'tests\install-gate.test.ps1'
if (-not (Test-Path -LiteralPath $installGateTest -PathType Leaf)) {
    Add-ValidationError 'Installation gate test is missing.'
} else {
    try {
        $installGateOutput = @(& $installGateTest -PluginRoot $PluginRoot 2>&1)
    } catch {
        Add-ValidationError "Installation gate test failed: $($_.Exception.Message)"
    }
}

$hostFrontDoorTest = Join-Path $PluginRoot 'tests\host-front-door.test.ps1'
if (-not (Test-Path -LiteralPath $hostFrontDoorTest -PathType Leaf)) {
    Add-ValidationError 'Host Front Door test is missing.'
} else {
    try {
        $hostFrontDoorOutput = @(& $hostFrontDoorTest -PluginRoot $PluginRoot 2>&1)
    } catch {
        Add-ValidationError "Host Front Door test failed: $($_.Exception.Message)"
    }
}

$nodeFiles = @($publicFiles | Where-Object { $_.Extension -iin @('.js', '.mjs') })
$nodeTests = @($nodeFiles | Where-Object { $_.FullName -match '[\\/]tests[\\/].*\.test\.mjs$' })
if ($nodeFiles.Count -gt 0) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        Add-ValidationError 'Node.js is required to validate JavaScript files.'
    } else {
        foreach ($nodeFile in $nodeFiles) {
            $nodeCheckOutput = @(& $nodeCommand.Source --check $nodeFile.FullName 2>&1)
            if ($LASTEXITCODE -ne 0) {
                Add-ValidationError "Node syntax error in $($nodeFile.FullName): $($nodeCheckOutput -join ' ')"
            }
        }
        foreach ($nodeTest in $nodeTests) {
            # Execute each test file directly. `node --test` spawns workers and is not
            # available in every Windows sandbox, while direct execution retains the
            # built-in node:test assertions and exit status.
            $nodeTestOutput = @(& $nodeCommand.Source $nodeTest.FullName 2>&1)
            if ($LASTEXITCODE -ne 0) {
                Add-ValidationError "Node test failed in $($nodeTest.FullName): $($nodeTestOutput -join ' ')"
            }
        }

        $libraryValidator = Join-Path $PluginRoot 'skills\consult-tavernweave-library\scripts\validate-library.mjs'
        if (-not (Test-Path -LiteralPath $libraryValidator -PathType Leaf)) {
            Add-ValidationError 'TavernWeave Library validator is missing.'
        } else {
            $libraryOutput = @(& $nodeCommand.Source $libraryValidator 2>&1)
            if ($LASTEXITCODE -ne 0) {
                Add-ValidationError "TavernWeave Library validation failed: $($libraryOutput -join ' ')"
            }
        }

        $routeSource = Join-Path $PluginRoot 'skills\consult-tavernweave-library\references\route-map.json'
        $routeDocs = Join-Path $PluginRoot 'docs\newbie-guide\tavernweave-route-map.json'
        if (-not (Test-Path -LiteralPath $routeSource -PathType Leaf) -or -not (Test-Path -LiteralPath $routeDocs -PathType Leaf)) {
            Add-ValidationError 'Library and newbie-guide route maps are both required.'
        } elseif ((Get-PortableFileHash $routeSource) -ne (Get-PortableFileHash $routeDocs)) {
            Add-ValidationError 'Newbie-guide route map is stale; run scripts/sync-library-route-map.mjs.'
        }

        $pickerRoot = Join-Path $PluginRoot 'skills\consult-tavernweave-library\assets\picker'
        foreach ($pickerFile in @('index.html', 'picker.css', 'picker.js', 'catalog.json', 'catalog-data.js', 'manifest-data.js')) {
            if (-not (Test-Path -LiteralPath (Join-Path $pickerRoot $pickerFile) -PathType Leaf)) {
                Add-ValidationError "Picker asset missing: $pickerFile"
            }
        }
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
