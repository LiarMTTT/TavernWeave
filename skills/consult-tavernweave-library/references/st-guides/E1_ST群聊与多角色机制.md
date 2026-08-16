# ST 群聊与多角色机制

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

> SillyTavern Group Chat 的完整机制参考——发言策略、角色卡注入、世界书叠加、STscript 控制与实战范式。

---

## 置信度分级体系

- **high**：官方文档多源交叉确认，或已知合并的运行时源码分析，可直接施工。
- **medium**：文档单源、源码推断、社区讨论，或有历史 Bug 悬案；可参考但须真机确认关键路径。
- **low**：孤证无源，禁止据此施工。

依据类型轴：`[运行时源码]` / `[真机]` / `[文档·多源]` / `[文档·单源]` / `[社区]` / `[推断]`

收集日期：2026-06-28
回源基于：SillyTavern v1.14.0 + 本地成熟卡（星月 2.5.0 / 交错 2.6.0）

---

## 目录

1. 机制总览
2. 成员管理
3. 发言顺序策略
   - 3.1 策略总览
   - 3.2 Natural Order 三步算法
4. Character Info 处理模式
   - 4.1 Swap Character Cards（默认）
   - 4.2 Join Character Cards（合并模式）
   - 4.3 Join Prefix/Suffix 自定义分隔符
5. 关键 API 字段参考
   - 5.1 群聊专用宏
   - 5.2 核心 STscript 命令
   - 5.3 源码层关键函数
6. 自动模式（Auto-mode）
7. 群聊与单聊差异对比
   - 7.1 世界书（World Info / Lorebook）
   - 7.2 Author's Note
   - 7.3 STscript 变量
   - 7.4 正则表达式（Regex Extension）
   - 7.5 Persona（用户人格）
   - 7.6 Regenerate（重新生成）
   - 7.7 Scenario Override（场景覆盖）
8. 实战范式代码
9. 高频避坑
10. 悬案（需真机验证）
11. 来源汇总

---

## 1. 机制总览

SillyTavern 群聊（Group Chat）是在普通单聊基础上扩展的多角色协同框架。

**核心特征：**

- **共享聊天历史**：所有成员共用同一条消息流，无私有上下文。
- **按轮次激活单一角色**：每轮 generation 由"发言顺序策略"决定谁发言，generation 类型固定为 `Normal`（等价于点击发送键的标准推理流程）。
- **Character Info 按模式切换**：默认每轮仅注入当前发言者的卡片信息（Swap 模式），或合并所有成员（Join 模式）。
- **1.15.0 重大破坏性变更（2025-12）**：群聊 metadata 格式与普通聊天统一，旧版群聊文件自动迁移但不向后兼容。

来源：docs.sillytavern.app/usage/core-concepts/groupchats、DeepWiki、ST Discussion #4926
适用版本：v1.14.0+（1.15.0 注意破坏性变更）
置信度：**high** `[文档·多源]`

---

## 2. 成员管理

| 操作 | 说明 |
|------|------|
| 添加成员 | 任何现有角色卡都可加入；新成员默认插入列表顶部 |
| 重排序 | 使用列表中的上下箭头调整顺序 |
| 静音（Mute） | 禁用该成员自动发言；仍可被 Force Talk 强制触发 |
| Force Talk | 强制指定成员发言，绕过所有激活策略 |
| 删除成员 | 从群组移除，不删除角色卡本身 |
| Peek Definitions | 快速预览/编辑成员角色卡，无需离开群聊 |

来源：docs.sillytavern.app/usage/core-concepts/groupchats
适用版本：v1.12.0+
置信度：**high** `[文档·多源]`

---

## 3. 发言顺序策略

### 3.1 策略总览

| 策略 | 机制 | 适用场景 |
|------|------|---------|
| **Manual（手动）** | 用户从菜单选择或 `/trigger <名字>` 命令 | 完全人工控制 |
| **Natural Order（自然顺序）** | 三步算法：@提及 → Talkativeness → 随机兜底 | 模拟真实对话 |
| **List Order（列表顺序）** | 按成员列表从上到下依次轮换 | 有序轮转 |
| **Pooled Order（池化顺序）** | 从本轮未发言成员中随机选一；全员发言后重置 | 确保每轮不重复 |

