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
| Gemini CLI / Task mode | `Gemini-plugin` | User-reported individual skill imports and discovery passed |

Codex uses the complete plugin folder and its native marketplace/manifest. The four wrappers and 23 base skills share packaged resources. Python is required for file export and Node for the upstream authoring router. Search/images use whatever host tools are actually available. Optional Claude compatibility metadata is retained but no new Claude runtime acceptance is claimed.

### DeepSeek Harness

Download `TavernWeave-Yuri-DSH-v0.5.0.tgz` from the [official GitHub release](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v0.5.0). In DSH Desktop, open Plugins → Add plugin → Install third-party plugin, select the tarball, enable the bundle, then choose **TavernWeave Yuri Workbench** in a new session. The complete tarball contains four Yuri workflows and 23 dependency skills; the small source integration folder alone does not contain these resources.

For CLI/Web profiles use `dsh plugin --profile <profile> add <tarball>`. See the [adapter guide](../../../host-adapters/dsh/plugin-yuri/README.md) and version-specific [acceptance contract](../../../host-adapters/dsh/yuri-plugin-contract.json). Built-in DSH search/sub-agent tools are not mounted by default. Other runtime versions need their own compatibility evidence.

### Gemini CLI and Task mode

Import each of these four skills individually from the complete `Gemini-plugin` folder:

- `skills/yuri-card-creator/SKILL.md`
- `skills/adapt-yuri-card/SKILL.md`
- `skills/post-to-yuri-card/SKILL.md`
- `skills/novel-excerpt-to-yuri-card/SKILL.md`

Keep `extensions/yuri-creation/` and the 23 base skills in the same accessible package. If the import mechanism copies only a selected wrapper, also make those sibling resources accessible and tell the agent their location. A wrapper alone is insufficient. There is no root `SKILL.md` entry.

The accepted Gemini environments do not support importing this bundle as a plugin. Skills are imported separately, so plugin-wide automatic handoffs are unavailable. Explicitly read each required canonical workflow or dependency from the complete package and continue from the saved records. Optional `GEMINI.md`, rule, agent and extension descriptors are compatibility resources; their presence is not evidence that the host loaded them. These limitations do not change the saved authoring policies or permit claims of automatic cross-host parity.

Gemini 在本轮验收环境中须分别导入四个技能。请保留完整共享文件夹；单独复制入口文件不足以运行。需要跨技能继续时，明确加载对应依赖并读取已有工作记录，不将插件级自动衔接记为已支持。

Full reported scope and exclusions: [2026-11-13 host acceptance](HOST_ACCEPTANCE_2026-11-13.md). None of these imports constitutes a new SillyTavern conversion or roleplay trial.

## Maintainer build

```text
python extensions/yuri-creation/scripts/build_host_plugin.py --repo <source-checkout> --ref <source-commit> --output <new-folder-outside-checkout> --emit-git-tree
python extensions/yuri-creation/scripts/build_host_plugin.py --repo <source-checkout> --ref <source-commit> --host gemini --output <another-new-folder-outside-checkout> --emit-git-tree
node scripts/build-yuri-dsh-plugin.mjs --out <release-assets-folder>
```

The builder reuses pinned upstream package helpers, exports committed blobs only, verifies the extension manifest and preserves licenses. Output is a folder, not an archive. It creates four small discovery wrappers from canonical frontmatter; canonical instructions/resources remain at `extensions/yuri-creation/`. Their English reasoning and existing Chinese interaction defaults are unchanged. All 23 upstream skills remain byte-identical. Existing upstream source manifests/installers remain unchanged in yuri-dev.

`native-tree-plan.json` beside the generated plugin describes a new distribution tree, including removal of source-only root folders. Its `expected_tree` is computed by Git with a temporary index; the real source index/ref are unchanged. Publish that exact tree to `yuri-plugin`, using the existing expected head if the channel already exists. Never force-push or merge the generated distribution back into yuri-dev/main. NATIVE_PLUGIN.json records the immutable source commit; the package and source versions must agree.

From any working directory, the packaged `extensions/yuri-creation/scripts/host_probe.py` checks entry/resource presence, runtime availability and source/authoring pins. It reports host discovery as unobserved; an agent cannot prove account installation by finding files. A fresh task selecting the native entry is the final host-discovery check.

Portable and Gemini outputs are separate generated trees. Gemini templates are maintained in `hosts/gemini/`, and its plan targets `Gemini-plugin`. The DSH adapter is source-compatible; preserve its history while merging source updates normally. Before publishing, use a clean committed checkout, verify the extension manifest, and publish exactly the checked source/artifacts. Release tag `yuri-v0.5.0` points to accepted `main`; package receipts record that immutable source commit.
