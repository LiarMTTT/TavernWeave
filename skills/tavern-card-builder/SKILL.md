---
name: tavern-card-builder
description: Plan and author SillyTavern text, MVU Zod, and hybrid cards with required greetings and worldbooks, character design, player profiles and agency, optional character stages, portrayal diagnosis and corrections, worldbuilding, variables, and prompt routing. Use for new or inherited cards, standalone rolecard prompt rules, opening style, small in-card creative pieces, author-facing assessment, character material, worldbuilding, state systems, and field tracing. Route independent worldbook design and writing, packaging, exact APIs, live debugging, embedded UI implementation, and workshop infrastructure to their owning skills.
---

# Tavern Card Builder

<!-- tw-guidance-entry:begin -->
## Shared communication

Apply [TW plain-language and guidance rules](../consult-tavernweave-library/references/communication-and-guidance.md): explain terms on first use, keep the user-selected 新人/入门/熟练/老手 level, and still explain needed changes and bugs at every level. Soul and prose modes never disable this baseline.
<!-- tw-guidance-entry:end -->

<!-- tw-plugin-runtime-entry:begin -->
## Plugin runtime

When this Skill runs through a plugin, cloud host, or remote machine, read [the plugin execution contract](../consult-tavernweave-library/references/plugin-runtime.md) at entry and apply its host, tool, and persistence checks before host-specific commands. Keep this Skill's scope, authorization, and acceptance gates.
<!-- tw-plugin-runtime-entry:end -->

Decide what the card should portray and how its parts work together. Keep those authoring decisions here; use the relevant specialist for engineering work.

This authoring convention has three primary types: `text`, `mvu_zod`, and `hybrid`.
Every completed card needs a usable greeting and a usable worldbook. New cards
normally leave the traditional description, personality, scenario, dialogue-example,
system-prompt and post-history-instruction fields empty; maintain the main content
in the worldbook. These are TW authoring choices, not claims that SillyTavern has
removed those fields. Inspect their existing purpose before changing an inherited
card. The type, component and legacy-MVU rules are in
[card-types-and-runtime-dependencies.md](references/card-types-and-runtime-dependencies.md).

Before a write-capable design, use `$consult-tavernweave-library` with the `tavern-card-builder` route so A0 and the smallest matching ST guides are actually read. Keep the route receipt with the project authority; a bundled database that was not routed and read is not evidence.

Bundled ST guides are dated technical snapshots. Use this skill's current references
for the adopted authoring convention; do not import a snapshot's unconditional Zod
provider, registration wrapper, fixed depth/order or mandatory runtime recipe into a
different target. Report contradictions and verify actual APIs/versions through
`$sillytavern-api-reference`. Preserve the user's explicit decisions and an inherited
card's authorized scope; do not rewrite the historical guide to make it appear current.

For a new or long-running card, establish the resumable creative authority in [creative-authority.md](references/creative-authority.md) before producing large prose. For source novels, notes, chats, or research, add the chain in [material-provenance.md](references/material-provenance.md). For persistent knowledge, state, narrative recall, or creator-profile requests, keep the four stores separate using [memory-architecture.md](references/memory-architecture.md).

## Start with the target

For “接手一张卡 / 二创 / 继续更新别人留下的卡”, start with the inherited-card path in [retrofit-and-text-cards.md](references/retrofit-and-text-cards.md). Explain the actual card before proposing changes; distinguish continuation from a derivative work, preserve the user's chosen anchors, and plan one first modification plus a second iteration. A PNG/JSON export does not prove maintained authoring sources exist. Resume existing confirmed decisions instead of reopening them.

1. Read repository instructions and inspect the existing card before proposing a design.
2. Identify the target SillyTavern, Tavern Helper, prompt-template, and MVU implementations or versions when behavior depends on them.
3. Record the target primary type and the capabilities actually detected in the card
   and maintained source separately. A legacy `mvu` label does not prove Zod support
   or authorize migration. Build a runtime dependency ledger before deciding what the user
   must install, what the card must embed, and what loads remotely. Read
   [card-types-and-runtime-dependencies.md](references/card-types-and-runtime-dependencies.md).
