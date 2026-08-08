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
