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

## Other hosts

The package includes the current portable `plugin.json`, a Codex compatibility manifest and a Claude skills-only manifest/marketplace. Use the host's actual plugin installation mechanism against the complete generated folder or distribution branch. Do not install isolated wrapper directories as standalone skills: their shared runtime and authoring dependencies live elsewhere in the same plugin folder.

There are no hooks, MCP server, credentials or startup service in this plugin. Host-native search/images remain optional; Python is needed for file export, and Node is needed for the upstream deterministic authoring router. Missing capabilities must be reported rather than inferred from successful installation. The inherited DSH/Antigravity resources are dependency documentation, not newly registered adapters; their runtime acceptance is not claimed here. Disable/uninstall through your host; do not delete unrelated skills or change global rules.

## Maintainer build

```text
python extensions/yuri-creation/scripts/build_host_plugin.py --repo <source-checkout> --ref <source-commit> --output <new-folder-outside-checkout> --emit-git-tree
```

The builder reuses pinned upstream package helpers, exports committed blobs only, verifies the extension manifest and preserves licenses. Output is a folder, not an archive. It creates four small discovery wrappers from canonical frontmatter; canonical instructions/resources remain at `extensions/yuri-creation/`. Their English reasoning and existing Chinese interaction defaults are unchanged. All 23 upstream skills remain byte-identical. Existing upstream source manifests/installers remain unchanged in yuri-dev.

`native-tree-plan.json` beside the generated plugin describes a new distribution tree, including removal of source-only root folders. Its `expected_tree` is computed by Git with a temporary index; the real source index/ref are unchanged. Publish that exact tree to `yuri-plugin`, using the existing expected head if the channel already exists. Never force-push or merge the generated distribution back into yuri-dev/main. NATIVE_PLUGIN.json records the immutable source commit; the package and source versions must agree.

From any working directory, the packaged `extensions/yuri-creation/scripts/host_probe.py` checks entry/resource presence, runtime availability and source/authoring pins. It reports host discovery as unobserved; an agent cannot prove account installation by finding files. A fresh task selecting the native entry is the final host-discovery check.