4. Before new worldbook design, ask the player to choose 小型, 中型, or 大型 and
   explain the corresponding next work. Reuse an explicit confirmed choice. Read
   [worldbook scope and size](../worldbook-design-and-writing/references/planning-and-loading.md#1-scope-size-and-authority); a narrow repair or
   read-only review does not restart a full design interview.
5. Independently decide whether the card needs a custom CoT, whether a reusable main
   CoT already exists in the preset, which card-specific increments are required, and
   which modules should activate conditionally. Do not make this decision depend on
   whether the card uses MVU.
6. For MVU state, identify whether updates share the plot generation or use an
   extra update-model pass. For a new MVU Zod card whose runtime supports entry
   routing, prefer a dual-compatible layout; preserve an existing card's current mode
   unless migration is explicitly authorized.
7. Record unresolved version-sensitive claims as assumptions and keep a real-runtime acceptance gate.

For the complete authoring sequence, read [authoring-workflow.md](references/authoring-workflow.md).

For character work, load only the relevant reference: [character design](references/character-design.md)
for creating or organizing portrayable material, [player profiles and agency](references/player-profile-and-agency.md)
for player facts and scoped delegation, [character stages](references/character-stages.md)
for state-selected differences, and [portrayal review and correction](references/character-review-and-correction.md)
for diagnosing an unsatisfactory portrayal or clarifying a specific misreading.
These are responsibilities, not five mandatory entries or new card types. Use the
[optional worksheet](assets/templates/character-design.md) only when it helps, linking
the existing creative authority, variable contract and acceptance records.
Match the request's editing, collaborative ideation or delegated-creation scope.
Do not impose a four-part dossier, fixed personality palette, three-face system,
stage engine or corrective entry on every character. Preserve effective inherited
structures. Player facts do not authorize impersonation; stage readers and portrayal
corrections do not write state. Runtime symptoms still belong to the runtime specialist.

For a short chat-only character, prose or rolecard-rule request, inspect the relevant supplied material
and deliver the requested draft, explanation or diagnosis with only applicable
decisions and limitations. Do not require a whole-card inventory, runtime version,
world-size interview or all handoff fields for a narrow task that does not redesign
those parts. Existing fact, player-agency and authorization boundaries still apply.

For standalone rolecard prompt rules or creative restrictions, load
[standalone author rules](../worldbook-design-and-writing/references/writing-contracts.md#standalone-author-rules).
Use its six semantic checks internally; preserve the author's strength and confirmed
exceptions. Deliver only the requested rule body for a chat-only request. Pair body
and configuration only when authoring an actual worldbook entry. This path does not
turn ordinary article-style requests or real-world rule explanations into card work;
exact API and runtime tasks retain their specialist owners.

For independent worldbook planning, body writing, configuration or read-only review,
use [worldbook-design-and-writing](../worldbook-design-and-writing/SKILL.md). It owns
scene/loading choices, entry boundaries, knowledge/prose contracts and paired configuration.
Keep whole-card Content map and final delivery here. Use
[worldbuilding-design.md](references/worldbuilding-design.md) for world creation and
[lorebook-and-prompts.md](references/lorebook-and-prompts.md) for core-character
activation, model routing and CoT stitching. Local edits preserve stable IDs, unknown
fields and unrelated settings. Worldbook mixing does not redefine card runtime types.

For opening style and first drafts, read [opening-strategies.md](references/opening-strategies.md).
For a small in-card scene, plot event, item or relationship fragment, use
[card-writing.md](references/card-writing.md) at the scope requested. Delegated
creative work permits active proposals and implementation of ordinary creative choices;
do not turn it into a form for the author to fill. Completed prose uses
[natural Chinese review](../rewrite-natural-prose/references/natural-chinese-review.md)
as an authoring quality check. This does not enable a persistent rewriting mode.

For an author-facing card or worldbook assessment, read the scope/status and report
sections in [validation.md](references/validation.md), then select relevant specialist
checks. Distinguish absent required content from material not supplied for review.
Keep a review read-only unless the task also authorizes changes.

## Build the contract before prose

For every system, write down:

- its source of truth;
- fields and defaults;
- writer, reader, renderer, and cleanup owner;
- initialization and migration behavior;
- model-visible instructions;
- runtime dependency class, delivery, enabled policy, and failure behavior;
- verification evidence.

For custom CoT, trace:

```text
main CoT phases -> card increments -> conditional modules -> recipient model
                -> assembled prompt -> output boundary -> fallback -> acceptance
```

Use stable phase and rule IDs in authoring sources. Deduplicate by meaning as well as
by ID. A card increment should add card-specific conditions, exceptions, or narrower
constraints instead of copying the preset's complete CoT.

For MVU state, trace every field through:

```text
schema -> initialization -> update rules -> model projection -> runtime reader
       -> renderer -> write-back -> cleanup/migration -> examples/tests
```

Do not add a field that has no consumer or lifecycle. Read [variable-systems.md](references/variable-systems.md) before writing schemas, update rules, or MVU model-routing prefixes.

## Select the opening strategy

Do not treat all openings as one protocol:

- Use shared initialization plus per-greeting initialization for fixed first-message or alternate-greeting branches.
- Use a real user opening message for free-form or multi-step setup that must trigger the normal plot/update chain.
- Never use a helper script to impersonate an MVU initialization event merely to make an opening appear initialized.

Read [opening-strategies.md](references/opening-strategies.md) before adding or removing `<initvar>`, `<UpdateVariable>`, or opening-wizard behavior.

## Separate authoring layers

Keep these layers distinct even when one card ships them together:

- card identity and narrative prose;
- custom CoT and card-specific CoT increments;
- lorebook and prompt routing;
- persistent variable protocol;
- regex transformations;
- runtime scripts and APIs;
- embedded UI;
- modular source library;
- build and release artifacts.

Use the focused skills when a task crosses the authoring boundary:

- `$sillytavern-card-components` for safe decomposition, registry/recipe work, and source roundtrips;
- `$sillytavern-card-pipeline` for assembly, validation, JSON/PNG packaging, and release gates;
- `$sillytavern-api-reference` for exact signatures, events, macros, and version-sensitive runtime facts;
- `$sillytavern-runtime-debug` for evidence from a real SillyTavern session;
- `$sillytavern-embedded-ui` for message content pages, opening pages, status bars, control centers, and dialogs;
- `$rolecard-workshop-ops` for publishing infrastructure.
- `$rewrite-natural-prose` for requested prose refinement or an already enabled rewriting mode; refine creative handoffs within that mode while preserving canon and protected technical fields. Ordinary card creation does not enable or persist a rewriting preference.
- `$code-quality-workflow` for explicit full/architecture reviews of card organization and its software connections; keep authoring changes behind the existing gate.

## Author the minimum complete design

Read only the references needed for the task:

- [card-writing.md](references/card-writing.md) for identity fields, prose, greetings, examples, and plot guidance.
- [cot-design-and-authoring.md](references/cot-design-and-authoring.md) for independent custom CoT definition, deployment, modular authoring, preset/card stitching, model routing, templates, budgets, script boundaries, and acceptance.
- [worldbook-design-and-writing](../worldbook-design-and-writing/SKILL.md) for independent entry planning, native/template choices, bodies and paired configuration.
- [lorebook-and-prompts.md](references/lorebook-and-prompts.md) for core-character activation, model routing and CoT stitching.
- [worldbuilding-design.md](references/worldbuilding-design.md) for playable world construction, causality, resources and connections to state/opening; worldbook-only methods link to their owner.
- [variable-systems.md](references/variable-systems.md) for schemas, initialization, updates, projections, cleanup, and migrations.
- [opening-strategies.md](references/opening-strategies.md) for fixed greetings and dynamic setup flows.
- [card-types-and-runtime-dependencies.md](references/card-types-and-runtime-dependencies.md) for type detection, dependency classes, regional loaders, and user notices.
- [regex-and-runtime-requirements.md](references/regex-and-runtime-requirements.md) for transformation and script requirements without inventing APIs.
- [retrofit-and-text-cards.md](references/retrofit-and-text-cards.md) for preserving an existing card or avoiding MVU entirely.
- [validation.md](references/validation.md) before handoff.

## Stable rules

- Keep source and generated artifacts separate. Fix the source, then rebuild the artifact.
- Preserve an existing card's proven protocol unless there is evidence and authorization to migrate it.
- Treat command dialects and runtime behavior as version-sensitive capabilities, not universal folklore.
- Detect MVU Zod from the card's schema, registration path, and packaged loader
  scripts, never from an API identifier alone. Trace the embedded schema, embedded
  domestic/global MVU Zod scripts, their Git/CDN targets, and the required host
  extension separately. When the card already ships its loader scripts, do not add a
  standalone Zod installation step.
- Do not silently install extensions or remote runtimes. Report embedded, host,
  remote, regional, optional, and development-only dependencies separately.
- Keep model-visible text free of incident history, development commentary, Markdown decoration that has no model purpose, and copyable hard-coded outputs.
- Treat custom CoT as an author-written decision protocol, not as access to a model's hidden internal reasoning. Validate observable behavior and routing instead of requiring full reasoning output.
- Default to preset main CoT plus card-specific increments and conditional modules. Keep plot-model CoT, update-model prompts, and deterministic script calculation separated by responsibility.
- Use UTF-8-safe, guarded writes for multilingual or multiline bodies. Verify structural matches before and after mutation.
- Prefer project-proven structures over new abstractions.
- Validate in proportion to impact. A runtime-affecting change is not complete until it is accepted in real SillyTavern.
- Never package, publish, deploy, or overwrite a user's card merely because the authoring plan is complete.

## Handoff format

For whole-card or system work, return the applicable items below. A short character
draft or narrow diagnosis uses the scoped delivery described above, not an eight-part
completion report.

1. target card type, detected capabilities, and evidence;
2. agreed systems and exclusions;
3. runtime dependency ledger and user-facing install/embed/remote-load notice;
4. field/lorebook/component contracts and CoT deployment/stitching contract;
5. files or card sections to create or change;
6. specialist skills required next;
7. validation evidence obtained;
8. real-runtime or user acceptance still required.
