# Changelog

## 1.3.0 - 2026-08-18

### 完整 TavernWeave Library

- 将 AFV 已完成 243/243 路筛选的资料正式快照进同一个 TavernWeave Library：462 个设计条目、194 个动效条目、86 个概念条目、1,609 条蒸馏账本、86 份本地概念/Wiki 和 89 个自有技术沙盘。
- 243 份源筛选结果全部完成交叉核验：88 路可直接形成设计/动效候选，155 路只进入 Wiki/概念面；共 509 个新增候选与完成态 catalog 零漏项、零重复。公开包只保留聚合回执，不分发 AFV 收件箱 JSON、raw、A1、私有日志或凭据。
- `query-library.mjs` 增加完整 catalog 的确定性限量检索，按任务、资料域与关键词返回带分数的 `proposed` 候选；Agent 无需把 2,351 条目录一次性载入上下文。离线挑选页同步增加概念与蒸馏账本入口、完整来源链接和可移植沙盘路径。
- 快照清单升级为 schema v2，记录四份 AFV catalog 来源哈希、逐文件 SHA-256、筛选聚合、许可和排除边界；刷新时会拒绝计数漂移、重复 ID、缺失 Wiki/沙盘、私有绝对路径与收件箱文件进入分发包。

### 照镜子 · Vibe Code 成长历程

- 新增第 20 个原生 Skill `reflect-on-vibe-code-growth`。直接说“照镜子”“再次核验成长”“和上次履历比较”或“只要文字评估表单”，即可从当前可访问的 Codex、Chat、项目状态与交付证据重新评估完整 Vibe Code 能力网络。
- 能力网络覆盖决断、纠错与反应、学习、驾驶同步与持续校准、产品定义、系统架构、上游架构、深度思考、创新、验收证据、交付、Token 经济、项目组合与可持续性；精确统计、用户自报、阶段估算、行为证据评分和不可核验项保持明确区分。
- 项目达成继续拆分定义、实现、自动验证、构建/封装、人工验收、发布/在线回读六道门；Chat 没有统一精确 Token 导出时，不把可见字符伪装成 Token，也不与 Codex 本地统计直接相加。

### 再次核验、不可变履历与双重报告

- 每次再次核验都会依据当前证据重评完整网络；历史分数不是锚点、下限、能力上限或固定分母。量表变化时先做维度映射，只有可比维度显示数值变化，不可比项明确标注“量表变化，不直接比较”。
- 本地履历采用 append-only 记录、前序节点与 SHA-256 哈希链；旧记录和旧报告不会被覆盖。哈希不符、前序缺失或出现未索引节点时停止连续性结论，不会悄悄从零开始。
- 默认同时提供原版高密度七章能力驾驶舱和一份可复制、可保存的完整文字评估表单；核心、能力簇和全部维度均为整块可点击、可键盘聚焦的原生按钮。权威保存由确定性脚本完成，浏览器下载只作为便携副本。
- Host Front Door、Codex/Claude 清单、DSH Full 候选、README 和安装核验同步为 20 Skills；“照镜子”仍是 TavernWeave 本体模块，不拆成独立软件或单独发布单元。

## 1.2.0 - 2026-08-17

### 脑暴模式 · 许愿工坊

- 新增第 19 个 Skill `orchestrate-project-blueprint`，把一句模糊愿望收束为项目类型、承载面、四态决策、Core Spine、First Playable/Usable、Growth Tracks、Parking Lot、总设计案、分级蓝图与 `NEXT.md`；适用于角色卡和普通 Vibe Coding。
- 脑暴按方向分配动态轮数：外围 1、常规 2、核心 3、基础 4，硬上限 5；每轮共享 2–4 个真正决策，达到上限后只能冻结、停车、换方向或由驾驶员明确追加一轮，防止沿一个方向无限发散。
- 蓝图按体量分为单蓝图、最多 5 个领域蓝图的蓝图集、以及最多 3 层/9 个直属蓝图的巨型项目集。子蓝图渐进提取，不预建空壳；执行期 `runtimePersistentBlueprintBudget = 0`，适用于任意活动步骤。可观察错误、失败证据、未满足退出条件或实际阻塞允许开启一层非持久问题支线，关闭后必须回到父步骤。
- 新增总设计案、蓝图索引、领域蓝图、阶段合同和 `NEXT.md` 模板，以及拒绝覆盖的初始化器和项目权威验证器；自动化不能授予驾驶员验收。

