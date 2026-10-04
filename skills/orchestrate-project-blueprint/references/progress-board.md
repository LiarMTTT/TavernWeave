# 项目进度画板：范围、证据与反馈

本画板帮助驾驶员看清当前范围、实现证据、验收缺口和待处理反馈。它是项目内 `progress/` 的本地能力，不创建跨项目工作台，也不取代总设计案、活动蓝图和 `NEXT.md`。新项目依原有权威链初始化；旧项目先读现有权威与验收记录，选定可核对的来源文件，不要求迁移到新的蓝图格式。`NEXT.md` 始终负责“现在从哪里继续”。以下来源同步随 **v1.8.0** 提供；具体项目的安装、真实宿主与驾驶员验收仍按各自的交付门核对。

## 项目文件与工具

| 文件或工具 | 职责 |
|---|---|
| `progress/index.html`、`board.css`、`board.js` | 本地画板；展示计算结果、来源、证据、缺口和反馈。 |
| `progress/progress.json` | `tavernweave/progress-board/v1` 结构化投影；可重建，不是第二份进度正典。 |
| `progress/feedback.json` | `tavernweave/progress-feedback/v1` 项目反馈记录与历史，独立于计划和验收结论。 |
| `scripts/project-board.mjs` | `init-sources`、`source-plan`、`sync-sources` 用于双来源同步；`init`、`sync` 仅用于未启用来源同步的手工投影；另有 `check`、`export`、`serve`。初次建立不得覆盖现有文件。 |
| `scripts/record-progress-feedback.mjs` | `add`、`update` 反馈；写入前比对版本，写后回读并给出回执。 |

这些脚本是本 Skill 内的相对路径。静态打开或导出的画板只读；如提供填写表单而没有可用的本地写入通道，应把内容标为“待提交草稿”，提供导出或 CLI 途径，不能以浏览器缓存、复制成功或按钮点击声称已经落盘。`serve` 只为所选项目的本地使用服务，不产生部署、外部上传或发布授权。

## 双来源同步：总设计案定范围，NEXT 记现状

启用是项目选择，不是安装画板时的默认迁移。在项目实际总设计案中放入唯一一对 `<!-- tw-progress-scope:begin -->` / `<!-- tw-progress-scope:end -->`，两标记之间须是一个完整的 `json` 代码围栏及其中的单个 JSON 对象；在实际当前续接文件中放入唯一一对 `<!-- tw-progress-state:begin -->` / `<!-- tw-progress-state:end -->`，格式相同。新项目模板仅预留说明，不预填假范围或假完成记录。旧项目可指定现有设计案和续接文件名，不要求迁移到新的蓝图格式。只要出现标记却缺另一端、重复、围栏或 JSON 损坏、版本不支持，就应报结构冲突，不退回手工同步。

范围块使用 `tavernweave/progress-scope/v1`：`revision` 为非负整数；`project` 带 `id/title/version`；`baseline` 带 `id/label/confirmed/reference`，需要免除门时还带对应的 `exemptions`；`items[]` 各有稳定 `id/title/module/weight/scope`，其中 `scope` 只能是 `current` 或 `parked`；每个检查点有稳定 `id/title/weight/gateKinds[]`。`gateKinds` 只列这一检查点适用的 `automated`、`browser`、`real-host`、`driver` 门。总设计案正文仍解释目标、取舍与范围确认依据，结构块让工具准确读取已决定的定义。

状态块使用 `tavernweave/progress-state/v1`：`revision` 为非负整数；`projectId/designRevision/baselineId` 必须与范围块一致。`handoff` 记录 `currentStep`、`nextGate`、`openRisks[]` 和 `feedbackRefs[]`，并与 `NEXT.md` 正文中的当前续接事实一致。`items[]` 按范围块的全部事项 ID 逐一列出 `activity: todo|doing|blocked`、`summary`，每个检查点按定义逐一列出 `implemented`、项目内 `evidence[]` 和 `gates[]`。每道门沿用画板原有的 `kind/status/evidence`，通过驾驶员门还需明确 `confirmationRef`，不适用门还需原因与基线免除依据。事项、检查点和门必须精确覆盖定义：遗漏、重复或额外 ID 都是冲突，不能由工具猜测补齐。

