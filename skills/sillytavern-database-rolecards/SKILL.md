---
name: sillytavern-database-rolecards
description: >-
  Design and validate structured in-card data models for SillyTavern rolecards,
  including table schemas, stable record keys, MVU message-floor storage, field
  bindings, deterministic migrations, and status-bar or control-center consumers.
  Use when a rolecard behaves like a small database application or needs schema and
  migration fixtures across normal multi-floor conversations. Do not introduce an
  external SQL service or claim same-floor compatibility without real-host evidence.
---

# SillyTavern Database Rolecards

Before schema or migration writes, use `$consult-tavernweave-library` with the `sillytavern-database-rolecards` route and load A0, C4, and C7. C8 is returned only with explicit experimental opt-in and remains blocked from mature claims until real-host acceptance.

Treat structured rolecard state as versioned application data. Keep schema,
migration, storage scope, writers, and UI bindings machine-checkable.

## Fix the supported storage route

First-batch support is limited to normal multi-floor state using message-floor or MVU
data. Mark same-floor compatibility as `DBR-C8-UNVERIFIED`; do not add a fallback that
silently changes scope.

Read [rolecard-data-model.md](references/rolecard-data-model.md) before defining tables
or migrations. Read [floor-and-ui-binding.md](references/floor-and-ui-binding.md)
before connecting a field to a script, prompt, status bar, or control center.

When exact runtime calls matter, verify `getVariables`, `updateVariablesWith`,
`Mvu.getMvuData`, MVU events, and message events with
`$sillytavern-api-reference`. Prefer updater functions and event-driven refresh over
replacing an entire variable object.

## Validate the model

```text
node scripts/validate-rolecard-schema.mjs model.json
```

Require a stable model ID and version, a `stat_data` storage root, `multi-floor`
strategy, explicit tables, primary keys, typed fields, valid defaults, and unique
identifiers. Reject same-floor strategy in this release.

## Run migration fixtures

```text
node scripts/run-database-migrations.mjs --migration migration.json --input before.json --expected after.json
```

Require deterministic output and idempotence. Preserve unknown records and fields.
Reject destructive operations unless the migration declares data loss and the caller
passes `--allow-data-loss`. Do not write migrated data without `--write` and `--out`.

## Check every consumer

```text
node scripts/check-field-bindings.mjs --schema model.json --bindings bindings.json
```

Every binding must reference a declared table and field, name its reader or writer,
identify the UI or prompt surface, and state refresh events. Route UI implementation
to `$sillytavern-embedded-ui` and packaging to `$sillytavern-card-pipeline`.

## Keep runtime acceptance open

Static checks cannot prove new-chat initialization, edit, swipe, chat switch, reload,
or persistence behavior. Require a real-SillyTavern matrix for those cases before
claiming runtime compatibility. Keep C8 excluded until that matrix passes.

## Report

State the model version, storage route, table and binding counts, migration result,
preserved unknown data, destructive-operation decision, and pending host cases.

## Resources

- `scripts/validate-rolecard-schema.mjs`: validate the model contract.
- `scripts/run-database-migrations.mjs`: apply deterministic migration fixtures.
- `scripts/check-field-bindings.mjs`: verify table/field consumers.
- `references/rolecard-data-model.md`: schema and migration format.
- `references/floor-and-ui-binding.md`: MVU/message-floor and UI lifecycle contract.
