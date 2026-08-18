# TavernWeave

<p align="center">
  <img src="docs/assets/tavernweave-v1-cover.png" alt="一台位于幻想酒馆中的数字织机，将角色卡、世界书、设计资料与工程模块编织成统一工作流" width="100%">
</p>

<p align="center"><strong>把灵感、资料、代码与验收，织成一张真正可维护的角色卡。</strong></p>

TavernWeave 是面向 Codex 与 Claude Code、并为 DeepSeek Harness 提供实验适配的 SillyTavern 制卡与 Vibe Coding 工程系统：20 个可路由 Skill、从模糊愿望到总设计案/首版/蓝图的项目编排、可再次核验且不可改写的本地成长履历、一份可恢复的创作权威、一条从源码到真实宿主和人工验收的证据链、统一随包的 ST/设计/动效资料库，以及可单席或三席联动的 Soul 模式。

当前正式版本为 **[v1.3.0](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.3.0)**。本版是一项 TavernWeave 整体更新：新增第 20 个原生 Skill“照镜子 · Vibe Code 成长历程”，并把 AFV 已完成 243/243 路筛选的完整前端设计、动效、概念与蒸馏账本实装进 TavernWeave Library。照镜子会从当前证据重新评估完整能力网络，输出高密度七章交互报告与可独立保存的文字评估表单，并以脱敏、不可改写、可验证哈希链保存本地履历；Library 则通过确定性查询只返回当前任务需要的少量候选。源码、发布资产、实际安装、宿主发现、真实运行与驾驶员验收仍是彼此独立的证据门，不能互相代替。

> TavernWeave 原创内容采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许非商业使用、修改和分发；未经版权方另行授权，原版、修改版及再分发版本均不得用于商业目的。分发时须保留许可证和版权声明。第三方内容仍适用其[各自的许可证](THIRD_PARTY_NOTICES.md)。

## 一句话开始

普通制卡或 Vibe Code：

```text
请用 TavernWeave 帮我做这张卡。先读 A0，识别任务应该由哪个 Skill 负责，再告诉我目标、红线和验收。
```

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

Soul 仍是当前任务级 Portable 覆盖层。阿瞳与 MTTT.sir 是公开 MTTT 方法的两种教学投影；灵魂杀手以非官方强尼·银手同人彩蛋人格审查前端，可以嘴臭但必须拿证据、给修法。三席联席只是同一 Agent 的三个标记镜头，共享事实、权限、每轮 2–4 个决策和同一收束账本，不是三个独立模型。它不会自动获得 ChatGPT 历史或私有 RAG，不会跨新任务永久保持，也不会扩大文件、Git、网络、发布或生产权限。

## 五层入口

```text
Host Front Door（可选全局入口，推荐）
  -> Soul（阿瞳 / MTTT.sir / 灵魂杀手 / 三席，可选）
    -> 脑暴编排（总设计案 + First Playable + 蓝图/蓝图集，可选）
      -> Library（A0 + ST 指南 + 设计/动效 + 来源 Wiki + 挑选页）
        -> 20 个工程 Skill（创作、组件、API、UI、调试、成长核验、构建、验收等）
```

- **Host Front Door** 只把直接口令、A0 半人工 loop 与失败回执放到客户端全局规则；受控区块之外的用户规则不动。
- **Soul** 只改变解释、追问和教学节奏，不改变事实、权限和验收结果。
- **脑暴编排** 控制方向轮数、四态决策、第一版边界和蓝图体量；任意活动步骤都不能无依据递归增殖。真实问题可以临时细分，解决或确认阻塞后必须关闭支线并回到父步骤。
- **Library** 单体分发、按需读取；安装一次不等于每轮塞入整个资料库。
- **工程 Skill** 继续拥有实际工作。人格和资料都不能替代目标运行时权威。

## Skill 阵列