下面是**纯结构示例**，没有实际项目进度或验收证据。复制到项目文件时，复制每段四反引号 `text` 展示围栏里面的内容，也就是标记与其间完整的三反引号 `json` 代码块；先换成已核对的项目事实，不能直接把示例里的 `confirmed` 改成 `true`：

````text
<!-- tw-progress-scope:begin -->
```json
{
  "schema": "tavernweave/progress-scope/v1",
  "revision": 0,
  "project": { "id": "example", "title": "示例项目", "version": "候选" },
  "baseline": { "id": "scope-1", "label": "范围待确认", "confirmed": false, "reference": "" },
  "items": [{
    "id": "entry", "title": "核心入口", "module": "核心流程", "weight": 1, "scope": "current",
    "checkpoints": [{ "id": "open", "title": "完成一次核心操作", "weight": 1, "gateKinds": ["automated", "driver"] }]
  }]
}
```
<!-- tw-progress-scope:end -->
````

````text
<!-- tw-progress-state:begin -->
```json
{
  "schema": "tavernweave/progress-state/v1",
  "revision": 0, "projectId": "example", "designRevision": 0, "baselineId": "scope-1",
  "handoff": { "currentStep": "等待确认范围", "nextGate": "驾驶员确认设计", "openRisks": [], "feedbackRefs": [] },
  "items": [{
    "id": "entry", "activity": "todo", "summary": "尚未开始，不记录已完成证据。",
    "checkpoints": [{
      "id": "open", "implemented": false, "evidence": [],
      "gates": [
        { "kind": "automated", "status": "pending", "evidence": [] },
        { "kind": "driver", "status": "pending", "evidence": [] }
      ]
    }]
  }]
}
```
<!-- tw-progress-state:end -->
````

两个块不改变原文职责：总设计案定义要做什么及本轮分母，`NEXT.md` 记录事实、证据和从哪里继续；`progress/progress.json` 由两者生成，是可重建的展示投影。正文与块若互相矛盾，先核对项目权威并修正文档，不能把“结构校验通过”说成内容已经得到驾驶员认可。设计事实改变时递增范围块 `revision`，同时把状态块 `designRevision` 对齐；范围、权重或适用门变化还须登记新的 `baseline.id` 和实际确认依据，并保留旧画板版本。当前步骤、风险、实现或门结果等现状改变时递增状态块 `revision`。两个版本均不得回退；来源内容无变化时再次同步不增加画板 `revision` 或历史。`revision` 是文档块的版本，不代替 Git、验收或发布版本。

### 从现有项目接入

1. 先读项目的 `AGENTS.md`、真实总设计案、活动蓝图、当前续接入口和验收记录；核实每一项、检查点、适用门、证据文件及驾驶员已确认的范围。缺文件或只有旧页面时先说明缺口，不凭示例制造完成率。
2. 将确认的定义写入设计案范围块，将对应现状写入 `NEXT.md` 状态块。初次接入未确认范围时保持 `baseline.confirmed: false`，画板不显示数字百分比。添加块属于原项目文档写入门，不能由画板初始化工具替用户决定。
3. 尚无 `progress/` 时，状态块的 `handoff.feedbackRefs` 必须为空，再用 `init-sources --root <项目根> --design <设计案相对路径> --next <续接文件相对路径>` 初始化；可选 `--driver-confirmation <明确确认依据>` 只用于已有真实驾驶员通过记录。已有 `progress/` 的项目先核对原数据与来源，使用 `source-plan` 接入，不运行初始化覆盖；启用双来源后，原 `init/sync` 不得绕开来源文档直接改投影。
4. 后续先用 `source-plan --root <项目根> --output <新的计划.json>` 预览来源差异；首次或非默认文件名可加 `--design`、`--next`。人工核对范围、旧分母、证据、反馈和待验收门后，用 `sync-sources --root <项目根> --plan <计划.json>` 应用。若这次新增驾驶员通过记录，同样提供匹配的 `--driver-confirmation` 明确依据。

