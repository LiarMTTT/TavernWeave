# 前端基础 — TavernHelper 与 iframe

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

> 原《前端TavernHelper与iframeAPI.md》与《iframe通信与跨楼层同步.md》**重度合并去重版**（2026-06-28）。
>
> 回源环境：SillyTavern v1.14.0 + JS-Slash-Runner（TavernHelper）；生产卡来源：星月 2.5.0 / 2.9.9 + 交错宙域 2.6.0。
>
> 应用场景（状态栏 HUD、控制中心面板、弹窗）见姐妹文档：**《C2_前端应用-状态栏与控制中心.md》**
>
> 2026-07-14 增补导航：MVU 之外的 **SP·数据库表格变量方案**见 **《C4_数据库表格模板.md》**；在正常多楼层角色卡中制作数据库状态栏、控制中心和数据面板见 **《C7_数据库二创前端.md》**；在首楼 / 0 号消息内闭合输入、生成、剧情阅读、状态、路由与回看等完整体验见 **《C5_同层前端.md》**；数据库兼容同层的额外楼层桥只登记于 **《C8_数据库兼容同层前端-待验证.md》**，当前禁止作为成熟方案引用；把单张角色卡直接产品化为 Web / App / PC 程序见 **《C6_独立前端.md》**。C5 建立在本册的消息楼层 iframe 能力之上；C6 不以 TavernHelper 或 ST 宿主为运行前提，也不是供用户继续导入角色卡的通用客户端。

---

## 目录

1. 置信度分级体系（全手册适用）
2. 机制总览：TavernHelper 与 iframe 沙盒
   - 2.1 两种 iframe 形态
   - 2.2 跨楼层通信的三条路径
3. iframe 内可用全局变量
4. 事件系统 API
   - 4.1 函数签名总表
   - 4.2 IframeEventType 枚举（6 个）
   - 4.3 TavernEventType 关键枚举（80+ 个）
   - 4.4 自动卸载机制
5. 变量操作 API
   - 5.1 VariableOption 类型（含作用域说明）
   - 5.2 函数签名总表
   - 5.3 Prompt 宏访问变量
6. 聊天消息 API
   - 6.1 getChatMessages
   - 6.2 setChatMessages
   - 6.3 其他消息操作函数
7. 提示词注入 API（injectPrompts）
8. 工具函数 API
9. 接口共享 API（跨 iframe）
10. iframe 与 window.parent 访问模式
11. MVU 框架 API（Mvu 全局对象）
12. window.SillyTavern 核心接口
13. 完整可用范式代码
    - 13.1 范式 A：生成时注入提示词 + disposer 生命周期管理
    - 13.2 范式 B：Script 变量读写
    - 13.3 范式 C：全局接口暴露与等待（降级兼容模式）
    - 13.4 范式 D：访问宿主页面 DOM
    - 13.5 范式 E：chat 变量作为跨楼层状态总线
    - 13.6 范式 F：自定义跨楼层事件广播
    - 13.7 范式 G：iframe 渲染生命周期监听
    - 13.8 范式 H：自我重载前销毁旧实例
14. 高频避坑
15. 版本演进关键节点
16. 悬而未决：需真机验证的问题

---

## 1. 置信度分级体系（全手册适用）

> **收集日期统一声明**：本手册全部条目收集于 **2026-06-28**。

每条结论采用**置信度等级 + 依据类型**双轴标注。

### 1.1 置信度三级

| 级别 | 含义 | 施工许可 |
|---|---|---|
| **high** | 已坐实，可直接施工 | 有运行时证据（真机实测 / 读到运行时实现源码 / 生产卡验证）；结论是源码/文档的直接事实而非下游推导；不在悬案清单 |
| **medium** | 待验证，施工前须实测 | 强制二选一子标签：`medium·单源孤证`（单一来源、无第二源、无实测）/ `medium·推导未验证`（源码或逻辑推导成立但未跑通，须随附真机验证路径） |
| **low** | 孤证无源，禁止据此施工 | 零来源猜测 / 纯历史快照 |

### 1.2 依据类型标签（与置信度正交，强制标注）

`[运行时源码]`、`[真机]`、`[文档·多源]`、`[文档·单源]`、`[类型声明]`、`[CHANGELOG·单源]`、`[推断]`

### 1.3 两条铁规

1. **「从源码事实再推一步」的下游推导**，即使源码本身已直读，该推导结论最高只能 `medium·推导未验证`——除非已真机验证。
2. **节级标注 = 节内条目下确界**——禁止整节标 high 却内含悬案条目；冲突即局部降级并交叉引用悬案章。

---

## 2. 机制总览：TavernHelper 与 iframe 沙盒

### 2.1 两种 iframe 形态

**核心结论**

JS-Slash-Runner（品牌名 TavernHelper / 酒馆助手）是 SillyTavern 的扩展插件。ST 本体不直接执行任意 JS；该扩展把角色卡内的 `<script>` 代码块包裹进 `<iframe>` 沙盒执行，同时通过 postMessage shim 层把 TavernHelper API 注入为 iframe 内的全局函数。

所有 API 函数以**全局自由函数**形式注入（如 `declare function getVariables(...)`），无需 `import` 或 `TavernHelper.xxx()` 前缀直接调用。

| 维度 | 楼层消息 iframe（前端界面） | 脚本 iframe |
|---|---|---|
| 生命周期 | 随楼层渲染创建、随楼层销毁/重绘销毁（确切时机见悬案 U7） | 随角色卡或全局脚本运行，跨楼层存活 |
| iframe 名格式 | `TH-message-N` / `TH-message--{楼层号}--{index}` | `TH-script-X` / `TH-script--{name}--{id}` |
| 特有函数 | `getCurrentMessageId()` → 所在楼层号 | `getScriptId()` → 脚本库 ID |
| 变量作用域 | `type:'message'`（楼层变量）或访问 chat/global | `type:'script'`（脚本绑定变量） |
| parent 访问 | `window.parent` = ST 主窗口 | 同左 |
| 事件监听自动卸载 | 是，iframe 关闭时自动卸载（见悬案 U7 确切时机） | 是，脚本关闭时自动卸载 |

所有 iframe 的 `window.parent` 指向 SillyTavern 主窗口。不同楼层 iframe 之间无法直接访问彼此的 `window`，必须通过 parent 做中继，或通过 TavernHelper 提供的事件总线和接口分享机制通信。

