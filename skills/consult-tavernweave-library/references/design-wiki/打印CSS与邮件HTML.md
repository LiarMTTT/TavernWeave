---
title: 打印CSS与邮件HTML
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - research
  - tooling
knowledge_class: factual
sources:
  - https://www.w3.org/TR/css-page-3/
  - https://www.w3.org/TR/css-gcpm-3/
  - https://www.w3.org/TR/CSS21/page.html
  - https://www.w3.org/TR/css-break-3/
  - https://documentation.mjml.io/
  - https://www.caniemail.com/
  - https://www.caniemail.com/features/
  - https://amp.dev/documentation/guides-and-tutorials/learn/email-spec/amp-email-structure/
  - https://www.rfc-editor.org/rfc/rfc2046.html
  - https://emailmarkup.org/
  - https://emailmarkup.org/en/docs/compliant-standards/
  - https://emailmarkup.org/en/docs/vision/
  - https://developer.chrome.com/docs/devtools/rendering/emulate-css
  - https://pagedjs.org/en/documentation/1-the-big-picture/
  - https://weasyprint.org/
  - https://github.com/mjmlio/mjml
  - queries/第三批蒸馏目标.md
---

# 打印CSS与邮件HTML

蒸馏自 [[queries/第三批蒸馏目标]] B3-Print / B3-Email。检索日 2026-08-14。不是已采用皮肤或发卡规范。

## 一句话定义

打印 CSS 把连续文档切成有限页盒；邮件 HTML 是第三方 HTML，必须先被客户端收成安全子集再嵌入。两者都不是「浏览器里那张完整网页」。

## 为什么重要

屏幕 CSS 默认连续视口。纸张、PDF、邮件窗格都把内容放进**有限、常被裁切的盒子**，而且渲染方会改你的标记。认清页盒、填盒、MIME 备选和净化子集，才能判断「预览对了」是不是真的印得出、寄得出。酒馆消息楼也只认 HTML 子集，机制类似、规范不同，见下方映射。

## 权威入口

检索日 2026-08-14。下列为可点真源，不是镜像。

