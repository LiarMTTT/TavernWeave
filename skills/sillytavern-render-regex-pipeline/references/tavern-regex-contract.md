# Tavern regex contract

## Supported dialects

Card dialect uses camel-case `RegexScriptData` fields:

```text
id, scriptName, findRegex, replaceString, trimStrings, placement,
disabled, markdownOnly, promptOnly, runOnEdit, substituteRegex,
minDepth, maxDepth
```

Tavern Helper dialect uses snake-case `TavernRegex` fields:

```text
id, script_name, enabled, find_regex, replace_string, trim_strings,
source, destination, run_on_edit, min_depth, max_depth
```

`source` contains boolean `user_input`, `ai_output`, `slash_command`, and
`world_info` keys. `destination` contains boolean `display` and `prompt` keys.

## Eligibility

Evaluate in this order:

1. enabled or disabled;
2. source boolean or exact numeric placement supplied by the fixture;
3. display, prompt, or card-only raw-message stage;
4. inclusive minimum and maximum depth when present;
5. pattern compilation;
6. replacement.

For the card dialect, treat `markdownOnly` and `promptOnly` as three-state inputs:
missing, `false`, or `true`. Missing means the source artifact did not declare the
flag; do not normalize it silently. They enable separate stages using the host's OR
condition:

| `markdownOnly` | `promptOnly` | Eligible fixture destinations |
| --- | --- | --- |
| false or absent | false or absent | `raw` |
| true | false or absent | `display` |
| false or absent | true | `prompt` |
| true | true | `display`, `prompt` |

`raw` means the card regex call before display/prompt processing, with neither host
stage flag set. A fixture tests one call; it does not automatically run an earlier
raw transformation before a display or prompt case. The helper dialect exposes
only `display` and `prompt`, so do not use `raw` in helper or mixed-dialect batches.
This stage mapping follows the official
[SillyTavern regex engine](https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/extensions/regex/engine.js)
checked on 2026-10-13. Recheck the installed target version before claiming host
acceptance.

Numeric placement mappings are version-sensitive. A fixture must provide the exact
numeric placement it intends to test; the runner does not translate labels to codes.

## Pattern rules

Accept a JavaScript literal such as `/pattern/gis` or a raw source string. Preserve
flags. The replacement must be a string; empty and intentional whitespace strings
are valid and are not trimmed. Reject duplicate or invalid flags and failed compilation. The offline runner
uses JavaScript `RegExp` replacement semantics; it does not reproduce every
SillyTavern preprocessing step.

## Depth

Depth bounds are inclusive. Null or absent means unbounded. Reject a minimum greater
than a maximum. When the fixture omits depth, record the depth stage as untested
instead of treating it as zero.

## Preservation

Unknown fields are warnings, not automatic deletions. Keep original order because
host execution order can be observable.