来源：JS-Slash-Runner 官方文档 + `@types/iframe/event.d.ts` + `control_center.js`（window.parent 使用、iframe name 解析模式）｜置信度：high `[文档·多源]` + `[运行时源码]`

### 2.2 跨楼层通信的三条路径

**核心结论**

| 路径 | 适用场景 | 实现方式 |
|---|---|---|
| **路径 A：变量读写** | 楼层间共享状态数据（持久化） | `getVariables` + `replaceVariables`/`insertOrAssignVariables` 操作 chat/global 变量 |
| **路径 B：事件总线** | 跨楼层触发行为（通知、广播） | `eventEmit` / `eventOn` 自定义字符串事件 |
| **路径 C：接口分享** | 脚本暴露 API 给其他 iframe 调用 | `initializeGlobal` + `waitGlobalInitialized` |

三条路径可以组合使用。典型模式：路径 A 写状态 + 路径 B 通知刷新（见范式 13.5）。

来源：官方文档 + `control_center.js` + `media_library.js` 生产验证 ｜ 置信度：high `[运行时源码]`

---

## 3. iframe 内可用全局变量

**核心结论**

以下全局变量在任意 TavernHelper iframe 内均已预注入，无需 import。

| 全局变量 | 类型 / 来源 | 说明 |
|---|---|---|
| `window.SillyTavern` | ST 本体对象 | 永远指向最新 ST 上下文（TH 刷新保证）；详见第 12 章 |
| `window.TavernHelper` | TH 扩展对象 | F12 控制台 `Object.keys(window.TavernHelper)` 可查看完整接口列表 |
| `window.tavern_events` | 事件常量对象 | 约 80+ 个 Tavern 事件名称常量（见第 4.3 节） |
| `window.iframe_events` | 事件常量对象 | 6 个 iframe 生命周期事件常量（见第 4.2 节） |
| `_` | lodash | 数组/对象工具库 |
| `z` | zod（含扩展） | 数据校验库，含 `.prefault()` 等扩展方法；经 `mvu_zod_cn.js` L1-13 直调无 import 确认 |
| `$` | jQuery + jQuery UI | DOM 操作 |
| `YAML` | js-yaml | YAML 解析/序列化 |
| `toastr` | toastr.js | 浮动通知（`toastr.success/error/warning/info`）；实际显示在 ST 主界面（宿主页面库），medium·推导未验证 |
| `Vue` / `VueRouter` | Vue 3 | UI 框架 ｜ medium·单源孤证（仅官方文档，未生产验证） |
| `PIXI` | PixiJS | 2D 游戏 / Live2D 渲染 ｜ medium·单源孤证（仅官方文档，未生产验证） |
| `builtin` | TH 内置工具对象 | `builtin.renderMarkdown()`、`builtin.copyText()`、`builtin.uuidv4()`、`builtin.duringGenerating()` ｜ medium·单源孤证 |

来源：官方文档多源 + `mvu_zod_cn.js` L1-13（生产验证 z 对象直调）｜适用版本：v1.14.0 ｜ 置信度（主体）：high `[文档·多源]` + `[运行时源码]`；（PIXI / builtin / Vue）：medium·单源孤证 `[文档·单源]`

---

## 4. 事件系统 API

### 4.1 函数签名总表

**核心结论**

```typescript
// 持续监听（返回 EventOnReturn，可调用 stop() 取消）
function eventOn<T extends EventType>(event_type: T, listener: ListenerType[T]): EventOnReturn
function eventMakeFirst<T>(event_type: T, listener: ListenerType[T]): EventOnReturn  // 插队到最前
function eventMakeLast<T>(event_type: T, listener: ListenerType[T]): EventOnReturn   // 排到最后
function eventOnce<T>(event_type: T, listener: ListenerType[T]): EventOnReturn       // 仅触发一次

// 发送事件
function eventEmit<T>(event_type: T, ...data): Promise<void>       // 异步广播
function eventEmitAndWait<T>(event_type: T, ...data): void         // 同步函数内用，v3.2.5+

// 清理
function eventRemoveListener<T>(event_type: T, listener): void
function eventClearEvent(event_type): void    // 清除某事件所有监听
function eventClearListener(listener: Function): void   // 从所有事件移除某 listener
function eventClearAll(): void

type EventOnReturn = { stop(): void }
type EventType = IframeEventType | TavernEventType | string  // string = 自定义事件
```

**来源说明**：`eventOn` / `eventMakeFirst` / `eventMakeLast` 均由 **JS-Slash-Runner** 扩展注入（非 TavernHelper）。`eventMakeFirst` 调用 `eventSource.makeFirst()`，把监听器插入队列头部；`eventOn` 调用 `eventSource.on()`，尾部追加。`eventEmitAndWait` 由 CHANGELOG v3.2.5 确认（"便于在非异步函数中监听事件"）。

来源：`@types/iframe/event.d.ts`（类型声明，GitHub 直读确认）+ JS-Slash-Runner `src/function/event.ts`（运行时源码）+ `control_center.js` L333-346（生产验证 stop() 调用模式）｜置信度：high `[类型声明]` + `[运行时源码]`；（eventEmitAndWait 语义）：high·单源 `[CHANGELOG·单源]`

### 4.2 IframeEventType 枚举（6 个）

**核心结论**

```typescript
enum IframeEventType {
  MESSAGE_IFRAME_RENDER_STARTED           = 'message_iframe_render_started',
  MESSAGE_IFRAME_RENDER_ENDED             = 'message_iframe_render_ended',
  GENERATION_STARTED                      = 'js_generation_started',
  STREAM_TOKEN_RECEIVED_FULLY             = 'js_stream_token_received_fully',
  STREAM_TOKEN_RECEIVED_INCREMENTALLY     = 'js_stream_token_received_incrementally',
  GENERATION_ENDED                        = 'js_generation_ended',
}
```

**ListenerType 回调参数**：

```typescript
[iframe_events.MESSAGE_IFRAME_RENDER_STARTED]: (iframe_name: string) => void;
[iframe_events.MESSAGE_IFRAME_RENDER_ENDED]:   (iframe_name: string) => void;
[iframe_events.GENERATION_STARTED]:            (generation_id: string) => void;
[iframe_events.GENERATION_ENDED]:              (text: string, generation_id: string) => void;
[iframe_events.STREAM_TOKEN_RECEIVED_FULLY]:   (full_text: string, generation_id: string) => void;
[iframe_events.STREAM_TOKEN_RECEIVED_INCREMENTALLY]: (incremental_text: string, generation_id: string) => void;
```