来源：docs.sillytavern.app/usage/core-concepts/groupchats
适用版本：v1.12.0+
置信度：**high** `[文档·多源]`

### 3.2 Natural Order 三步算法

**Step 1 — @提及检测（Mention Detection）**

- 从最后一条消息中提取群成员名字。
- **仅识别完整词（whole word match）**：名字为 "Misaka Mikoto" 时，"Misaka" 和 "Mikoto" 均触发，"Misa" 不触发。
- 提到名字的成员被加入「激活候选列表」。
- **除非启用 "Allow Self Responses"，否则角色不会响应自己消息中的自我提及。**

**Step 2 — Talkativeness 概率激活**

- 每个未被提及的成员按其 Talkativeness 值独立判断是否发言。
- 范围 0%–100%，线性概率：
  - 0% = 完全害羞（仅响应提及）
  - 100% = 总是发言
  - 默认 50%
- 配置路径：角色卡 Advanced Definitions 面板。

**Step 3 — 随机兜底**

- 若 Step 1 和 Step 2 均未激活任何成员，优先从 talkativeness > 0 的成员中随机选一位；若所有成员 talkativeness 均为 0，则从全部成员中随机选一位。
- 注意：Natural Order 还有"防连续"机制：无论哪一步，上一条消息的发言者（bannedUser）均被排除，除非启用 "Allow Self Responses"（源码 `allowSelfResponses` 标志）。

来源：docs.sillytavern.app/usage/core-concepts/groupchats + v1.14.0 源码 `activateNaturalOrder()`
适用版本：v1.12.0+
置信度：**high** `[文档·多源]` （兜底细节及 bannedUser 逻辑由 v1.14.0 运行时源码 `[运行时源码]` 补充确认）

---

## 4. Character Info 处理模式

群聊中每次 generation 时，角色卡信息（description / personality / scenario / example messages / character note）的注入方式由此设置控制。

### 4.1 Swap Character Cards（默认）

**核心结论：**

- 每轮 generation 仅注入当前发言者的完整角色卡。
- 其他成员的卡完全不进 context。
- Character Note（角色笔记）正常注入。

来源：docs.sillytavern.app/usage/core-concepts/groupchats
适用版本：v1.12.0+
置信度：**high** `[文档·多源]`

### 4.2 Join Character Cards（合并模式）

**核心结论：**

- 将所有启用成员的角色卡合并为一个 joint prompt，按成员列表顺序。
- 合并字段：description、personality、scenario、example messages、character note。
- 子选项（源码层对应 `group_generation_mode`）：
  - `Include muted`（`APPEND` 模式）：所有成员（含被静音/禁用成员）均包含在合并中。
  - `Exclude muted`（`APPEND_DISABLED` 模式）：禁用/静音成员被跳过，**但当前发言者（active speaker）无论是否被标记为 disabled 均强制包含**（源码条件：`characterId !== index`）。
- **官方文档警告**：可能导致角色个性混淆、特征融合等异常，不建议用于强调独立角色个性的场景。

**源码分析（v1.14.0）与 Bug 更新：**

`getGroupCharacterCards()` 源码直读确认：该函数**根本不处理 character_note**，返回结构只含 `{description, personality, scenario, mesExamples}`。character_note 在 Join 模式下是否通过其他 context 注入路径（如 Author's Note 机制）送入 prompt，尚未完整溯源（见第 10 章 U1 悬案）。

Issue #3550（2025-02-24，状态：Open/Not Reproducible）：原报告人描述 character note 缺失，与源码行为一致；Issue 标"Not Reproducible"可能因维护者测试版本或配置差异。v1.14.0 实际行为需真机确认 character_note 的注入路径。

来源：docs.sillytavern.app + v1.14.0 源码（`getGroupCharacterCards()` 直读）+ Issue #3550
适用版本：v1.12.0+（Bug 报告于 v1.12.12）
置信度：**high** `[运行时源码]`（Join 模式合并字段已由源码直读确认；character_note 不在合并范围同样由源码证实；U1 悬案仅针对 character_note 通过其他注入路径的可能性）

