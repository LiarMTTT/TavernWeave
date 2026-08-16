# TavernWeave

<p align="center">
  <img src="docs/assets/tavernweave-v1-cover.png" alt="一台位于幻想酒馆中的数字织机，将角色卡、世界书、设计资料与工程模块编织成统一工作流" width="100%">
</p>

<p align="center"><strong>把灵感、资料、代码与验收，织成一张真正可维护的角色卡。</strong></p>

TavernWeave 是面向 Codex 与 Claude Code 的 SillyTavern 制卡工程系统：18 个可路由 Skill、一份可恢复的创作权威、一条从源码到真实酒馆和人工验收的证据链、统一随包的 ST/设计/动效资料库，以及可选的阿瞳 / MTTT.sir 双人格教学层。

当前正式版本为 **[v1.0.1](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.0.1)**，重点补齐从仓库源码到实际安装目录之间的完整性门。源码版本、实际安装、宿主发现、远端推送、发布资产与 Release 状态分别留证，不能互相代替。

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

退出人格层：

```text
Soul 归位
```

Soul v1 是当前任务级 Portable 覆盖层。它不会冒充真实 MTTT、不会自动获得 ChatGPT 历史或私有 RAG、不会跨新任务永久保持，也不会扩大文件、Git、网络、发布或生产权限。

## 三层架构

```text
Soul（可选教学人格）
  -> Library（A0 + ST 指南 + 设计/动效 + 来源 Wiki + 挑选页）
    -> 18 个工程 Skill（创作、组件、API、UI、调试、构建、验收等）
```

- **Soul** 只改变解释、追问和教学节奏，不改变事实、权限和验收结果。
- **Library** 单体分发、按需读取；安装一次不等于每轮塞入整个资料库。
- **工程 Skill** 继续拥有实际工作。人格和资料都不能替代目标运行时权威。

## Skill 阵列

| Skill | 主要职责 |
| --- | --- |
| `activate-tavernweave-soul` | 开启、互切或关闭阿瞳 / MTTT.sir 当前任务级人格；复用工程 Skill，不保存私有 RAG |
| `consult-tavernweave-library` | 强制路由 A0、32 册 ST 主题指南、82 个设计条目、38 个动效条目、18 份来源 Wiki 与离线挑选页 |
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
- AFV 当前公开快照中的 82 个设计条目、38 个动效条目、18 份直接关联 Wiki；
- 23 个自有本地技术沙盘与离线挑选页；
- 文件级来源、许可、脱敏次数和 SHA-256 清单。

明确不分发 A1 驾驶员母板、命令式旧 B1、过程档案、本地证据、AFV raw/收件箱、私有 RAG、日志、凭据和无关知识域。挑选页的“加入候选”只表示 `proposed`，不等于采用、安装、许可通过或真实酒馆验收。

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

把仓库链接交给 Codex 或 Claude Code。安装器必须以仓库 `skills/` 的完整清单为源，创建缺失目录，不能只覆盖本机已经存在的 Skill：

```text
请完整安装并启用这个 Skill 仓库：
https://github.com/LiarMTTT/TavernWeave

不要只覆盖本机已经存在的 Skill。请以仓库 skills/ 的完整目录为准；安装后核对 18/18，并单独确认 activate-tavernweave-soul、consult-tavernweave-library 和 Library 离线挑选页存在。
```

更新：

```text
请把已安装的 TavernWeave 完整更新到这个仓库的最新版本：
https://github.com/LiarMTTT/TavernWeave

更新必须比较“仓库应有目录”和“实际安装目录”，创建新增 Skill，不能只修改旧目录；完成后返回安装回执，再新建任务验证宿主发现。
```

如果宿主或 Agent 使用“把每个 Skill 复制到某个项目级目录”的便携安装方式，可在仓库根运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-tavernweave.ps1 -TargetSkillRoot '<实际 Skill 根目录>'
```

安装或更新后必须对**实际扫描位置**运行核验，而不是只检查源码仓库。核验器默认拒绝把 TavernWeave 源码目录本身当作安装目标：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-install.ps1 -TargetRoot '<实际插件根目录或 Skill 根目录>'
```

通过回执必须包含：

```text
INSTALLATION VERIFIED: 18/18
Library: present-and-matched
Library picker: present
Soul: present-and-matched
Host rediscovery: required-new-task
```

目标目录中的无关个人 Skill 会保留；18 个 TavernWeave 官方目录必须与当前源码逐文件匹配。写入目标最后一级必须明确名为 `skills`；安装脚本拒绝盘符根、用户目录根、源码仓库内部目标和目录链接，替换失败时会回滚已有官方 Skill。

完成 18/18 核验后新建任务或重启会话，使宿主重新发现 Skill。新任务中仍需实际调用 Soul 与 Library；安装回执不能冒充宿主发现。正式发布前请以 manifest、Release 与校验结果为准，不要把工作分支文本当成已经发布。

维护者若只是在发布前自检源码树，可显式使用 `-AllowSourceTree`；该开关不能用于普通用户的安装回执。