来源：`@types/iframe/event.d.ts`（GitHub 直读，6 个枚举字符串值全部确认）｜置信度：high `[类型声明]`；（触发范围见悬案 U8）

### 4.3 TavernEventType 关键枚举（80+ 个）

**核心结论（关键字段）**

| 枚举字段 | 字符串值 | 回调参数 | 典型用途 |
|---|---|---|---|
| `APP_READY` | `'app_ready'` | — | ST 完成初始化 |
| `MESSAGE_RECEIVED` | `'message_received'` | `(message_id, type)` | AI 消息到达 |
| `MESSAGE_SENT` | `'message_sent'` | `(message_id)` | 用户消息发送 |
| `MESSAGE_UPDATED` | `'message_updated'` | `(message_id)` | 消息被修改 |
| `MESSAGE_EDITED` | `'message_edited'` | — | 消息被编辑 |
| `MESSAGE_DELETED` | `'message_deleted'` | — | 消息被删除 |
| `MESSAGE_SWIPED` | `'message_swiped'` | — | 消息 swipe |
| `USER_MESSAGE_RENDERED` | `'user_message_rendered'` | — | 用户消息渲染完成 |
| `CHARACTER_MESSAGE_RENDERED` | `'character_message_rendered'` | — | 角色消息渲染完成 |
| `CHAT_CHANGED` | `'chat_id_changed'` | `(chat_file_name)` | 切换对话 |
| `GENERATION_STARTED` | `'generation_started'` | `(type, option, dry_run)` | 生成开始 |
| `GENERATION_ENDED` | `'generation_ended'` | — | 生成完成 |
| `GENERATION_STOPPED` | `'generation_stopped'` | — | 生成被停止 |
| `GENERATION_AFTER_COMMANDS` | `'GENERATION_AFTER_COMMANDS'`（全大写） | — | 斜杠命令处理完、即将生成（注入时机 1） |
| `GENERATE_BEFORE_COMBINE_PROMPTS` | `'generate_before_combine_prompts'` | — | prompts 合并前（注入时机 2） |
| `GENERATE_AFTER_COMBINE_PROMPTS` | `'generate_after_combine_prompts'` | — | prompts 合并后 |
| `CHAT_COMPLETION_PROMPT_READY` | `'chat_completion_prompt_ready'` | — | ChatCompletion prompt 就绪（注入时机 3） |
| `WORLD_INFO_ACTIVATED` | `'world_info_activated'` | — | 世界书条目激活 |
| `WORLDINFO_ENTRIES_LOADED` | `'worldinfo_entries_loaded'` | — | 世界书扫描完、激活前（可修改条目，见悬案 U4） |
| `WORLDINFO_UPDATED` | `'worldinfo_updated'` | — | 世界书更新 |
| `CHARACTER_EDITED` | `'character_edited'` | — | 角色卡被编辑 |
| `SETTINGS_LOADED` | `'settings_loaded'` | — | ST 设置加载完成 |

**注意**：`WORLDINFO_SCAN_DONE` **不在 ST v1.14.0 核心**，由 JS-Slash-Runner 扩展额外注入到 `tavern_events`。`APP_INITIALIZED` 亦**不存在于 ST v1.14.0 核心**。

**注入提示词最佳时机顺序（high）**：`GENERATION_AFTER_COMMANDS` → `GENERATE_BEFORE_COMBINE_PROMPTS` → `CHAT_COMPLETION_PROMPT_READY`，优先用 `eventMakeFirst` 确保在其他监听器前运行。

**避坑**：优先用 `window.tavern_events.XXX` 枚举字段而非硬编码字符串——ST 版本升级可能修改字符串值（`'GENERATION_AFTER_COMMANDS'` 是全大写例外）。

来源：`@types/iframe/event.d.ts`（类型声明）+ ST 本体 `public/scripts/events.js` L1-95（运行时源码交叉验证枚举字段字符串值）+ `control_center.js` L333-341（生产验证用法）｜置信度（枚举字段+字符串值）：high `[运行时源码]`；（回调参数格式）：medium·单源孤证 `[类型声明]`

### 4.4 自动卸载机制

**核心结论**

`eventOn` 系列注册的监听器在 **iframe 或脚本关闭时自动卸载**。如需提前取消，使用返回值的 `stop()` 方法。

**生产模式（来自 `control_center.js` L333-346，最高可信）**：统一将所有 `eventOn` 返回值压入 `disposers` 数组，组件销毁时批量调用。兼容旧版（返回 void）的写法：`disposers.pop()?.()` 用可选链防止 void 报错。

⚠️ **降级说明**："自动卸载"论断仅官方文档，未真机实测。持久运行的脚本 iframe 不手动 stop 会累积泄漏，务必使用 disposers 模式（见范式 13.1）。

来源：官方文档（自动卸载行为）+ `control_center.js` L333-346（stop() 调用模式，生产验证）+ CHANGELOG v3.4.13（"eventOn 等监听函数返回 stop 函数"，函数返回值 confirmed）｜置信度（stop() 返回值模式）：high `[运行时源码]`；（自动卸载行为）：medium·单源孤证 `[文档·单源]`

---

## 5. 变量操作 API

### 5.1 VariableOption 类型（含作用域说明）

**核心结论**

```typescript
type VariableOption = {
  type: 'chat' | 'global' | 'message' | 'script' | 'preset' | 'extension';
  message_id?: number | 'latest';   // type='message' 时必填；支持负数（-1=最新）
  script_id?: string;               // type='script' 时必填（v4.6+ 脚本内部可省略）
}
```

| type | 数据位置 | 跨楼层可见 | 注意 |
|---|---|---|---|
| `'chat'` | 当前聊天文件全局变量 | 是 | **最常用的跨楼层同步载体** |
| `'global'` | 全局（跨角色卡）变量 | 是 | 跨对话持久化 |
| `'message'` | 单条楼层消息附带变量 | 需指定 message_id | 负数索引支持 |
| `'script'` | 绑定到特定脚本的变量 | 需知 script_id | v4.6+ 脚本内可省略 script_id（见悬案 U9） |
| `'preset'` | 预设变量 | — | v4.6 新增，medium·推导未验证 |
| `'extension'` | 第三方插件变量 | — | v4.6 新增，medium·推导未验证 |

来源：官方文档 + `@types/iframe/variable.d.ts` ｜ 置信度：high `[文档·多源]`