1. [CSS Paged Media Module Level 3](https://www.w3.org/TR/css-page-3/) — 页盒、`@page`、`size`。2023-09-14 WD。
2. [CSS Generated Content for Paged Media](https://www.w3.org/TR/css-gcpm-3/) — 填盒：`string-set`、running elements、脚注。2024-01-25 WD。
3. [CSS 2.1 Paged media](https://www.w3.org/TR/CSS21/page.html) — 有 `@page` 边距，**不能指定页尺寸**。
4. [CSS Fragmentation Level 3](https://www.w3.org/TR/css-break-3/) — 分页断裂；css-page 把分页过程指向它。
5. [MJML 文档](https://documentation.mjml.io/) — 语义标签编译成响应式邮件 HTML。源码 [MIT](https://github.com/mjmlio/mjml)。
6. [Can I Email](https://www.caniemail.com/) — 邮件 HTML/CSS 支持表。2026-07-13 仍在更新（`popover`、`command`）。
7. [Can I Email 特性目录](https://www.caniemail.com/features/) — 按特性查客户端，不是单一「Outlook」。
8. [AMP 邮件结构](https://amp.dev/documentation/guides-and-tutorials/learn/email-spec/amp-email-structure/) — `text/x-amp-html` 必须放在 HTML **之前**。
9. [RFC 2046](https://www.rfc-editor.org/rfc/rfc2046.html) — `multipart/alternative`：**越后越丰富**。
10. [Email Markup Consortium](https://emailmarkup.org/) — 邮件标记社区组。
11. [EMC Compliant Standards](https://emailmarkup.org/en/docs/compliant-standards/) — 要语义 HTML、地标、语言；不是写法教程。
12. [EMC Vision](https://emailmarkup.org/en/docs/vision/) — 各客户端净化与嵌入上下文不一致。
13. [Chrome DevTools：模拟 CSS media](https://developer.chrome.com/docs/devtools/rendering/emulate-css) — Rendering 里选 `print`，不是系统打印对话框。
14. [Paged.js 现行文档](https://pagedjs.org/en/documentation/1-the-big-picture/) — 浏览器里做分页预览的 polyfill。仓库仍写的 [`/documentation/`](https://pagedjs.org/documentation/) 于 2026-08-14 **404**。
15. [WeasyPrint](https://weasyprint.org/) — 专用印刷引擎示例；浏览器打印预览不是它。

旧文 [Litmus Email Coding 101](https://www.litmus.com/blog/email-coding-101) 于同日 **404**，勿再当入口。

## 如何运作

### 打印：页盒在 css-page，填盒在 css-gcpm

[css-page-3](https://www.w3.org/TR/css-page-3/) 把文档流进一块有限矩形，叫 **page box（页盒）**，大致对应视口。页盒有边距、边框、内边距；内容区叫 page area。页边距再切成 **16 个 page-margin boxes**，用来放页眉页脚。`@page` 的 `size` 指定页盒（以及通常的纸张）尺寸和方向，例如 `size: A4 landscape`。

[CSS 2.1 §13](https://www.w3.org/TR/CSS21/page.html) 写明：*The size of a page box cannot be specified in CSS 2.1.* 只能设边距和左右/首页选择器。要写页尺寸，必须用 css-page-3，不能假装 2.1 已经能写。

16 个页边距盒的**空位**在 css-page；往里面填内容不在那份规范。[css-gcpm-3](https://www.w3.org/TR/css-gcpm-3/) 开篇写：css-page 描述了这些盒子，但没有插入机制。填盒靠两类办法：

- **Named strings**：`string-set` 把标题等抄进命名字符串，页边距用 `content: string(name)` 取出。
- **Running elements**：把带样式的元素从正文移到页边距盒。

脚注、导点、交叉引用也在 gcpm，不在 css-page。分页断裂本身在 [css-break-3](https://www.w3.org/TR/css-break-3/)。

### 预览三层，不要并成一层

| 层 | 做什么 | 不是什么 |
|---|---|---|
| DevTools「Emulate CSS media type: print」 | 在**连续视口**上套 `@media print`，方便改样式 | 不是系统打印对话框，也不保证分页、页边、页眉页脚与真印一致 |
| 浏览器打印预览 / 另存 PDF | 浏览器自己的打印管线 | 不是 Prince / WeasyPrint / Antenna House 这类印刷引擎 |
| 印刷引擎或 Paged.js | 按页盒切流、填页边距、出 PDF | Paged.js 是 polyfill，把 `@page` 译成浏览器能画的 DOM |

Chrome 文档把 Rendering 选项叫 “Enable print preview”，实际只是强制 print 媒体类型。要看纸张、缩放、页码，仍须打开打印对话框。浏览器预览能「看起来像一页」，不等于印刷引擎的分页与字体。

Paged.js 实现 css-page、css-gcpm、css-break。GitHub README 仍链 `pagedjs.org/documentation/`；2026-08-14 该路径 404，活页在 `/en/documentation/…`。

### 邮件：先编译或手写子集，再过客户端净化

[MJML](https://documentation.mjml.io/)（MIT）用 `<mj-section>` / `<mj-column>` 等语义标签，编译成各客户端更能吃的响应式 HTML，把套表和客户端 CSS 差藏进引擎。输出仍是 HTML 邮件，不是新传输协议。

[Can I Email](https://www.caniemail.com/) 按**具体客户端**记支持，不把「Outlook」当成一种。Windows 桌面、Outlook.com、macOS、iOS/Android 分数不同。2026-07 仍在加特性。

[EMC](https://emailmarkup.org/) 要语义 HTML、地标、`lang`/`dir`、尊重用户偏好，并标准化「不支持的特性怎么剥」而不是强推一张特性清单。[Vision](https://emailmarkup.org/en/docs/vision/) 举例：同样不支持的 `rgb()` 空白语法，Yahoo 只删 `color`，Gmail 整段 `style` 都剥。

**冲突保留：** EMC 要语义结构；**Classic Outlook（Word 排版引擎）仍常逼表布局**。MJML 等工具继续出表，是为了这台引擎，不是 EMC 改了口径。两边都留，不要写成「现在可以只写语义、不必再管表」。

### AMP 段序与 RFC 2046 对打

[RFC 2046](https://www.rfc-editor.org/rfc/rfc2046.html) 规定 `multipart/alternative` 按**保真度递增**排列：最朴素在前，**最好的选择是收件方能显示的最后一段**。组包方必须「越后越丰富」。

[AMP 邮件](https://amp.dev/documentation/guides-and-tutorials/learn/email-spec/amp-email-structure/) 要求另加 `text/x-amp-html`，且必须有非 AMP 的 `text/plain` 或 `text/html`。有些客户端**只渲染最后一段**，所以官方建议把 AMP 段放在 HTML **之前**。常见顺序因此是：plain → AMP → HTML。这与 RFC「最丰富的放最后」冲突：AMP 更丰富，却不能放在最后，否则只认末段的客户端会丢掉 HTML 回退。回复/转发会剥掉 AMP；客户端也可能在约 30 天后改显示 HTML。

## 酒馆映射（只互链，不抄管线）

酒馆消息楼净化只认 HTML 子集，**类似**邮件客户端：第三方标记先收成安全碎片，再嵌进宿主页面。这不是同一份规范，也不是同一份白名单。

- 楼内碎片（OMNI / 气泡 / 选项）走 ST 净化，进 `.mes_text`。管线与正则位置见 [[concepts/消息渲染与正则管线]]；净化钩子见 [[concepts/酒馆宿主与iframe分层]]。
- 邮件客户端各有自己的剥法（EMC Vision：Yahoo 与 Gmail 对同一不支持值处理不同）。ST 用 DOMPurify + `MESSAGE_SANITIZE`，规则另一套。
- 能类比的是「子集 + 嵌入上下文」：webmail 可能 iframe、可能同页嵌入并做 CSS 作用域；消息楼是同文档净化，不是邮件 MIME。
- **本页不写如何绕过净化、不写扩大白名单、不写攻击载荷。** 卡要插 UI，接到现有管线，不要假装消息楼是未净化网页。

打印 CSS 与酒馆发卡无直接运行时合同。`@page` / 印刷引擎不自动落到卡；浏览器打印预览也不等于状态栏或开局页。

## 例子

- 正例（打印）：`@page { size: A4; margin: 2cm; }` 定页盒；`h1 { string-set: chapter content(); }` 加 `@top-center { content: string(chapter); }` 填页眉。页盒在 css-page，填盒在 gcpm。
- 正例（邮件）：MJML 编译出带表的 HTML；同时保留 `text/plain`。若发 AMP，MIME 为 plain → `text/x-amp-html` → `text/html`。
- 反例（打印）：只在 DevTools 勾 print，就宣称「分页和页码已验收」。那是媒体类型模拟，不是打印对话框，更不是印刷引擎。
- 反例（邮件）：按 RFC 把 AMP 放在最后。只渲染末段的客户端会丢掉 HTML 回退。
- 反例（映射）：把邮件「能用的标签」抄进消息楼，或反过来，当作同一白名单。

## 边界与易混概念

- 不包括：某张卡的打印样式、工坊发信产品、绕过净化的做法、付费印刷引擎操作手册。
- 页盒 ≠ 填盒。css-page 造 16 个页边距盒；gcpm 往里填。
- CSS 2.1 `@page` ≠ css-page-3 `@page`。前者不能写页尺寸。
- 浏览器打印预览 ≠ 印刷引擎。DevTools print ≠ 打印对话框。
- Paged.js 文档根路径曾 404；不要引 `/documentation/` 当活入口。
- Litmus Coding 101 已 404；支持面看 Can I Email。
- EMC 语义目标 ≠ Classic Outlook 实现。表布局仍在，因为引擎还在。
- RFC 2046 备选顺序 ≠ AMP 实装顺序。冲突保留，不要选边抹掉。
- 邮件净化 ≠ ST 消息楼净化。只类似，不共用规范。
- Can I Email 的 Outlook 分多列，不是一种客户端。

## 来源与证据

- 打印枢纽：css-page-3、css-gcpm-3、CSS 2.1 §13；对照 WeasyPrint、Paged.js。
- 邮件枢纽：MJML、Can I Email、AMP 结构、RFC 2046、EMC。
- 账本：[[queries/第三批蒸馏目标]] B3-Print / B3-Email。
- 已知冲突（不得静默覆盖）：
  1. AMP 因「只渲染最后一段」要把 AMP 放在 HTML **之前**，与 RFC 2046「越后越丰富」冲突。
  2. EMC 要语义 HTML；Classic Outlook 仍逼表布局。
  3. CSS 2.1 不能指定页尺寸，css-page-3 可以。
  4. 页盒在 css-page，填盒在 css-gcpm。
  5. 浏览器打印预览 ≠ 印刷引擎；DevTools print ≠ 打印对话框。
  6. Paged.js `/documentation/` 曾 404；Litmus Coding 101 404。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/消息渲染与正则管线]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/OMNI正则与data属性选择器]]
