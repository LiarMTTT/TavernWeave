# ST 扩展开发完整指南

> 文档版本：v1.1.0 ｜ 最后更新：2026-07-14

> **定位**：SillyTavern UI Extension 与 Server Plugin 的开发参考，覆盖 manifest 结构、入口范式、事件系统、持久化、slash command、生成拦截、生命周期钩子、发布流程及打包方案。
>
> **职责边界**：本册是“酒馆插件/宿主扩展”唯一主册。角色卡内 Tavern Helper `ScriptTree[]`、魔棒按钮和创意工坊世界书事务见 **《E5_创意工坊与扩展生态.md》**；角色卡不得把“需要插件”写成静默自动安装授权。

---

## 置信度分级体系

三级体系：**high**（多源互证，可直接施工）／**medium**（单源或推断，施工需留验证余量）／**low**（孤证无源，禁止施工，先验证）。

依据类型轴：`[运行时源码]` / `[真机]` / `[文档·多源]` / `[文档·单源]` / `[社区]` / `[推断]`

**首次收集日期**：2026-06-28
**2026-07-14 双快照**：本地 SillyTavern v1.14.0 继续作为历史源码快照；官方 release 页面当日核验为 v1.18.0。精确 API 以目标安装版本的源码/能力检测为准，不把任何一版写成永久基线。

---

## 目录

1. 机制总览
2. manifest.json 字段完整参考
   - 2.1 字段表
   - 2.2 典型示例
3. index.js 入口结构与范式
   - 3.1 新式 getContext() 写法（推荐）
   - 3.2 老式相对 import 写法（可用，不推荐）
   - 3.3 settings.html 模板
4. extension_settings 持久化
5. UI 注入（Settings Panel）
6. eventSource 事件系统
   - 6.1 监听与触发 API
   - 6.2 event_types 完整常量表
7. 注册 Slash Command
   - 7.1 新式 SlashCommandParser（推荐）
   - 7.2 老式 registerSlashCommand（deprecated）
8. generate_interceptor（提示词拦截）
9. Lifecycle Hooks（manifest.hooks）
10. getContext() 完整 API 参考
11. 第三方扩展安装结构与发布
12. Webpack 打包（Bundled Extension）
13. Server Plugin（对比 UI Extension）
14. 高频避坑
15. 悬案（未决项与验证路径）
16. 插件术语、安装渠道与作用域
17. 依赖、更新、卸载与安全审查
18. 角色卡依赖 UX、兼容矩阵与回滚

---

## 1. 机制总览

**来源**：官方文档 [文档·多源] + ST 源码 [运行时源码]
**置信度**：high

SillyTavern 扩展（UI Extension）是**纯客户端 JavaScript 模块**，以 ES Module 形式加载，运行在浏览器。加载入口：`manifest.json` → 指向 `index.js` → 自动注入 `css`。

**扩展存放路径**（两种，HTTP URL 路径相同）：

| 作用域 | 文件系统路径 | 适用版本 |
|---|---|---|
| 用户作用域（推荐） | `data/<user-handle>/extensions/<extension-name>/` | 1.12+ |
| 全局作用域 | `public/scripts/extensions/third-party/<extension-name>/` | 所有版本 |

两者对 HTTP 服务呈现的 URL 均为 `/scripts/extensions/third-party/<name>/`，代码内相对 import 路径以此为基准。

**扩展与 ST 核心的交互主干**：

| 方式 | 推荐度 | 说明 |
|---|---|---|
| `SillyTavern.getContext()` | **推荐** | 访问应用状态和核心方法，API 稳定 |
| `import {...} from "../../../../script.js"` | 不推荐 | 随内部结构重构随时 break |

---

## 2. manifest.json 字段完整参考

### 2.1 字段表

**来源**：官方文档 + 官方扩展源码 [文档·多源] [运行时源码]
**置信度**：high
**适用版本**：跨版本字段表。除单独标注项外，基础字段已在 ST v1.14.0 历史快照核对；版本新增字段必须同时满足 `minimum_client_version` 并按目标版真机验证。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `display_name` | string | **必填** | 在"Manage Extensions"菜单中显示的名称 |
| `js` | string | **必填** | 入口 JS 文件路径（相对扩展目录） |
| `author` | string | **必填** | 作者名或联系方式 |
| `loading_order` | number | 可选 | 加载优先级；数字越大越晚加载，默认约 10 |
| `css` | string | 可选 | 自动注入的样式文件路径 |
| `version` | string | 可选 | 扩展版本号（semver） |
| `homePage` | string | 可选 | 扩展仓库 URL |
| `auto_update` | boolean | 可选 | 是否随 ST 包更新自动更新，默认 false |
| `minimum_client_version` | string | 可选 | 所需最低 ST 版本 |
| `requires` | array | 可选 | 需要的 Extras API 模块（Extras 项目已 OBSOLETE，新扩展勿用） |
| `optional` | array | 可选 | 可选的 Extras API 模块（同上，已基本无效） |
| `dependencies` | array | 可选 | 所依赖的其他扩展文件夹名；缺失则拒绝加载 |
| `generate_interceptor` | string | 可选 | 全局函数名，在每次生成前被调用（可修改 chat 数组） |
| `i18n` | object | 可选 | locale → 翻译 JSON 文件路径的映射 |
| `hooks` | object | 可选 | **仅 ST v1.17+** 的生命周期钩子函数名映射；`clean` 等完整集合按 v1.18+ 核对（见第 9 章）。v1.14.0 不读取此字段 |

### 2.2 典型示例

**带 i18n 示例**（来源：Extension-TopInfoBar manifest [运行时源码]）：

```json
{
  "display_name": "Chat Top Bar",
  "loading_order": 100,
  "requires": [],
  "optional": [],
  "js": "index.js",
  "css": "style.css",
  "author": "Cohee1207",
  "version": "1.0.0",
  "homePage": "https://github.com/SillyTavern/Extension-TopInfoBar",
  "auto_update": true,
  "i18n": {
    "zh-cn": "i18n/zh-cn.json",
    "zh-tw": "i18n/zh-tw.json"
  }
}
```

**带 generate_interceptor 示例**（来源：Extension-MessageLimit manifest [运行时源码]）：

```json
{
  "display_name": "Message Limit",
  "loading_order": 1000,
  "requires": [],
  "optional": [],
  "js": "index.js",
  "css": "",
  "author": "Cohee1207",
  "version": "1.0.0",
  "homePage": "https://github.com/SillyTavern/Extension-MessageLimit",
  "auto_update": true,
  "generate_interceptor": "MessageLimit_interceptGeneration"
}
```

---

## 3. index.js 入口结构与范式

### 3.1 新式 getContext() + activate 写法（ST v1.17+ 推荐）

**来源**：官方文档 [文档·多源]
**置信度**：high
**适用版本**：`getContext()` 与目录结构在 v1.14.0 和 2026-07-14 当前文档中均成立；但本节主示例使用 `hooks.activate`，因此 manifest 的 `minimum_client_version` 至少应为 `1.17.0`。安装 UI、用户作用域与收录流程仍属于版本敏感项。

```json
{
  "minimum_client_version": "1.17.0",
  "hooks": {
    "activate": "onActivate"
  }
}
```

