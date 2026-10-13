# TW 项目进度画板

**v1.8.0 开始提供项目进度画板与总设计案／NEXT 同步。** 当前完整包见 [v1.9.0 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.9.0)，首次发布记录保留在 [v1.8.0 发布页](https://github.com/LiarMTTT/TavernWeave/releases/tag/v1.8.0)；画板属于现有 `orchestrate-project-blueprint`，TW 仍有 22 个 Skill。用于角色卡与普通软件项目；各项目有自己的文件、主题、范围和记录。

## 可以直接这样说

```text
给这个项目建一个进度画板。
先读取已有设计、蓝图、NEXT 和验收记录，列出本轮范围，复用已经确认的决定。
显示整体与分模块的实现、验收百分比；每项都能展开检查点、证据和待核对的门。
我要能保存新想法、Bug 回报和审核意见，保留原话、处理历史和版本冲突提示。
先给改动范围和预览；不要覆盖原有画板，不自动扩大第一版或标记驾驶员验收。
```

使用已有画板时，先检查其实际保存方式。只有静态 JSON 展示的旧页面不能声称支持写入；需要新增能力时，先保留旧文件再按该项目现有流程改造。初建工具发现 `progress/` 已存在就拒绝覆盖。

## 看懂进度条

| 显示项 | 计算与用途 |
|---|---|
| 实现进度 | 本轮范围内，已经实现且有证据的检查点占比。 |
| 验收进度 | 已实现检查点中，所有适用验收门均通过、有证据且无已确认阻断 Bug 的部分；分母仍是本轮全部检查点。 |
| 模块进度 | 对该模块用同样规则计算，方便看出哪里在拖进度。 |
| 待实测 / 阻断 | 代码完成但操作、真实宿主或驾驶员还没通过，分别显示缺口。 |
| 暂存 | 本轮不做的内容；新想法也独立记录，不进入当前进度分母。 |

检查点和事项的工作量权重默认 1；需要加权时写明理由。P0/P1/P2 只决定处理顺序。页面可以展开查看分母、各项权重、已完成检查点和来源 SHA-256。没有已确认范围就显示“待确认”，不会猜一个百分比；还差一点时不会四舍五入成 100%。

调整范围、权重或免除验收门必须登记新基线并保留旧记录。来源文件变化时显示“旧记录”。`check` 核对所有当前引用的证据文件是否存在，并将**上次画板已收录**的实现、验收及 Bug 复测证据与保存的 SHA-256 比较；文件缺失或已收录内容变化时暂停有效百分比并保留缺口。新增加的证据路径由 `source-plan` 列出哈希差异，核对后同步纳入。哈希一致只证明已收录文件与上次记录相同，不证明证据真实或验收已发生。100% 只覆盖已列出的范围，不自动代替真实宿主、驾驶员、Git、封装或发布门。

## 想法、Bug、审核怎么处理

- **新想法**：新增 → 讨论 → 采纳／暂存／不采纳。采纳之后再按项目原有变更流程更新设计或蓝图。
- **Bug**：新增 → 确认 → 修复 → 待复测 → 关闭。原话、出现条件和处理理由都保留；关闭需要处理结果、复测结果和项目内的真实证据文件。已确认阻断 Bug 即使“本轮不修复”，仍保留验收缺口。
- **审核意见**：记录驾驶员原话、关联事项与来源版本；这条记录本身不会自动改成 `driver-accepted`。

保存成功会明确显示写入并回读 `progress/feedback.json` 的回执。两个标签页使用同一旧版本提交时，后者被拒绝覆盖，草稿保留；重读当前记录、比较差异后，可主动绑定新版本再次提交。来源或画板范围变化也会使旧草稿的提交上下文失效。

当前标签页的新增与处理草稿可以暂存在浏览器会话中，以便刷新恢复；这不是项目状态或验收证据。浏览器暂存不可用时会说明，离开前可以导出。静态预览明确只读，可填写并发起草稿下载；浏览器下载与项目保存分别显示。

有反馈需要改变项目时，先核对原话、影响和证据，再由 Agent 按项目原有授权维护总设计案的范围定义、活动蓝图及 `NEXT.md` 的实际状态；可在 `NEXT.md` 的 `handoff.feedbackRefs[]` 记下对应反馈 ID，随后重新生成来源计划并同步画板。这个引用只是交接线索：想法被标记“已采纳”、Bug 被标记“已关闭”或审核意见被保存，都不会自动改范围、确认真实宿主结果或标记驾驶员验收。`feedback.json` 保持独立，不加入来源文件哈希清单；计划另核对反馈版本，避免期间新增阻断 Bug 后仍套用旧百分比。

## 文件与运行

项目权威仍是原有设计案、蓝图和当前续接入口。选择来源同步后，总设计案中的 `tw-progress-scope` 块定义项目版本、本轮范围、事项、检查点和适用验收门；`NEXT.md` 中的 `tw-progress-state` 块记当前步骤、下一道门、风险、实现与验收结果。`progress/progress.json` 由这两份文件生成，只用于展示；反馈另存 `progress/feedback.json`。工具同步画板不会替用户改写总设计案或 `NEXT.md`。两个来源块是项目自愿启用的，旧项目可使用原有文件名。

工具位于 [项目编排 Skill](../skills/orchestrate-project-blueprint/SKILL.md)。输入格式与验收规则见 [画板合同](../skills/orchestrate-project-blueprint/references/progress-board.md)，初始输入可参考 [JSON 示例](../skills/orchestrate-project-blueprint/assets/templates/progress/board-input.example.json)。让 Agent 根据实际项目填写；示例不是项目已完成证据。

下面命令从该 Skill 目录运行，`<项目根>`、`<初始范围.json>` 等占位符换成实际路径：

```bash
node scripts/project-board.mjs init --root "<项目根>" --input "<初始范围.json>"
node scripts/project-board.mjs serve --root "<项目根>" --port 0
node scripts/project-board.mjs check --root "<项目根>"
node scripts/project-board.mjs export --root "<项目根>" --format md --output "<新文件路径>"
```

`serve` 使用 Node 标准库，只监听 `127.0.0.1`，终端会给出访问地址。当前在 Node 22 上验证，无需前端框架。它只提供该项目的画板和反馈写入，停止服务后不再接受写入。复用项目已有服务时，按同一版本与上下文合同接入实际写入通道；没有写入通道就保持只读。

上面的 `init --input` 是尚未启用来源块的旧式手工投影入口。新项目和愿意接入的旧项目，先读现有设计、活动蓝图、当前续接入口与验收资料，再经原项目写入门将完整的 `tw-progress-scope`、`tw-progress-state` 来源块放入实际设计案和当前续接文件。每个块都要用一对标记包住**完整的三反引号 `json` 代码块**，格式及可复制示例见[画板合同](../skills/orchestrate-project-blueprint/references/progress-board.md)。新项目模板只是预留位置，不自带已启用的空 JSON，也不凭示例生成百分比。两块必须是唯一、有效且相互对应的：项目 ID、设计修订、范围基线，以及所有事项、检查点和适用验收门都要对上；缺一项就先修源文档。

初次生成来源画板，以及后续预览和应用，用下面三条命令：

```bash
node scripts/project-board.mjs init-sources --root "<项目根>" --design "<设计案相对路径>" --next "<续接文件相对路径>"
node scripts/project-board.mjs source-plan --root "<项目根>" --output "<新的计划.json>"
node scripts/project-board.mjs sync-sources --root "<项目根>" --plan "<计划.json>"
```

`init-sources` 拒绝覆盖已有 `progress/`，首次建立时 `NEXT.md` 的 `handoff.feedbackRefs` 须为空；已有画板用 `source-plan` 核对后接入。真实文件不使用默认名时，在 `source-plan` 增加 `--design`、`--next`。计划文件要用未存在的新路径，先看差异，再决定是否应用。计划绑定画板版本、反馈版本、全部来源文件及证据文件的 SHA-256（文件内容指纹）；应用时在写入锁内重读。版本或文件内容变化会拒绝旧计划，需重新核对再生成，不能只改计划中的哈希或版本号。新添驾驶员通过记录时，在初始化或应用命令加 `--driver-confirmation "<明确确认依据>"`，并与门内的 `confirmationRef` 对齐；普通自动检查不能填写这项。

设计定义或项目版本改变时递增设计案范围块 `revision`，并让 `NEXT.md` 状态块的 `designRevision` 与它一致；改变本轮分母或适用门还需新范围基线与确认依据。当前步骤、风险、实现情况或验收结果改变时递增状态块 `revision`。这两个修订号不能回退。若来源和证据没有变化，再次同步不会增加画板版本或历史记录。

未启用两个来源块的旧画板仍可沿用手工入口，先核查来源和范围，再执行：

```bash
node scripts/project-board.mjs sync --root "<项目根>" --input "<完整画板.json>" --expected-revision 0 --reviewed-sources
```

`--reviewed-sources` 表示已核查来源变动，不能机械添加。完整输入可从该项目已有 `progress.json` 开始修改；启用来源块后，此手工命令不得绕开源文档直接改投影。新增驾驶员通过记录还须提供与 `confirmationRef` 一致的 `--driver-confirmation` 明确依据；工具不会替用户判断已经验收。

画板只核对来源结构、版本、文件存在与内容指纹；同步时把证据 SHA-256 保存在画板和历史中，`check` 用当前文件与上次已收录的指纹对照，`source-plan` 展示新路径或旧路径的哈希差异。证据内容是否足以证明自动检查、浏览器操作、真实宿主行为或驾驶员确认，仍按各项目验收门逐项判断。若正文与 JSON 块矛盾、来源块缺失或重复、计划过期、证据文件变化，应先处理冲突再同步；不要为了显示更高百分比移走未完成项或改写证据。

CLI 反馈也使用读取时的反馈版本与 `context`。可以用画板导出的草稿，或 `check` 返回的上下文构建输入：

```bash
node scripts/record-progress-feedback.mjs add --root "<项目根>" --input "<反馈草稿.json>"
node scripts/record-progress-feedback.mjs update --root "<项目根>" --input "<处理草稿.json>"
```

保存被拒绝时不能自动改成最新版本覆盖。服务意外中止若留下 `.write-lock`，先确认原写入已结束、核对 JSON 和草稿，再由维护者处理锁文件；工具不会擅自抢占正在进行的写入。
