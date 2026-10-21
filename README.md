# TavernWeaveX无限月读

> **2.3.5 正式发行**：合并 2.3.1 的去八股、变量与前端调整和 Codex 适配，新增 DSH 轮盘显示/隐藏开关（本机记忆），并更新 DSH 预设摘要（23 个角色卡工程 Skill、Host Front Door、精简工具组合）。发行资产与校验文件见 [v2.3.5 正式发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.3.5)。源码安装按本地清单核对 23 个 Skill；完整验证范围见 CHANGELOG 与 DSH 合同。

> 本更新基于 **2.3.0 正式版**，保留 23 个 Skill。2.2.0 引入的 Claude Code 插件继续提供 Host Front Door 自动注入、`tavernweave` agent 与输入框上方的 Soul 模式切换；**TavernWeave X DSH** 插件包现在内置神之手客户端面板（轮盘、完整浮窗、世界书、前端设计＆动效数据库、项目/卡管理），一次安装；世界书设计与写作入口继续提供。完整包、插件包与校验文件见 [v2.3.5 正式发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.3.5)；来源与合入记录见[升级说明](docs/dual-task-upgrade.md)。

<p align="center">
  <img src="docs/assets/tavernweave-v1-cover.png" alt="一台位于幻想酒馆中的数字织机，将角色卡、世界书、设计资料与工程模块编织成统一工作流" width="100%">
</p>

<p align="center"><strong>把灵感、资料、代码与验收，织成一张真正可维护的角色卡。</strong></p>

TavernWeaveX无限月读（沿用 TW 简称）帮助你把想法做成能使用、能继续修改的角色卡、网页或小工具。你可以直接说想做什么，或哪里出了问题；TW 会整理需求、提出方案、制作和检查，并说明接下来怎样试用。它通过按任务加载的 Skill（按任务调用的工作能力）组织这些工作，支持 Codex、Claude Code，并通过 **TavernWeave X DSH** 插件包支持 DeepSeek Harness；DSH 包内同时带有神之手客户端面板。

