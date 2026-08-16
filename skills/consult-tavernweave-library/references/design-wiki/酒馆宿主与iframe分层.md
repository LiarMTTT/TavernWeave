---
title: 酒馆宿主与 iframe 分层
created: 2026-08-13
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - sillytavern
  - tooling
sources:
  - 角色卡工作区/ST开发指南DB/C1_前端基础-TavernHelper与iframe.md
  - 角色卡工作区/ST开发指南DB/C2_前端应用-状态栏与控制中心.md
  - 角色卡工作区/ST开发指南DB/C3_HTML美化与CSS.md
  - 角色卡工作区/ST开发指南DB/A5_渲染管线与宏.md
  - 角色卡工作区/ST开发指南DB/C12_抽屉式状态栏-移动端方案.md
  - 角色卡工作区/ST开发指南DB/D7_移动端与响应式适配.md
  - https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/基本用法/渲染器.html
  - https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/功能详情/其他工具函数.html
  - https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/chats.js
  - 角色卡工作区/星月/星月 4.0.0/components/options_bridge.js
  - 角色卡工作区/怪谈笔记/components/scripts/kdn_bridge.js
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme
  - https://web.dev/articles/sandboxed-iframes
  - https://fs.spec.whatwg.org/
  - https://wicg.github.io/file-system-access/
  - https://www.w3.org/TR/appmanifest/
  - https://www.w3.org/TR/badging/
  - https://w3c.github.io/web-share-target/
  - https://github.com/w3c/web-share-target
  - https://zagjs.com/guides/composition
  - https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
knowledge_class: factual
---

# 酒馆宿主与 iframe 分层

卡前端不是一张网页。先认**谁造了这个窗**，再决定 `window` / `document` / `$` / `Mvu` 还在不在。卡侧 `data-*` 协议见 [[concepts/角色卡DOM与挂载点]]；口语总表见 [[concepts/角色卡前端名词中英对照]]。

SillyTavern **release** 分支 `chats.js`（2026-08-13 直读）确认：ST 自己把消息渲进 `.mes_text`，给 class 加 `custom-` 前缀。**ST 框架不给角色卡开 iframe。** 楼里能跑 JS 的框，是酒馆助手（JS-Slash-Runner）或卡自己塞进去的。

## 先分两条渲染路

| 路 | 谁渲 | 产物 | 能不能跑 `<script>` |
|---|---|---|---|
| ST 消息楼 | SillyTavern `messageFormatting()` → DOMPurify | `.mes .mes_text` 里的 HTML | 不能。脚本被剥掉 |
| TH 前端界面 | 酒馆助手渲染器 | 独立 iframe（像一张小网页） | 能。TH 再注入 API |

TH 官方条件（[渲染器](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/基本用法/渲染器.html)）：

1. 内容包在 Markdown 代码块里（三个反引号）；
2. 块里同时有 `<html>` 和 `</html>`。

稳定卡的状态栏正则 Replace With 就是这种代码块。OMNI / 气泡 / 行动选项**不是**这条路：它们是正则直写进 `.mes_text` 的碎片 HTML，走 ST 净化，不进 TH iframe。

社区先例：阡濯「html 代码注入器」用代码块换界面；TH 文档写明最初灵感来自它。本 Wiki 记机制，不搬第三方卡。

## iframe 全表

从外到内。名字混了就会把 `getVariables` 写进没有 TH 的窗。

