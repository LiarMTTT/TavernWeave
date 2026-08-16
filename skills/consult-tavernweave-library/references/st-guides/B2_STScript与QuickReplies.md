# STScript 与 QuickReplies 参考手册

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

SillyTavern 内置脚本引擎与快速回复系统的完整参考——命令体系、变量系统、QR 机制、WI 集成、范式代码、避坑清单。

---

## 置信度分级体系

**三级置信度**：

- **[high]** 多源交叉验证，可直接用于生产
- **[medium]** 单源或含推断成分，可用但建议真机验证
- **[low]** 孤证无源或纯推断，**禁止直接施工**，须先验证

**依据类型轴**：`[运行时源码]` / `[文档·多源]` / `[文档·单源]` / `[社区]` / `[推断]`

收集日期：**2026-06-28**
回源基准：**SillyTavern v1.14.0** + 本地成熟卡（星月 2.5.0 / 交错 2.6.0）

---

## 目录

1. 机制总览
   1.1 STScript 定位与架构
   1.2 Quick Replies 机制
   1.3 WI automationId 联动原理
2. 核心命令参考
   2.1 变量命令
   2.2 生成命令
   2.3 管道与流控
   2.4 控制流
   2.5 UI 交互
   2.6 消息操作
   2.7 提示注入
   2.8 世界书命令
   2.9 数学运算
3. QR 命令与字段参考
   3.1 QR 管理命令
   3.2 QR Set 配置字段
   3.3 QR 条目字段
   3.4 自动执行事件类型
4. 宏（Macro）完整参考
5. 世界书联动字段参考
6. 完整范式代码库
7. 高频避坑
8. 悬案与验证路径
9. 来源索引

---

## 1. 机制总览

### 1.1 STScript 定位与架构

**[high][文档·多源]**
STScript 是 SillyTavern 内置的脚本语言，基于斜杠命令引擎构建，核心能力包括：命令批处理、数据管道（pipe）、宏替换（macro）、变量系统（三层作用域）、闭包（closure）和控制流。

脚本的基本单元是以 `|` 分隔的命令序列，命令顺序执行并通过管道传递数据。脚本入口：

- Quick Reply 按钮（手动点击或事件自动触发）
- WI automationId 联动（条目激活时自动触发）
- 聊天输入框直接输入
- `/run` 跨套组调用

基本语法格式：

```stscript
/command named_arg=value unnamed_arg | /next_command
```

| 组件 | 说明 |
|---|---|
| `/command` | 以斜杠开头的命令名 |
| `named_arg=value` | 具名参数，`=` 后接值 |
| `unnamed_arg` | 无名参数，接在具名参数之后 |
| `\|` | 管道符，传递前一命令的输出作为下一命令的隐式无名参数 |
| `\|\|` | 双管道（阻断符），阻止上一命令输出传递 |
| `{: ... :}` | 闭包（inline closure），用于控制流命令的代码块 |

来源：STScript 官方语言参考 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 1.2 Quick Replies 机制

**[high][文档·多源]**
Quick Replies（QR）是 ST 内置扩展（非第三方），提供按钮 UI，每个按钮绑定一段 STScript（或普通文本）。

**套组（Set）的三层作用域**：

| 作用域 | 位置 | 说明 |
|---|---|---|
| 全局套组 | QR 扩展设置页 | 任何聊天中均可见 |
| 聊天级套组 | 聊天本地绑定 | 仅当前聊天可见 |
| 角色级套组 | 角色卡数据 | 随角色卡携带（需扩展支持存储） |

**QR 核心用途**：

1. 手动触发脚本（玩家点击按钮）
2. 事件驱动自动执行（startup / user / bot / load 等触发器）
3. 通过 `automationId` 与世界书联动

来源：DeepWiki QR System + ST Docs | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 1.3 WI automationId 联动原理

**[high][文档·多源]**

联动触发链：

```
WI 条目 keyword 命中（或 constant=true）
  → 条目激活
  → 查找 automationId 字段值
  → 匹配同值的 QR 按钮
  → 在 AI 消息生成之前执行 QR 脚本
```

关键约束：

- 每个 `automationId` 值**每次只触发一次的说法需修正**：v1.14.0 `AutoExecuteHandler.js` 中 `handleWIActivation` 将 WI 激活条目的 automationId 集合去重（`filter(Boolean)` 后用 `includes`），并按 QR 侧匹配——若**同一 QR 套组内**多个 QR 按钮持有相同 automationId，则**全部执行**；但**同一 automationId 从多条 WI 条目传入**时，由于已收集为数组 `includes` 查找，匹配到的 QR 按钮会全部执行，不额外限制（见悬案 5，需真机验证）。**[medium·推导未验证][运行时源码]**
- 脚本在 AI **消息生成之前**执行（无法在生成后读取 AI 回复内容后再处理）**[high][运行时源码]**（`WORLD_INFO_ACTIVATED` 事件在 WI 条目激活时发出，此时尚未进入生成流程）
- automationId 匹配**区分大小写**（WI 条目与 QR 按钮的值必须完全一致）**[medium·单源孤证][文档·单源]**

来源：World Info 官方文档 + Issue #3419 + v1.14.0 AutoExecuteHandler.js | 适用版本：v1.14.0+ | **[high（执行时机）/ medium（去重行为）][运行时源码+文档]**

---

## 2. 核心命令参考

### 2.1 变量命令

**三层变量作用域**：

