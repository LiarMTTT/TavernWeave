# Persistent rewriting

## Resolve a real target before preview

Use the host's actual instruction discovery, not an arbitrary `agent.md` filename. The manager requires an absolute scope root and target; it never defaults to the real user's home.

- Codex client: resolve the active Codex home (including `CODEX_HOME`). Choose its first non-empty `AGENTS.override.md`, then `AGENTS.md`; a new default file is `AGENTS.md`.
- Codex workspace: resolve the intended project root and inspect the actual root-to-current-directory instruction chain. At the selected root, precedence is non-empty `AGENTS.override.md`, then `AGENTS.md`, then the configured `project_doc_fallback_filenames` in order. Read the effective host configuration, including applied overrides, and pass the confirmed list with `--fallback-names`; pass `[]` only when none are configured. The manager does not parse or guess the host's configuration layers. Do not create a higher-priority file that hides an existing fallback. Explain narrower rules that may affect descendants; root-file verification alone does not prove their behavior.
- Claude Code: use the existing host mapping's `CLAUDE.md` name. Client scope root is the actual Claude configuration home. For a workspace, an explicitly resolved `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` can be targeted; inspect imports and other loaded project rules and report conflicts rather than editing them. Do not claim that checking one file verifies the entire host chain.
- DSH: no persistent-file adapter in this release. Explain the unavailable feature and retain one-shot/task use where the skill can actually be loaded.

Codex discovery source: [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Host loading happens separately from writes; verify a fresh task before claiming persistence works in that host.

Claude discovery source: [How Claude remembers your project](https://code.claude.com/docs/en/memory). Check the actual loaded files and imports in a fresh session before reporting host activation.

## Commands

Run from this skill directory, replacing placeholders with the resolved absolute paths:

```sh
node scripts/manage-rewrite-policy.mjs --host codex --scope workspace --scope-root "<project-root>" --target "<effective-instruction-file>" --fallback-names '[]'
node scripts/manage-rewrite-policy.mjs --action preview --operation enable --host codex --scope workspace --scope-root "<project-root>" --target "<effective-instruction-file>" --fallback-names '[]'
```

`check` is the default. `preview` returns only the owned block diff, a review token, and objective target/discovery information. Present scope, target and this diff to the driver. After the driver approves that exact operation, reuse the token:

```sh
node scripts/manage-rewrite-policy.mjs --action enable --host codex --scope workspace --scope-root "<project-root>" --target "<effective-instruction-file>" --fallback-names '[]' --approved --expected-token "<preview-token>" --backup-dir "<approved-backup-directory>"
```

Use `--operation disable` for removal previews and `--action disable` for approved removal. For client scope use `--scope client` and the resolved host configuration home. `--approved` records the caller's authorization assertion; it is not cryptographic proof of human approval. Pass it only when driver authorization covers the displayed operation. Do not ask twice for an already reviewed and approved operation.

Both mutations require a current preview token and an explicit backup directory. The token binds action, host, scope, target, discovery, existing bytes and proposed bytes. Re-preview if the file or effective target changes. Check/preview create no files. Mutation uses a temporary sibling and a lock for atomic replacement; backups go to the explicit directory. User content outside the marked block is preserved, including the separator added when a file originally had no final newline.

When no user text follows the block, removal also removes its owned separator to restore the original unterminated bytes. If the user appended text after the block, retain that separator so removal never joins two unrelated user lines.

The first release preserves UTF-8 files, optional UTF-8 BOM, and their line endings. It refuses other or invalid encodings instead of silently converting a user's rule file. Restore from a recorded backup only after reviewing the current diff and obtaining authorization for that exact restoration.

Do not override invalid/duplicate markers, linked paths, unsupported names or mismatched scopes. Report the problem with a repair proposal. A same-scope outdated or edited block can be replaced after its concrete diff is approved; updates are not implicit permissions. Disabling a missing block is idempotent. Removing the last block may leave an empty rule file; do not delete user files as a side effect.

## State and evidence

Report task override (`inherit/on/off`) separately from each persistent file (`missing-file/missing-block/current/outdated/drifted/invalid-markers`). Unsupported or ambiguous discovery is an error, not an inactive state. A `current` block means its file matches the distributed policy; `hostLoading: not-verified` remains until an actual fresh-task test. Inspect both scopes when reporting an effective mode or removing one scope; never claim all rewriting stopped merely because one file was changed.

Installation copies this skill and its resources only. It must not invoke `enable`. A persistent rule affects future natural-language outputs, not existing files. A temporary task-off instruction takes precedence for the current task and is not saved to disk.
