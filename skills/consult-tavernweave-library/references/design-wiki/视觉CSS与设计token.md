---
title: 视觉CSS与设计token
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
knowledge_class: factual
sources:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter
  - https://css-tricks.com/using-css-backdrop-filter-for-ui-effects/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts
  - https://web.dev/blog/viewport-units
  - https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
  - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
  - https://webkit.org/blog/7929/designing-websites-for-iphone-x/
  - https://web.dev/learn/css/z-index
  - https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
  - https://www.designtokens.org/
  - https://spectrum.adobe.com/page/design-tokens/
  - https://www.nngroup.com/articles/design-systems-101/
  - https://bem.info/en/methodology/
  - https://tailwindcss.com/docs/styling-with-utility-classes
  - https://open-props.style/
  - https://www.radix-ui.com/colors
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
  - https://css-tricks.com/styling-in-the-shadow-dom-with-css-shadow-parts/
  - https://www.w3.org/WAI/standards-guidelines/wcag/
  - https://glassmorphism.com/
  - https://css.glass/
  - https://uiverse.io/
  - https://daisyui.com/
  - https://gsap.com/
  - https://motion.dev/
  - https://animista.net/
  - https://www.w3.org/TR/css-color-4/
  - https://www.w3.org/TR/css-color-5/
  - https://www.w3.org/TR/css-color-hdr-1/
  - https://www.designtokens.org/tr/2025.10/
  - https://www.w3.org/TR/mediaqueries-5/#prefers-contrast
  - https://www.w3.org/TR/css-grid-3/
  - https://www.w3.org/TR/css-cascade-6/
  - https://drafts.css-houdini.org/
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
---

# 视觉CSS与设计token

行业视觉层：浏览器怎么画半透明、配色、视口、层叠和设计决策值。本页是机制蒸馏，不是某仓库的皮肤规范，也不等于已经选定设计系统。

## 一句话定义

视觉 CSS 决定元素如何相对「它背后的像素、当前视口、用户配色和层叠上下文」呈现；设计 token 把这些决策值从组件实现里抽出来，变成可替换的数据。

## 为什么重要

同一套「毛玻璃 / 暗色控件 / 100vh 铺满 / 安全区」在独立站点、嵌套 iframe、宿主页挂载里表现不同。先认清浏览器合同，再谈皮肤。token 则避免把色值、间距、圆角写死进每一个按钮。

许可、营销导流和灵感站点账本不在本页展开，见 [[queries/前端视觉与灵感站点蒸馏目标]]。

## 如何运作

### backdrop-filter：只糊同一浏览上下文

[`backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) 对**元素背后、已经画出来的像素**做模糊、变色等滤镜。元素自己必须半透明或透明，否则看不见效果。取样范围停在最近的 backdrop root（根元素，或带非 `none` 的 `filter` / `mask` / `clip-path`、`opacity < 1`、另一个 `backdrop-filter`、非 `normal` 的 `mix-blend-mode`、以及把上述属性列入 `will-change` 的祖先）。父级一旦变成 backdrop root，子级只能糊「父级内部」，糊不到父级后面的页面。

跨文档 iframe 是独立浏览上下文。框内元素背后只有框内文档，**取样不到父页**。想糊父页内容，滤镜必须画在与父页同一份文档里。

### 多层玻璃：半透明底 + 模糊 + 细边

常见玻璃观感不是单靠 `blur()`。[CSS-Tricks 的多层滤镜文](https://css-tricks.com/using-css-backdrop-filter-for-ui-effects/) 写的是：半透明底让背后内容可见；`blur` 负责磨砂；细边或高光把面板从背景里勾出来。多层叠玻璃时，除最底层外上层要用半透明而不是全透明，否则滤镜叠不起来。`backdrop-filter` 会参与建立层叠 / 合成层，和 `opacity`、`transform` 一样容易把 `z-index` 锁进新上下文。

### color-scheme：UA 控件，可传入 iframe

[`color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme) 告诉用户代理：这个元素能舒服地画在 light / dark 方案里。浏览器据此改**画布默认色、滚动条、表单控件、拼写下划线**等 UA 控件，不自动改你自己写的 `background` / `color`。作者色仍要用 `prefers-color-scheme` 或下面的 `light-dark()`。属性可继承；嵌套浏览上下文里，父页声明的方案可以传入 iframe，框内滚动条和原生控件会跟着走。

### light-dark()：一对值随方案切

