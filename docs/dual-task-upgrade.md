# 双任务升级与 2.0.0 发行说明

> 当前正式版为 2.0.0，含 23 个 Skill，发行资产见 [v2.0.0 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.0.0)。上一版 1.9.1 含 22 个 Skill。下文保留 v1／v2／v3／v4 候选补丁的原始来源、应用方法及其当时的验证边界；历史命令只用于核对原补丁，不能当作当前 2.0.0 的安装或发布步骤。

2026-10-15。适用固定基线：[`LiarMTTT/TavernWeave@9a8274f9b0a714256195845cab4e4f6ad73e2997`](https://github.com/LiarMTTT/TavernWeave/tree/9a8274f9b0a714256195845cab4e4f6ad73e2997)。

以下记录的是 1.9.1 之后、正式合入之前的**本地候选源码补丁**，当时尚未发布。原正式 1.9.1 的 22 个 Skill 记录保留；候选增加一个独立世界书入口，共 23 个。当时版本字段尚未提升，安装、插件发布与用户酒馆配置均未操作。

## 从哪里用

- 写通用提示规格、从样例归纳可测试规则：[blueprint 的局部提示规格入口](../skills/orchestrate-project-blueprint/SKILL.md#局部提示规格与样例归纳)。一段提示词不需要启动完整工程。
- 设计玩法、地图或可选事件：[原创贯通例](../skills/tavern-card-builder/references/world-mechanics-and-scenarios.md)。适用于非世界书项目，不要求先做一张卡。
- 独立规划、审阅或精修世界书：[worldbook-design-and-writing](../skills/worldbook-design-and-writing/SKILL.md)。只改正文就读写作参考；改拆合/加载再读规划参考；整卡仍由 builder 负责。
- 需要理解酒馆输入与状态链时：[共享运行基础](../skills/consult-tavernweave-library/references/sillytavern-runtime-foundations.md)。先纯文字回合，再按项目需要接模板、MVU 或 UI；不强迫普通世界书跑全套扩展矩阵。

## 实际改了什么，什么直接复用

| 范围 | 基线已有 | 本轮增量 |
|---|---|---|
| 主动厘清 | 共享沟通、blueprint 四态决定、目标与约束 | 在共享沟通维护唯一规则；区分目标/限制/手段，关键缺项才问，小缺口可纠正地推进。blueprint 和世界书入口只接线。 |
| 提示规格与样例 | 首版合同、来源库、自然表达与验收 | 消费者→固定/待填内容→输出合同→冻结候选→未见输入检查；原创路线告示与故意改坏反例。 |
| 世界/玩法/地图/事件 | 世界因果、资源、空间、玩家选择、状态所有权 | 石渡过河贯通例：代价、失败/退出、有向边、稳定 ID、可选节点；不新建总纲、调度器或状态库。 |
| 表达、标题和交付 | 原文风、叙述和去八股诊断 | 补证据到非人物表达约束的交接、保留否定/程度/条件的反例、准确标题与体验简介。已有维度不重写。 |
| 世界书专门方法 | builder 已有事实/知晓程度、正文边界、作者规则、加载与状态交接 | 迁到独立入口并保留旧锚点；补概念限定、自由区/未定项、机制比较、混合交界与具体正文反例。 |
| 技术方法 | API、变量、正则、UI、安全、组件与性能专职流程 | 不复制另一套 API/schema 教材；只补 E03/E05/E06/E07 的世界书合同与证据交接。 |

新 Skill 的必要性是“世界书单独任务可调用”，不是源预设里有同名模块。builder 仍拥有世界构建、角色创作、整卡 Content map、开场、CoT 和最终交付。旧 `worldbuilding-design.md` 与 `lorebook-and-prompts.md` 保留兼容标题及导航，不保留两份完整世界书教程。没有删除任何整个源文件。

## 已批准取舍

- C01：保留有效否定、程度、条件和示例。不能把“通常”压成保证，也不能把“未核实不得通行”压成“核实即可通行”。
- C02：模板可选，无通用 XML/YAML、最低字数、板块、候选或关键词数量配额。真实解析格式仍严格保护。
- C03：授权范围内可补普通细节；新增核心设定、玩法目标或重大剧情先提案。事件图不替玩家决定路线。
- C04：继续关闭原生递归的两个方向；删固定 order 数字配方和模型品牌绑定深度，保留宿主 `order` 字段。插入深度仅作有理由的场景选择；已有扫描深度 2 政策不变。六类 EJS 来源情境非独占、可调整；依赖原生递归的动态关键词不采用，状态栏交 UI。
- 2026-10-15 另获批准的 A0 最小修订：仍检查目标、限制、验收；上下文明确就推进，只有关键缺项/冲突才问。同步移除开工与续接时机械三句/逐句确认门。通过 `guide-corrections.json` 维护，保留源 hash 并更新目标 hash，避免下次快照覆盖修订。
- P049/P050/P051 整组排除，没有改名吸收；P052 等人物写作、破限和预设人设不迁入。TW 原有独立去八股及角色能力保留。P073 仍待核，没有为它造方法或产物。

## E01–E07 逐项落点

| 包 | 实际权威与交付 | 本轮能证明的内容 / 下一步 |
|---|---|---|
| E01 机制选择 | [planning §4](../skills/worldbook-design-and-writing/references/planning-and-loading.md#4-e01-choose-the-least-complex-sufficient-mechanism) | 原生、简单条件、既有控制器+显式读取、局部混合的能力/代价/升级退出理由。具体版本仍须 E03。 |
| E02 同需求比较 | [桥梁三方案](../skills/worldbook-design-and-writing/references/examples.md#1-e02-one-bridge-three-designs) | 真/假/缺值/入口不可达的期望。原生短规则会发送规则两分支，不能冒称满足严格“只发送适用分支”。 |
| E03 版本核验 | [固定源码记录](../skills/sillytavern-api-reference/references/worldbook-version-verification.md) | 宿主、模板、助手、MVU 固定修订；读取、角色消息窗口、作用域/缓存、入口和预算的窄源码结论。用户目标版本与运行行为未知。 |
| E04 优先级 | [planning §5](../skills/worldbook-design-and-writing/references/planning-and-loading.md#5-e04-state-choice-and-mention-precedence)、[中性路由例](../skills/worldbook-design-and-writing/references/examples.md#5-neutral-routing-example) | 状态、显式选择、普通提及、跨时代比较、否定、失败写入与歧义的选择表及静态反例。 |
| E05 完整性 | [类型目标与状态合同](../skills/sillytavern-database-rolecards/references/worldbook-target-state-contract.md) | 类型/目标/别名/哨兵、时期章节一致性、合法 0/false、消息/候选作用域；既有 field ledger 仍是唯一数据权威。 |
| E06 去重与预算 | [世界书输出预算](../skills/sillytavern-rolecard-performance/references/worldbook-output-budget.md) | 跨原生/模板/控制器身份去重、必要项依赖、可选裁剪及硬超额失败。静态单位不是实际模型 token。 |
| E07 运行验收 | [隔离运行检查](../skills/sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md)、自写 JSON 夹具、空白观察记录及结构检查器 | 已有可执行的离线合同检查；真实宿主入口→最终请求、状态前后→下轮消费与模型行为均 **not-run**。结构合格不等于证据真实或运行成功。 |

E03 的示例源码结论不等于最新发布或用户安装状态。尤其原卡的 `getChatMessages(-1, 'user')` / `(-1, 'assistant')` 在所查模板修订先过滤角色再 `slice(-1)`；不能沿注释称为最近三条，也不能套用助手同名 API。

## 来源与逐条覆盖

按最新要求，Skill 正文、配套参考和夹具不含两份素材的作品标识、原卡 UID 或来源索引；只保留通用方法、中性自写例和必要官方技术依据。真实追溯保存在本节、[方法迁移记录](worldbook-source-migration-notes.md)与[运行反例来源记录](worldbook-runtime-source-notes.md)，不作为 Skill 日常加载内容。通用概念、API 和标准格式不作机械改名；独特长段、原书摘录及源码模板不照搬。

完整机器可读核对：[dual-task-adoption.json](dual-task-adoption.json)。151 项连续零基索引、原 identifier 和名称均与原 JSON 对应；每项记录采用/复用/排除/待核、范围限制及方法组，方法组给实际基线章节、目标和验证位置。任务 A 的方法另外保留逐项基线/实际缺口说明。

- 源预设 SHA-256：`f7c3a88836bda71f35353d2193d0db0ec0430d1af275d1e9957bdf6930936e4a`。原规划分为 85 排除、29 部分候选、36 复用、1 待核；这是源分类，不表示 29 项都必须新增代码或整篇搬运。
- 真实卡 SHA-256：`d2de21bc259711f984a4163a1f71812ea52460ea1e81e95398dc271ae4f8986d`。只读核对为 526 条、26 启用、18 启用常驻、8 启用非恒定原生条目、6 含 EJS。4 控制器只证明静态意图，禁用资料是否实际读到由 E03/E07 验证。
- P150 与 `extensions.SPreset` 的解析副本相等，四个 regex 配置副本相等；这是静态比对，不是脚本安全或执行结果。
- 长篇书籍和教程仅作方法结构/相关段落核对，不复制原书。长 HTML、正则、加载器没有逐行完整安全审计；它们及原卡/预设均未执行。
- 补丁不附完整预设、原卡、用户原始拆解全文或远程脚本。来源与改写边界只保留在交付文档 [worldbook source notes](worldbook-source-migration-notes.md)。原仓库 [LICENSE](../LICENSE) 和附带来源说明保留；本补丁不改变许可或主张第三方素材所有权。

## 应用方式

### v4：开场白的前端形式

核心组件仍是可用的开场白与世界书。开场白可以用正文、开场白前端或两者结合实现；可用的前端形式不需要再附一份纯文本开场白。这项澄清不决定后续是否使用前端，也不新增卡类型或要求 MVU。

共同核心定义是唯一规则出处；开场策略与 UI 实现负责真实 `first_mes`／分支载体、玩家入口和模型可见内容。场景展示、选项页按其功能检查，配置向导保留草稿、确认和真实提交约束。空字段、空壳页面或无法加载的占位标记不能充当已完成开场。按钮、状态写入或消息发送一旦采用，仍须验证其实际行为。

v1、v2、v3 原包保留。v4 另交从固定原基线生成的全量补丁，以及适用于完整 v3 候选的增量补丁，两者择一。当前改动为规则澄清与静态回归，未进行真实酒馆或模型测试。

### v3：自然表达与统一教学例

本轮通读全部 23 个 Skill 的自有指导、参考与文字模板，改写真正妨碍理解的句子。清楚的说明和有用清单保留；代码、接口、参数、步骤次序、适用范围与验证状态不因润色而改义。

世界书、路线提示规格与玩法贯通例统一采用原创的榆冠王国石渡。守卫条目写明维持通行和民事裁断的区别，港规交代货引及赈济通道的缘由；秘密保留事实与知情范围。三种桥梁加载方案、同名异义、等义措辞与位置比较继续检验原来的技术问题。新增的守卫场景是作者定义的语义预期，不是模型实测。

两项技术纠错经过单独确认，没有当作等义润色处理：没有战斗时只跳过战斗判断，其他系统判断按需保留；角色心理、约定结算结果或简短依据可以输出，文风不能作为展示完整内部推理的理由。另纠正 CoT 定义中的主体笔误。A0 的“30 秒”“一半返工”无测量依据，已通过原有更正记录改为检查目标、边界的直接说明；源 hash 保留。

v1、v2 原包独立保留。v3 提供从固定原基线生成的全量补丁，以及仅适用于完整 v2 候选内容的增量补丁。两种应用方式择一，不连续叠加。版本字段仍为 1.9.1，Skill 数量与各自职责不变；没有安装、发布或新增运行机制。

### v2：补齐研究落实的三项缺口

v2 在原候选上作窄范围补充，不重写既有方法，不增加新的 Skill 或技术运行权威：

1. [研究依据映射](../skills/worldbook-design-and-writing/references/research-sources.md)随补丁提供 13 项原始资料的具体落点、支持范围与限制。技术写作、知识组织、厂商实践和三篇论文分别标明用途；不把 TW 原有方法迁移说成论文新增成果。
2. [可选行为对照](../skills/worldbook-design-and-writing/references/behavioral-validation.md)补同义表述、本地定义/概念表述、上下文位置三类设计。控制条件、语义预期、长度/信息量混杂、未见场景、实际输入证据、失败记录和判断边界均有说明；不强制每条实验，不增加模型调用授权。
3. [同名异义例](../skills/worldbook-design-and-writing/references/examples.md#6-one-label-two-local-meanings)区分“白塔”建筑与救援组织；写作参考补概念标签、本地定义与稳定身份的区别。示例由本次自写，不依赖 RDF，也不把标签当成已实现的触发条件。

新的 JSON 夹具仅保存验证设计与作者预期，`modelCallsMade: 0`、`actualResults: []`、`status: not-run`。静态测试只核验夹具与文档的一致性，未证明模型行为或长上下文性能。通用源素材排除、原生递归关闭、扫描深度 2、C01–C04、E03/E05/E06/E07 的职责不变。

v1 包独立保留。v2 全量补丁从同一固定基线生成；另提供仅适用于完整 v1 候选内容的增量补丁，两者择一，不连续叠加。人读中文阅读材料独立放在交付包中，不新增第二份 Skill 权威正文。

### 从固定基线应用全量补丁

在已有 TW **源码工作副本**中操作，先备份自己的未提交工作。以下是手动检查步骤，不是安装脚本：

```sh
git rev-parse HEAD
git status --short
# HEAD 必须为 9a8274f9b0a714256195845cab4e4f6ad73e2997，工作树/索引必须干净。
git apply --check /path/to/TavernWeave-dual-task-upgrade-v4.patch
git apply /path/to/TavernWeave-dual-task-upgrade-v4.patch
git diff --check
```

HEAD 不同、有本地修改、文件缺失或任一检查报冲突时停止，先审差异。不要自动 `reset --hard`、覆盖整目录、强制补丁或盲用三方合并。补丁包含新增文件；应用只是改这份源码，不会安装到 Codex/Claude/DSH、不改酒馆、不自动运行脚本。完整源码包可用于审阅，但其中 1.9.1 版本字段不代表这是正式 1.9.1 发布物。

## 验证与未测边界

具体执行命令、逐文件结果、独立审查与干净基线应用结果随交付包提供。仓库新增测试覆盖路由/清单/定向纠正、通用方法、世界书设计、运行合同；v2 另加研究映射与三类验证设计检查。其他适用 Node 与 Python 检查、库校验、同步与相对链接/锚点检查结果以本次交付日志为准。

可以单独复查本轮主要静态门：

```sh
node --test tests/greeting-frontend-contract.test.mjs tests/dual-task-integration.test.mjs tests/general-methods-integration.test.mjs tests/worldbook-design-writing.test.mjs tests/worldbook-runtime-contracts.test.mjs tests/worldbook-research-design.test.mjs
node skills/consult-tavernweave-library/scripts/validate-library.mjs
node scripts/sync-guidance.mjs --check
node skills/sillytavern-runtime-debug/scripts/validate-worldbook-observation.mjs skills/sillytavern-runtime-debug/tests/fixtures/worldbook-runtime-observation.pending.json
python -B tests/test_plugin_packages.py
```

原 v4 交付环境没有 PowerShell，当时未执行 `validate-release.ps1`、安装门及 host-front-door 的 PowerShell 集成测试。没有真实 SillyTavern、扩展配置与模型调用授权，故未导入用户卡、未做插件宿主加载、真实最终请求捕获、状态/分支运行或付费模型对照。教学夹具不是实际应用验收。本机后续修订见下节，不把历史未测项改写成当时已通过。

原 v4 包保留了历史 `tests/replay` 案例、结果和目录指纹，没有伪造新增模型回放或仅重算指纹过门；当时受影响旧 Skill 的指纹需要复核，新世界书 Skill 缺主路由回放。打包器的数量回归使用隔离测试仓库，不是候选发布包或用户安装。原交付停止点是可审阅、可应用的候选源码补丁。

## 2026-10-16：并入前修复适配

驾驶员在本机审查后明确允许并入前修复。沿用本包的 23 个技能及功能范围，只修正蓝图技能描述中的 YAML 字符串引用；实际路由已接入，不新增第二套路由。当前源码安装说明改为按清单核对 23/23，已发布 1.9.1 的 22 技能历史保留。

本轮 [书面复核记录](../tests/replay/runs/2026-10-16-v4-premerge/manifest.json) 对原 80 正向、90 对抗的有效完整答复逐案复核，170 条仍与当前合同兼容；其中一条沿用 1.9.1 已评审的修订答复，其原答复和先前缺项记录均保留。新世界书技能增加 6 正向与 6 对抗案例，独立作答与评审分开：首评 11 条通过、1 条补齐未见样例及比较控制后复评通过，首轮和修订都随记录保留。当前案例总数为 86 正向、96 对抗；完成复核后才更新候选指纹。这是书面合同证据，不是 182 次新模型试跑或真实宿主验收。

并入前 Windows 完整检查、官方 Skill 格式与打包回归的实际结果见唯一续接文件[第 30 节](../UPDATE_PLAN_CANDIDATE.md#30-tavernweavex无限月读-v4-并入前修复适配2026-10-16)所指外部回执。当时版本字段仍为 1.9.1，未制作正式发行身份；合入、正式版本收敛、提交、安装、推送及发布留待后续授权。

## 2026-10-16：本地合入 2.0.0（发行前记录）

驾驶员授权将已审阅的 v4 修复并入升级，版本号定为 **2.0.0**。本地源码在原 22 个 Skill 上增加 `worldbook-design-and-writing`，共 23 个；原安装标识 `tavernweave-agent-skills`、Codex／dots 共用插件和兼容流程保持。当时拟沿用 `TavernWeave-Codex-v2.0.0.zip` 命名，不另造 dots/cloud 包；本地合入阶段尚无可下载的 2.0.0 Release 或校验文件。

上节是**并入前**修复记录，其“版本字段仍为 1.9.1”和“尚未合入”只描述当时的状态。本次合入不改写 v1／v2／v3／v4 的补丁来源、170 条旧答复复核和 12 条新增书面案例；这些记录不能算作 182 次新模型试跑。静态检查、包内容核验、客户端真实发现、dots 云端运行、真实 SillyTavern／模型行为、驾驶员验收、提交和公开发布各有独立证据门。当时完成的是本地源码合入与版本收敛；正式发行结果见下节和实际回执。

## 2026-10-16：2.0.0 正式交付

2.0.0 正式发行包从 [v2.0.0 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v2.0.0)获取，以同页 `SHA256SUMS.txt` 核对下载文件。Codex 与 dots 共用 `TavernWeave-Codex-v2.0.0.zip`；安装标识仍为 `tavernweave-agent-skills`，共 23 个 Skill。历史 [v1.9.1 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.9.1)保留原 22 技能包，不与本版安装清单混用。

本轮源码提交、发行包构建、文件大小和 SHA-256、签名状态、推送与公开发布的实际回执，统一见[续接记录第 32 节](../UPDATE_PLAN_CANDIDATE.md)及其所指的 `E:/Test Area/TavernWeave/2.0.0/release-20261016/` 外部证据。发行包内容校验与真实 Codex／dots 发现、云端长任务、SillyTavern／模型／设备行为和驾驶员体验是不同的检查；本页不把前者写成后者已通过。