当前源码为 **TavernWeaveX无限月读 2.3.5 正式发行**，合并 2.3.1 的去八股/变量/前端/Codex 改动，并加入 DSH 轮盘显示/隐藏开关与更清楚的 DSH 预设摘要；共 23 个原生 Skill，名称和数量不变。2.2.0 引入的 Claude Code 插件继续提供 Host Front Door 自动注入、`tavernweave` agent 与 Soul 模式切换（见 [Claude Code 插件](#claude-code-插件)）；**TavernWeave X DSH** 插件包内置神之手客户端面板，世界书设计与写作入口继续提供。机器安装标识 `tavernweave-agent-skills`、已有技能名称和仓库地址沿用原版，便于核对升级。完整包和校验文件见 [v2.3.5 正式发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.3.5)；[v2.2.0](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.2.0)、[v2.1.0](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.1.0)、[v1.9.1](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.9.1)与 [v1.9.0](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.9.0)历史发布页保留。

**统一插件的主要用途是让有权限的用户在 dots 云端长任务中调用 TW。** Codex 与 dots 共用 `TavernWeave-Codex-v2.3.5.zip`，不另开 cloud 版。TW 提供 Skill 和参考资料；云端执行、续接、持久存储与工具来自实际宿主。本机安装不会自动同步到 dots 账户。使用方法和账户入口说明见 **[统一插件指南](docs/plugin-guide.md)**。

TW 可以单独设计或改写世界书：先厘清知识边界、正文和触发条件，再选择原生条目、条件输出、显式读取或局部混合方案。世界书负责的内容与整卡、世界构建、变量及运行调试分别交接；预算优化需要实际测量，模型效果需要对应宿主中的观察。普通软件与制卡任务也共用更明确的需求厘清和提示规格方法，已有决定能直接复用。

沿用 1.9.0 已确认的墨月创作方法：完整卡以开场白和世界书为核心，按纯文字、MVU Zod、hybrid 组织制作，补充世界观、变量与人物创作方法。前端先研究需求与相关设计，默认参照 Awwwards 的设计要求；界面保持干净，正文按用途避免套话。

只想写一条角色卡提示词规则时，也能直接提出要求。Agent 会保留原意与约束强度，按请求交付正文或世界书条目。字段绑定工具遇到 `bindings` 类型错误时返回明确诊断，不再直接抛出数组方法异常。1.9.0 已修复 Windows 上组件导出失败后可能留下半成品的问题；无法清理的文件会明确列出。版本改动见 [更新日志](CHANGELOG.md)。

项目进度画板继续由 `orchestrate-project-blueprint` 在各项目内生成：显示整体和分模块的实现／验收进度条，展开检查点与证据，保存想法、Bug 和审核原话。画板可从项目总设计案读取范围与验收要求，从 NEXT 读取当前状态、证据和下一道门；同步先预览差异，来源、反馈或证据变化后重新核对。新增想法不自动扩大已确认范围，百分比不自动代替驾驶员或真实宿主验收。使用方法见[项目进度画板](docs/project-progress-board.md)。

作品资料库继续支持小说、原作／同人资料与联网文图参考整理，默认交付可编辑 Markdown＋JSONL 索引，并可导出 SQLite；按来源、改编版本和知情阶段检索。见[作品资料库使用说明](docs/work-library.md)。

所有能力继续遵守大白话和术语解释；新人、入门、熟练、老手由用户选择。文本精修、全量与架构审查、脑暴、内置设计 Library、Soul 和接手旧卡引导继续提供。安装核验以实际取得版本的机器清单为准；客户端实际加载与具体作品质量／token 测量保留独立检查。

> TavernWeave 原创内容采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许非商业使用、修改和分发；未经版权方另行授权，原版、修改版及再分发版本均不得用于商业目的。分发时须保留许可证和版权声明。第三方内容仍适用其[各自的许可证](THIRD_PARTY_NOTICES.md)。

## 一句话开始

普通制卡或 Vibe Code：

```text
我想用 TavernWeave 做一个【描述你想要的作品】。
先看看已有文件，帮我整理成一个能亲手试用的小成果；用大白话说明推荐理由和我需要决定的事情。
```

已经有卡文件，可以这样开始：

```text
我接手了这张角色卡，想【沿原作继续更新 / 做二创】。
先帮我看懂原卡，说明有哪些材料、哪些内容需要保留，再一起选第一次改动。
```

## 按你选择的节奏协作

| 引导挡位 | 你会得到什么 |
| --- | --- |
| 新人 | 一次一个小步骤，详细解释操作位置、原因、术语和预期结果 |
| 入门 | 一次一个小阶段，同样详细说明做法、步骤关系、方案取舍和检查方法 |
| 熟练 | 合并常规步骤，交代关键决定、理由和验证结果 |
| 老手 | 日常直接给结论、改动、差异和证据，减少重复基础教学 |

可以直接说“以后使用入门档”或“把我的挡位改成老手”。保存前说明实际位置和范围，已有选择随升级保留；未选择时不自动分档。“这次简短点”只影响本次说明。**所有挡位在有需要或修 bug 时仍详细解释，除非你明确说对应范围没必要。**

必要术语在第一次出现时解释，并结合当前任务给出“原术语 / 大白话 / 具体意思”对照。大白话与挡位独立于 Soul 人格和文本精修，退出其中一种模式不会清除你的选择。规则与完整例子见[共用沟通与引导](skills/consult-tavernweave-library/references/communication-and-guidance.md)。

## 可选的表达与协作方式

温柔指导版：

```text
阿瞳助我！
```

严格学习版：

```text
MTTT.sir，拷打我！
```

前端审查彩蛋版：

```text
灵魂杀手！
```

从一句愿望收束总设计案和第一版：

```text
脑暴模式
```

让三种 Soul 镜头一起参与脑暴：

```text
脑暴模式，Soul 联席
```

设计确认后执行冻结的首版：

```text
按蓝图开跑第一版
```

从当前证据重新核验完整 Vibe Code 成长历程：

```text
照镜子
```

只输出一份可复制、可保存的完整文字评估表单：

```text
照镜子，只要文字评估表单，不要画板
```

退出人格层：

```text
Soul 归位
```

Soul 仍是当前任务级 Portable 覆盖层。阿瞳与 MTTT.sir 是公开 MTTT 方法的两种教学投影；灵魂杀手以非官方强尼·银手同人彩蛋人格审查前端，可以嘴臭但必须拿证据、给修法。三席联席只是同一 Agent 的三个标记镜头，共享事实、权限、每轮优先 1–2 个必要决策（合计最多 4 个）和同一收束账本，不是三个独立模型。它不会自动获得 ChatGPT 历史或私有 RAG，不会跨新任务永久保持，也不会扩大文件、Git、网络、发布或生产权限。

## 文本精修与全量／架构审查 · v1.4.0

说“洗稿这段”“去 AI 味”“去八股”可直接得到一个保留原意的精修稿。默认轻润色，也可指定结构改写或深度重写；角色设定、数字、代码、宏与变量等技术内容保持原有约束。

| 用法 | 开启 | 关闭 |
| --- | --- | --- |
| 单次 | 洗稿这段…… | 交稿后结束 |
| 当前任务持续 | 开启持续洗稿模式 | 退出洗稿模式 |
| 工作区持久 | 在本工作区开启洗稿模式 | 关闭工作区洗稿模式 |
| 客户端持久 | 为当前客户端全局开启洗稿模式 | 关闭客户端全局洗稿模式 |

持续模式覆盖创作正文、对外文案、日常说明、计划和审查报告；保留引用、代码、必需模板与证据。持久模式先展示实际规则文件和差异，由驾驶员同意后写入独立区块。安装／升级 TW 不自动开启。任务退出只影响当前任务；“查看洗稿模式状态”会区分各个范围及宿主加载证据。

“全量审查”查看整个约定范围；“架构审查”追踪职责、依赖、状态和关键链路；“全量架构审查”组合两者。软件与角色卡均适用。报告保留已检查、部分检查、未读及排除项，并交付全部有证据的发现。也可说“灵魂杀手，全量架构审查”，沿用 Soul 风格；摘要最多三条，完整报告不截断。审查先交只读结果。

## 五层入口

```text
Host Front Door（可选本地入口）
  -> Soul（阿瞳 / MTTT.sir / 灵魂杀手 / 三席，可选）
    -> 脑暴编排（总设计案 + First Playable + 蓝图/蓝图集，可选）
      -> Library（A0 + ST 指南 + 设计/动效 + 来源 Wiki + 挑选页）
        -> 按机器清单分发的工程 Skill（创作、组件、API、UI、调试、成长核验、构建、验收等）
```

- **Host Front Door（可选本地入口）** 将持续大白话、任务路由与协作规则接入本地客户端；Claude Code 插件安装时由 SessionStart hook 自动注入，与 `CLAUDE.md` 区块二选一（见 [Claude Code 插件](#claude-code-插件)）。用户挡位单独保存，更新入口时保留；文件匹配与客户端实际加载分别检查。
- **Soul（可选人格）** 在用户选定的引导挡位内改变语气与教学方式，不改变事实、权限和验收结果。
- **脑暴编排** 控制方向轮数、四态决策、第一版边界和蓝图体量；任意活动步骤都不能无依据递归增殖。真实问题可以临时细分，解决或确认阻塞后必须关闭支线并回到父步骤。
- **Library** 单体分发、按需读取；安装一次不等于每轮塞入整个资料库。
- **工程 Skill** 继续拥有实际工作。人格和资料都不能替代目标运行时权威。

## Skill 阵列

| Skill | 主要职责 |
| --- | --- |
| `activate-tavernweave-soul` | 开启、互切或关闭阿瞳 / MTTT.sir / 灵魂杀手当前任务级模式；强尼是前端审查彩蛋人格，不保存私有 RAG |
| `build-work-library` | 整理小说、原作与同人资料、联网文字和图片参考；来源回查、版本/阶段筛选、人工编辑、分批接续、Markdown＋JSONL 与 SQLite 导出 |
| `consult-tavernweave-library` | 强制路由 A0、31 册正式 ST 指南与 C8 实验指南，并按需查询 462 个设计、194 个动效、86 个概念、1,609 条蒸馏账本及离线挑选页 |
| `orchestrate-project-blueprint` | 将角色卡或普通 Vibe Code 愿望收束为总设计案、First Playable、分级蓝图集、NEXT 和反递归执行门；可召集 Soul 三席联席；项目进度画板、百分比与反馈记录及总设计案／NEXT 同步 |
| `reflect-on-vibe-code-growth` | 从当前 Codex/Chat/项目与交付证据重新评估完整 Vibe Code 能力网络，同时输出可独立复制的完整文字评估表单与七章交互报告，按可比量表对照不可改写的历史节点，并保存脱敏的 append-only 本地履历 |
| `worldbook-design-and-writing` | 独立规划、拆合、审阅和精修世界书；联合选择原生、模板或局部混合路径，保留语义与知识边界；精确 API 和运行验收交专职能力 |
| `tavern-card-builder` | 识别卡型与依赖，维护创作权威、材料来源链、世界书、MVU、CoT、开局与记忆架构边界 |
| `sillytavern-card-components` | 无损拆卡、组件边界、registry/recipe 与往返一致性 |
| `sillytavern-component-update` | 组件级更新、可导入测试制品与整卡 pipeline 交接，阻止静默重封 |
| `sillytavern-render-regex-pipeline` | 用 fixture 验证正则语义、placement、显示/提示词、深度与阶段 |
| `sillytavern-rolecard-security` | 只读扫描注入、动态执行、凭据形状、远程加载和跨帧权限风险 |
| `sillytavern-database-rolecards` | 表结构、消息楼层、绑定和幂等迁移；C8 同层兼容仍为实验路线 |
| `sillytavern-extension-dev` | 最小 UI 扩展脚手架、manifest、生命周期、能力快照和版本门 |
| `sillytavern-rolecard-performance` | 脱敏预算、回归与具名真实运行时采样 |
| `sillytavern-media-live2d-runtime` | 媒体、音频、Live2D、预加载、provider、fallback 与清理 |
| `sillytavern-card-pipeline` | 依赖预检、实时开发适配、组装、JSON/PNG、世界书同步和发布门 |
| `sillytavern-api-reference` | 查证 ST、Tavern Helper、STScript、EJS、宏与 MVU 的版本敏感 API |
| `sillytavern-runtime-debug` | 在真实 SillyTavern 追踪 iframe、控制台、DOM、样式、数据和生命周期 |
| `sillytavern-embedded-ui` | 开局页、状态栏、控制中心、抽屉、浮窗和移动端交互；按作品搭建可选沙盒的规范、联合模拟、状态对照与滑条调试 |
| `code-quality-workflow` | 全量／架构审查、覆盖记录、完整发现、门控、最小修复、回归与 Finish Mode |
| `rewrite-natural-prose` | 保留原意与技术结构的文本精修，支持单次、任务持续及分别授权的工作区／客户端持久模式 |
| `shadcn-tailwind-ui` | 使用 React、shadcn/ui、Radix 和 Tailwind 构建可访问产品界面 |
| `rolecard-workshop-ops` | 诊断和运维可配置发布链，同时保护生产坐标和凭据 |

## Library 公开边界

一次安装同时携带：

- A0 通用驾驭检查单，作为写入型任务的常驻前置；
- STDB 的 31 册正式指南和 1 册明确标记为实验的 C8；
- AFV 完成 243/243 路筛选后的 462 个设计条目、194 个动效条目、86 个概念索引与 1,609 条蒸馏账本；
- 86 份直接关联的本地概念/Wiki、89 个自有本地技术沙盘与统一离线挑选页；
- 文件级来源、许可、脱敏次数和 SHA-256 清单。

明确不分发 A1 驾驶员母板、命令式旧 B1、过程档案、本地证据、AFV raw/收件箱、243 份源筛选 JSON、私有 RAG、日志、凭据和无关知识域；只保留不含私密正文的筛选聚合回执。挑选页的“加入候选”只表示 `proposed`，不等于采用、安装、许可通过或真实酒馆验收。

离线挑选页位于安装目录：

```text
skills/consult-tavernweave-library/assets/picker/index.html
```

## 创作、续接与验收

长项目使用 Markdown + YAML front matter + 受限结构块维护唯一创作权威。确认、候选、待决、否决、实现、自动证据、真实宿主证据和驾驶员验收不得混写。用户说“继续”时先恢复权威、Git/工作树、制品和下一道门，不重复访问已冻结设定。

证据按层记录：

```text
源码 -> 自动测试 -> 离线制品 -> 浏览器/桌面 -> 真实 SillyTavern -> 人工验收 -> 发布授权
```

任何一层都不能冒充下一层；自动化永远不能自行写入 `driver-accepted`。

## 奶人教程

第一次使用 TavernWeave，或想了解如何指挥 Agent 完成制卡、调试和验收，可阅读：[TavernWeave 奶人教程 · Vibe Code 制卡入门](https://liarmttt.github.io/TavernWeave/)。

## 安装与更新

Codex 用户可先看[Codex 专项使用与安装](docs/codex-skills.md)：区分插件与独立 Skill 发现位置，并提供无需 PowerShell 的 Python 安装／核验入口（默认只读预览，显式应用后才写入）。

以下步骤用于 Codex 或 Claude Code 的**本地安装**。dots 账户中的插件启用与使用见[统一插件指南](docs/plugin-guide.md)，本地安装不会自动同步到云端。安装器必须以仓库 `skills/` 的完整清单为源，创建缺失目录，不能只覆盖本机已经存在的 Skill。Host Front Door 是可选本地增强；安装前先看目标规则文件和差异：

```text
请完整安装并启用这个 Skill 仓库：
https://github.com/LiarMTTT/TavernWeave

不要只覆盖本机已经存在的 Skill。请以仓库 skills/ 的完整目录为准；安装后按机器清单核对完整数量（2.3.0 为 23/23；已发布的 1.9.1 为 22/22），并单独确认 worldbook-design-and-writing、build-work-library、activate-tavernweave-soul、consult-tavernweave-library、orchestrate-project-blueprint、reflect-on-vibe-code-growth、rewrite-natural-prose 和 Library 离线挑选页存在。

请检测我使用的是 Codex 还是 Claude Code，说明 TavernWeave Host Front Door 是可选本地增强；先展示目标路径、受控区块和 diff，得到我确认后再安装。不要改写受控区块以外的用户规则。
```

更新：

```text
请把已安装的 TavernWeave 完整更新到这个仓库的最新版本：
https://github.com/LiarMTTT/TavernWeave

更新必须比较“仓库应有目录”和“实际安装目录”，创建新增 Skill，不能只修改旧目录；同时检查 Host Front Door 是否缺失、过期或漂移，明文给出“更新前门/先看 diff/仅更新 Skills”三种选择。完成后返回两份回执，再新建任务验证本地宿主发现。dots 账户导入另按插件指南验证。
```

如果宿主或 Agent 使用“把每个 Skill 复制到某个项目级目录”的便携安装方式，可在仓库根运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-tavernweave.ps1 -TargetSkillRoot '<实际 Skill 根目录>'
```

需要在安装时处理全局前门，显式选择宿主并让脚本询问：

```powershell
# Codex：默认目标为 $CODEX_HOME\AGENTS.md；未设置时为 ~/.codex/AGENTS.md
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-tavernweave.ps1 -TargetSkillRoot '<实际 Skill 根目录>' -AgentHost Codex -HostFrontDoorAction Prompt

# Claude Code：默认目标为 ~/.claude/CLAUDE.md
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-tavernweave.ps1 -TargetSkillRoot '<实际 Skill 根目录>' -AgentHost Claude -HostFrontDoorAction Prompt
```

安装动作只维护带版本的 `tavernweave-host-front-door` 注释区块；已有文件先留备份，重复安装幂等，错误/重复标记与链接路径会被拒绝。单独预览或安装可运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\manage-host-front-door.ps1 -AgentHost Codex -Action Preview
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\manage-host-front-door.ps1 -AgentHost Codex -Action Install
```

全局规则修改是独立执行门；Agent 不得因为“推荐”二字静默写入。Codex/Claude 需要新建任务或重启后重新发现；前门回执也不能冒充 Soul Skill 已被实际调用。

安装或更新后必须对**实际扫描位置**运行核验，而不是只检查源码仓库。核验器默认拒绝把 TavernWeave 源码目录本身当作安装目标：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-install.ps1 -TargetRoot '<实际插件根目录或 Skill 根目录>'
```

通过回执的技能数必须与所用源码的安装清单一致。以下以 2.3.0 的 23 技能源码为例；已发布的 1.9.1 原包仍为 22/22：

```text
INSTALLATION VERIFIED: 23/23
Library: present-and-matched
Library picker: present
Soul: present-and-matched
Host rediscovery: required-new-task
```

如果核验时同时指定宿主与规则文件，回执还会显示 `Host Front Door: current|missing-block|outdated|drifted`；它是推荐状态，不改变按机器清单核对 Skill 文件完整性的判定。

目标目录中的无关个人 Skill 会保留；机器清单中的 TavernWeave 官方目录必须与当前源码逐文件匹配。写入目标最后一级必须明确名为 `skills`；安装脚本拒绝盘符根、用户目录根、源码仓库内部目标和目录链接，替换失败时会回滚已有官方 Skill。

完成对应版本的完整核验后新建任务或重启会话，使本地宿主重新发现 Skill。新任务中仍需实际调用世界书设计与写作、Soul、脑暴编排、照镜子与 Library；安装回执不能冒充宿主发现。v2.3.5 插件包、`TavernWeave-DSH-v2.3.5.tgz`（DeepSeek Harness）与 SHA-256 校验文件见 [正式发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.3.5)。

维护者若只是在发布前自检源码树，可显式使用 `-AllowSourceTree`；该开关不能用于普通用户的安装回执。

## Claude Code 插件

2.2.0 起，仓库本身就是一个 Claude Code 插件市场（`.claude-plugin/`）。在 Claude Code 中运行：

```text
/plugin marketplace add LiarMTTT/TavernWeave
/plugin install tavernweave-agent-skills@tavernweave
```

插件包含四部分，前三项与 DSH 插件包一一对应：

| 组成 | 文件 | 对应 DSH |
| --- | --- | --- |
| 23 个 Skill，名称带 `tavernweave-agent-skills:` 前缀 | `skills/` | Skill provider |
| Host Front Door 自动注入：每次会话开始时把前门作为会话上下文加入（需要 PATH 中有 `node`） | [`hooks/hooks.json`](hooks/hooks.json)、[`hooks/session-start-front-door.mjs`](hooks/session-start-front-door.mjs) | system prompt section |
| `tavernweave` agent：TW 专用人设，工具集同样精简（不含联网与子代理） | [`agents/tavernweave.md`](agents/tavernweave.md) | `TavernWeave X DSH` preset |
| Soul 模式切换：输入框上方一行 `Soul 阿瞳 ▸`，展开后选模式只把对应指令填进输入框，由你发送 | [`hooks/soul-switch.tsx`](hooks/soul-switch.tsx)（`hooks/hooks.json` 的 `modules`） | 神之手 Soul 小浮窗（CC 只保留这一项界面） |

`tavernweave` agent 可以作为主会话启动：`claude --agent tavernweave-agent-skills:tavernweave`；也可以在普通会话里让 Claude 把 TW 任务交给它。如果之前把 Skill 复制进了 `~/.claude/skills`，改用插件后可以移除那份副本，避免同名 Skill 出现两次。

Soul 模式切换用的是 Claude Code 插件的函数 hook 接口（官方标注为 early access）。它和前门 hook 写在同一个 `hooks/hooks.json` 里，已在 Claude Code 2.1.299 上确认两者都会加载；更早的版本是否忽略 `modules` 字段尚未验证。切换只记录你实际发出的 Soul 指令，不代表 Soul 已被确认激活；它从不替你发送消息。界面测试用 `claude plugin test .` 运行。

### 与 CLAUDE.md 区块去重

前门只需要一处。hook 启动时检查本会话会加载的指令文件：`$CLAUDE_CONFIG_DIR/CLAUDE.md`（未设置时为 `~/.claude/CLAUDE.md`），以及当前目录到根目录各级的 `CLAUDE.md`、`.claude/CLAUDE.md`、`CLAUDE.local.md`。文件里的受控区块优先：

| 情况 | hook 的行为 |
| --- | --- |
| 这些文件都没有 `tavernweave-host-front-door` 区块 | 注入插件自带的前门 |
| 已有同版本区块 | 不注入，文件区块生效 |
| 已有其他版本区块 | 不注入前门，只加一句版本不一致提示；文件区块仍生效 |
| 环境变量 `TAVERNWEAVE_FRONT_DOOR=off` | 完全不注入 |

- 通过插件市场安装的用户，不需要再用 `manage-host-front-door.ps1` 写入 `CLAUDE.md`。已经写过、想改由插件随版本更新的，运行 `manage-host-front-door.ps1 -AgentHost Claude -Action Remove`（脚本会先备份）。
- 通过 ZIP 或复制 `skills/` 安装的用户没有这个 hook，仍按上文写入 `CLAUDE.md`。
- 引导挡位（`tavernweave-guidance-preference` 区块）不受影响，仍单独保存在 `CLAUDE.md`。

验收状态：hook、agent 与 Soul 切换的结构、去重规则、输出格式和指令一致性由 [`tests/claude-plugin.test.mjs`](tests/claude-plugin.test.mjs) 离线检查，Soul 切换的界面行为由 [`hooks/soul-switch.test.tsx`](hooks/soul-switch.test.tsx) 在终端与桌面两种表面检查；Claude Code 新会话中的实际注入、`--agent` 启动和子代理调用尚未实机验收（见安装清单 `claudePlugin.hostLoading`）。

## DeepSeek Harness

2.1.0 起，DSH 改用独立插件包安装，**不要**把 `skills/` 复制到 `.agents/skills`，也不需要写 `AGENTS.md`：

1. 从 [v2.3.5 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.3.5)下载 `TavernWeave-DSH-v2.3.5.tgz`；或在源码树运行 `node scripts/build-dsh-plugin.mjs` 重新生成本地包 `TavernWeave-DSH-v2.3.5.tgz`；
2. DSH 桌面版：侧栏 **插件 → 添加插件 → 安装第三方插件 → 本地路径/tarball**，安装后启用 bundle；
3. 新建任务，在 Agent preset 中选择 **TavernWeave X DSH**。

CLI/Web profile 使用 `dsh plugin --profile <profile> add <本地路径|tarball|git 地址|包名>`；`desktop` profile 由 Desktop shell 管理，不要直接调用 CLI。

插件包内直接携带 23 个 Skill 与 Host Front Door（作为 system prompt section 注入），安装/升级/卸载都走 DSH 插件机制。详细组成、机器合同与运行时门禁见 [host-adapters/dsh/README.md](host-adapters/dsh/README.md)。DSH 仍处于 Developer Preview。2.1.0 已在 DSH Desktop `0.2.1-rc.2` 上完成插件页、preset 选择、23 Skill 目录、Front Door、Soul 与完全权限终端的实机验收；模型效果、Linux/WSL 与真实酒馆仍是分开的验收项。OneDrive reparse-point 工作区在 workspace-write 下需切完全权限或换普通目录（见合同 `knownEnvironmentIssues`）。