[`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark) 收两个颜色（较新实现也收一对图像）：当前用 light 或未设偏好时取第一个，dark 时取第二个。通常要在 `:root` 写 `color-scheme: light dark` 才启用。局部再写 `color-scheme: light` 或 `dark` 会强制该段只用其中一套——演示可以，覆盖用户偏好要谨慎。

### OKLCH：Color 4 已是 CR，Color 5 仍是 WD

[`oklch()`](https://www.w3.org/TR/css-color-4/) 是 CSS Color Module Level 4 的圆柱坐标写法。2026-08-06 的 TR 是 **W3C Candidate Recommendation Draft**，CR **不等于** Recommendation。Color 4 预定义的 `display-p3`、`rec2020` 按设计都是 **SDR**。[CSS Color 5](https://www.w3.org/TR/css-color-5/)（2026-07-31 WD）才加改色函数、`contrast-color()`、`light-dark()` 的规范真源。本页不规定必须改用 OKLCH。

### Display P3 是 SDR 宽色，不是 HDR

[Color 4 §10.4](https://www.w3.org/TR/css-color-4/#predefined-display-p3) 把 `display-p3` 写成 DCI-P3 三原色 + D65 + **与 sRGB 相同的传递曲线**，表里 White luminance 是 **80.0 cd/m²**。[CSS Color HDR 1](https://www.w3.org/TR/css-color-hdr-1/) 仍是 WD，才补 HDR。不要把 `color(display-p3 …)` 或「P3 屏」写成 HDR 支持。

### 视口：layout、visual、vh 与 svh/lvh/dvh

[MDN 视口概念](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts) 把两层分开：

| 层 | 是什么 | 谁会变 |
|---|---|---|
| layout viewport | 排版用的视口；`position: fixed` 贴它的边 | 窗口改尺寸、缩放改 CSS 像素；软键盘 / 捏合缩放通常不改它 |
| visual viewport | 屏幕上实际看见的那一块 | 捏合缩放、动态地址栏、屏幕键盘可把它缩小 |

[`vh`](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts) 是 **layout viewport 高度的 1%**。嵌套浏览上下文（iframe / object / 外链 SVG）里，视口是**框自己的内尺寸**：`1vh` = iframe 高的 1%，媒体查询也相对这个框。只有顶层窗口的 visual viewport 才可能和 layout 不一致；iframe 里两者通常相同。[`VisualViewport`](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) 用来读偏移、缩放，并听 `resize` / `scroll`，好把控件钉在「眼睛看见的区域」。

移动端动态工具栏让经典 `100vh` 在地址栏展开时高出一截。[web.dev 视口单位](https://web.dev/blog/viewport-units) 补了三套稳定/动态单位：`svh` 按工具栏全展开，`lvh` 按全收起，`dvh` 在两者之间随工具栏变。注意：单位不算经典滚动条宽度；`dv*` 不按 60fps 更新；**屏幕键盘默认不算 UA 工具栏**，因而不改这些单位（Chrome 可另开选项让键盘影响视口单位）。

### env()、安全区、键盘 inset

[`env()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) 插入用户代理提供的环境变量，不是作者自定义属性。与视觉最相关的一组：

| 变量 | 用途 |
|---|---|
| `safe-area-inset-*` | 刘海、圆角、Home 条等「不要把要点画进去」的 inset |
| `safe-area-max-inset-*` | 动态 UI 全收起时的静态最大值 |
| `keyboard-inset-*` | 屏幕键盘相对视口的 inset（VirtualKeyboard API） |
| `titlebar-area-*` | 桌面 PWA 窗口控件叠加区 |
| `viewport-segment-*` | 折叠屏分段 |

[WebKit 为 iPhone X 引入](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) `viewport-fit=cover` 才会铺满异形屏；铺满后必须用 `env(safe-area-inset-*)` 把导航和按钮垫回来。早期函数名是 `constant()`，后来改成 `env()`。`env()` 无效时整条声明被丢，要先写不含 `env()` 的回退。安全区不是边距替代品：portrait 下左侧 inset 常为 `0`，仍要 `max(常规 padding, env(...))`。

### 层叠与 z-index

