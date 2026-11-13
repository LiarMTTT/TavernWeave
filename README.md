# Yuri Card Workbench 0.5.0

通过对话创作百合角色卡，或将已有角色卡、帖子、小说片段改编为适合 SillyTavern 使用的故事。Agent 处理文件，你在对话中审阅和修改。

[中文使用说明](extensions/yuri-creation/README.zh-CN.md) · [English guide](extensions/yuri-creation/README.md) · [正式版本](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v0.5.0)

## 安装

| 使用环境 | 分发分支／文件 | 方式 |
| --- | --- | --- |
| Codex、ChatGPT Work | [yuri-plugin](https://github.com/imbdsssity/TavernWeave-Yuri/tree/yuri-plugin) | 导入并启用 `tavernweave-yuri` 插件 |
| DeepSeek Harness | [DSH-plugin](https://github.com/imbdsssity/TavernWeave-Yuri/tree/DSH-plugin) 或正式版 DSH `.tgz` | 安装插件包，选择 Yuri Workbench 预设 |
| Gemini CLI、Task 模式 | [Gemini-plugin](https://github.com/imbdsssity/TavernWeave-Yuri/tree/Gemini-plugin) | 分别导入四个技能，保留完整共享目录 |

具体步骤见[安装说明](extensions/yuri-creation/docs/NATIVE_HOSTS.md)。Gemini 在已验收环境中不支持插件导入；各技能之间需要明确加载依赖，无法保留插件级自动衔接。各宿主的文件权限、Python、Node 和搜索能力取决于实际环境。

## 开始使用

| 你有什么 | 可以直接对 Agent 说 |
| --- | --- |
| 一个想法，或者暂时没有想法 | “通过对话创作一张百合角色卡，未指定细节由你决定。” |
| 已有 JSON / PNG 卡或世界书 | “把这张卡改编成百合故事，保留图片、脚本和无关设置。” |
| 一篇帖子 | “把这篇帖子改编为角色卡，发帖者统一使用 {{user}}，区分原文与新增设定。” |
| TXT / Markdown / EPUB 小说 | “选这一章或片段制作角色卡，保留来源记录。” |

四个入口为 `yuri-card-creator`、`adapt-yuri-card`、`post-to-yuri-card`、`novel-excerpt-to-yuri-card`。你可以直接用自然语言提出修改，无须填写表单。已有卡会保留原件并另存结果；与改编无关的字段、脚本、世界书加载设置和未编辑图像受到保护。名字不合适时，Agent 会提供备选，等你选择或授权后再修改。

默认主要角色为成年女性，保留背景人物身份。最终 JSON 或带角色卡数据的 PNG 可导入 SillyTavern。小说可以分章节或片段处理，不会静默截断并冒称读完全文。

## 项目与许可

`main` 保存正式源码，`yuri-dev` 用于后续开发；生成的插件分支用于安装。基于 [TavernWeave](https://github.com/LiarMTTT/TavernWeave)，保留其 23 个依赖技能及原有许可。原始说明见 [UPSTREAM_README.md](UPSTREAM_README.md)。原创增补按 MIT 授权，依赖项保留各自条款；参见[许可边界](extensions/yuri-creation/LICENSE_BOUNDARY.md)及根目录 LICENSE。

[版本说明](extensions/yuri-creation/RELEASE_NOTES.md) · [宿主验收范围](extensions/yuri-creation/docs/HOST_ACCEPTANCE_2026-11-13.md)
