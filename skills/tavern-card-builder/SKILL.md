---
name: tavern-card-builder
description: Plan and author maintainable SillyTavern character cards, including card-type and capability detection, runtime-dependency ledgers, text cards, MVU or MVU Zod cards, custom CoT design and authoring, modular CoT stitching and routing, prompt budgets, retrofits, schemas, initialization, update rules, single-model or extra-model update routing, lorebooks, prompts, openings, regex requirements, and companion scripts. Use when creating or converting a card, adding a gameplay system, identifying which dependencies must be embedded or enabled, repairing an authoring protocol, or tracing a field across the card design. Do not use it as the primary skill for component extraction, build/package/release operations, exact API lookup, real-runtime debugging, embedded UI implementation, or workshop infrastructure; route those tasks to the focused TavernWeave skills.
---

# Tavern Card Builder

Design the card as a set of explicit contracts. Keep authoring decisions here and route engineering work to the owning specialist.

Before a write-capable design, use `$consult-tavernweave-library` with the `tavern-card-builder` route so A0 and the smallest matching ST guides are actually read. Keep the route receipt with the project authority; a bundled database that was not routed and read is not evidence.

For a new or long-running card, establish the resumable creative authority in [creative-authority.md](references/creative-authority.md) before producing large prose. For source novels, notes, chats, or research, add the chain in [material-provenance.md](references/material-provenance.md). For persistent knowledge, state, narrative recall, or creator-profile requests, keep the four stores separate using [memory-architecture.md](references/memory-architecture.md).

## Start with the target

1. Read repository instructions and inspect the existing card before proposing a design.
2. Identify the target SillyTavern, Tavern Helper, prompt-template, and MVU implementations or versions when behavior depends on them.
3. Detect one primary card type plus capability flags from the actual card and
   maintained source. Build a runtime dependency ledger before deciding what the user
   must install, what the card must embed, and what loads remotely. Read
   [card-types-and-runtime-dependencies.md](references/card-types-and-runtime-dependencies.md).
4. Ask only decisions that materially change the result. Do not force a fixed interview ritual for a narrow edit.
5. Independently decide whether the card needs a custom CoT, whether a reusable main
   CoT already exists in the preset, which card-specific increments are required, and
   which modules should activate conditionally. Do not make this decision depend on
   whether the card uses MVU.
6. For an MVU card, identify whether updates share the plot generation or use an
   extra update-model pass. For a new MVU zod card whose runtime supports entry
   routing, prefer a dual-compatible layout; preserve an existing card's current mode
   unless migration is explicitly authorized.
7. Record unresolved version-sensitive claims as assumptions and keep a real-runtime acceptance gate.

For the complete authoring sequence, read [authoring-workflow.md](references/authoring-workflow.md).

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
- `$sillytavern-embedded-ui` for opening pages, status bars, control centers, and dialogs;
- `$rolecard-workshop-ops` for publishing infrastructure.

## Author the minimum complete design

Read only the references needed for the task:

- [card-writing.md](references/card-writing.md) for identity fields, prose, greetings, examples, and plot guidance.
- [cot-design-and-authoring.md](references/cot-design-and-authoring.md) for independent custom CoT definition, deployment, modular authoring, preset/card stitching, model routing, templates, budgets, script boundaries, and acceptance.
- [lorebook-and-prompts.md](references/lorebook-and-prompts.md) for entry boundaries, routing, model-visible text, and prompt budgets.
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

Return:

1. target card type, detected capabilities, and evidence;
2. agreed systems and exclusions;
3. runtime dependency ledger and user-facing install/embed/remote-load notice;
4. field/lorebook/component contracts and CoT deployment/stitching contract;
5. files or card sections to create or change;
6. specialist skills required next;
7. validation evidence obtained;
8. real-runtime or user acceptance still required.