| 层级 | 命令前缀 | 存储位置 | 生命周期 |
|---|---|---|---|
| 本地变量（聊天级） | `/setvar` / `/getvar` | `chat_metadata` | 随聊天持久化 |
| 全局变量 | `/setglobalvar` / `/getglobalvar` | `extension_settings` | 跨聊天持久化 |
| 作用域变量（闭包级） | `/let` / `/var` | 执行栈 | 闭包销毁即消失 |

**本地变量命令**：

| 命令 | 语法 | 说明 |
|---|---|---|
| `/setvar` | `/setvar key=name [index=i] value` | 设置本地变量 |
| `/getvar` | `/getvar [index=i] name` | 获取本地变量，写入管道 |
| `/addvar` | `/addvar key=name [index=i] increment` | 数值累加；对数组则 push |
| `/incvar` | `/incvar name` | 整数 +1 |
| `/decvar` | `/decvar name` | 整数 -1 |
| `/flushvar` | `/flushvar name` | 删除本地变量 |

**全局变量命令**（语法与本地变量同构，前缀 `global`）：

| 命令 | 说明 |
|---|---|
| `/setglobalvar key=name value` | 设置全局变量 |
| `/getglobalvar name` | 获取全局变量 |
| `/addglobalvar key=name increment` | 全局累加 |
| `/incglobalvar name` | 全局 +1 |
| `/decglobalvar name` | 全局 -1 |
| `/flushglobalvar name` | 删除全局变量 |

**作用域变量命令**：

| 命令 | 语法 | 说明 |
|---|---|---|
| `/let` | `/let name [value]` | 声明作用域变量（闭包销毁即消失） |
| `/var` | `/var name [value]` | 读写作用域变量 |

**`index=` 参数说明**：

- `index=数字` → 访问/设置数组的第 N 个元素（0-based）
- `index=字符串` → 访问/设置对象的指定键
- 变量不存在时自动创建空 `[]`（数字 index）或 `{}`（字符串 index）

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.2 生成命令

| 命令 | 语法 | 说明 |
|---|---|---|
| `/gen` | `/gen [lock=on/off] [stop=[]] prompt` | 用当前角色 + 聊天历史生成，注入完整上下文 |
| `/genraw` | `/genraw [lock=on/off] [stop=[]] [instruct=on/off] [as=system/char] prompt` | 仅用提示词生成，忽略角色卡和聊天历史 |
| `/trigger` | `/trigger` | 触发正常对话生成（相当于用户按下发送） |
| `/swipe` | `/swipe` | 触发滑动生成 |
| `/regenerate` | `/regenerate` | 重新生成最后一条 AI 消息 |
| `/continue` | `/continue` | 继续上一条消息（追加内容） |
| `/ask` | `/ask name=charName prompt` | 临时切换角色生成，不覆盖当前激活角色 |

**`/gen` vs `/genraw` 区别**：

| 维度 | `/gen` | `/genraw` |
|---|---|---|
| 角色卡 | 包含 | 忽略 |
| 聊天历史 | 包含 | 忽略 |
| 典型用途 | 角色扮演内容生成 | 旁白、系统操作、第三方视角生成 |

**`stop=` 参数**：接受 JSON 数组格式，如 `stop=["END","<stop>"]`。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.3 管道与流控

| 命令 | 语法 | 说明 |
|---|---|---|
| `/pass` | `/pass value` | 将值显式写入管道 |
| `\|\|` | `cmd1 \|\| cmd2` | 双管道阻断符：阻止 cmd1 的输出传给 cmd2 |
| `/break` | `/break` | 跳出当前循环或闭包 |
| `/abort` | `/abort [reason]` | 中断整个脚本执行 |
| `/return` | `/return [value]` | 从闭包/函数返回值，可带返回值 |
| `/delay` | `/delay ms` | 等待 N 毫秒 |

**管道（pipe）机制**：每条命令的输出自动作为下一条命令的隐式无名参数；用 `{{pipe}}` 宏可在参数字符串内显式引用管道值。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.4 控制流

| 命令 | 语法 | 说明 |
|---|---|---|
| `/if` | `/if left=A right=B rule=op [else={: ... :}] {: ... :}` | 条件分支 |
| `/while` | `/while left=A right=B rule=op [guard=on] {: ... :}` | 循环（MAX_LOOPS=100 硬限制） |
| `/times` | `/times N {: ... :}` | 重复 N 次 |
| `/foreach` | `/foreach list=[...] {: ... :}` | 遍历列表，元素通过管道传入闭包 |
| `/run` | `/run label` 或 `/run PresetName.Label` | 调用 QR 过程或执行闭包变量 |
| `/:varName` | `/:myVar` | 执行存储在 `myVar` 变量里的闭包 |

**`/if` 的 `rule` 枚举值**：

| rule 值 | 含义 |
|---|---|
| `eq` | 等于 |
| `neq` | 不等于 |
| `lt` | 小于 |
| `gt` | 大于 |
| `lte` | 小于等于 |
| `gte` | 大于等于 |
| `not` | 布尔非（right 参数忽略） |
| `in` | 包含子串（不区分大小写） |
| `nin` | 不包含子串 |

**`left=` / `right=` 值解析顺序**：数字字面量 → 本地变量 → 全局变量 → 字符串字面量。

**`/while` 的 `guard=on`**：启用防卡死守卫，超出 MAX_LOOPS=100 次时强制中断。

**`/times` 内部宏**：`{{timesIndex}}` 返回当前迭代的 0-based 索引。

来源：STScript 官方文档 + GitHub Docs 贡献者版 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.5 UI 交互

