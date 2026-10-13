# Authoring workflow

## Contents

1. Discovery
2. Decision record
3. Contract design
4. CoT deployment and stitching decision
5. Authoring sequence
6. Specialist handoff

Apply the whole-card sequence to work that needs it. A short opening or card-local
creative piece uses the relevant supplied material and the scoped process in
[card-writing.md](card-writing.md); it does not require all discovery fields or maps.

## 1. Discovery

Inspect the actual input before designing:

- character-card format and version;
- current identity fields and greetings;
- active preset and existing custom CoT, if available;
- embedded or linked lorebooks;
- scripts, regex rules, UI resources, and loaders;
- variable protocol and command dialect;
- card type, capability flags, and host/embedded/remote dependency evidence;
- project instructions, source/artifact boundaries, and release process.

For an existing card, preserve a read-only snapshot and hash before any transformation. Do not infer the source tree from a packaged JSON or PNG when a maintained source exists.

## 2. Decision record

Confirm only decisions that affect architecture or content ownership:

- `text`, `mvu_zod`, or `hybrid` as the target type, with detected capabilities recorded separately;
- primary card type and capability flags;
- whether custom CoT is required, and whether the preset already provides a reusable main CoT;
- card-specific CoT increments, conditional modules, recipient models, and safe fallback;
- target runtime and optional dependencies;
- gameplay systems and deliberately excluded systems;
- fixed greetings versus free-form setup;
- persistence, migration, and failure behavior;
- public/SFW and optional mature-content boundaries;
- embedded UI and publishing expectations.

Provide a short proposed contract and ask for confirmation before a large new card. A local repair with an already clear acceptance condition does not need a ceremonial multi-round interview.

Every completed type requires a usable greeting and worldbook. Planning records may
still list missing components, but an empty placeholder is not completed content.
For new cards, use the worldbook as the main content carrier and normally leave the
traditional prompt fields empty as specified in [card-writing.md](card-writing.md).
An inherited card keeps its effective fields and state until the corresponding
change is authorized; a new convention is not permission to clear or migrate it.

Before new worldbook design, ask the player to choose 小型 / 中型 / 大型, explain the
next work for each, and optionally give a reasoned recommendation. Reuse an explicit
confirmed choice; do not infer approval from silence. See
[worldbuilding-design.md](worldbuilding-design.md). Single/multiple core characters
is a separate choice used for character-entry activation, not a runtime type or a
substitute for world scale.

For character work, distinguish organization of supplied material, collaborative
ideation and explicitly delegated creation. Reuse confirmed directions; ask only
material unresolved choices. Player profile facts and the scope of player portrayal
permission are separate. Without delegation, keep the player self-controlled as
specified in [player-profile-and-agency.md](player-profile-and-agency.md).

## 3. Contract design

Build six maps:

1. **Content map** — identity, setting, actors, locations, plot guidance, greetings, examples.
2. **CoT map** — preset main phases, card increments, conditional modules, recipient models, output boundaries, fallback.
3. **State map** — fields, types, defaults, ownership, lifecycle, migrations.
4. **Runtime map** — optional helper scripts, events, regex, UI, external resources.
5. **Artifact map** — maintained sources, generated snapshots, packages, and release outputs.
6. **Dependency ledger** — embedded requirements, host capabilities, remote loaders,
   regional alternatives, optional features, and development-only tools.

If a repository exposes a component registry or recipe, consume its declared contract through `$sillytavern-card-components`; do not copy project-specific registry entries into the authoring skill.
Use [card-types-and-runtime-dependencies.md](card-types-and-runtime-dependencies.md)
for the shared type and dependency vocabulary.

Extend the existing entry/component map with links, not a second state store:

| Relationship | Record only what this project needs |
| --- | --- |
| Stable knowledge | Source entry, factual or proposed status, scope and knowledge degree. |
| Current state | Field-ledger link, initial-value evidence, writer, readers and lifecycle. |
| Selected prompt content | Entry ID, activation condition, recipient model and referenced fields. |
| Opening branch | Greeting source, setting references and branch-specific initialization. |
| Character foundation | Confirmed identity, living circumstances, disposition and any useful expression guidance; combine or omit sections as appropriate. |
| Player profile and agency | Fact source, knowledge boundaries, allowed portrayal scope and duration; never infer delegation from a profile. |
| Character stages | Reason for adoption, existing state authority, conditions, differences and missing-state behavior; no new state owner. |
| Portrayal review/correction | Evidence and hypotheses in author records; only necessary, confirmed clarification enters model-visible material. |

