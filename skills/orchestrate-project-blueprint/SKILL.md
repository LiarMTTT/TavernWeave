---
name: orchestrate-project-blueprint
description: Turn a vague product, character-card, frontend, or Vibe Coding wish into a bounded total design, first-playable contract, scale-appropriate blueprint, resumable NEXT handoff, and evidence-gated first implementation. Use when the user says 脑暴模式, asks to梳理构思/总设计案/蓝图/子蓝图/第一版, wants one-command project kickoff, or needs to stop a long task from recursively expanding. It may convene the TavernWeave Soul trio for labeled critique. Do not use it to bypass repository instructions, driver approval, real-host acceptance, or a focused implementation skill.
---

# 脑暴模式 · 许愿工坊

把“我想要一个东西”收束为可恢复、可验收、不会在执行中无限长大的项目权威链。它不是一句话盲跑器；它把一句愿望变成最短的可靠闭环。

开始任何写入前，先读取仓库 `AGENTS.md`、`NEXT.md`、现有总设计案、蓝图和 Git 状态。若项目会写文件，再通过 `$consult-tavernweave-library` 路由 A0 与最小资料包；角色卡创作继续交给 `$tavern-card-builder`，本 Skill 只拥有项目级收束和执行编排。

## 识别直接触发

只有用户把指令作为当前请求直接说出时才触发。引号、代码块、测试夹具、引用文案和“讨论这句话”都不触发。

- `脑暴模式`、`开始脑暴`：进入中性脑暴。
- `脑暴模式，Soul 联席`、`三人一起脑暴`、`Soul 三席就位`：进入三席联席。
- `按蓝图开跑第一版`：只在设计已由驾驶员确认、首版合同已冻结时进入实施。
- `暂停脑暴`、`结束脑暴模式`：停止扩展，保留当前四态账本和下一道门。

需要确定性识别时运行：

```bash
node scripts/resolve-brainstorm-command.mjs "脑暴模式，Soul 联席"
```

## 脑暴流程

### 1. 恢复权威，不重开宇宙

先判断这是新项目、续接项目，还是老作品重置。续接时以现有权威文件和已验收事实为准；不得另造一套平行总设计案。老作品只作为候选复用源，先问用户是否有稳定作品或组件可供检查。

读取 [brainstorm-protocol.md](references/brainstorm-protocol.md)，然后每轮只推进一个相邻方向，共享提出 2–4 个真正会改变产物的决策。每个方向都有讨论上限，达到上限必须冻结、停车、换方向，或由用户明确追加一轮。

### 2. 选项目类型和承载面

先区分角色卡、独立前端、同层前端、嵌入式界面、通用 Vibe Code 或混合项目。前端形态不是奖励：按 [frontend-fit.md](references/frontend-fit.md) 输出推荐形态、适配等级、理由、降级方案和重新开启条件。

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

1. Core Spine：不可缺的本体骨架；
2. First Playable：第一版必须真实可用/可玩的最小闭环；
3. Growth Tracks：长期更新路线；
4. Parking Lot：本轮不做但不丢失的想法。

不要用“以后再说”混淆首版缺口。必须写清入口、核心循环、状态源、失败路径、交付物和验收证据。

### 5. 选择蓝图体量

按 [blueprint-scaling.md](references/blueprint-scaling.md) 只选一种：

- `single-blueprint`：一个总设计案、一个实施蓝图、一个 `NEXT.md`；
- `blueprint-set`：总设计案、蓝图索引、最多 5 个领域蓝图、`NEXT.md`；
- `program-blueprint-set`：巨型重置项目，最多 3 层和 9 个直属蓝图；子蓝图按需提取，不预建空壳。

可用脚本初始化缺失的权威文件；脚本拒绝覆盖现有文件：

```bash
node scripts/init-project-authority.mjs --root <project-root> --profile single-blueprint --project-id <id> --title <title>
node scripts/validate-project-authority.mjs <project-root>/.tavernweave/project-orchestration.json --automation
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
6. 每个阶段满足退出条件后更新 `NEXT.md`，再进入下一阶段；不能以“代码写了”替代证据。
7. 首版闭环完成后停在驾驶员验收，不自动滚入 Growth Tracks。

## 复用稳定作品

读取 [legacy-reuse.md](references/legacy-reuse.md)。询问是否有用户认可且稳定的旧作品、组件、设计案或运行证据。只在检查真实产物后建立复用账本：`复用 / 改造 / 仅参考 / 拒绝`，并写明证据与新项目中的责任。旧不等于稳定，喜欢不等于可移植。

## 路由实施能力

- 角色卡总创作：`$tavern-card-builder`；
- 精确 ST/酒馆助手/MVU API：`$sillytavern-api-reference`；
- 同层/嵌入式前端：`$sillytavern-embedded-ui`；
- 通用前端设计与实现：按 Library 设计路由选择 UI Skill 和资料；
- 拆分、组装、测试、发布：分别交给对应 TavernWeave 专职 Skill；
- 真机行为：`$sillytavern-runtime-debug` 或目标宿主的真实运行门。

本 Skill 负责让它们沿同一权威链工作，不吞并专业能力。

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
