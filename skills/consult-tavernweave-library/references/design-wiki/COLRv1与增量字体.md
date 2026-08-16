---
title: COLRv1与增量字体
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
  - https://www.w3.org/TR/css-fonts-4/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/font-palette
  - https://developer.mozilla.org/en-US/docs/Web/CSS/@font-palette-values
  - https://learn.microsoft.com/en-us/typography/opentype/spec/colr
  - https://learn.microsoft.com/en-us/typography/opentype/spec/cpal
  - https://caniuse.com/colr-v1
  - https://caniuse.com/colr
  - https://www.w3.org/TR/IFT/
  - https://www.w3.org/TR/PFE-evaluation/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide
  - https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings
  - https://developer.chrome.com/blog/colrv1-fonts
  - queries/第五批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/CJK排印与竖排.md
  - concepts/Web性能与INP.md
  - concepts/视觉CSS与设计token.md
knowledge_class: factual
---

# COLRv1与增量字体

本页不是已采用字栈，也不是工坊必须改嵌字方案的工单。检索日 2026-08-14。兼容摘自各页正文，不是本机实测。拒盗字库，不收字文件。

对照 [[concepts/CJK排印与竖排]]（CLREQ / `vert`）、[[queries/第三批蒸馏目标]] B3-Img（fonttools / glyphhanger）、[[10-收件箱/写回候选/第四批-B4-TypeFoundry]]（许可）。本页只收彩色表、palette、可变轴 CSS、IFT。

## 一句话定义

彩色字与增量字是三层合同：OpenType COLR/CPAL 规定怎么涂；CSS `font-palette` / 可变轴规定怎么选槽和轴；Incremental Font Transfer 规定怎么按补丁增量传。不要并成「网页字体」。

## 为什么重要

同一句「嵌一张彩色可变字」会落到完全不同的合同：文件有没有 CPAL、UA 认不认 COLRv1、作者色会不会被夹回 sRGB、投递是静态 `unicode-range` 还是 IFT 补丁。混成一词，就会把 Safari 的 COLRv0、Chrome 的 COLRv1、B3 静态子集和尚未落地的 IFT 写成同一条能力。

## 权威入口