[`z-index` 只在层叠上下文里比大小](https://web.dev/learn/css/z-index)。普通流默认按源码先后叠；非 flex/grid 子项还要把 `position` 设成非 `static`，`z-index` 才生效。父级一旦因 `z-index` + 定位、`opacity`、`transform`、`will-change`、`backdrop-filter` 等建成新上下文，子级再大的正数也出不去，再小的负数也钻不到父级背后。多层玻璃、固定 HUD、抽屉同时存在时，先数有几个上下文，再调数字。

### 瀑布流布局现称 grid-lanes

[CSS Grid Layout Module Level 3](https://www.w3.org/TR/css-grid-3/)（WD）把旧称 masonry 写成 **grid lanes layout**，建立容器的值是 `display: grid-lanes`。跨引擎语法未齐。回退用普通 Grid，并用 `@supports (display: grid-lanes)` 探测，不要探测已废弃的 `masonry` 关键字。

### Design tokens：决策值与组件解耦

[NN/g](https://www.nngroup.com/articles/design-systems-101/) 把设计系统说成「用可复用组件和模式、在规模上管设计的一套标准」。token 是其中把**决策写成数据**的那一层：[Adobe Spectrum](https://spectrum.adobe.com/page/design-tokens/) 的说法是「设计决策翻译成数据」，组件引用 token 名而不是 `#0265DC`。常见分层：全局值 → 语义别名（「强调色」）→ 组件专用 token。只丢一份 token 文件、组件里仍写死色值，系统是空的。

交换格式由 [Design Tokens Community Group](https://www.designtokens.org/) 维护。[2025-10-28 的 Format 终稿](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) 是 **W3C Community Group Final Report**，文档自己写明：**不是 W3C Standard，也不在 W3C 标准轨道上**。它给工具互操作一份 JSON 形状，不自动等于某产品已经采用该格式。社区 TR 入口是 [Design Tokens 2025.10](https://www.designtokens.org/tr/2025.10/)，与上面的 W3C 镜像是同一份终稿。USWDS 等政务 token 不必是 DTCG JSON。

常见构建链（都不是本仓库已采用工具）：[Style Dictionary](https://styledictionary.com/getting-started/installation/)、[Tokens Studio](https://tokens.studio/) + [sd-transforms](https://github.com/Tokens-studio/sd-transforms)、[Terrazzo](https://terrazzo.app/docs/)。Figma Variables REST 要 Enterprise。有 JSON、有 Figma 变量、有 CSS 自定义属性，是三层东西。

### 样式架构四路

四条路常一起用，不是四选一互斥：

| 路 | 做法 | 入口 |
|---|---|---|
| 组件驱动 | 可复用控件带自己的样式契约 | 设计系统里的 component library（见 NN/g） |
| Utility | 在标记上叠原子类，少写选择器战争 | [Tailwind：用 utility class 写样式](https://tailwindcss.com/docs/styling-with-utility-classes) |
| BEM | Block / Element / Modifier 命名，特异性低、选择器可审计 | [BEM methodology](https://bem.info/en/methodology/) |
| Tokens | 决策值进自定义属性或 DTCG JSON，主题替换时改数据 | [Open Props](https://open-props.style/)（现成 CSS 自定义属性集）；[Radix Colors](https://www.radix-ui.com/colors) 是**颜色阶**，不必上 Radix 组件 |

嵌入别人的文档时，utility 容易漏进宿主全局；BEM 或 `data-*` 选择器更好审计。独立站点可以 utility + token 并行。Tailwind v4 的 [`theme()`](https://tailwindcss.com/docs/functions-and-directives) **已弃**，官方建议改用 CSS 主题变量。

选择器作用域的稳定层叠合同是 [CSS Cascade 5](https://www.w3.org/TR/css-cascade-5/)。[`@scope`](https://www.w3.org/TR/css-cascade-6/) 在 Level 6 **Exploratory Working Draft**；实现层叠仍以 Level 5 为参考。`@scope` 不是样式隔离，也不是 Shadow DOM 的替代品。

### Shadow DOM 与 ::part：抗样式不是安全边界

[Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) 给宿主挂一棵对外默认不可见的树：页面选择器进不去，影子里的样式也出不来。`mode: "closed"` 只让 `shadowRoot` 变成 `null`，MDN 写明**不要把它当强安全机制**——扩展等仍可能绕过。影子与宿主仍共享同一 JS 堆和同一条主线程；卡顿、原型污染、拿到 host 引用后的脚本，都不被这层挡住。可继承属性（`color`、`font`、`line-height`）仍会渗进影子。

作者用 `part` 属性露出指定节点，页面用 [`::part()`](https://css-tricks.com/styling-in-the-shadow-dom-with-css-shadow-parts/) 从外主题化，而不必为每个可调属性各写一个自定义属性。未标 `part` 的内部节点保持锁死。`::part` 默认只穿透一层影子；更深要靠 `exportparts`。

### Houdini：跨浏览器用的只有 @property

[CSS Houdini 草稿入口](https://drafts.css-houdini.org/) 不是已齐的一篮子能力。`@property` 是 **Baseline 2024**；CSS Paint API 基本是 Chromium；Animation Worklet **生产当死**。`houdini-hud.com` / `houdini.how` / `ishoudinireadyyet.com` 不当活源。

### 无障碍底线：对比度与动效

[WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) 是 W3C 无障碍内容标准（2.0 / 2.1 / 2.2 均为现行 Recommendation；新版本加成功标准、不改旧条）。视觉层最常踩的两条：

- **对比度**：半透明玻璃、细字、暗色主题上的灰字，很容易掉到可感知原则要求的对比度以下。
- **动效**：闪烁、自动播放、大位移缓动要可关、可停；尊重用户的减少动效偏好。

玻璃生成器和动效库不会替你做这两条。WCAG 3 仍是早期草案，引用时写明版本。

[APCA](https://git.apcacontrast.com/documentation/minimum_compliance.html) 是感知对比草案，**不是** W3C 标准，也**不是**现行 WCAG 3 符合性算法。法规与采购仍指 WCAG 2.x。[`prefers-contrast`](https://www.w3.org/TR/mediaqueries-5/#prefers-contrast) 以 2026-02-19 WD 为准，离散值是 `no-preference` / `more` / `less` / `custom`。**不要引用 2020 稿的 `high` / `low`。** 更完整的轴见 [[concepts/无障碍与包容设计]]。

### 生成器只当配方入口

下列站点用来看滑块、抄思路、估参数，**不是**本页的配方正文，也不在这里粘贴它们生成的整段 CSS：

| 站点 | 角色 |
|---|---|
| [glassmorphism.com](https://glassmorphism.com/) | 毛玻璃滑块 |
| [css.glass](https://css.glass/) | 更短的玻璃生成器 |
| [Uiverse](https://uiverse.io/) | 社区控件片段，质量参差 |
| [daisyUI](https://daisyui.com/) | 建立在 Tailwind 上的组件类 |

GSAP / Motion / Animista / 平台动画 API 整页见 [[concepts/动画库与动效管线]]（GSAP 自 2025-04-30 Standard No Charge，旧「商用另买」口径作废）。许可、登录墙、营销导流见 [[queries/前端视觉与灵感站点蒸馏目标]]。把生成器输出当设计系统，等于没有 token。

## 例子

- 正例：面板写半透明底 + `backdrop-filter: blur(...)` + 1px 高光边；颜色用 `light-dark()` 或 token 别名；移动端全屏高用 `100dvh` 或 `100svh`，关键按钮加 `env(safe-area-inset-bottom)`。
- 正例：颜色阶用 Radix Colors 这类阶表，组件仍自己写；或把 Open Props 的自定义属性当 token 源。
- 反例：在 iframe 里对面板做 `backdrop-filter`，指望糊到父页聊天区。
- 反例：`height: 100vh` 当手机「永远贴满可视区」；或把 Shadow DOM 当成跨源沙箱。
- 反例：把 glassmorphism.com 导出的整段 CSS 贴进仓库，当作已采用的视觉系统。

## 边界与易混概念

- 本页不是角色卡皮肤清单，也不是「本仓库已采用」的 token / 组件库声明。
- `filter` 滤的是元素自己；`backdrop-filter` 滤的是它背后的像素。
- `color-scheme` 管 UA 控件；`prefers-color-scheme` 是媒体查询；`light-dark()` 是取值函数。三者 complementary，不是同义词。
- `vh` ≠ 眼睛看见的高度；`visualViewport` ≠ layout viewport；iframe 里的 `1vh` ≠ 浏览器窗口高。
- `env()` 是 UA 环境变量；`var()` 是作者自定义属性。
- token ≠ 组件库 ≠ 设计系统。NN/g 的系统还包括人、文档和模式库。
- DTCG 报告 ≠ W3C Recommendation。2025.10 与 W3C `CG-FINAL-format-20251028` 是同一份 CG 终稿的两个入口。
- `oklch()` 在 Color 4 CR 轨道；`light-dark()` 规范真源在 Color 5 WD。
- `display-p3` 是 SDR 宽色（规范白 80 cd/m²），不是 HDR。
- APCA ≠ WCAG 3 符合性；`prefers-contrast` 现行值是 more / less / custom。
- masonry 正式名是 `grid-lanes`；跨引擎未齐。
- `@scope` 在 Cascade 6 探索稿；Houdini 里只有 `@property` 是 Baseline 2024。
- Tailwind v4 的 `theme()` 已弃，改用 CSS 变量。
- Shadow DOM 抗的是样式和选择器误伤，不是安全边界；iframe 才是源隔离（见 [[comparisons/嵌入三路径对照]]）。
- 不搬生成器整段 CSS，不写凭证，不写卡 JSON，本页不声称任何真机验收。

## 相关内容

- [[concepts/前端架构名词与取舍]]
- [[concepts/动画库与动效管线]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/嵌入三路径对照]]
- [[concepts/酒馆宿主与iframe分层]]
- [[queries/前端视觉与灵感站点蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/无障碍与包容设计]]
- [[concepts/CJK排印与竖排]]
- [[concepts/概念分级]]
- [[concepts/前端设计库/README-前端设计库]]

## 映射到本仓库

跨文档 HUD 的 `backdrop-filter` 糊不到宿主聊天区；要磨砂就挂同一文档，或只糊框内。
框内 `1vh` = iframe 高，不是浏览器视口。
楼内碎片用 `data-*` 选择器，别把 utility 泄进宿主消息楼。
细则见上列相关页，不在本页展开。