### 4.3 Join Prefix/Suffix 自定义分隔符

在 Join 模式下可为每个角色卡字段自定义分隔符格式：

```
支持宏：
  {{char}}      替换为当前成员名
  <FIELDNAME>   替换为字段名（如 description、personality）

示例格式："## {{char}}'s <FIELDNAME>:"
```

> [!NOTE] 源码补充（v1.14.0 `getGroupCharacterCards()`）：前缀/后缀均经 `customBaseChatReplace()` 处理，`<FIELDNAME>` 的替换发生在宏引擎之前；实际拼接字段为 description / personality / scenario / mesExamples（`mes_example`），**不含 character_note（角色笔记）**——该字段不在 Join 合并范围内（见第 4.2 节 Bug 悬案 U1）。

来源：docs.sillytavern.app/usage/core-concepts/groupchats + v1.14.0 源码 `getGroupCharacterCards()`
置信度：**medium·单源孤证** `[文档·单源]`（文档仅单源；函数名及宏机制已由 `[运行时源码]` 交叉核实，但整体条目基于文档单一来源）

---

## 5. 关键 API 字段参考

### 5.1 群聊专用宏

| 宏 | 含义 | 群聊行为 |
|----|------|---------|
| `{{char}}` | 当前角色名 | 返回当前发言者名字 |
| `{{user}}` | 用户/Persona 名 | 正常工作 |
| `{{group}}` | 群成员名列表 | 逗号分隔，含静音成员 |
| `{{groupNotMuted}}` | 未静音成员列表 | 逗号分隔，排除静音成员 |
| `{{charIfNotGroup}}` | 单聊时的角色名 | 群聊中返回空字符串 |
| `{{notChar}}` | 除当前发言者外所有参与者 | 群聊中有效 |

来源：docs.sillytavern.app/usage/core-concepts/macros
适用版本：v1.12.0+
置信度：**medium·单源孤证** `[文档·单源]`（宏列表来自官方宏文档单一页面；内容已与宏文档原文交叉确认，但未通过源码或真机验证宏在群聊中的具体行为）

### 5.2 核心 STscript 命令

| 命令 | 语法 | 功能 |
|------|------|------|
| `/trigger` | `/trigger [角色名/1-based索引]` | 手动触发指定成员发言（Normal generation） |
| `/trigger`（空） | `/trigger` | 空输入时随机选一名未静音成员 |
| `/sendas` | `/sendas 角色名 消息内容` | 以指定角色发送消息（无 generation） |

备注：`/trigger` 支持全名或成员列表中的 1-based 数字索引（如 `/trigger 2` 触发列表第 2 位成员）。

来源：docs.sillytavern.app/usage/st-script
适用版本：v1.12.0+
置信度：**high** `[文档·多源]`

### 5.3 源码层关键函数（group-chats.js）

| 函数 | 作用 |
|------|------|
| `getGroupCharacterCards()` | 合并所有成员角色卡（Join/APPEND 模式）；返回 `{description, personality, scenario, mesExamples}`——**不含 character_note** |
| `getGroupDepthPrompts()` | 聚合所有成员的 depth prompts（APPEND / APPEND_DISABLED 模式；SWAP 模式直接返回 `[]`） |
| `regenerateGroup()` | 按 `gen_id` 回删同批次所有消息（非"回到最后用户消息"），然后调 `generateGroupWrapper(false, 'normal', ...)` 重触发 generation |
| `validateGroup(group)` | 确保成员存在（按 avatar 或 name 匹配）、去重 |
| `setAutoModeWorker()` | 初始化自动模式计时器；间隔可配置（`auto_mode_delay`，默认 5 秒，常量 `DEFAULT_AUTO_MODE_DELAY = 5`） |
| `_save(group, reload)` | 持久化群组 metadata 到 `/api/groups/edit` |

> [!CAUTION] DeepWiki 记录的函数名 `getGroupCharacterCardsLazy` 在 v1.14.0 源码中**不存在**，实际为 `getGroupCharacterCards()`。DeepWiki 系 AI 自动生成文档，存在函数名漂移风险，不可作为源码高可信引用。