```javascript
// 不再有相对 import，直接用全局 SillyTavern 对象
const MODULE_NAME = 'my_extension';

const defaultSettings = Object.freeze({
  enabled: false,
  threshold: 5,
  mode: 'auto',
});

function getSettings() {
  const { extensionSettings } = SillyTavern.getContext();
  if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
  }
  // 版本升级时补全新增字段
  for (const key of Object.keys(defaultSettings)) {
    if (!Object.hasOwn(extensionSettings[MODULE_NAME], key)) {
      extensionSettings[MODULE_NAME][key] = defaultSettings[key];
    }
  }
  return extensionSettings[MODULE_NAME];
}

async function init() {
  const {
    eventSource,
    event_types,
    extensionSettings,
    saveSettingsDebounced,
    renderExtensionTemplateAsync,
  } = SillyTavern.getContext();

  // 1. 注入 Settings Panel HTML（Handlebars 模板）
  const settingsHtml = await renderExtensionTemplateAsync(
    'third-party/my-extension',  // 相对 /scripts/extensions/ 的目录名
    'settings',                   // 模板文件名（不含后缀）
    { title: 'My Extension', defaultThreshold: 5 }
  );
  $('#extensions_settings2').append(settingsHtml);

  // 2. 绑定控件事件
  const settings = getSettings();
  $('#my_ext_enabled').prop('checked', settings.enabled).on('change', function() {
    settings.enabled = $(this).prop('checked');
    saveSettingsDebounced();
  });

  // 3. 监听 ST 事件
  eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
  eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
}

function onMessageReceived(messageId) {
  const { chat } = SillyTavern.getContext();
  const message = chat[messageId];
  console.log('New message:', message.mes);
}

function onChatChanged() {
  const settings = getSettings();
  // 切换聊天时重置状态...
}

// 挂载 activate 钩子（manifest hooks.activate 指向此函数名）
export async function onActivate() {
  await init();
}
```

**避坑**：`init()` 若可能被多次触发，对 `$.on()` 需先 `.off()` 再 `.on()`，防止重复绑定事件。

若明确兼容 **v1.14.0**，不得照抄上面的 hook manifest。保留无 hooks 的模块加载路径，并把初始化做成幂等：

```javascript
let initialized = false;

async function initOnce() {
  if (initialized) return;
  initialized = true;
  await init();
}

// v1.14.0 历史路径：模块加载后由 DOM ready 启动；APP_READY 只作兜底且不能重复初始化。
jQuery(initOnce);
const { eventSource, event_types } = SillyTavern.getContext();
eventSource.once(event_types.APP_READY, initOnce);
```

这条兼容支线没有 `onDisable` hook；需要禁用即停的扩展应提高最低版本，不能声称在 v1.14.0 支持热禁用清理。

### 3.2 老式相对 import 写法（可用，不推荐）

**来源**：city-unit/st-extension-example [运行时源码]
**置信度**：high（可用），但路径脆弱性为 medium（重构即 break）
**适用版本**：当前可用，不保证未来兼容

```javascript
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "st-extension-example";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {};

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }
  $("#example_setting").prop("checked", extension_settings[extensionName].example_setting).trigger("input");
}

function onExampleInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].example_setting = value;
  saveSettingsDebounced();
}

function onButtonClick() {
  toastr.info(
    `The checkbox is ${extension_settings[extensionName].example_setting ? "checked" : "not checked"}`,
    "A popup appeared because you clicked the button!"
  );
}

jQuery(async () => {
  const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
  $("#extensions_settings").append(settingsHtml);
  $("#my_button").on("click", onButtonClick);
  $("#example_setting").on("input", onExampleInput);
  loadSettings();
});
```

**避坑**：`import` 相对路径依赖 ST 内部文件结构，内部重构后立刻 break 且无错误提示。新扩展一律用 `getContext()`。

### 3.3 settings.html 模板（使用 ST inline-drawer 组件）

**来源**：city-unit/st-extension-example [运行时源码]
**置信度**：high

```html
<div class="example-extension-settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>Extension Example</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="example-extension_block flex-container">
                <input id="my_button" class="menu_button" type="submit" value="Example Button" />
            </div>
            <div class="example-extension_block flex-container">
                <input id="example_setting" type="checkbox" />
                <label for="example_setting">This is an example</label>
            </div>
            <hr class="sysHR" />
        </div>
    </div>
</div>
```

**Handlebars 模板内 i18n 属性用法**：

```html
<b data-i18n="{{title}}">{{title}}</b>
```

---

## 4. extension_settings 持久化

**来源**：官方文档 [文档·多源] + ST 源码 [运行时源码]
**置信度**：high
**适用版本**：ST v1.14.0

**核心规则**：

- `extension_settings` 是全局对象，挂在 ST 设置 JSON 内
- 每个扩展用唯一 key（即扩展文件夹名）隔离命名空间，避免冲突
- `saveSettingsDebounced()` 内部做了防抖，批量写入服务器；**禁止用 `saveSettings()`** 替代（会淹没服务器请求）
- **大数据（超过几十 KB 的缓存）不要放 `extension_settings`**，改用 `SillyTavern.libs.localforage`

**IndexedDB 大数据存储**（via localforage）：

```javascript
const { localforage } = SillyTavern.libs;

// 写入
await localforage.setItem(`${MODULE_NAME}_cache`, largeData);

// 读取
const cached = await localforage.getItem(`${MODULE_NAME}_cache`);

// 清理（配合 onClean 钩子）
await localforage.removeItem(`${MODULE_NAME}_cache`);
```

**设置合并推荐范式**（lodash deep merge，新字段自动补全）：

```javascript
const { extensionSettings } = SillyTavern.getContext();
const { lodash } = SillyTavern.libs;

extensionSettings[MODULE_NAME] = lodash.merge(
  structuredClone(defaultSettings),
  extensionSettings[MODULE_NAME]
);
```

**已知限制**：`saveSettingsDebounced` 有防抖延迟，修改后立即刷新页面可能丢失最后一次修改。ST 目前无官方同步持久化 API。

---

## 5. UI 注入（Settings Panel）

**来源**：官方文档 [文档·多源] + ST 源码 [运行时源码]
**置信度**：high
**适用版本**：ST v1.14.0

**两个主要注入点**：

| jQuery 选择器 | 用途 |
|---|---|
| `$('#extensions_settings')` | 扩展设置面板（主区域，老式写法常用） |
| `$('#extensions_settings2')` | 扩展设置面板（副区域，新式模板推荐） |

**两种注入方式**：

```javascript
// 方式 A：$.get 直接拉 HTML（老式，仍可用）
const html = await $.get(`scripts/extensions/third-party/${extensionName}/settings.html`);
$('#extensions_settings').append(html);

// 方式 B：renderExtensionTemplateAsync（新式，含 Handlebars + i18n + DOMPurify 净化）
const html = await renderExtensionTemplateAsync(
  'third-party/my-extension',  // 第一参数：相对 /scripts/extensions/ 的目录名
  'settings',                   // 第二参数：模板文件名（不含后缀）
  { key: 'value' }              // 第三参数：模板数据对象
);
$('#extensions_settings2').append(html);
```

**避坑**：`renderExtensionTemplateAsync` 第一参数是目录名（如 `'third-party/my-extension'`），不是文件路径也不是绝对路径。路径写错不报错，只是静默渲染空字符串。

---

## 6. eventSource 事件系统

### 6.1 监听与触发 API

**来源**：events.js 源码（staging branch）[运行时源码]
**置信度**：high
**适用版本**：ST v1.14.0

```javascript
const { eventSource, event_types } = SillyTavern.getContext();

// 订阅（持续监听）
eventSource.on(event_types.MESSAGE_RECEIVED, handler);

// 一次性订阅（触发后自动移除）
eventSource.once(event_types.APP_READY, handler);

// 取消订阅（防内存泄漏，onDisable 钩子内必须调用）
eventSource.removeListener(event_types.MESSAGE_RECEIVED, handler);

// 触发事件（也可触发自定义事件）
await eventSource.emit('my_custom_event', { data: 'payload' });
```

