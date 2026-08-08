# Static performance budget contract

## Input boundary

Measure an assembled UTF-8 rolecard JSON file. Use the exact same surface and script
version for candidate and baseline. The metrics are structural indicators; they do
not predict browser frame time or model latency by themselves.

## Stable metrics

| Metric | Meaning |
| --- | --- |
| `fileBytes` | Raw UTF-8 bytes of the JSON file. |
| `stringBytes` | Sum of UTF-8 bytes in all JSON string values. |
| `maxStringBytes` | Largest single string value, with a redacted JSON path. |
| `embeddedDataBytes` | Decoded bytes of base64 data-URI values. |
| `promptBytes` | Strings under known prompt-bearing field names. |
| `worldbookEntries` / `worldbookBytes` | Discovered character-book/worldbook entries and their content. |
| `regexCount` / `regexBytes` | Regex records and pattern/replacement bytes. |
| `helperScriptCount` / `helperScriptBytes` | Tavern Helper script records and content bytes. |
| `remoteUrlCount` | HTTP(S) URL occurrences, without returning the URLs. |

The walker counts duplicate payloads wherever they appear. That is deliberate: a
duplicated top-level extension surface still costs bytes even if its semantics match
`data.extensions`.

## Budget file

```json
{
  "schemaVersion": 1,
  "limits": {
    "fileBytes": 20000000,
    "maxStringBytes": 12000000
  },
  "maxGrowth": {
    "fileBytes": 500000,
    "promptBytes": 0
  }
}
```

`limits` are absolute ceilings. `maxGrowth` allows a candidate-minus-baseline delta.
Every key must name a numeric metric emitted by the measurement script. Negative
growth is allowed; a missing baseline blocks any `maxGrowth` check.

## Optimization boundary

Do not delete or merge worldbook entries, prompt text, scripts, regexes, media, or
extension surfaces merely because they are large. First prove ownership and semantic
redundancy. Prefer reversible changes such as deduplicated packaging, lazy media,
component splitting, or reduced rerender scope. Re-run the actual card pipeline and
semantic gates after any accepted change.
