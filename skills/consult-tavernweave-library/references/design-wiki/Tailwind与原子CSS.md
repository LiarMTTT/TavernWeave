---
title: Tailwind与原子CSS
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
sources:
  - https://tailwindcss.com/docs/upgrade-guide
  - https://tailwindcss.com/docs/functions-and-directives
  - https://tailwindcss.com/docs/theme
  - https://tailwindcss.com/docs/styling-with-utility-classes
  - https://unocss.dev/presets/
  - https://unocss.dev/presets/wind3
  - https://panda-css.com/docs/overview/why-panda
  - queries/第三批蒸馏目标.md
  - concepts/视觉CSS与设计token.md
  - concepts/前端架构名词与取舍.md
knowledge_class: factual
---

# Tailwind与原子CSS

本页不是已采用皮肤，也不是发卡 `pack`，也不是工坊必须上 utility 的工单。检索时间：2026-08-14。只谈公开工具链入口与弃用合同。账本枢纽是 [[queries/第三批蒸馏目标]] 的 **B3-TW**。

## 一句话定义

原子 CSS（utility-first）是在标记上叠单职责类，少写选择器战争。Tailwind v4、UnoCSS、Panda 都走这条路，但入口、主题合同和生成时机不同：v4 用 CSS `@theme` 变量；Uno 用预设包；Panda 是构建期 CSS-in-JS，吐原子 CSS。

## 为什么重要

独立站点可以 utility + token 并行。嵌入别人的文档时，utility 容易漏进宿主全局。看文档时必须先分清三句：`theme()` 已弃；Uno 的 `preset-uno` 已改名 `wind3`；`wind3` 对标 Tailwind 3，`wind4` 是另一包。把兼容示例写成推荐，或把旧包名当现行入口，会配错链。

## 权威入口