| Skill | 主要职责 |
| --- | --- |
| `activate-tavernweave-soul` | 开启、互切或关闭阿瞳 / MTTT.sir / 灵魂杀手当前任务级模式；强尼是前端审查彩蛋人格，不保存私有 RAG |
| `consult-tavernweave-library` | 强制路由 A0、31 册正式 ST 指南与 C8 实验指南，并按需查询 462 个设计、194 个动效、86 个概念、1,609 条蒸馏账本及离线挑选页 |
| `orchestrate-project-blueprint` | 将角色卡或普通 Vibe Code 愿望收束为总设计案、First Playable、分级蓝图集、NEXT 和反递归执行门；可召集 Soul 三席联席 |
| `reflect-on-vibe-code-growth` | 从当前 Codex/Chat/项目与交付证据重新评估完整 Vibe Code 能力网络，同时输出可独立复制的完整文字评估表单与七章交互报告，按可比量表对照不可改写的历史节点，并保存脱敏的 append-only 本地履历 |
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
| `sillytavern-embedded-ui` | 开局页、状态栏、控制中心、抽屉、浮窗和移动端交互 |
| `code-quality-workflow` | 审计、门控、最小修复、重构、回归与单退出条件 Finish Mode |
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

把仓库链接交给 Codex 或 Claude Code。安装器必须以仓库 `skills/` 的完整清单为源，创建缺失目录，不能只覆盖本机已经存在的 Skill；同时必须明文提示：**把 Host Front Door 安装到当前客户端全局规则，可获得最稳定的 Soul 激活、A0 半人工验收 loop 与跨项目路由体验，推荐安装。** 用户可以先看 diff，也可以只装 Skills：

```text
请完整安装并启用这个 Skill 仓库：
https://github.com/LiarMTTT/TavernWeave

不要只覆盖本机已经存在的 Skill。请以仓库 skills/ 的完整目录为准；安装后核对 20/20，并单独确认 activate-tavernweave-soul、consult-tavernweave-library、orchestrate-project-blueprint、reflect-on-vibe-code-growth 和 Library 离线挑选页存在。

请检测我使用的是 Codex 还是 Claude Code，明文推荐安装 TavernWeave Host Front Door 到该客户端的全局规则文件；先展示目标路径、受控区块和 diff，得到我确认后再安装。不要改写受控区块以外的用户规则。
```

更新：

```text
请把已安装的 TavernWeave 完整更新到这个仓库的最新版本：
https://github.com/LiarMTTT/TavernWeave

更新必须比较“仓库应有目录”和“实际安装目录”，创建新增 Skill，不能只修改旧目录；同时检查 Host Front Door 是否缺失、过期或漂移，明文给出“更新前门（推荐）/先看 diff/仅更新 Skills”三种选择。完成后返回两份回执，再新建任务验证宿主发现。
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

通过回执必须包含：

```text
INSTALLATION VERIFIED: 20/20
Library: present-and-matched
Library picker: present
Soul: present-and-matched
Host rediscovery: required-new-task
```

如果核验时同时指定宿主与规则文件，回执还会显示 `Host Front Door: current|missing-block|outdated|drifted`；它是推荐状态，不改变 20/20 Skill 文件完整性的判定。

目标目录中的无关个人 Skill 会保留；20 个 TavernWeave 官方目录必须与当前源码逐文件匹配。写入目标最后一级必须明确名为 `skills`；安装脚本拒绝盘符根、用户目录根、源码仓库内部目标和目录链接，替换失败时会回滚已有官方 Skill。

完成 20/20 核验后新建任务或重启会话，使宿主重新发现 Skill。新任务中仍需实际调用 Soul、脑暴编排、照镜子与 Library；安装回执不能冒充宿主发现。正式发布前请以 manifest、Release 与校验结果为准，不要把工作分支文本当成已经发布。

维护者若只是在发布前自检源码树，可显式使用 `-AllowSourceTree`；该开关不能用于普通用户的安装回执。

## DeepSeek Harness Preview

[DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)目前明确处于 Developer Preview。TavernWeave 针对审计时的 `0.1.0-rc.5` 提供 [TW Lite 离线候选与机器合同](host-adapters/dsh/README.md)：

- 官方 `minimal` 只挂载 bash 与 `str_replace_editor`，没有 Skill filesystem/loader，因此不能调用 TW；
- 官方 `standard` / `code` 具备 Skill 发现与加载面，但仍需真实安装和调用验收；
- `TW Lite Full` 用精简工具面暴露 20 个 Skill；`TW Lite Entry` 只暴露 Soul、Library、Project Blueprint、Builder 四个入口，用于同题 A/B，但二级路由会降级；
- 目前没有安装 DSH、没有读取 API Key、没有真实模型/额度调用，也没有 Windows/Linux/WSL 或真实 SillyTavern 验收；不得宣传“最大化 V4 智力”或正式兼容。
