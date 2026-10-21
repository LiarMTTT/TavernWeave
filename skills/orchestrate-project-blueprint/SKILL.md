---
name: orchestrate-project-blueprint
description: "Turn a vague product, character-card, frontend, or Vibe Coding wish into a bounded total design, first-playable contract, scale-appropriate blueprint, resumable NEXT handoff, and evidence-gated first implementation. Use when the user says 脑暴模式 (including 脑暴模式，Soul 联席), asks to 梳理构思/总设计案/蓝图/子蓝图/第一版, wants one-command project kickoff, wants a project progress board with evidence-based percentages and feedback, or needs to stop a long task from recursively expanding. Also use for 提示词规格/从样例归纳提示词: turn requirements or output examples into a scoped prompt contract with unseen-input checks. It may convene the TavernWeave Soul trio for labeled critique; the 联席 voice itself is loaded by `$activate-tavernweave-soul`. Do not use it to bypass repository instructions, driver approval, real-host acceptance, or a focused implementation skill."
---

# 脑暴模式 · 许愿工坊

<!-- tw-guidance-entry:begin -->
## Shared communication

Apply [TW plain-language and guidance rules](../consult-tavernweave-library/references/communication-and-guidance.md): explain terms on first use, keep the user-selected 新人/入门/熟练/老手 level, and still explain needed changes and bugs at every level. Soul and prose modes never disable this baseline.
<!-- tw-guidance-entry:end -->

<!-- tw-plugin-runtime-entry:begin -->
## Plugin runtime

When this Skill runs through a plugin, cloud host, or remote machine, read [the plugin execution contract](../consult-tavernweave-library/references/plugin-runtime.md) at entry and apply its host, tool, and persistence checks before host-specific commands. Keep this Skill's scope, authorization, and acceptance gates.
<!-- tw-plugin-runtime-entry:end -->

帮用户把想法整理成能实施的设计，定好第一版做什么、怎样验收，以及下次从哪里继续。先理清范围再执行，避免项目边做边扩大；一句愿望也可以从这里开始。

用户可以直接说愿望，不必先说“脑暴模式”。从零创作时先帮其形成可试用的小成果；完全没想法时给一两个贴合兴趣的小例子。接手角色卡二创/续更先交给 `tavern-card-builder` 看懂原卡；熟悉作品的增改先续接原决定；故障按实际现象交给相关能力。普通问答不强制进入完整引导；完整引导需要用户选择挡位，但暂未选择也不能自动归档或阻止有用的帮助。

开始任何写入前，先读取宿主实际加载的项目指令与续接文件。Codex 要尊重从项目根到当前目录的指令链、有效的 `AGENTS.override.md`／`AGENTS.md` 和已配置的备用文件名；Claude Code 读取其实际生效的项目规则，其他宿主按项目自述的等效续接文件。不要用插件安装映射覆盖项目指令，也不要为适配新建更高优先级文件。再核对 `NEXT.md`、现有总设计案、蓝图和 Git 状态。若项目会写文件，再通过 `$consult-tavernweave-library` 查找并阅读 A0 与本任务所需资料。角色卡创作交给 `$tavern-card-builder`；本 Skill 负责确定项目范围、组织设计与执行顺序。

## 局部提示规格与样例归纳

用户要把需求写成提示词、从样例归纳规则或检查输出要求时，读 [prompt-spec-contract.md](references/prompt-spec-contract.md) 中相关部分，直接给出本次规格、正文和适用的验证。无需为此启动 Soul、完整脑暴或新建项目权威文件。已有项目沿原决定更新；资料证据交给 `$build-work-library`，文辞精修交给 `$rewrite-natural-prose`。样例只能支持候选规则，不能证明找回了原作者提示，也不能保证复现。

## 识别直接触发

只有用户把指令作为当前请求直接说出时才触发。引号、代码块、测试夹具、引用文案和“讨论这句话”都不触发。

