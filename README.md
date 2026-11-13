# Yuri Card Workbench 1.2.0

这是基于 TavernWeave 的百合专用产品分发层：保留通用技能生态，加入领域工作流、执行约定与原生宿主整合，重点服务不同来源材料的百合改编。

通过对话创作百合角色卡，或将已有角色卡、帖子、小说片段改编为适合 SillyTavern 使用的故事。Agent 处理文件，你在对话中审阅和修改。

[中文使用说明](extensions/yuri-creation/README.zh-CN.md) · [English guide](extensions/yuri-creation/README.md) · [正式版本](https://github.com/imbdsssity/TavernWeave-Yuri/releases/tag/yuri-v1.2.0)

## 安装

| 使用环境 | 分发分支／文件 | 方式 |
| --- | --- | --- |
| Codex、ChatGPT Work | [yuri-plugin](https://github.com/imbdsssity/TavernWeave-Yuri/tree/yuri-plugin) | 导入并启用 `tavernweave-yuri` 插件 |
| DeepSeek Harness | [DSH-plugin](https://github.com/imbdsssity/TavernWeave-Yuri/tree/DSH-plugin) 或正式版 DSH `.tgz` | 安装插件包，选择 Yuri Workbench 预设 |
| Gemini CLI | `main` 或 [Gemini-plugin](https://github.com/imbdsssity/TavernWeave-Yuri/tree/Gemini-plugin) | 一次安装完整扩展，自动发现四个百合技能及依赖 |
| Gemini Task 模式 | `Gemini-plugin` | 分别导入四个技能，保留完整共享目录 |

具体步骤见[安装说明](extensions/yuri-creation/docs/NATIVE_HOSTS.md)。Gemini CLI 已通过扩展导入及技能识别测试；Task 模式保留逐项导入方式。各宿主的文件权限、Python、Node 和搜索能力取决于实际环境。

### Gemini CLI 扩展

在系统终端运行：

```sh
gemini extensions install https://github.com/imbdsssity/TavernWeave-Yuri --ref main
gemini extensions list
```

重启 Gemini CLI，在会话中运行 `/skills list`，应能看到下方四个百合入口及 23 个依赖技能。安装目录会保留完整共享资源，无须逐个导入。已从 `Gemini-plugin` 安装的扩展可继续使用；更新时运行 `gemini extensions update tavernweave-yuri`，然后重启。若此前单独安装过同名技能，请先移除重复项，避免其遮蔽扩展中的入口。

安装依照 Gemini CLI 官方[扩展编写指南](https://geminicli.com/docs/extensions/writing-extensions/)和[安装命令参考](https://geminicli.com/docs/extensions/reference/)。扩展让技能共同可见；Agent 仍按任务加载对应工作流及依赖。

## 开始使用

| 你有什么 | 可以直接对 Agent 说 |
| --- | --- |
| 一个想法，或者暂时没有想法 | “通过对话创作一张百合角色卡，未指定细节由你决定。” |
| 已有 JSON / PNG 卡或世界书 | “把这张卡改编成百合故事，保留图片、脚本和无关设置。” |
| 一篇帖子 | “把这篇帖子改编为角色卡，发帖者统一使用 {{user}}，区分原文与新增设定。” |
| TXT / Markdown / EPUB 小说 | “选这一章或片段制作角色卡，保留来源记录。” |

四个入口为 `yuri-card-creator`、`adapt-yuri-card`、`post-to-yuri-card`、`novel-excerpt-to-yuri-card`。你可以直接用自然语言提出修改，无须填写表单。已有卡会保留原件并另存结果；与改编无关的字段、脚本、世界书加载设置和未编辑图像受到保护。名字不合适时，Agent 会提供备选，等你选择或授权后再修改。

选择换图时，Agent 会结合原图的实际画风与改编卡的叙事气质生成候选，先展示给你审阅再决定采用；原图保留。

默认主要角色为成年女性，保留背景人物身份。 你也可以在对话中指定人物范围、排除对象、关系结果或女性判定标准；Agent 会保存并检查这些偏好，不支持的选项会明确说明。具体范围见[自定义偏好](extensions/yuri-creation/references/custom-profiles.md)。最终 JSON 或带角色卡数据的 PNG 可导入 SillyTavern。小说可以分章节或片段处理，不会静默截断并冒称读完全文。

## 项目与许可

`main` 保存正式源码，`yuri-dev` 用于后续开发；生成的插件分支用于安装。基于 [TavernWeave](https://github.com/LiarMTTT/TavernWeave)，保留其 23 个依赖技能及原有许可。原始说明见 [UPSTREAM_README.md](UPSTREAM_README.md)。原创增补按 MIT 授权，依赖项保留各自条款；参见[许可边界](extensions/yuri-creation/LICENSE_BOUNDARY.md)及根目录 LICENSE。

[版本说明](extensions/yuri-creation/RELEASE_NOTES.md) · [宿主验收范围](extensions/yuri-creation/docs/HOST_ACCEPTANCE_2026-11-13.md)

4 个规范百合工作流通过 4 个发现包装入口向 Portable／Gemini 暴露；DSH 直接注册规范工作流。加上 23 个上游依赖，各宿主共提供 27 个可发现入口。内部实现模块与包装背后的规范文件不另算技能。详见[产品架构与计数](extensions/yuri-creation/docs/ARCHITECTURE.md)。上游采用固定提交，并通过[明确的同步流程](extensions/yuri-creation/docs/UPSTREAM_SYNC.md)更新。
