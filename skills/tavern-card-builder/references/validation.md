# Validation

## Contents

1. Static chain checks
2. CoT-specific checks
3. Artifact checks
4. Runtime acceptance
5. Handoff report

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
- The primary card type and capability flags are supported by inspected evidence.
- Every runtime dependency has one class and a delivery path; player notices exclude
  development-only tools.
- An MVU Zod card distinguishes its embedded schema, every promised domestic/global
  MVU Zod script, their declared enabled states, remote import targets, and required
  host extension.
- Model-visible text contains no developer-only explanation or secret.

## 2. CoT-specific checks

- A custom CoT can operate in a text card with no MVU, schema, update block, or script.
- The default design can stitch a card increment into an existing preset main CoT.
- The card has not copied the preset's complete CoT.
- Every card-specific rule is a real increment with a target phase, stable purpose,
  output boundary, skip condition, and safe fallback.
- Every step answers a concrete question; no empty “think deeply” or “analyze
  carefully” step remains.
- CoT does not repeat card prose, character identity, setting text, or worldbook
  knowledge.
- Visible character thoughts remain narrative prose and are not treated as evidence
  of system judgment.
- MVU `<analysis>` or update evidence is not treated as the complete CoT.
- Plot/character/NPC/output CoT reaches only the plot model; update rules and update
  output format reach only the update model; intentionally shared facts are recorded.
- Deterministic formulas and derived-variable batches are owned by scripts, while the
  LLM supplies only required semantic source events or states.
- No variable has competing LLM and script writers.
- Multiple conditional modules have stable dependency, ordering, and deduplication
  behavior and cannot redefine the main CoT structure.
- CoT disablement, missing increments, failed stitching, and unavailable scripts have
  explicit safe degradation.
- The assembled Prompt contains no unresolved insertion markers, duplicated rule IDs,
  full-reasoning output demand, or author-only comments.

Use the templates and counterexamples in
[cot-design-and-authoring.md](cot-design-and-authoring.md) for the review.

## 3. Artifact checks

When artifacts exist, delegate to `$sillytavern-card-pipeline` and verify:

- maintained source is the change origin;
- generated JSON matches source contracts;
- PNG embedding preserves the expected payload;
- import/export roundtrip retains entries and extensions;
- every `embedded_required` regex, schema, script, loader, and binding is present with
  the declared enabled state;
- regional alternative groups satisfy the declared selection rule;
- a card-bound or co-delivered worldbook resolves to the card's declared version;
- versions and release notes describe the actual change.

## 4. Runtime acceptance

For runtime-affecting work, verify in real SillyTavern:

- import and new chat;
- every greeting branch involved;
- a no-MVU text card with custom CoT;
- preset main CoT plus card increment, with the assembled result reaching the intended
  plot context exactly once;
- conditional CoT activation, deactivation, simultaneous-module ordering, and
  deduplication;
- plot behavior for a representative single-character case and a group/NPC scheduling
  case;
- safe minimum output when the main CoT, card increment, optional script, or
  conditional module is disabled or unavailable;
- actual stored state and model-visible projection;
- same-generation update: the plot response includes one valid update and sees no
  missing required entry;
- extra update-model pass: the plot model excludes update-only instructions, the
  update model excludes plot-only instructions, shared entries reach both, and one
  valid update is applied without repeating an earlier change;
- keyword/green-light/sticky routing still activates and deactivates the same entries
  under both update modes;
- script registration and cleanup;
- host-required capabilities are installed and enabled;
- selected Git/CDN loaders execute, publish their expected readiness capability, and
  use their declared fallback when the primary path fails;
- UI on target devices and reload paths;
- console errors, network failures, and safe fallback.

Offline HTML or headless checks do not close this gate.

## 5. Handoff report

Separate:

- confirmed static evidence;
- generated but not imported artifacts;
- real-runtime evidence;
- user acceptance still pending;
- assumptions tied to a runtime version or optional extension.
- dependencies already embedded, host setup still required, remote loads, selected
  regional alternative, and development-only exclusions.
