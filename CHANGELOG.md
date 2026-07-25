# Changelog

## 0.4.0 - 2026-07-26

- Add independent custom CoT design and authoring for text cards, MVU cards, hybrid cards, plot direction, character behavior, NPC scheduling, system judgment, and output validation.
- Define the default `preset main CoT + card-specific increments + conditional modules` architecture, including stable phases, rule IDs, insertion order, semantic deduplication, prompt budgets, and generated full fallbacks.
- Separate author-written CoT prompts from hidden model reasoning, visible character thoughts, MVU `<analysis>`, update-model analysis, Zod schemas, and deterministic script calculation.
- Add ready-to-use lightweight, character/plot, and ensemble/system CoT templates plus explicit plot/update model routing and LLM/script ownership guidance.
- Expand the newbie guide with a second chapter covering Zod, CoT, and calculation scripts, together with chapter loading and navigation.
- Extend manual replay coverage to 14 forward and 12 adversarial cases, including no-MVU CoT, preset/card stitching, ensemble routing, MVU separation, script ownership, full-CoT duplication, and hidden-reasoning-output failures.

## 0.3.0 - 2026-07-25

- Define MVU zod same-generation and extra update-model routing, including marker matching, activation independence, shared-context budgeting, and a dual-mode acceptance matrix.
- Require card-bound and co-delivered worldbooks to resolve from the active manifest by stable ID and remain version- and content-aligned with maintained source.
- Add forward and adversarial replay coverage for dual-model prompt routing and stale worldbook packaging.

## 0.2.0 - 2026-07-22

- Add project-provided watch builds to the card-pipeline adapter contract.
- Connect source rebuilds, Tavern Helper real-time listener reloads, and real-SillyTavern execution evidence across the pipeline, embedded UI, and runtime-debug skills.
- Keep watch output as a development candidate and require a production build for final acceptance and release.

## 0.1.0 - 2026-07-22

- Establish the TavernWeave plugin and personal marketplace entry.
- Consolidate the four-part code cleanup workflow.
- Split rolecard authoring, components, pipeline, API, runtime, and embedded UI responsibilities.
- Add publishable derivatives for shadcn/Tailwind UI work and rolecard workshop operations.
- Pin API navigation to reproducible public upstream revisions without vendoring declarations.
- Gate releases on Python tests plus fingerprinted manual forward/adversarial replay evidence.
- Add a guarded personal-marketplace registration command and ESM-aware Tailwind config output.
- Add Claude Code plugin and marketplace manifests without duplicating the Skill array.
- License TavernWeave-authored material under PolyForm Noncommercial 1.0.0.