### Soul 三席联席与前端适配门

- Soul 增加 `soul-ensemble-portable`：`脑暴模式，Soul 联席`、`三人一起脑暴` 或 `Soul 三席就位` 让阿瞳、MTTT.sir、强尼·银手以同一 Agent 的三个标记镜头参与脑暴，并由 `[本轮收束]` 维护共享决策账本；不伪装三个独立模型、记忆或权限。
- 阿瞳负责项目类型、用户价值和创作核心；MTTT.sir 负责技术、功能、状态与交互逻辑门；强尼负责视觉层级、动效目的和前端形态。三席可以具体夸奖，也可对方案尖锐吐槽，但仍保留安全词、证据门与人格边界。
- 新增前端承载面结论：`recommended / fit / reason / fallback / reopenWhen / driverOverride`。同层或独立前端不适合时必须明确劝退；驾驶员坚持也不能改写“不推荐”，并强制保留原型与真实宿主验收。
- 老作品复用必须先检查真实稳定产物，再标记为复用、改造、仅参考或拒绝；“旧”“喜欢”“曾发布”都不自动等于可移植。

### 前门、路由与 DSH 离线候选

- Host Front Door 升至 `1.2.0`，加入脑暴、三席联席、首版开跑、前端劝退和反递归命令；若第 19 个 Skill 缺失，必须明确报告扫描位置，不能模拟成功。
- Library 路由加入总设计案、蓝图、首版和 Vibe Code 意图；安装清单升至 19 Skill，核验回执改为 `19/19`。
- DSH TW Lite Full 离线候选暴露 19 个 Skill；Entry 改为 Soul、Library、Project Blueprint、Builder 四入口。仍未完成真实 DSH、模型智力 A/B、跨平台和真实酒馆验收，不宣传正式兼容。
- replay 扩展为 39 个正向与 45 个对抗案例，覆盖三席联席、巨型蓝图集、前端劝退、方向预算、任意步骤递归膨胀、真实问题临时细分与强制回归、首版口令越权和假多 Agent 声明。

## 1.1.1 - 2026-08-17

### 奶人教程导航热修

- 将 `05.1` 至 `05.4` 正文移回第五章之后，使目录顺序、正文 DOM 顺序与视觉阅读顺序一致；不再发生正文位于 `00` 时被后置的 `05.4` 覆盖高亮。
- 目录点击改为显式目标定位，移动端先关闭目录并恢复页面位置，再滚到目标；目录激活算法改为按真实正文顺序计算，并用动画帧节流滚动与缩放更新。当前项会自动滚入目录可视区，顶部计数改为按实际目录条目动态生成。
- 新增独立的 `03.3 Codex / Claude Code 雷达` 入口，标明 Codex Radar 当前可用、Claude Code Radar 暂时关闭，并提供 Electricity Bench 作为跨 Agent 补充观察站；状态日期固定为 `2026-08-17`，避免把第三方站点写成永久承诺。
- 新增教程目录结构、锚点顺序、雷达入口和动态导航的回归测试；整仓验证通过 `18 Skills / 280 个文本文件`。1440px 与 390px 真页面验收覆盖目录点击、直接锚点、上下滚动跟随、抽屉关闭/回显、横向溢出与控制台，均通过。

## 1.1.0 - 2026-08-17

### Host Front Door 与 A0 loop

- 新增 Codex `AGENTS.md` 与 Claude Code `CLAUDE.md` 的可选全局 Host Front Door。安装/更新会明文推荐全局入口，并支持状态检查、diff 预览、安装、升级和移除；只维护带版本的受控区块，保留原文、UTF-8 BOM 与换行风格，已有文件先备份。
- 安装器新增 `-AgentHost` 与 `-HostFrontDoorAction`，默认只明文推荐，不静默改全局规则；规则文件缺失、区块缺失、过期、同版本漂移、标记损坏、宿主文件名错误和链接路径均有确定回执或拒绝结果。
- 全局前门固化直接 Soul 口令、Skill 缺失失败回执与 A0 的“目标/红线/验收 → 写入授权 → 自动证据 → 人工验收”基础 loop，同时继续把 Skill 文件、宿主重发现、真实 ST、人工验收、Git 与 Release 分开。