计划绑定读取时的画板版本、反馈版本、全部来源文件 SHA-256 和实现／验收／复测证据文件 SHA-256。应用时在项目画板写入锁内重读比较；任一版本、来源或证据变化就拒绝旧计划，保留计划草稿，重新核对后再生成。同步把证据哈希写入画板并留在历史中；`check` 核对所有当前证据文件存在，并对比上次画板**已收录路径**的当前内容与保存值，缺失或已收录内容变化时暂停有效百分比。新路径的哈希差异由 `source-plan` 展示，核对后同步纳入。哈希一致只能证明已收录文件内容仍与上次记录相同，不能证明测试确实运行、证据真实或驾驶员已经验收。来源文件的结构一致也不代替对正文含义的审核。

## `progress.json`：只投影已确认的范围

- `schema` 固定为 `tavernweave/progress-board/v1`；`revision` 是非负整数；`project` 至少有 `id`、`title`、`version`。
- `baseline` 有 `id`、`label`、`confirmed`、`reference`。`reference` 指向用户确认的范围依据；目标范围尚未确认、当前范围没有可核对事项或检查点时，显示“范围未确认/暂无可计算项”，不显示数字百分比。
- `sources[]` 的每条记录带 `id`、项目内相对 `path` 和该文件的 `sha256`，覆盖实际采用的总设计、蓝图、`NEXT.md` 或旧项目已有权威。`id: next` 必须指向实际当前续接入口，旧项目可以使用原有文件名。`evidenceHashes` 保存同步时实际引用的证据文件内容指纹，旧值随画板历史保留。显示来源版本与最后核对结果。来源变动先标“过期”，审查变动事实后再按所用模式同步，不得静默把旧证据套到新版计划上。
- `items[]` 每项带稳定 `id`、`title`、`module`、正数 `weight`、`scope: current|parked`、`activity: todo|doing|blocked`、`summary` 和 `checkpoints[]`。权重缺省为 1；优先级 `P0/P1/P2` 用于排队，不充当权重。`parked` 与未采纳的新想法不进当前分母。
- 检查点带稳定 `id`、`title`、正数 `weight`、`implemented`、项目内相对路径的 `evidence[]` 和 `gates[]`。写 `implemented: true` 必须有可核对的实现证据。每道门写 `kind: automated|browser|real-host|driver`、`status: pending|passed|failed|not-applicable`、`evidence[]`，必要时写 `reason`。`passed` 必须有对应证据；`not-applicable` 必须说明原因并在已确认基线中有依据，不能用它绕过真实宿主或驾驶员门。

计算只使用 `scope: current` 的事项，并分别按每项检查点权重和事项权重加权：

```text
某项实现比例 = Σ(检查点权重 × 已实现且有证据) / Σ检查点权重
某项验收比例 = Σ(检查点权重 × 已实现且所有适用门已通过、有对应证据) / Σ检查点权重
整体实现百分比 = 100 × Σ(事项权重 × 该项实现比例) / Σ事项权重
整体验收百分比 = 100 × Σ(事项权重 × 该项验收比例) / Σ事项权重
```

模块百分比按同一规则，只取该模块当前范围事项。没有可计算分母时不报数字。没有适用门的检查点只有在基线明确记载免除理由时才可计入验收；否则保留待核对。检查点没有部分完成猜测值，不能凭“做了一半”填 50%。已确认范围拆分、增加或移出事项时，更新 `baseline.id` 和 `reference`，保留旧版本可追溯信息；不能靠删掉未完成项提高百分比。百分比达到 100 也不自动关闭真实宿主、驾驶员、Git、封装或发布门。

## `feedback.json`：想法、Bug 与审核原话

`schema` 固定为 `tavernweave/progress-feedback/v1`，含整数 `revision` 和 `records[]`。每条记录至少有稳定 `id`、`type: idea|bug|review`、`title`、原文 `text`、可选 `itemId`、`priority: P0|P1|P2`、`state`、`createdAt`、`updatedAt`、`context` 和 `history[]`。`context` 记录提交时的 `boardRevision`、`baselineId`、`sourceHashes`；`history` 保留每次状态或文本变更的时间、原状态、新状态、操作来源与理由，不抹掉原始意见。