来源：v1.14.0 运行时源码（`public/scripts/group-chats.js` 直读）
适用版本：v1.14.0
置信度：**high** `[运行时源码]`（本条已直接阅读源码，降弃 DeepWiki 引用）

---

## 6. 自动模式（Auto-mode）

**核心结论：**

- 启用后，按选定发言策略自动触发 generation，无需用户点击。
- **触发间隔：上一条消息发送后延迟 5 秒**（`setAutoModeWorker()` 实现）。
- 用户开始在输入框打字时，Auto-mode 被禁用，但已排队的 generation 不会立即停止。
- 适合：挂机剧情推进、自动对话演示场景。

避坑：用户一旦在输入框打字，auto-mode 关闭，打字期间已排队的 generation 不中断，可能造成意外发言。

来源：docs.sillytavern.app/usage/core-concepts/groupchats + v1.14.0 源码（`DEFAULT_AUTO_MODE_DELAY = 5`、`setInterval(groupChatAutoModeWorker, autoModeDelay * 1000)`）
适用版本：v1.12.0+
置信度：**medium·单源孤证** `[文档·单源]`（5 秒间隔已由源码 `[运行时源码]` 交叉确认；但"打字即关闭 auto-mode"及"已排队不中断"行为仅文档单源，未在源码中直接验证）

---

## 7. 群聊与单聊差异对比

### 7.1 世界书（World Info / Lorebook）

| 层级 | 群聊行为 |
|------|---------|
| **全局 World Info** | 所有聊天（含群聊）均生效 |
| **Chat-bound Lorebook** | 仅在绑定的该聊天中生效 |
| **Character-bound Lorebook** | 每个群成员各自绑定的 Lorebook 都会激活，条目按 Insertion Order 合并排序，如同一个大文件 |
| **Persona-bound Lorebook** | 按 Chat Lore > Persona Lore > Character/Global Lore 优先级叠加 |

**关键细节：**

- `getWorldInfoPrompt()` 时，系统从 Character World Info + auxiliary sources 收集条目，合并后统一按 Insertion Order 排序，Character World Info 的条目优先排序（先于 Global WI）。
- **"Include Names" 开关**：群聊中若要用成员名字作为 WI 触发关键词（例如发言前缀 "Alice: hello" 触发 Alice 的专属条目），必须启用此选项，否则前缀不被扫描。

**矛盾点 / 悬案：**

- Character-bound Lorebook 是所有成员的都常驻扫描，还是仅 active speaker 的？文档未明确，DeepWiki 暗示"全部加载"（APPEND 逻辑），但 Swap 模式下的行为需真机验证（详见第 10 章 U2 悬案）。

来源：docs.sillytavern.app/usage/core-concepts/worldinfo、DeepWiki WI System
适用版本：v1.12.0+
置信度：**medium·推导未验证** `[文档·多源 + 推断]`（WI 基本行为有官方文档 + DeepWiki 多源支持；Character-bound Lorebook 常驻扫描范围为未证实推断，见 U2 悬案）

### 7.2 Author's Note

**核心结论：**

- **全局 Author's Note**（用户在聊天框设置的）：注入频率/位置配置正常生效。
- **Character Note（角色卡内的 Character's Note 字段）**：
  - Swap 模式：当前 active speaker 的 Character Note 正常注入。
  - Join 模式：可能缺失（Issue #3550，需真机验证）。

**历史 Bug：**

- Issue #456（已关闭）：Author's Note 在群聊超过 2 条消息时被强制设为 `use_authors_note: false`。推断已修复，但 Issue #3030（2024-10，状态不明）仍报 AN 在某些群聊场景未注入，建议真机确认。
- 验证方法：群聊 2+ 条消息，设 AN 频率=1，用 DevTools 拦截 API 请求检查 `use_authors_note` 字段值。

来源：docs.sillytavern.app、Issue #456、Issue #3030、Issue #3550
适用版本：v1.12.0+（Bug 已知于 v1.12.x 范围）
置信度：**medium·推导未验证** `[文档·单源 + 社区 Issue]`（Issue 历史多源，但主要 Bug #456 已关闭、#3030 状态不明；当前 v1.14.0 AN 实际行为未真机验证）

