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

An opening and a lorebook are required core components for `text`, `mvu_zod`, and
`hybrid` cards. The lorebook is the main carrier of character, world, and authoring
rules, plus required variable-related content when applicable. Traditional character
prompt fields should remain empty where possible on new cards; preserve effective
uses in inherited cards rather than clearing them automatically.

Before new worldbook design or material redesign, follow the player-confirmed
**小型 / 中型 / 大型** size step in [worldbuilding-design.md](worldbuilding-design.md).
Explain the subsequent compact-body, foundation/detail, or scope/entry/loading work.
Reuse an explicit existing decision; do not restart a world interview for a narrow fix.

Give each entry one coherent responsibility. Separate common setting, independently
needed details, character profiles, author instructions, variable protocols, optional
modules, and runtime-generated state projections. Split by what is needed together,
not by arbitrary file length. Use the existing creative authority as the fact/decision
source and the existing variable contract as the state authority.

Record each entry's stable identifier and human label, body source, responsibility,
content boundary, activation method, recipient model or processing stage, placement
constraints, dependencies, and source/generated/optional status. For a CoT module, also
record its target phase and stable rule IDs. Each body must be understandable with its
stated common foundation; a title or keyword list must not supply missing prose facts.

### Model-facing body and processed source

Keep in model-facing worldbook content only what the receiving model needs for its
intended understanding, portrayal or execution. A rule the model actually follows is
useful content. Author design rationale and maintenance history belong in maintained
author material, not in the body merely to explain the workshop's choices. Do not add
script blocks or other commentary with no role for the recipient.

Distinguish the maintained entry source, any established template processing, and the
assembled model input. Necessary EJS, macros and conditional source can select or
generate the body. Preserve working syntax and conditions; do not delete them under
the label of prose cleanup, expose secrets by removing a guard, or assume that raw
script belongs in the final input. Retain only code actually required by the verified
processing or by the receiving model's task. If its role is unknown during a narrow
edit, preserve it and check that role before removal. Exact template capabilities use
the API reference; assembled prompt evidence belongs to runtime verification.

Apply the [Chinese prose review](../../rewrite-natural-prose/references/natural-chinese-review.md)
when authoring or refining the body. Remove unnecessary semantic triads even when
joined with conjunctions or split across sentences. Remove repeated defensive
explanation without deleting real applicability conditions or uncertain knowledge.
This authoring self-review neither activates continuous rewriting nor authorizes
changes to existing activation settings or scripts.

## 2. Adopted authoring configuration

The following are TW authoring requirements for this workflow, not claims that the host
enforces one universal design. Keep them distinct from version-dependent field names.

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

- Effective keyword scan depth is **2**. Set an explicit per-entry value where the
  verified target format supports it, or document a verified inherited value of 2.
  An unknown inherited value does not satisfy the requirement.
- All entries, whether blue, green, disabled, or explicitly loaded, disable both
  directions of recursive activation: they are not activated by other entries'
  recursive text and do not activate further entries through that text.
- A blue or explicitly loaded entry may not use keyword matching; record that fact
  without suggesting scan depth controls its activation. Where a dormant keyword
  setting exists, keep it at 2 so later changes cannot silently inherit another value.
- Do not raise scan depth or enable recursion as an automatic repair for missed content.
  Diagnose keywords, split boundaries, and actual state-dependent loading needs.

Do not change global host settings without authorization just to satisfy a card's
configuration. Explain unsupported per-entry capability or conflicting inherited
settings and keep the unresolved delivery gap visible.

### Placement, order, and other controls

Keyword **scan depth** is not prompt **insertion depth**. `2` does not mean D2. World
facts are not automatically D0, and rule importance does not select an insertion order.
Preserve a project's proven placement and order unless the scoped change requires
otherwise. For a new card, use this recommended starting layout and explain material
departures; it is not a requirement to rearrange an inherited card:

| Content responsibility | Recommended starting position | Activation |
|---|---|---|
| World foundations, general mechanisms, necessary background | Before character definitions | Blue for facts needed throughout play; decide independent details separately |
| Core-character overview | Before character definitions | Blue |
| Core-character profile details | After character definitions | One core character: blue; multiple: green |
| Location, item, event, supporting-NPC details | After character definitions | Usually green, according to the actual responsibility |
| Necessary brief instructions that directly guide generated behaviour | At depth 0, system role | According to responsibility and the adopted core-profile policy |
| Variable protocols and state controllers | Placement required by the verified implementation | According to that implementation and the adopted activation policy |

Macro setting versus concrete detail describes content responsibility, not the player's
小型 / 中型 / 大型 choice. Empty traditional card fields do not eliminate the worldbook
insertion positions; check the preset and assembled prompt. D0/system is a starting
recommendation for brief direct guidance, not a claim of strongest model compliance.
Do not put all setting facts or all rules at D0, or ban other depths. An independent
character clarification is optional: first consider improving the source entry;
use a separate brief instruction only for a specific author-identified or evidenced
misreading with an independent purpose. Follow
[character-review-and-correction.md](character-review-and-correction.md). It cannot
add character facts, prescribe every response, advance a stage or silently override
a contradictory foundation. Profile-related clarifications follow the adopted
single-/multiple-core-character activation policy; stage-specific clarification has
the same applicability conditions as its stage. Keep the diagnostic history outside
model-visible entries and review duplicates or obsolete clarification.

