# Rolecard data model

## Model format

Use UTF-8 JSON:

```json
{
  "schemaVersion": 1,
  "modelId": "quest-ledger",
  "modelVersion": "2.0.0",
  "storage": {
    "scope": "message",
    "root": "stat_data.database",
    "strategy": "multi-floor"
  },
  "tables": {
    "quests": {
      "primaryKey": "id",
      "fields": {
        "id": { "type": "string", "required": true },
        "state": { "type": "string", "required": true, "default": "open" },
        "progress": { "type": "number", "required": true, "default": 0 }
      }
    }
  }
}
```

Supported field types are `string`, `number`, `boolean`, `object`, and `array`.
Primary keys must exist, be required, and use `string` or `number`. Defaults must
match their declared type.

Apply the shared [variable design contract](../../tavern-card-builder/references/variable-systems.md), including lifecycle and initialization evidence. Collection shape is declared independently of its initial contents:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "required": true },
      "amounts": { "type": "object", "additionalProperties": { "type": "number" } }
    }
  },
  "default": []
}
```

`items` describes every list element recursively. `properties` describes fixed object children; unlisted keys are rejected unless `additionalProperties` supplies a typed child descriptor. A record may use only typed `additionalProperties`; explain its key meaning in `description`. `additionalProperties: false` declares no extra keys. `properties: {}` deliberately describes an empty fixed object, not an unknown object. Bare `additionalProperties: true` does not establish a complete value shape.

Nested defaults are checked against these declarations, including required children and undeclared keys. This compact contract does not implement full JSON Schema or execute a runtime Zod schema. Represent only what it supports; check richer invariants against the actual runtime schema and record that separate evidence. `--allow-shallow` supports read-only inventory of older models but leaves `structureComplete: false`; it is not a schema acceptance pass. Do not invent defaults or infer future items from an empty list.

First-batch storage requires `scope: "message"`, a root beginning with `stat_data.`,
and `strategy: "multi-floor"`. Reject `same-floor` as `DBR-C8-UNVERIFIED`.

## Data fixture

Use:

```json
{
  "schemaVersion": 1,
  "modelId": "quest-ledger",
  "modelVersion": "1.0.0",
  "tables": {
    "quests": [
      { "id": "q1", "status": "open", "custom": "preserve me" }
    ]
  }
}
```

Preserve unknown tables, records, and fields unless an explicit destructive
migration names them.

## Migration format

Use:

```json
{
  "schemaVersion": 1,
  "modelId": "quest-ledger",
  "fromVersion": "1.0.0",
  "toVersion": "2.0.0",
  "allowDataLoss": false,
  "operations": [
    { "op": "rename-field", "table": "quests", "from": "status", "to": "state" },
    { "op": "add-field", "table": "quests", "field": "progress", "default": 0 }
  ]
}
```

Supported operations are `add-field`, `rename-field`, and `delete-field`.
`delete-field` requires both `allowDataLoss: true` and the CLI
`--allow-data-loss`. Applying the same migration twice must leave the second result
unchanged.

## Ownership

Name one writer per field. Derived values may have multiple readers but must not have
competing writers. Trace every field through initialization, update, prompt
projection, runtime read, UI render, persistence, and migration.

Bindings default to the `runtime` write phase. `initialization` and `migration` are separate, explicitly bounded phases with a `writeCondition`; they cannot run as alternate runtime writers. Within each field/phase only one owner is allowed. Multiple bindings for that same owner are entry points, not competing ownership. Verify phase exclusion in the real host.
