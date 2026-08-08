# Floor and UI binding contract

## Runtime surface

Normal multi-floor support stores structured state under a message-floor MVU or
variable root. Exact APIs are version-sensitive; verify the installed declarations.
Pinned evidence includes:

- `Mvu.getMvuData({ type: "message", message_id })` for a message floor;
- `Mvu.replaceMvuData` for an explicitly authorized full replacement;
- `getVariables({ type: "message", message_id })` for general variables;
- updater functions for partial mutation;
- message edit, swipe, update, delete, and MVU update events for refresh.

Prefer updater functions or MVU event hooks. Do not directly mutate a stale snapshot
and assume it persisted.

## Binding format

Use:

```json
{
  "schemaVersion": 1,
  "modelId": "quest-ledger",
  "bindings": [
    {
      "id": "quest-state-hud",
      "surface": "status-bar",
      "table": "quests",
      "field": "state",
      "access": "read",
      "owner": "quest-status-renderer",
      "refreshEvents": ["MESSAGE_UPDATED", "MESSAGE_SWIPED"]
    }
  ]
}
```

Supported surfaces are `status-bar`, `control-center`, `script`, and `prompt`.
Access is `read`, `write`, or `read-write`. Each binding needs a stable ID, declared
table and field, owner, and at least one refresh event.

## Acceptance matrix

Require real SillyTavern evidence for:

1. new-chat initialization;
2. normal assistant update on a later floor;
3. edit and re-render;
4. swipe selection and isolation;
5. chat switch and return;
6. reload and persistence;
7. status-bar and control-center agreement;
8. migration from a prior saved fixture.

Do not add same-floor compatibility to this matrix until a separate C8 contract and
real-host proof exist.
