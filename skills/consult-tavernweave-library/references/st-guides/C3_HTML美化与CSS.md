# HTML 美化与 CSS 参考手册

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

> 面向 SillyTavern 角色卡开发的可检索参考文档
> 收集日期：2026-06-28 ｜ 回源基于 SillyTavern v1.14.0 + 本地成熟卡（星月 2.5.0 / 交错宙域 2.6.0）
>
> 2026-07-14 增补导航：把首楼消息界面扩展成单楼层完整游玩应用时见 **《C5_同层前端.md》**，其消息 HTML、iframe、DOMPurify 与 CSS 基础仍由本册提供；把单张角色卡直接发行成 Web / App / PC 程序时见 **《C6_独立前端.md》**。C6 中程序本身就是角色卡，不继承 ST 的 DOMPurify、消息 iframe 或 TavernHelper 环境，必须由该作品自己的运行时承担渲染与安全边界。

---

## 目录

0. [置信度分级体系（全手册适用）](#0-置信度分级体系全手册适用)
1. [机制总览：HTML 注入管线](#1-机制总览html-注入管线)
2. [DOMPurify 安全屏障](#2-dompur​ify-安全屏障)
3. [iframe：唯一完整逃逸机制](#3-iframe唯一完整逃逸机制)
4. [CSS 变量系统与主题色板](#4-css-变量系统与主题色板)
5. [布局范式](#5-布局范式)
6. [动画范式](#6-动画范式)
7. [毛玻璃浮层范式](#7-毛玻璃浮层范式)
8. [Tab 系统：纯 CSS radio-hack](#8-tab-系统纯-css-radio-hack)
9. [动态主题色切换（JS 写入 CSS 变量）](#9-动态主题色切换js-写入-css-变量)
10. [iframe 内 JS 变量读取链路](#10-iframe-内-js-变量读取链路)
11. [iframe 工程辅助函数](#11-iframe-工程辅助函数)
12. [ST 内置 CSS 变量与 Custom CSS 惯例](#12-st-内置-css-变量与-custom-css-惯例)
13. [高频避坑清单](#13-高频避坑清单)
14. [悬而未决：需真机验证的问题](#14-悬而未决需真机验证的问题)

---

## 0. 置信度分级体系（全手册适用）

> **收集日期统一声明**：本手册全部条目收集于 **2026-06-28**，回源核实基于本地 SillyTavern **v1.14.0** + 本地生产状态栏 `星月2.5.0/components/status_bar_regex_beauty_r5.html`（262 KB，以下简称「r5」）。依据类型标签以采集时实际来源为准。

每条结论采用 **置信度等级 + 依据类型** 双轴标注。

### 1 置信度三级

| 级别 | 含义 | 判定标准 |
|---|---|---|
| **high** | 已坐实，可直接施工 | 有运行时证据（真机实测 / 读到运行时实现源码 / 生产卡验证）；结论是事实的直接陈述而非下游推导；不在悬案清单 |
| **medium** | 待验证，施工前须实测 | 强制二选一子标签：`medium·单源孤证`（单一来源、无第二源、无实测）/ `medium·推导未验证`（逻辑推导成立但未跑通，**须随附真机验证路径**） |
| **low** | 孤证无源，禁止据此施工 | 零来源猜测 / 纯历史快照（须标年份 + 窄缩适用范围） |

### 2 依据类型标签（与置信度正交，强制标注）

`[运行时源码]`、`[真机]`、`[文档·多源]`、`[文档·单源]`、`[社区]`、`[推断]`、`[历史孤证:年份]`

### 3 两条铁规

1. **「从源码事实再推一步」的下游推导，即使源码本身已直读，该推导结论最高只能 `medium·推导未验证`**——除非已真机验证。
2. **节级标注 = 节内条目下确界**——禁止整节标 high 却内含悬案条目；冲突即拆节，局部降级。

---

## 1. 机制总览：HTML 注入管线

### 核心结论

ST 消息楼层有**两条** HTML 注入路径，两条路径的产物都经过 DOMPurify 净化。

### 路径对比表

| 路径 | 入口 | 触发时机 | DOMPurify 前后 | 来源 | 置信度 |
|---|---|---|---|---|---|
| A：正则扩展 | Extensions → Regex，"Replace With" 字段 | afterMarkdown 前 | 产物进入 DOMPurify | 文档·多源 + 运行时 | **high** [文档·多源] |
| B：Extension messageFormatter 钩子 | `beforeRegex` / `afterRegex` / `afterMarkdown` | 各自阶段 | DOMPurify 之前处理 | 文档·多源 | **high** [文档·多源] |

### 路径 A 使用前提

- 必须在用户设置中关闭 "Show `<tags>` in responses"，否则 HTML 标签会被转义为纯文本显示。  
  **来源**：文档 + 本项目实战 ｜ **置信度**：high [文档·多源]
- 本项目（交错宙域/星月）实战用法：正则匹配消息末尾的 JSON 数据块，替换为注入 iframe 的指令，iframe 内加载完整 HTML 文档。  
  **来源**：r5 文件头即 `<!doctype html>` 完整文档 ｜ **置信度**：high [运行时源码]

### 路径 B 钩子约束

- 所有三个钩子回调必须**同步返回字符串**，不支持 async/Promise 返回。  
  **来源**：ST 扩展开发文档 <https://docs.sillytavern.app/for-contributors/writing-extensions/> ｜ **置信度**：high [文档·多源]

---

## 2. DOMPurify 安全屏障

### 核心结论

DOMPurify 是消息楼层的安全净化层，多项 HTML 特性在此被拦截或转换。各拦截行为置信度不同，施工前需逐条确认。

> **重要纠错（v1.14.0 运行时源码确认）**：`<style>` 标签经 ST 特有的 `encodeStyleTags()` → DOMPurify → `decodeStyleTags()` 三步管线处理（标签替换为 `<custom-style>`，不是属性替换）；`class` 属性值逐词加 `custom-` 前缀（有豁免规则）；内联 `style=""` 属性**不被**重命名，由 DOMPurify 直接通过。

### 拦截行为汇总表

| 行为 | 描述 | 来源 | 置信度 |
|---|---|---|---|
| `<style>` → `<custom-style>`（标签替换，非属性替换） | `<style>` 块在进入 DOMPurify 前被 `encodeStyleTags()` 改写为 `<custom-style>` 自定义标签（内容 URL 编码），DOMPurify 放行，再由 `decodeStyleTags()` 还原并加 `.mes_text ` 选择器前缀。**内联 `style=""` 属性不受此影响**，其本身在 DOMPurify 默认属性白名单内 | chats.js `encodeStyleTags/decodeStyleTags` 直读 | **high** [运行时源码] |
| ~~`style=""` → `custom-style=""`~~ | **此说法错误**：上方已更正。`custom-style` 是标签名，不是属性名；内联 `style=""` 属性在 DOMPurify 默认 html 属性白名单中（purify.js 第200行可见），**不会**被重命名 | chats.js + purify.js 直读 | **high** [运行时源码]（旧说法已废止） |
| `class` 属性被加 `custom-` 前缀 | DOMPurify `uponSanitizeAttribute` hook（chats.js 第1927–1935行）将所有 `class` 值逐词加 `custom-` 前缀；**豁免**：以 `fa-` 或 `note-` 开头、或恰好等于 `monospace` 的词保持原样。原悬案 B 已解决 | chats.js 第1927–1935行直读 | **high** [运行时源码] |
| `<script>` 彻底剥除 | 消息楼层内不能执行 JS | DOMPurify 默认行为 | **high** [文档·多源] |
| `<thought>` 等非标准标签被过滤 | 自定义标签丢失或变纯文本 | issue #4688 | **high** [社区] |
| `<body>` 选择器不生效 | 消息内注入的 `<style>` 里 `body {}` 不影响容器内样式 | issue #4688 | **high** [社区] |
| 常见 HTML 标签被允许 | `<div>` `<span>` `<p>` `<table>` 等保留 | DOMPurify 默认白名单 | **high** [文档·多源] |
| `data-*` / `aria-*` 属性默认允许 | `ALLOW_DATA_ATTR = true`（purify.js 第422行），`ALLOW_ARIA_ATTR = true` | DOMPurify purify.js 直读 | **high** [运行时源码] |
| CSS 变量在内联 `style` 中是否可读 | `style=""` 属性本身被允许通过；但 `style="--var:val"` 能否被 CSS 解析为变量仍依赖浏览器行为，见第 14 章悬案 A | — | medium·推导未验证 |

### 避坑

- 所有需要 JS 执行或完整 CSS 作用域的功能，**唯一可靠路径是 iframe**（`iframe` 标签在 DOMPurify 默认 `DEFAULT_FORBID_CONTENTS` 中——见悬案 C，但经 Tavern Helper 注入后 iframe 内部是独立文档，不受消息楼层 DOMPurify 管线影响）。
- 消息楼层注入的 `<style>` 块中，选择器必须写在具体容器类名下，绝不用 `body` 选择器。
- `class` 属性值所有词均被加 `custom-` 前缀（豁免：`fa-*`、`note-*`、`monospace`）；在 Custom CSS 中引用时需使用 `custom-` 前缀版本，或用 iframe 完全绕开。

---

## 3. iframe：唯一完整逃逸机制

### 核心结论

iframe 是本项目（交错宙域/星月）经生产验证的核心范式。iframe 内部是独立 HTML 文档，完全绕开消息楼层的 DOMPurify 限制：内部 `<style>`、`<script type="module">`、自定义类名均可正常工作。

**来源**：r5 本地运行时源码 ｜ **适用版本**：ST v1.14.0 + Tavern Helper 扩展 ｜ **置信度**：high [运行时源码]

### iframe 能力边界表

| 能力 | iframe 内 | 消息楼层直接注入 | 置信度 |
|---|---|---|---|
| `<style>` CSS 完整生效 | 是 | 部分（受 DOMPurify 约束） | high [运行时源码] |
| `<script>` JS 执行 | 是 | 否（被 DOMPurify 剥除） | high [运行时源码] |
| 自定义类名完整匹配 | 是 | 受 `custom-` 前缀影响 | high [运行时源码] |
| 内联 `style=""` 生效 | 是 | **是**（DOMPurify 允许 `style` 属性；消息楼层内联 style 可通过，但需真机验证在 ST 渲染管线中是否被其他机制影响；iframe 内完全可控） | high [运行时源码]（iframe 内） / medium·推导未验证（消息楼层直注） |
| 读取 ST 变量（`getVariables`） | 是（通过 Tavern Helper 注入的全局函数） | 不适用 | high [运行时源码] |
| `window.parent` 访问宿主页面 | 是（同域时） | 不适用 | high [运行时源码] |

### iframe 悬案

- **正则直接注入的 `<iframe>` 标签是否会被 DOMPurify 过滤**：见第 14 章悬案 C。本项目实战 iframe 工作，但可能是 Tavern Helper 在 DOMPurify 之前介入注入，不能确认原生正则→DOMPurify 路径下 iframe 标签是否保留。

### iframe 高度适应

本项目**不使用** postMessage 高度协商，而是依赖 Tavern Helper 扩展的 iframe 渲染方式自动适应内容高度。  
通用备选方案（postMessage `{ type: 'frameHeight', height: H }`）为标准社区做法，但本项目未实测。  
**来源**：r5 源码观察 ｜ **置信度**：medium·推导未验证（未找到显式 postMessage 调用）

---

## 4. CSS 变量系统与主题色板

### 核心结论

本项目使用两层变量系统：
- **固定结构色**（`:root` 级，不随 Tab/主题切换）
- **动态主题色**（同样在 `:root`，但由 JS `applyTheme()` 按 Tab 切换时写入）

以下代码为生产状态，来自 r5 第 4–39 行。

**来源**：r5 `星月2.5.0/components/status_bar_regex_beauty_r5.html` 第 4–39 行 ｜ **适用版本**：星月 v2.5.0 / 交错宙域 v2.6.0 ｜ **置信度**：high [运行时源码]

### 完整色板代码

```css
:root {
  /* 固定结构色（不随主题变化） */
  --hud-bg-1:        rgba(18,49,74,0.62);
  --hud-bg-2:        rgba(6,18,27,0.68);
  --hud-border:      #2d6d86;
  --hud-text:        #b8d9e8;
  --hud-mute:        #6f9daf;
  --hud-grid-line:   rgba(107,199,242,0.12);
  --hud-title-color: #d9f4ff;
  --hud-title-glow:  rgba(107,199,242,0.55);
  --hud-bg-panel:    rgba(7,19,29,0.45);
  --hud-bg-panel-2:  rgba(3,8,13,0.52);
  --hud-bg-soft:     rgba(107,199,242,0.05);
  --hud-bg-card:     rgba(11,28,41,0.18);
  --hud-control-bg:  rgba(5,15,24,0.42);
  --hud-structure-primary: #4be4ff;
  --hud-structure-glow:    rgba(75,228,255,0.58);
  --hud-structure-low:     rgba(75,228,255,0.16);

  --hud-base-font:  12px;
  --hud-base-width: 100%;

  /* 以下 6 个随 Tab 切换（由 JS applyTheme() 动态写入） */
  --theme-primary: #6bc7f2;
  --theme-glow:    rgba(107,199,242,0.55);
  --theme-accent:  rgba(107,199,242,0.32);
  --theme-soft:    rgba(107,199,242,0.07);
  --theme-mid:     rgba(107,199,242,0.72);
  --theme-low:     rgba(107,199,242,0.16);
}
```

### ST 内置 CSS 变量（部分）

| 变量名 | 含义 | 来源 | 置信度 |
|---|---|---|---|
| `--sheldWidth` | 主聊天容器宽度（由 `power_user.chat_width` 控制） | public/css/file-form.css、logprobs.css 直读 | **high** [运行时源码] |
| `--mainFontSize` | 基础字体大小（由字体缩放设置控制） | public/css/backgrounds.css 直读 | **high** [运行时源码] |
| `--SmartThemeBlurStrength` | 背景模糊强度 | public/css/character-group-overlay.css 直读 | **high** [运行时源码] |

> 注：ST 主题变量完整列表可在 ST 源码 `public/css/` 目录检索 `var(--` 模式获取；以上三个均已在本地 v1.14.0 CSS 中直接读到引用。

---

## 5. 布局范式

### 5.1 HUD 主容器：切角 + 深色渐变背景

**来源**：r5 第 49–70 行 ｜ **置信度**：high [运行时源码]

```css
.hud-container {
  width: 100%;
  max-width: var(--hud-base-width);
  margin: 0 auto;
  box-sizing: border-box;
  padding: 4px;
  position: relative;
  background: linear-gradient(180deg, var(--hud-bg-1) 0%, var(--hud-bg-2) 100%);
  border: 1px solid var(--hud-border);
  border-radius: 0;
  --cut: 14px;
  clip-path: polygon(
    var(--cut) 0,
    100% 0,
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    0 100%,
    0 var(--cut)
  ); /* 左上+右下切角 */
  transition: max-width 0.25s ease;
  font-size: var(--hud-base-font);
}

/* 扫描线背景装饰 */
.hud-container::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(0deg, var(--hud-grid-line) 1px, transparent 1px);
  background-size: 100% 12px;
  opacity: 0.28;
  pointer-events: none; z-index: 1;
}
```

### 5.2 响应式网格系统

**来源**：r5 第 1008–1053 行 ｜ **置信度**：high [运行时源码]

```css
/* 自适应卡片网格 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 4px;
}
.stat-grid.dense {
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 6px;
}

/* 瀑布流布局（用于事件/道具列表） */
.card-grid.reusable-masonry {
  display: block;
  column-width: 320px;
  column-gap: 6px;
}
.card-grid.reusable-masonry > .char-block {
  display: inline-block;
  width: 100%;
  margin: 0 0 6px;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .stat-grid { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); }
  .card-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .tab-btn { flex-basis: calc(25% - 6px); }
}
```

---

## 6. 动画范式

**来源**：r5 第 110–130、946–1005 行 ｜ **置信度**：high [运行时源码]

```css
/* 状态指示灯闪烁 */
@keyframes blink-status {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.85); }
}

/* 元素光晕闪烁 */
@keyframes blink-glow {
  0%, 100% { opacity: 1; text-shadow: 0 0 8px var(--hud-title-color); }
  50% { opacity: 0.3; text-shadow: none; }
}

/* Tab 切换入场 */
@keyframes tab-reveal {
  0%   { opacity: 0; transform: translateY(8px) scale(0.98); filter: blur(2px); }
  100% { opacity: 1; transform: none; filter: none; }
}

/* 模块横向滑入（stagger 延迟） */
.tab-content.active .section-title:nth-of-type(1) { animation-delay: 0.02s; }
.tab-content.active .section-title:nth-of-type(2) { animation-delay: 0.05s; }
.tab-content.active .char-block:nth-of-type(1) { animation-delay: 0.05s; }

@keyframes block-pop {
  0%   { opacity: 0; transform: translateY(8px) rotateX(6deg); transform-origin: top center; }
  100% { opacity: 1; transform: none; }
}

/* 卡片淡入 */
@keyframes card-fade {
  0%   { opacity: 0; transform: scale(0.92); filter: brightness(0.6); }
  100% { opacity: 1; transform: none; filter: brightness(1); }
}
```

---

## 7. 毛玻璃浮层范式

**来源**：r5 第 199–213 行（设置面板） ｜ **置信度**：high [运行时源码]

```css
.settings-surface {
  background: linear-gradient(180deg, var(--hud-bg-panel) 0%, var(--hud-bg-panel-2) 100%);
  border: 1px solid var(--hud-border);
  box-shadow: 0 12px 28px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(230,245,255,0.08),
              0 0 0 1px rgba(212,221,226,0.07);
  backdrop-filter: blur(7px) saturate(1.08) brightness(1.02);
  -webkit-backdrop-filter: blur(7px) saturate(1.08) brightness(1.02);
  /* 斜切角 */
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

/* 内部光泽叠层 */
.settings-surface::after {
  content: '';
  position: absolute; inset: 1px;
  z-index: -1;
  background: linear-gradient(135deg, rgba(190,230,255,0.12), transparent 34%,
              rgba(70,130,170,0.08) 68%, transparent);
  opacity: 0.34;
  pointer-events: none;
}
```

> 注意：`backdrop-filter` 在某些 ST 部署环境（Tauri / 旧版 Electron）可能不生效，见第 14 章悬案 D。

---

## 8. Tab 系统：纯 CSS radio-hack

### 核心结论

本项目 Tab 切换使用纯 CSS radio-hack，**不依赖 JS 控制显示/隐藏**，JS 仅在 Tab 切换时触发主题色更新（见第 9 章）。

**来源**：r5 第 750–789 行 ｜ **置信度**：high [运行时源码]

```css
/* 隐藏 radio 输入 */
.tab-radio {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

/* radio 选中时显示对应内容 */
#hud-tab-env:checked ~ .tab-content#tab-env,
#hud-tab-user:checked ~ .tab-content#tab-user {
  display: block;
  animation: tab-reveal 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 所有未选中的 tab-content 默认隐藏 */
.tab-content { display: none; }

@keyframes tab-reveal {
  0%   { opacity: 0; transform: translateY(8px) scale(0.98); filter: blur(2px); }
  100% { opacity: 1; transform: none; filter: none; }
}
```

---

## 9. 动态主题色切换（JS 写入 CSS 变量）

### 核心结论

按 Tab ID 切换时，JS 动态修改 6 个 `--theme-*` CSS 变量，只影响 `.hud-body` 内部视觉，不影响结构色。  
每个 `tab-btn` 在初始化时通过内联 CSS 变量存储自身颜色，供 hover/active 状态使用。

**来源**：r5 第 1885–1910 行 ｜ **置信度**：high [运行时源码]

```js
// 按 Tab ID 动态切换主题色
function applyTheme(tabId) {
  var primary = getTabAccentColor(tabId || 'tab-env');
  var rgb = hexToRgb(primary);
  var [r, g, b] = rgb;
  var root = document.documentElement;
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-glow',   `rgba(${r},${g},${b},0.55)`);
  root.style.setProperty('--theme-accent', `rgba(${r},${g},${b},0.35)`);
  root.style.setProperty('--theme-soft',   `rgba(${r},${g},${b},0.06)`);
  root.style.setProperty('--theme-mid',    `rgba(${r},${g},${b},0.7)`);
  root.style.setProperty('--theme-low',    `rgba(${r},${g},${b},0.15)`);
}

// 初始化时为每个 tab-btn 写入自身颜色变量（供 hover/active 使用）
$('.tab-btn').each(function(){
  var target = $(this).data('target') || 'tab-env';
  var primary = getTabAccentColor(target);
  var [r, g, b] = hexToRgb(primary);
  this.style.setProperty('--tab-color',    primary);
  this.style.setProperty('--tab-glow',     `rgba(${r},${g},${b},0.62)`);
  this.style.setProperty('--tab-hover-bg', `rgba(${r},${g},${b},0.14)`);
  this.style.setProperty('--tab-active-bg',`rgba(${r},${g},${b},0.26)`);
});
```

---

## 10. iframe 内 JS 变量读取链路

### 全局 API 汇总表

| API | 注入来源 | 用途 | 置信度 |
|---|---|---|---|
| `getVariables({ type: 'message' })` | Tavern Helper | 读当前楼层 JSON 变量（主链路） | high [运行时源码] |
| `Mvu.getMvuData({ type, message_id })` | Tavern Helper | 读 MVU 数据（备用链路） | high [运行时源码] |
| `Mvu.events.VARIABLE_UPDATE_ENDED` | Tavern Helper | 变量更新完毕事件 | high [运行时源码] |
| `updateVariablesWith(fn, { type, message_id })` | Tavern Helper | 写入楼层变量（如批量删除） | high [运行时源码] |
| `waitGlobalInitialized('Mvu')` | Tavern Helper | 等待 MVU 全局就绪 | high [运行时源码] |
| `eventOn(event, callback)` | Tavern Helper | 订阅 ST 事件 | high [运行时源码] |
| `SillyTavern.getContext()` | ST 核心 | 访问 chat/characters/chatMetadata（扩展 JS 中用） | high [文档·多源] |
| `SillyTavern.libs.DOMPurify` | ST 核心 | 扩展内手动净化 HTML | high [文档·多源] |

### 完整变量读取函数（含双链路降级）

**来源**：r5 第 4673–4683 行 ｜ **置信度**：high [运行时源码]

```js
function readCurrentHudVariables() {
  var current = null;
  try {
    // 主链路：Tavern Helper getVariables
    current = getVariables({ type: 'message' }) || null;
    if (hasStatData(current)) return current;
  } catch (e) {}
  try {
    // 备用链路：MVU API
    current = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() }) || null;
    if (hasStatData(current)) return current;
  } catch (e) {}
  // 最终降级：返回上次已知良好数据
  return lastGoodHudData || { stat_data: {} };
}
```

---

## 11. iframe 工程辅助函数

### 11.1 找宿主 `.mes` 容器

**来源**：r5 运行时源码 ｜ **置信度**：high [运行时源码]

```js
function currentMessageContainer() {
  try {
    var frame = window.frameElement;
    // frame 是宿主页面中的 <iframe> 元素，可向上找 .mes 楼层
    return frame && frame.closest ? frame.closest('.mes') : null;
  } catch (e) {
    return null;
  }
}
```

### 11.2 防重复 iframe 自清理

本项目生产验证的关键机制。ST 重新渲染历史消息时，同一楼层可能出现多个 HUD iframe，此函数在 init 时运行多次，保留最新一个并移除其余。

**来源**：r5 第 1930–1961 行 ｜ **置信度**：high [运行时源码]

```js
function normalizeDuplicateHudInMessage() {
  try {
    var frame = window.frameElement;
    var message = currentMessageContainer();
    if (!frame || !message) return 0;
    // 找到所有包含 HUD 标志元素的 iframe
    var frames = Array.from(message.querySelectorAll('iframe'));
    var hudFrames = frames.filter(item => {
      try {
        var doc = item.contentDocument;
        return !!(doc && doc.querySelector('.hud-container .hud-title'));
      } catch (e) { return false; }
    });
    if (hudFrames.length <= 1) return 0;
    // 保留最后一个（最新），移除其余
    var keep = frame;
    hudFrames.forEach(item => {
      if (item !== keep) item.remove();
    });
  } catch (e) {}
}

// 在 init 时多次调用（应对异步渲染时序）
normalizeDuplicateHudInMessage();
setTimeout(normalizeDuplicateHudInMessage, 120);
setTimeout(normalizeDuplicateHudInMessage, 500);
```

### 11.3 安全属性输出转义工具（防 XSS）

**来源**：r5 运行时源码 ｜ **置信度**：high [运行时源码]

```js
// HTML 属性转义（用于动态拼接 HTML 字符串）
function attrValue(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// CSS 变量值净化（防注入）
function cssValue(value) {
  return String(value == null ? '' : value).replace(/[;"'<>]/g, '');
}

// 用法示例（内联 style 通过 CSS 变量传色，绕开 custom-style 转换问题）：
// '<span style="--cz-media-fallback-color:' + cssValue(stableMediaColor(name)) + '">'
```

---

## 12. ST 内置 CSS 变量与 Custom CSS 惯例

### 12.1 Custom CSS 的 custom- 类名惯例

ST 对角色卡注入内容的**所有** class 名加 `custom-` 前缀，在 Custom CSS 中必须写 `custom-` 前缀版本才能匹配。

**核心实现**：`chats.js` `addDOMPurifyHooks()` 函数内 `uponSanitizeAttribute` hook（第1927–1935行），逐词替换：`'custom-' + v`。
**豁免规则（运行时源码确认）**：以 `fa-` 开头（FontAwesome）、以 `note-` 开头、或恰好等于 `monospace` 的 class 词不加前缀。  
**来源**：chats.js 第1927–1935行直读 ｜ **置信度**：high [运行时源码]

已记录在案的 `custom-` 前缀用例（示例，非 ST 内置 class，仅说明规则适用范围）：

| 原类名 | Custom CSS 中需写 |
|---|---|
| `choices` | `.custom-choices` |
| `roll_result` | `.custom-roll_result` |
| `player_status` | `.custom-player_status` |

### 12.2 规避 custom- 前缀的方法

| 方法 | 适用场景 | 置信度 |
|---|---|---|
| 在 Custom CSS 中写 `custom-` 前缀版本类名 | 消息楼层直接注入的内容（前缀规则已确认） | high [运行时源码] |
| 用 `[class*="player_status"]` 子串匹配选择器 | 作为兜底：因 `custom-player_status` 包含 `player_status` 子串，子串匹配器仍可命中；逻辑成立但未真机测试 | medium·推导未验证 |
| 在 iframe 内完全自控类名（本项目选择此路） | iframe 渲染的完整 HTML 文档（DOMPurify hook 不作用于 iframe 内部） | high [运行时源码] |

---

## 13. 高频避坑清单

### 坑 1：`custom-` 前缀导致动态注入内容丢样式

**现象**：角色卡正则注入 HTML，内容上的 class 名在 Custom CSS 中用原类名写样式，实际无效。

**根因**：ST `addDOMPurifyHooks()` 在 DOMPurify `uponSanitizeAttribute` hook 中将 `class` 属性的**所有词**加 `custom-` 前缀（如 `player_status` → `custom-player_status`）。豁免规则：以 `fa-`/`note-` 开头或等于 `monospace` 的词不加前缀。

**解法**：Custom CSS 中使用 `custom-` 前缀版本；或在 iframe 内完全自控类名，彻底绕开此问题（本项目选择后者）。

**来源**：chats.js 第1927–1935行直读 ｜ **置信度**：high [运行时源码]

---

### 坑 2：`<style>` 块被转换为 `<custom-style>` 标签（v1.14.0 实际机制）

> **纠错**：原描述"style="" 属性被转 custom-style="" 属性"**有误**。运行时源码确认机制是：`<style>...</style>` **标签整体**被替换为 `<custom-style>URL编码内容</custom-style>`，与内联 `style=""` 属性无关。

**现象 A（`<style>` 块）**：消息中注入 `<style>.foo{color:red}</style>`，样式可能被作用域前缀化（`.mes_text .custom-foo{color:red}`），导致原类名 `.foo` 失效。  
**根因**：`encodeStyleTags()` → DOMPurify → `decodeStyleTags(prefix: '.mes_text ')` 三步管线。

**现象 B（内联 `style=""`）**：内联 `style="color:red"` 在消息楼层中**可能正常生效**——DOMPurify 白名单允许 `style` 属性（purify.js 第200行）。但如果不生效，可能是 Custom CSS 优先级或其他原因，而非 `custom-style` 转换。

**解法**（按场景）：
1. 用 CSS 类名替代内联 style，在 iframe 内的 `<style>` 或 Custom CSS（加 `custom-` 前缀）中定义。
2. 通过 CSS 变量传递动态值：`style="--my-color: red"` + 在 CSS 中 `color: var(--my-color)` — 此方案能否在消息楼层内生效见悬案 A。
3. 在 iframe 内使用内联 style（完全绕开消息楼层限制，本项目选择此路）。

**来源**：chats.js `encodeStyleTags/decodeStyleTags` + purify.js 直读 ｜ **置信度**：high [运行时源码]

---

### 坑 3：`<script>` 在消息楼层不执行

**现象**：正则注入 `<script>alert(1)</script>`，无任何反应。

**根因**：DOMPurify 默认移除 `<script>` 标签。

**解法**：唯一可靠路径是 iframe（iframe 内的 `<script type="module">` 可执行）。

**来源**：DOMPurify 默认行为 + 本项目实战 ｜ **置信度**：high [文档·多源]

---

### 坑 4：自定义非标准标签被过滤

**现象**：`<thought>` `<action>` 等非标准标签直接丢失或变为纯文本。

**根因**：DOMPurify 默认白名单仅含标准 HTML 元素。

**解法**：用带语义化 class 的标准标签替代（`<div class="thought-block">` 等）。

**来源**：issue #4688 ｜ **置信度**：high [社区]

---

### 坑 5：消息楼层内 `body {}` 样式不生效

**现象**：注入带 `body { color: red }` 的 `<style>` 块，容器内 body 样式不生效。

**根因（v1.14.0 源码补充）**：`decodeStyleTags()` 对消息楼层内的 `<style>` 块加 `.mes_text ` 前缀，`body {}` 变成 `.mes_text body {}`——此选择器试图匹配 `.mes_text` 内部的 `<body>` 子孙元素，而消息楼层内不存在 `<body>` 元素，因此选择器无法命中任何元素；同时也不会意外污染 ST 主页面 body（前缀有效隔离了作用域）。  
**来源**：chats.js `decodeStyleTags()` 直读 + issue #4688 [社区] ｜ **置信度**：high [运行时源码]

**解法**：所有样式写在具体容器类名下（注意类名加 `custom-` 前缀），或在 iframe 内定义（iframe 内有真正的 body）。

---

### 坑 6：多楼层刷新导致状态栏重复渲染

**现象**：ST 重新渲染历史消息时，同一楼层内出现多个 HUD iframe。

**根因**：每次正则注入触发时重新插入 iframe，已有 iframe 不被自动清理。

**解法**：在 iframe 内 JS 的 `init()` 阶段调用 `normalizeDuplicateHudInMessage()`（见 11.2），检测并移除同楼层内多余的同类 iframe。

**来源**：r5 第 1930–1961 行 ｜ **置信度**：high [运行时源码]

---

### 坑 7：iframe 高度塌陷

**现象**：iframe 内容高于预设高度时被截断，或 iframe 高度为 0。

**根因**：正则注入的 `<iframe>` 标签通常没有指定高度，或高度在内容变化后未更新。

**解法**：
- 由 Tavern Helper 扩展自动处理（本项目采用，需确认扩展版本支持）。
- 通用备选：iframe 内用 `ResizeObserver` 监听高度变化，通过 `postMessage({ type: 'frameHeight', height: H })` 通知父页面调整。

**来源**：推断 + 本项目运行时观察 ｜ **置信度**：medium·推导未验证

---

### 坑 8：`prefers-color-scheme` 媒体查询无效

**现象**：用媒体查询做深浅色适配，ST 主题切换时不触发。

**根因**：ST 用 JS + CSS 变量做主题切换，不依赖 OS 级深浅色模式，`prefers-color-scheme` 不会因 ST 主题切换而改变。

**解法**：监听 ST 主题切换事件（通过扩展 API）并用 JS 动态修改 CSS 变量；或完全用内部变量系统（如本项目），不依赖媒体查询。

**来源**：推断 ｜ **置信度**：medium·推导未验证

---

## 14. 悬而未决：需真机验证的问题

以下问题尚无足够证据定论，施工前须真机验证。矛盾观点两派并列，不强行统一。

---

### 悬案 A：内联 `style="--var:val"` 在消息楼层直接注入时 CSS 变量是否可读

> **纠错（与原问题描述有偏差）**：`style=""` 属性**不会**被转为 `custom-style=""` 属性（见第2章纠错）。原悬案问题描述前提有误，真正的问题如下重述。

**修正后的具体问题**：消息楼层直接注入 `<span style="--cz-color:red;color:var(--cz-color)">X</span>` 时：
1. `style` 属性本身被 DOMPurify 允许通过（purify.js 第200行已确认）。
2. 真正未验证的是：该元素的 CSS 变量是否能被 **同楼层内的 `<style>` 规则**或 **Custom CSS** 读取？即 `.mes_text .custom-foo { color: var(--cz-color); }` 能否从该元素的内联 style 中继承 `--cz-color`？

**当前处理**：本项目在 iframe 外注入时不依赖此机制；iframe 内 r5 大量使用此方案（第2056行可见），在 iframe 内完全正常。

**验证路径**：在 ST 消息楼层（**非** iframe 内）注入 `<span style="--test:red;background:var(--test)">X</span>`，检查背景是否显示红色。

---

### 悬案 B：`class` 属性是否被 DOMPurify 过滤 ✅ 已解决（v1.14.0 运行时源码确认）

**结论**：`class` 属性在 DOMPurify 默认 html 属性白名单内（purify.js 第200行 `html` 数组中含 `'class'`），**不会被过滤**；但会被 ST 的 `uponSanitizeAttribute` hook 改写——所有词加 `custom-` 前缀，豁免 `fa-*`、`note-*`、`monospace`（chats.js 第1927–1935行）。

**因此**：注入 `<div class="test-cls">` 后 DOM 中实际为 `<div class="custom-test-cls">`。Custom CSS 须用 `.custom-test-cls` 选择器。

**原置信度**：medium·推导未验证 → 已升级为 **high [运行时源码]**

---

### 悬案 C：正则注入的 `<iframe>` 标签是否被 DOMPurify 过滤 （部分解答）

**运行时源码新证据**：DOMPurify purify.js 第482行 `DEFAULT_FORBID_CONTENTS` 明确包含 `'iframe'`——即 `iframe` 不在默认允许标签列表内且内容被忽略。这意味着**原生正则 → DOMPurify 路径下 `<iframe>` 会被剥除**。 [运行时源码]

**具体问题（缩小范围）**：既然 DOMPurify 默认过滤 `iframe`，本项目 iframe 能工作的唯一可能解释是：Tavern Helper 在 DOMPurify 之前（或之后用独立注入）处理 iframe，绕开了 DOMPurify 管线。此推断**尚未真机验证**。

**当前处理**：本项目实战验证 iframe 在 Tavern Helper 环境下可工作。 [运行时源码] → **high**（有扩展）/ medium·推导未验证（无扩展路径）

**验证路径**：在不安装 Tavern Helper 的环境中，用正则注入 `<iframe srcdoc="<h1>test</h1>">` 观察 test 标题是否渲染；对照组同时注入 `<div>direct div</div>` 确认普通标签正常。

---

### 悬案 D：`backdrop-filter` 在非标准 ST 部署环境的兼容性

**具体问题**：`backdrop-filter: blur()` 在 Tauri 包装的 ST 或旧版 Electron 中可能不生效。

**影响范围**：第 7 章毛玻璃浮层范式（`.settings-surface`）的视觉效果。

**验证路径**：在目标运行环境（Tauri / Electron / 浏览器）中打开包含毛玻璃效果的 iframe，确认 backdrop-filter 是否渲染；准备降级方案：移除 backdrop-filter，改用纯色半透明背景（`background: rgba(7,19,29,0.85)`）。

---

## 参考来源

- SillyTavern 正则扩展文档：<https://docs.sillytavern.app/extensions/regex/>
- SillyTavern UI 扩展开发文档：<https://docs.sillytavern.app/for-contributors/writing-extensions/>
- SillyTavern UI 自定义文档：<https://docs.sillytavern.app/usage/core-concepts/uicustomization/>
- GitHub issue #3844（**注意**：issue 描述的是 `style=""` 属性行为，但 v1.14.0 运行时源码确认 `custom-style` 是 `<style>` 标签的替身，非属性替换；`class` 前缀实现在 chats.js addDOMPurifyHooks 中）：<https://github.com/SillyTavern/SillyTavern/issues/3844>
- GitHub issue #4688（自定义标签 / body 样式不生效）：<https://github.com/SillyTavern/SillyTavern/issues/4688>
- DeepWiki SillyTavern 用户界面分析：<https://deepwiki.com/SillyTavern/SillyTavern/4-user-interface>
- DOMPurify 默认白名单文档：<https://github.com/cure53/DOMPurify/wiki/Default-TAGs-ATTRIBUTEs-allow-list-&-blocklist>
- **本地实战最高可信**：`<local-user-path>/OneDrive\ST-\角色卡工作区\星月\星月 2.5.0\components\status_bar_regex_beauty_r5.html`（262 KB，v2.5.0 生产状态栏）
- 本地实战：`<local-user-path>/OneDrive\ST-\角色卡工作区\星月\星月 2.5.0\components\status_bar_regex.html`（269 KB，status_bar_regex 组件）
- **本次回源关键源码**（v1.14.0 直读）：
  - `public/scripts/chats.js`（`encodeStyleTags`/`decodeStyleTags`/`addDOMPurifyHooks` 实现，第532–1939行）
  - `public/script.js`（`messageFormatting` + DOMPurify 配置，第1763–1776行）
  - `node_modules/dompurify/dist/purify.js`（默认白名单 html/svg/attrs，第186–204、422、482行）
  - `public/css/backgrounds.css`、`file-form.css`、`character-group-overlay.css`（ST 内置 CSS 变量引用验证）