### 5.2 函数签名总表

**核心结论**

```typescript
// 读取
function getVariables(option: VariableOption): Record<string, any>
function getAllVariables(): Record<string, any>
// getAllVariables 合并顺序（消息楼层 iframe）：全局 → 角色卡 → 聊天 → 0 号楼 → 当前楼层
// 同名键覆盖优先级见悬案 U6

// 写入（完整替换）— 同步，无需 await（CHANGELOG v3.3.0 确认）
function replaceVariables(variables: Record<string, any>, option: VariableOption): Record<string, any>

// 写入（函数式更新，支持 async，推荐用于避免竞态）
function updateVariablesWith(
  updater: (vars: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>,
  option: VariableOption
): void

// 写入（插入/覆盖：存在则覆盖，不存在则插入，不影响其他键）— 推荐替代 replaceVariables
function insertOrAssignVariables(variables: Record<string, any>, option: VariableOption): Record<string, any>

// 写入（仅插入：不覆盖已有键）
function insertVariables(variables: Record<string, any>, option: VariableOption): Record<string, any>

// 删除（支持 dot-notation 路径，如 "角色.属性.值"）
function deleteVariable(
  variable_path: string,
  option: VariableOption
): { variables: Record<string, any>; delete_occurred: boolean }
```

⚠️ **置信度分层**：`getVariables` / `replaceVariables` 经 `media_library.js` L64-87 生产验证：high `[运行时源码]`。`updateVariablesWith` / `insertOrAssignVariables` / `insertVariables` / `deleteVariable` 函数名来自类型声明，未生产验证：medium·单源孤证 `[类型声明]`。`getAllVariables` 合并顺序/优先级：medium·推导未验证（见悬案 U6）。`replaceVariables` 同步化经 CHANGELOG v3.3.0 确认：high。

### 5.3 Prompt 宏访问变量

**核心结论**

在世界书条目或 prompt 模板中，可直接用宏语法读取变量值：

```
{{get_chat_variable::path.to.var}}       ← JSON 格式
{{format_chat_variable::path.to.var}}    ← YAML 格式（AI 更易读）
{{get_global_variable::path.to.var}}
{{format_global_variable::path.to.var}}
```

**注意**：键名以 `$` 开头的变量自动对 AI 不可见（隐藏元数据），medium·单源孤证，施工前真机确认。

来源：官方文档单源 ｜ 置信度：medium·单源孤证 `[文档·单源]`

---

## 6. 聊天消息 API

### 6.1 getChatMessages

**核心结论**

```typescript
function getChatMessages(
  range: string | number,
  option?: GetChatMessagesOption
): ChatMessage[] | ChatMessageSwiped[]

type GetChatMessagesOption = {
  role?:           'all' | 'system' | 'assistant' | 'user';  // 默认 'all'
  hide_state?:     'all' | 'hidden' | 'unhidden';            // 默认 'all'
  include_swipes?: boolean;                                   // 默认 false
}
```

**range 语法**：

| 示例 | 含义 |
|---|---|
| `10` | 单楼层 message_id=10 |
| `"10-20"` | 楼层 10 到 20 |
| `"0-"` | 全部楼层 |
| `-1` | 最新楼层 |

来源：官方文档 + `@types/iframe/chat_message.d.ts` ｜ 置信度：medium·单源孤证 `[文档·单源]` + `[类型声明]`（两者同项目，非独立源；无生产卡使用记录）

### 6.2 setChatMessages

**核心结论**

```typescript
function setChatMessages(
  chat_messages: Array<{ message_id: number } & Partial<ChatMessage | ChatMessageSwiped>>,
  option?: SetChatMessagesOption
): Promise<void>

type SetChatMessagesOption = {
  refresh?: 'none' | 'affected' | 'all';
  // 'affected'（默认）：仅刷新受影响楼层（触发 MESSAGE_IFRAME_RENDER_ENDED）
  // 'all'：重载整个聊天（触发 CHAT_CHANGED，慎用）
  // 'none'：不刷新（适合批量写后手动 refreshOneMessage）
}
```

来源：官方文档 + `@types/iframe/chat_message.d.ts` ｜ 置信度：medium·单源孤证 `[文档·单源]` + `[类型声明]`

### 6.3 其他消息操作函数

**核心结论**

```typescript
function createChatMessages(messages: ..., option?): Promise<void>     // 批量插入新消息
function deleteChatMessages(message_ids: number[]): Promise<void>      // 批量删除
function rotateChatMessages(begin, middle, end): Promise<void>         // 重排消息段顺序
function refreshOneMessage(message_id: number): Promise<void>          // 刷新单条消息渲染
```

来源：官方文档单源 ｜ 置信度：medium·单源孤证 `[文档·单源]`

---

## 7. 提示词注入 API（injectPrompts）

**核心结论**

两函数均由 **JS-Slash-Runner** 扩展注入到 `window`（非 TavernHelper，非 ST 内建）。回源 JS-Slash-Runner `src/function/inject.ts` 确认签名：

```typescript
function injectPrompts(
  prompts: Array<{
    id: string;                                              // 唯一 ID，用于后续 uninject
    position: 'in_chat' | 'none';                          // ⚠️ 只有这两个值
    depth: number;                                          // 0 = 最近楼层；数字越大越靠前
    role: 'system' | 'user' | 'assistant';
    content: string;
    should_scan?: boolean;                                  // 是否被世界书扫描；默认 false
    filter?: (() => boolean) | (() => Promise<boolean>);   // 可选：激活过滤器
  }>,
  opts?: { once?: boolean }                                 // once:true = 单次注入，触发后自动清除
): { uninject: () => void }                                 // ⚠️ 返回含 uninject 的对象

function uninjectPrompts(ids: string[]): void
```

**核心避坑**：同一 `id` 重复调用 `injectPrompts` **不会自动覆盖**旧注入，必须先调 `uninjectPrompts([...ids])` 再重新注入。

**生产模式（`control_center.js` L218-229，最高可信）**：

```javascript
if (typeof uninjectPrompts === 'function') uninjectPrompts(injectionIds);
const prompts = [];
// ... 根据当前状态构建 prompts 数组 ...
if (prompts.length && typeof injectPrompts === 'function') {
  injectPrompts(prompts, { once: true });
}
```

⚠️ **降级说明**：`{ once: true }` 自动清除触发点是 `GENERATION_ENDED` / `GENERATION_STOPPED` 事件（非生成前）。`position: 'none'` 激活世界书的实际效果未真机验证（见悬案 U2）。

