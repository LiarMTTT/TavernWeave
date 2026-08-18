---
title: 构建链与Vite
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
  - https://vite.dev/blog/announcing-vite8
  - https://vite.dev/guide/migration
  - https://vite.dev/guide/features
  - https://vite.dev/config/shared-options
  - https://v7.vite.dev/guide/rolldown
  - https://rolldown.rs/
  - https://oxc.rs/
  - https://lightningcss.dev/
  - https://postcss.org/
  - https://esbuild.github.io/
  - https://github.com/vitejs/vite/issues/22649
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/打包回封路径.md
  - concepts/前端架构名词与取舍.md
  - concepts/视觉CSS与设计token.md
knowledge_class: factual
---

# 构建链与Vite

本页不是已采用构建器，也不是发卡 `pack`。检索时间：2026-08-14。账本枢纽是 [[queries/第二批蒸馏目标]] 的 **B2-Build**。只谈行业工具链默认，不宣布本仓库已换 Vite 8。

## 一句话定义

构建链是把源码变成浏览器能跑的产物：解析、转译、打包、压缩。Vite 8（2026-03-12）把这条链收成 **Rolldown + Oxc + Lightning CSS**；**压缩**默认 Lightning（CSS）和 Oxc（JS），**整链 CSS 处理仍默认 PostCSS**。

## 为什么重要

