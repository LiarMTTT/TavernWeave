# Audit and Sweep Reference

Use this reference when the `AUDIT` or `SWEEP` state needs consistent evidence, severity, slimming, slicing, or structured-report rules.

## Evidence standard

Report a finding only when at least one condition holds:

- A test, build, lint run, static scan, runtime log, user reproduction, or performance measurement proves the issue.
- Source contradicts an explicit contract, type, schema, API, or test.
- A reachable call path demonstrates the failure mode.
- State or behavior is duplicated in a way that can diverge.
- A reachable boundary condition is missing.
- A module's structure prevents focused verification of a core behavior.

Do not infer a defect from style preference or unfamiliar code shape alone.

## Severity

| Severity | Meaning |
| --- | --- |
| `P0` | Data loss, security exposure, permanent corruption, a crash on normal use, or an unshippable release blocker with no safe workaround. |
| `P1` | Incorrect core behavior, a broken public contract, a high-confidence regression, or missing required error handling on a critical path. |
| `P2` | Non-blocking correctness or maintainability risk: fragile ordering, duplicated logic, unclear state ownership, missing edge handling, weak verification, or an overly broad responsibility. |
| `P3` | Small, relevant cleanup with low risk and obvious benefit. Avoid flooding a focused review with `P3` items. |

Use these report sections:

- `Must Fix Now`: confirmed `P0` and `P1` defects.
- `Refactor Signals`: evidence that may cross a gate threshold.
- `Slimming Opportunities`: reductions whose behavior impact can be reasoned about.
- `Do Not Touch Yet`: stable code with insufficient evidence, uncertain compatibility paths, generated code, or out-of-scope areas.
- `Verification Gates`: checks required before trusting a change.
- `Optimization Eligibility`: `Reject Optimization`, `Needs Gate`, or `Eligible for Gate Review`.

## Slimming taxonomy

- `Dead Code`: no direct imports, call sites, public exports, routes, configuration references, feature flags, tests, plugin registration, or dynamic loading evidence.
- `Duplicate Logic`: equivalent behavior exists in multiple places. A direct fix is low risk only when one canonical path and its verification gate are clear.
- `Compatibility Path`: a legacy adapter, fallback, migration path, runtime branch, or old API surface that may still be contractual.
- `Over-layering`: a wrapper or abstraction with one caller and no independent semantic boundary.
- `Patch Stacking`: sequential fixes compensate for absent ownership, an unclear lifecycle, or a missing contract.
- `State Duplication`: more than one module owns the same domain state or derived truth.
- `Generated Noise`: generated, vendored, build, release, migration, lock, or packaged artifacts that should normally be excluded.

Only low-risk `Dead Code` and low-risk `Duplicate Logic` can become direct local-fix candidates. Route all other classes through `GATE` or mark them `Do Not Touch Yet`.

## Deletion-safety review

Before recommending deletion:

1. Search direct imports and call sites.
2. Search dynamic references, string loaders, route tables, configuration keys, feature flags, public exports, plugin registries, and reflection hooks.
3. Check tests, documentation, schemas, migrations, package manifests, and public API surfaces that may encode the contract.
4. Confirm the candidate is not generated, vendored, built, released, migrated, or locked output.
5. State why externally observable behavior remains unchanged.
6. Name the smallest verification gate that covers the deletion risk.

If any check is uncertain, use `Do Not Touch Yet` or return the item to `GATE`.

## Sweep modes

- `full-scan`: inspect a repository, package, or directory tree for its highest risks.
- `new-component-scan`: inspect newly added or heavily changed components before adoption.
- `diff-regression-scan`: inspect recent changes for behavior regressions, boundary mistakes, and missing verification.
- `architecture-hotspot-scan`: inspect state ownership, sources of truth, dependency direction, public contracts, and core flows.

Split work by independent module, component, ownership boundary, or risk surface. Prefer a small number of independent read-only reviewers and increase parallelism only when slices do not overlap. Do not have reviewers edit files or receive expected conclusions.

## Slice prompt

