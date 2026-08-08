# Security findings contract

## Report shape

Use schema version 1:

```json
{
  "schemaVersion": 1,
  "target": "relative or user-supplied target",
  "filesScanned": 0,
  "findings": [
    {
      "ruleId": "TWSEC-DOM-001",
      "severity": "high",
      "file": "relative/path.js",
      "line": 10,
      "column": 3,
      "message": "Untrusted HTML may reach innerHTML"
    }
  ],
  "summary": {
    "high": 0,
    "medium": 0,
    "low": 0,
    "byRule": {}
  }
}
```

Never add a captured credential value, full token, cookie, private URL, browser
storage value, or long code excerpt. A file and line are enough for review.

## Severity

- `high`: dynamic execution, credential-shaped literal, executable remote loader, or
  a direct high-impact sink without an evident inert-data boundary.
- `medium`: HTML insertion, wildcard messaging, sandbox relaxation, or suspicious
  regex shape requiring reachability review.
- `low`: version-sensitive, incomplete, or defense-in-depth condition with no proven
  untrusted path.

## Baseline comparison

Compare counts by `ruleId`. A current count greater than the approved baseline is a
regression. A reduced count does not prove the remaining instances are safe. Baseline
files are evidence snapshots, not suppression lists.

## Disposition

Use one disposition per finding: `confirmed`, `not-reachable`, `mitigated`,
`false-positive`, or `pending-runtime`. Record concise evidence and the verification
owner. Only a reviewed disposition may unblock a high finding.