**避坑**：动态注册的 listener 必须在 `onDisable` 钩子里 `removeListener` 清理，否则扩展禁用后仍会触发回调，造成内存泄漏和行为异常。

### 6.2 event_types 完整常量表

**来源**：https://github.com/SillyTavern/SillyTavern/blob/staging/public/scripts/events.js [运行时源码]
**置信度**：medium·版本漂移（来源为 staging branch，实测 v1.14.0 仅 89 个事件，staging 已达 150 个；下表含 staging 新增事件，在 v1.14.0 中不存在的条目已标注）
**适用版本**：ST staging branch（v1.14.0 子集见注意事项）

> **版本注意**：以下事件中，`APP_INITIALIZED`、`CHAT_LOADED`、`CHAT_RENAMED`、`PERSONA_*`（5个）、`ITEMIZED_PROMPTS_*`（3个）、`TTS_*`（3个）、`WORLDINFO_SCAN_DONE` 在本地 v1.14.0 源码（`public/scripts/events.js`）中**均不存在**，属于 staging 新增。施工于 v1.14.0 时勿用这些事件常量，运行时会得到 `undefined`。v1.14.0 实有事件清单以本地 `public/scripts/events.js` 为准。

**应用生命周期**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `APP_INITIALIZED` | staging 新增 | 应用初始化完成，loader 仍在；同步安装 UI 用这个时机 |
| `APP_READY` | ✅ | 应用完全就绪，loader 已移除；异步后续初始化用这个 |
| `EXTENSIONS_FIRST_LOAD` | ✅ | 扩展首次加载 |
| `EXTENSION_SETTINGS_LOADED` | ✅ | 扩展设置加载完毕 |
| `SETTINGS_LOADED_BEFORE` | ✅ | 设置加载前 |
| `SETTINGS_LOADED` | ✅ | 设置加载完成 |
| `SETTINGS_LOADED_AFTER` | ✅ | 设置加载后 |
| `SETTINGS_UPDATED` | ✅ | 设置有更新 |

**消息事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `MESSAGE_SENT` | ✅ | 用户消息已记入 chat 对象（未渲染） |
| `MESSAGE_RECEIVED` | ✅ | LLM 消息已记入 chat 对象（未渲染） |
| `USER_MESSAGE_RENDERED` | ✅ | 用户消息已渲染到 DOM |
| `CHARACTER_MESSAGE_RENDERED` | ✅ | LLM 消息已渲染到 DOM |
| `MESSAGE_EDITED` | ✅ | 消息被编辑 |
| `MESSAGE_DELETED` | ✅ | 消息被删除 |
| `MESSAGE_UPDATED` | ✅ | 消息有更新 |
| `MESSAGE_SWIPED` | ✅ | swipe 操作 |
| `MESSAGE_SWIPE_DELETED` | ✅ | swipe 被删除 |
| `MESSAGE_FILE_EMBEDDED` | ✅ | 文件嵌入消息 |
| `MESSAGE_REASONING_EDITED` | ✅ | 推理内容被编辑 |
| `MESSAGE_REASONING_DELETED` | ✅ | 推理内容被删除 |
| `MORE_MESSAGES_LOADED` | ✅ | 更多历史消息加载 |
| `IMPERSONATE_READY` | ✅ | impersonate 生成完毕 |

**生成事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `GENERATION_AFTER_COMMANDS` | ✅ | slash commands 处理后，生成开始前 |
| `GENERATION_STARTED` | ✅ | 生成开始 |
| `GENERATION_STOPPED` | ✅ | 生成被中断 |
| `GENERATION_ENDED` | ✅ | 生成完成 |
| `GENERATE_BEFORE_COMBINE_PROMPTS` | ✅ | 合并 prompt 前 |
| `GENERATE_AFTER_COMBINE_PROMPTS` | ✅ | 合并 prompt 后 |
| `GENERATE_AFTER_DATA` | ✅ | 数据组装后 |
| `STREAM_TOKEN_RECEIVED` | ✅ | 流式 token 到来 |
| `SMOOTH_STREAM_TOKEN_RECEIVED` | ✅（@deprecated）| 已废弃别名，与 `STREAM_TOKEN_RECEIVED` 值相同（均为 `'stream_token_received'`）；源码已注释 `@deprecated The event is aliased to STREAM_TOKEN_RECEIVED.`；见第 15 章 U15.1 |
| `STREAM_REASONING_DONE` | ✅ | 推理阶段结束 |
| `SD_PROMPT_PROCESSING` | ✅ | SD 图像提示处理 |

**聊天事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `CHAT_CHANGED`（`'chat_id_changed'`） | ✅ | 切换到另一个聊天 |
| `CHAT_LOADED` | staging 新增 | 聊天加载完成 |
| `CHAT_CREATED` | ✅ | 聊天被创建 |
| `CHAT_DELETED` | ✅ | 聊天被删除 |
| `CHAT_RENAMED` | staging 新增 | 聊天被重命名 |
| `GROUP_CHAT_CREATED` | ✅ | 群组聊天被创建 |
| `GROUP_CHAT_DELETED` | ✅ | 群组聊天被删除 |

**角色事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `CHARACTER_EDITOR_OPENED` | ✅ | 角色编辑器打开 |
| `CHARACTER_EDITED` | ✅ | 角色被编辑 |
| `CHARACTER_PAGE_LOADED` | ✅ | 角色页面加载 |
| `CHARACTER_DELETED` | ✅（值为 `'characterDeleted'`，大小写不一致，见源码注释）| 角色被删除 |
| `CHARACTER_DUPLICATED` | ✅ | 角色被复制 |
| `CHARACTER_RENAMED` | ✅ | 角色被重命名 |
| `CHARACTER_RENAMED_IN_PAST_CHAT` | ✅ | 角色在历史聊天中被重命名 |
| `CHARACTER_FIRST_MESSAGE_SELECTED` | ✅ | 角色首条消息被选中 |
| `CHARACTER_GROUP_OVERLAY_STATE_CHANGE_BEFORE` | ✅ | 群组叠加层状态变更前 |
| `CHARACTER_GROUP_OVERLAY_STATE_CHANGE_AFTER` | ✅ | 群组叠加层状态变更后 |
| `CHARACTER_MANAGEMENT_DROPDOWN` | ✅（值为 `'charManagementDropdown'`，命名不一致）| 角色管理下拉菜单 |

**设置与预设事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `CHATCOMPLETION_SOURCE_CHANGED` | ✅ | Chat Completion 来源变更 |
| `CHATCOMPLETION_MODEL_CHANGED` | ✅ | Chat Completion 模型变更 |
| `MAIN_API_CHANGED` | ✅ | 主 API 变更 |
| `PRESET_CHANGED` | ✅ | 预设变更 |
| `PRESET_DELETED` | ✅ | 预设删除 |
| `PRESET_RENAMED` | ✅ | 预设重命名 |
| `PRESET_RENAMED_BEFORE` | ✅ | 预设重命名前 |
| `OAI_PRESET_CHANGED_BEFORE` | ✅ | OAI 预设变更前 |
| `OAI_PRESET_CHANGED_AFTER` | ✅ | OAI 预设变更后 |
| `OAI_PRESET_EXPORT_READY` | ✅ | OAI 预设导出就绪 |
| `OAI_PRESET_IMPORT_READY` | ✅ | OAI 预设导入就绪 |
| `TEXT_COMPLETION_SETTINGS_READY` | ✅ | 文本补全设置就绪 |
| `CHAT_COMPLETION_SETTINGS_READY` | ✅ | Chat Completion 设置就绪 |
| `CHAT_COMPLETION_PROMPT_READY` | ✅ | Chat Completion prompt 就绪 |
| `ITEMIZED_PROMPTS_LOADED` | staging 新增 | 条目化 prompt 加载完 |
| `ITEMIZED_PROMPTS_SAVED` | staging 新增 | 条目化 prompt 保存 |
| `ITEMIZED_PROMPTS_DELETED` | staging 新增 | 条目化 prompt 删除 |