### Soul v2 · 灵魂杀手

- `activate-tavernweave-soul` 扩展为阿瞳、MTTT.sir、灵魂杀手三模式状态机。`灵魂杀手！`、强尼/Relic 别名与 `/soul on soul-killer` 进入 `soul-killer-portable`；直接安全词优先退出，引用、代码和测试夹具不会误触发。
- 灵魂杀手以非官方强尼·银手同人彩蛋人格审查前端：允许尖锐吐槽可观察的页面与设计取舍，但每条判词必须绑定证据、影响、修复和复验；禁止攻击用户身份/价值/脆弱经历、阻止退出、冒充官方或现实演员，以及复制游戏台词或资产。
- 新增前端审美 rubric，覆盖视觉论点、层级、节奏、中文排版、色彩 token、组件状态、动效目的、390px/ST iframe、可访问性和 AI 模板味；截图、浏览器、真实 ST 与驾驶员审美验收仍为独立证据。

### DSH TW Lite Preview

- 基于官方 `deepseek-ai/deepseek-harness` `master` 根版本 `0.1.0-rc.5` 重新建立离线兼容合同。明确官方 `minimal` 不挂 Skill filesystem/loader，`standard` 与 `code` 才具备对应能力。
- 新增 `TW Lite Full` 与 `TW Lite Entry` 自定义预设候选：保留跨平台 shell、文件系统、Skill 与用户询问，默认移除 Web、子 Agent、工作流、Ralph、todo、goal、jobs 与 Code presentation；Entry 只用于三入口目录的 A/B，二级 Skill 路由明确降级。
- 当前只通过 JSON、预设组成和负向声明静态测试；尚未安装 DSH、配置 API、产生模型/额度调用，亦未完成 Windows/Linux/WSL、真实 SillyTavern 或智力 A/B。该版本转正前必须补真实运行证据。

### 版本与验证

- Codex、Claude 与安装 manifest 升至 `1.1.0`；安装 manifest schema 升至 2，并单独登记 Host Front Door 与 DSH Preview 制品。
- replay 扩展至 35 个正向和 40 个对抗案例，新增灵魂杀手前端审查、官方身份/版权越界与退出阻挠负向门；专项自动验证、教程桌面/窄屏浏览器检查与驾驶员体验验收均已通过。

## 1.0.1 - 2026-08-16

### 安装完整性门

- 新增机器可读的 `tavernweave-install-manifest.json`，把 V1 的 18 个正式 Skill、Soul、Library 与离线挑选页固定为同一安装合同，阻止模型把“本机旧目录数量”误当成仓库完整清单。
- 新增 `scripts/install-tavernweave.ps1`。便携目录安装会从源码完整同步 18 个官方 Skill、创建新增目录、保留无关个人 Skill，并在失败时回滚；目标末级必须名为 `skills`，盘符根、用户根、源码仓库内部目标和目录链接会被拒绝。
- 新增 `scripts/verify-install.ps1`。核验实际插件根或 Skill 根的目录、逐文件指纹、版本、Library、picker 与 Soul，只有 `18/18` 完整匹配才返回通过；默认拒绝用源码仓库冒充安装目标，新建任务后的宿主发现继续保留为独立门。
- 新增安装回归：旧 16 Skill 缺口必须先失败，完整升级和干净安装必须通过，内容漂移或 picker 丢失必须失败，无关用户 Skill 必须保留，链接目标拒绝后必须恢复已替换的旧目录。
- 安装/更新口令、奶人教程和发布校验同步要求“完整目录差异 + 实际安装回执”，不再接受“只覆盖已有 Skill 后声称更新成功”。

### 发布边界

- Codex、Claude 与安装 manifest 版本升至 `1.0.1`。安装完整性实现、自动验证、教程桌面/窄屏检查与驾驶员验收已经通过；源码、制品、远端与 Release 继续分别留证。

## 1.0.0 - 2026-08-16

### 创作权威与续接