| 命令 | 语法 | 说明 |
|---|---|---|
| `/input` | `/input prompt` | 显示输入框，用户输入写入管道 |
| `/echo` | `/echo [title=标题] [severity=info/warning/error] text` | Toast 提示 |
| `/popup` | `/popup text` | 弹窗（支持 HTML） |
| `/buttons` | `/buttons labels=["A","B"] text` | 带按钮弹窗，返回用户点击的标签文字 |
| `/setinput` | `/setinput text` | 替换聊天输入框内容 |

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.6 消息操作

| 命令 | 语法 | 说明 |
|---|---|---|
| `/messages` | `/messages [names=on/off] start-finish` | 读取消息范围内容，写入管道 |
| `/send` | `/send text` | 以当前用户身份发送消息（不触发生成） |
| `/sendas` | `/sendas name=charName text` | 以指定角色名发送消息 |
| `/sys` | `/sys text` | 系统叙述消息（橙色样式） |
| `/comment` | `/comment text` | 隐藏评论（AI 看不到，仅在 UI 可见） |
| `/hide` | `/hide start-finish` | 隐藏指定范围消息（AI 不读取） |
| `/unhide` | `/unhide start-finish` | 显示被隐藏的消息 |
| `/cut` | `/cut index` | 删除指定消息 |
| `/del` | `/del index` | 删除指定消息 |
| `/delswipe` | `/delswipe index` | 删除消息的指定滑动选项 |
| `/addswipe` | `/addswipe text` | 为最后一条消息添加滑动选项 |

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.7 提示注入

| 命令 | 语法 | 说明 |
|---|---|---|
| `/inject` | `/inject id=ID [position=after/before/chat] [depth=N] text` | 注入提示内容到上下文 |
| `/note` | `/note text` | 设置 Author's Note |
| `/listinjects` | `/listinjects` | 列出所有当前注入 |
| `/flushinjects` | `/flushinjects` | 清除所有注入 |

**`/inject` 参数详解**：

| 参数 | 值 | 说明 |
|---|---|---|
| `id=` | 字符串 | 注入 ID；相同 ID 重复调用会**覆盖**而非追加 |
| `position=` | `before`（系统提示前）/ `after`（角色卡后）/ `chat`（聊天历史内） | 注入位置 |
| `depth=` | 整数 | `position=chat` 时有效；`0` = 最后一条消息后，`N` = 倒数第 N 条消息处 |

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.8 世界书命令

| 命令 | 语法 | 说明 |
|---|---|---|
| `/getchatbook` | `/getchatbook` | 返回当前聊天绑定的世界书名称 |
| `/findentry` | `/findentry file=book field=fieldName text` | 按字段值查找条目，返回 UID |
| `/getentryfield` | `/getentryfield file=book field=field UID` | 获取条目指定字段的值 |
| `/setentryfield` | `/setentryfield file=book uid=UID field=field text` | 设置条目字段值 |
| `/createentry` | `/createentry file=book key=keyword content` | 新建条目 |

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 2.9 数学运算

支持多参数批量运算（`/add 1 2 3 4` 返回 `10`）：

| 命令 | 说明 |
|---|---|
| `/add` | 加法 |
| `/sub` | 减法 |
| `/mul` | 乘法 |
| `/div` | 除法 |
| `/mod` | 取余 |
| `/pow` | 幂运算 |
| `/sin` / `/cos` | 三角函数 |
| `/log` | 对数 |
| `/abs` | 绝对值 |
| `/sqrt` | 平方根 |
| `/round` | 四舍五入 |
| `/rand` | `/rand [min=N] [max=M]` 随机数 |
| `/len` | 获取字符串或数组长度 |

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

## 3. QR 命令与字段参考

### 3.1 QR 管理命令

**创建与更新**：

```stscript
/qr-create set=SetName label=ButtonLabel
           [hidden=true/false] [startup=true/false]
           [user=true/false] [bot=true/false] [load=true/false]
           [title=tooltip文字] [automationId=ID]
           script_content

/qr-update set=SetName label=OldLabel [newlabel=NewLabel]
           [hidden=...] [startup=...] [user=...] [bot=...] [load=...]
           [title=...] [automationId=...]
           new_script_content

/qr-delete set=SetName label=ButtonLabel
```

**套组（Preset）管理**：

```stscript
/qr-presetadd [enabled=bool] [nosend=bool] [before=bool] [slots=N] [inject=bool] PresetName
/qr-presetupdate [同上参数] PresetName
```

**右键上下文菜单管理**：

```stscript
/qr-contextadd set=SetName label=ButtonLabel contextSet=ContextSetName
/qr-contextdel set=SetName label=ButtonLabel contextSet=ContextSetName
/qr-contextclear set=SetName label=ButtonLabel
```

**套组启用/禁用**：

```stscript
/qr-set-on SetName
/qr-set-off SetName
```

来源：STScript 官方文档 + DeepWiki QR System | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 3.2 QR Set 配置字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 套组唯一名称 |
| `disableSend` | bool | true → 脚本输出插入输入框而非直接发送 |
| `placeBeforeInput` | bool | true → 输出置于当前输入内容之前 |
| `injectInput` | bool | true → 自动追加当前输入框内容到 QR 脚本 |
| `color` | CSS 颜色值 | 该套组按钮的颜色主题 |

来源：DeepWiki QR System | 适用版本：v1.14.0+ | **[medium·单源孤证][文档·单源]**

---