### 7.3 STscript 变量

| 变量类型 | 作用域 | 群聊行为 |
|---------|--------|---------|
| Local（`/getvar`、`{{getvar::}}`） | 当前聊天 metadata | 群聊作为整体共享，非各成员独立 |
| Global（`/getglobalvar`、`{{getglobalvar::}}`） | 全应用 settings.json | 群聊/单聊通用 |
| Scoped（`/let`、`{{var::}}`） | 闭包块内部 | 行为一致，无群聊特殊性 |
| 优先级 | local > global（同名时） | 群聊中行为相同 |

**关键发现：**

官方文档未记录群聊与单聊的变量作用域差异，推断变量系统对群聊透明——群聊本质上是一个聊天，local 变量作用于整个群聊 metadata，不区分发言者。

实战建议：若要给每个角色维护独立变量，需用命名前缀约定（如 `alice_hp`、`bob_hp`）或 global 变量命名空间。

来源：docs.sillytavern.app/usage/st-script
适用版本：v1.12.0+
置信度：**medium·推导未验证** `[文档·单源 + 推断]`（文档未记录群聊变量作用域；local 变量共享整个群聊 metadata 为逻辑推断，未真机验证）

### 7.4 正则表达式（Regex Extension）

| 正则类型 | 群聊行为 |
|---------|---------|
| **Global scripts** | 保存于 settings.json，所有角色/所有聊天均生效 |
| **Scoped scripts（角色卡专属）** | 保存于角色卡 extension data，仅当该角色为 active speaker 时生效 |
| 处理顺序（v1.14.0） | GLOBAL → PRESET → SCOPED（Object.values 插入顺序） |

**执行顺序源码确认（v1.14.0）：**

`engine.js` 中 `SCRIPT_TYPES = { GLOBAL: 0, PRESET: 2, SCOPED: 1 }`，注释明确 "ORDER MATTERS: defines the regex script priority"；`getRegexScripts()` 按 `Object.values(SCRIPT_TYPES).flatMap(type => getScriptsByType(type))` 展平，插入顺序即为 GLOBAL → PRESET → SCOPED，与文档一致。

**关键实战意义：**

在群聊中给每个角色卡嵌入各自的 scoped regex，可实现每个角色发言时独立触发不同的状态栏更新/变量写入逻辑，互不干扰。反之，需要每轮都执行的 regex（如通用状态更新）应放全局 regex，不能放进角色专属 scoped regex。

来源：docs.sillytavern.app/extensions/regex + v1.14.0 源码（`public/scripts/extensions/regex/engine.js` 直读）
适用版本：v1.14.0+（Preset 顺序变更）
置信度：**high** `[运行时源码]`（源码直读确认，文档仅辅助佐证）

### 7.5 Persona（用户人格）

**核心结论：**

- 群聊中用户只有一个当前活跃 Persona，对所有成员均可见。
- Persona 的 description 按其 Position 设置注入 context（不区分群聊/单聊）。
- Persona 绑定的 Lorebook 按 Persona Lore 层级生效。
- **无「每成员各自 Persona」机制**，这是已知设计局限。

来源：docs.sillytavern.app/usage/core-concepts/groupchats
适用版本：v1.12.0+
置信度：**medium·推导未验证** `[文档·单源 + 推断]`（"无每成员独立 Persona"属已知设计局限，文档提及但 Persona 注入细节为推断，未真机验证）

### 7.6 Regenerate（重新生成）

**核心结论：**

- **群聊中不可用标准 Regenerate**（Ctrl+Alt+R 等标准快捷键行为不同）。
- 替代机制（源码精确行为）：`regenerateGroup()` 获取最后一条消息的 `gen_id`，然后**倒序删除所有 `gen_id` 相同的同批消息**（新版路径），或遇到 `is_user / is_system` 停止（旧版兜底）；删完后调 `generateGroupWrapper(false, 'normal', ...)` 重排队。
- 行为表现为"删除同批并重排队"，而非单聊的"直接替换最后一条消息"。
- 草稿原描述"删除回到最后用户/系统消息的所有回复"在 gen_id 存在时不准确：只删同批，若本批仅 1 条消息则效果相同，若多角色同批次发言则所有同批次消息均删除。