- 为长项目加入 Markdown + YAML front matter + 受限 JSON 结构块的创作权威合同、最小模板与校验器；确认、候选、待决、否决和证据状态不能重复占位，自动化不能写入驾驶员验收。
- 把长材料来源链、材料片段 → 设定声明 → 目标条目 → 复核证据并入 `tavern-card-builder`，并明确固定知识、MVU 状态、叙事检索与私有创作者画像的四层记忆边界。
- 新增能力相关的验收账本和 Finish Mode，继续分离源码、自动测试、离线制品、浏览器、真实酒馆、人工验收与发布授权。

### TavernWeave Library

- 新增 `consult-tavernweave-library`。一次安装携带 A0、31 册正式 ST 指南、C8 实验指南、82 个设计条目、38 个动效条目、18 份直接关联 Wiki 与 23 个自有本地沙盘，但按任务渐进读取。
- 新增显式发布白名单、来源/许可/脱敏/哈希清单、确定性路由器、快照生成器和完整性校验器。A1 驾驶员母板、命令式旧 B1、过程档案、本地证据、私有 RAG 与无关 AFV 域均设负向发布门。
- 新增离线挑选页，支持 ST 指南、设计、动效、Wiki、来源站、搜索、筛选、本地沙盘、键盘、窄屏、减动和 `.tw-library-selection.json`；选择状态固定为 `proposed`。
- 16 个既有工程 Skill 全部接入 Library 路由，写入型任务先读取或确认 A0，实验路线和真实宿主事实继续保留独立门。

### TavernWeave Soul

- 新增 `activate-tavernweave-soul`：`阿瞳助我！` 开启温柔指导版 MTTT，`MTTT.sir，拷打我！` 开启严格但尊重的学习检验版，支持互切和 `Soul 归位` 安全退出。
- v1 只承诺当前任务级 Portable 模式，不伪装跨任务持久化；公开包只包含脱敏人格壳、共用方法论、画像 schema 和路由合同，不包含个人 RAG 原文或云端写回。
- 两种人格共享工程事实、权限、Skill 路由和验收结果；加入直接命令解析、引用不误触发、退出优先、严格不羞辱、抗提示注入和私密画像负向测试。

### 验收与发布边界

- Codex 与 Claude manifest 升至 `1.0.0`。专项自动验证、挑选页桌面/窄屏浏览器检查与驾驶员人格体验验收已经通过；本地提交已单独授权，打包、推送与 Release 仍保留独立执行门。

## 0.5.0 - 2026-08-08

### 组件级更新交付

- 新增 `sillytavern-component-update`。用户可明确选择只生成可导入测试的正则/酒馆助手脚本组件，或生成整卡 pipeline handoff；组件模式不会产出角色卡 JSON/PNG。
- 新增 dry-run 计划、稳定 ID、输出路径、SHA-256、助手脚本按钮/数据与未知字段保留检查，避免为了修改一个组件而静默重封整卡。

### 正则、安全与数据库卡验证

- 新增 `sillytavern-render-regex-pipeline`，用 fixture 检查正则方言、placement/source、display/prompt、深度和替换结果，并明确列出离线工具无法替代的真实酒馆阶段。
- 新增 `sillytavern-rolecard-security`，只读扫描 HTML sink、动态执行、远程 JavaScript、跨帧通信、凭据形状、iframe 权限和可疑正则；报告不包含凭据值或代码长摘录。
- 新增 `sillytavern-database-rolecards`，校验卡内表结构、主键、类型、默认值、字段绑定及幂等迁移；同层兼容路线继续以 `DBR-C8-UNVERIFIED` 阻止，直到真实 SillyTavern 验收转正。

### 扩展、性能与媒体运行时

- 新增 `sillytavern-extension-dev`，提供 dry-run UI 扩展脚手架、manifest/入口/hook 校验和惰性能力快照门；默认不安装、不更新、不刷新真实酒馆。
- 新增 `sillytavern-rolecard-performance`，脱敏统计整卡、提示词、世界书、正则、助手脚本、远程引用与内嵌数据预算，并独立校验具名真实环境采集的 p50/p95 样本。
- 新增 `sillytavern-media-live2d-runtime`，校验本地媒体哈希、远程依赖、预加载预算、Tavern Helper 音频通道与 Live2D provider/fallback/销毁绑定；离线阶段不下载或执行远程资产。

