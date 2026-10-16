# Lorebooks and prompts

## Contents

1. Core component and entry boundaries
2. Adopted authoring configuration
3. Keyword reliability and state handoff
4. Routing and visibility
5. Conditional CoT modules and preset stitching
6. Body/configuration pairs and import contracts
7. Prompt budget
8. Verification and local-change boundaries

## 1. Core component and entry boundaries

An opening and a lorebook remain required core components for `text`, `mvu_zod` and
`hybrid` cards. The builder owns how setting, character material, author rules and
variable content fit the whole card. New cards normally use the worldbook as their
main content carrier; effective inherited prompt fields stay until their change is
authorized.

Independent worldbook work and the detailed entry method now belong to
[worldbook-design-and-writing](../../worldbook-design-and-writing/SKILL.md):
[scope and size](../../worldbook-design-and-writing/references/planning-and-loading.md#1-scope-size-and-authority),
[configuration and native foundations](../../worldbook-design-and-writing/references/planning-and-loading.md#3-native-foundations-and-preserved-tw-policy),
and [body writing](../../worldbook-design-and-writing/references/writing-contracts.md).
Use the same Content map and creative/state authorities; do not maintain two plans.
This reference retains core-character activation, recipient routing and CoT stitching.

### Model-facing body and processed source

The compatible destination is [model-facing body and processed source](../../worldbook-design-and-writing/references/writing-contracts.md#model-facing-body-and-processed-source).
Keep its source/processing/input distinction when integrating the card; necessary
syntax is not prose decoration and model input is not author documentation.

## 2. Adopted authoring configuration

General worldbook configuration has one authority in the linked worldbook reference.
The following core-character policy remains a TW builder authoring requirement, not
an assertion that the host enforces one universal design.

### Character count and activation

Determine the number of independently defined **core characters**, separately from
`text` / `mvu_zod` / `hybrid`. A single character split into ten profile entries remains
a single-character card; supporting NPCs do not automatically change the core count.

| Character scope | Required baseline |
|---|---|
| One core character | All entries containing that core character's profile use blue/constant activation, even when split by topic |
| Multiple core characters | A concise character overview uses blue/constant activation; each character's detailed profile entries use green/keyword activation |

These rules concern core profile entries. Do not turn the entire worldbook green just
because the card has multiple characters; common world foundations, variable protocols,
and other responsibilities need their own activation decisions. A conditional stage
payload loaded by a verified controller is a separate delivery mechanism: record its
ownership, conditions, and loading evidence rather than quietly treating it as an
ordinary profile or claiming a routing marker overrides the baseline.
Use this delivery class only where the project already explicitly adopted or authorized
it. Do not relabel an ordinary profile as a payload or invent a controller to evade the
single-character blue / multiple-character green requirements.

Blue means constant activation strategy, not proof of delivery. Enabled state, budget,
recipient routing, and other relevant host filters still require verification. Green
cannot see a future keyword: an overview containing names must not be assumed to
activate all profile details in the same generation.

### Keyword scan depth and recursion

Follow the [preserved worldbook policy](../../worldbook-design-and-writing/references/planning-and-loading.md#3-native-foundations-and-preserved-tw-policy):
effective keyword scan depth 2 and both directions of native recursion disabled.
This legacy heading is a navigation point, not another configurable default.

### Placement, order, and other controls

General placement and controls use the same worldbook authority. For a new card,
a concise core-character overview can start before character definitions and profile
details after them; activation still follows the single/multiple-character policy
above. Preserve an inherited card's proven placement and effective prompt fields.
Variable protocols/controllers use their verified implementation's required placement.
Do not infer a universal numerical order recipe or execution order from these roles.

An independent character clarification is optional: first consider improving the
source entry. A separate brief instruction is warranted only by a specific author-
identified or evidenced misreading with its own purpose; see
[character-review-and-correction.md](character-review-and-correction.md). It cannot
add facts, prescribe every response, advance a stage or silently override a conflicting
foundation. Profile clarifications retain the single-/multiple-core activation policy;
stage-specific ones retain their stage conditions. Keep diagnostic history outside
model-visible entries and review duplicates or obsolete clarifications.

## 3. Keyword reliability and state handoff

Use the worldbook owner's [native scene checks and state/loading choices](../../worldbook-design-and-writing/references/planning-and-loading.md#3-native-foundations-and-preserved-tw-policy)
for first use, continued scene, departure and collision. State design remains in
[variable-systems.md](variable-systems.md); return its approved fields and reader to
the same entry plan. No second mutable state or unapproved type migration is created.

For state-selected character differences, read [character-stages.md](character-stages.md).
Retain the foundation, select only applicable differences, and keep activation,
conditional content and recipient routing separate. An unmet keyword cannot be
repaired merely by making the inner stage condition true. Reuse proven controllers
only within their existing adoption and the agreed recursion policy.

## 4. Routing and visibility

Prefixes and placement may route content differently depending on the installed
prompt/MVU mode. Verify who sees the entry. An update model without current state can
duplicate or overwrite valid data; a plot model does not need low-level mutation rules
unless its responsibility requires them.

For every model-visible entry, record a recipient ledger for:

- same-generation plot and update;
- plot model in an extra update-model workflow;
- update model in an extra update-model workflow.

Keep activation and routing separate. A routing marker is not an always-on switch or
a replacement for keywords, scan settings, sticky behaviour, placement, or ordering.
When the detected MVU Zod implementation supports `[mvu_plot]` and `[mvu_update]`, use
the exact routing matrix in [variable-systems.md](variable-systems.md); flag dual markers
as ambiguous. Model-visible knowledge is not character omniscience: preserve each
person/group's access, degree, basis, mistaken beliefs, and outdated knowledge from
[worldbook knowledge boundaries](../../worldbook-design-and-writing/references/writing-contracts.md#4-facts-knowledge-and-degrees-of-awareness).

## 5. Conditional CoT modules and preset stitching

Use a worldbook CoT module only when its judgment is conditional. Declare one
responsibility, target main-CoT phase, stable rule IDs, activation/skip conditions,
recipient model, dependencies, and output boundary.

```text
preset main CoT phase
+ always-on card increment for that phase
+ currently activated conditional modules
```

Do not copy the complete preset CoT into every entry or let a conditional module
redefine the main phase order. Deduplicate by rule ID and meaning, order dependencies
first, then use stable project priority or module IDs for ties. If the environment
cannot stitch reliably, maintain fragments as sources and generate one complete
fallback prompt with source versions and skip conditions; do not maintain a second
independent CoT by hand. Read [cot-design-and-authoring.md](cot-design-and-authoring.md).
Custom CoT is an author-written decision protocol, not access to hidden model reasoning.

## 6. Body/configuration pairs and import contracts

Use the worldbook owner's [pairing and scoped delivery contract](../../worldbook-design-and-writing/references/planning-and-loading.md#7-pair-validate-and-deliver-the-changed-scope).
Keep stable IDs, unknown fields, unrelated content and the verified source format.
Packaging and release remain with `$sillytavern-card-pipeline`; a design worksheet is
not an import schema. This heading remains for existing callers.

## 7. Prompt budget

The worldbook owner's [state and mixed-path boundaries](../../worldbook-design-and-writing/references/planning-and-loading.md#6-state-and-mixed-path-boundaries)
link to the performance authority for global deduplication and budget. At whole-card
level, budget plot and extra update-model contexts independently. Treat every shared
or unmarked entry as deliberate potential duplication; retain only the shared state
and constraints both recipients need. Budget preset main CoT, card increments and
conditional modules separately. A budget does not authorize changing core-profile
activation policy or deleting semantic conditions and author-confirmed facts.

## 8. Verification and local-change boundaries

Use the worldbook owner's scoped checks and the whole-card [validation](validation.md)
gate. Verify the core-character policy and recipient ledger here; check openings
against world facts and initialization, plus cross-system ownership for hybrid cards.
A file/schema check proves neither imported settings nor model delivery. Keep offline,
real-request, model-behavior, author-acceptance and publication evidence separate.
Local fixes preserve unrelated decisions and do not authorize installation or release.
