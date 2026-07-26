# Authoring workflow

## Contents

1. Discovery
2. Decision record
3. Contract design
4. CoT deployment and stitching decision
5. Authoring sequence
6. Specialist handoff

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

- text, MVU, or hybrid card;
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

1. Freeze the target and existing behavior.
2. Detect the card type and capabilities, then design the content, CoT, state, and dependency maps.
3. Decide CoT ownership, model recipients, stitching, and fallback.
4. Write schema and initialization contracts when MVU is required.
5. Write update and cleanup rules.
6. Write card identity, greetings, examples, and lorebook entries.
7. Write only the required main CoT, card increments, and conditional modules.
8. Specify regex, script, and UI requirements without inventing exact APIs.
9. Build each model-visible projection and its prompt budget separately.
10. State which requirements are already embedded, which need host enablement, and
   which load remotely.
11. Validate internal chains and route build/runtime work to specialists.

## 6. Specialist handoff

Do not silently expand authoring permission into implementation or release permission. Each handoff must state the owning skill, expected input, expected output, and acceptance gate.