来源：docs.sillytavern.app/usage/core-concepts/groupchats + v1.14.0 源码 `regenerateGroup()`（直读）
适用版本：v1.14.0+
置信度：**high** `[运行时源码]`（已直读源码，行为比文档记录更精确；原文档依据降为辅助）

### 7.7 Scenario Override（场景覆盖）

**核心结论：**

- 群聊专有功能：设置一个全体共享的 Scenario 文本，覆盖各角色卡各自的 scenario 字段。
- 单聊无此功能。
- 源码补充（`getGroupCharacterCards()`）：Join 模式下 Scenario Override 存储于 `chat_metadata['scenario']`，若非空则覆盖所有成员的 scenario 合并结果（`baseChatReplace(scenarioOverride?.trim(), name1, name2) || scenarios.join('\n')`）。Swap 模式下的覆盖逻辑在主 context 组装函数中处理，机制一致。

来源：docs.sillytavern.app/usage/core-concepts/groupchats + v1.14.0 源码 `getGroupCharacterCards()`（直读）
适用版本：v1.12.0+
置信度：**medium·单源孤证** `[文档·单源]`（文档仅单源；源码局部逻辑 `[运行时源码]` 已核实 Join 模式行为，但 Swap 模式覆盖路径未直读核实）

---

## 8. 实战范式代码

### 范式 1：LLM 决策下一位发言者

```stscript
/gen length=20 as=system "当前群聊成员：{{groupNotMuted}}。根据对话历史，谁最应该在此刻发言？仅返回一个角色的名字，不要其他内容。" | /trigger {{pipe}}
```

说明：用 LLM 根据上下文判断谁该发言，结果通过管道传入 `/trigger`。

来源：ST Discussion #4130（PyroDevil 实验，维护者 Cohee1207 指导）
置信度：**medium·单源孤证** `[社区]`（仅单一社区讨论帖；维护者参与提升可信度，但无文档或源码交叉确认；管道语法及 `/trigger` 接受 pipe 输出的行为需真机验证）

### 范式 2：手动触发指定成员

```stscript
/trigger Alice
/trigger 2
```

说明：可用角色全名或 1-based 列表索引（列表第 2 位成员）。

来源：docs.sillytavern.app/usage/st-script
置信度：**high** `[文档·多源]`

### 范式 3：/sendas 发送（无 generation）

```stscript
/sendas Alice 这是 Alice 直接说的一句话，不经过模型推理
```

说明：直接插入指定角色身份的消息，不触发 LLM generation。

来源：docs.sillytavern.app/usage/st-script
置信度：**high** `[文档·多源]`

### 范式 4：条件式群聊/单聊分支

```stscript
/if left="{{charIfNotGroup}}" rule=neq right=""
  /then "单聊逻辑：当前角色为 {{char}}"
  /else "群聊逻辑：成员包括 {{groupNotMuted}}"
```

说明：`{{charIfNotGroup}}` 在群聊中返回空字符串，可用于区分两种场景执行不同逻辑。

来源：docs.sillytavern.app/usage/core-concepts/macros
置信度：**medium·单源孤证** `[文档·单源]`（`{{charIfNotGroup}}` 行为描述来自官方宏文档单页，与 5.1 节宏列表同一来源；STscript `/if` 语法已由 STscript 参考文档佐证，整体逻辑为推导组合）

### 范式 5：Scoped Regex 多角色独立状态更新

角色 A 的角色卡 Regex 中：

```
模式：(\[A的状态变量:\s*)([^]]+)(\])
替换：<针对角色A的状态更新逻辑>
触发时机：仅当角色 A 为 active speaker 时执行
```

角色 B 的角色卡 Regex 中：

```
模式：(\[B的状态变量:\s*)([^]]+)(\])
替换：<针对角色B的状态更新逻辑>
触发时机：仅当角色 B 为 active speaker 时执行
```