**世界书事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `WORLDINFO_SETTINGS_UPDATED` | ✅ | 世界书设置更新 |
| `WORLDINFO_UPDATED` | ✅ | 世界书更新 |
| `WORLDINFO_FORCE_ACTIVATE` | ✅ | 世界书强制激活 |
| `WORLDINFO_ENTRIES_LOADED` | ✅ | 世界书条目加载完 |
| `WORLDINFO_SCAN_DONE` | staging 新增 | 世界书扫描完成 |
| `WORLD_INFO_ACTIVATED` | ✅ | 世界书条目被激活 |

**群组事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `GROUP_UPDATED` | ✅ | 群组更新 |
| `GROUP_MEMBER_DRAFTED` | ✅ | 群组成员被草拟（选中发言） |
| `GROUP_WRAPPER_STARTED` | ✅ | 群组包装器开始 |
| `GROUP_WRAPPER_FINISHED` | ✅ | 群组包装器完成 |

**Persona 事件**（均为 staging 新增，v1.14.0 不存在）

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `PERSONA_CHANGED` | staging 新增 | Persona 切换 |
| `PERSONA_CREATED` | staging 新增 | Persona 创建 |
| `PERSONA_UPDATED` | staging 新增 | Persona 更新 |
| `PERSONA_RENAMED` | staging 新增 | Persona 重命名 |
| `PERSONA_DELETED` | staging 新增 | Persona 删除 |

**连接与密钥事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `CONNECTION_PROFILE_LOADED` | ✅ | 连接配置文件加载 |
| `CONNECTION_PROFILE_CREATED` | ✅ | 连接配置文件创建 |
| `CONNECTION_PROFILE_DELETED` | ✅ | 连接配置文件删除 |
| `CONNECTION_PROFILE_UPDATED` | ✅ | 连接配置文件更新 |
| `ONLINE_STATUS_CHANGED` | ✅ | 在线状态变更 |
| `SECRET_WRITTEN` | ✅ | 密钥写入 |
| `SECRET_DELETED` | ✅ | 密钥删除 |
| `SECRET_ROTATED` | ✅ | 密钥轮换 |
| `SECRET_EDITED` | ✅ | 密钥编辑 |
| `EXTRAS_CONNECTED` | ✅ | Extras 连接成功（Extras 已 OBSOLETE，此事件仍存在但实际不会触发）|

**工具调用事件**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `TOOL_CALLS_PERFORMED` | ✅ | 工具调用执行完毕 |
| `TOOL_CALLS_RENDERED` | ✅ | 工具调用结果渲染 |

**TTS 事件**（均为 staging 新增，v1.14.0 不存在）

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `TTS_JOB_STARTED` | staging 新增 | TTS 任务开始 |
| `TTS_AUDIO_READY` | staging 新增 | TTS 音频就绪 |
| `TTS_JOB_COMPLETE` | staging 新增 | TTS 任务完成 |

**其他**

| 常量名 | v1.14.0 | 说明 |
|---|---|---|
| `MOVABLE_PANELS_RESET` | ✅ | 面板位置重置 |
| `FORCE_SET_BACKGROUND` | ✅ | 强制设置背景 |
| `IMAGE_SWIPED` | ✅ | 图片 swipe |
| `OPEN_CHARACTER_LIBRARY` | ✅ | 打开角色库 |
| `FILE_ATTACHMENT_DELETED` | ✅ | 文件附件删除 |
| `MEDIA_ATTACHMENT_DELETED` | ✅ | 媒体附件删除 |

---

## 7. 注册 Slash Command

### 7.1 新式 SlashCommandParser（推荐）

**来源**：官方文档 [文档·多源]
**置信度**：high
**适用版本**：ST v1.14.0

```javascript
const {
  SlashCommandParser,
  SlashCommand,
  SlashCommandNamedArgument,
  SlashCommandArgument,
  ARGUMENT_TYPE
} = SillyTavern.getContext();

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
  name: 'my-cmd',
  callback: (namedArgs, unnamedArgs) => {
    const count = namedArgs.count ?? 3;
    const text = unnamedArgs.toString();
    return Array(Number(count)).fill(text).join(' ');
  },
  aliases: ['mc', 'mycmd'],
  returns: 'repeated text',
  namedArgumentList: [
    SlashCommandNamedArgument.fromProps({
      name: 'count',
      description: 'number of repetitions',
      typeList: [ARGUMENT_TYPE.NUMBER],
      defaultValue: '3',
    }),
    SlashCommandNamedArgument.fromProps({
      name: 'upper',
      description: 'convert to uppercase',
      typeList: [ARGUMENT_TYPE.BOOLEAN],
      defaultValue: 'off',
      enumList: ['on', 'off'],
    }),
  ],
  unnamedArgumentList: [
    SlashCommandArgument.fromProps({
      description: 'text to repeat',
      typeList: [ARGUMENT_TYPE.STRING],
      isRequired: true,
    }),
  ],
  helpString: '<div>Repeats the provided text N times.</div>',
}));
```

**ARGUMENT_TYPE 完整列表**：

| 类型常量 | 说明 |
|---|---|
| `STRING` | 字符串 |
| `NUMBER` | 数字 |
| `BOOLEAN` | 布尔值 |
| `RANGE` | 范围（如 `1-10`） |
| `CLOSURE` | 闭包（STScript 匿名函数） |
| `VARIABLE_NAME` | 变量名引用 |
| `LIST` | 列表 |
| `DICTIONARY` | 字典 |

### 7.2 老式 registerSlashCommand（deprecated）

**来源**：ST 内部源码 [运行时源码]
**置信度**：high（可用），稳定性 medium（随时可能移除）

```javascript
import { registerSlashCommand } from "../../slash-commands.js";

registerSlashCommand(
  "name",                    // 命令名
  function(args) { /* callback */ },
  ["alias"],                 // 别名数组
  "Help text",               // 帮助文本
  true,                      // 在 /help 中显示
  true                       // 接受管道输入
);
```

---

## 8. generate_interceptor（提示词拦截）

**来源**：官方文档 [文档·多源] + 官方扩展源码（Extension-MessageLimit）[运行时源码]
**置信度**：high
**适用版本**：ST v1.14.0

在 manifest 中声明拦截函数名（字符串，不是 export 名）：

```json
{ "generate_interceptor": "MyExt_interceptGeneration" }
```

在 `index.js` 中将函数挂到 **globalThis**（必须，否则静默失效）：

```javascript
globalThis.MyExt_interceptGeneration = async function(
  chat,        // 消息数组（可变，直接修改生效）
  contextSize, // 已计算的 token 数
  abort,       // 函数：abort(true) 阻止后续拦截器；abort(false) 停止整次生成
  type         // 生成类型字符串
) {
  // 常见 type 值：'quiet' | 'regenerate' | 'impersonate' | 'swipe' | 'normal'
  if (type === 'quiet') return;  // 跳过安静模式生成

  // 示例：在最后一条用户消息前插入系统注释
  const systemNote = {
    is_user: false,
    name: 'System',
    send_date: Date.now(),
    mes: '[Injected by extension]',
  };
  chat.splice(chat.length - 1, 0, systemNote);
};
```

