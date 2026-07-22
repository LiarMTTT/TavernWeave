# Authoring workflow

## Contents

1. Discovery
2. Decision record
3. Contract design
4. Authoring sequence
5. Specialist handoff

## 1. Discovery

Inspect the actual input before designing:

- character-card format and version;
- current identity fields and greetings;
- embedded or linked lorebooks;
- scripts, regex rules, UI resources, and loaders;
- variable protocol and command dialect;
- project instructions, source/artifact boundaries, and release process.

For an existing card, preserve a read-only snapshot and hash before any transformation. Do not infer the source tree from a packaged JSON or PNG when a maintained source exists.

## 2. Decision record

Confirm only decisions that affect architecture or content ownership:

- text, MVU, or hybrid card;
- target runtime and optional dependencies;
- gameplay systems and deliberately excluded systems;
- fixed greetings versus free-form setup;
- persistence, migration, and failure behavior;
- public/SFW and optional mature-content boundaries;
- embedded UI and publishing expectations.

Provide a short proposed contract and ask for confirmation before a large new card. A local repair with an already clear acceptance condition does not need a ceremonial multi-round interview.

## 3. Contract design

Build four maps:

1. **Content map** — identity, setting, actors, locations, plot guidance, greetings, examples.
2. **State map** — fields, types, defaults, ownership, lifecycle, migrations.
3. **Runtime map** — optional helper scripts, events, regex, UI, external resources.
4. **Artifact map** — maintained sources, generated snapshots, packages, and release outputs.

If a repository exposes a component registry or recipe, consume its declared contract through `$sillytavern-card-components`; do not copy project-specific registry entries into the authoring skill.

## 4. Authoring sequence

1. Freeze the target and existing behavior.
2. Design the content and state maps.
3. Write schema and initialization contracts when MVU is required.
4. Write update and cleanup rules.
5. Write card identity, greetings, examples, and lorebook entries.
6. Specify regex, script, and UI requirements without inventing exact APIs.
7. Build the model-visible projection and prompt budget.
8. Validate internal chains and route build/runtime work to specialists.

## 5. Specialist handoff

Do not silently expand authoring permission into implementation or release permission. Each handoff must state the owning skill, expected input, expected output, and acceptance gate.