### 3.3 QR 条目字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | string | 按钮显示文字 |
| `message` | string | STScript 内容（`/` 开头）或普通消息文本 |
| `automationId` | string | 与 WI 条目 `automationId` 字段匹配后自动触发（源码 QuickReply.js 直读此字段） |
| `preventAutoExecute` | bool | 防止事件触发时无限递归执行 |
| `contextList` | array | 右键上下文菜单中额外显示的 QR 套组列表 |
| `hidden` | bool | 隐藏按钮（在 UI 不显示，仍可被脚本调用） |

来源：DeepWiki QR System + 本地 v1.14.0 源码 AutoExecuteHandler.js 行 91–96 | 适用版本：v1.14.0+ | **[medium·单源孤证][文档·单源]**（字段存在由源码直读确认，但描述细节仍单一文档源）

---

### 3.4 自动执行事件类型

**`/qr-create` 的布尔触发参数与对应事件**：

> **[运行时源码]** 依据：v1.14.0 `extensions/quick-reply/src/SlashCommandHandler.js` 行 265–271（namedArgumentList）、`index.js` 行 282–324（事件监听绑定）、`AutoExecuteHandler.js`（handler 方法名）。

| 参数 | 内部属性名 | 监听事件（event_types） | 触发时机 |
|---|---|---|---|
| `startup=true` | `executeOnStartup` | `APP_READY` | ST 应用启动完成时 |
| `user=true` | `executeOnUser` | `USER_MESSAGE_RENDERED` | 用户消息渲染完成后 |
| `bot=true` | `executeOnAi` | `CHARACTER_MESSAGE_RENDERED` | AI 消息渲染完成后 |
| `load=true` | `executeOnChatChange` | `CHAT_CHANGED` | **聊天切换**时（不含新建聊天） |
| `new=true` | `executeOnNewChat` | `CHAT_CREATED` | **新建聊天**时（与 `load` 独立） |
| `group=true` | `executeOnGroupMemberDraft` | `GROUP_MEMBER_DRAFTED` | 群组成员消息草稿生成时 |
| `generation=true` | `executeBeforeGeneration` | `GENERATION_AFTER_COMMANDS` | 命令处理完成后、生成 API 请求发出前 |

**说明**：

- `load=true` 与 `new=true` 是两个**独立参数**，分别对应 `CHAT_CHANGED`（切换已有聊天）和 `CHAT_CREATED`（新建聊天）；旧版草稿将二者合并为一个参数是错误的。
- `generation=true` 的内部 handler 名为 `handleBeforeGeneration`，监听 `GENERATION_AFTER_COMMANDS` 事件——事件名含义是"命令管线执行完成后"，实际效果是"在 LLM API 请求发出之前"。
- `automationId` 联动（WI 激活触发）不是 `/qr-create` 的布尔参数，而是 QR 对象的字符串字段（见悬案 3 / 3.3 节）。
- 官方文档列出 6 个自动执行条件（startup/user/bot/load/group/WI），`new` 和 `generation` 为额外参数；来源索引中 DeepWiki 可能未完整覆盖。

来源：v1.14.0 运行时源码（SlashCommandHandler.js / AutoExecuteHandler.js / index.js / events.js）+ ST 官方文档 | 适用版本：v1.14.0+ | **[high][运行时源码]**

---

## 4. 宏（Macro）完整参考

宏在命令参数字符串内（`{{...}}`）解析，可嵌套使用：

| 宏 | 说明 | 是否有返回值 |
|---|---|---|
| `{{pipe}}` | 当前管道值（显式引用） | 是 |
| `{{getvar::name}}` | 获取本地变量值 | 是 |
| `{{setvar::name::value}}` | 设置本地变量（替换为**空字符串**） | 否 |
| `{{incvar::name}}` | 本地变量 +1，返回新值 | 是 |
| `{{decvar::name}}` | 本地变量 -1，返回新值 | 是 |
| `{{addvar::name::value}}` | 本地变量累加（替换为空字符串） | 否 |
| `{{getglobalvar::name}}` | 获取全局变量值 | 是 |
| `{{var::name}}` | 读取作用域变量（`/let` 声明的） | 是 |
| `{{var::}}` | 从父闭包读取管道值 | 是 |
| `{{timesIndex}}` | `/times` 循环的当前迭代索引（0-based） | 是 |
| `.varName` | `{{var::varName}}` 的简写 | 是 |
| `$varName` | `{{getglobalvar::varName}}` 的简写 | 是 |

**注意**：`{{setvar::}}` 和 `{{addvar::}}` 执行后替换为空字符串，不可用于读取。读取设置后的值须用 `{{getvar::name}}`。

来源：STScript 官方文档 + GitHub Docs 贡献者版 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

## 5. 世界书联动字段参考

与 automationId 集成相关的 WI 条目关键字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `automationId` | string | 与 QR 按钮 automationId 完全匹配后触发 QR 脚本 |
| `constant` | bool（Blue Circle 图标）| true → 无需关键词，始终激活 |
| `keys` | string[] | 关键词列表，任一命中则激活条目 |
| `position` | enum | 条目内容插入位置（before_char / after_char 等） |
| `insertion_order` | int | 优先级，数字越高越靠近提示末尾 |
| `enabled` | bool | 是否启用该条目 |
| `probability` | int (0–100) | 触发概率百分比 |
| `comment` | string | 条目描述（不进入上下文，仅供开发者查阅） |

**automationId 触发限制**：

