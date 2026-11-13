---
name: yuri-card-creator
description: Create an original yuri roleplay character card from conversation alone, including a request to decide everything. Use for new fictional women, settings, relationships, playable openings and worldbooks without supplied sources. Reuse saved preferences and optionally pinned TavernWeave authoring guidance. Do not use as a source-adaptation or inherited-card repair workflow.
---

# Yuri Card Creator

## Start without a questionnaire

Accept a brief as small as “create an original yuri card for me; you decide the details.” Produce a complete first draft. External references, research, source files, a supplied image and additional user answers are not prerequisites. Treat unspecified ordinary creative details as delegated choices. Use adult main characters, a manageable cast, a text-first card and a small useful worldbook as this checkpoint's starting choices; record those choices and allow later changes in conversation.

Read `assets/interaction.<locale>.json`. Use Chinese for Chinese interaction and its three default labels; keep this core policy in English. Reuse a ready saved profile and read [supported saved policies](../../references/custom-profiles.md). Validate the profile before authoring; complete its bound review rather than silently replacing custom choices with defaults. If none is supplied, use `assets/preferences.default.json`. Present defaults briefly if helpful, but do not stop creation to ask the user to re-confirm them. Use the user's requested narrative language; otherwise follow the saved language. Current conversation language can select the interaction locale independently.

Locate the skill and the user's creation directory separately. The agent operates the files; the user reviews the card in conversation. Do not require manual Markdown or JSON forms.

## Use the authoring base honestly

`assets/upstream.json` declares a pinned TavernWeave authoring dependency. When a local base is provided, run `python <skill>/scripts/create_card.py probe-base --tavern-root <base-root>` and read the verified `tavern-card-builder` entry and `references/authoring-workflow.md`. Reuse the relevant character, worldbook and opening methods rather than creating another general authoring framework. Read further upstream references only as needed and actually available.

The probe verifies two document blobs, not a complete installation. Keep missing references and native host integration unverified. Never claim A0 routing, a plugin installation or host testing that did not occur. If the external base is absent, the original-creation contract below remains usable in explicitly reported standalone mode. A supplied root with mismatched files must fail verification, not silently become the pinned base.

For this delegated, small original-card task, choose ordinary design details such as small worldbook scope yourself; record them instead of imposing an upstream design interview. User instructions and this original-creation scope govern those choices. Software documentation is a dependency, not a fictional canon source.

When using the TavernWeave base, complete its bounded library route and read A0 plus the selected guides before character/worldbook design or prose. Keep the real route receipt and paths read in the private project. A route run only after drafting is a late review; do not describe it as pre-authoring compliance. Use the upstream documented manual fallback when the router is unavailable, without inventing execution evidence.

## Create original material

1. Initialize with `python <skill>/scripts/create_card.py init --project <new-private-project> --locale zh-CN` (or `en`); add `--profile <ready-profile.json>` to reuse an existing Workbench profile.
2. Invent specific adult women with independent goals, distinctive voices, a relationship tension or bond, and a setting that makes interaction possible. Author-defined women include virtual and nonhuman characters. Do not equate womanhood with stereotypes, a particular body, passivity or automatic attraction. Keep romance optional under the saved definition; when romance is requested, make its development character-specific. Background men may exist. If retaining a supplied name, apply [name review](../../references/name-review.md); propose alternatives for a contextual mismatch and preserve the current name until the user chooses or delegates. Inventing an unspecified name remains an ordinary creative choice.
3. Preserve an existing player persona. For a newly fictional player role, keep its design separate from the real user's identity. Use `{{user}}` consistently; do not call that role narrator or poster. Leave the player's current actions, thoughts, dialogue and consent open. Use an NPC name as card `name` when `{{char}}` represents that NPC.
4. Write `card.md` with frontmatter `name` and optionally `creator`, plus `## First Message` and `## Lorebook`. Worldbook entries use `### Title | keys: key,key`. Description, Personality, Scenario, Example Dialogue and Alternate Greeting sections are available when useful; do not force material into empty fields. Keep worldbook facts, opening situation, knowledge boundaries and character motives consistent. Do not put audit explanations in model-facing prose.
5. Fill `creation.json`: keep `mode: original` and `external_creative_sources: []`; record a nonempty `cast` with unique `id`, `name`, `role` (`main` or `background`), `author_defined_woman` and `adult` booleans. Every character selected by the saved scope must be an adult author-defined woman, with human/custom-criteria declarations when required. Background or excluded identities stay outside that requirement. Record selected relationship outcomes and complete `policy_review` for a non-default profile. Record ordinary creative choices as strings under `creative_choices`. These are authored facts, not extracted evidence. Do not fabricate citations, external source records or a male before-card.
6. Review the draft's actual prose for saved preferences, character-specific causality, knowledge boundaries, playable opening, usable worldbook, distinct voices and player agency. Keep conflicting supplied masculine sexual anatomy out of this original-creation path; use non-graphic woman-consistent or anatomy-neutral phrasing and never add erotic detail or sexualize minors. Set `agent_review.completed: true` with brief review notes only after reviewing; this records agent work, not human acceptance.
7. Build with `python <skill>/scripts/create_card.py build --project <private-project> --output <new-results-directory>`. If a verified local authoring base was actually used, add `--tavern-root <base-root>`. The unchanged Foreverse MIT code serializes the Markdown; do not rewrite that exporter.
8. Give the user the final `yuri-card.v2.json`, `worldbook.json` and a short creative introduction in the selected language. The agent retains `creation-record.json` for later revisions. Report actual source mode and evidence limits. No SillyTavern import or live-roleplay result is implied by a successful export.

## Optional research and images

Read `references/optional-tools.md` only when research, image alignment, avatar generation/editing or PNG delivery is relevant. Use host-native tools for research and images; never claim they are installed merely because this package can describe the workflow. The agent can package a chosen PNG avatar using `pack-image`, preserving image chunks and reporting hashes. Text-only creation remains complete on its own.

## Keep this checkpoint small

Deliver a finished text card first. Image generation/editing, custom front ends and native host installers require separate capabilities. Optional research guidance and PNG packaging are described above. Offer them later if requested; none blocks this original card. Preserve confirmed choices across revision. For inherited JSON/PNG use adapt-yuri-card; for supplied posts or novel TXT/EPUB use their separate source entries and original records rather than relabeling that material as original.

## Review a trial

For user trials or feedback from another agent, read `references/testing.md`. Establish the actual available revision before crediting an extension result, inspect the submitted artifacts, and keep host-assisted fallback evidence separate. Handle review records yourself and ask the user for feedback in conversation.
