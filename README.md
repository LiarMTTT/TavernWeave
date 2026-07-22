# TavernWeave

TavernWeave is a publishable Codex plugin containing focused Agent Skills for SillyTavern rolecard authoring, modular sources, build and release pipelines, runtime debugging, embedded UI work, workshop operations, and evidence-driven code quality.

The repository is the canonical public source. Project-specific skills and production coordinates stay in private workspaces and are never copied into Git history.

## Included skills

- `tavern-card-builder` — design and author text or MVU rolecards.
- `sillytavern-card-components` — safely decompose and maintain modular card sources.
- `sillytavern-card-pipeline` — assemble, validate, package, and release cards.
- `sillytavern-api-reference` — verify scripting APIs, events, macros, and runtime facts.
- `sillytavern-runtime-debug` — reproduce and close issues in a real SillyTavern runtime.
- `sillytavern-embedded-ui` — design and review opening pages, status bars, control centers, and dialogs.
- `code-quality-workflow` — audit, gate, improve, and verify code without speculative rewrites.
- `shadcn-tailwind-ui` — build accessible React interfaces with shadcn/ui, Radix, and Tailwind.
- `rolecard-workshop-ops` — operate a configurable rolecard workshop publishing chain.

## Why this is an array

`tavern-card-builder` is the authoring front door. It delegates exact API facts,
component ownership, packaging, runtime evidence, embedded UI, and infrastructure to
focused skills. Keeping those boundaries separate reduces trigger ambiguity and keeps
read-only diagnosis, local implementation, release, and production deployment from
silently granting one another authority.

The public migration is:

| Previous private input | Public result |
| --- | --- |
| `card-components` | `sillytavern-card-components` |
| `card-workflow` | `sillytavern-card-pipeline` |
| Four code audit/optimization/refactor skills | `code-quality-workflow` |
| `tavern-card-builder` | Upgraded public authoring front door |
| `sillytavern-helper-dev` | `sillytavern-api-reference` for exact runtime facts |
| `sillytavern-browser-debug` | `sillytavern-runtime-debug` |
| `ui-review` | `sillytavern-embedded-ui` |
| `ui-styling` | Clean public derivative `shadcn-tailwind-ui` |
| Workshop backend and Gateway runbooks | Clean public derivative `rolecard-workshop-ops` |
| Project-specific development adapters | Remain private; reusable rules live in the focused public skills |

## Install for local development

Clone the repository at the personal-marketplace source path:

```powershell
$sourceRoot = Join-Path $env:USERPROFILE 'plugins\tavernweave-agent-skills'
if (Test-Path -LiteralPath $sourceRoot) { throw "Target already exists: $sourceRoot" }
git clone -- https://github.com/LiarMTTT/TavernWeave.git $sourceRoot
Set-Location $sourceRoot
powershell -File scripts/register-local.ps1
codex plugin add tavernweave-agent-skills@personal
```

`register-local.ps1` creates or updates only this entry in the default personal
marketplace at `%USERPROFILE%\.agents\plugins\marketplace.json`; it preserves other
entries. If the checkout lives elsewhere, create a directory junction at
`%USERPROFILE%\plugins\tavernweave-agent-skills` first.

After editing an already installed plugin, refresh the Codex cachebuster and reinstall:

```powershell
powershell -File scripts/bootstrap-dev.ps1
& .\.private\venv\Scripts\python.exe `
  "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\update_plugin_cachebuster.py" `
  .
codex plugin add tavernweave-agent-skills@personal
```

Start a new Codex task before evaluating changed skill triggers.

## Repository rules

- Keep `SKILL.md` frontmatter to `name` and `description` only.
- Keep skill packages free of READMEs, changelogs, release notes, and project incident logs.
- Put repository-facing documentation at the repository root.
- Keep API navigation pinned to public upstream commits; verify exact runtime facts against the installed versions.
- Never commit production endpoints, credentials, private absolute paths, or private project data.
- Treat offline validation as preparation; real runtime behavior still requires real SillyTavern acceptance.
- Re-run the manual forward cases and refresh their skill fingerprints after changing a skill package.

After every case in `tests/replay/` has been rerun with fresh agents, record that
confirmation with `powershell -File scripts/refresh-replay-fingerprints.ps1 -ConfirmedManualReplay`.
The release validator rejects stale fingerprints.

Run `powershell -File scripts/validate-release.ps1` before packaging. For the official Codex validators, run `scripts/bootstrap-dev.ps1` once and then `scripts/validate-with-codex-tools.ps1`. Run `powershell -File scripts/package-release.ps1` only after validation passes.

## License

TavernWeave-authored material is available under the
[PolyForm Noncommercial License 1.0.0](LICENSE). Personal study, research,
experimentation, hobby projects, and other noncommercial uses are permitted
under its terms. Commercial use is not granted and requires separate written
permission from the copyright holder.

This repository is source-available, not OSI Open Source. Independent upstream
projects keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 中文说明

本仓库是 TavernWeave 公共 skill 阵列的唯一真相源。项目专属适配、创意工坊生产坐标以及个人内置数据继续留在私有工作区；公开版只保留通用流程、配置合同和安全门。更新公开版时必须先通过脱敏、许可、结构与真实任务回放检查。TavernWeave 原创内容采用 PolyForm Noncommercial 1.0.0：允许个人与其他非商用用途，商业使用需另行取得书面授权。