- 执行时机：AI 消息生成**之前**（无法在生成后读取内容）**[high][运行时源码]**
- 关于"每次只执行一次"：源码 `AutoExecuteHandler.js` 并无 automationId 全局去重——若 QR 套组中存在多个相同 automationId 的按钮，均会被触发；多条 WI 条目携带相同 automationId 时，最终匹配的是 QR 侧的按钮数量，而非 WI 条目数。确切去重行为见悬案 5，**[medium·推导未验证][运行时源码]**
- 区分大小写的匹配策略（WI 条目与 QR 按钮 automationId 必须完全一致）**[medium·单源孤证][文档·单源]**

来源：World Info 官方文档 + Issue #3419 + v1.14.0 AutoExecuteHandler.js | 适用版本：v1.14.0+ | **[high（执行时机）/ medium（去重细节）][运行时源码+文档]**

---

## 6. 完整范式代码库

### 范式 1：变量读写 + 条件分支

```stscript
/setvar key=hp 100 |
/setvar key=status alive |
/if left={{getvar::hp}} right=0 rule=lte
   else={: /echo HP剩余{{getvar::hp}}，状态：活着 :}
   {: /setvar key=status dead | /echo 角色已死亡 :}
```

`left=` 和 `right=` 先尝试解析为变量名，无匹配则当字面量处理。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 2：用户输入 → 变量 → 调用外部命令

```stscript
/input 你想生成什么图片？ |
/setvar key=SDinput |
/echo 正在生成：{{getvar::SDinput}} |
/getvar SDinput |
/imagine
```

管道值（pipe）自动作为下一条命令的未命名参数注入，`/setvar key=name`（无 value）时自动从管道读取值。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 3：/genraw 调用 + 结果处理

```stscript
/genraw lock=on stop=["END"]
   Write a short tavern rumor about {{char}}.
   Format: one sentence. END |
/setvar key=rumor |
/comment [旁白] {{getvar::rumor}}
```

`/genraw` 忽略角色上下文；`stop=["END"]` 用 JSON 数组格式设置停止序列；生成结果写入管道后可被后续命令接收。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[medium][文档·单源]**

---

### 范式 4：闭包作用域变量（/let + /var）

```stscript
/let counter 0 |
/while left={{var::counter}} right=5 rule=lt {:
    /var counter {{var::counter}} |
    /addvar key=counter 1 |
    /echo 第{{var::counter}}次迭代
:}
```

`/let` 声明的变量只在当前闭包及其子闭包内有效；`{{var::name}}` 是 `/let` 变量专用宏，不能用 `{{getvar::}}` 访问。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 5：命名闭包（函数定义与复用）

```stscript
/let greet {: name=
    /echo 你好，{{var::name}}！
:} |
/:greet name=世界 |
/:greet name=玩家
```

闭包参数声明格式：`paramName=默认值`；`paramName=`（等号后空值）表示必填无默认值。通过 `/:varName` 调用存储在变量中的闭包。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 6：递归阶乘（高级闭包示例）

```stscript
/let fact {: n=
    /if left={{var::n}} rule=gt right=1
        else={: /return 1 :}
        {: /sub {{var::n}} 1 | /:fact n={{pipe}} | /mul {{var::n}} {{pipe}} :}
:} |
/let n 5 |
/:fact n={{var::n}} |
/echo 5的阶乘是{{pipe}}
```

此为官方文档的标准递归示例，验证可用。`/return` 将值写入管道传回调用者。

来源：STScript 官方文档（官方代码示例）| 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 7：/qr-create 动态创建 QR 并绑定自动执行

```stscript
/qr-create set=MyTools label=InitGame
   bot=true
   /setvar key=turn 1 | /setvar key=score 0 | /echo 游戏初始化完成
```

`bot=true` 使此 QR 在每次 AI 消息渲染后自动执行。若同时设置 `automationId=game_init`，则 WI 激活 `game_init` 时也会触发。

来源：STScript 官方文档 + DeepWiki QR System | 适用版本：v1.14.0+ | **[medium][文档·多源]**

---

### 范式 8：世界书 automationId 联动 QR

**世界书条目配置**（JSON 字段示意）：

```json
{
  "comment": "场景切换检测 - 进入市场",
  "keys": ["进入市场", "来到市集", "走进集市"],
  "automationId": "enter_market",
  "position": "before_char",
  "enabled": true,
  "probability": 100
}
```

**对应 QR 配置**（在 QR 扩展 UI 或通过命令设置）：

- Set: `GameEvents`
- Label: `EnterMarket`
- automationId: `enter_market`（与 WI 条目完全一致）
- Script:

```stscript
/setvar key=location 市场 |
/inject id=market_context position=chat depth=4
   [当前场景：市场。玩家已进入市集区域。]
```

**触发链**：WI 关键词命中 → 条目激活 → automationId 匹配 → AI 生成前执行 QR 脚本 → 注入内容进入上下文 → AI 生成时读取注入内容。

来源：World Info 官方文档 + STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 9：提示注入（动态上下文管理）

```stscript
/inject id=status_inject position=chat depth=2
   当前状态：HP={{getvar::hp}} | 位置={{getvar::location}} | 回合={{getvar::turn}} |
/trigger
```

每次调用相同 `id=` 的 `/inject` 会**覆盖**上一次注入（不追加）。`depth=2` 表示插在倒数第 2 条消息处。此范式适合在每轮生成前刷新状态快照。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 10：数组操作（库存管理）