- `脑暴模式`、`开始脑暴`：进入中性脑暴。
- `脑暴模式，Soul 联席`、`三人一起脑暴`、`Soul 三席就位`：进入三席联席。
- `按蓝图开跑第一版`：只在设计已由[驾驶员](../consult-tavernweave-library/references/communication-and-guidance.md#共享术语)确认、首版合同已冻结时进入实施。
- `暂停脑暴`、`结束脑暴模式`：停止扩展，保留当前四态账本和下一道门。

需要确定性识别时运行：

```bash
node <skill-root>/scripts/resolve-brainstorm-command.mjs "脑暴模式，Soul 联席"
```

## 脑暴流程

### 1. 恢复权威，不重开宇宙

先判断这是新项目、续接项目，还是老作品重置。续接时以现有权威文件和已验收事实为准；不得另造一套平行总设计案。老作品只作为候选复用源，先问用户是否有稳定作品或组件可供检查。

先用共享[主动厘清需求](../consult-tavernweave-library/references/communication-and-guidance.md#主动厘清需求)识别结果、硬限制和候选手段，再读 [brainstorm-protocol.md](references/brainstorm-protocol.md)，把已确认结果和暂定假设接回原四态决定。每轮只推进一个相邻方向；需要提问时优先 1–2 个真正会改变产物的必要决策，三席合计最多 4 个，这是上限而非配额。允许用户说“不知道，你推荐”，并解释推荐的结果与取舍。每个方向都有讨论上限，达到上限必须冻结、停车、换方向，或由用户明确追加一轮。

### 2. 选项目类型和承载面

先区分角色卡、独立前端、同层前端、嵌入式界面、通用 Vibe Code 或混合项目。按项目需要选择前端形态，再用 [frontend-fit.md](references/frontend-fit.md) 写明推荐形态、适配等级、理由、降级方案和重新评估条件。

若同层或独立前端不适合，明确劝用户不要强上。用户坚持时记录 `driverOverride: true`、风险和原型/真机门；这不会把“不推荐”改写成“推荐”，也不会免除验收。

### 3. 可选 Soul 三席联席

按 [soul-ensemble.md](references/soul-ensemble.md) 在一个 Agent 内切换三种审查镜头：

- `[阿瞳]：`确认项目类型、用户价值、创作核心和是否跑偏；
- `[MTTT.sir]：`指出技术、功能、状态、交互逻辑门与证据缺口；
- `[强尼·银手]：`审查视觉层级、动效目的和前端适配，直言问题但不攻击用户；
- `[本轮收束]：`只保留已确认、提案中、待决定、已否决四态账本。

三席是同一 Agent 的三个角色镜头，不是三套独立模型、记忆、权限或无上限辩论。优秀设计可以具体夸奖；批评必须能导向修正。

### 4. 冻结第一版

按 [first-version-contract.md](references/first-version-contract.md) 把构思分成：

1. Core Spine（核心骨架）：缺了就不是用户想要的那个作品的内容；
2. First Playable（首个能玩的版本）：用户能进入、做一次核心操作并看到结果的小作品；
3. Growth Tracks（后续更新方向）：首版验证后再逐步加入的内容；
4. Parking Lot（暂存想法）：这次先不做、以后还能重新讨论的提议。

不要用“以后再说”混淆首版缺口。必须写清入口、核心循环、状态源、失败路径、交付物和验收证据。

### 5. 选择蓝图体量

按 [blueprint-scaling.md](references/blueprint-scaling.md) 只选一种：

- `single-blueprint`：一个总设计案、一个实施蓝图、一个 `NEXT.md`；
- `blueprint-set`：总设计案、蓝图索引、最多 5 个领域蓝图、`NEXT.md`；
- `program-blueprint-set`：巨型重置项目，最多 3 层和 9 个直属蓝图；子蓝图按需提取，不预建空壳。

可用脚本初始化缺失的权威文件；脚本拒绝覆盖现有文件：

```bash
node <skill-root>/scripts/init-project-authority.mjs --root <project-root> --profile single-blueprint --project-id <id> --title <title>
node <skill-root>/scripts/validate-project-authority.mjs <project-root>/.tavernweave/project-orchestration.json --automation
```

## 设计确认门

脑暴结束时只交付总设计案、蓝图、待决定项和验收方案。只有驾驶员明确确认设计或说“按蓝图开跑第一版”，才允许在已冻结 First Playable 范围内写项目文件。

确认不授权以下动作：安装/卸载、密钥或付费 API、真实外部发布、Git 提交/推送/打标签、部署、删除历史资料、修改全局 Agent 规则。它们仍需各自授权。

## 按蓝图执行

读取 [anti-fractal-execution.md](references/anti-fractal-execution.md) 和 [autonomy-and-gates.md](references/autonomy-and-gates.md)：

1. 一次只激活一个蓝图阶段，先写该阶段的输入、输出、改动边界、退出条件和证据。
2. 所有活动步骤都禁止无依据地递归增殖；`runtimePersistentBlueprintBudget` 固定为 0，只禁止执行期自行新增持久权威蓝图，不禁止解决真实问题所需的临时细分。
3. 当前步骤出现可观察错误、失败证据、未满足的退出条件或实际阻塞时，允许建立一层最小必要的临时问题支线。它必须绑定父步骤、保存触发证据、不扩大产品范围，也不新增完成分母。
4. 临时问题支线解决、否定或确认阻塞后必须关闭并回到父步骤原有顺序与退出条件；不得在支线内继续递归生成持久层级。
5. 只有问题已经形成独立领域、独立交付物和独立验收门，且父蓝图无法清楚容纳时，才停止当前执行、提交 `rescope proposal` 并等待驾驶员决定是否提取子蓝图。
6. 每个阶段满足退出条件后更新 `NEXT.md`，再进入下一阶段；不能以“代码写了”替代证据。已采用画板同步的项目，先维护总设计案的范围块与 NEXT 的状态块，预览并核对差异后同步画板；范围变更先走原有决定门。
7. 首版闭环完成后带用户亲手试用，解释失败恢复方法，再帮助其提出一次有具体目标的修改；在用户许可内完成第二次修改并再次试用。然后停在本次驾驶员验收，不自动滚入 Growth Tracks，也不以“教学”为由擅自修改文件。

## 项目进度画板

用户要审核进度、看百分比、记新想法、报 Bug 或留审核意见时，读取 [progress-board.md](references/progress-board.md)。只在用户选择的项目内建立 `progress/`；先恢复已有总设计案、活动蓝图、`NEXT.md` 与验收证据，避免给旧项目另立进度正典。

`progress/progress.json` 是带来源版本的展示投影，`NEXT.md` 仍是唯一当前续接指针。实现进度与验收进度分别按已确认范围、检查点权重和证据计算；范围未确认时不展示百分比，100% 也不代替真实宿主、驾驶员或交付门。想法、Bug 与审核意见独立记录，只有明确决定及相应证据才能回写项目权威；记录意见本身不授予 Git、安装或发布权限。页面无法真正落盘时须明确显示只读或待提交草稿。

用户选择与项目文档同步时，总设计案的 `tw-progress-scope` 块定义事项、权重与验收要求，NEXT 的 `tw-progress-state` 块记录当前事实、证据和下一道门。使用 `init-sources` 初建，或 `source-plan` / `sync-sources` 接入与更新已有画板；按实际旧项目路径选来源。标记损坏、遗漏事项、版本不一致要先修正文档，不能退回手工 JSON 补成成功。预览绑定来源、画板、反馈与证据版本，变化后重新核对；新驾驶员通过记录仍须明确确认依据。反馈处理后维护相关权威，再生成画板；正文和结构块一致性须由 Agent 审查。

## 复用稳定作品

读取 [legacy-reuse.md](references/legacy-reuse.md)。询问是否有用户认可且稳定的旧作品、组件、设计案或运行证据。只在检查真实产物后建立复用账本：`复用 / 改造 / 仅参考 / 拒绝`，并写明证据与新项目中的责任。旧不等于稳定，喜欢不等于可移植。

## 路由实施能力

- 角色卡总创作：`$tavern-card-builder`；
- 独立世界书规划、正文或原生/模板/局部混合选择：`$worldbook-design-and-writing`；
- 涉及酒馆运行依赖且当前上下文尚未理清时，按需读[共享运行基础](../consult-tavernweave-library/references/sillytavern-runtime-foundations.md)，先纯文字回合，再接所选扩展；已有完整上下文不重复读，无关项目不加载；
- 世界因果如何变成玩法、有向通行与可选事件：按需读 [world-mechanics-and-scenarios.md](../tavern-card-builder/references/world-mechanics-and-scenarios.md)，不另建事件调度器；
- 精确 ST/酒馆助手/MVU API：`$sillytavern-api-reference`；
- 同层/嵌入式前端：`$sillytavern-embedded-ui`；
- 通用前端设计与实现：按 Library 设计路由选择 UI Skill 和资料；
- 前端设计交接统一引用[前端质量规范](../consult-tavernweave-library/references/frontend-design-quality.md)。Agent 主动检索相关设计，从作者想法形成主方案，并尽量可视化说明；按 Awwwards 默认质量要求审阅，去掉无意义小字和额外英文说明。沿用已有设计授权，不增加工作表确认门；
- 拆分、组装、测试、发布：分别交给对应 TavernWeave 专职 Skill；
- 真机行为：`$sillytavern-runtime-debug` 或目标宿主的真实运行门。

各专项能力沿用同一份项目决定；本 Skill 负责组织交接。

## 交付格式

返回：

1. 项目类型、推荐承载面与不适配告警；
2. 本轮 `[阿瞳] / [MTTT.sir] / [强尼·银手] / [本轮收束]`（仅在联席模式）；
3. 四态决策账本与每方向剩余讨论次数；
4. Core Spine、First Playable、Growth Tracks、Parking Lot；
5. 蓝图档位、权威文件路径、当前活动阶段、持久蓝图预算和临时问题支线状态；
6. 老作品复用账本；
7. 已取得的自动化/静态/真实宿主/驾驶员证据；
8. 下一道门和一句可执行续接指令。

若本轮使用画板，再给出基线与来源版本、实现/验收百分比的计算范围、反馈保存回执或失败原因，以及仍待确认的门；不把百分比写成驾驶员验收结论。
