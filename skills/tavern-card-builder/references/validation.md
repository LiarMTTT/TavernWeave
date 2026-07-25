# Validation

## Contents

1. Static chain checks
2. Artifact checks
3. Runtime acceptance
4. Handoff report

## 1. Static chain checks

- Every state field has an owner and lifecycle.
- Schema, initialization, updates, projection, UI requirements, cleanup, and examples agree.
- Lorebook routing reaches the intended model/stage in every supported update mode.
- The recipient ledger accounts for plot-only, update-only, and intentionally shared
  entries; no entry contains both routing markers without a verified runtime rule.
- Routing markers do not bypass normal worldbook activation, depth, stickiness, or
  ordering.
- Fixed greetings and dynamic setup use the selected opening strategy.
- Regex and script requirements name failure behavior and idempotence.
- Model-visible text contains no developer-only explanation or secret.

## 2. Artifact checks

When artifacts exist, delegate to `$sillytavern-card-pipeline` and verify:

- maintained source is the change origin;
- generated JSON matches source contracts;
- PNG embedding preserves the expected payload;
- import/export roundtrip retains entries and extensions;
- a card-bound or co-delivered worldbook resolves to the card's declared version;
- versions and release notes describe the actual change.

## 3. Runtime acceptance

For runtime-affecting work, verify in real SillyTavern:

- import and new chat;
- every greeting branch involved;
- actual stored state and model-visible projection;
- same-generation update: the plot response includes one valid update and sees no
  missing required entry;
- extra update-model pass: the plot model excludes update-only instructions, the
  update model excludes plot-only instructions, shared entries reach both, and one
  valid update is applied without repeating an earlier change;
- keyword/green-light/sticky routing still activates and deactivates the same entries
  under both update modes;
- script registration and cleanup;
- UI on target devices and reload paths;
- console errors, network failures, and safe fallback.

Offline HTML or headless checks do not close this gate.

## 4. Handoff report

Separate:

- confirmed static evidence;
- generated but not imported artifacts;
- real-runtime evidence;
- user acceptance still pending;
- assumptions tied to a runtime version or optional extension.
