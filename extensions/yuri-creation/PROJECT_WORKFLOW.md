# Direct GitHub development and releases

Use this ChatGPT workspace for implementation, checks and publication through the connected GitHub tools. No local Codex installation, separate upload agent or Drive-to-local synchronization is required. GitHub is the source of truth. Drive exports are optional backups and remain snapshots, not competing development copies.

## Branches and scope

- Repository: https://github.com/imbdsssity/TavernWeave-Yuri.
- Start ordinary work from the current yuri-dev commit on a short-lived feature branch. Publish the checked changes directly and open a PR into yuri-dev.
- Keep main for accepted releases. A merge or release to main requires the user's release/merge instruction; ordinary feature publication does not require another confirmation.
- Keep the old transfer-to-Yuri-agent-Skill repository frozen at its verified v1.2.0 checkpoint.
- Keep this extension under extensions/yuri-creation/. Preserve upstream licenses, notices and runtime inventories. Folder placement is not native plugin registration.

## One round

1. Fetch the target branch, inspect repository instructions and PROJECT_STATE.md, and record its exact commit. Recheck current write access and relevant branch rules when needed.
2. Implement the agreed bounded change. Check only the changed behavior and its material integrations. Update project state and regenerate PACKAGE_MANIFEST.json whenever extension files change.
3. Publish through the GitHub plugin. Use the verified base tree and exact changed paths so unrelated upstream files survive. For updates to an existing branch, require its expected head and a normal fast-forward; re-read and reconcile if the branch moved. Never force-push to hide a conflict.
4. Fetch the published commit and compare its tree/files with the checked workspace. Report the actual commit and PR URL. A successful local commit alone is not publication.
5. Open the PR into yuri-dev. Do not imply it has merged or a release has shipped. After an authorized merge/release, verify that resulting revision and use it as the next baseline.

One agent owns a given file set at a time. Repository handoff records retain completed work, evidence limits, deferred items and the next useful task. Human review stays in the conversation or PR; no manual Markdown worksheet is required.

## Upstream updates and exports

Follow docs/UPSTREAM_SYNC.md for every upstream synchronization: record the baseline, freeze and review a candidate, classify relevant changes, check Yuri callers, update the complete pin set, run scoped regressions and record actual results. Use scripts/upstream_sync.py for verification and a read-only candidate report. Handle adoption on a separate integration branch/PR and update both UPSTREAM.json and its authoring mirror only for the reviewed pin. Do not automatically replace yuri-dev with a newer upstream snapshot or label the entire fork MIT.

If a Drive export is requested, export the actual published revision with exact filenames and checksums. An older Drive patch must not be reapplied over newer GitHub work. Current repository/PR state takes precedence over previous publisher prompts and the superseded separate-agent upload process.