Static world facts, current state, narrative recall and creator preferences retain
their existing owners. If a rule exposes a missing field, revise the same design
record and identify affected initialization, schema, rules and entries before
regenerating them. Do not silently patch one consumer or ask the player to copy the
same design between separate workshops. In a hybrid card, additionally declare
cross-system handoffs, ownership conflicts and failure behavior.

## 4. CoT deployment and stitching decision

Custom CoT is optional and independent of MVU. Decide ownership before writing:

1. Put cross-card input, scene, behavior, continuity, and output checks in the preset main CoT.
2. Put always-on card-only differences in a card increment that names the target main-CoT phase.
3. Put location-, actor-, event-, combat-, or system-specific judgments in conditional modules.
4. Route plot/character/NPC modules only to the plot model and variable-update rules only to the update model.
5. Keep deterministic calculations in scripts; let CoT provide only semantic judgments or source inputs.
6. If reliable stitching is unavailable, generate one full fallback from the maintained main CoT and increments instead of maintaining a second manual copy.

Record stable phase and rule IDs, insertion position, activation, dependency, recipient,
output visibility, skip condition, and fallback. Deduplicate against the preset, card,
worldbook, and output protocol before shortening.

Worldbook fields, injection depth/order, macros, and model-routing behavior are
version-sensitive. Route exact claims to `$sillytavern-api-reference`; do not invent a
SillyTavern API from the authoring contract.

Read [cot-design-and-authoring.md](cot-design-and-authoring.md) before writing or
merging custom CoT.

## 5. Authoring sequence

1. Inspect the actual source, preserve the authorized scope and record the target
   type, detected capabilities, required greeting and worldbook.
2. For new worldbook design, explain and confirm 小型 / 中型 / 大型. Classify world
   facts, character material, creative rules and changing state without promoting
   unconfirmed proposals.
3. Design the content, state, runtime and dependency maps only to the needed depth.
   Prefer structured world prose; retain conditions, exceptions and degrees of
   knowledge. Pure text cards do not acquire MVU just to display a status panel.
   For character creation, use [character-design.md](character-design.md); establish
   the [player profile and agency](player-profile-and-agency.md) only where needed.
4. For MVU state, select fields by actual consumers; define complete structures,
   initial values and their sources, then update/keep conditions and cleanup.
   Generate or reconcile schema, initialization and rules from that same design.
   If state-selected portrayal is needed, design [character stages](character-stages.md)
   from that authority. Preserve the foundation when reliable stage state is absent;
   do not create a guessed stage or write back a fallback.
5. Design worldbook entries and paired configuration, including state references,
   activation and model recipients. Apply [lorebook-and-prompts.md](lorebook-and-prompts.md).
6. Decide optional CoT ownership, stitching and fallback; author only necessary
   preset/card increments and conditional modules without duplicating setting text.
7. Write or reconcile greetings against worldbook facts and each branch's initial
   conditions. Reuse the author's style requirements and form a short writing
   direction only where needed, following [opening-strategies.md](opening-strategies.md).
   A clear brief or delegated choice can proceed directly to prose. Inspect existing
   initialization before changing an old card.
8. Specify required regex, script and UI components and their dependencies; exact
   runtime implementation stays with the owning specialist.
9. Check schema/default/update/entry/greeting consistency, build each model-visible
   projection and budget separately, and state what remains unverified.
10. Route authorized build/runtime work with its source, expected output and evidence
    boundary. Stop at the current scope; do not turn method integration into installation.

When portrayal feedback exists, apply [character-review-and-correction.md](character-review-and-correction.md).
Separate original facts, observed output, author feedback and diagnostic hypotheses;
consider delivery, scene, history, preset and model effects. Prefer the smallest
supported revision, including no change or removal. An optional clarification must
not add facts, advance a stage or become a second conflicting character definition.
Use existing evidence records; paper review is not real-model portrayal evidence.

Review Chinese prose using the [shared natural Chinese rules](../../rewrite-natural-prose/references/natural-chinese-review.md).
Keep worldbook bodies limited to what the receiving model needs; author decisions
and configuration stay in their existing records.

## 6. Specialist handoff

Do not silently expand authoring permission into implementation or release permission. Each handoff must state the owning skill, expected input, expected output, and acceptance gate.