Give a concrete order, using examples rather than mandatory numeric ranges. A
before-definition example is world outline 1, background 2-3, character overview 4.
Leave gaps for additions; assign distinct values when the relative order matters.
Do not mandate core profiles at 99 or supporting NPCs/controllers at 100. Order can
also affect budget selection, so inspect the actual assembled order and omissions;
it is neither a semantic conflict resolver nor proof of controller execution order.

Probability, sticky, and cooldown are normally unused. Recommend them only on an
explicit author request or an identified special need; a recommendation is not an
instruction to enable them. For normal new cards, do not add random omission or timed
activation behaviour, and verify that the effective configuration stays deterministic.
Preserve deliberately configured values in inherited cards. For delay, groups, filters,
and controller-driven activation, preserve existing choices and document their effect;
do not invent controls to mask a loading defect. Resolve semantic conflicts in the text.
Exact fields and semantics belong to `$sillytavern-api-reference`. Local source-preserving
edits can use the existing verified representation without demanding an unknown host
version for an unrelated content change. New export/API/runtime claims require evidence.

## 3. Keyword reliability and state handoff

Use formal names, unambiguous nicknames, and stable context terms. Do not add broad words
such as "city", "home", or "work" merely to trigger more often. Share a key only when
the resulting entries are deliberately needed together. In an editor that accepts a
comma-separated key field, use its supported delimiter; exported/source formats may
instead require arrays or another verified representation. These are different formats.

Check at least these scenes with scan depth 2 and recursion disabled:

1. First introduction: the object has not appeared in the scanned messages yet.
2. Continued presence: play remains there but its name is no longer in the scan window.
3. Departure: old details should no longer be sent merely because an old anchor exists.
4. Collision: a shared name, alias, quoted mention, or broad key triggers irrelevant details.

Use a minimal common foundation for a safe first mention, natural opening/input anchors
when appropriate, or a separately designed state-based loader when essential details
must be available before a keyword appears. Do not force repetitive prose just to keep
keywords alive or promise automatic same-turn profile loading from an overview.

When actual location, participants, permissions, or stage must select information:

```text
world requirement -> required state and consumer -> variable contract
-> entry condition / explicit loader -> recipient -> assembled prompt evidence
```

Hand the requirement internally to [variable-systems.md](variable-systems.md), then
return the approved field paths, update/hold rules, missing-value behaviour, and reader
to the entry design. Use `$sillytavern-api-reference` for the selected API and
`$sillytavern-runtime-debug` for execution evidence. Do not require the player to copy
material to another workshop, invent an EJS call from memory, create a second mutable
state source, or silently migrate a text card to MVU Zod. A required migration or new
runtime remains an explicit design decision.

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
[worldbuilding-design.md](worldbuilding-design.md).

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

Deliver each body with an unambiguous paired configuration, linked by its stable ID or
source identity. The body contains only appropriate model-visible content. The pair
specifies enabled state, activation, keywords, effective scan depth, both recursion
directions, placement/order, applicable insertion depth/role, other relevant controls,
recipient, dependencies, and values deliberately preserved from the source. Configuration
explanations, author decisions, and developer notes do not belong in the body.

Use [worldbook-design.md](../assets/templates/worldbook-design.md) as an optional design
worksheet, not importable JSON. Distinguish authoring YAML/Markdown, editor labels,
helper API objects, standalone worldbook exports, and embedded card exports. Do not
rename fields across formats by analogy. A value can be explicitly not applicable;
an unknown value must be marked unresolved rather than made up.

For standalone JSON, derive the exact schema from an authoritative format definition
or a verified local export. Check entry-key/UID consistency and roundtrip import. Preserve
stable IDs, unknown fields, and unrelated content when editing an existing format; do
not rebuild the entire file from this worksheet. Attachment, packaging, and release
belong to `$sillytavern-card-pipeline` and need their own scope.

## 7. Prompt budget

Classify content as always required, conditionally required, author documentation only,
or runtime/UI data that should never reach a model. Keep the common foundation small;
do not duplicate all details in an overview. Character blue/green policy does not excuse
unbounded content, and a budget does not silently authorize changing that policy.

For an extra update-model pass, budget plot and update contexts independently. Treat
every unmarked entry as deliberate potential duplication; keep only shared state and
constraints that both models need. Budget preset main CoT, card increments, and active
conditional modules separately. Deduplicate before shortening, preserving semantic
constraints, knowledge boundaries, and author-confirmed facts.

## 8. Verification and local-change boundaries

Check body/configuration pairing, correct character scope, effective scan depth 2,
both recursion directions disabled, stable identity, no unknown-field loss, and clear
state ownership. Compare opening and world facts with the applicable initialization.
Review first-use, continued-scene, departure, and collision cases. For dual-model cards,
check each recipient separately; for hybrid cards, also check cross-system responsibility.

Keep source/offline checks, imported settings, real assembled prompts, model behaviour,
human acceptance, and publication distinct. A schema check proves neither an imported
setting nor content received by a model. If prompt or runtime evidence is unavailable,
state the gap. A narrow fix must preserve unrelated decisions and the project's current
sources; it does not authorize a global worldbook rewrite, installation, or publication.