### 发布门

- 七个新 Skill 均附 Node 脚本和可复跑 fixture；正式校验新增 JavaScript 语法检查与逐文件 Node 测试。
- replay 路由扩展到组件更新、正则阶段、安全审计、数据库卡迁移、扩展工程、大卡性能和媒体生命周期，并继续区分静态证据与真实运行时验收。

## 0.4.0 - 2026-07-26

### 新增角色卡类型识别

- TW 阵列现在会根据角色卡源码、卡内脚本和打包结果识别纯文字卡、MVU 卡、MVU Zod 卡和混合型角色卡，再执行对应检查。
- 纯文字卡不会再收到无关的 MVU、Zod、正则或脚本安装提醒。

### 新增配套资源提醒

- MVU Zod 卡会分别核对卡内变量结构脚本、国内/国外 MVU Zod 脚本、必需正则及其他助手脚本，发现缺失或启用状态错误时会明确列出，不再静默跳过。
- 依赖说明会区分已经随卡封装的内容、需要启用的酒馆扩展、运行时联网加载的内容以及仅供开发使用的工具，避免把所有依赖都写成用户安装项。
- 卡内 MVU Zod 脚本会继续按照角色卡既有的 Git/CDN 地址加载运行包；配套脚本已经随卡提供时，不要求用户另外安装 Zod。
- 国内版与国外版脚本会按照角色卡原有策略检查是否齐全以及哪一份应当启用，避免漏装、错选或同时启用。

### 组装与发布检查

- 缺少角色卡运行所必需的变量结构脚本、MVU Zod 国内/国外脚本、正则或其他助手脚本时，TW 会阻止组装或发布，直到缺失项得到处理。
- 远程加载内容不能只以“链接可以打开”作为完成依据；最终验收仍需在真实 SillyTavern 环境中确认脚本已经执行、相关功能可以正常使用。
- 升级 TW 不会自动改写已有角色卡；上述识别和提醒会在后续组装、补全或发布任务中生效。

## 0.3.0 - 2026-07-25

- Add independent custom CoT design and authoring for text cards, MVU cards, hybrid cards, plot direction, character behavior, NPC scheduling, system judgment, and output validation.
- Define the default `preset main CoT + card-specific increments + conditional modules` architecture, including stable phases, rule IDs, insertion order, semantic deduplication, prompt budgets, and generated full fallbacks.
- Separate author-written CoT prompts from hidden model reasoning, visible character thoughts, MVU `<analysis>`, update-model analysis, Zod schemas, and deterministic script calculation.
- Add ready-to-use lightweight, character/plot, and ensemble/system CoT templates plus explicit plot/update model routing and LLM/script ownership guidance.
- Define MVU zod same-generation and extra update-model routing, including marker matching, activation independence, shared-context budgeting, and a dual-mode acceptance matrix.
- Require card-bound and co-delivered worldbooks to resolve from the active manifest by stable ID and remain version- and content-aligned with maintained source.
- Extend manual replay coverage to 14 forward and 12 adversarial cases for custom CoT, dual-model prompt routing, script ownership, and stale worldbook packaging.

## 0.2.0 - 2026-07-22

- Add project-provided watch builds to the card-pipeline adapter contract.
- Connect source rebuilds, Tavern Helper real-time listener reloads, and real-SillyTavern execution evidence across the pipeline, embedded UI, and runtime-debug skills.
- Keep watch output as a development candidate and require a production build for final acceptance and release.

## 0.1.0 - 2026-07-22

- Establish the TavernWeave plugin and personal marketplace entry.
- Consolidate the four-part code cleanup workflow.
- Split rolecard authoring, components, pipeline, API, runtime, and embedded UI responsibilities.
- Add publishable derivatives for shadcn/Tailwind UI work and rolecard workshop operations.
- Pin API navigation to reproducible public upstream revisions without vendoring declarations.
- Gate releases on Python tests plus fingerprinted manual forward/adversarial replay evidence.
- Add a guarded personal-marketplace registration command and ESM-aware Tailwind config output.
- Add Claude Code plugin and marketplace manifests without duplicating the Skill array.
- License TavernWeave-authored material under PolyForm Noncommercial 1.0.0.