**避坑**：函数必须挂 `globalThis`，不能只是模块作用域函数（ST 框架通过字符串函数名在全局查找）。挂错不报错，静默失效。

---

## 9. Lifecycle Hooks（manifest.hooks）

**来源**：当前官方 UI Extensions 文档 + v1.18.0 release notes + v1.14.0 本地源码历史快照
**置信度**：high（两个版本截面的结论已经分开）[官方文档·发布记录·运行时源码]
**适用版本**：当前发布线支持；v1.14.0 历史快照不可依赖。施工仍须用最低版本真机验证。

> **版本裁决（2026-07-14）**：v1.14.0 无 manifest lifecycle hooks；v1.17.0 发布线引入 lifecycle hooks；v1.18.0 release notes 记录内置扩展迁移到 `activate` 并增加 `clean` hook。使用下方完整 hook 集时应把 `minimum_client_version` 至少写到已核支持 `clean` 的版本，并对最低支持版与当前版各测一次。

manifest 中声明函数名，函数须从 `index.js` export：

```json
{
  "minimum_client_version": "1.18.0",
  "hooks": {
    "install":  "onInstall",
    "activate": "onActivate",
    "enable":   "onEnable",
    "disable":  "onDisable",
    "update":   "onUpdate",
    "delete":   "onDelete",
    "clean":    "onClean"
  }
}
```

所有钩子均可选，无参数，可返回 Promise（超时限制 5 秒）：

```javascript
// 首次安装：初始化默认数据
export async function onInstall() {
  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
  if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    saveSettingsDebounced();
  }
}

// 扩展自身加载期的同步初始化；早于 APP_INITIALIZED
export async function onActivate() {
  await init();
}

// 扩展被启用前（用户在管理面板点击启用）
export async function onEnable() {
  // 注册事件监听、初始化运行时状态
}

// 扩展被禁用前（用户在管理面板点击禁用）
export async function onDisable() {
  const { eventSource, event_types } = SillyTavern.getContext();
  // 必须清理事件监听，否则禁用后仍会触发
  eventSource.removeListener(event_types.MESSAGE_RECEIVED, onMessageReceived);
}

// 成功更新后（reload toast 显示前）
export async function onUpdate() {
  // 迁移旧设置格式到新格式
}

// 扩展被从服务器删除前
export async function onDelete() {
  // 清理远端数据
}

// 用户点击"Clean extension data"时
export async function onClean() {
  const { localforage } = SillyTavern.libs;
  await localforage.removeItem(`${MODULE_NAME}_cache`);
}
```

**三阶段时序**：

| 时机 | 对应钩子/事件 | loader 状态 | 适用场景 |
|---|---|---|---|
| 扩展加载期 | `onActivate` | 仍在 | 只依赖本扩展的同步初始化；不要假定其他扩展/UI 已完成 |
| 全部扩展/UI 初始化后 | `APP_INITIALIZED` | 仍在 | 依赖其他扩展或完整宿主 UI 的初始化 |
| 应用完全就绪 | `APP_READY` | 已移除（用户可交互） | 慢异步后续工作、网络/API 调用 |

`onActivate` 不等于 `APP_INITIALIZED`。错用时机会导致依赖对象或 DOM 尚未存在，也可能让慢任务阻塞 loader。目标若必须兼容 v1.14.0，不能依赖 hooks/APP_INITIALIZED；应保留该版本专用的模块顶层初始化 + `APP_READY` 路径，或提高最低支持版本。

---

## 10. getContext() 完整 API 参考

**来源**：官方文档 [文档·多源] + v1.14.0 `public/scripts/st-context.js` [运行时源码]
**置信度**：high（已与 v1.14.0 st-context.js 源码交叉验证）
**适用版本**：ST v1.14.0

```javascript
const context = SillyTavern.getContext();
```

**状态属性**

| 属性 | 类型 | 说明 |
|---|---|---|
| `chat` | array | 当前聊天消息数组（可变） |
| `characters` | array | 所有角色列表 |
| `characterId` | number\|undefined | 当前角色索引（群组时为 undefined）；源码字段名 `this_chid` 映射为此 |
| `groups` | array | 群组列表 |
| `groupId` | string\|null | 当前群组 ID |
| `chatId` | string\|undefined | 当前聊天文件名（源码新增，草稿遗漏） |
| `chatMetadata` | object | 聊天级元数据；源码字段 `chat_metadata` |
| `extensionSettings` | object | 扩展设置存储根对象；源码字段 `extension_settings` |
| `onlineStatus` | string | 在线状态；源码字段 `online_status` |
| `maxContext` | number | 最大 token 上下文数 |

**事件**

| 属性 | 类型 | 说明 |
|---|---|---|
| `eventSource` | EventEmitter | 事件总线 |
| `event_types` | object | 所有事件常量（见第 6.2 节）；源码中同时暴露新式 `eventTypes` 和兼容 `event_types` 两个字段 |

**方法**

| 方法 | 返回值 | 说明 |
|---|---|---|
| `saveSettingsDebounced()` | void | 防抖保存扩展设置 |
| `saveMetadata()` | Promise | 保存 chatMetadata |
| `renderExtensionTemplateAsync(folder, name, data)` | Promise\<string\> | 渲染 Handlebars 模板 |
| `addLocaleData(locale, obj)` | void | 注册 i18n 翻译 |
| `writeExtensionField(charId, key, value)` | Promise | 写角色卡 extensions 字段 |
| `generateQuietPrompt(options)` | Promise\<string\> | 安静模式生成（有聊天上下文） |
| `generateRaw(options)` | Promise\<string\> | 裸 LLM 调用（无角色上下文） |
| `getPresetManager()` | object | 获取预设管理器 |
| `registerFunctionTool(config)` | Promise | 注册 function calling 工具 |
| `registerDataBankScraper(config)` | Promise | 注册数据银行抓取器 |
| `registerDebugFunction(id, name, desc, fn)` | void | 注册调试函数（出现在 Power User 菜单） |

**UI 类**

| 属性 | 类型 | 说明 |
|---|---|---|
| `Popup` | class | Popup 对话框类 |
| `POPUP_TYPE` | enum | Popup 类型常量 |
| `POPUP_RESULT` | enum | Popup 结果常量 |
| `showLoader` / `hideLoader` | function | 加载遮罩控制（草稿误写为 `loader` 对象，实为两个分离函数）[运行时源码] |
| `callGenericPopup` | function | 新式 Popup 调用（`callPopup` 已 @deprecated）|

**Slash Command 类**

| 属性 | 类型 | 说明 |
|---|---|---|
| `SlashCommandParser` | class | slash command 注册器 |
| `SlashCommand` | class | slash command 构建类 |
| `SlashCommandNamedArgument` | class | 具名参数构建类 |
| `SlashCommandArgument` | class | 位置参数构建类 |
| `ARGUMENT_TYPE` | enum | 参数类型常量 |

**其他**