| 类型 | 允许状态 | 处理边界 |
|---|---|---|
| `idea` | `new`、`discussing`、`adopted`、`parked`、`rejected` | 记下想法不等于改 First Playable；采纳后才按项目原有变更门更新总设计或蓝图。 |
| `bug` | `new`、`confirmed`、`fixing`、`retest`、`closed`、`wont-fix` | 未确认报告单列；已确认且关联事项的阻断 Bug 令相关验收待复测，修代码不能直接关单，关闭需复测证据。阻断与否要有明确审核记录，不凭 `P0` 自动推断。 |
| `review` | `recorded` | 记录驾驶员原话、关联范围和证据；“已记录”不等于 `driver-accepted`。 |

已确认的阻断 Bug 进入 `wont-fix` 或改回待处理状态仍保留验收缺口；取消阻断须明确核对关联影响并留下处理理由，不能只靠改状态解除。关闭还须有 `resolution`、`verification` 和项目内实际存在的 `verificationEvidence[]` 文件。服务重新核对已关闭 Bug 的复测文件，文件缺失仍暴露证据缺口。

明确的人类确认可作为后续维护项目权威的输入，但须核对表达的对象、范围和证据，并由原有流程更新总设计、蓝图、`NEXT.md` 或验收账本。不得由反馈记录自动推断驾驶员验收，也不得扩张 Git、安装、部署、发布等权限。

反馈回流按“记录 → 核对决定与证据 → 改权威 → 重新生成画板”进行。`progress/feedback.json` 独立保存原话与处理历史；`NEXT.md` 的 `handoff.feedbackRefs[]` 可以引用已经存在的反馈 ID，交代本轮待处理或已处理的意见，但引用本身不代表采纳、修复或验收。想法被采纳、Bug 被修复或审核意见改变下一步时，由 Agent 在驾驶员授权范围内维护总设计案、活动蓝图和 `NEXT.md`，再跑来源计划与同步；工具不从反馈文字自动推断项目状态。反馈文件不放进画板 `sources[]`，避免“反馈引用改变 NEXT → 来源哈希改变 → 反馈上下文再改变”的循环；预览计划仍绑定反馈版本，以便识别同期阻断 Bug 或意见变更。

## 写入、冲突与读回

写入仅限所选项目根目录内经核对的相对路径。反馈 `add/update` 必须携带调用者读到的 `revision`；并发标签页或其他写入者已推进版本时，拒绝旧版本覆盖，返回冲突与最新版本，保留未提交草稿供人工比较。成功时原子替换、递增版本并回读目标记录；回读不一致就报告失败，不显示“已保存”。权限拒绝、格式错误、磁盘或服务失败也要保留草稿，说明没有落盘。重开后应能从项目文件读到已保存记录与历史。

若来源已变化，旧画板仍可显示带“待复核”的记录，原始反馈也可继续保留；这些记录不能据此推进设计范围、通过验收门或自动更新 `NEXT.md`。写入冲突时先比较实际文件和原草稿，不机械替换版本号或添加 `--reviewed-sources`。来源同步启用后，完整手工 `sync` 仅供未启用项目使用。

画板刷新和记录回执应分别标明当前来源哈希、基线 ID、画板版本和反馈版本。页面缓存与本地草稿仅用于恢复输入，不作为项目状态或验收证据。

## 验收对齐

1. 初次初始化不覆盖旧项目文件；旧项目可选择现有权威来源，生成的画板与 `NEXT.md` 没有冲突的当前指针。仅一份或无效标记必须报冲突。
2. 来源变更会标过期；重读并做来源计划、同步后来源哈希、事项和证据可追溯。百分比有已确认分母，暂存项不参与；模块和整体计算一致。计划过期或手工同步绕过须拒绝。
3. 自动、浏览器、真实宿主、驾驶员的状态与证据分开显示；100% 不冒充未通过的门。
4. 三类反馈可新增并读回，状态变更留历史；确认 Bug 保留复测缺口，审核意见不自动改权威或授权。反馈引用只在 `NEXT.md` 中交代关系；范围或现状发生实际变化后由 Agent 更新权威再同步。
5. 写入失败不报成功；两个标签页基于同一旧版本提交时，后者得到冲突且前者记录未丢。静态页面明确只读，草稿导出不显示落盘回执。
