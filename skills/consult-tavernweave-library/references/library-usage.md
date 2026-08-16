# Library routing and receipts

## Routing semantics

`route-map.json` is the route authority. Each route names a TavernWeave skill, intent terms, stable ST guide IDs, optional knowledge domains, and exclusions.

The router combines three signals:

1. explicit `--skill`, when supplied;
2. normalized intent-term matches;
3. `--write`, which prepends the standing A0 record.

The script returns paths, never full document bodies. The agent reads those paths progressively. A route hit does not authorize a write or make experimental guidance stable.

## Receipt

```json
{
  "schemaVersion": 1,
  "snapshotVersion": "2026-08-16",
  "routeIds": ["tavern-card-builder"],
  "standing": ["ST-A0"],
  "documents": ["ST-A2", "ST-B1"],
  "domains": ["design", "motion"],
  "experimentalIncluded": false,
  "selectionState": "proposed",
  "unresolved": ["target runtime API evidence"]
}
```

For write work, omission of `ST-A0` is a routing failure. For read-only exact API lookup, A0 is not mandatory unless the task becomes a change.

## Candidate selection

A picker export has this shape:

```json
{
  "schemaVersion": 1,
  "kind": "tavernweave-library-selection",
  "state": "proposed",
  "snapshotVersion": "2026-08-16",
  "items": ["design:wiki-visual", "motion:css-vt"]
}
```

An implementation authority must separately promote a candidate. Selection cannot install a dependency, approve a license, alter a card, or close an acceptance item.