| 中文 | 标识 / 形态 | 谁创建 | `window` 里有什么 | 稳定卡用法 |
|---|---|---|---|---|
| 宿主页 | SillyTavern 主文档，不是 iframe | ST | ST 自己的 jQuery、输入框、主题 CSS 变量 | 小手机挂 `body`；选项桥改 `#send_textarea`；魔棒挂 `#extensionsMenu` |
| 脚本框 | `TH-script--{脚本名}--{脚本id}` | TH，跑卡内/全局脚本 | TH 注入的全局函数、`$`、`_`、`eventOn` | 控制中心、媒体库、Zod 脚本 |
| 消息框 / 前端界面 | `TH-message--{楼层号}--{该楼第几个界面}` | TH，把 ` ```html ` 渲成 iframe | 同上；另有 `getCurrentMessageId()` | 状态栏整页 HTML（交错卡内 HUD；星月薄壳也走这条） |
| TH 的 Blob URL 模式 | 扩展设置「启用 Blob URL 渲染」 | TH 可选 | 仍是 TH 前端界面，只是 `src` 换成 blob，方便看日志 | 和卡 git-mount **不是同一件事**。部分浏览器不支持 |
| 卡内真身框 | `blob:` URL 或卡自己写的 `<iframe id="xy-sb-inner">` | 卡 | **默认没有** TH 全局。星月必须 `injectBridge` | 星月 git-mount 拉 `status-bar.html` |
| 抽屉/浮窗外壳里的内容框 | HUD session 再套一层 iframe | 卡，挂在宿主 | 看外壳怎么 bridge | 星月移动抽屉 / 桌面浮窗 |
| 研究页框 | 世界书编辑器里带 sandbox 的外链 iframe | 工坊 UI | 故意锁死 | 不是 HUD |

官方 `getIframeName()`：[其他工具函数](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/功能详情/其他工具函数.html)。指南 C1 还记过短名 `TH-message-N`；对账以双横线官方格式为准。

```text
宿主页  (SillyTavern)
 ├─ 脚本框 TH-script--…          控制中心 / 媒体库 / Zod
 ├─ #chat .mes[mesid]
 │    └─ .mes_text
 │         ├─ 净化后的碎片 HTML     OMNI / 气泡 / 选项  ← 不是 iframe
 │         └─ 消息框 TH-message--楼号--序号
 │              └─ （星月）blob 真身框
 ├─ 抽屉 / 浮窗外壳               挂宿主，不是挂消息楼
 └─ 小手机 #xy-phone-root 等      挂宿主 body
```

隔离事实（生产卡已踩）：

- 脚本框和消息框**不是同一个 `window`**。`window.XY_RT_BASE` 经常到不了状态栏壳。
- blob 真身再隔一层：没有 `$` / `Mvu` / `getVariables`，见 [[concepts/git挂载与远程真身]]。
- 不同楼的消息框互相看不见，要经 `parent`、chat 变量或 `eventEmit`。
- `window.parent` 在同源时是 ST 主窗；跨域会抛 SecurityError，生产代码用 `hostWindow()` / `hostDocument()` 包 try/catch。

## 宿主 chrome（私有 DOM，不是公开 API）

E5 已经写：挂 `#extensionsMenu` 依赖 ST 私有 DOM。切版本可能改名。下列是三张稳定卡和 C12 **实际摸过的**节点，不是把 `index.html` 抄一遍。

| 选择器 | 含义 | 谁在用 |
|---|---|---|
| `#chat` | 聊天列表容器 | 主题 / 量宽 |
| `.mes` | 一条消息楼 | ST 自己；`$(`.mes[mesid="${id}"]`)` 出自 `chats.js` |
| `[mesid]` | 楼号属性 | ST；不是 `data-message-id` |
| `.last_mes` | 最新楼 | 常见口语；以运行时 class 为准 |
| `.mes_text` | 消息正文槽。净化后的 HTML 进这里 | 渲染管线终点 |
| `.mes_reasoning` | 推理块 | `chats.js` 与 `.mes_text` 并列绑点击 |
| `#sheld` | 主聊天壳 | 移动端安全区、`--sheldWidth` |
| `#form_sheld` / `#send_form` | 底部发送区 | C12 量软键盘避让 |
| `#send_textarea` | 玩家输入框 | `options_bridge.js`、`kdn_bridge.js` |
| `#send_but` | 发送按钮 | C10：若走宿主发送链会摸它 |
| `#extensionsMenu` / `.extensionsMenu` | 魔棒菜单 | 控制中心入口；没有就回退 `document.body` |
| `#top-settings` / `#navbar` / `#sheld_header` | 顶栏 chrome | C12 量抽屉别挡住 |

