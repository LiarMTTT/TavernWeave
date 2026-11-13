# Native host installation / 原生宿主安装

Yuri Card Workbench is distributed as a skills-only native plugin named `tavernweave-yuri`. It exposes the four yuri workflows with 23 unchanged TavernWeave dependency skills. Its generated `yuri-plugin` branch is a complete plugin folder; `yuri-dev` is the editable development source. Neither branch installs anything into your account automatically.

## ChatGPT Work in the browser

No local Codex installation is needed. A workspace administrator can import the GitHub marketplace:

1. Open **Admin > Plugins > Add > Import marketplace**.
2. Enter these values:

| Field | Value |
| --- | --- |
| Source | `https://github.com/imbdsssity/TavernWeave-Yuri` |
| Path | Leave empty; the marketplace is at repository root |
| Branch, tag, or commit | `yuri-plugin` for the development channel, or the published distribution commit for a fixed checkpoint |

3. Authorize GitHub read access if prompted. Review the import result, make the plugin available to your intended workspace role, and install/enable it in Plugins.
4. Start a new task with an available cheaper GPT model for this small discovery check, and send:

> List the four yuri workflows available from tavernweave-yuri. State the actual loaded source. Check available file tools and Python before exporting files. Do not generate a card yet.

Expected workflow names: `yuri-card-creator`, `adapt-yuri-card`, `post-to-yuri-card`, `novel-excerpt-to-yuri-card`. Use any plugin prefix returned by the host. The other 23 entries are packaged dependencies; no need to read all of them.

If you cannot see Admin/import controls, a workspace admin must perform that step. GitHub repository permissions do not grant workspace administration. Report the import error or missing entry in this conversation; no manual review document is needed. Public marketplace publication is a separate process and has not been performed.

