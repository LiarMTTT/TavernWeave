# Variable systems

## Contents

1. Capability detection
2. Schema design
3. Initialization
4. Update rules
5. Update-model routing
6. CoT and script boundary
7. Projection and rendering
8. Cleanup and migration

## 1. Capability detection

Identify the actual MVU implementation, command dialect, and model-context modes from installed source, card rules, type declarations, or verified runtime evidence. Do not mix native commands, an MVU JSONPatch dialect, and pure RFC 6902 semantics.

Use `$sillytavern-api-reference` for exact operations and signatures. Preserve the card's current dialect and update mode unless migration is explicitly requested and verified.

## 2. Schema design

- Model state, not event logs.
- Give each field a stable purpose and lifecycle.
- Use records for truly dynamic collections and objects for fixed fields.
- Define how unknown fields behave; silent stripping is data loss unless intended.
- Avoid coercion or partial/union combinations that discard nested input before defaults run.
- Keep keys compatible with the target path parser.
- Treat identifier schemes as project decisions. Do not impose a project-specific prefix/counter convention universally.

Write a field ledger with: path, type, default, writer, reader, renderer, cleanup rule, migration rule, and example.

## 3. Initialization

Separate:

- shared defaults used by every conversation;
- fixed-greeting branch defaults;
- free-form setup collected through normal user interaction;
- migration defaults for older saved state.

Do not delete `<initvar>` or `<UpdateVariable>` from greetings simply because a different project uses another opening strategy. Verify the target implementation first.

## 4. Update rules

- State which operations the detected dialect permits.
- Define when to add, replace, remove, or move data.
- Keep plot prose out of variable rules.
- Include relationship, counter, cleanup, and invariant behavior only when the system actually needs it.
- Avoid full hard-coded output examples that a model may copy verbatim; prefer structural constraints and small non-copyable fragments.

## 5. Update-model routing

Treat the update mode as an authoring contract:

- **same-generation update**: the plot model writes narrative output and the variable
  update command in one generation;
- **extra update-model pass**: one model writes the plot, then a separate model reads
  the result and writes the variable update command.

Do not assume every MVU implementation supports entry-name routing. When the detected
MVU zod runtime documents the `[mvu_plot]` and `[mvu_update]` convention, apply this
matrix:

| Entry name | Same-generation update | Extra update-model pass |
| --- | --- | --- |
| contains `[mvu_plot]` | normal activated entry | plot model only |
| contains `[mvu_update]` | normal activated entry | update model only |
| contains neither marker | normal activated entry | both models |

The marker may occur anywhere in the entry name; do not require it to be a literal
prefix. Routing does not activate an entry: normal disabled, keyword, green-light,
sticky, depth, and ordering behavior still applies first. Treat a name containing both
markers as ambiguous unless the installed implementation explicitly defines it.

For a new dual-compatible card, use this baseline:

- leave the current variable list unmarked only when both models need it;
- mark variable update rules and variable output format with `[mvu_update]`;
- mark plot-only custom CoT, prose, or unrelated output formats with `[mvu_plot]`;
- inventory every unmarked entry and justify why duplicating it into both model
  contexts is necessary.

An unmarked entry is not automatically wrong. It is a shared-context decision with
prompt-budget and information-exposure cost. Do not send plot-specific custom CoT,
style scaffolding, NPC scheduling, or unrelated output formats to the update model
merely for compatibility.

For a retrofit, report the current mode and routing before editing names. Do not add
markers blindly when the installed runtime ignores them or the card intentionally
supports only one mode.

## 6. CoT and script boundary

Custom CoT is not an MVU feature. A text card with no variables can use a complete
custom CoT, and an MVU card still needs separate plot/character reasoning if the
project requires it.

- MVU `<analysis>` or equivalent update evidence only serves variable-update
  decisions; it is not the complete plot, character, NPC, combat, and output CoT.
- Zod defines or validates data structure and has no direct relationship to CoT.
- The plot model receives plot and behavior CoT. An extra update model receives only
  current state, generated plot, update rules, and update output format.
- Let the LLM write semantic source events or source states. Let scripts perform
  deterministic formulas, derived-variable updates, and batch synchronization.
- Assign one writer to every variable. Never let the LLM and a script compete to
  update the same field.

Read [cot-design-and-authoring.md](cot-design-and-authoring.md) for independent CoT
design, update-model separation, and practical LLM/script workload ranges.

## 7. Projection and rendering

The model projection is not the full database. Send only state the model needs for the current turn. Keep routing prefixes compatible with the target prompt pipeline and verify which model receives each entry.

For UI, define a presentation model rather than letting the UI mutate raw state ad hoc. Delegate exact DOM/runtime implementation to `$sillytavern-embedded-ui` and `$sillytavern-api-reference`.

## 8. Cleanup and migration

Specify:

- stale-record retention or archival;
- maximum list sizes where relevant;
- schema-version detection;
- idempotent migrations;
- rollback or safe failure;
- evidence that older conversations remain readable.
