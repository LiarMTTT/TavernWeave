# Gate, Change, and Verify Reference

Use this reference after audit evidence exists and a module needs a structural decision, an authorized patch, or a verification and rollback plan.

## Structural decision matrix

| Signal | Default structural decision |
| --- | --- |
| No evidence beyond taste or formatting | `No Refactor` |
| One isolated `P2` | `No Refactor` or `Local Fix` |
| One localized `P1` with a clear fix | `Local Fix` |
| Any `P0` on a core path | Urgent `Local Fix`, then assess `Refactor Backlog` |
| Three or more `P2` findings in one module | `Refactor Backlog` |
| The same smell appears at least twice | `Refactor Backlog` |
| Multiple sources of truth | `Refactor Backlog` |
| A core flow depends on hidden ordering or global state | `Refactor Backlog` |
| Tests cannot isolate behavior because responsibilities are mixed | `Refactor Backlog` |
| A small fix requires broad unrelated edits | `Refactor Backlog` or `Rewrite Candidate` |
| A public contract cannot be stated without internal knowledge | `Refactor Backlog` |
| Incremental repair cannot state or verify behavior | `Rewrite Candidate` |

An urgent defect does not authorize an architecture rewrite. Identify the smallest immediate fix separately.

## Execution decision matrix

| Evidence | Execution decision |
| --- | --- |
| No concrete evidence, behavior contract, or verification path | `Reject Optimization` |
| One localized defect with focused verification | `Local Fix Only` |
| Repeated ownership, state, or threshold-crossing problems | `Staged Refactor` |
| Rewrite is needed to state or verify behavior | `Rewrite Requires Approval` |

Choose one structural decision and one execution decision per module. Do not merge unrelated findings into a single gate item.

## Patch budgets

| Execution decision | Default budget |
| --- | --- |
| `Reject Optimization` | No patch. Return to audit or gather evidence. |
| `Local Fix Only` | One behavior path, normally 1-2 files, target under 80 changed lines, no unrelated formatting or dependency upgrade. |
| `Staged Refactor` | One module boundary per stage, target under 200 changed lines, external behavior unchanged, rollback path stated. |
| `Rewrite Requires Approval` | No patch. Present evidence and a separate plan, then stop for explicit approval. |

A budget overrun requires a smaller stage or a new gate decision. It never grants permission to expand.

## Gate record

Record every gate in this form:

```text
Refactor Gate Decision
- Module:
- Structural decision: No Refactor | Local Fix | Refactor Backlog | Rewrite Candidate
- Execution decision: Reject Optimization | Local Fix Only | Staged Refactor | Rewrite Requires Approval
- Triggered thresholds:
- Evidence:
- Behavior contract:
- Smallest safe next step:
- Expected files:
- Forbidden files and changes:
- Pre-change baseline:
- Verification gate:
- Patch budget:
- Deletion safety:
- Rollback path:
- Deferred risks:
- Authorization status:
```

`Authorization status` must distinguish `read-only`, `approved local fix`, `approved refactor stage`, and `rewrite approval pending`. An audit, cleanup, or optimization request without explicit implementation language remains `read-only`.

## Behavior contract

Write the contract before editing. Include:

- Target behavior: what is fixed, preserved, or made verifiable.
- Inputs and outputs: values, return shapes, errors, side effects, events, UI states, files, or network calls.
- State ownership: the module that owns the source of truth.
- Compatibility: public APIs, schemas, formats, persisted data, migrations, browser or runtime constraints, and user-visible behavior.
- Intended change: the only observable behavior allowed to change.
- Verification: checks that prove the contract.
- Patch budget: expected file count and changed-line ceiling.
- Pre-change baseline: the lowest relevant existing check, or why it cannot run.
- Forbidden changes: files, APIs, generated artifacts, compatibility paths, unrelated formatting, and dependencies outside scope.

For a refactor, state explicitly that external behavior remains unchanged. If external behavior changes, use a bug-fix or feature-change contract instead.

Example:

```text
Preserve: parseConfig(input) output shape and documented error names.
Change: remove the duplicate normalization path behind the same output.
State owner: parser/config.ts.
Verification: existing parser tests plus one regression case.
Patch budget: Local Fix Only, parser module only, target under 80 changed lines.
Forbidden: CLI flags, config schema, generated documentation, dependency versions.
```

## Deletion gate

Deletion can proceed only when the audit deletion-safety review is complete and the behavior contract explains why observable behavior remains unchanged. Dynamic loading, exports, configuration, migrations, generated ownership, or tests left uncertain force `Do Not Touch Yet` or a new gate review.

## Change loop

1. Confirm the evidence and authorization status.
2. Freeze the behavior contract, expected files, forbidden scope, budget, baseline, verification gate, and stop conditions.
3. Run the pre-change baseline. Record pre-existing failures without repairing unrelated problems.
4. Apply the smallest approved change.
5. Inspect actual scope with `scripts/check_patch_scope.py`.
6. Run focused verification, then escalate only as the risk requires.
7. Audit the final diff for behavior drift and unplanned churn.
8. Stop when the contract is satisfied; do not spend remaining budget on extra cleanup.

## Scope lock

During `CHANGE`:

- Fix only the approved target.
- Do not rename or reformat unrelated code.
- Do not upgrade dependencies.
- Do not change APIs, schemas, formats, routes, persisted data, or compatibility behavior outside the contract.
- Do not mix formatting, renaming, feature work, test repair, and behavior changes.
- Record newly discovered issues as follow-ups instead of fixing them inline.

## Scope-check interpretation

Use a preset or explicit limits:

```powershell
python scripts/check_patch_scope.py --preset local-fix --fail-on-warning
python scripts/check_patch_scope.py --preset staged-refactor --forbid "dist/**"
python scripts/check_patch_scope.py --preset custom --max-files 3 --max-lines 120
```

The checker distinguishes known text churn from files whose line churn is unknown. In default live mode it compares tracked files against `HEAD`, combining staged and unstaged changes in one view, and includes untracked files. In an unborn repository it safely combines staged and unstaged tracked churn as a conservative fallback. It counts untracked text files as added lines and identifies likely binary, symbolic-link, or unreadable files as unknown. Git-reported binary changes are never counted as zero-line changes. Any unknown-line file produces a warning because the line budget cannot be proven. `--fail-on-warning` returns status 2 when warnings exist; without it, warnings remain advisory and status is 0.

Run `--staged` to inspect only the index; unstaged and untracked files remain outside that view. `--numstat-file` inspects only the supplied snapshot and cannot infer whether records were tracked or untracked. `--no-untracked` intentionally excludes working-tree untracked files while retaining the default combined tracked comparison, and the coverage note states that choice. These are diagnostic views only. The final patch-budget gate must use the default live view and must not exclude staged, unstaged, or untracked changes; there is intentionally no unstaged-only final-gate mode.

## Stop and rollback rules

Stop immediately when:

- evidence changes meaning;
- the root cause differs from the audited cause;
- verification needs unrelated modules to pass;
- the behavior contract must change;
- the patch exceeds budget without a new gate decision;
- deletion safety becomes uncertain;
- the diff contains broad formatting or unrelated cleanup;
- a rewrite appears necessary without separately approved rewrite work.

Roll back or narrow when the patch worsens the baseline or introduces a new failure. Split work when a local fix grows beyond one behavior path or when feature, formatting, rename, dependency, and test-repair changes become mixed.

Return to `AUDIT` when root cause is unclear. Return to `GATE` when a local fix becomes an architecture decision. Stop for user direction when new authority or a rewrite is required.

## Completion conditions

Complete the workflow only when:

- the evidence is addressed or explicitly deferred;
- the behavior contract remains true;
- actual scope remains authorized;
- the patch stayed within budget or was explicitly re-gated;
- required verification passed, or every gap is named as residual risk;
- pre-existing failures are separated from patch results;
- a final diff audit found no unplanned churn;
- runtime or manual acceptance is complete when the behavior requires it.