以前 Vite 用两套打包器：开发靠 esbuild 快，生产靠 Rollup 出优化包。两套管线要胶水对齐，插件和模块语义会分叉。[Vite 8 公告](https://vite.dev/blog/announcing-vite8) 把这称为自 Vite 2 以来最大的架构改动：改成一个 Rust 打包器 Rolldown。看文档时必须先分清三层——**打包、转译、压缩**——再问 CSS 走哪条处理器。把「默认换了压缩器」读成「CSS 整链已换 Lightning」会写错配置。

## 权威入口

B2-Build 枢纽是 Vite 8 公告。下列 10 条是 2026-08-14 直读过的官方页，不是镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Vite 8 公告](https://vite.dev/blog/announcing-vite8) | 2026-03-12 稳定；Rolldown 统一打包；Oxc 编译器；lightningcss 从可选 peer 变成正式依赖 |
| 2 | [从 v7 迁移](https://vite.dev/guide/migration) | JS 转译/压缩默认 Oxc；CSS **压缩**默认 Lightning；`esbuild` / `rollupOptions` 兼容层会弃 |
| 3 | [Features · CSS](https://vite.dev/guide/features) | 生产默认用 Lightning **压缩** CSS；**其余 CSS 处理仍走 PostCSS** |
| 4 | [共享配置 `css.transformer`](https://vite.dev/config/shared-options) | 默认 `'postcss'`；`'lightningcss'` 标 Experimental |
| 5 | [Vite 7 Rolldown 预览](https://v7.vite.dev/guide/rolldown) | 渐进迁移：先 `rolldown-vite` 再升 8；当时已写清压缩默认换了、esbuild 变可选 |
| 6 | [Rolldown](https://rolldown.rs/) | Rust 打包器；自称 Rollup 兼容 API、对标 esbuild 能力；Vite 8+ 的统一打包器 |
| 7 | [Oxc](https://oxc.rs/) | 解析/转译/压缩/lint 工具集；Vite 用的是 transformer 与 minifier，不是「装了 Oxc 就等于 Oxlint」 |
| 8 | [Lightning CSS](https://lightningcss.dev/) | Rust CSS 工具：降语法、加前缀、压缩、CSS Modules；会去掉它认为多余的前缀 |
| 9 | [PostCSS](https://postcss.org/) | JS 插件链转 CSS；Vite 有 `postcss.config.*` 就自动套到导入的 CSS |
| 10 | [esbuild](https://esbuild.github.io/) | Vite 8 **之前**的开发转译/依赖预打包/压缩对照；现为可选依赖，不是默认引擎 |

VitePress 属于 [[queries/第二批蒸馏目标]] **B2-Docs**，不进本表。token 流水线（Style Dictionary 等）属 **B2-Token**，见 [[concepts/视觉CSS与设计token]]。

## 如何运作

### 一条链，三个默认

[公告](https://vite.dev/blog/announcing-vite8) 把 Vite 8 写成端到端入口：构建工具 Vite、打包器 Rolldown、编译器 Oxc。对照 [迁移指南](https://vite.dev/guide/migration)：

| 步骤 | Vite 7 及更早 | Vite 8 默认 | 退回旧器 |
|---|---|---|---|
| 生产打包 / 依赖预打包 | Rollup + esbuild | Rolldown | 无双打包器；先用 `rolldown-vite` 隔离 |
| JS/TS/JSX 转译 | esbuild | Oxc | `esbuild` 选项会自动转成 `oxc`，已弃用 |
| JS 压缩 | esbuild | Oxc Minifier | `build.minify: 'esbuild'`（须自装 esbuild） |
| CSS 压缩 | esbuild | Lightning CSS | `build.cssMinify: 'esbuild'`（须自装 esbuild） |
| CSS 处理（插件、Modules、嵌套等） | PostCSS | **仍是 PostCSS** | `css.transformer: 'lightningcss'`（实验） |

开发期预打包、TypeScript/JSX、配置打包，公告和 Features 都改口为 Rolldown / Oxc，不再写「开发 esbuild、生产 Rollup」。

### 压缩换了，整链 CSS 没换

[Features](https://vite.dev/guide/features) 原话：生产构建默认用 Lightning CSS **minify**；**However, PostCSS is still used for other CSS processing.** 压缩发生在 PostCSS **之后**，并看 `build.cssTarget`。

整链换 Lightning 要显式 `css.transformer: 'lightningcss'`。[共享配置](https://vite.dev/config/shared-options) 写默认 `'postcss'`，该项标 Experimental。开了之后，CSS Modules 改走 `css.lightningcss.cssModules`，不要再写给 PostCSS 的 `css.modules`。

因此 B2-Build 采集要点成立：**压缩已默认 Lightning/Oxc；整链 CSS 仍默认 PostCSS。**

### 兼容层不是旧引擎还在

迁移指南有一层自动转换：`optimizeDeps.esbuildOptions` → `rolldownOptions`，顶层 `esbuild` → `oxc`，`build.rollupOptions` 改名 `build.rolldownOptions`。能跑起来不等于 esbuild/Rollup 还在核心路径。`transformWithEsbuild` 已弃，建议 `transformWithOxc`；插件若仍调前者，要自己装 esbuild。

Node 要求与 Vite 7 相同：20.19+ / 22.12+（`require(esm)` 不需旗标）。安装体积约比 Vite 7 大 15 MB：公告写约 10 MB 来自现已正式依赖的 lightningcss，约 5 MB 来自 Rolldown 二进制。`@vitejs/plugin-react` v6 用 Oxc 做 React Refresh，默认不再依赖 Babel；要 React Compiler 须显式走 `@rolldown/plugin-babel`。

## 必须保留的冲突

- **压缩默认 ≠ 整链默认。** 公告强调 lightningcss 现为正式依赖、压缩开箱更好；Features / `css.transformer` 明确整链仍默认 PostCSS，Lightning 整链是实验开关。B2-Build 按后一句记账，不把「装了 lightningcss」写成「CSS 已换引擎」。
- **Oxc Minifier 产品态。** [oxc.rs](https://oxc.rs/) 把 minifier 标 Alpha；Vite 8 迁移指南已把它当作 JS 压缩默认。两边都留：站点成熟度标签慢于 Vite 发版口径。
- **esbuild 假设 ≠ Oxc 假设。** 迁移指南要求对照两份 minify assumptions；属性混淆（`mangleProps` 等）Oxc 尚未支持。怀疑压缩破坏时先对照，不先改业务代码。
- **Lightning 压缩可能改前缀面。** Lightning 文档写会去掉它认为多余的 vendor prefix，并按 targets 降语法。社区 [vite#22649](https://github.com/vitejs/vite/issues/22649) 报过：默认 `cssMinify: 'lightningcss'` 丢掉未加前缀的 `backdrop-filter`，只留 `-webkit-`，现 Chromium 上玻璃失效；`cssMinify: 'esbuild'` 则两份都在。这是**已报告的压缩器差异**，不是 Vite 官方保证「玻璃一定坏」。本仓 [[concepts/视觉CSS与设计token]] 已把 `backdrop-filter` 当视觉合同；升 8 时要核产物，不与跨 iframe 糊不到父页并成一个因。
- **CJS `default` 互操作。** 迁移指南改了开发/生产一致规则；可用已弃的 `legacy.inconsistentCjsInterop` 临时回退。不要把旧 Vite 7 的 default 语义写成 Rolldown 现行合同。
- **VitePress ≠ 本页。** 文档站生成器走 B2-Docs，不在本页展开。
- **打包回封 ≠ Vite。** [[concepts/打包回封路径]] 是卡源 → JSON/PNG。名字都叫「构建/打包」，合同不是同一条链。
- **映射 ≠ 采用。** 独立工坊站或文档站若将来用 Vite，是产品决策；本页不宣布已换。

## 例子

- 正例：升 Vite 8 后不改 `css.transformer`，继续用 `postcss.config.js` + Autoprefixer；只接受生产 CSS 由 Lightning 压缩。
- 正例：要验证「是 Rolldown 还是 Vite 8 其它改动」，先在 Vite 7 换 `rolldown-vite`，再升 8。
- 正例：玻璃面板同时写标准 `backdrop-filter` 与 `-webkit-`；升 8 后对照压缩产物，必要时 `build.cssMinify: 'esbuild'` 做对照，不把「糊不到」先怪跨文档。
- 反例：看见默认 Lightning 就删 PostCSS 配置，或把 `css.transformer: 'lightningcss'` 写成稳定默认。
- 反例：把本页写成「工坊/发卡已改用 Vite 8」，或把 [[concepts/打包回封路径]] 的 `workflow.mjs pack` 叫成 Vite 构建。
- 反例：把 Oxc 全家桶（Oxlint / Oxfmt）写成 Vite 8 已默认启用。

## 边界与易混概念

- 不包括：本仓库已采用哪条构建器、卡 JSON/PNG 回封步骤、成品皮肤。
- 不包括：VitePress / Starlight 文档站（B2-Docs）；token 构建（B2-Token）；Tailwind v4 / vanilla-extract（[[concepts/Tailwind与原子CSS]]；账本 B3-TW / B3-CssT）；HTML import maps（B3-Imp）。
- 易混：压缩器 ≠ 转译器 ≠ 打包器。Lightning 默认只接压缩；Oxc 接 JS 转译+压缩；Rolldown 接打包。
- 易混：Vite 开发服务 ≠ 生产 `build()`。默认换的是引擎，不是「开发也变成整包」；Full Bundle Mode 在公告里仍标实验。
- 易混：Rolldown 宣传的 Module Federation 能力 ≠ [[concepts/前端架构名词与取舍]] 里 webpack 联邦的「何时该上」。
- 区分：先问「改的是打包、转译还是压缩」，再问 CSS 是 PostCSS 整链还是只 minify。

## 映射到本仓库

映射放最后，不当过滤器。

- **工坊独立站 / 文档：** 行业默认可以是 Vite 族（含 VitePress），见 [[comparisons/工坊架构该上与不该上]]、[[concepts/前端架构名词与取舍]]。本页只提供 Vite 8 默认表，不写「工坊必须升 8」。
- **发卡回封：** 仍走 `card_workflow` compose/pack，见 [[concepts/打包回封路径]]、[[concepts/组件库registry与recipe]]。不要把 Rolldown 写进 recipe。
- **远程页 / git-mount：** 真身在远程仓构建，壳只挂 blob，见 [[concepts/git挂载与远程真身]]。远程若升 Vite 8，压缩器差异会进产物 CSS；玻璃与 `backdrop-filter` 先对产物，再对跨文档滤镜。
- **嵌入 UI：** 开局页、HUD、控制中心今天多半是源文件进卡或远程页，不是本 Vault 里起 Vite dev server。本页不因此否定行业构建链。

本页不写「已采用 Vite 8 / Rolldown / Oxc / Lightning」。蒸馏目标仍在 [[queries/第二批蒸馏目标]]；B3-CssT / B3-TW / B3-Imp 收回来另页，不并进这里。

## 来源与证据

- Vite 8 日期与 Rolldown 统一打包：公告 2026-03-12。
- 默认表（Oxc 转译/压缩、Lightning 只接 CSS 压缩、PostCSS 仍整链）：[迁移指南](https://vite.dev/guide/migration)、[Features · CSS](https://vite.dev/guide/features)、[共享配置 `css.transformer`](https://vite.dev/config/shared-options)。
- Oxc minifier 成熟度：oxc.rs 标 Alpha；Vite 8 已当 JS 压缩默认。两边都留。
- Lightning 前缀面：Lightning 文档；社区 [vite#22649](https://github.com/vitejs/vite/issues/22649) 为已报告差异，不是官方「玻璃必坏」。
- 查询账本：[[queries/第二批蒸馏目标]] B2-Build；[[queries/第三批蒸馏目标]] B3-CssT、B3-TW、B3-Imp 另页。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/打包回封路径]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/组件库registry与recipe]]
- [[concepts/git挂载与远程真身]]
- [[concepts/Tailwind与原子CSS]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
