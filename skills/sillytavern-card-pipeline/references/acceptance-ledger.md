# Acceptance evidence ledger

Track evidence against the capability added by the active slice. A green test is relevant only when its object, environment, and claim match the acceptance item.

## Record shape

```json
{
  "id": "ACC-001",
  "capability": "Observable behavior being accepted",
  "object": "exact artifact, component, page, or card version",
  "gate": "automated",
  "environment": "named tool/runtime/device and version",
  "procedure": "repeatable steps or command",
  "expected": "observable result",
  "evidence": ["repo-relative report, screenshot label, hash, or log summary"],
  "status": "passed",
  "limitations": ["what this evidence does not prove"],
  "owner": "automation",
  "recordedAt": "YYYY-MM-DD"
}
```

Allowed gates are `source`, `automated`, `offline-artifact`, `browser`, `real-sillytavern`, `human`, and `release`. Allowed statuses are `planned`, `blocked`, `failed`, `passed`, and `driver-accepted`.

Automation must not emit `driver-accepted`. A gate can depend on earlier evidence, but cannot inherit its meaning:

```text
source checks -> deterministic tests -> artifact checks -> browser/desktop checks
              -> real SillyTavern checks -> human acceptance -> release authorization
```

## Relevance test

An evidence item is relevant only when all are true:

- it exercised the capability introduced by the current slice;
- it used the named object, not a stale artifact with the same title;
- its environment is recorded when behavior is host-dependent;
- its expected observation is specific enough to fail;
- its limitations explicitly preserve every higher or different gate.

Examples of invalid closure:

- API 200 used as proof that an embedded UI rendered and remained interactive;
- Node regex fixture used as proof of SillyTavern placement, swipe, or prompt behavior;
- generated PNG used without verifying the loaded iframe runner name and card identity;
- desktop screenshot used as proof of keyboard, mobile, reduced-motion, or screen-reader behavior;
- a package hash used as permission to publish.

## Handoff

Every implementation handoff lists passed, failed, blocked, and untested items separately, then names the next gate and authority required to cross it.
