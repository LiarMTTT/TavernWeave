---
name: code-quality-workflow
description: >-
  End-to-end code quality workflow for evidence-backed code review, repository sweeps, refactor decisions, authorized minimal changes, and verification. Use when Codex needs to audit code or diffs, scan a codebase, triage cleanup or slimming requests, decide whether a local fix, staged refactor, or rewrite is justified, or implement and verify an explicitly authorized quality fix with scope and rollback controls.
---

# Code Quality Workflow

Before an authorized write, use `$consult-tavernweave-library` with the `code-quality-workflow` route and record the A0 receipt. When the last acceptance gap keeps expanding, read [references/finish-mode.md](references/finish-mode.md) and freeze one visible problem plus one exit condition.

Use one state machine for code-quality work:

```text
AUDIT -> SWEEP -> GATE -> CHANGE -> VERIFY
  |        |        |        |         |
  +--------+--------+--------+---------+--> REPORT / STOP
```

Skip `SWEEP` for a focused target. Stop after any read-only state when the request is only for analysis. Never treat a cleanup request as permission to edit.

## Non-negotiable rules

1. Prefer the simplest maintainable solution, the fewest changed files, the fewest new abstractions, and the fewest dependencies.
2. Start in `AUDIT` and remain read-only for review, audit, sweep, diagnosis, cleanup, slimming, or optimization requests that do not explicitly authorize implementation.
3. Treat `fix`, `apply`, `implement`, or equivalent language as authorization only for the named scope. Still complete `GATE` before editing.
4. Do not mix unrelated findings, formatting churn, dependency upgrades, renames, feature work, or opportunistic cleanup into a patch.
5. A rewrite is a hard stop. Emit `Rewrite Requires Approval`, provide evidence and a separate plan, and do not begin the rewrite in the same pass. Continue only after the user approves that plan explicitly.
6. Preserve existing project instructions, write channels, generated-file rules, release boundaries, and manual acceptance gates.
7. State unavailable checks and uncertain deletion safety as residual risk; never convert missing evidence into confidence.

## Route the request

| User intent | Start | Allowed outcome |
| --- | --- | --- |
| Review code, inspect a diff, find bugs, assess risk | `AUDIT` | Findings and verification gaps |
| Scan a repository, component set, or architecture surface | `AUDIT`, then `SWEEP` | Merged read-only report |
| Clean, slim, simplify, or optimize without a named approved patch | `AUDIT` | Evidence and a gate recommendation; no edits |
| Decide whether refactoring is warranted | `GATE` after gathering evidence | One gate decision per module |
| Fix or implement a named quality issue | `AUDIT`, then `GATE` | `CHANGE` only inside the authorized scope |
| Rewrite a module | `AUDIT`, then `GATE` | Stop with a rewrite plan and approval request |

When intent is ambiguous, choose the more conservative read-only route.

## State 1: AUDIT

Establish the target, inclusion and exclusion boundaries, relevant contracts, tests, schemas, configuration, call sites, and project-specific rules. Review in this order:

1. Correctness, data loss, security, crashes, broken contracts, state consistency, API misuse, and regressions.
2. Verification gaps and reachable edge cases.
3. Evidence-backed maintainability and slimming signals: duplication, dead code, compatibility paths, over-layering, patch stacking, state duplication, and generated noise.

Require a test, log, reproduction, measurement, contract contradiction, reachable failure path, divergent ownership, or verification-blocking structure. Ugliness alone is not evidence.

Lead with findings. Classify them as `P0` through `P3` and separate:

- `Must Fix Now`
- `Refactor Signals`
- `Slimming Opportunities`
- `Do Not Touch Yet`
- `Verification Gates`
- `Optimization Eligibility`

Read [references/audit-and-sweep.md](references/audit-and-sweep.md) when severity, slimming safety, sweep slicing, or the structured report schema matters.

## State 2: SWEEP

Use this state for broad, batch, or multi-surface audits. It is read-only.

1. Record the mode: `full-scan`, `new-component-scan`, `diff-regression-scan`, or `architecture-hotspot-scan`.
2. Record the root, included paths, and excluded generated, vendor, build, release, lock, and migration artifacts unless explicitly scoped.
3. Slice by module, component, ownership boundary, or risk surface. Give reviewers raw artifacts and forbid edits.
4. Keep the coordinating agent responsible for final severity, deduplication, and user-facing conclusions.
5. Merge structured reports deterministically:

   ```powershell
   python scripts/merge_audit_reports.py reports --format markdown
   ```

6. Send at most one selected candidate to `GATE` unless the user explicitly asks for a batch plan. Never send a batch directly to `CHANGE`.

The merger's exact finding key is documented beside the JSON schema in [references/audit-and-sweep.md](references/audit-and-sweep.md) and implemented by `finding_key()` in `scripts/merge_audit_reports.py`.