| 属性 | 说明 |
|---|---|
| `messageFormatting` | 消息格式化钩子（草稿误写为 `messageFormatter`，源码实际字段名为 `messageFormatting`）[运行时源码] |
| `registerMacro` / `unregisterMacro` | 宏注册/注销（草稿误写为 `macros` 对象，实为两个方法；新式 API 为 `macros.register()`，需确认版本）[运行时源码] |
| `swipe` | 对象，含 `left`/`right`/`show`/`hide`/`refresh`/`isAllowed` 方法（源码新增，草稿遗漏） |
| `variables` | 对象，含 `local.get`/`local.set`/`global.get`/`global.set`（源码新增，草稿遗漏） |

**SillyTavern.libs 内置第三方库**（可直接使用，无需 import）：

`lodash` / `Fuse` / `DOMPurify` / `hljs` / `localforage` / `Handlebars` / `css` / `Bowser` / `DiffMatchPatch` / `Readability` / `isProbablyReaderable` / `SVGInject` / `showdown` / `moment` / `seedrandom` / `Popper` / `droll` / `morphdom` / `slideToggle` / `chalk` / `yaml`

> **v1.14.0 校准** [运行时源码]：以上列表经 `public/lib.js` 直读确认，共 22 个库。草稿原列的 `chevrotain`、`gzipSync`、`gzip` 在 v1.14.0 `lib.js` 中**不存在**，已移除；若需在 staging 版本使用，请先验证。

---

## 11. 第三方扩展安装结构与发布

**来源**：官方文档 [文档·多源]
**置信度**：high
**适用版本**：ST v1.14.0

### 目录结构

```
my-extension/
├── manifest.json         # 必须
├── index.js              # 入口（manifest.js 字段指向的文件）
├── style.css             # 可选
├── settings.html         # 可选（Settings Panel HTML/Handlebars 模板）
├── i18n/
│   ├── zh-cn.json
│   └── zh-tw.json
└── README.md
```

### 安装方式

- **UI 安装**：Extensions → Install Extension → 粘贴 GitHub 仓库 URL（可指定 branch）
- **本地开发**：将仓库克隆到 `public/scripts/extensions/third-party/<name>/` 或 `data/<user>/extensions/<name>/`
- ST 服务器通过 `createGitClient` + `simple-git` 克隆到用户扩展目录

多人实例还要区分 current-user 与 all-users/管理员安装。不要只看到文件在服务器上，就假定每个用户都已启用。

### 发布到官方内容索引

官方内容索引的登记字段、文件位置和审核流程会变化。2026-07-14 当前官方写法要求先联系维护者确认收录，不应继续把“直接改某个 `extensions.json` 并运行固定脚本”当永久流程。

发布前至少准备：

- 公共仓库、清晰许可证与 README；
- manifest 的版本、最低客户端版本与依赖；
- 安装、更新、卸载和迁移说明；
- 网络、提示词、DOM、密钥与 Server Plugin 权限说明；
- 当前 release 的 smoke 结果；
- 按当日官方文档/维护者要求提交。

当前官方收录硬门还包括：开源/libre license、兼容最新 release、完整 README；**必须依赖 Server Plugin 才能工作的 UI Extension 不接受官方内容索引收录**。这不妨碍用户自行安装，但必须如实说明管理员权限和服务端风险。

---

## 12. Webpack 打包（Bundled Extension）

**来源**：官方文档 [文档·单源]
**置信度**：medium

用于需要 npm 包的扩展。官方提供两个模板：

| 模板 | 地址 |
|---|---|
| 无框架 Webpack | https://github.com/SillyTavern/Extension-WebpackTemplate |
| React + Webpack | https://github.com/SillyTavern/Extension-ReactTemplate |

打包扩展内若确需 import ST 内部模块，需让 webpack 忽略目标 URL；但优先使用 `SillyTavern.getContext()`，内部文件路径不属于稳定 API。当前官方示例的宿主入口是 `/script.js`，旧稿的 `/scripts/extensions.js?webpackIgnore=true` 不应继续复制。

```javascript
// 通用辅助函数：从 URL 动态 import，绕过 webpack 打包
export async function importFromUrl(url, what, defaultValue = null) {
  try {
    const module = await import(/* webpackIgnore: true */ url);
    if (!Object.hasOwn(module, what)) throw new Error(`No ${what} in module`);
    return module[what];
  } catch (error) {
    console.error(`Failed to import ${what} from ${url}: ${error}`);
    return defaultValue;
  }
}

// 仅当目标导出已在目标 ST 版本核验时使用
const verifiedExport = await importFromUrl('/script.js', 'verifiedExport');
```

上例刻意不声称某个具名导出永久存在。能从 `getContext()` 取得的能力一律不走内部动态 import。

---

## 13. Server Plugin（对比 UI Extension）

**来源**：官方文档 [文档·多源]
**置信度**：high
**适用版本**：ST v1.14.0

### 对比表

| 维度 | UI Extension | Server Plugin |
|---|---|---|
| 运行环境 | 浏览器 | Node.js 服务端 |
| 安全沙箱 | 浏览器同源权限；**无 ST 级权限隔离**，可访问 DOM/context | **无**（完整文件系统访问） |
| 启用条件 | 默认启用 | `config.yaml` 需设 `enableServerPlugins: true` |
| 存放位置 | `data/<user>/extensions/` | `plugins/` |
| API 路由前缀 | N/A | `/api/plugins/<id>/` |
| 适用场景 | UI 交互、事件监听、prompt 修改 | 新 API endpoint、Node.js 包、文件系统访问 |

### Server Plugin 示例

```javascript
// plugins/my-plugin.js
async function init(router) {
  router.get('/status', (req, res) => {
    res.json({ status: 'ok' });
  });
  return Promise.resolve();
}

async function exit() {
  return Promise.resolve();
}

module.exports = {
  init,
  exit,
  info: {
    id: 'my-plugin',
    name: 'My Plugin',
    description: 'Does something server-side',
  },
};
```

### UI Extension 中调用 Server Plugin 接口

```javascript
const resp = await fetch('/api/plugins/my-plugin/status');
const data = await resp.json();
```

---

## 14. 高频避坑

**来源**：官方文档 [文档·多源] + v1.14.0 运行时源码 [运行时源码] + 社区 [社区]
**置信度**：medium·单源孤证（条目 2/5/9 有社区来源介入，其余已有源码印证；整体混入社区单源，不宜整体标 high）

1. **相对 import 路径脆弱**：`import from "../../../../script.js"` 在 ST 内部重构后立刻 break 且无报错。新扩展一律用 `SillyTavern.getContext()`，老扩展遇到问题优先排查此项。

2. **jQuery 重复绑事件**：初始化代码若在 `APP_READY` 后多次执行（如每次 chat 切换时重新调用 init），`$.on()` 会累积注册同一回调。修复：用 `.off(eventName).on(eventName, handler)` 模式，或设单次初始化 flag。

3. **extension_settings 命名冲突**：key 必须用扩展文件夹名（全局唯一），不要用 `settings`/`config`/`data` 等通用词，否则与其他扩展发生命名空间碰撞。

4. **大数据放 extension_settings 导致膨胀**：超过几十 KB 的缓存数据放 `extension_settings` 会使 `settings.json` 膨胀、每次保存变慢。超限数据改用 `SillyTavern.libs.localforage`（IndexedDB）。

5. **saveSettingsDebounced 防抖延迟**：修改 settings 后立即刷新页面可能丢失最后一次写入。目前无官方同步持久化 API，这是已知限制，设计时需注意数据重要性分级。

6. **renderExtensionTemplateAsync 路径参数**：第一参数是 `'third-party/my-extension'`（相对 `/scripts/extensions/` 的目录名），不是绝对路径也不是文件名。路径写错不报错，静默返回空字符串。