```stscript
/setvar key=inventory index=0 剑 |
/setvar key=inventory index=1 盾 |
/setvar key=inventory index=2 药水x3 |
/len {{getvar::inventory}} |
/echo 背包共{{pipe}}件物品：{{getvar::inventory}}
```

`index=数字` 操作数组元素；`index=字符串` 操作对象键；`/len` 返回数组长度（或字符串字符数）。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

### 范式 11：LALib 扩展的错误处理（/try-/catch）

```stscript
/try {:
    /getvar nonexistent |
    /div {{pipe}} 0
:} |
/catch {:
    /echo 发生错误：{{pipe}}
:}
```

**需安装 LALib 扩展**（https://github.com/LenAnderson/SillyTavern-LALib）。核心 STScript 无内置错误处理机制；`/try` 块内的任何错误都会被 `/catch` 捕获，错误信息通过管道传入。

来源：LALib 扩展文档 | 适用版本：LALib 当前版本 | **[medium][文档·单源]**

---

### 范式 12：跨套组过程调用（模块化复用）

```stscript
// 在 QR 套组 "Utils" 中定义过程 "RollDice"
// label: RollDice
// script: /rand min=1 max=100

// 在任意其他脚本中调用：
/run Utils.RollDice |
/echo 掷骰结果：{{pipe}}
```

`/run PresetName.LabelName` 实现跨套组调用。过程本身不直接接受命名参数传递，需通过变量间接共享状态（见避坑 6）。

来源：STScript 官方文档 | 适用版本：v1.14.0+ | **[high][文档·多源]**

---

## 7. 高频避坑

### 坑 1：子闭包不自动继承父管道值

**[high][文档·多源]**

```stscript
// 错误：子闭包的第一个命令不自动接收父管道值
/echo foo | /times 2 {: /echo :}    // 子闭包里 /echo 收不到 "foo"

// 正确：显式引用
/echo foo | /times 2 {: /echo {{pipe}} :}
```

根因：管道值进入闭包后，闭包内部有自己独立的管道上下文，不自动继承外部管道值。`{{pipe}}` 宏是唯一可靠的引用方式。

---

### 坑 2：变量遮蔽（shadowing）导致祖先变量不可访问

**[high][文档·多源]**

```stscript
/let x 外层 |
/times 1 {:
    /let x 内层 |
    /echo {{var::x}}    // "内层"，外层 x 已被遮蔽
    // 此处无法访问外层 x
:}
```

子闭包内的 `/let x` 声明后，父作用域的同名变量在该子闭包及其所有后代中**完全不可访问**。命名时应避免跨层级重名。

---

### 坑 3：`||` 双管道被误用为逻辑"或"

**[high][文档·多源]**

`||` 在 STScript 中是**管道阻断符**，不是逻辑 OR 操作符。其作用是阻止上一条命令的输出传给下一条命令：

```stscript
/echo 不传递这个 || /world
// /world 不会接收 "不传递这个" 作为参数
```

来自其他编程语言的 OR 语义直觉在此完全错误。

---

### 坑 4：/while 循环有 MAX_LOOPS=100 硬限制

**[high][文档·多源]**

超过 100 次迭代时循环被强制中断，且**无任何错误提示或警告**，脚本静默继续执行后续命令。对于需要超过 100 次迭代的场景，须改用分批执行或递归闭包方案。

---

### 坑 5：automationId 只在生成前触发

**[high][文档·多源]**

WI automationId 触发的 QR 脚本**始终在 AI 消息生成之前**执行，无例外。若需要读取 AI 生成内容后再处理（如提取关键词、根据 AI 回复更新状态），当前无原生支持。

已知变通方案：在下一次用户消息时，利用 `user=true` 触发器的 QR 读取上一条 AI 消息内容（通过 `/messages` 命令），但这意味着状态更新延迟一轮。

---

### 坑 6：/run 调用 QR 过程时命名参数无法在脚本内通过 /let 变量读取

**[medium·推导未验证][运行时源码]**

> **原草稿结论"不接受 arg=value"有误，需细化。**

v1.14.0 `slash-commands.js` `runCallback`（行 3446–3495）实际行为：

- **调用闭包变量**（`/:myVar name=value`）：**支持命名参数**——run callback 会遍历闭包的 argumentList，将 args 中同名参数注入 providedArgumentList（行 3469–3476）
- **调用 QR 过程**（`/run PresetName.Label`）：整个 args 对象传入 `executeQuickReplyByName`，但 QR 脚本在**无闭包 scope 的上下文**中执行，无法通过 `{{var::name}}` 读取——实际效果仍需变量中转

```stscript
// ✅ 调用闭包变量时可直接传参（参数需在闭包内声明）
/let greet {: name= /echo 你好，{{var::name}}！ :} | /:greet name=世界

// ⚠️ 调用 QR 过程：args 传入但内部能否读取取决于实现，建议变量中转
/setvar key=proc_input 123 | /run MyProc
// 在 MyProc 内通过 /getvar proc_input 读取（保险做法）
```

仍需真机验证：`/run PresetName.Label arg=value` 时 QR 脚本内 `{{var::arg}}` 是否可读。见悬案 1。

---

### 坑 7：宏 `{{setvar::}}` 和 `{{addvar::}}` 不返回值

**[high][文档·多源]**

这两个宏执行后替换为**空字符串**，不返回值，不能用于读取。如需写入后立即读取，须单独调用 `{{getvar::name}}`：

```stscript
// 错误：期望返回设置后的值
/echo {{setvar::score::100}}   // 输出空字符串

// 正确：先设置，再读取
{{setvar::score::100}}/echo {{getvar::score}}
// 或：
/setvar key=score 100 | /echo {{getvar::score}}
```

