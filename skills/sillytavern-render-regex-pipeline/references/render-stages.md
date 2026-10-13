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

## Message-page integration

For message content pages, follow the owning UI
[content protocol](../../sillytavern-embedded-ui/references/message-content-ui.md).
Record the model-facing output rule, source boundary, mount transformation and
parser/display mapping separately. An expected replacement string does not prove
that the parser assigned fields correctly, preserved surrounding prose, or rendered
the intended page. Do not treat an authoring worksheet as model-facing content.

Select relevant cases for missing or incomplete boundaries, repeated items,
delimiter-like text, and content outside the page region. Keep raw input and the
declared stage visible in the fixture; do not pre-format input to hide a mismatch.
Incomplete streaming content and final-message content may need different expected
behavior under the adopted protocol. Host lifecycle and actual prompt delivery
remain unverified until their separate runtime check.

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

For the card dialect, integer `placement` is required. For the helper dialect,
non-empty string `source` is required. A mixed rule batch requires both selectors.
Unknown supplied selectors are traced as unmatched; missing selectors are invalid
fixtures and cannot pass by leaving the input unchanged.

`destination` is `display` or `prompt`; card-only batches also accept `raw` for the
raw-message call. See the [flag table](tavern-regex-contract.md#eligibility). Each
case tests one declared stage, without simulating earlier message processing.

If `expected` is present it must be a string, including an empty string where useful.
Omit it only for a trace-only case. Those cases return `status: "trace-only"` and
`pass: null`, contribute to `traceOnly`, and never inflate `passed`. Invalid cases
return `status: "invalid"`, count as failed, and do not execute replacements.
Both execution and trace commands exit unsuccessfully for invalid input or failed
assertions. Depth may be absent or null when untested; a supplied value is an integer.

## Disagreement protocol

When host output differs, preserve the fixture and collect the exact imported JSON,
installed versions, message-floor identity, source, destination, depth, rule order,
and console evidence. Update the offline contract only from verified behavior; never
patch fixtures merely to match a surprising output.