7. **onActivate vs APP_READY 时机错用**：在 `APP_READY` 才去注入关键 DOM 可能产生竞态；在当前发布线的 `onActivate` 中做慢网络请求又会阻塞 loader。若兼容 v1.14.0，需使用模块顶层 + `APP_READY` 的历史路径，因为该快照未实现 hooks；不能把两代初始化方式混写成一条永久规则。

8. **event listener 内存泄漏**：`onDisable` 钩子里必须 `eventSource.removeListener(event_types.X, handler)` 清理所有监听，否则扩展禁用后仍会处理事件，且随禁用/启用次数累积。

9. **DOMPurify 缺失导致 XSS**：将 LLM 输出或用户输入插入 DOM 前必须用 `SillyTavern.libs.DOMPurify.sanitize()` 净化，尤其是拼接 HTML 字符串的场景。

10. **generate_interceptor 必须挂 globalThis**：函数只在模块作用域声明不够，ST 框架通过字符串函数名在 `globalThis` 查找。挂错不报错，静默失效，极难排查。

11. **`requires` 字段已基本无效**：SillyTavern-Extras 项目已标记为 OBSOLETE，新扩展不要在 `requires`/`optional` 填写 Extras 模块名；留空数组即可（`[]`）。

---

## 15. 悬案（未决项与验证路径）

以下条目置信度为 medium 或 low，施工前需真机验证。**low 置信度项禁止直接施工。**

### U15.1 SMOOTH_STREAM_TOKEN_RECEIVED 与 STREAM_TOKEN_RECEIVED 是否同一事件

**置信度**：high [运行时源码]（已解决，从悬案升级）

v1.14.0 `public/scripts/events.js` 源码直读确认（第 68-70 行）：

```javascript
/** @deprecated The event is aliased to STREAM_TOKEN_RECEIVED. */
SMOOTH_STREAM_TOKEN_RECEIVED: 'stream_token_received',
STREAM_TOKEN_RECEIVED: 'stream_token_received',
```

两者 value 完全相同，均为 `'stream_token_received'`。`SMOOTH_STREAM_TOKEN_RECEIVED` 已被官方在源码中标记 `@deprecated`，**新代码应仅使用 `STREAM_TOKEN_RECEIVED`**。此项无需真机验证，已有确定源码依据。

### U15.2 renderExtensionTemplateAsync 第二参数的文件后缀

**置信度**：high [运行时源码]（已解决，从悬案升级）

v1.14.0 `public/scripts/extensions.js` 源码直读确认（第 126 行）：

```javascript
return renderTemplateAsync(`scripts/extensions/${extensionName}/${templateId}.html`, ...);
```

函数内部固定拼接 `.html` 后缀，第二参数传不带后缀的文件名（如 `'settings'`）即可，实际查找 `settings.html`。**`.handlebars` 后缀不会被识别**。此项无需真机验证，已有确定源码依据。

### U15.3 extensions_settings 与 extensions_settings2 当前是否同时存在

**置信度**：high [运行时源码]（已解决，从悬案升级）

v1.14.0 `public/index.html` 源码直读确认（第 5459、5477 行）：

```html
<div id="extensions_settings" class="flex1 wide50p">
<div id="extensions_settings2" class="flex1 wide50p">
```

两者在同一容器内并排存在于 DOM。无需 F12 验证，此项已确定。

### U15.4 onActivate / APP_INITIALIZED / APP_READY 时序（已裁决）

**置信度**：high [官方文档·发布记录]

三者不是等价入口：`onActivate` 属于扩展自身加载期；`APP_INITIALIZED` 在所有扩展/UI 初始化后、loader 仍在；`APP_READY` 在应用可交互后。剩余验证只针对具体扩展的依赖和性能，不再把三者合并成同一时机。

### U15.5 老式相对 import 在 1.12+ 多用户模式下的路径是否需调整

**置信度**：low [推断]（禁止施工）

1.12+ 多用户模式下扩展路径从 `public/scripts/extensions/third-party/` 迁移至 `data/<user>/extensions/`，但 HTTP URL 仍映射到 `/scripts/extensions/third-party/`。老式相对 import 的层级（`../../../extensions.js`）是基于 HTTP URL 还是文件系统路径计算，在多用户模式下是否还有效，目前无实测数据。

**验证路径**：在 1.12+ 多用户 ST 中，将使用老式 import 的扩展安装到用户作用域（`data/<user>/extensions/`），检查浏览器 Network 面板中 import 解析的实际 URL 是否正确，观察是否有 404 错误。

**此项为 low，禁止直接施工。**

### U15.7 manifest.hooks 的版本边界（已裁决）

**置信度**：high [运行时源码·官方文档·发布记录]

v1.14.0 本地 `public/scripts/extensions.js` 逐行审查后，**未发现任何读取 `manifest.hooks` 字段并调用对应导出函数的代码**：
- `addExtensionScript` 仅以 `<script type="module">` 动态注入 JS 文件
- `enableExtension`/`disableExtension` 仅修改 `disabledExtensions` 数组并刷新页面
- `installExtension`/`deleteExtension` 同样无 hooks 派发逻辑

结论分代：**v1.14.0 无 hooks；v1.17.0 引入 lifecycle hooks；v1.18.0 已核 `clean` 与 `activate` 迁移记录**。新扩展按实际使用的 hook 集设置最低客户端版本；若宣称兼容 v1.14.0，必须另写无 hooks 初始化/清理路径。

### U15.6 localforage 存储 key 命名空间与 ST 核心 token cache 是否隔离

**置信度**：medium·推导未验证 [推断]

ST 核心自身也使用 localforage 缓存 token 等数据，若 key 命名规范不一致可能发生碰撞。

**验证路径**：查看 ST 源码中所有 `localforage.setItem` 调用，统计其 key 前缀规律；确认扩展使用 `${MODULE_NAME}_xxx` 形式命名是否与核心 key 无冲突。

---

## 16. 插件术语、安装渠道与作用域

### 16.1 四种运行层不要混写

| 名称 | 运行位置 | 安装/携带方式 | 主册 |
|---|---|---|---|
| UI Extension | ST 浏览器宿主 | 用户/管理员安装扩展仓库 | D5 |
| Server Plugin | ST Node.js 服务端 | 管理员放入 `plugins/` 并启用 | D5 |
| Tavern Helper 卡内脚本 | TH 管理的卡片脚本 iframe | 随卡数据/脚本树携带 | E5 |
| STScript / Quick Replies | ST 命令与快捷回复运行时 | 用户配置/导入 | B2 |

它们都可能被口语称为“插件”，但权限、生命周期、API 和分发完全不同。尤其不能把卡内脚本的 `eventOn/getButtonEvent` 写进 UI Extension，也不能把 `SillyTavern.getContext()` 当作 TH iframe 全局能力。

### 16.2 三类安装渠道

1. **内置功能**：随 ST 安装，由设置开关控制；
2. **官方内容索引/可安装扩展**：从当前官方登记源发现，仍需用户确认；
3. **第三方仓库 URL**：用户直接安装，信任与兼容审查责任更高。

“在官方索引出现”不等于安全审计担保；“仓库 star 多”也不等于适合当前版本。安装前仍要检查 manifest、入口、网络和权限。

### 16.3 当前用户与全体用户

多人 ST 实例中要记录：

- 谁发起安装；
- 安装在 current-user 还是管理员/全体用户作用域；
- 设置是用户独立还是服务端共享；
- 更新/卸载是否会影响其他用户；
- Server Plugin 是否由实例管理员批准。

角色卡作者通常无权替用户或管理员作这些决定。

---