检索日 2026-08-14。下表 **12** 条与 [[10-收件箱/写回候选/第五批-B5-Font]] 同号。B4-TF-08/09 已点过轴登记与 Fonts 4 URL，本页展开彩色与 `tech()`，不当新发现。B5-Font 的采集行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [CSS Fonts 4](https://www.w3.org/TR/css-fonts-4/) | 枢纽。WD **2026-08-11**。`font-palette` / `@font-palette-values` / `palette-mix()`；`src` 的 `tech()`：`color-COLRv0` `color-COLRv1` `variations` `palettes` `incremental`。Fonts 3 已是 Rec；4 仍是 WD |
| 2 | [MDN `font-palette`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-palette) | Baseline Widely，跨引擎自 **2022-11**。`normal` / `light` / `dark` / `--ident` / `palette-mix()`。调色板优先于 `color`，即使 `!important` |
| 3 | [MDN `@font-palette-values`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-palette-values) | 同档 Baseline。`font-family` 必填；`base-palette`；`override-colors`。dashed-ident **不是** `var()` |
| 4 | [OpenType COLR 1.9.1](https://learn.microsoft.com/en-us/typography/opentype/spec/colr) | 页标 **2024-05-30**。v0：底向上图层 + 纯色。v1：Paint DAG；渐变、仿射、合成；`PaintVar*` 可随轴变色停。无 CPAL 则忽略整张 COLR。`0xFFFF` = 前景色 |
| 5 | [OpenType CPAL 1.9.1](https://learn.microsoft.com/en-us/typography/opentype/spec/cpal) | 页标 **2024-05-29**。sRGB **BGRA**。调色板 0 为默认。v1 头带 `USABLE_WITH_LIGHT/DARK_BACKGROUND`。COLR 必须有 CPAL |
| 6 | [Can I Use COLRv1](https://caniuse.com/colr-v1) | 2026-08-14：Chrome **98+**、Firefox **107+**、Edge 98+。**Safari 至 26.5 / TP 均无** |
| 7 | [Can I Use COLRv0](https://caniuse.com/colr) | Chrome 71+、Firefox 32+。Safari **11+**，**17.0–17.1 空窗**，17.2 起恢复。v0 ≠ v1 |
| 8 | [W3C IFT](https://www.w3.org/TR/IFT/) | CR Draft **2025-11-18**。不是 Rec。无 implementation report。初始子集 + `IFT `/`IFTX` 补丁图；`iftk` 表键 Brotli 差、`ifgk` 字形键。`tech(incremental)` 选择加入 |
| 9 | [PFE Evaluation](https://www.w3.org/TR/PFE-evaluation/) | WG Note **2020-10-15**。IFT 前评测，不是现行编码。静态 `unicode-range` 会拆坏 kerning / 塑形（§2.8） |
| 10 | [MDN 可变字体指南](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide) | 登记轴：`wght` `wdth` `slnt` `ital` `opsz`。登记轴小写、自定义轴大写 |
| 11 | [MDN `font-variation-settings`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) | Baseline Widely **2018-09**。有对应高层属性时勿用；一旦写出就盖住 `font-weight` 等。`slnt` 正角与 CSS `oblique` 方向相反 |
| 12 | [Chrome 98 COLRv1](https://developer.chrome.com/blog/colrv1-fonts) | 2022 装载公告。无 COLRv1 的 UA 可回退同文件单色轮廓。当时 `font-palette` 仍「计划中」；现以 02 的 Baseline 为准 |

OpenType Variations 总览是 B4-TF-08，不升编号。

## 如何运作

### 文件层：COLR 涂，CPAL 给槽

v0 是图层栈，只能纯色；在可变字体里只能变轮廓。v1 是 Paint 有向无环图，才能渐变、合成、随轴变色停。无 CPAL 则整张 COLR 作废。`0xFFFF` 不是调色板下标，是前景色。CPAL 槽是 sRGB BGRA；COLR 渐变插值必须线性光 + 预乘 alpha，与 SVG 表默认非线性 sRGB 两边留。

### 样式层：palette 选槽，登记轴走高层

`font-palette` 的 `light` / `dark` 对的是**背景**元数据（CPAL 的 `USABLE_WITH_*`），不是调色板自己的明暗。`@font-palette-values` 可写任意 CSS 色；Fonts 4 写明实现可先映回 sRGB，作者勿依赖宽色一定进字形。登记轴走 `font-weight` 等；自定义轴才走 `font-variation-settings`。

`tech()` 是选择加入，不是默认能力。同一 `src` 列表可写 `tech(incremental, color-COLRv1)` 再写 `tech(incremental, color-COLRv0)`；不支持的 UA 跳过该项。无 COLRv1 时画同文件单色轮廓，是字形回退，不是调色板回退。

`font-palette` 可动画；仍按 discrete 实现的浏览器会在两套调色板间硬切。`palette-mix()` 是规范插值，不与 02 的 Baseline 句自动对齐。

### 传输层：IFT 是补丁，不是第二份子集器

IFT 客户端：读当前子集里的补丁图 → 按码位/特性/设计空间选补丁 → 下载并应用 → 补丁可能改掉补丁图，再读。`iftk` 是整表 Brotli 差；`ifgk` 按 glyph ID 替换 `glyf`/`loca`/`gvar`/`CFF`/`CFF2`。不要并成「Brotli 分包」。可与 `unicode-range` 并用，range 应等于完全展开后的覆盖。离线保存须先 Fully Expand。

Fonts 4 回退例：不支持 incremental 时给 WOFF2，支持时给未压缩 OT。这与 B2「默认 WOFF2」不是同一条投递合同。PFE §6：字母文现网静态子集够用；塑形文子集会坏读；CJK 在 4G+ 才第一次谈 Patch Subset。2020 的 Range Request / Patch Subset ≠ 08 的 `IFT `/`IFTX` 表。多数内容会用到整份字时，增量往往更慢。

## 必须保留的冲突

- **Safari 无 COLRv1，Chrome/Firefox 有。** 06：Safari 至 26.5/TP 仍无；Chrome 98+、Firefox 107+ 有。07：COLRv0 Safari 现网有（17.0–17.1 除外）。`tech(color-COLRv1)` 必须带轮廓或 COLRv0 回退。两边都留。
- **IFT CRD ≠ 已落地 CJK 方案。** 08 无实现报告。09 是 2020 评测，当时编码不是 08 的表。B3-Img 仍是现网工具，但 09 §2.8 写静态子集会坏塑形。不要写成「IFT 已取代子集」。
- **Fonts 4 仍是 WD ≠ palette 未实现。** 01 2026-08-11 仍 WD；02/03 自 2022-11 Baseline Widely。
- **CPAL sRGB ≠ `@font-palette-values` 任意 CSS 色。** 文件槽是 sRGB BGRA；作者色可先被夹到 sRGB。
- **`font-palette` vs `color`。** 调色板赢，`!important` 也改不了已上色层。
- **`font-variation-settings` vs 高层属性。** 登记轴应走高层；11 一旦写出就盖住。`slnt` 方向与 CSS 相反。
- 本页映射嵌字时的**彩色表 / palette / 投递合同**；**不是**「本仓库已采用 COLRv1 / IFT」。

## 例子

- 正例：彩色图标字用 `tech(color-COLRv1)` 一项，再写 COLRv0 或同文件轮廓回退；Safari 落到 v0。
- 正例：换品牌色用 `@font-palette-values` 的 `override-colors`，不要给已上色层加 `color: … !important`。
- 正例：字重走 `font-weight`；只有自定义四字轴才写 `font-variation-settings`。
- 正例：CJK 大字现网先合法静态子集（B3-Img）并核许可（B4），不把 IFT CRD 当默认投递。
- 反例：写成「彩色矢量字已全引擎」或「IFT 已取代 glyphhanger」。
- 反例：从字体天下 / 求字体 / 破解方正·汉仪打包嵌卡。

## 边界与易混概念

- 不包括：CLREQ / `vert` / UAX #50（[[concepts/CJK排印与竖排]]）；fonttools / glyphhanger（B3-Img）；思源/OFL/字厂通道（B4）；盗版站、破解包、字文件。
- COLRv0 ≠ COLRv1。v0 是图层纯色；v1 才是 Paint 图。
- `font-palette` ≠ `color`。已上色层调色板赢；`0xFFFF` 层才吃前景。
- `light`/`dark` palette ≠ `color-scheme` / `light-dark()`。后者是页面色方案，见 [[concepts/视觉CSS与设计token]]。
- IFT ≠ 静态 `unicode-range` ≠ WOFF2。补丁增量保留段间 GPOS/GSUB；静态切会在共享标点上拆坏版式。
- Fonts 4 WD ≠ `font-palette` 未实现。
- 本页不是「本仓库已采用 COLRv1 / IFT」。

## 拒盗与拒破解

不进页：字体天下 / 求字体 / 字客网 / 「免费商用打包」镜像；破解方正·汉仪·华康；把 FFL/订阅字当 OFL 再分发；付费 OpenType 全文盗贴。许可真身仍看 [[10-收件箱/写回候选/第四批-B4-TypeFoundry]]。本页不收字文件。

## 映射到本仓库

映射，不是「某张卡已经嵌彩色字」。

- **排印**回 [[concepts/CJK排印与竖排]]；**投递性能**回 [[concepts/Web性能与INP]] 与 B2-Type-12 font-best-practices。本页不重写 WOFF2 默认句。
- **许可**回 [[10-收件箱/写回候选/第四批-B4-TypeFoundry]]。嵌卡前先核该族是否允许子集/自托管；OFL 一般允许，FFL / 订阅通道不行或未核。
- **现网默认**：可变轴用高层 CSS；彩色字按 06/07 分 v0/v1 回退；CJK 大字仍先合法子集。IFT 未当现网默认。
- 开局页 / 消息楼若嵌 `@font-face`，仍走既有嵌入 UI 与宿主分层，见 [[concepts/开局页路径]]、[[concepts/酒馆宿主与iframe分层]]。本页不宣布已接线。

## 来源与证据

- 彩色表与 palette：CSS Fonts 4；MDN `font-palette` / `@font-palette-values`；OpenType COLR / CPAL 1.9.1。
- 装载分叉：Can I Use `colr-v1` / `colr`；Chrome 98 公告（当时 palette 仍「计划中」，现以 02 的 Baseline 为准）。
- 增量传输：W3C IFT CR Draft 2025-11-18（无实现报告）；PFE Evaluation 2020-10-15（不是现行编码）。
- 可变轴：MDN 可变字体指南与 `font-variation-settings`。
- 查询账本：[[queries/第五批蒸馏目标]] B5-Font；重叠见 [[queries/第二批蒸馏目标]] B2-Type、[[queries/第三批蒸馏目标]] B3-Img；许可见 [[10-收件箱/写回候选/第四批-B4-TypeFoundry]]。

已知冲突见上节，不静默覆盖。IFT 会否出现实现报告、Safari 会否装 COLRv1：检索日之后标未知。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] 三层合同分开写；入口 12 条与 B5-Font 对齐
- [x] Safari/Chromium COLRv1 分叉、IFT≠静态子集，两边都留
- [x] 未收盗字库、破解包、字文件
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[concepts/CJK排印与竖排]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/Web性能与INP]]
- [[concepts/开局页路径]]
- [[concepts/酒馆宿主与iframe分层]]
- [[10-收件箱/写回候选/第五批-B5-Font]]
- [[10-收件箱/写回候选/第四批-B4-TypeFoundry]]
- [[queries/第五批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