输入框不要直接 `input.value = …` 当正式发送。稳定卡走酒馆助手：`/setinput` 填、`/send \| /trigger` 直发。

## TH iframe 里预注入的全局

C1 + 官方文档。主体在任意 TH iframe 里可用，**不要假设宿主页或 blob 真身也有**。

| 符号 | 来源 | 干什么 |
|---|---|---|
| `window.SillyTavern` | ST，TH 保证刷新 | `getContext()` 等；完整 key 以真机为准 |
| `window.TavernHelper` | TH | 封装 API；也有自由函数形态 |
| `eventOn` / `eventEmit` / `iframe_events` / `tavern_events` | TH（JS-Slash-Runner 注入） | 事件。`eventOn` 返回 `{ stop() }` |
| `getVariables` 等 | TH | 变量。作用域 `chat` / `global` / `message` / `script`… |
| `getIframeName` / `getCurrentMessageId` / `getScriptId` / `reloadIframe` | TH | 认窗。标 🚫TavernHelper 的是底层工具，文档单独列出 |
| `$` / `_` / `z` / `YAML` / `toastr` | TH 内置库 | blob 真身默认**没有** |
| `Vue` / `PIXI` / `builtin` | 文档有，生产卡主路径未当依赖 | medium，未走 |
| `Mvu` | MagVarUpdate，`initializeGlobal` | 不是 TH 内置；先 `waitGlobalInitialized('Mvu')` |

iframe 生命周期事件（`iframe_events`）：

| 常量 | 字符串 | 回调 |
|---|---|---|
| `MESSAGE_IFRAME_RENDER_STARTED` | `message_iframe_render_started` | `(iframe_name)` |
| `MESSAGE_IFRAME_RENDER_ENDED` | `message_iframe_render_ended` | `(iframe_name)` |
| `GENERATION_STARTED` | `js_generation_started` | `(generation_id)` |
| `GENERATION_ENDED` | `js_generation_ended` | `(text, generation_id)` |
| `STREAM_TOKEN_RECEIVED_FULLY` | `js_stream_token_received_fully` | `(full_text, generation_id)` |
| `STREAM_TOKEN_RECEIVED_INCREMENTALLY` | `js_stream_token_received_incrementally` | `(incremental_text, generation_id)` |

楼层 iframe 何时销毁（翻页 / swipe / 新消息）仍是指南悬案 U7，本页不假装已测。

## 消息楼净化词（不是 iframe 的那条路）

ST `chats.js` `addDOMPurifyHooks()` + `encodeStyleTags` / `decodeStyleTags`（release 直读）：

| 词 | 实际做什么 |
|---|---|
| `MESSAGE_SANITIZE` | 这条 DOMPurify 配置开了，才改 class |
| `custom-` 前缀 | 每个 class token 前面加 `custom-`。豁免：`fa-*`、`note-*`、`monospace`；已是 `custom-` 开头的不再加 |
| `menu_button` | `MESSAGE_ALLOW_SYSTEM_UI` 时 BUTTON/DIV 可保留系统 UI class |
| `<style>` → `<custom-style>` | 进 DOMPurify 前 encode；出来再 decode。**不是**把 `style=""` 改名 |
| `.mes_text ` 前缀 | decode 时给 CSS 选择器加作用域，防污染别的楼 |
| `ADD_TAGS: ['custom-style']` | 1.14.0 / 当前 release 仍是这个自定义标签 |
| `data-*` / `aria-*` | DOMPurify 默认放行，所以协议写属性 |

因此：碎片 HTML（OMNI、气泡、选项）选择器用 `[data-*]`。TH iframe **内部**自己的文档不受这套 class 改写；但模板一旦漏进 `.mes_text` 仍会被改。

## 视口、单位、高度

