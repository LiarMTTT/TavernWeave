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
  "schemaVersion": 2,
  "snapshotVersion": "2026-08-18",
  "routeIds": ["tavern-card-builder"],
  "standing": ["ST-A0"],
  "documents": ["ST-A2", "ST-B1"],
  "domains": ["design", "motion"],
  "catalogSummary": {"design": 462, "motion": 194, "wiki": 86, "ledger": 1609},
  "candidates": [{"id": "design:d4-example", "state": "proposed"}],
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
  "snapshotVersion": "2026-08-18",
  "items": ["design:wiki-visual", "motion:css-vt"]
}
```

An implementation authority must separately promote a candidate. Selection cannot install a dependency, approve a license, alter a card, or close an acceptance item.

The full catalog is an asset, not a prompt payload. Query it deterministically with a narrow intent and bounded result count:

```powershell
node <skill-root>/scripts/query-library.mjs --skill consult-tavernweave-library --intent "玻璃 HUD 移动端" --domain design,ledger --limit 6
```

The 243 AFV screening receipts are source-side audit inputs. TavernWeave stores only their aggregate counts and the resulting public catalogs; it does not distribute the inbox JSON files.

## Creative pieces and technical events

Match explicit in-card creative phrases to the builder. A plot event is different
from an API event listener; a bare ambiguous "事件" does not choose the API route.
Conjunctions in a mixed request may legitimately return several specialist route IDs.
The result is a matched-route list, not a claim that every task has one primary owner.
Explicit `--skill` and existing work-library and sandbox exceptions retain priority.
The newbie-guide JSON is a generated mirror of this route map, not a second matcher.