```text
Use $code-quality-workflow in read-only AUDIT mode.

Mode: <full-scan | new-component-scan | diff-regression-scan | architecture-hotspot-scan>
Target: <path, diff, or raw artifact>
Focus: <correctness | regression risk | component readiness | architecture boundaries>
Project instructions: <active local rules>

Do not edit files. Report Must Fix Now, Refactor Signals, Slimming Opportunities,
Do Not Touch Yet, Verification Gates, and Optimization Eligibility. Include a
behavior field when two findings with the same title affect different behavior.
For a gate candidate, include evidence, behavior-contract hints, patch budget,
pre-change baseline, verification gate, deletion safety, and forbidden scope.
```

For architecture hotspots, explicitly inspect hidden global state, ownership duplication, dependency direction, contract leakage, and whether core behavior can be verified locally. Do not suggest a rewrite unless evidence crosses the rewrite threshold.

## Structured JSON report

Use this shape when reports will be merged:

```json
{
  "target": "src/example.ts",
  "mode": "diff-regression-scan",
  "findings": [
    {
      "severity": "P1",
      "category": "Must Fix Now",
      "file": "src/example.ts",
      "line": 42,
      "title": "State update can be lost",
      "behavior": "Concurrent updates to the saved record",
      "evidence": "The second writer replaces the first writer's fields",
      "risk": "Persisted data loss",
      "recommendation": "Serialize updates at the existing owner",
      "verification": "Run the focused concurrent-update test"
    }
  ],
  "refactor_signals": [
    {
      "module": "src/example.ts",
      "threshold": "Three P2 findings in one module",
      "evidence": "Ownership, ordering, and verification findings share one cause"
    }
  ],
  "slimming_themes": [
    {
      "pattern": "Duplicate Logic",
      "occurrences": 2,
      "suggested_handling": "Gate a staged consolidation after contract checks"
    }
  ],
  "verification_gates": [
    {
      "check": "npm test -- example",
      "scope": "Behavior under review"
    }
  ],
  "optimization_handoffs": [
    {
      "module": "src/example.ts",
      "evidence": "Concrete failure or threshold result",
      "threshold": "Local Fix",
      "suggested_gate_mode": "Local Fix Only",
      "behavior_contract_hints": "Preserve the public update result",
      "patch_budget": "One behavior path, 1-2 files, target under 80 changed lines",
      "pre_change_baseline": "npm test -- example",
      "verification_gate": "npm test -- example",
      "deletion_safety": "Not applicable",
      "forbidden_scope": "Do not change the public API or generated files"
    }
  ]
}
```

All collection fields are optional and default to empty collections. A supplied collection must be a JSON array of objects.

## Deterministic merge rules

`scripts/merge_audit_reports.py` applies these exact rules:

1. Deduplicate findings by the four-part key `(file, line, title, behavior)` after normalization. Severity is deliberately excluded so duplicate reports with different severity can collapse and retain the highest severity.
2. Normalize `file` by trimming surrounding whitespace, converting backslashes to forward slashes, collapsing repeated slashes, and removing leading `./`; preserve case.
3. Normalize a numeric `line` to its integer string. Otherwise trim and collapse whitespace.
4. Normalize `title` and `behavior` by trimming, collapsing whitespace, and Unicode case-folding. Missing `behavior` becomes an empty string.
5. When duplicates disagree, keep the highest-severity record and fill only its missing or empty fields from the lower-severity record. For equal severity, keep the first record and fill its missing fields from the later one.
6. Deduplicate auxiliary records with normalized text keys:
   - refactor signals: `(module, threshold, evidence)`;
   - slimming themes: `(pattern, occurrences, suggested_handling)`;
   - verification gates: `(check, scope)`;
   - optimization handoffs: `(module, evidence, threshold, suggested_gate_mode)`.
7. Preserve the first occurrence order for targets and auxiliary records. Sort modes and findings deterministically; findings sort by severity, file, line, title, then behavior.
8. Keep immediate defects, backlog signals, slimming themes, verification gates, and optimization handoffs in separate collections.

Do not merge unrelated cleanup themes into one handoff. Select and gate one execution candidate unless the user explicitly requests a staged batch plan.