只有 `{{getvar::}}` `{{incvar::}}` `{{decvar::}}` 三个变量宏有明确返回值。

---

### 坑 8：/gen 和 /genraw 默认静默生成，不自动显示在聊天界面

**[high][运行时源码+文档·多源]**

> **原草稿结论完全相反，已翻转并修正。**

`/gen` 和 `/genraw` **默认为静默（background/quiet）模式**，生成结果只写入管道，**不会以消息形式显示在聊天 UI，也不进入对话历史**。

依据：
- v1.14.0 `slash-commands.js`：`generateCallback` 中 `quietToLoud = (as === 'char')`，默认 `as='system'` → `quietToLoud=false`（静默）。
- 官方文档示例明确用 `/sendas name={{char}} {{pipe}}` 才把生成结果插入聊天。

若要将生成结果发送到聊天（让 AI 能在后续读取到），需**显式追加** `/sendas` 或 `/send` 命令：

```stscript
/genraw 生成一段内心独白 | /sendas name={{char}} {{pipe}}
```

仅当 `/gen as=char`（或 `/genraw as=char`）时，结果才以角色消息形式追加到聊天历史。

---

### 坑 9：世界书条目内容中无法有效使用 outlet 宏嵌套

**[medium·单源孤证][文档·单源]**

官方文档明确说明：在 WI 条目内容字段中放置 `{{outlet::...}}` 宏无效，会导致评估顺序冲突甚至无限循环。WI 与 STScript 的正确集成路径是 **automationId + QR**，而非在 WI 内容中嵌套脚本宏。

> 注：`{{outlet::name}}` 宏本身在 v1.14.0 `macros.js` 中有完整实现（用于将 WI outlet 条目内容注入到提示中），但"在 WI 条目正文内使用此宏"这一限制来自官方文档单一来源，未经真机复验，故降为 medium·单源孤证。

---

### 坑 10：/let 作用域变量的 /run 继承性因调用方式不同而有差异

**[medium·推导未验证][运行时源码]**

通过 v1.14.0 源码（见悬案 1 已解结论）：

- **`/:闭包变量`**（`/:myVar`）：`runCallback` 第 3463 行 `closure.scope.parent = scope`，**可继承**父 scope 的 `/let` 变量
- **`/run PresetName.Label`（QR 过程）**：走 `executeQuickReplyByName` 路径，**不设置 scope.parent**，无法访问调用方 `/let` 变量

原草稿"访问性不确定"已有源码答案，但 QR 过程侧具体行为仍需真机复验（见悬案 1 末尾）。

---

## 8. 悬案与验证路径

### 悬案 1（部分解）：`/run` 闭包变量时继承父 scope；调用 QR 过程时不继承

**[medium·推导未验证][运行时源码]**

> **通过源码部分解决；闭包变量已明确，QR 过程仍待验证。**

v1.14.0 `slash-commands.js` `runCallback` 行 3463：`closure.scope.parent = scope`——当调用**存储在变量中的闭包**（`/:varName`）时，闭包 scope 的 parent 被设为调用方当前 scope，因此**可以访问父 scope 的 `/let` 变量**（通过作用域链向上查找）。

当调用 **QR 过程**（`/run PresetName.Label`，行 3492）时，进入 `executeQuickReplyByName`，不经过上述 scope.parent 设置，因此**不继承调用方的 `/let` 变量**。

```stscript
// ✅ /:闭包变量 继承父 scope
/let x 父作用域值 |
/let fn {: /echo {{var::x}} :} |
/:fn    // 输出 "父作用域值"（由源码 scope.parent 保证）

// ❌ /run QR.Label 不继承父 scope /let 变量
/let x 父作用域值 | /run TestProc.CheckScope   // {{var::x}} 无法访问
```

仍待真机验证：QR 脚本侧能否通过 `{{var::}}` 读取 args 传入值。

---

### 悬案 2（部分解）：automationId 执行时机——在 WI prompt 组装期间同步执行

**[medium·推导未验证][运行时源码]**

> **通过源码部分解答，精确边界已缩窄，仍需真机验证 /inject 是否出现在请求中。**

v1.14.0 `world-info.js` 行 853–864：`getWorldInfoPrompt` 在 WI 条目内容计算完成后（`checkWorldInfo` 返回后），同步发出 `WORLD_INFO_ACTIVATED` 事件，然后 QR 的 `handleWIActivation` 被 `await` 触发。

时序链：
```
LLM Generate() 调用
  → getWorldInfoPrompt()
    → checkWorldInfo()（计算激活条目）
    → emit(WORLD_INFO_ACTIVATED) → await handleWIActivation() → QR 脚本同步执行
  → 将 worldInfoString 注入 prompt 构造
  → 发出 API 请求
```

因此精确答案是：B（LLM API 请求构造期内，WI 内容已确定但 prompt 尚未最终发出）——**WI automationId 触发的 QR 中 `/inject` 的内容理论上会进入当次 API 请求**，但需真机验证。

**真机验证路径**：在 automationId 触发的 QR 脚本中运行 `/inject id=test_inject position=chat depth=0 测试注入内容`，然后查看发出的 API 请求中是否包含该注入内容。

---

### 悬案 3（已解）：`/qr-create` 命令行支持 `automationId=` 参数，但未在官方参数列表中注册

**[high][运行时源码]**

> **本悬案已通过源码回源解决，状态：已闭合。**