来源：JS-Slash-Runner `src/function/inject.ts`（运行时源码）+ `control_center.js` L218-229（生产验证调用模式）｜置信度（函数存在 + 调用模式）：high `[运行时源码]`；（once 语义细节 / none position 效果）：medium·推导未验证

---

## 8. 工具函数 API

**核心结论**

```typescript
function getCurrentMessageId(): number      // 当前楼层 ID（仅楼层消息 iframe 有效）
function getScriptId(): string              // 当前脚本库 ID（仅脚本 iframe；见悬案 U5）
function getLastMessageId(): number         // 最新楼层 ID（通用）
function getIframeName(): string            // iframe 名称（TH-message-N 或 TH-script-X）
function getMessageId(iframe_name: string): number   // 从 iframe 名称解析楼层号
function substitudeMacros(text: string): string      // 替换 ST 宏（{{char}} {{user}} 等）
function reloadIframe(): void               // 重载当前 iframe（注意：调用后 initializeGlobal 失效，见悬案 U10）
function errorCatched<T, U>(fn): (...args) => U      // 包裹函数，捕获异常并自动显示 toastr 通知
```

来源：`@types/iframe/util.d.ts`（GitHub raw 已确认 reloadIframe/getIframeName/getCurrentMessageId/getScriptId 四个函数存在）+ 官方文档 ｜ 置信度：medium·单源孤证 `[类型声明]`（类型声明非运行时源码；仅 getLastMessageId / getMessageId / substitudeMacros / errorCatched 无生产卡验证）

---

## 9. 接口共享 API（跨 iframe）

**核心结论**

```typescript
function initializeGlobal(global: string, value: any): void     // v3.6.2+；v4.0.12+ 脚本重启后持久有效
function waitGlobalInitialized<T>(global: string): Promise<T>   // 等待某全局接口初始化完毕
```

**两者并存原因**：`initializeGlobal` 跨脚本重启持久化但有异步延迟；`window[name]` 即时可用但不持久。同时写两个覆盖所有情况（见范式 13.3）。

⚠️ **降级说明**：v4.0.12 CHANGELOG"脚本重启后持久有效"仅单源，"调用 reloadIframe() 后失效"范围未确认（见悬案 U10）。

来源：`@types/iframe/util.d.ts` + `media_library.js` L29-35 + `mvu_zod_cn.js` L27-34（生产验证）｜置信度：high `[运行时源码]`；（持久化/失效细节）：medium·单源孤证 `[CHANGELOG·单源]`

---

## 10. iframe 与 window.parent 访问模式

**核心结论**

楼层 iframe 内可用 `window.parent` 访问 ST 宿主页面（ST 内置消息渲染通常同源），但跨域场景会抛 SecurityError，必须防御性处理。

**生产模式（`control_center.js` L49-54、L67-71、L139、L164-168，最高可信）**：

```javascript
// 双窗口穿透工具函数（必须保留 try/catch）
function hostWindow() {
  try {
    if (window.parent && window.parent !== window && window.parent.document) return window.parent;
  } catch (_) {}
  return window;
}
function hostDocument() {
  try { return hostWindow().document || document; } catch (_) { return document; }
}

// 将 UI 组件挂载到 ST 的 #extensionsMenu（wand 菜单按钮区）
const doc  = hostDocument();
const host = doc.querySelector('#extensionsMenu') || doc.body;
host.appendChild(myButtonElement);

// 跨 iframe 共享接口（同时写到自身 window 和 parent）
window.CrossedZoneHudSettings = hudSettingsApi;
try {
  if (window.parent && window.parent !== window)
    window.parent.CrossedZoneHudSettings = hudSettingsApi;
} catch (_) {}

// 跨 iframe 发送自定义事件到宿主页面
window.parent.dispatchEvent(new CustomEvent('my-event', { detail: { foo: 'bar' } }));
```

来源：`control_center.js` L49-54、L67-71、L139、L164-168（星月 2.5.0 / 2.9.9 生产验证）｜置信度：high `[运行时源码]`

---

## 11. MVU 框架 API（Mvu 全局对象）

**核心结论**

`Mvu` 是第三方 MVU 引擎（MagVarUpdate）通过 `initializeGlobal('Mvu', Mvu)` 注入的全局对象，不是 TH 内置。角色卡需安装对应世界书脚本才可用；使用前必须 `await waitGlobalInitialized('Mvu')`（或降级轮询，见范式 13.3）。

```typescript
declare const Mvu: {
  // 数据读写
  getMvuData(options: VariableOption): MvuData
  replaceMvuData(mvu_data: MvuData, options: VariableOption): Promise<void>
  parseMessage(message: string, old_data: MvuData): Promise<MvuData>
  isDuringExtraAnalysis(): boolean

  // MVU 专属事件常量（用于 eventOn 订阅）
  events: {
    VARIABLE_INITIALIZED:    'mag_variable_initiailized'   // ⚠️ 源码拼写 bug：initiailized（双 i）
    VARIABLE_UPDATE_STARTED: 'mag_variable_update_started'
    COMMAND_PARSED:          'mag_command_parsed'
    VARIABLE_UPDATE_ENDED:   'mag_variable_update_ended'
    BEFORE_MESSAGE_UPDATE:   'mag_before_message_update'
  }
}

type MvuData = {
  initialized_lorebooks: Record<string, any[]>;
  stat_data:             Record<string, any>;
  [key: string]:         any;
}
```

**MVU 监听器回调参数**：

| 事件 | 回调参数 | 说明 |
|---|---|---|
| `VARIABLE_INITIALIZED` | `(variables, swipe_id)` | 变量初始化完毕（**刷新 HUD 挂点之一**） |
| `VARIABLE_UPDATE_ENDED` | `(variables, variables_before_update)` | 变量更新完成（**刷新 HUD 主挂点**） |
| `COMMAND_PARSED` | `(variables, commands, message_content)` | 可在此修改解析出的命令 |

**重大避坑**：`VARIABLE_INITIALIZED` 的字符串值是 `'mag_variable_initiailized'`（`initiailized` 含双 i）。这是 MVU 库的已知 bug。**必须用 `Mvu.events.VARIABLE_INITIALIZED` 枚举字段，禁止手写字符串。**

