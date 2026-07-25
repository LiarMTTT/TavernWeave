# Lorebooks and prompts

## Contents

1. Entry boundaries
2. Routing and visibility
3. Import contracts
4. Prompt budget

## 1. Entry boundaries

Give each entry one coherent responsibility. Split always-on protocol, conditional setting knowledge, optional modules, and runtime-generated projections.

Record for each entry:

- stable identifier and human label;
- activation method;
- target model or processing stage;
- ordering/depth constraints;
- whether it is source, generated projection, or optional content.

## 2. Routing and visibility

Prefixes and placement may route content differently depending on the installed prompt/MVU mode. Verify who sees the entry. A variable model that cannot see current state may create duplicates or overwrite valid data; a plot model should not receive low-level mutation rules unless required.

For every model-visible entry, record a recipient ledger for:

- same-generation plot and update;
- plot model in an extra update-model workflow;
- update model in an extra update-model workflow.

Keep activation and routing as separate axes. A routing marker must not be treated as
an always-on switch or as a replacement for keyword, green-light, sticky, depth, or
ordering rules. When the detected MVU zod implementation supports `[mvu_plot]` and
`[mvu_update]`, follow the exact routing matrix in
[variable-systems.md](variable-systems.md) and flag dual markers as ambiguous.

## 3. Import contracts

When producing standalone lorebook JSON, derive its exact schema from an authoritative format definition or a verified local export. Validate entry-key/UID consistency and roundtrip import. Do not assume an export shape from another SillyTavern version.

Packaging and embedded-card attachment belong to `$sillytavern-card-pipeline`.

## 4. Prompt budget

Classify content as:

- always required;
- conditionally required;
- author documentation only;
- runtime/UI data that should never be sent to a model.

For an extra update-model pass, budget the plot and update contexts independently.
Review every unmarked entry as a deliberate duplication into both contexts; keep only
shared state and constraints that both models need.

Deduplicate before shortening. Preserve semantic constraints and remove repeated explanation first.
