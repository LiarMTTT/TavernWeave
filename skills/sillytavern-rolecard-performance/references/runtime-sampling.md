# Runtime sampling contract

## Capture in the real target

Collect samples from the intended SillyTavern version, browser, device, card build,
enabled extensions, theme, and chat size. Warmup behavior can differ from steady
state; label it rather than mixing it silently into one distribution.

Use separate scenarios for:

- initial card/chat render;
- message edit rerender;
- swipe rerender;
- chat switch;
- control-center or embedded UI open;
- media or Live2D activation.

## Sample file

```json
{
  "schemaVersion": 1,
  "environment": {
    "sillytavern": "1.18.0",
    "browser": "Chromium",
    "device": "named test device",
    "cardHash": "sha256"
  },
  "scenarios": [
    {
      "id": "first-render",
      "samplesMs": [120, 135, 128, 140, 131],
      "budgetP95Ms": 180
    }
  ]
}
```

Require at least five finite, non-negative samples per scenario. The validator reports
nearest-rank p50 and p95 plus maximum. It does not collect timings and cannot verify
that the capture method was correct.

## Acceptance

Static budgets and runtime scenarios are independent gates. Passing one never closes
the other. When performance differs between environments, retain both reports and
investigate extension set, browser acceleration, chat size, streaming frequency,
media cache, and lifecycle behavior before changing the card.