⚠️ **置信度分层**：events 枚举字段+拼写 bug：high（类型声明 GitHub 直读 + 交错宙域生产卡多处 `Mvu.events.VARIABLE_INITIALIZED` 实际调用）。`getMvuData` / `replaceMvuData` / `parseMessage` 签名：medium·单源孤证 `[类型声明]`（星月 2.9.9 生产验证了实际调用但无官方文档）。`VARIABLE_UPDATE_STARTED` / `COMMAND_PARSED` / `BEFORE_MESSAGE_UPDATE`：medium·单源孤证（类型声明确认字符串，生产卡未实际监听）。

来源：`@types/iframe/exported.mvu.d.ts`（类型声明，GitHub 直读）+ 交错宙域 v2.6.0 `control_center.js` L1780 / `status_bar_regex*.html` 多处（生产卡实际使用 Mvu.events 枚举）+ 星月 2.9.9 `control_center.js` 第 824-963 行（三段式写入）｜置信度（events 枚举字段+拼写 bug）：high `[类型声明]` + `[运行时源码]`

---

## 12. window.SillyTavern 核心接口

**核心结论**

`window.SillyTavern` 是 ST 本体暴露的对象，TH 保证 iframe 内始终指向最新上下文。ST 通过 `getContext()` 暴露以下接口（已回源 `public/scripts/st-context.js` L37-238 确认存在）：

| 分类 | 方法 / 属性 | 说明 |
|---|---|---|
| 事件（原生） | `eventSource.on(type, fn)` / `.emit(type)` / `.once(type, fn)` | ST 原生事件发射器（优先用 TH 封装的 eventOn） |
| 事件常量 | `eventTypes` | ST 原生事件名枚举（与 `window.tavern_events` 对应） |
| 聊天数据 | `chat[]`、`chatMetadata` | 原始聊天数组与元数据 |
| 角色数据 | `characters[]`、`name1`、`name2`、`characterId` | 当前上下文 |
| Prompt 注入 | `setExtensionPrompt(id, text, position, depth, ...)` | 原生提示词注入 |
| 宏替换 | `substituteParams(text)` | 替换 `{{char}}`、`{{user}}` 等宏 |
| 世界书 | `loadWorldInfo(name)` / `saveWorldInfo(name, data)` | 世界书读写 |
| 工具调用 | `registerFunctionTool(name, desc, schema, fn)` | 注册 AI 工具 |
| 生成控制 | `sendGenerationRequest()` / `stopGeneration()` | 触发/停止生成 |
| UI | `Popup`、`callGenericPopup()`、`showLoader()` | 弹窗与加载指示器 |

**避坑**：`window.SillyTavern` 的完整接口列表在 d.ts 里极简，无具体方法列表。卡内 JS 通常无法 `import` 这些 API，走 2.3 节 Tavern Helper 路径。真机实测建议 F12 控制台 `Object.keys(window.SillyTavern)` 查看当前可用方法（见悬案 U1）。

来源：ST 本体 `public/scripts/st-context.js` L37-238（运行时源码直读）｜置信度（接口在 ST 本体存在）：high `[运行时源码]`；（iframe 内通过 window.SillyTavern 可访问性）：medium·推导未验证 `[推断]`（见悬案 U1）

---

## 13. 完整可用范式代码

> 以下均来自本地生产卡，经星月 2.5.0 / 2.9.9 / 交错宙域 2.6.0 验证，置信度：high `[运行时源码]`

### 13.1 范式 A：生成时注入提示词 + disposer 生命周期管理

**来源：`control_center.js` L333-341（最高可信）**

```javascript
const disposers = [];

function bindEvents() {
  // 跨窗口发现 eventOn（先查 window，再查 parent）
  const eventOnHost = window.eventOn || hostWindow().eventOn;
  const onFirst = typeof eventMakeFirst === 'function'
    ? eventMakeFirst
    : (typeof eventOnHost === 'function' ? eventOnHost : null);
  const events = window.tavern_events || hostWindow().tavern_events || {};

  if (!onFirst || !eventOnHost) return;

  // 注入时机三选一（均订阅，确保不同 API 兼容性）
  [events.GENERATION_AFTER_COMMANDS, events.GENERATE_BEFORE_COMBINE_PROMPTS, events.CHAT_COMPLETION_PROMPT_READY]
    .filter(Boolean).forEach(name => {
      try {
        const d = onFirst(name, () => injectGenerationPrompts());
        if (d?.stop) disposers.push(() => d.stop());
      } catch (_) {}
    });

  // 切换对话时重建魔杖入口（延时 250ms 等 ST 完成 UI 重建）
  try {
    const d = eventOnHost(events.CHAT_CHANGED, () => setTimeout(ensureWandEntry, 250));
    if (d?.stop) disposers.push(() => d.stop());
  } catch (_) {}
}

function destroy() {
  while (disposers.length) {
    try { disposers.pop()?.(); } catch (_) {}
  }
}
```

### 13.2 范式 B：Script 变量读写

**来源：`media_library.js` L64-87（生产验证）**

```javascript
const SCRIPT_ID = 'crossed-zone-media-library';  // 硬编码，确保脚本重载后路径不变

function scriptVariableOption() {
  return { type: 'script', script_id: SCRIPT_ID };
}

// 读取
function readRawLibrary() {
  if (typeof getVariables !== 'function') return defaultLibrary();
  try {
    return getVariables(scriptVariableOption()) || {};
  } catch (e) {
    return defaultLibrary();
  }
}

// 写入（同步调用，无需 await）
function writeRawLibrary(value) {
  if (typeof replaceVariables !== 'function') throw new Error('酒馆助手变量接口不可用');
  replaceVariables(value, scriptVariableOption());
}
```

### 13.3 范式 C：全局接口暴露与等待（降级兼容模式）

**来源：`media_library.js` L29-36 + `mvu_zod_cn.js` L27-34（多文件验证）**

```javascript
// 暴露（优先 initializeGlobal 持久化，同时 window[name] 即时可用）
function exposeGlobal(name, api) {
  try {
    if (typeof initializeGlobal === 'function') initializeGlobal(name, api);
    window[name] = api;   // 两个都做，覆盖所有情况
  } catch (_) { window[name] = api; }
}

// 等待（优先 waitGlobalInitialized，fallback 轮询 8 秒）
const waitForApiReady = async (name) => {
  if (typeof waitGlobalInitialized === 'function') return waitGlobalInitialized(name);
  const started = Date.now();
  while (!window[name] && Date.now() - started < 8000)
    await new Promise(r => setTimeout(r, 50));
  return window[name];
};

// 用法：等待 Mvu 就绪（必须 await 后才能调用 Mvu.events 等）
await waitForApiReady('Mvu');
```

