---
name: sillytavern-component-update
description: >-
  Build and validate the smallest SillyTavern rolecard component update while making
  the delivery boundary explicit. Use when changing only character-local regexes,
  Tavern Helper scripts or script folders, exporting importable component JSON,
  preparing a batch of component artifacts, or choosing between component-only
  delivery and a full-card packaging handoff. Do not silently repack a whole card;
  route authorized full-card assembly to sillytavern-card-pipeline.
---

# SillyTavern Component Update

Before a write-capable update, use `$consult-tavernweave-library` with the `sillytavern-component-update` route to load A0 and the smallest matching ST guides. Keep the receipt with the component-mode scope lock; it does not authorize repacking the full card.

Keep the selected component as the unit of change. Produce importable test artifacts
without forcing an unrelated card rebuild.

## Freeze the delivery mode

Before writing, record exactly one mode:

- `component`: emit only importable regex, Tavern Helper script, or script-folder
  JSON plus a validation report;
- `full-card`: emit the changed component artifacts and an assembly handoff, then use
  `$sillytavern-card-pipeline` for composition and packaging.

If the user did not select a mode, stop at a read-only plan. Never infer full-card
permission from a request to update one regex or helper script.

Read [component-update-contract.md](references/component-update-contract.md) before
creating a spec or output directory. Read
[importable-formats.md](references/importable-formats.md) when selecting a regex or
Tavern Helper script dialect.

## Establish the target

1. Read the project manifest, component registry, and current packaged surface.
2. Identify the target by stable ID, not display name alone.
3. Record the source file, current hash, output kind, runtime owner, enabled state,
   and expected untouched fields.
4. Preserve unknown fields and prior releases unless an explicit migration contract
   says otherwise.
5. Verify version-sensitive field names with `$sillytavern-api-reference` when the
   installed SillyTavern or Tavern Helper version differs from the pinned evidence.

## Plan and build

Create a UTF-8 JSON spec and inspect the write plan first:

```text
node scripts/plan-component-update.mjs --spec update-spec.json --out staging
node scripts/build-importable-component.mjs --spec update-spec.json --out staging --write
```

The build command is dry-run unless `--write` is present. Accept the script's output
paths only when they remain inside the declared staging directory.

For `component` mode, reject any plan that emits a card JSON or PNG. For `full-card`
mode, require `assembly.targetCard`, `assembly.componentId`, and
`assembly.expectedUntouchedHash`; the builder emits a handoff but does not package the
card itself.

## Validate the artifact

Run:

```text
node scripts/validate-importable-component.mjs staging
```

Require:

- valid UTF-8 JSON and a recognized component kind;
- stable, unique IDs;
- compilable regex patterns and non-empty helper-script content;
- preserved enabled state, ordering, buttons, data, and extension fields;
- no whole-card output in `component` mode;
- semantic parity outside the selected component in `full-card` mode.

Static validation proves only the artifact contract. Keep import, execution, regex
placement, message rendering, and interaction pending until real SillyTavern
acceptance through `$sillytavern-runtime-debug`.

## Report

State the selected mode, source hash, generated files, validation result, pipeline
handoff if any, untouched scope, and remaining live-import checks.

## Resources

- `scripts/plan-component-update.mjs`: validate a spec and print the exact write plan.
- `scripts/build-importable-component.mjs`: emit deterministic component JSON and an
  optional full-card assembly handoff.
- `scripts/validate-importable-component.mjs`: validate one artifact or a directory.
- `references/component-update-contract.md`: mode, spec, and output ownership.
- `references/importable-formats.md`: supported regex and helper-script shapes.