| 词 | 含义 |
|---|---|
| `vw` / `vh` | 在 TH 消息 iframe 里相对**这个 iframe**，不是浏览器视口。TH 文档专项警告 |
| `min-height: *vh` | TH 会改成相对浏览器高度，防 iframe 被自己撑死循环 |
| `window.frameElement` | 内层脚本摸外层 `<iframe>` DOM，用来改高度 |
| `syncHeight` + `ResizeObserver` | 星月壳把内层高度同步到外层 |
| `visualViewport` | 软键盘 / 浏览器 chrome 变化；C12 抽屉要听它 |
| `env(safe-area-inset-*)` | 刘海 / Home 条。宿主 `#sheld`、PWA `body.PWA` 已补 |
| `--sheldWidth` / `--fontScale` / `--SmartThemeBodyColor` | 写在宿主 `documentElement`，iframe **不继承**。同源才能 `parent` 去读 |
| `@media (max-width: 1000px)` | ST 宿主主断点，侧栏变全屏抽屉 |
| `1000px` vs 卡片内 `600px` | 不是同一套断点。卡片不要调用宿主 `isMobile()`（module 导出，iframe 拿不到） |
| `movingUI` | ST 可拖面板。C13：不当角色卡公开 API |

TH 高度：稳定卡不靠社区常见的 `postMessage { type: 'frameHeight' }`；靠 TH 自适应或自己 `syncHeight`。

跨文档视觉约束（不改上表）：

- 跨文档 iframe 的 `backdrop-filter` 糊不到宿主聊天区；磨砂只能做在本框，或改挂宿主文档。
- 上表里的 `--sheldWidth` 等宿主 CSS 变量仍不继承；但 `color-scheme` 会传入 iframe。
- Shadow DOM 只抗样式泄漏，不是安全边界。
- 对照见 [[comparisons/嵌入三路径对照]]；审美链接见 [[queries/前端视觉与灵感站点蒸馏目标]]；前端名词取舍见 [[concepts/前端架构名词与取舍]]。

## OPFS 与本机选取

两套文件系统，不要并成「浏览器能读写盘」。