### 13.4 范式 D：访问宿主页面 DOM

**来源：`control_center.js` L67-71（生产验证）**

```javascript
function hostDocument() {
  try { return window.parent?.document || document; } catch (_) { return document; }
}

// 将 UI 挂载到 ST 的 #extensionsMenu（wand 菜单按钮区）
const doc  = hostDocument();
const host = doc.querySelector('#extensionsMenu') || doc.querySelector('.extensionsMenu') || doc.body;
host.appendChild(myButtonElement);

// 跨 iframe 广播自定义事件
try {
  window.parent.dispatchEvent(new CustomEvent('my-event', { detail: { foo: 'bar' } }));
} catch (_) {}
```

### 13.5 范式 E：chat 变量作为跨楼层状态总线

```javascript
// 楼层 A：写入共享状态（推荐 insertOrAssignVariables 避免覆盖其他键）
insertOrAssignVariables(
  { sharedState: { phase: 3, timestamp: Date.now() } },
  { type: 'chat' }
);

// 楼层 B：读取共享状态（同一聊天内所有楼层可访问）
const vars = getVariables({ type: 'chat' });
const phase = vars?.sharedState?.phase;

// 联动：写完变量 + 发事件通知其他楼层刷新
await replaceVariables(newVars, { type: 'chat' });
await eventEmit('状态已更新');
```

### 13.6 范式 F：自定义跨楼层事件广播

```javascript
// 发布方（任意楼层 iframe 或脚本）
await eventEmit('角色阶段更新完成', { phase: 3 });

// 订阅方（另一楼层 iframe 或脚本）
const handle = eventOn('角色阶段更新完成', (data) => {
  console.log('收到:', data.phase);
});

// 明确清理
handle.stop();

// 在非 async 函数内强制等待（v3.2.5+）
function syncHandler() {
  eventEmitAndWait('存档完成');
}
```

### 13.7 范式 G：iframe 渲染生命周期监听

**置信度：medium·推导未验证**（类型定义确认事件枚举存在；脚本 iframe 能否跨楼层监听属推断，见悬案 U8）

```javascript
// 监听某楼层 iframe 渲染完成
// iframe_name 格式："TH-message--{楼层号}--{index}"
eventOn(iframe_events.MESSAGE_IFRAME_RENDER_ENDED, (iframe_name) => {
  const match = iframe_name.match(/TH-message--(\d+)--\d+/);
  const floor = match ? parseInt(match[1]) : null;
  console.log(`楼层 ${floor} 渲染完成`);
});
```

### 13.8 范式 H：自我重载前销毁旧实例

**来源：`control_center.js` L53 + `media_library.js` L15-17（生产验证）**

```javascript
// 脚本顶部：防止多次注入造成事件监听器叠加
if (window.CrossedZoneControlCenter?.destroy) {
  try { window.CrossedZoneControlCenter.destroy(); } catch (_) {}
}
// 或
if (window.CrossedZoneMediaLibrary?.destroy) {
  try { window.CrossedZoneMediaLibrary.destroy(); } catch (_) {}
}
```

---

## 14. 高频避坑

1. **API 可用性防御检查（必做）**：TH 未安装或版本不兼容时，API 为 `undefined`。正式代码必须 `typeof getVariables === 'function'` 前置判断，见范式 13.2。high `[运行时源码]`

2. **injectPrompts 不自动去重**：同一 `id` 重复注入会累加，每次生成前必须先 `uninjectPrompts([...ids])` 再重新注入。high `[运行时源码]`

3. **window.parent 跨域陷阱**：ST 某些渲染模式下访问 `window.parent` 会抛 SecurityError。必须 `try/catch` 包裹；参考 `control_center.js` L67-71 生产级防御写法。high `[运行时源码]`

4. **eventOn 返回值版本差异**：旧版返回 `void`，新版（v3.4.13+）返回 `{ stop() }` 对象。通用写法：`disposers.pop()?.()` 用可选链同时兼容两种返回类型。high `[运行时源码]`

5. **tavern_events 枚举字段优先于字符串直接量**：用 `window.tavern_events.MESSAGE_RECEIVED` 而非硬编码 `'message_received'`。`GENERATION_AFTER_COMMANDS` 是全大写例外。high `[运行时源码]`

6. **MVU 事件名拼写错误（源码 bug）**：`VARIABLE_INITIALIZED` 的字符串值含双 i（`initiailized`）。**必须用 `Mvu.events.VARIABLE_INITIALIZED` 枚举字段。** high `[类型声明]` + `[运行时源码]`

7. **replaceVariables 是同步函数（且是全量替换）**：旧版文档示例可能含 `await replaceVariables(...)`，现版本已确认为同步调用。**全量替换会覆盖整个变量表**；推荐用 `insertOrAssignVariables` 做局部更新。high

8. **eventEmitAndWait 用于非 async 函数**：不能 `await` 时用 `eventEmitAndWait`；async 函数内用 `await eventEmit`。high·单源 `[CHANGELOG·单源]`

9. **script_id 硬编码优于 getScriptId()**：`getScriptId()` 依赖运行上下文，脚本重载后 ID 可能变化。推荐硬编码固定字符串（须全局唯一）。high `[运行时源码]`

10. **自我重载前必须 destroy 旧实例**：ST 在某些情况下会重新执行脚本而不销毁旧实例，导致 eventOn 监听器叠加。初始化时检测旧实例并 destroy（见范式 13.8）。high `[运行时源码]`

11. **CHAT_CHANGED 事件防抖**：生产卡保留 `setTimeout(ensureWandEntry, 250)` 防抖，等待 ST 完成 UI 重建后再操作 DOM。medium·单源孤证（CHANGELOG v4.5.4 修复了额外触发 bug，但防抖做法仍推荐）

12. **$ 开头变量键对 AI 不可见**：键名以 `$` 开头的变量自动对 AI 不可见（隐藏元数据）。medium·单源孤证 `[文档·单源]`，施工前真机确认。

13. **setChatMessages 多 swipe 层修复**：旧版有 bug（多 swipe 数组处理不正确），依赖 swipe 数据时确认 TH 版本。medium·单源孤证

---

## 15. 版本演进关键节点