说明：两套 scoped regex 完全独立，互不干扰，适合多角色各自维护状态栏。

来源：docs.sillytavern.app/extensions/regex + v1.14.0 源码（执行顺序已由 engine.js 直读确认）
置信度：**high** `[运行时源码]`（Scoped regex 仅 active speaker 触发的机制已由源码 `getScriptsByType(SCRIPT_TYPES.SCOPED)` 路径证实，并由成熟卡生产验证）

### 范式 6：Force Talk 等价触发

```stscript
/trigger 角色名
```

等价于 UI 中的 "Force Talk" 按钮，绕过所有激活策略强制指定角色发言。

来源：docs.sillytavern.app/usage/st-script
置信度：**high** `[文档·多源]`

### 范式 7：World Info Include Names 联动群聊发言

在 World Info 条目的关键词中加入角色名（如 "Alice"），同时启用 WI 全局设置中的 "Include Names" 选项。发言消息前缀（如 "Alice: 你好"）中的 "Alice" 将被扫描为关键词触发器。

来源：docs.sillytavern.app/usage/core-concepts/worldinfo
置信度：**medium·推导未验证** `[文档·单源 + 推断]`（"Include Names"开关与发言前缀扫描的联动为文档描述，但前缀格式和扫描时机需真机确认）

---

## 9. 高频避坑

**1. Natural Order @提及只认完整词**

若角色名含空格，确认触发词是拆分后的任一分词（"Misaka" 或 "Mikoto"），而非缩写或绰号（"Misa" 不触发）。

**2. Join 模式 Character Note 不在合并范围内（源码确认）**

v1.14.0 源码 `getGroupCharacterCards()` 直读：该函数返回结构仅含 `{description, personality, scenario, mesExamples}`，**完全不处理 character_note**，这不是 Bug 而是设计如此。character_note 是否通过其他路径（如 Author's Note 注入层）在 Join 模式送入 prompt 仍需真机确认（U1 悬案）。若依赖 Character Note 注入关键 prompt，优先使用 Swap 模式，或在 description 字段追加关键内容作为兜底。

**3. Author's Note 在群聊中的历史 Bug**

旧版本存在 AN 被强制禁用的问题，即使 Issue #456 已关闭，建议真机确认 AN 是否正常注入。验证方法：DevTools 看 API 请求中 `use_authors_note` 字段值。

**4. Join 模式警告——个性融合**

官方文档明确标注 Join 模式可能导致角色间个性混淆，不建议用于强调独立角色个性的场景。

**5. Local 变量作用于整个群聊**

群聊中 local 变量不区分发言者。若要给每个角色维护独立变量，需用命名前缀约定（如 `alice_hp`、`bob_hp`）或 global 变量命名空间。

**6. Scoped Regex 仅在 active speaker 时触发**

不要把需要每轮都执行的 regex（如通用状态更新）放进角色专属 scoped regex，应放全局 regex。

**7. Auto-mode 打字即关闭**

用户一旦在输入框打字，auto-mode 关闭，但已排队的 generation 不会中断，可能造成意外发言。

**8. 1.15.0 群聊 metadata 破坏性变更**

升级后的群聊文件不兼容旧版本，需确认目标用户 ST 版本再发布依赖群聊特性的卡。

**9. Regenerate 不可用于群聊**

群聊的"重新生成"实际执行 `regenerateGroup()`——删除所有回复后重排队，而非单聊的直接替换最后一条消息。

**10. World Info Include Names 必须开启**

群聊中若要用成员名字作为 WI 触发关键词（如发言前缀 "Alice: hello" 触发 Alice 专属条目），必须启用 Include Names 选项，否则前缀不被扫描。

**11. Pooled Order 的重置边界（源码校正）**

Pooled Order **不是**在所有成员均发言一轮后显式重置"发言池"。实际行为（`activatePooledOrder()` 源码）：从最新一条消息倒序扫描，**累计"自上次用户消息以来"已发言的成员列表**（`spokenSinceUser`），从中筛出尚未发言者（`haveNotSpoken`）随机选一位。若所有成员均已发言（`haveNotSpoken` 为空），则从除最后发言者外的随机池中再选——这等效于"隐式重置"但并非显式重置。因此"重置边界"是**每条用户消息**，而非"全员发言一轮"。

