---
name: sillytavern-render-regex-pipeline
description: >-
  Validate and trace SillyTavern regex behavior with deterministic fixtures across
  source placement, display/prompt or card-only raw stage, depth, enabled state, and optional
  boolean flags. Use when authoring or debugging character-local Tavern regex JSON,
  comparing card and Tavern Helper regex dialects, reproducing a replacement outside
  the host, or explaining which render stage accepted or skipped a rule. Do not treat
  the offline runner as proof of the installed SillyTavern engine.
---

# SillyTavern Render Regex Pipeline

<!-- tw-guidance-entry:begin -->
## Shared communication

Apply [TW plain-language and guidance rules](../consult-tavernweave-library/references/communication-and-guidance.md): explain terms on first use, keep the user-selected 新人/入门/熟练/老手 level, and still explain needed changes and bugs at every level. Soul and prose modes never disable this baseline.
<!-- tw-guidance-entry:end -->

<!-- tw-plugin-runtime-entry:begin -->
## Plugin runtime

When this Skill runs through a plugin, cloud host, or remote machine, read [the plugin execution contract](../consult-tavernweave-library/references/plugin-runtime.md) at entry and apply its host, tool, and persistence checks before host-specific commands. Keep this Skill's scope, authorization, and acceptance gates.
<!-- tw-plugin-runtime-entry:end -->

Before changing a regex, use `$consult-tavernweave-library` with the `sillytavern-render-regex-pipeline` route to load A0 plus the render/regex guides. Preserve the route receipt and keep those guides separate from exact host-version evidence.

Turn regex behavior into an explicit, replayable stage trace. Separate structural
validation from offline replacement and real-host acceptance.

## Resolve the dialect and target

1. Identify the installed SillyTavern and Tavern Helper versions when available.
2. Classify the rule as card `RegexScriptData` camel case or Tavern Helper
   `TavernRegex` snake case.
3. Preserve the original artifact and run fixtures against a copy.
4. Read [tavern-regex-contract.md](references/tavern-regex-contract.md) for fields and
   tri-state rules. Read [render-stages.md](references/render-stages.md) before
   claiming stage equivalence.

Use `$sillytavern-api-reference` for exact target-version behavior. Do not translate
numeric placement codes from memory.

## Validate before executing

```text
node <skill-root>/scripts/validate-tavern-regex.mjs regex.json
```

Block invalid JSON, missing IDs, duplicate IDs, invalid depth ranges, or un-compilable
patterns. Empty or whitespace-only replacement strings are valid and kept verbatim.
`markdownOnly` and `promptOnly` can both be true; each enables its corresponding
stage. Both false or absent select the raw-message stage. Report deprecated or
unknown fields without deleting them.

## Run deterministic fixtures

Define every fixture with string input, the selector required by its dialect, and a
destination. Card rules require integer `placement`; helper rules require `source`;
mixed sets require both. Supply depth when testing its bounds and a string `expected`
for an assertion. Omitting `expected` makes a trace-only case, reported separately
from passed assertions. Then run:

```text
node <skill-root>/scripts/run-regex-fixtures.mjs --regex regex.json --fixtures fixtures.json
```

The runner evaluates only declared eligibility and JavaScript replacement semantics.
It does not emulate macro expansion, Markdown rendering, prompt assembly, trim-string
internals, extension order outside the supplied list, or undocumented host behavior.

## Trace the stages

```text
node <skill-root>/scripts/trace-render-pipeline.mjs --regex regex.json --fixtures fixtures.json
```

Keep the trace ordered as:

```text
input -> enabled -> source/placement -> destination -> depth -> pattern -> output
```

When an offline result and SillyTavern disagree, treat the host as authoritative and
record the installed versions, exact imported rule, floor, source, destination, and
console evidence through `$sillytavern-runtime-debug`.

## Report

State the dialect, target versions, fixture pass count, skipped stages, unsupported
semantics, and remaining real-host checks.

## Resources

- `scripts/validate-tavern-regex.mjs`: validate card and helper regex structures.
- `scripts/run-regex-fixtures.mjs`: run deterministic replacement fixtures.
- `scripts/trace-render-pipeline.mjs`: emit a stage-by-stage JSON trace.
- `references/tavern-regex-contract.md`: field and flag contracts.
- `references/render-stages.md`: offline-versus-host stage boundary.
