# Render-stage boundary

## Offline stages

The bundled scripts can prove:

- JSON structure and field types;
- regex compilation under the current Node runtime;
- declared enabled, placement/source, destination, and depth eligibility;
- deterministic JavaScript replacement output;
- expected versus actual fixture results;
- the exact rule order supplied to the runner.

## Host-only stages

Keep these pending until real SillyTavern acceptance:

- macro and variable substitution before or after regex execution;
- the installed runtime's numeric placement mapping;
- Markdown conversion and message formatting;
- prompt assembly, world-info scanning, and reasoning surfaces;
- `trimStrings` internals and other undocumented normalization;
- global, preset, and character regex merge order;
- edit, swipe, reload, chat-switch, and streaming lifecycle;
- extension-specific iframe or helper behavior.

## Fixture format

Use:

```json
{
  "schemaVersion": 1,
  "cases": [
    {
      "id": "display-ai-depth-0",
      "input": "<status>ready</status>",
      "source": "ai_output",
      "placement": 2,
      "destination": "display",
      "depth": 0,
      "expected": "ready"
    }
  ]
}
```

For the card dialect, `placement` is required. For the helper dialect, `source` is
required. `destination` is always `display` or `prompt`. Omit `expected` only for a
trace-only case.

## Disagreement protocol

When host output differs, preserve the fixture and collect the exact imported JSON,
installed versions, message-floor identity, source, destination, depth, rule order,
and console evidence. Update the offline contract only from verified behavior; never
patch fixtures merely to match a surprising output.