| 版本 | 关键变更 |
|---|---|
| v3.0.2 | `getVariables` 支持角色卡绑定变量和楼层变量（负数索引） |
| v3.1.1 | `setChatMessages` 更灵活的消息操作 |
| v3.2.5 | `eventEmitAndWait`（同步函数内可用）；脚本按钮 getVariables 支持 |
| v3.3.0 | `replaceVariables` 改为同步调用 |
| v3.4.13 | `eventOn` 等监听函数返回 `stop()` 函数，便于取消监听 |
| v3.6.2 | `waitGlobalInitialized` + `initializeGlobal` 新增 |
| v4.0.0 | Vue+Pinia 架构重写；预设支持脚本绑定；`eventOn` 参数变化 |
| v4.0.12 | 共享接口脚本重启后持久有效；`injectPrompts` 返回 `uninject` 对象 |
| v4.4.0 | `setChatMessages` 新增 `refresh: 'affected'`；新增 `refreshOneMessage` |
| v4.5.4 | 修复 CHAT_CHANGED 在切换角色卡时额外触发的 bug |
| v4.6.0 | `getVariables`/`replaceVariables` 新增 `'preset'`/`'extension'` 类型；脚本内调用 script 变量时 script_id 可省略 |

来源：CHANGELOG.md（各版本 GitHub 直读）｜置信度：high·单源 `[CHANGELOG·单源]`

---

## 16. 悬而未决：需真机验证的问题

以下问题已经研究但无法从现有证据坐实，施工前须真机验证。

| 编号 | 问题 | 不确定原因 | 真机验证路径 |
|---|---|---|---|
| U1 | `window.SillyTavern` 与 `window.TavernHelper` 的完整方法边界 | d.ts 声明极简，无具体方法列表 | F12 控制台：`JSON.stringify(Object.keys(window.TavernHelper), null, 2)` 和 `Object.keys(window.SillyTavern)` |
| U2 | `injectPrompts` 的 `position: 'none'` 实际激活世界书的效果 | ST 内部 `setExtensionPrompt` 传 `-1` 时的行为未真机验证 | 在 ST 浏览器控制台执行 `typeof injectPrompts, injectPrompts.toString()` |
| U3 | `VariableOption.type = 'preset' / 'extension'` 的读写行为 | CHANGELOG 提及支持但无完整文档 | 真机 `getVariables({type:'preset'})` 执行，观察返回值结构 |
| U4 | `WORLDINFO_ENTRIES_LOADED` 监听器的参数结构与修改 API | CHANGELOG 说"可调整条目"，但未说明回调参数格式和可写字段 | 真机断点：`eventOn(tavern_events.WORLDINFO_ENTRIES_LOADED, (data) => { console.log(data) })` |
| U5 | `getScriptId()` 在楼层消息 iframe 内的行为 | 文档仅说"脚本库 ID"，楼层 iframe 无 script 概念 | 楼层 iframe 内调用 `getScriptId()`，观察返回 undefined / 报错 / 空字符串 |
| U6 | `getAllVariables()` 同名键合并时的覆盖优先级 | 文档说合并顺序但未说明后者覆盖前者还是反之 | 构造测试：在全局层和聊天层设同名键不同值，`getAllVariables()` 观察哪个值胜出 |
| U7 | 楼层 iframe 销毁的确切时机 | 上下翻页 / swipe 换层 / 发新消息是否各自销毁 iframe | 在楼层 iframe 内 `console.log('mount')` + 监听 `window.beforeunload`，滚动/swipe/发消息后观察 console |
| U8 | `MESSAGE_IFRAME_RENDER_STARTED/ENDED` 的触发 iframe 范围 | 不清楚是父窗口发出（脚本 iframe 可收到所有楼层），还是仅楼层 iframe 自身触发 | 在全局脚本 iframe 内 `eventOn(iframe_events.MESSAGE_IFRAME_RENDER_ENDED, ...)` 然后让 ST 渲染新消息，看是否有输出 |
| U9 | `script_id` 省略的完整条件（v4.6+） | CHANGELOG 提到"脚本内可省略"，但前端界面 iframe 内能否也省略、省略后默认用什么 ID 未说明 | 在脚本楼层调用 `getVariables({ type: 'script' })` 不传 script_id，观察是否报错及返回值 |
| U10 | `initializeGlobal` 持久化的边界（v4.0.12+） | CHANGELOG 称脚本重启后有效，但 ST 完全重启 / 切换角色卡 / reloadIframe() 后是否仍有效，失效范围不清 | 调用 `initializeGlobal('TestApi', {})` 后分别执行页面刷新、脚本重启、切换角色卡，在另一脚本 `waitGlobalInitialized('TestApi')` 观察是否超时 |

---

## 主要来源

- [N0VI028/JS-Slash-Runner GitHub](https://github.com/N0VI028/JS-Slash-Runner)
- [@types/iframe/event.d.ts](https://github.com/N0VI028/JS-Slash-Runner/blob/main/@types/iframe/event.d.ts)
- [@types/iframe/exported.mvu.d.ts](https://github.com/N0VI028/JS-Slash-Runner/blob/main/@types/iframe/exported.mvu.d.ts)
- [酒馆助手官方文档](https://n0vi028.github.io/JS-Slash-Runner-Doc/)
- [CHANGELOG.md](https://github.com/N0VI028/JS-Slash-Runner/blob/main/CHANGELOG.md)
- 本地验证源：`C:/Users/Administrator/OneDrive/ST-/角色卡工作区/星月/星月 2.5.0/components/control_center.js`
- 本地验证源：`C:/Users/Administrator/OneDrive/ST-/角色卡工作区/星月/星月 2.5.0/components/media_library.js`
- 本地验证源：`C:/Users/Administrator/OneDrive/ST-/角色卡工作区/星月/星月 2.5.0/components/mvu_zod_cn.js`
- 本地验证源：`ST开发指南DB/本地证据/星月历史/2.9.9/components/control_center.js`
- 回源：ST 本体 `public/scripts/events.js` L1-95（v1.14.0 运行时源码，交叉验证 TavernEventType 枚举字段）
- 回源：ST 本体 `public/scripts/st-context.js` L37-238（运行时源码，确认 SillyTavern context 对象接口）
- 回源：ST 本体 `public/scripts/chats.js`（DOMPurify 钩子，custom- 前缀机制）
- 回源：`C:/Users/Administrator/OneDrive/ST-/角色卡工作区/交错宙域/v2.6.0_20260611_000000/components/`（验证 Mvu.events 用法）