---

## 10. 悬案（需真机验证）

| 编号 | 悬案 | 问题描述 | 验证路径 |
|------|------|---------|---------|
| **U1** | **Join 模式 Character Note 是否合并** | 源码（`getGroupCharacterCards()`）直读证实：该函数**不合并 character_note**，返回值只含 description/personality/scenario/mesExamples。但 character_note 在 Join 模式下是否通过其他路径（如 Author's Note 层）注入，尚未完整溯源 | 开群聊 + Join 模式，DevTools 拦截 API 请求，检查 prompt 中是否出现 character note 内容及注入位置 |
| **U2** | **Swap 模式下各成员的 Character-bound Lorebook 是否全部常驻扫描** | 文档只说"包含群聊"，未明确是否仅 active speaker 的 lorebook 被扫描 | 两角色各绑定不同关键词的 lorebook，只说角色 B 相关词，看角色 A 发言时 B 的 lorebook 条目是否注入 |
| **U3** | **Author's Note 群聊当前状态** | Issue #456 已关闭，但 Issue #3030（2024-10）仍报 AN 未注入，状态不明确 | 群聊 2+ 条消息，设 AN 频率=1，检查 API 请求 `use_authors_note` 字段值 |
| **U4** | **Auto-mode + Natural Order 的 Talkativeness 分布** | 每轮是真正独立概率还是有历史权重调整？源码显示是独立随机，但打字中断行为待验证 | 设 3 个角色 talkativeness 各不同，auto-mode 跑 100 轮，统计发言次数分布是否符合独立概率 |
| **U5** | **/trigger 在非 Manual 策略下的行为** | 在 List/Natural 策略下 /trigger 是覆盖当前策略还是追加发言？ | 切换为 Natural Order 策略，发送 `/trigger 角色名`，观察是否绕过当前策略队列 |

---

## 11. 来源汇总

- [Group Chats | docs.sillytavern.app](https://docs.sillytavern.app/usage/core-concepts/groupchats/) — 官方文档主页（首要参考）
- [SillyTavern-Docs/groupchats.md @ GitHub](https://github.com/SillyTavern/SillyTavern-Docs/blob/main/Usage/Characters/groupchats.md) — 文档源码
- [DeepWiki — Group Chats](https://deepwiki.com/SillyTavern/SillyTavern/9-group-chats-and-multi-character-interactions) — 运行时源码级分析
- [DeepWiki — World Info System](https://deepwiki.com/SillyTavern/SillyTavern/6.1-world-info-system) — 世界书源码层
- [Macros | docs.sillytavern.app](https://docs.sillytavern.app/usage/core-concepts/macros/) — 宏完整列表
- [STscript Reference | docs.sillytavern.app](https://docs.sillytavern.app/usage/st-script/) — 脚本语言参考
- [Regex Extension | docs.sillytavern.app](https://docs.sillytavern.app/extensions/regex/) — 正则扩展文档
- [World Info | docs.sillytavern.app](https://docs.sillytavern.app/usage/core-concepts/worldinfo/) — 世界书完整文档
- [Issue #3550 — Character Notes not joined in group chat](https://github.com/SillyTavern/SillyTavern/issues/3550) — Bug report（状态：Open/Not Reproducible）
- [Issue #456 — Author's Note disabled in group chat](https://github.com/SillyTavern/SillyTavern/issues/456) — Bug report（已关闭）
- [Discussion #4130 — LLM decide next speaker](https://github.com/SillyTavern/SillyTavern/discussions/4130) — 社区实战范式
- [Discussion #4795 — 1.14.0 changelog](https://github.com/SillyTavern/SillyTavern/discussions/4795) — Preset/Scoped regex 顺序变更
- [Discussion #4926 — 1.15.0 changelog](https://github.com/SillyTavern/SillyTavern/discussions/4926) — metadata 格式破坏性变更
- [中文文档镜像 — groupchats](https://docs.eigeen.cc/usage/core-concepts/groupchats/) — 中文参考
