# Lorebooks and prompts

## Contents

1. Entry boundaries
2. Routing and visibility
3. Conditional CoT modules and preset stitching
4. Import contracts
5. Prompt budget

## 1. Entry boundaries

Give each entry one coherent responsibility. Split always-on protocol, conditional setting knowledge, optional modules, and runtime-generated projections.

Record for each entry:

- stable identifier and human label;
- activation method;
- target model or processing stage;
- ordering/depth constraints;
- target CoT phase and stable rule IDs when the entry is a CoT module;
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

## 3. Conditional CoT modules and preset stitching

Use a worldbook CoT module only when its judgment is conditional. A module should
declare one responsibility, its target main-CoT phase, stable rule IDs, activation and
skip conditions, recipient model, dependencies, and output boundary.

The default assembly is:

```text
preset main CoT phase
+ always-on card increment for that phase
+ currently activated conditional modules
```

Do not place the full preset CoT in every card or worldbook entry. Do not let a
conditional entry redefine the main phase order. Deduplicate by rule ID and meaning,
then order dependencies first and use a stable project priority or module ID for ties.

When an environment cannot stitch fragments reliably, keep the fragments as
maintained sources and generate one complete fallback Prompt. A fallback should carry
source versions and explicit skip conditions; it should not become a second manually
maintained CoT.

Depth, ordering, key activation, green-light, sticky behavior, prompt injection, and
model visibility are runtime-specific. Verify exact fields and semantics through
`$sillytavern-api-reference`; this document defines an authoring contract, not a
SillyTavern API.

Read [cot-design-and-authoring.md](cot-design-and-authoring.md) for module contracts,
templates, sorting, deduplication, and fallback.

## 4. Import contracts

When producing standalone lorebook JSON, derive its exact schema from an authoritative format definition or a verified local export. Validate entry-key/UID consistency and roundtrip import. Do not assume an export shape from another SillyTavern version.

Packaging and embedded-card attachment belong to `$sillytavern-card-pipeline`.

## 5. Prompt budget

Classify content as:

- always required;
- conditionally required;
- author documentation only;
- runtime/UI data that should never be sent to a model.

For an extra update-model pass, budget the plot and update contexts independently.
Review every unmarked entry as a deliberate duplication into both contexts; keep only
shared state and constraints that both models need.

Budget preset main CoT, card increments, and currently active conditional modules as
separate sources. Deduplicate before shortening. Preserve semantic constraints and
remove repeated explanation first.
