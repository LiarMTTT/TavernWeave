---
title: CJK排印与竖排
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
  - https://www.w3.org/TR/clreq/
  - https://www.w3.org/TR/jlreq/
  - https://www.unicode.org/reports/tr50/
  - https://www.w3.org/TR/css-writing-modes-3/
  - https://www.w3.org/TR/css-ruby-1/
  - https://www.w3.org/International/articles/ruby/
  - https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-ruby-element
  - https://cldr.unicode.org/
  - https://cldr.unicode.org/index/downloads
  - https://www.unicode.org/reports/tr35/
  - https://www.unicode.org/reports/tr35/tr35-messageFormat.html
  - https://www.rfc-editor.org/info/bcp47
  - https://www.rfc-editor.org/rfc/rfc5646.html
  - https://std.samr.gov.cn/
  - https://projectfluent.org/fluent/guide/
  - https://tc39.es/ecma402/
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
---

# CJK排印与竖排

行业排印与 locale 合同：中日韩怎么排、竖排字怎么转、注音/ruby 怎么标、日期数字按哪套 locale 数据走。不是已采用皮肤，也不等于浏览器已经按需求文档画完。检索日：2026-08-14。国标全文不进 Vault。

## 一句话定义

CJK 排印是「汉字文化圈出版物要长什么样」的需求与实现合同；竖排是其中一条书写方向；注音/ruby 是字旁标注；CLDR / BCP 47 是 locale 标签和格式数据，不是排版引擎。

## 为什么重要

同一段中文在大陆横排、台港直排、日文混排里，标点落点、引号形态、西文是否侧放都不一样。网页侧要分清三层：需求文档说什么、CSS/Unicode 规定怎么算、引擎实际画了什么。角色卡消息楼和开局页若做竖排或注音，只能接到现有渲染管线，不能假装自己是印刷引擎。

## 权威入口

检索日 2026-08-14。下表 15 条均可点；CLREQ 与 B2-Type-01 / B2-I18n-13 是**同一份枢纽**，不是两条新发现。