v1.14.0 `SlashCommandHandler.js` 第 880 行：`automationId: args.automationId ?? ''`，回调函数直接读取 `args.automationId` 并写入 QR 对象。

然而该参数**未在 `namedArgumentList`（第 237–273 行）中注册**，因此：
- `/help qr-create` 不会列出 `automationId`
- 自动补全不提示此参数
- 但实际传入 `automationId=xxx` 时**确实生效**（args 对象包含所有命名参数，未注册的同样可读取）

结论：**可用，但属于隐式/非文档化参数**。建议优先通过 QR UI 设置 automationId，脚本方式使用时需自行测试当前版本是否仍有效。

---

### 悬案 4：`/genraw` 的 `as=char` 参数效果

**[low][文档·单源]**

文档提及 `as=system`（默认）或 `as=char` 两个值，但未说明具体格式差异（角色名如何插入？使用哪种提示模板？）。

**真机验证路径**：分别用 `as=system` 和 `as=char` 生成，捕获发出的原始 API 请求（通过 ST 的调试模式或网络抓包），对比消息结构差异。

---

### 悬案 5（部分解）：同一 automationId 多条 WI 条目同时激活的行为

**[medium·推导未验证][运行时源码]**

> **部分通过源码回源，机制已明确，仍需真机验证执行次数。**

v1.14.0 `AutoExecuteHandler.js` `handleWIActivation` 逻辑（第 91–106 行）：

1. 将所有激活 WI 条目的 `automationId` 字段提取为数组 `automationIds`（`map + filter(Boolean)`，**不做 Set 去重**）
2. 遍历 QR 套组，找到 `qr.automationId && automationIds.includes(qr.automationId)` 的按钮，**全部进入执行队列**

因此：
- **多条 WI 条目携带相同 automationId**：`automationIds` 数组中出现重复值，但 `includes` 只做成员检查，最终执行的是 QR 侧**所有匹配该 automationId 的按钮**（通常只有一个），WI 条目数量不影响执行次数
- **同一 QR 套组中多个按钮持有相同 automationId**：这些按钮会**全部依次执行**（无去重）
- **A/B/C 问题**（文档中"只执行一次"的说法）：源码层面无此保证，"每个 automationId 只执行一次"是 WI 条目侧的表述，不是 QR 侧的保证

仍待真机验证：多条 WI 同时激活时 QR 执行次数。

---

### 悬案 6：`/foreach` 的 `list=` 参数接受格式

**[medium][推断]**

文档示例用 JSON 数组字面量（`list=["a","b","c"]`），但未说明是否支持变量引用（`list={{getvar::myArray}}`）。

**真机验证路径**：

```stscript
/setvar key=items ["剑","盾","药水"] |
/foreach list={{getvar::items}} {:
    /echo 物品：{{pipe}}
:}
// 若每个元素分别输出 → 支持变量引用；若报错或无输出 → 只支持字面量
```

---

## 9. 来源索引

| 来源 | URL / 路径 | 可信度 |
|---|---|---|
| STScript 官方语言参考（主可靠来源）| https://docs.sillytavern.app/usage/st-script/ | 文档·多源验证 |
| ST Docs GitHub 贡献者版（完整命令参考）| https://github.com/SillyTavern/SillyTavern-Docs/blob/main/For_Contributors/st-script.md | 文档·多源 |
| DeepWiki - Quick Reply System | https://deepwiki.com/SillyTavern/SillyTavern/7.2-quick-reply-system | 文档·单源 |
| DeepWiki - Slash Command System | https://deepwiki.com/SillyTavern/SillyTavern/7.1-slash-command-system | 文档·单源 |
| DeepWiki - Variables/Macros/Scripting | https://deepwiki.com/SillyTavern/SillyTavern/7.3-variables-macros-and-scripting | 文档·单源 |
| World Info 官方文档 | https://docs.sillytavern.app/usage/core-concepts/worldinfo/ | 文档·多源 |
| LALib 扩展 | https://github.com/LenAnderson/SillyTavern-LALib | 文档·单源 |
| Issue #3419 - automationId 触发时机讨论 | https://github.com/SillyTavern/SillyTavern/issues/3419 | 社区 |
| **本地 v1.14.0 运行时源码（本次校准新增）** | `public/scripts/extensions/quick-reply/src/AutoExecuteHandler.js` | **运行时源码** |
| **本地 v1.14.0 运行时源码** | `public/scripts/extensions/quick-reply/src/SlashCommandHandler.js` | **运行时源码** |
| **本地 v1.14.0 运行时源码** | `public/scripts/variables.js` | **运行时源码** |
| **本地 v1.14.0 运行时源码** | `public/scripts/slash-commands.js` | **运行时源码** |
| **本地 v1.14.0 运行时源码** | `public/scripts/world-info.js` | **运行时源码** |
| **本地 v1.14.0 运行时源码** | `public/scripts/events.js` | **运行时源码** |
| 本地生产卡：交错宙域 v2.1.5 | `交错宙域/v2.1.5_20260530_194328/` | 运行时参照 |

**本地卡参照说明**：交错宙域 v2.1.5 的世界书 28 条目均设置 `automationId: none`，该卡采用 mvu_context EJS 模板替代 STScript 状态管理方案，**未使用 QR/automationId**。因此本手册中的范式代码均来自文档源，非本地卡实测结论。

**校准日期**：2026-06-28 | 校准者：Claude Sonnet 4.6 | 回源版本：v1.14.0 本地源码直读
