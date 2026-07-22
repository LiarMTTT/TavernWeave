# Variable systems

## Contents

1. Capability detection
2. Schema design
3. Initialization
4. Update rules
5. Projection and rendering
6. Cleanup and migration

## 1. Capability detection

Identify the actual MVU implementation and command dialect from installed source, card rules, type declarations, or verified runtime evidence. Do not mix native commands, an MVU JSONPatch dialect, and pure RFC 6902 semantics.

Use `$sillytavern-api-reference` for exact operations and signatures. Preserve the card's current dialect unless migration is explicitly requested and verified.

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

## 5. Projection and rendering

The model projection is not the full database. Send only state the model needs for the current turn. Keep routing prefixes compatible with the target prompt pipeline and verify which model receives each entry.

For UI, define a presentation model rather than letting the UI mutate raw state ad hoc. Delegate exact DOM/runtime implementation to `$sillytavern-embedded-ui` and `$sillytavern-api-reference`.

## 6. Cleanup and migration

Specify:

- stale-record retention or archival;
- maximum list sizes where relevant;
- schema-version detection;
- idempotent migrations;
- rollback or safe failure;
- evidence that older conversations remain readable.
