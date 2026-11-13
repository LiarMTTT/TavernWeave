# Reviewing and synchronizing TavernWeave

TavernWeave-Yuri is a specialized product distribution built on TavernWeave.
Its dependency revision is an immutable Git commit, not the product version and
not a promise to track upstream automatically. Run this procedure when an update
is requested or relevant upstream work is identified. It does not schedule or
perform unattended synchronization.

## 1. Record the integrated baseline

Read `UPSTREAM.json`, its full authoring mirror at
`skills/yuri-card-creator/assets/upstream.json`, `PROJECT_STATE.md`, and the current
source branch. Record source HEAD, integrated commit, upstream version, module
blobs, license/notices, inventory and the relevant existing host acceptance.
Start one temporary integration branch from current maintained source. Reuse
existing action authorization; review completion does not require another user
approval when the work is already authorized.

From the repository root:

```sh
python extensions/yuri-creation/scripts/upstream_sync.py verify --repo .
```

This checks the mirrored locks, authoring/source-library/packager commits and
blobs, independent Foreverse exporter pin, upstream skill inventory, protected
base resources, and canonical/discovery presence. A red check blocks pin adoption.
The script requires a complete Git source checkout, not an installed package.

## 2. Fetch and freeze a candidate

```sh
git fetch --no-tags https://github.com/LiarMTTT/TavernWeave.git main:refs/remotes/tavernweave/main
git rev-parse refs/remotes/tavernweave/main
python extensions/yuri-creation/scripts/upstream_sync.py review --repo . --candidate refs/remotes/tavernweave/main
```

Record the resolved full SHA and upstream release/version from the same commit.
Use that SHA for the rest of the review even if `main` moves. The helper compares
histories and classifies changes; it neither fetches nor executes candidate code,
changes locks nor copies files. An equal candidate means a verified no-update
decision. An older or diverged candidate needs an explicit explanation; do not
assume it is an upgrade. An unrelated history is an error.

## 3. Review new changes by responsibility

Inspect commit messages and actual diffs from integrated SHA to candidate SHA.
For each changed component record adopt / adapt / defer / irrelevant, its reason,
affected Yuri contracts and the tests it needs. Diff classification is a routing
aid, not a compatibility verdict.

| Surface | Review questions |
| --- | --- |
| Shared skills | Authoring/player agency, prompts/worldbooks, visual-reference methods, local prompt specifications, routing and referenced resource paths |
| Source and shared scripts | Source-unit/quote/record schemas, return values, error handling, library transactions and serializer boundaries |
| Host infrastructure | Packager interfaces, inventory, plugin manifests, DSH providers, Gemini templates, source/distribution differences and runtime requirements |
| Licenses/notices | New or changed terms, attribution and redistribution boundaries; upstream material is not relicensed by co-location |
| Product overlays | Four canonical workflows, wrappers, custom profiles, provenance, protected editing, source selection and image handoff must retain their responsibilities |

## 4. Check compatibility before adoption

Map each relevant change to actual callers: `shared/provenance.py`, `card_files.py`,
`novels.py`, `profiles.py`, creator/export helpers, `build_host_plugin.py`, the DSH
builder and maintained Gemini templates. Keep the original-only and source modes
separate; preserve unrelated fields/worldbook settings and evidence limitations.
Check path/schema compatibility and version-specific host constraints. Mark
unsupported migrations or behavioral changes as deferred instead of claiming
automatic compatibility. Source revision, dependency pin and host acceptance are
separate evidence.

## 5. Apply reviewed changes and update the complete pin set

Apply reviewed upstream commits/patches with normal Git history and three-way
conflict resolution. Preserve product overlays and all notices. Do not replace
the repository wholesale, copy a moving `main` snapshot, or rewrite distribution
branches as maintained source.

The current exporter requires every retained upstream skill subtree and root
license/notice to match the chosen baseline. Advancing the baseline therefore
requires reviewing that complete managed set, not importing one convenient file
and claiming the whole newer version. Intentional base modifications need an
explicit compatibility design before relaxing that guard.

Update these together from the exact reviewed candidate:

- `UPSTREAM.json`: TavernWeave commit/version, authoring module blobs,
  source-library commit/blob, host-packager commit/blob and integration review.
- The full mirrored `skills/yuri-card-creator/assets/upstream.json`.
- Managed source paths, inventories, host contracts/templates and caller code
  affected by the adopted changes. Regenerate native wrappers from canonical
  metadata if necessary. Keep source templates and generated root copies aligned.
- Leave the separately pinned Foreverse exporter untouched unless it has its own
  reviewed update and retained MIT notice.

Run `verify` again. Do not hand-edit hashes to bless mismatched or unreviewed code.
If the candidate equals the baseline, retain the commit and record that decision;
there is nothing to copy or invent as an upstream improvement.

## 6. Run only the relevant regressions

Use a cost-effective GPT testing agent when model assistance is needed. Choose
tests from the changed interfaces: lock/drift rejection; source records/quotes;
protected JSON/PNG/worldbook editing; custom policy binding; or package resource
paths/counting and host metadata. Unchanged upstream source needs no new narrative
conversion. Reuse existing synthetic fixtures; only use one authorized private
sample when such a material trial is actually necessary. Never restore withdrawn
cases or repeat the whole prior model/import/roleplay campaign.

For packaging changes, build portable, Gemini and DSH from the committed source,
check original notices, canonical/wrapper relationships and runtime pins. A build
does not establish fresh host installation, narrative quality or visual quality.
Standard repository CI remains the release gate; do not claim tests that did not
run. Preserve the prior release if a compatibility check fails.

## 7. Record, merge and publish

Save an immutable dated review under `docs/upstream-sync/`: baseline/candidate
SHAs and versions, categorized diff, adoption decisions, affected pins/callers,
actual checks/results and unresolved items. Link it from `UPSTREAM.json` and the
integration/release records; regenerate `PACKAGE_MANIFEST.json`. Human feedback
stays in the conversation or PR, not a worksheet the user must fill.

Merge through a normal PR and verify the published tree against the checked tree.
For an authorized release, build from the final `main` SHA, publish the namespaced
Yuri tag and artifacts/checksums, and advance the existing host channels normally.
The product version is independent of the upstream version. Retain prior tags
and releases for rollback; use a revert/new commit rather than a force push.
Delete temporary merged integration/release branches when permitted; keep the
five maintained source/installation channels.

## Review for 1.2.0

On 2026-11-13 both upstream `main` and upstream `v2.4.0` resolved to the already
integrated `f9863d2b05305457fe9ed8b0c5688d52aca400a5`. There are no newer shared
skill, script or host changes to adopt. The pin is retained and its metadata is
clarified; [the dated record](upstream-sync/2026-11-13.json) captures verification
and targeted checks. This conclusion is dated, not a claim about future upstream
state.