B3-TW 枢纽是 Tailwind v4 升级指南。下列 **7** 条是 2026-08-14 直读过的官方页，不是镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Tailwind v4 升级指南](https://tailwindcss.com/docs/upgrade-guide) | 枢纽；CSS-first；`theme()` 建议改变量；JS 配置不再自动发现 |
| 2 | [Functions and directives](https://tailwindcss.com/docs/functions-and-directives) | `theme()` 官方标 deprecated；现行是 `@theme` / `--alpha()` / `--spacing()` |
| 3 | [Theme variables](https://tailwindcss.com/docs/theme) | `@theme` 既出 CSS 变量又生成 utility；`:root` 变量不自动出类 |
| 4 | [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) | utility-first 的官方说法 |
| 5 | [UnoCSS Official Packages](https://unocss.dev/presets/) | `preset-uno` / `preset-wind` 已弃，改名 `@unocss/preset-wind3` |
| 6 | [Wind3 preset](https://unocss.dev/presets/wind3) | Tailwind 3 / Windi 紧凑预设；不保证完全兼容 |
| 7 | [Why Panda](https://panda-css.com/docs/overview/why-panda) | 构建期静态分析 + PostCSS 吐原子 CSS；不是运行时 emotion |

vanilla-extract / CSS Modules 属 **B3-CssT**，不进本表。daisyUI / Flowbite 是组件层，见 [[queries/前端视觉与灵感站点蒸馏目标]]。

## 如何运作

### Tailwind v4：CSS 当配置

v3 的 `tailwind.config.js` + `@tailwind base/components/utilities` 不再是默认。v4 入口是 `@import "tailwindcss"`，token 写在 `@theme { --color-… }`。PostCSS 插件改到 `@tailwindcss/postcss`；Vite 建议 `@tailwindcss/vite`；CLI 改到 `@tailwindcss/cli`。浏览器底线：Safari 16.4+、Chrome 111+、Firefox 128+；更老的浏览器官方让留 v3.4。

`@theme` 不是普通 `:root`。它会指示框架生成对应 utility（`--color-mint-500` → `bg-mint-500`）。只想要变量、不要类，用 `:root`。

### theme() 已弃，兼容示例不是推荐

[Functions](https://tailwindcss.com/docs/functions-and-directives) 把 `theme()` 放在 Compatibility，原话：This function is deprecated，建议用 CSS 主题变量。升级指南仍演示 `theme(colors.red.500)` → `var(--color-red-500)`，并写媒体查询里变量不好用时仍可用 `theme(--breakpoint-xl)`（点号改成 CSS 变量名）。以「已弃、改用变量」为一句；不要把兼容示例写成现行写法。

JS 配置仍可用 `@config` 显式加载，但不再自动发现。`resolveConfig` 已删，官方让直接读 CSS 变量或 `getComputedStyle`。`corePlugins` / `safelist` / `separator` 在 v4 JS 配置里不支持。

### Uno：preset-uno 就是 wind3，不是 wind4

官方包表把 `@unocss/preset-uno` 和 `@unocss/preset-wind` 都标 deprecated，改名 `@unocss/preset-wind3`。npm 包 README 同一句。`unocss` 元包可 `import { presetWind3 } from 'unocss'`。

`wind3` 对标 Tailwind **3** / Windi，继承 `preset-mini`，明文不保证完全兼容（引号内容、任意 `bg-[…]` 会当颜色等）。`@unocss/preset-wind4` 是另一包，对标 Tailwind 4，主题键名有改（`fontFamily` → `font`，`breakpoints` → `breakpoint`）。旧文写 `presetUno()` 时，现行入口是 `presetWind3()`，不要跳到 wind4。

### Panda：构建期 CSS-in-JS，产物是原子 CSS

Panda 自称解决 RSC / 服务端时代的运行时 CSS-in-JS。静态分析 + PostCSS 在构建期生成原子 CSS；codegen 出轻量 JS，不在浏览器里注入 `<style>`。token 写法受 W3C Design Tokens 影响，但 DTCG 2025.10 仍是 CG 终稿，不是 W3C Standard，见 [[concepts/视觉CSS与设计token]]。官方写明：纯 HTML/CSS、PHP 模板、要绝对零 JS 时不要用 Panda。

Panda 也出现在 **B3-CssT**（vanilla-extract 对照）。本页只记它是原子 CSS 引擎；CSS Modules ≠ CSS module scripts 留给那条。

## 必须保留的冲突

- **`theme()` 已弃 ≠ 升级指南里还能写。** Functions 页标 deprecated；升级指南仍给媒体查询兼容写法，且点号改成 `theme(--breakpoint-xl)`。以「已弃、改用变量」记账，不把兼容示例写成推荐。
- **`preset-uno` 已改名 wind3。** 官方包表与 npm 都写 deprecated → `@unocss/preset-wind3`。`preset-wind` 同一改名。`wind4` 是另包，不要并进这一句。
- **Uno 兼容口号 ≠ 类名合同。** wind3 目标是 Tailwind/Windi 紧凑兼容，文档同时列引号、`background-position`、动画名冲突。
- **Panda「W3C token spec」≠ Standard。** 营销句受 DTCG 影响；现行仍是 CG 终稿。两边都留。
- **映射 ≠ 采用。** 独立站可用；嵌入宿主的卡不要当已采用。本页不是已采用皮肤。

## 例子

- 正例：v4 项目用 `@theme` 定义 `--color-*`，自定义 CSS 写 `var(--color-red-500)`，不写 `theme(colors.red.500)`。
- 正例：Uno 新项目装 `@unocss/preset-wind3` 或从 `unocss` 引 `presetWind3`；要对齐 Tailwind 4 再显式换 `preset-wind4` 并改主题键。
- 正例：独立工坊站可以 utility + token；嵌入宿主的卡 UI 用 BEM / `data-*`，见 [[concepts/前端架构名词与取舍]]。
- 反例：把升级指南里的 `theme()` 示例当成 v4 推荐 API。
- 反例：把 `preset-uno` 写成现行包名，或把改名读成「已经变成 wind4」。
- 反例：把本页写成「本仓库已采用 Tailwind v4 / Uno / Panda」，或把 daisyUI 当成引擎本身。

## 边界与易混概念

- 不包括：本仓库已采用哪套 utility、成品皮肤、卡 JSON/PNG、凭证。
- 不包括：vanilla-extract / CSS Modules（B3-CssT）；token 构建 Style Dictionary（B2-Token）；Vite 整链（B2-Build），见 [[concepts/构建链与Vite]]。
- 易混：原子 CSS ≠ 组件库。daisyUI / Flowbite / shadcn 建立在 utility 之上，不是引擎。
- 易混：`@theme` 变量 ≠ 普通 `:root` 变量。前者出类，后者不出。
- 易混：`wind3` ≠ `wind4`。改名只把 uno/wind 收到 wind3。
- 易混：Panda 的 `token()` 是生成代码里的查询函数，不是 Tailwind 已弃的 `theme()`。
- 区分：先问「主题值从哪读」，再问「类是扫描标记生成还是 codegen」。

## 映射到本仓库

映射放最后，不当过滤器。

- **独立工坊站 / 文档：** 行业可以选 Tailwind v4 或 Uno；本页只提供现行入口，不写「工坊必须上 utility」。
- **嵌入 UI / 同文档挂载：** utility 容易漏进宿主，见 [[concepts/视觉CSS与设计token]]、[[concepts/前端架构名词与取舍]]。卡侧优先 `data-*` / BEM。
- **远程页 / git-mount：** 真身在远程仓构建，壳只挂 blob，见 [[concepts/git挂载与远程真身]]。远程若用 v4，主题走 CSS 变量，不把 `theme()` 写进新 CSS。
- **无头组件：** Base UI / Radix 不捆 Tailwind，见 [[concepts/无头组件与根节点]]。

本页不写「已采用 Tailwind v4 / Uno / Panda」。B3-CssT 收回来另页，不并进这里。

## 来源与证据

- Tailwind v4 入口与 `theme()` 弃用：升级指南、Functions and directives、Theme variables（2026-08-14 直读）。
- Uno 改名：Official Packages 与 Wind3 preset；`preset-uno` / `preset-wind` → `@unocss/preset-wind3`；`wind4` 另包。
- Panda 构建期原子 CSS：Why Panda；DTCG 仍是 CG 终稿，见 [[concepts/视觉CSS与设计token]]。
- 查询账本：[[queries/第三批蒸馏目标]] B3-TW；组件层灵感见 [[queries/前端视觉与灵感站点蒸馏目标]]。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[queries/前端视觉与灵感站点蒸馏目标]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/无头组件与根节点]]
- [[concepts/git挂载与远程真身]]
- [[concepts/概念分级]]
- [[concepts/CSS平台2026]]
- [[concepts/构建链与Vite]]
- [[concepts/Lit与自定义元素]]
- [[concepts/COLRv1与增量字体]]
- [[concepts/HTMX与超媒体]]
- [[concepts/中文设计系统]]