| 词 | 规范位置 | 入口 | 用户看见什么 |
|---|---|---|---|
| OPFS（源私有文件系统） | [WHATWG File System 活标准](https://fs.spec.whatwg.org/) | `navigator.storage.getDirectory()` | 该源自己的桶，不先弹本机选文件夹 |
| 本机选取（File System Access） | 仍是 [WICG 社区稿](https://wicg.github.io/file-system-access/) | `showOpenFilePicker` / `showSaveFilePicker` / `showDirectoryPicker` | 用户挑本机文件或目录 |

酒馆卡 iframe 即使碰到这些 API，桶也跟该框的 origin / `blob:` 有关，不是「打开用户文件夹」。

## 卡 iframe 无 OS 安装面

Web App Manifest、应用徽章、Share Target、文件处理都挂在**已安装的顶层 Web 应用**上。酒馆卡 iframe 没有这层安装面，下列能力**不自动落到卡**。

| 能力 | 现行入口 | 为什么落不到卡 |
|---|---|---|
| Web App Manifest | [W3C WD 2026-08-13](https://www.w3.org/TR/appmanifest/) | 清单描述启动 URL、图标、`display`、作用域；登记的是顶层已安装应用 |
| 徽章 | [Badging API WD](https://www.w3.org/TR/badging/) | `setAppBadge` 写的是已安装应用在主屏 / Dock 上的角标 |
| Share Target | 无 TR；[仓已于 2026-06-30 归档](https://github.com/w3c/web-share-target) | 草稿仍在 [w3c.github.io](https://w3c.github.io/web-share-target/)；要进系统分享面板，且通常要求已安装 |
| 文件处理 | [WICG manifest-incubations `file_handlers`](https://wicg.github.io/manifest-incubations/#file_handlers-member) | 不在 appmanifest TR 里；是「用已安装 PWA 打开这类文件」 |

## 入口与外壳词（窗在哪，按钮是什么）

| 中文 | 标识 | 挂哪 |
|---|---|---|
| 魔棒 / Wand | `#extensionsMenu` | 宿主 |
| 悬浮球 / launcher | C11 `OrbEntry` | 宿主；只 `dispatch(actionId)` |
| 命令注册表 | command registry | 入口层，不读 `stat_data` |
| HUD session | `phase: idle/loading/ready/failed` | 抽屉和浮窗共用核心 |
| 抽屉壳 | DrawerShell | 宿主视口边缘，不要写进消息 iframe |
| 浮窗壳 | FloatingShell | 宿主；不要在消息 iframe 里 `position:fixed` 装浮窗 |
| 同层前端 | C5 | 首楼当整场 App。三张稳定卡**未走** |
| 独立前端 | C6 | 脱离 ST。未走 |

## 跨窗怎么说话

| 路径 | 干什么 |
|---|---|
| `hostWindow()` / `hostDocument()` | 摸输入框、魔棒、`body` |
| `getVariables` / chat 变量 | 持久状态总线 |
| `eventOn` / `eventEmit` | 通知刷新 |
| `initializeGlobal` / `waitGlobalInitialized` | 脚本框把 `Mvu` 等接口交给别的框 |
| `injectBridge` | 只给**没有 TH** 的 blob 真身补全局 |
| `postMessage` | 浏览器标准；本项目高度同步未走这条 |

`reloadIframe()` 等于 `location.reload()`，会弄丢已 `initializeGlobal` 的接口。

## Zag `getRootNode`：浮层对到对的 document

Zag 用 `document.querySelectorAll` / `getElementById` 找触发器和浮层。iframe、Shadow DOM 里，全局 `document` 常常不是组件所在的那棵树。机器上下文要传 `getRootNode`，返回**这个组件所在的** `Document` 或 `ShadowRoot`。

映射：状态栏消息框、blob 真身、抽屉/浮窗外壳、宿主页是不同 `document`。Tooltip / popover / 菜单必须挂在触发器那一棵树上。这是跨文档根，不是「本仓库已采用 Zag」。详页见 [[concepts/无头组件与根节点]]。

## PWA 行业句；卡 iframe 不是 PWA

行业事实（对已安装或顶层站点）：Safari 在连续七日无交互时可清脚本可写存储；缓存里的 opaque 跨源响应用于配额时会被垫高。见 [WebKit 2020-03-24](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)、[MDN 配额](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)。

映射：卡 iframe 不是 PWA。没有 OS 安装面，也没有独立于 Safari 的「主屏应用」计数。不要把七天清除或 opaque 虚报配额当成「状态栏 iframe 的存储合同」。卡侧持久状态仍走 chat 变量、`eventOn` / `eventEmit` 和宿主桥。

## 边界

- JS-Slash-Runner 许可证不是开源；本页只用官方文档和指南已公开的符号，不搬扩展源码。
- ST 选择器是私有 DOM，版本会变。新代码优先 TH API（`/setinput`、`triggerSlash`），宿主 querySelector 当有界适配。
- 指南回源基准多是 ST v1.14.0；`chats.js` 的 `custom-` 钩子在 2026-08-13 的 **release** 仍在。API 签名以当前安装为准。
- Vue / PIXI / 数据库同层 / Live2D：总图标未走，本页不展开。
- OPFS 是 WHATWG 活标准；本机选取仍是 WICG。两者都不是「卡能读写用户磁盘」。
- 酒馆卡 iframe 无 OS 安装面：Manifest / 徽章 / Share Target / 文件处理不自动落到卡。
- Share Target 无 TR，`w3c/web-share-target` 已归档。
- Zag `getRootNode` 是跨文档根映射，不是本仓库采用 Zag。
- 卡 iframe 不是 PWA。

## 相关内容

- [[concepts/角色卡前端名词中英对照]]
- [[concepts/角色卡DOM与挂载点]]
- [[concepts/角色卡技术路径总图]]
- [[concepts/消息渲染与正则管线]]
- [[concepts/git挂载与远程真身]]
- [[concepts/入口外壳与HUD宿主]]
- [[concepts/小手机与宿主桥]]
- [[concepts/控制中心与状态栏]]
- [[concepts/斜杠命令与宿主发送链]]
- [[comparisons/三张稳定卡前端对照]]
- [[comparisons/嵌入三路径对照]]
- [[queries/前端视觉与灵感站点蒸馏目标]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/无头组件与根节点]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
