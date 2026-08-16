# Material-to-entry provenance

Long source material is evidence, not automatically canonical card content. Build a trace from source fragments to claims and only then to target entries.

## Four-stage chain

```text
material fragment -> setting claim -> target entry/component -> review evidence
```

Every stage uses a stable ID. A target entry may cite several claims; a claim may cite several fragments. Summaries must retain the source fragment IDs that support them.

## Material record

```json
{
  "id": "MAT-001",
  "title": "Source title",
  "sourceType": "user-file",
  "locator": "repo-relative/path-or-user-visible-label",
  "contentHash": "sha256:...",
  "license": "private-user-material",
  "privacy": "project-private",
  "authority": "reference",
  "notes": "What this source can and cannot establish"
}
```

Do not put private absolute paths, credentials, signed URLs, full chat exports, or secret identifiers in a public authority document. For private sources, store a repo-relative locator or stable label and a hash.

## Claim record

```json
{
  "id": "CLM-001",
  "statement": "Atomic setting statement",
  "state": "proposed",
  "sourceFragments": ["MAT-001#L10-L18"],
  "confidence": "high",
  "conflicts": [],
  "targetEntries": ["ENT-001"]
}
```

Allowed claim states are `extracted`, `proposed`, `confirmed`, `rejected`, and `superseded`. Extraction never implies confirmation. Only explicit driver approval moves a claim to `confirmed`.

## Entry record

```json
{
  "id": "ENT-001",
  "kind": "worldbook",
  "title": "Stable entry title",
  "claimIds": ["CLM-001"],
  "status": "planned",
  "recipient": "plot-model",
  "sourcePath": "source/worldbook/entry.md",
  "acceptanceIds": ["ACC-001"]
}
```

Keep material extraction, creative reconciliation, entry authoring, and independent review as separate passes. When two sources conflict, preserve both claims and record the resolution; do not blend them into an invented compromise.

## Review questions

Before authoring an entry, verify:

1. Does every nontrivial claim name at least one source fragment or an explicit driver decision?
2. Is the claim atomic enough to reject without rejecting unrelated facts?
3. Does the target entry have one clear model/runtime owner?
4. Are inferred bridges labeled as inference rather than quoted fact?
5. Can the entry be regenerated without rereading the entire source corpus?
6. Does review prove fidelity, contradictions, omissions, privacy, and prompt budget separately?
