---
name: sillytavern-rolecard-performance
description: >-
  Measure, compare, and gate large SillyTavern rolecards using deterministic size,
  prompt, worldbook, regex, helper-script, embedded-media, and captured runtime
  budgets. Use when Codex needs a performance audit, regression baseline, release
  budget, or smallest optimization plan without silently deleting card behavior.
---

# SillyTavern Rolecard Performance

Use `$consult-tavernweave-library` with the `sillytavern-rolecard-performance` route for A0, the large-card guide, and motion/performance references when writing. Keep library advice, static metrics, browser samples, and real SillyTavern evidence as distinct gates.

Turn “the card feels heavy” into reproducible static metrics and separately captured
runtime evidence. Do not optimize by deleting content before ownership is known.

## Establish the artifact and baseline

Resolve the manifest-selected rolecard JSON and its maintained component sources.
Record exact file identity, version, byte size, and approved baseline. If the only
artifact is PNG, use the existing card pipeline to extract or identify its payload;
do not treat the image container size as JSON structure evidence.

Read [static-budget-contract.md](references/static-budget-contract.md) before setting
thresholds. Read [runtime-sampling.md](references/runtime-sampling.md) when browser or
SillyTavern timings are available.

## Measure without exposing content

Run:

```powershell
node scripts/measure-rolecard-performance.mjs --card candidate.json --out candidate-report.json
```

The report contains counts, byte totals, and metric paths only. It must not echo
prompt text, scripts, URLs, data URIs, or embedded media.

Measure the approved baseline with the same script version and input surface. Avoid
comparing a source component tree with an assembled card unless the budget explicitly
defines that cross-surface comparison.

## Apply declared budgets

Run:

```powershell
node scripts/check-performance-budget.mjs --report candidate-report.json --budget budget.json --baseline baseline-report.json
```

Block hard-limit violations and growth beyond declared deltas. A baseline is not a
waiver: a metric over its hard limit remains a failure even when it did not grow.

## Validate captured runtime samples

Use `scripts/validate-runtime-sample.mjs` only on timings captured from a named real
environment. Keep first render, swipe/edit rerender, chat switch, control-center open,
and media activation as separate scenarios. Never manufacture samples from static
file size or Node execution time.

## Diagnose ownership before optimization

Map every large surface to its owner: prompt fields, worldbook entries, regexes,
helper scripts, embedded assets, remote loaders, duplicate card payloads, or host UI.
Propose the smallest reversible change and state its semantic risk. Preserve stable
IDs, bindings, ordering, activation rules, fallbacks, and unknown fields.

Route component-only changes to `sillytavern-component-update`; route rebuilt cards to
`sillytavern-card-pipeline`; route live jank or lifecycle defects to
`sillytavern-runtime-debug`.

## Report

Report candidate and baseline identities, metric deltas, hard-limit failures, runtime
sample environment, suspected owners, proposed smallest changes, and open real-host
acceptance gates.

## Resources

- [static-budget-contract.md](references/static-budget-contract.md): stable metrics,
  baseline policy, and optimization boundaries.
- [runtime-sampling.md](references/runtime-sampling.md): captured scenario format and
  percentile policy.
- `scripts/measure-rolecard-performance.mjs`: redacted structural measurement.
- `scripts/check-performance-budget.mjs`: limits and regression comparison.
- `scripts/validate-runtime-sample.mjs`: captured percentile gate.
