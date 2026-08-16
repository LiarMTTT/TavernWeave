---
name: sillytavern-card-pipeline
description: >-
  Orchestrate data-driven SillyTavern rolecard live development, iteration,
  validation, JSON packaging, PNG payload embedding, release auditing, and delivery
  by adapting to tools already present in the target project. Use when discovering or
  running a project-provided watch build for Tavern Helper real-time editing; creating
  or checking a profile, manifest, operation plan, or contract; choosing validation
  from changed-file impact; detecting a card type and runtime dependency inventory;
  enforcing required embedded regex/schema/helper assets and regional loader policy;
  composing version components; packing or re-packing a card; synchronizing
  card-bound worldbook versions; generating final JSON or PNG artifacts; verifying
  embedded payload parity; or preparing an explicit checkpoint or public release. Do
  not use for exploratory card disassembly or shared component-library design; use
  sillytavern-card-components instead.
---

# SillyTavern Card Pipeline

Drive the target repository's workflow without pretending this skill ships a build
engine. Discover and verify the project's own tools, map them to a small adapter
contract, and keep configuration, source, and artifacts in distinct layers.

Before a write, build, or package action, use `$consult-tavernweave-library` with the `sillytavern-card-pipeline` route. Read A0 and the returned build/deployment guides, then keep the route receipt beside the preflight evidence.

Record capability-specific evidence with [acceptance-ledger.md](references/acceptance-ledger.md). Keep source, automated, offline artifact, browser, real SillyTavern, human, and release gates separate; automation never writes `driver-accepted`.

## Confirm the requested gate

Classify the request before running any mutating command:

- **live iteration**: run the project's verified watcher and rebuild development
  output after source edits;
- **iteration**: change source and run impact-based checks;
- **checkpoint package**: create JSON or PNG required by the next stage;
- **release candidate**: compose, package, embed, and run the full offline gate;
- **accepted release**: complete remaining host checks and approve delivery.

Package only when the user explicitly requests packing, re-packing, PNG generation,
final artifacts, full workflow, delivery, release, or a checkpoint that requires a
packed artifact. Do not package after every component edit.

## Discover the project adapter

Read [tool-adapter-contract.md](references/tool-adapter-contract.md) before invoking
project tools.

1. Read repository instructions and current build documentation.
2. Detect the repository root, active configuration entrypoint, executable runtime,
   and available workflow capabilities.
3. Verify each capability from help output, schemas, tests, or source inspection; do
   not infer behavior from a filename alone.
4. Record commands, working directory, explicit inputs, explicit outputs, dry-run
   support, side effects, and success criteria.
5. Run a read-only information or validation capability first.

If a required capability is absent, report the missing adapter boundary. Do not claim
that a bundled engine or fallback command exists.

## Drive a live development loop

Use live iteration only when the user asks for real-time compilation, watch mode, hot
reload, or an equivalent development loop.

1. Inspect the target project's package scripts, build configuration, and development
   documentation. Do not assume the command is `pnpm watch` or that every watcher uses
   the same output layout.
2. Record the watcher command, working directory, source roots, exact outputs, initial
   build-ready signal, rebuild success and failure signals, and stop procedure in the
   adapter record.
3. Confirm the output path is the one consumed by the card, regex, local server, or
   Tavern Helper binding. A running process without a successful initial build is not
   ready.
4. Start one watcher, keep its output observable, and after each source edit wait for a
   successful rebuild before asking `sillytavern-runtime-debug` to verify the listener
   reload and new behavior in SillyTavern.
5. Treat listener disconnects, compiler errors, and stale output as failed iterations.
   Do not diagnose runtime behavior against the previous successful artifact as though
   the new source were loaded.

Watch output is a development candidate, even when the project writes it under
`dist/`. Before checkpoint or release packaging, run the verified production build and
artifact checks. Stop or isolate the watcher first when both commands can write the
same targets.

## Resolve configuration truth

Read [configuration-contracts.md](references/configuration-contracts.md) when creating,
editing, or reconciling workflow data.

Resolve the active files together:

- **profile**: card-family identity, defaults, protocol, variable roots, recipe, and
  configuration links, including declared card type/capability defaults;
- **manifest**: exact version paths, component mapping, packaging policy,
  deliverables, field chains, card-bound worldbook identities, runtime dependency
  ledger, and release-specific behavior;
- **plan**: a reviewable sequence of intended changes between known states;
- **contract**: stable required and forbidden invariants.

Re-probe the exact active profile and manifest instead of trusting a remembered
version. Keep differences in data, not in copied card-name or version-specific tools.
Make generated artifacts consume these declarations rather than duplicating protocol
or version rules.

Detect the primary card type and capability flags from maintained source and reconcile
them with the declared profile/manifest. Do not accept a declaration that contradicts
the packed extension surfaces without an explicit compatibility explanation.

## Prepare the change

