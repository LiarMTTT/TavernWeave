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
3. display or prompt destination;
4. inclusive minimum and maximum depth when present;
5. pattern compilation;
6. replacement.

For the card dialect, treat `markdownOnly` and `promptOnly` as three-state inputs:
missing, `false`, or `true`. Missing means the source artifact did not declare the
flag; do not normalize it silently. Both flags `true` are contradictory and block the
fixture run. Both false or missing allow both destinations in the offline subset.

Numeric placement mappings are version-sensitive. A fixture must provide the exact
numeric placement it intends to test; the runner does not translate labels to codes.

## Pattern rules

Accept a JavaScript literal such as `/pattern/gis` or a raw source string. Preserve
flags. Reject duplicate or invalid flags and failed compilation. The offline runner
uses JavaScript `RegExp` replacement semantics; it does not reproduce every
SillyTavern preprocessing step.

## Depth

Depth bounds are inclusive. Null or absent means unbounded. Reject a minimum greater
than a maximum. When the fixture omits depth, record the depth stage as untested
instead of treating it as zero.

## Preservation

Unknown fields are warnings, not automatic deletions. Keep original order because
host execution order can be observable.
