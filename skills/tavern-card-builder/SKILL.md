---
name: tavern-card-builder
description: Plan and author maintainable SillyTavern character cards, including text cards, MVU variable cards, retrofits, schemas, initialization, update rules, single-model or extra-model update routing, lorebooks, prompts, openings, regex requirements, and companion-script requirements. Use when creating a new card, converting an existing card, adding a gameplay system, repairing an authoring protocol, or tracing a field across the card design. Do not use it as the primary skill for component-library extraction, build/package/release operations, exact API signature lookup, real-runtime debugging, embedded UI implementation, or workshop infrastructure; route those tasks to the focused TavernWeave skills.
---

# Tavern Card Builder

Design the card as a set of explicit contracts. Keep authoring decisions here and route engineering work to the owning specialist.

## Start with the target

1. Read repository instructions and inspect the existing card before proposing a design.
2. Identify the target SillyTavern, Tavern Helper, prompt-template, and MVU implementations or versions when behavior depends on them.
3. Classify the task:
   - text card with no persistent variable runtime;
   - MVU card with schema-governed state;
   - hybrid card with text protocol plus optional scripts or embedded UI;
   - retrofit that must preserve an existing card's voice, data, and command dialect.
4. Ask only decisions that materially change the result. Do not force a fixed interview ritual for a narrow edit.
5. For an MVU card, identify whether updates share the plot generation or use an
   extra update-model pass. For a new MVU zod card whose runtime supports entry
   routing, prefer a dual-compatible layout; preserve an existing card's current mode
   unless migration is explicitly authorized.
6. Record unresolved version-sensitive claims as assumptions and keep a real-runtime acceptance gate.

For the complete authoring sequence, read [authoring-workflow.md](references/authoring-workflow.md).

## Build the contract before prose

For every system, write down:

- its source of truth;
- fields and defaults;
- writer, reader, renderer, and cleanup owner;
- initialization and migration behavior;
- model-visible instructions;
- optional runtime or UI dependencies;
- verification evidence.

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
- [lorebook-and-prompts.md](references/lorebook-and-prompts.md) for entry boundaries, routing, model-visible text, and prompt budgets.
- [variable-systems.md](references/variable-systems.md) for schemas, initialization, updates, projections, cleanup, and migrations.
- [opening-strategies.md](references/opening-strategies.md) for fixed greetings and dynamic setup flows.
- [regex-and-runtime-requirements.md](references/regex-and-runtime-requirements.md) for transformation and script requirements without inventing APIs.
- [retrofit-and-text-cards.md](references/retrofit-and-text-cards.md) for preserving an existing card or avoiding MVU entirely.
- [validation.md](references/validation.md) before handoff.

## Stable rules

- Keep source and generated artifacts separate. Fix the source, then rebuild the artifact.
- Preserve an existing card's proven protocol unless there is evidence and authorization to migrate it.
- Treat command dialects and runtime behavior as version-sensitive capabilities, not universal folklore.
- Keep model-visible text free of incident history, development commentary, Markdown decoration that has no model purpose, and copyable hard-coded outputs.
- Use UTF-8-safe, guarded writes for multilingual or multiline bodies. Verify structural matches before and after mutation.
- Prefer project-proven structures over new abstractions.
- Validate in proportion to impact. A runtime-affecting change is not complete until it is accepted in real SillyTavern.
- Never package, publish, deploy, or overwrite a user's card merely because the authoring plan is complete.

## Handoff format

Return:

1. target card type and detected capabilities;
2. agreed systems and exclusions;
3. field/lorebook/component contracts;
4. files or card sections to create or change;
5. specialist skills required next;
6. validation evidence obtained;
7. real-runtime or user acceptance still required.
