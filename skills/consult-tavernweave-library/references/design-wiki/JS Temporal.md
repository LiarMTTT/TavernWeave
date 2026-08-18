---
title: JS Temporal
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - sillytavern
sources:
  - https://tc39.es/proposal-temporal/
  - https://github.com/tc39/proposal-temporal
  - https://github.com/tc39/proposals/blob/main/finished-proposals.md
  - https://github.com/tc39/ecma262/pull/3759
  - https://github.com/tc39/ecma402/pull/1044
  - https://tc39.es/ecma262/
  - https://tc39.es/ecma262/2026/
  - https://262.ecma-international.org/17.0/
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  - https://caniuse.com/temporal
  - https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/139
  - https://developer.chrome.com/release-notes/144
  - https://nodejs.org/en/blog/release/v26.0.0
  - https://tc39.es/proposal-temporal/docs/
  - https://github.com/tc39/notes/blob/main/meetings/2026-03/march-11.md
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# JS Temporal

本页不是已采用技术，也不是工坊必须换掉 `Date` 的工单。检索时间：2026-08-14。蒸馏自 [[queries/第三批蒸馏目标]] B3-Temp。WebFetch 核过 [proposal-temporal](https://tc39.es/proposal-temporal/) 与 [MDN Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)、[MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)。

## 一句话定义

JS `Temporal` 是 ECMAScript 的日期时间命名空间（像 `Math`，不是构造器），用来替换遗留 `Date`。它已是 TC39 **Stage 4**，但**还没有**写进现行 ECMA-262 正文。这是语言 API，**不是** Temporal.io 工作流引擎。

## 为什么重要

Stage 4 只证明委员会收口、有兼容实现。外文「已经进 ES2026」把阶段号当成已出版规范，不可信。Firefox / Chrome / Node 已开，Safari 稳版未开。卡内 iframe 若当「全浏览器都有」，会在 WebKit 上静默没有这个全局对象。

## 权威入口

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [proposal-temporal 活稿](https://tc39.es/proposal-temporal/) | Stage 4 Draft / 2026-07-27；写明拟加入 ECMA-262 |
| 2 | [提案仓 README](https://github.com/tc39/proposal-temporal) | 「将并入」262 / 402，仓随后归档 |
| 3 | [finished-proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) | 已 Stage 4；**预期出版年 2027** |
| 4 | [ECMA-262 PR #3759](https://github.com/tc39/ecma262/pull/3759) | 并入 PR，截至 2026-08-13 **仍开** |
| 5 | [ECMA-402 PR #1044](https://github.com/tc39/ecma402/pull/1044) | Intl / Era Month Code 并入，仍开 |
| 6 | [现行 ECMA-262 活稿](https://tc39.es/ecma262/) | Draft 2026-08-14，标题已是 ES2027；正文无 `Temporal` |
| 7 | [ES2026 快照](https://tc39.es/ecma262/2026/) | 年刊快照，无 `Temporal` |
| 8 | [ECMA-262 第 17 版](https://262.ecma-international.org/17.0/) | 2026-06 大会批准的正式 2026 版，无 `Temporal` |
| 9 | [MDN Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) | Limited availability，不是 Baseline |
| 10 | [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | 仍是 Baseline；文内称 Date 为 legacy |
| 11 | [Can I use Temporal](https://caniuse.com/temporal) | Safari 稳版到 27 未开；TP 默认关 |
| 12 | [Firefox 139 说明](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/139) | 2025-05-27 已开 |
| 13 | [Chrome 144 说明](https://developer.chrome.com/release-notes/144) | 2026-01-13 已开；标题写 “Temporal in ECMA262” |
| 14 | [Node 26 发布](https://nodejs.org/en/blog/release/v26.0.0) | 2026-05-05 默认开 |
| 15 | [提案文档](https://tc39.es/proposal-temporal/docs/) | 类型与 cookbook，不是规范真身 |
| 16 | [TC39 2026-03-11 记录](https://github.com/tc39/notes/blob/main/meetings/2026-03/march-11.md) | Conclusion：advances to stage 4 |

上表 **16** 条。B3-Temp 采集行不在本页镜像。

## 如何运作

### Stage 4 ≠ 已写入现行 ECMA-262

两边都留：

- **已 Stage 4**：2026-03-11 全会无异议通过。活稿抬头是 Stage 4 Draft。finished-proposals 已列 Temporal。Firefox 139、Chrome 144、Node 26 已出货。
- **未进现行正文**：#3759 / #1044 仍开。2026-08-14 抓取的 [活稿](https://tc39.es/ecma262/) 与 [ES2026 快照](https://tc39.es/ecma262/2026/)、[第 17 版](https://262.ecma-international.org/17.0/) 均搜不到 `Temporal`。finished-proposals 的预期出版年是 **2027**，不是 2026。

外文「已经进 ES2026」把 Stage 4 或引擎出货写成已出版年刊。对照正式快照，这句话不可信。Chrome 144 说明标题写 “Temporal in ECMA262”，那是实现发行词，不能反过来证明 #3759 已合入。

活稿自我介绍说「含已 Stage 4、将进下一本快照的提案」。Temporal 已 Stage 4，却还停在并入 PR。两边都留：目录承诺 vs 正文尚未出现。

### 类型怎么拆

`Temporal` 不可 `new`、不可当函数调。按提案文档与 MDN：

| 类型 | 表示什么 |
|---|---|
| `Instant` | 历史上唯一瞬间（Unix epoch 纳秒），无时区、无历法 |
| `ZonedDateTime` | 瞬间 + IANA 时区 + 历法；DST 安全算术 |
| `PlainDate` / `PlainTime` / `PlainDateTime` | 日历日、墙上钟、日期+钟；**不带**时区 |
| `PlainYearMonth` / `PlainMonthDay` | 「2020-10 例会」「每年 7-14」 |
| `Duration` | 长短，用于加减 |
| `Now` | 取当前瞬间 / 系统时区 / ISO 日历日 |

串行化走 RFC 9557（ISO 8601 / RFC 3339 的扩展，可带时区与 `u-ca=`）。默认历法是 ISO 8601。对象不可变：改字段用 `with()` / `add()`，返回新实例。

### Date 的坑只点到为止

MDN：`Date` 同时冒充时间戳和「年月日时分秒」；组件只能按 UTC 或设备本地时区读，没有任意 IANA 时区，也没有「无时区的日历日 / 墙上钟」。setter 会就地改；`Date.parse` 字符串不能稳定解析；月份从 0 起。MDN 因此把 Date 标成 legacy，并写「新代码考虑 Temporal，先查兼容」。Date 仍是 Baseline Widely available。两边都留：规范意图替换 ≠ 今天可以当 Date 已死。

### Safari 稳版未开

[Can I use](https://caniuse.com/temporal)：Chrome / Edge 144+、Firefox 139+ 已开；Safari 3.1–27 与 iOS Safari 均未开；Safari TP **默认关**。提案 README 给 Firefox / Chrome / Node 标了 shipped，JavaScriptCore/Safari 只挂 bug，没有 shipped。MDN 标 Limited availability，不是 Baseline。未跑真机；稳版结论转引上表，不写成「本机已验」。

生产若要跨 Safari，提案 README 列 `@js-temporal/polyfill`（Alpha）与 `temporal-polyfill`（Stable）。仓内自带 polyfill 只给文档 playground，README 写明 **DO NOT** 用在项目里。

## 必须保留的冲突

- Stage 4 ≠ 已写入现行 ECMA-262。finished-proposals 预期年 **2027**；#3759 / #1044 仍开；ES2026 第 17 版与 2026-08-14 活稿均无 `Temporal`。外文「进 ES2026」不可信。
- 活稿自称收录已 Stage 4 提案，与正文尚未出现并存。
- Chrome 144「in ECMA262」是实现发行词，不是 #3759 已合的证明。
- 引擎已开 ≠ 规范正文已合入 ≠ Baseline。
- MDN 称 Date 为 legacy，Date 仍是 Baseline；Temporal 不是 Baseline。
- Safari 稳版未开，与 Firefox / Chrome / Node 已开并存。Safari TP 默认关 ≠ 稳版已开。
- JS Temporal ≠ Temporal.io。
- 工坊「现在不用」≠「API 不正当」。本页**不是**「工坊必须换掉 Date」。

## 例子

- 正例：只要「日历上的一天」、不要时区，用 `Temporal.PlainDate`，不要 `new Date(y, m, d)`。
- 正例：先 `typeof Temporal === "undefined"` 再决定垫片或退回 `Date`。
- 反例：因 Stage 4 或博客标题，写成「ES2026 已含 Temporal」。
- 反例：把本页与 Temporal.io / B3-WF 并成一个「Temporal」。
- 反例：酒馆 iframe 直接用 `Temporal.Now`，不查 Safari。
- 反例：把 MDN「Date 是 legacy」读成「Date 已从语言删除」。

## 边界与易混概念

- 不包括：工坊已采用声明、垫片选型工单、攻击或凭证。
- JS Temporal ≠ Temporal.io。后者见 [[concepts/Saga三义与补偿]]。
- Date 的坑点到为止，不在本页重写 Date 全书。
- 区分方法：先问是语言 API 还是工作流引擎；再问依据是全会记录、并入 PR，还是年刊快照。

## 映射到本仓库

短句已在 [[concepts/后端架构名词与工坊对照]]「JS Temporal 未进现行 ECMA-262」。本页是那一句的入口与冲突展开，不是发布令。卡内时间、状态栏、开局页今天仍用 `Date` 或宿主格式化即可，见 [[concepts/控制中心与状态栏]]、[[concepts/开局页路径]]。要试 `Temporal`，必须特性检测，并接受 Safari 稳版没有全局对象。这是产品落点，不是对 Temporal 的行业否定。

## 来源与证据

权威入口上表 16 条。查询账本：[[queries/第三批蒸馏目标]] B3-Temp。

已知冲突见上节，不静默覆盖。尚缺：WebKit bug 页本轮未抓；Safari 稳版转引 Can I use 与提案 README。未跑浏览器或酒馆真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[concepts/后端架构名词与工坊对照]]
- [[concepts/Saga三义与补偿]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/控制中心与状态栏]]
- [[concepts/开局页路径]]
- [[queries/第三批蒸馏目标]]