1. Inventory current source and existing artifacts without modifying them.
2. Inventory regexes, Tavern Helper scripts, schemas, host capabilities, remote
   imports, and regional-alternative groups. Classify them as host-required,
   embedded-required, remote-runtime, regional-alternative, optional, or
   development-only.
3. Present a preflight notice that separates content already embedded from host setup,
   remote runtime loads, regional selection, and development-only tools. For an MVU
   Zod card, list its packaged schema and domestic/global scripts as already embedded,
   then list their Git/CDN targets separately. Do not replace that loading path with a
   local Zod installation instruction.
4. Define the exact write scope and new artifact paths. Preserve earlier releases;
   default to a new version or staging directory.
5. Anchor a regression checklist for every already-working consumer in scope.
6. Create or review a plan with precise operations, guarded replacements, collision
   policy, and validation attached to each step.
7. Validate profile, manifest, plan, contract, and runtime dependency structure.
8. Run the plan's dry-run and inspect the predicted writes before applying it.

Do not copy an entire historical release when only source components should be
derived. Do not extract an older JSON or PNG over components that are being edited.

## Validate by impact

Use the impact matrix in [release-gate.md](references/release-gate.md). Run the smallest
check set that proves the changed contract, then widen only when the change crosses a
boundary.

Always validate a coupled variable field across initial data, schema, update rules,
output format, context, groups, runtime readers, and examples. Keep model-visible text
free of developer commentary. Validate runtime layers independently instead of
assuming a worldbook, regex, helper script, or iframe shares APIs with another layer.
At `component_assembly` and `release`, a missing `embedded_required` dependency or an
invalid regional-alternative selection is a blocking defect, not a reminder.

Treat an incorrect check as a defect: contracts must lock stable behavior and include
forbidden regressions, not encode a temporary implementation preference.

## Compose and package

1. Confirm source edits and targeted checks are complete.
2. Re-run card-type and runtime-dependency detection against maintained source.
   Reconcile detected and declared ledgers before writing staging output.
3. Compose only when the active profile selects generated components and the recipe
   matches the current target. Do not overwrite manual component snapshots to make a
   build pass.
4. Compose into staging and verify required outputs, dependency resolution, syntax,
   and component parity.
5. Verify every required embedded regex, schema, helper script, loader, and binding is
   present in its declared packed field with the expected stable identity and enabled
   state. For regional groups, require every script promised by the card and enforce
   the manifest's enabled-state policy; a common domestic/global pair keeps both
   scripts packaged and enables only its declared default.
6. Resolve every card-bound or co-delivered worldbook by stable ID from the active
   manifest. Verify its maintained source and declared version match the card release;
   do not select a worldbook by display name, timestamp, or newest-looking filename.
7. Pack JSON from component sources into the manifest's staged target. Never inject a
   fix after packing; first update the maintained source, then pack again.
8. Re-open the packed JSON and verify the runtime dependency ledger, extension
   surfaces, attached worldbook identity, version surface,
   and semantic content match the resolved maintained source. If a standalone
   worldbook is also delivered, require it to be the same declared version and content.
9. Validate the packed JSON before embedding it.
10. Embed JSON into a copied or explicitly declared PNG shell according to manifest
   policy. Preserve unrelated chunks and verify every emitted card payload decodes to
   the packed JSON.
11. Keep reverse extraction disabled by default. Use it only as a sandboxed round-trip
   check after packing and embedding.

If re-packing an existing target is explicitly required, snapshot and hash the current
artifact first and report the replacement. Never silently replace an older release.

## Pass the release gate

Follow [release-gate.md](references/release-gate.md) for checkpoint, candidate, and
acceptance criteria.

At minimum, prove:

- configuration and version alignment;
- card type/capability evidence and complete runtime dependency classification;
- required embedded runtime assets and regional selection;
- card-to-worldbook stable-ID, version, attachment, and source parity;
- contract and forbidden-regression checks;
- complete declared component and deliverable sets;
- packed JSON validity and source parity;
- PNG structure, payload cardinality, and semantic equality with JSON;
- artifact paths, sizes, and hashes;
- no unexpected writes outside the declared scope.

Run the project's release audit only for a release candidate or when explicitly
requested. Offline success does not close host-dependent UI, regex, bridge, import,
new-chat, remote-loader execution, or interaction checks; record those as pending
until real SillyTavern acceptance is complete.

## Report the handoff

State:

- the adapter capabilities and exact commands used;
- for live iteration, the watcher readiness signal, output path, latest successful
  rebuild, and whether real-SillyTavern reload was verified;
- active profile, manifest, plan, and contract;
- detected primary card type and capability flags;
- dependencies already embedded, host installation/enablement still required, remote
  Git/CDN loads, selected regional alternative, optional features, and
  development-only exclusions;
- resolved card/worldbook version pair and attachment verification;
- files written and preserved artifacts;
- targeted, standard, and release checks with pass or fail results;
- JSON and PNG hashes plus payload-parity result;
- skipped gates and remaining real-host acceptance.