## State 3: GATE

Choose exactly one structural decision per module:

- `No Refactor`
- `Local Fix`
- `Refactor Backlog`
- `Rewrite Candidate`

Then choose exactly one execution decision:

- `Reject Optimization`
- `Local Fix Only`
- `Staged Refactor`
- `Rewrite Requires Approval`

Before allowing `CHANGE`, require all of the following:

- concrete evidence;
- an explicit behavior contract;
- the smallest safe next step;
- expected and forbidden files;
- a patch budget;
- a pre-change baseline;
- a verification gate;
- deletion safety when removal is involved;
- stop and rollback conditions;
- user authorization for the proposed implementation scope.

Default budgets are:

- `Local Fix Only`: one behavior path, normally 1-2 files, target under 80 changed lines.
- `Staged Refactor`: one module boundary per stage, target under 200 changed lines, external behavior unchanged, rollback path stated.
- `Rewrite Requires Approval`: no patch. Stop and request approval for the separate rewrite plan.

Budgets are review signals, not permission to expand. Split or re-gate work that exceeds them. Read [references/gate-change-verify.md](references/gate-change-verify.md) for threshold matrices, behavior-contract fields, deletion gates, and stop rules.

## State 4: CHANGE

Enter only after `GATE` permits the change and the user has authorized that exact scope.

1. Run the lowest relevant pre-change check, or record why it cannot run.
2. Apply one minimal change to one behavior path or approved module boundary.
3. Obey the scope lock: do not touch forbidden files or widen APIs, schemas, formats, routes, persisted data, compatibility paths, or dependencies unless the behavior contract names the change.
4. Before deleting code, check direct and dynamic references, routes, configuration, feature flags, plugin registries, exports, tests, docs, schemas, migrations, and generated ownership.
5. Inspect the actual patch scope:

   Use the preset selected by `GATE`:

   ```powershell
   python scripts/check_patch_scope.py --preset local-fix --fail-on-warning
   python scripts/check_patch_scope.py --preset staged-refactor --fail-on-warning
   ```

   Run only the command that matches the approved execution decision.

   Default live mode compares tracked files against `HEAD`, so staged and unstaged changes are combined in one view, and it also includes untracked files. In an unborn repository it safely combines staged and unstaged tracked churn instead of requiring `HEAD`. Use `--staged` for an index-only diagnostic check. Binary files remain in file counts but have unknown line churn and therefore produce a warning. Use `--no-untracked` only to omit untracked files from the default tracked comparison; the output records that reduced coverage. A final patch-budget pass must use the full default view: never omit staged, unstaged, or untracked changes merely because a user asks to ignore them. Reduced views cannot prove the final patch is in budget.
6. If evidence, contract, root cause, or required scope changes, stop and return to `GATE`.

## State 5: VERIFY

Run the smallest meaningful check first and escalate only as the risk requires:

1. Re-run the pre-change check or focused regression test.
2. Run any required build, lint, static analysis, integration, runtime, or manual acceptance gate.
3. Review the final diff using the `AUDIT` rules.
4. Re-run `check_patch_scope.py` against the final patch.
5. Separate pre-existing failures from failures caused by the patch.

Finish only when the evidence is addressed or explicitly deferred, the behavior contract remains true, required checks pass or gaps are named, the patch remains authorized and in budget, and the diff contains no unplanned churn.

If verification fails:

- narrow or roll back when the patch worsens the baseline;
- return to `AUDIT` when the root cause is unclear;
- return to `GATE` when the fix becomes an architecture decision;
- stop when a rewrite, new authority, or broader scope is required.

## Report contract

For a read-only request, report:

```text
Routing Decision
Findings
Refactor or Slimming Signals
Do Not Touch Yet
Verification Gaps
Gate Recommendation
Residual Risk
```

For an authorized change, report:

```text
Evidence and Gate Decision
Behavior Contract
Authorized Scope and Patch Budget
Pre-change Baseline
Change Summary
Verification Results
Final Scope Check
Residual Risk or Stop Reason
```

Never claim completion from document quality or static validation alone when the behavior requires runtime or manual acceptance.

## Resources

- Read [references/audit-and-sweep.md](references/audit-and-sweep.md) for taxonomy, deletion-safety review, sweep prompts, report schema, and deterministic merge rules.
- Read [references/gate-change-verify.md](references/gate-change-verify.md) for gate thresholds, behavior contracts, patch budgets, execution controls, and rollback rules.
- Use `scripts/merge_audit_reports.py` to merge JSON audit slices.
- Use `scripts/check_patch_scope.py` to inspect tracked, untracked, and binary patch scope.
- Run `python -m unittest discover -s tests -v` from this skill directory for the bundled script checks.