## 17. 依赖、更新、卸载与安全审查

### 17.1 `manifest.dependencies`

当前官方规则中，依赖使用扩展文件夹路径标识。依赖缺失或被禁用时，依赖它的扩展不应加载。示意：

```json
{
  "display_name": "My Extension",
  "version": "1.2.0",
  "dependencies": [
    "third-party/base-extension"
  ]
}
```

精确路径和字段行为随目标版本核验。不要把历史 `requires/optional`（SillyTavern-Extras 模块）与当前扩展依赖混为一谈。

### 17.2 安装前审查清单

- 仓库、作者、许可证、最近维护状态；
- manifest 的入口、最低客户端版本、依赖、`auto_update`；
- `index.js` 是否读取聊天、角色、settings、密钥或 Cookie；
- 是否修改 prompt、拦截 generation、注册工具或命令；
- 是否访问父窗口、注入未净化 HTML、使用 `eval/new Function`；
- 网络请求目标、上传数据和遥测；
- 是否包含/要求 Server Plugin；
- 是否静默安装其他扩展；
- 启用/禁用/删除时能否清理监听、DOM、timer 和持久数据。

UI Extension 处于浏览器同源环境，可访问 ST DOM 和 context，不是“只能改颜色”的安全沙箱；Server Plugin 更无沙箱并可访问文件系统。二者都属于主动代码信任边界。

### 17.3 `auto_update` 的边界

`auto_update` 的精确语义是随 ST 包版本更新流程自动更新扩展，不等于任何时刻后台自动追踪最新 commit。指南、README 和 UI 不能把它描述成万能自动更新器。

### 17.4 更新流程

```text
记录当前 remote/branch/commit/version
→ 导出重要设置
→ 阅读 changelog 和最低 ST 版本
→ 检查依赖与迁移
→ 更新
→ 重载
→ smoke：启动/UI/事件/生成/设置/禁用
→ 失败则回到已核 commit
```

生产实例不建议永久跟随未锁定的开发分支。至少记录最后已核 commit，才能真正回滚。

### 17.5 禁用、卸载与清理

| 动作 | 预期 |
|---|---|
| 禁用 | 停止监听/拦截/DOM；默认保留设置 |
| 启用 | 幂等恢复一次，不重复绑定 |
| 卸载 | 删除扩展代码；是否删数据要明确 |
| Clean | 按 hooks/当前版本契约清理扩展数据 |
| 重装 | 保持或迁移设置的行为要写入 README |

卸载 UI 不应留下全局事件、prompt 注入、style 或菜单按钮。Server Plugin 卸载前必须停止路由、任务和文件句柄。

---

## 18. 角色卡依赖 UX、兼容矩阵与回滚

### 18.1 不虚构卡片级 dependencies 字段

Character Card 规范没有等价于 UI Extension manifest 的原生 `dependencies` 安装语义。角色卡依赖插件时应：

- 在 creator notes 清楚列出；
- 在开局页/状态栏运行时做能力检测；
- 给出缺失、禁用、版本过低的区别；
- 提供安装链接或手动步骤；
- 用户明确确认后才调用任何安装能力；
- 不让卡片静默安装第三方代码。

### 18.2 能力检测优先于版本字符串

```javascript
function detectRequirements() {
  return {
    tavernHelper: typeof window.TavernHelper === 'object',
    requiredApi: typeof window.someRequiredApi === 'function',
    requiredEvent: Boolean(window.tavern_events?.CHAT_CHANGED),
  };
}
```

版本号用于诊断和最低门；真正启动仍检查所需函数、事件和 DOM。版本相同但安装分支、禁用状态或构建差异都可能导致能力不同。

### 18.3 缺依赖时的产品状态

至少选择一种并明示：

- **阻断**：核心玩法无法成立，停止并给安装/重试；
- **只读降级**：可看叙事和静态状态，禁止写入；
- **功能降级**：隐藏依赖功能，正常聊天继续；
- **开发预览**：仅供作者检查 UI，不伪装已经持久化。

空白、按钮无反应和控制台报错都不是降级方案。

### 18.4 兼容矩阵

| ST 版本 | 插件版本/commit | 关键 API | 已核日期 | 结果 | 降级/回滚 |
|---|---|---|---|---|---|
| 最低支持版 | 固定 | hooks / context / event | YYYY-MM-DD | 通过/限制 | 兼容初始化 |
| 当前发布版 | 固定 | 同上 + 新能力 | YYYY-MM-DD | 通过 | 已核 commit |

矩阵还应记录浏览器、多人模式、移动端、其他关键扩展。不要写“支持最新版”而没有核验日期。

### 18.5 最小 smoke

1. 冷启动只初始化一次；
2. 设置 UI 可读写并刷新保持；
3. 关键事件触发一次；
4. 生成拦截可启用/禁用，不污染 quiet/swipe；
5. 依赖禁用时本扩展不加载或明确降级；
6. 禁用后无 DOM、listener、prompt 残留；
7. 更新迁移成功；
8. 回到已核 commit 后设置仍可恢复；
9. 若有 Server Plugin，鉴权、路径、退出和文件权限单测；
10. 角色卡依赖门不会静默自动安装。

---

## 来源索引

| 来源 | 置信度等级 | 用途 |
|---|---|---|
| [UI Extensions 官方文档](https://docs.sillytavern.app/for-contributors/writing-extensions/) | high | 主力参考，多源验证 |
| [Server Plugins 官方文档](https://docs.sillytavern.app/for-contributors/server-plugins/) | high | 第 13 章 |
| [SillyTavern Releases](https://github.com/SillyTavern/SillyTavern/releases) | high | 2026-07-14 当前发布快照与 hooks 版本裁决 |
| [SillyTavern-Content](https://github.com/SillyTavern/SillyTavern-Content) | high | 当前内容索引；收录流程仍以当日官方说明为准 |
| [events.js 源码（staging branch）](https://github.com/SillyTavern/SillyTavern/blob/staging/public/scripts/events.js) | medium·版本漂移 | staging 约 150 个事件，v1.14.0 仅 89 个；见第 6.2 节版本注意 |
| v1.14.0 本地源码（`public/scripts/events.js`、`st-context.js`、`extensions.js`、`lib.js`）| high [运行时源码] | 本次校准主力依据 |
| [city-unit/st-extension-example](https://github.com/city-unit/st-extension-example) | high | 最简第三方示例（第 3.2、3.3 章） |
| [Extension-TopInfoBar manifest](https://github.com/SillyTavern/Extension-TopInfoBar/blob/main/manifest.json) | high | 带 i18n 官方示例 |
| [Extension-MessageLimit manifest](https://github.com/SillyTavern/Extension-MessageLimit/blob/main/manifest.json) | high | 带 generate_interceptor 官方示例 |
| [DeepWiki Extension Architecture](https://deepwiki.com/SillyTavern/SillyTavern/8.1-extension-architecture-and-apis) | medium·单源孤证 | AI 生成的文档索引，非第一手官方来源；第 10 章参考 |
| [DeepWiki Extension Development Guide](https://deepwiki.com/SillyTavern/SillyTavern/10.2-extension-development-guide) | medium·单源孤证 | AI 生成的文档索引，非第一手官方来源；综合参考 |
| [Extension-ReactTemplate](https://github.com/SillyTavern/Extension-ReactTemplate) | medium | Webpack+React 打包模板（第 12 章） |
| [ST 1.12.0 Migration Guide](https://docs.sillytavern.app/installation/st-1.12.0-migration-guide/) | high | 多用户路径变化背景（悬案 U15.5） |