Official references: [GitHub workspace import](https://learn.chatgpt.com/docs/enterprise/plugin-management), [plugin packaging](https://developers.openai.com/plugins/build/plugins), [supported plugin surfaces](https://learn.chatgpt.com/docs/plugins). Checked 2026-11-12. Workspace import policy, account installation, native discovery and successful script execution are separate states. A branch import follows later channel updates; use a fixed distribution commit when you want to review updates before adopting them.

## 本对话用户的操作

你使用浏览器版 ChatGPT Work，不需要在本机安装 Codex。请在包发布后，由工作区管理员进入插件管理的 GitHub 市场导入入口。仓库地址填写上表 Source，Path 留空，分支填 `yuri-plugin`；若要锁定版本，填本轮提供的分发提交号。按界面完成 GitHub 授权及角色可用范围设置，再安装或启用插件。

随后选择可用且费用较低的 GPT 模型，开一个新任务做这个小范围发现检查，发送：

> 请列出 tavernweave-yuri 插件当前实际可见的四个百合工作流，并说明加载来源。先确认文件工具及 Python 是否可用，暂时不要生成角色卡。

如果看不到管理员导入入口，需工作区管理员处理；把界面显示的错误或缺少的入口告诉本对话即可。仓库关联、插件导入、账号启用和新任务实际发现并不是同一件事。生成的包不会自动开启搜索、图片、Google Drive 或 GitHub 权限，也不会修改全局指令。

## Accepted hosts and limits / 宿主与限制

| Host | Distribution | Acceptance |
| --- | --- | --- |
| Codex / ChatGPT Work | `yuri-plugin` | User-reported 0.5.0 import and four-skill discovery passed |
| DeepSeek Harness | `DSH-plugin`, or official release DSH `.tgz` | User-reported 0.5.0 import/discovery passed; contract scopes DSH 0.2.2-rc.1 |
| Gemini CLI | `main` or `Gemini-plugin` | User-reported extension installation and bundled skill discovery passed |
| Gemini Task mode | `Gemini-plugin` | User-reported individual skill imports and discovery passed |

Codex uses the complete plugin folder and its native marketplace/manifest. The four wrappers and 23 base skills share packaged resources. Python is required for file export and Node for the upstream authoring router. Search/images use whatever host tools are actually available. Optional Claude compatibility metadata is retained but no new Claude runtime acceptance is claimed.

### DeepSeek Harness

Download `TavernWeave-Yuri-DSH-v1.2.0.tgz` from the [official GitHub release](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v1.2.0). In DSH Desktop, open Plugins → Add plugin → Install third-party plugin, select the tarball, enable the bundle, then choose **TavernWeave Yuri Workbench** in a new session. The complete tarball contains four Yuri workflows and 23 dependency skills; the small source integration folder alone does not contain these resources.

For CLI/Web profiles use `dsh plugin --profile <profile> add <tarball>`. See the [adapter guide](../../../host-adapters/dsh/plugin-yuri/README.md) and version-specific [acceptance contract](../../../host-adapters/dsh/yuri-plugin-contract.json). Built-in DSH search/sub-agent tools are not mounted by default. Other runtime versions need their own compatibility evidence.

### Gemini CLI extension

Install the entire bundle once from a system terminal:

```sh
gemini extensions install https://github.com/imbdsssity/TavernWeave-Yuri --ref main
gemini extensions list
```

`main` now includes the root `gemini-extension.json`, `GEMINI.md`, four `skills/<workflow>/SKILL.md` wrappers and the complete shared resources. The generated `Gemini-plugin` branch is also supported: replace `main` with `Gemini-plugin` in the command. Restart Gemini CLI after installation or updates. In a CLI session, run `/skills list` to check the four yuri entries and 23 TavernWeave dependency skills. The CLI discovers bundled skills automatically and the agent activates the relevant workflow when needed; discovery does not guarantee every subsequent workflow step was executed.

For an existing extension installation, run `gemini extensions update tavernweave-yuri`, then restart Gemini CLI. Updates follow the source ref used at installation. If migrating from standalone skills, remove duplicate same-name skill installations so they do not shadow the extension entries. Keep the full extension directory: the wrappers load canonical instructions under `extensions/yuri-creation/` and use the sibling dependency skills. File export still needs host file access, Python and Node. No MCP server or API key is required by this extension.

For a local source checkout, `gemini extensions link <checkout-path>` links that directory for development. A folder supplied by Git or a downloaded archive remains the complete bundle, not four isolated wrappers.

Official references (checked 2026-11-13): [Build extensions](https://geminicli.com/docs/extensions/writing-extensions/), [install/update/link and manifest reference](https://geminicli.com/docs/extensions/reference/), [manage Agent Skills](https://geminicli.com/docs/cli/using-agent-skills/). The user's successful re-import from `Gemini-plugin` establishes Gemini CLI extension installation and skill discovery; it supersedes the earlier CLI per-skill-only limitation. It does not establish a new card conversion, automatic multi-step execution or Task mode extension support.

### Gemini Task mode: individual skills

The accepted Task mode setup still imports these skills individually from the complete `Gemini-plugin` folder:

- `skills/yuri-card-creator/SKILL.md`
- `skills/adapt-yuri-card/SKILL.md`
- `skills/post-to-yuri-card/SKILL.md`
- `skills/novel-excerpt-to-yuri-card/SKILL.md`

Keep `extensions/yuri-creation/` and the 23 base skills accessible. If the import copies only one wrapper, also make its sibling resources accessible and tell the agent their location. Explicitly load each required dependency and continue from saved casework when the host does not hand off automatically. There is no root `SKILL.md` entry. The new Gemini CLI acceptance does not change the Task mode acceptance scope.

Gemini CLI 可一次安装完整扩展并自动发现技能；Task 模式保留逐项导入方式，两者均须保留共享文件。若过去导入过同名独立技能，迁移时先移除重复入口，再检查扩展中的技能来源。

Full reported scope and exclusions: [2026-11-13 host acceptance](HOST_ACCEPTANCE_2026-11-13.md). None of these imports constitutes a new SillyTavern conversion or roleplay trial.

## Maintainer build

```text
python extensions/yuri-creation/scripts/build_host_plugin.py --repo <source-checkout> --ref <source-commit> --output <new-folder-outside-checkout> --emit-git-tree
python extensions/yuri-creation/scripts/build_host_plugin.py --repo <source-checkout> --ref <source-commit> --host gemini --output <another-new-folder-outside-checkout> --emit-git-tree
node scripts/build-yuri-dsh-plugin.mjs --out <release-assets-folder>
```

The builder reuses pinned upstream package helpers, exports committed blobs only, verifies the extension manifest and preserves licenses. Output is a folder, not an archive. It creates four small discovery wrappers from canonical frontmatter; canonical instructions/resources remain at `extensions/yuri-creation/`. Their English reasoning and existing Chinese interaction defaults are unchanged. All 23 upstream skills remain byte-identical. The legacy 23-skill install manifest remains scoped to the base; four additional native wrappers expose the canonical Yuri workflows from main. The Yuri builder validates the unchanged base using the pinned upstream helpers, excluding only those four wrappers. CI builds the original upstream packages from the pinned base commit and the complete Yuri packages from current HEAD.

`native-tree-plan.json` beside the generated plugin describes a new distribution tree, including removal of source-only root folders. Its `expected_tree` is computed by Git with a temporary index; the real source index/ref are unchanged. Publish that exact tree to `yuri-plugin`, using the existing expected head if the channel already exists. Never force-push or replace source with a generated distribution tree. When integrating distribution history, preserve source-only files and merge only the maintained adapter changes and native entry wrappers. NATIVE_PLUGIN.json records the immutable source commit; the package and source versions must agree.

From any working directory, the packaged `extensions/yuri-creation/scripts/host_probe.py` checks entry/resource presence, runtime availability and source/authoring pins. It reports host discovery as unobserved; an agent cannot prove account installation by finding files. A fresh task selecting the native entry is the final host-discovery check.

Portable and Gemini outputs are separate generated trees. Gemini templates are maintained in `hosts/gemini/`, and its plan targets `Gemini-plugin`. The DSH adapter is source-compatible; preserve its history while merging source updates normally. Before publishing, use a clean committed checkout, verify the extension manifest, and publish exactly the checked source/artifacts. Release tag `yuri-v1.2.0` identifies the official product source; package receipts record that immutable source commit.

## Version 1.0.0

The official 1.0.0 distributions include supported custom profiles and reference-led image adaptation. Historical host import/discovery acceptance above remains 0.5.0 evidence; no new host test was requested. Check NATIVE_PLUGIN.json.source_commit and host_probe.py package_source_commit to identify the installed generated source separately from pinned dependency versions. SOURCE.json in the release records source and generated package trees. Existing installations following a distribution branch receive its new package when updated through the host.

## Version 1.2.0

The product is a specialized TavernWeave distribution. See ARCHITECTURE.md for canonical/workflow/wrapper/module counts and UPSTREAM_SYNC.md for reviewed upstream adoption. Portable/Gemini receipts expose 4 canonical workflows, 4 discovery wrappers, 23 dependencies and 27 discoverable entries; DSH directly registers 4 canonical workflows plus 23 dependencies with no wrappers. SOURCE.json records the product source, upstream version/commit and review decision. This metadata is not a new native-host acceptance claim.