| # | 入口 | 当时状态 | 本页用法 |
|---|---|---|---|
| 1 | [CLREQ](https://www.w3.org/TR/clreq/) | Group Note Draft，2026-08-04 | 中文排版需求。B2-Type-01 与 B2-I18n-13 同文 |
| 2 | [JLREQ](https://www.w3.org/TR/jlreq/) | WG Note，2020-08-11 | 日文组版需求；英文本为官方 |
| 3 | [UAX #50](https://www.unicode.org/reports/tr50/) | Unicode 17.0.0，2025-07-24，Rev. 33 | 竖排默认朝向 `vo` |
| 4 | [CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/) | Rec，2019-12-10 | `writing-mode` / `text-orientation`；不用 `vrt2` |
| 5 | [CSS Ruby 1](https://www.w3.org/TR/css-ruby-1/) | WD，2022-12-31 | `ruby-position`，含 `inter-character` |
| 6 | [W3C Ruby Markup](https://www.w3.org/International/articles/ruby/) | 实现综述 | 简单 ruby 普遍可用；注音要 `inter-character` |
| 7 | [HTML `ruby`](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-ruby-element) | WHATWG 活标准 | 标注关系，不规定落点 |
| 8 | [CLDR](https://cldr.unicode.org/) | 数据现行 **48.2**（2026-03-17 发布） | locale 数据枢纽。B3-CLDR |
| 9 | [CLDR Downloads](https://cldr.unicode.org/index/downloads) | 各版冻结、不改已发布包 | 取数入口 |
| 10 | [UTS #35 LDML](https://www.unicode.org/reports/tr35/) | 与 CLDR 发行对齐 | 数据结构与算法 |
| 11 | [LDML Part 9 MF2](https://www.unicode.org/reports/tr35/tr35-messageFormat.html) | 文头 Version 48.2 | MessageFormat 2；**不兼容 ICU1** |
| 12 | [BCP 47](https://www.rfc-editor.org/info/bcp47) | RFC 5646 + RFC 4647 | 语言标签与匹配 |
| 13 | [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) | 2009-09 | 标签语法真身 |
| 14 | [全国标准信息公共服务平台](https://std.samr.gov.cn/) | 国标官方入口。B3-GB | **只记入口，不搬全文、不绕登录** |
| 15 | [Fluent Syntax Guide](https://projectfluent.org/fluent/guide/) | 指南仍活 | 正式 spec 页 `…/fluent/spec/` **404** |

[ECMA-402](https://tc39.es/ecma402/) 是 JS `Intl` 合同，常间接消费 CLDR，不另占表行。

## 如何运作

### 需求文档 ≠ 浏览器保证

[CLREQ](https://www.w3.org/TR/clreq/) 与 [JLREQ](https://www.w3.org/TR/jlreq/) 写的是「实现应当满足的组版需求」，状态分别是 Group Note Draft 与 Working Group Note，**不是** CSS Rec，也不是「Chrome / Firefox / Safari 已经按全文做完」的保证。JLREQ 以英文本为权威，主要依据 JIS X 4051，并声明不打算升 Recommendation。CLREQ 文头写明草稿、勿当已定稿引用。

CLREQ 的硬口径：排版规则上**地区差大于繁简差**。大陆少数直排/繁体书仍按大陆标点习惯；台港直排按当地习惯。用户代理应按**区域**（BCP 47 的 region），不要只看「简体/繁体」开关。大陆点号多落字面一角，台港多居中；大陆直排引号常换成直角引号。

### 竖排：UAX #50 + `vert`，不用 `vrt2`

CSS 竖排先改块流向：[Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/) 的 `writing-mode: vertical-rl`（中日传统直排，行从右往左）或 `vertical-lr`。默认 `text-orientation: mixed` 时，每个字的朝向跟 [UAX #50](https://www.unicode.org/reports/tr50/) 的 `Vertical_Orientation`（`vo`）：

| `vo` | 含义 |
|---|---|
| `U` | 正立，与码表相同 |
| `R` | 顺时针转 90° |
| `Tu` | 通常要换竖排字形；缺字形时可正立回退 |
| `Tr` | 通常要换竖排字形；缺字形时可侧放回退 |

`vo` 在 UAX #50 里是**信息性**属性：无标记时给可互换的默认朝向，高层协议（标记、排版软件）可以覆盖。汉字、假名、谚文默认正立；拉丁词句默认侧放。

字形替换走 OpenType **`vert`（Vertical Alternates）**。Writing Modes 3 写明：面向混排朝向的 **`vrt2` 不被 CSS 使用**——`vrt2` 把朝向交给字体设计师；CSS 用 UAX #50 决定正立或侧放，再对需要换形的字启用 `vert`。不要在卡 CSS 或字体子集说明里把 `vrt2` 写成网页竖排合同。

直排里的西文/数字，CLREQ 列了正立、侧放、当汉字全角三种；浏览器默认只保证 UAX #50 那套，其余要作者用 `text-orientation` 或标记覆盖。

### 注音 / ruby：`inter-character` 引擎未齐

HTML [`ruby`](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-ruby-element) 只建立「基文 ↔ 标注」关系。落点由 [CSS Ruby 1](https://www.w3.org/TR/css-ruby-1/) 的 `ruby-position` 管：`over` / `under` / `inter-character`。横排时 `inter-character` 把注音插到字右侧，并强制标注侧 `writing-mode: vertical-rl`；竖排容器里它等价于 `over`。

[W3C Ruby Markup](https://www.w3.org/International/articles/ruby/)：简单单面 ruby 三大引擎都能画（横排在上、竖排在右）。注音（Bopomofo / 注音符号）**没有**专用标记，写法与 mono ruby 相同，但必须 `ruby-position: inter-character` 才会跑到字右。该文与 Can I Use（统计至 2026-06）一致的结论是：**`inter-character` 引擎未齐**——Safari 18.2+ 较完整；Chromium 偏部分；Firefox 解析层常拒。声调移到注音右侧更未齐。表格型 ruby（先全部 `rb` 再全部 `rt`）主要是 Gecko 能排；Blink/WebKit 能解析但常排错。双面 ruby 也不要当跨引擎基线。

### CLDR / BCP 47 / 消息格式

[CLDR](https://cldr.unicode.org/) 提供日期、数字、复数、排序等 locale 数据。检索日 2026-08-14：站点 News 写 **2026-03-17 发布 CLDR 48.2**；2026-07-07 关闭的是 **49** 决议期调查，**现行数据仍是 48.2**。[LDML Part 9](https://www.unicode.org/reports/tr35/tr35-messageFormat.html) 文头 Version 也是 48.2。

语言标签走 [BCP 47](https://www.rfc-editor.org/info/bcp47)（[RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html) 语法 + RFC 4647 匹配）。排印区域应用 `zh-CN` / `zh-TW` / `zh-HK` 这类带 region 的标签，不要只用 `zh-Hans` / `zh-Hant` 当标点规则开关。

MessageFormat 2 是 ICU MessageFormat 的继任。LDML Part 9 设计限制写明 **Non-Goal：与 ICU MessageFormat 1.0 语法向后兼容**。旧 `{count, plural, …}` 不能当 MF2 原文喂。Fluent 是另一套 FTL；[指南](https://projectfluent.org/fluent/guide/) 仍可开，正式 spec 页 `https://projectfluent.org/fluent/spec/` 在 2026-08-14 **404**。JS 侧格式化常经 [ECMA-402](https://tc39.es/ecma402/) / `Intl`，那是 API，不是 CLDR 数据包本身。

### 国标：只记入口

CLREQ 引用 GB/T 15834—2011《标点符号用法》等。本 Vault **只记** [全国标准信息公共服务平台](https://std.samr.gov.cn/)。不搬条文、不贴预览、不写绕登录办法。B2-Type 已记：该号预览常要登录。需要条文时人去官方站，不把国标正文写进概念页。

## 与蒸馏账本的重叠

| 账本编号 | 关系 |
|---|---|
| B2-Type-01 | 枢纽就是 CLREQ；本页展开，不是第二份 CLREQ |
| B2-I18n-13 | **与 B2-Type-01 同文**（第二批已标）。本页合并书写，不拆成两条「新发现」 |
| B3-Vert | 竖排 / 注音 / ruby；枢纽 UAX #50 |
| B3-CLDR | CLDR / BCP 47 / MF2 |
| B3-GB | 国标入口四条量级；本页只留门户 |

## 例子

- 正例：直排容器写 `writing-mode: vertical-rl`，混排朝向交给 UAX #50；需要换形的标点依赖带 `vert` 的字体。
- 正例：日文读音用 `<ruby><rb>漢</rb><rt>かん</rt></ruby>`，落点用 `over`；不要为注音另造元素。
- 正例：界面串的 locale 写成 `zh-TW`，数字/日期走 CLDR 48.2 数据或 `Intl`，不手写「民国年」分支当通用合同。
- 反例：把 CLREQ/JLREQ 某一节当成「浏览器已实现」的验收标准。
- 反例：网页竖排启用 `vrt2`，或假定 `inter-character` 在 Chromium / Firefox 与 Safari 同形。
- 反例：把 ICU1 / Fluent / MF2 三种消息串当成可互换原文。
- 反例：把 GB/T 全文或登录墙后的预览贴进 Vault。

## 边界与易混概念

- 本页不是角色卡皮肤清单，也不是「本仓库已采用竖排/注音」。
- CLREQ/JLREQ ≠ CSS Writing Modes ≠ 某引擎实现。
- `writing-mode` 改块流向；`text-orientation` 改字在竖排行里的朝向；`direction` / UBA 管双向文，不是直排。
- `vert` ≠ `vrt2`。CSS 合同是前者加 UAX #50。
- ruby 标记 ≠ 注音落点。注音要 `inter-character`，而该值引擎未齐。
- BCP 47 标签 ≠ 排印实现。`zh-Hant` 不自动换成台港标点。
- CLDR 数据版本 ≠ LDML 章节号 ≠ ICU 库版本 ≠ `Intl` 实现年。
- MF2 ≠ ICU1 ≠ Fluent。MF2 明文不兼容 ICU1；Fluent 正式 spec 页曾 404。
- 国标入口 ≠ 已授权全文。不进 Vault 正文。

## 来源与证据

- 需求：CLREQ 2026-08-04 DNOTE；JLREQ 2020-08-11 Note。
- 竖排：UAX #50（Unicode 17.0.0）；Writing Modes 3 Rec 明确不用 `vrt2`、改走 UAX #50 + 侧放/正立。
- 注音：CSS Ruby 1 WD；W3C Ruby 文与 Can I Use 均显示 `inter-character` 未齐。
- Locale：cldr.unicode.org 2026-08-14 仍列 48.2 为已发布数据；LDML Part 9 文头 48.2；BCP 47 = RFC 5646 + 4647。
- 消息格式：Part 9 Non-Goal 不兼容 ICU1；Fluent `…/fluent/spec/` 404，指南仍 200。
- 国标：只核到 https://std.samr.gov.cn/ 门户可开。

### 已知冲突（必须保留，不得静默合并）

1. CLREQ/JLREQ 是需求文档，**不是**浏览器保证实现。
2. 竖排用 UAX #50 + `vert`，**不用** `vrt2`（CSS 明文）。
3. `inter-character` **引擎未齐**；不可写成跨引擎基线。
4. GB/T **只记** https://std.samr.gov.cn/ ，不搬全文、不绕登录。
5. CLDR 数据现行 **48.2**（检索日 2026-08-14）；49 仍在后续周期，未替换 48.2。
6. Fluent 正式 spec 页 **404**；MF2 **不兼容** ICU1。
7. B2-I18n-13 与 B2-Type-01 **同文重叠**（都是 CLREQ），本页只写一次。
8. UAX #50 的 `vo` 是信息性默认；与「字体里有竖排替换」不是同一层。
9. 简单 ruby 三引擎可用 ≠ 表格型 / 双面 / 注音右侧已齐。
10. CLREQ：地区差 > 繁简差；与「按 Hans/Hant 切标点」的常见实现习惯冲突，两边都留。

## 映射到本仓库

映射，不是「某张卡已经竖排」。

**消息楼。** 玩家看见的楼是宏 → 正则 → Markdown → 净化 → `.mes_text`，见 [[concepts/消息渲染与正则管线]]。`writing-mode` 或 `<ruby>` 若要出现在楼里，只能接这条管线（正则注入 HTML，或模型输出被允许留下的标签）。Showdown 不保证保留 `ruby`；净化名单未核之前，不能假设注音标记能活过导入。OMNI 选择器必须走 `data-*`，见 [[concepts/OMNI正则与data属性选择器]]。给整列 `.mes_text` 套 `vertical-rl` 会连带旋转宿主气泡、选项条和行动桥，三张稳定卡都没有这条合同。

**开局页。** 自定义开局是一次性向导，见 [[concepts/开局页路径]]。星月远程开局跑在独立 HTML；怪谈是楼内表。竖排/注音若做，优先放**开局页自己的文档**（远程页或楼内片段的局部容器），不要改宿主 `body` 的书写方向。跨文档 iframe 的 `writing-mode` 不传给父页，见 [[concepts/酒馆宿主与iframe分层]]。

**注音。** 横排消息楼里做台湾注音，规范路径是 `<ruby>` + `ruby-position: inter-character`。因引擎未齐，不能当发布验收项；真机未验之前只当实验。

**Locale。** 工坊目录、卡片语言字段、`Intl` 格式化走 BCP 47 + CLDR 48.2 口径。不要手写一套与 CLDR 分叉的日期/数字规则当「中文标准」。

**国标。** 不进 Vault 正文，不进 `raw/` 镜像。需要 GB/T 15834 等条文时，人从官方入口查；本页不代替标准文本。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/消息渲染与正则管线]]
- [[concepts/开局页路径]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/OMNI正则与data属性选择器]]
- [[comparisons/嵌入三路径对照]]
