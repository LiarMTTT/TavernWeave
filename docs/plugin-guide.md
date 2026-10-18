# TavernWeave 2.2.0 统一插件使用指南

> 当前正式版为 2.2.0，共 23 个 Skill。从 [v2.2.0 正式发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.2.0)获取发行资产；[升级说明](dual-task-upgrade.md)保留原补丁与修复证据。上一版 2.1.0 与 2.0.0 也是 23 个 Skill；1.9.1 为 22 个。

TavernWeaveX无限月读 2.2.0 沿用安装标识 `tavernweave-agent-skills` 和原有兼容流程，Claude Code 插件新增 Host Front Door 自动注入、`tavernweave` agent 与 Soul 模式切换；2.1.0 引入的 [TavernWeave X DSH 插件包](../host-adapters/dsh/README.md)继续提供，2.0.0 引入的[世界书规划与写作 Skill](../skills/worldbook-design-and-writing/SKILL.md)继续保留。Codex 与 dots 共用 `TavernWeave-Codex-v2.2.0.zip`，没有单独的“cloud 版”。这个插件帮助用户在 dots 云端长任务中调用 TW 的工作方法：把目标分阶段完成，保存可续接的工作记录，再从实际文件和证据接着做。

TW 插件是 **skills-only 资源包**，提供说明、参考资料和随包脚本，不附带 MCP 服务器、后台常驻服务或密钥。云端任务能使用的终端、应用、文件和持久状态由实际宿主及账户权限决定。dots 的云电脑有自己的文件、软件和浏览器，可在用户本机关闭后继续工作；如果任务改在已连接的本机执行，就需要本机在线并保持应用可用。[dots 云电脑与应用说明](https://learn.chatgpt.com/docs/dots/computers-and-apps)

## 获取与启用

从 [v2.2.0 正式发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.2.0)取得需要的资产，并用同页的 `SHA256SUMS.txt` 核对下载文件：

| 文件 | 用途 |
| --- | --- |
| `TavernWeave-v2.2.0.zip` | 完整源码和文档发行包 |
| `TavernWeave-Codex-v2.2.0.zip` | Codex／dots 共用插件包 |
| `TavernWeave-Claude-ZCode-v2.2.0.zip` | Claude Code／ZCode 分发包 |
| `TavernWeave-ZCode-marketplace-v2.2.0.json` | ZCode 市场清单 |
| `TavernWeave-DSH-v2.2.0.tgz` | DeepSeek Harness 插件包（TavernWeave X DSH） |
| `SHA256SUMS.txt` | 已发布文件的 SHA-256 校验值 |

上一版 [v2.1.0 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.1.0)、[v2.0.0 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.0.0)与更早的 [v1.9.1 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.9.1)保留历史发行包和校验文件；分别按 23／23／22 个 Skill 的清单核对，不能与 2.2.0 混用。

Claude Code 可直接从本仓库的插件市场安装 `tavernweave-agent-skills`，插件自带 Host Front Door 注入 hook、`tavernweave` agent 与输入框上方的 Soul 模式切换，与 `CLAUDE.md` 区块的去重规则见 [README 的 Claude Code 插件](../README.md#claude-code-插件)。

DeepSeek Harness 不走技能目录安装，而是使用 `TavernWeave-DSH-v2.2.0.tgz`：在 DSH 插件页安装并启用 bundle，再在新任务中选择 `TavernWeave X DSH` preset。详见 [host-adapters/dsh/README.md](../host-adapters/dsh/README.md)。

若账户提供插件导入或启用入口，按该入口当前显示的步骤选择 Codex／dots 共用包，启用后在新任务中让 dot 查找 TavernWeave。具体入口和权限以账户界面为准；这份指南不指定未经证实的个人导入按钮，也不推断某个订阅套餐一定可用。**下载或解压 ZIP 不会自动把插件同步到 dots 账户。**本地文件齐全、账户已导入、插件已启用、dot 在任务里确实调用到 Skill，是不同的状态。

OpenAI 的[插件打包规范](https://developers.openai.com/plugins/build/plugins)允许插件以 `skills/` 提供工作方法，MCP 服务器按实际需要添加。需要公开分发时，拥有相应开发者组织权限的发布者可按[官方上传与提交流程](https://developers.openai.com/plugins/deploy/submission)上传 ZIP、查看自动检查结果、提交审核，并在审核通过后发布。Release ZIP 与公开插件目录上架也是不同的分发入口；使用者只需选择自己账户实际可用的入口。

如果账户暂时没有插件导入入口，可以保存 2.0.0 发行包，向账户管理员或平台确认可用权限。不要把本机解压当作云端启用。若只在本地 Codex 或 Claude Code 使用，按 [README 的安装与更新](../README.md#安装与更新)以所选版本的清单核对：2.0.0 为 23/23，历史 1.9.1 为 22/22。本地全局规则中的 TavernWeave Host Front Door 是可选增强，不是 dots 云端使用插件的前置条件。

## 开始一件事

在已启用插件的新任务中，直接说想做什么，dot 会按任务选择相关 Skill。第一次使用时，可以先让它列出当前实际可见的 TW Skill，再开始一个小成果：

```text
请查看当前任务能使用的 TavernWeave Skill，并用其中合适的能力帮我写一条角色卡世界书规则：角色遇到陌生人先保持礼貌和距离，确认可信后才透露秘密。给我可编辑的条目草稿，说明触发条件和容易误伤的情形。先只在聊天里交付。
```

这类纯文字工作不需要云端终端。若要运行随包 Node.js 或 Python 脚本、生成文件或检查工程，先让 dot 确认它的云电脑是否提供相应运行时、可写目录，并核对脚本在**本次云端环境**中可访问。可从 `skills/consult-tavernweave-library/scripts/query-library.mjs` 的资料路由查询，或 `skills/shadcn-tailwind-ui/scripts/generate_tailwind_config.py` 的配置文件生成开始。没有相应终端时，让 dot 交付可编辑的文本方案或改用当前环境真正具备的工具。

## 长任务怎样接着做

开始前告诉 dot 成果放在哪里、每阶段如何检查。让它在可持续访问的工作位置保留目标、已完成内容、实际验证结果、当前文件和下一步；中断后先回读这些记录与文件，再继续。可以直接发送：

```text
请把这个任务分阶段推进。每完成一阶段，在当前可持续访问的工作位置记录目标、已完成内容、实际验证结果、文件位置和下一步。中断后先回读记录与文件，再核对现状继续；若这个工作位置不能持久保存，请告诉我可用的替代方式。
```

若希望本机关机后继续，请确认任务确实在 dots 云电脑运行，并从该 dot 的云端任务查看进度。连接本机、使用本机浏览器或从云端协调本地任务时，运行位置会不同；让 dot 说明工作发生在哪里。外部邮件、云盘、发布和其他应用写入仍按用户当次授权进行，先交付可检查草稿再执行需要授权的动作。

## 遇到问题怎样反馈

反馈时附上 TavernWeave 版本、取得插件的入口、账户能看到的启用状态、任务实际运行位置、原提示、实际表现和预期表现。若问题涉及脚本，附命令、退出状态和产物路径；涉及续接，附中断前后记录与文件是否仍可访问。可以遮去账户和私人内容。这样能区分包内容、账户分发、宿主发现和实际任务运行各层的问题，方便针对具体环节修复。
