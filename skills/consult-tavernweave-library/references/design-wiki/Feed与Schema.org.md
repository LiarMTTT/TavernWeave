---
title: Feed与Schema.org
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
  - https://schema.org/
  - https://schema.org/docs/releases.html
  - https://www.w3.org/TR/json-ld11/
  - https://ogp.me/
  - https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
  - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
  - https://www.rssboard.org/rss-specification
  - https://www.rfc-editor.org/rfc/rfc4287.html
  - https://www.jsonfeed.org/version/1.1/
  - https://www.w3.org/TR/activitypub/
  - https://www.w3.org/TR/webmention/
  - https://atproto.com/specs/atp
  - https://datatracker.ietf.org/doc/charter-ietf-atp/
  - queries/第三批蒸馏目标.md
  - concepts/HTTP合同与问题详情.md
  - concepts/JSON Schema与Protobuf.md
knowledge_class: factual
---

# Feed与Schema.org

本页不是已采用技术，也不是工坊或角色卡必须上结构化数据、社交预览或订阅源的工单。检索时间：2026-08-14。账本枢纽是 [[queries/第三批蒸馏目标]] **B3-Semweb**、**B3-Feed**。只谈公开词表、编码与联合协议，不写黑帽 SEO、账号劫持或 exploit。

## 一句话定义

Schema.org 是网页结构化数据的**共享词表**；Feed 是内容更新的**联合格式或社交投递协议**。词表告诉机器「这页是什么」，源告诉机器「后来又出了什么」。两者都不是 JSON Schema，也不是搜索引擎的行为规范。

## 为什么重要

卡片预览、富摘要、订阅源、联邦社交常被并成「SEO / 开放图谱」一词。实际至少四层：词表、编码、平台消费规则、联合/投递协议。层混了，就会把 schema.org 当 Google 真源，或把已死的 X Cards 当现行规范。

## 权威入口

检索时间：2026-08-14。下表 **13** 条。B3-Semweb 原 13 行、B3-Feed 原 16 行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [schema.org](https://schema.org/) | 词表真身。页脚 **V30.0**（2026-03-19），CC BY-SA 3.0。编码可用 JSON-LD / Microdata / RDFa。首页可带 development 横幅，**发布钉仍看 releases**。 |
| 2 | [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) | W3C Rec 2020-07-16；废止 1.0。是编码，不是词表。`/TR/json-ld/` 同文。 |
| 3 | [Open Graph Protocol](https://ogp.me/) | 社交图对象协议。必填 `og:title` / `og:type` / `og:image` / `og:url`。OWF 0.9。灵感含 Dublin Core、canonical、微格式、RDFa。 |
| 4 | [X Cards 历史概述](https://developer.x.com/docs/x-for-websites/cards/overview/abouts-cards) | **官方正文已死**。采集：307 到 `docs.x.com`，等价路径 404，校验器 307 到登录。本轮直抓 **403**。勿当现行规范。 |
| 5 | [DCMI Metadata Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) | 现行词表，2020-01-20。鼓励 `dcterms:`；旧 `dc:` 无限期留。ISO 15836 付费，本库不收。 |
| 6 | [Google 结构化数据导论](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) | Search **行为**真源。明文：Search 以该文为准，不以 schema.org 为准。推荐 JSON-LD，也认 Microdata / RDFa。 |
| 7 | [RSS 2.0 Specification](https://www.rssboard.org/rss-specification) | 现行 **2.0.11**（2009-03-30）。功能冻结在 2.0.1，后续只澄清。CC BY-SA。董事会维护，**不是** IETF/W3C Rec。 |
| 8 | [RFC 4287 Atom](https://www.rfc-editor.org/rfc/rfc4287.html) | 2005-12，Atom **读源**格式。写源是 [RFC 5023 AtomPub](https://www.rfc-editor.org/rfc/rfc5023.html)，不是同一份。 |
| 9 | [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/) | 2020-08-07。`version` 用该 URL。MIME 应 `application/feed+json`，发现时可回退 `application/json`。社区规范，无 SPDX。 |
| 10 | [ActivityPub](https://www.w3.org/TR/activitypub/) | W3C Rec 2018-01-23。C2S + S2S；数据层是 [AS2 Core](https://www.w3.org/TR/activitystreams-core/) / [Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)（2017-05-23）。TR 冻结，勘误在 wiki/ED。 |
| 11 | [Webmention](https://www.w3.org/TR/webmention/) | W3C Rec 2017-01-12。链接通知，**不是**订阅源格式。 |
| 12 | [AT Protocol 规范](https://atproto.com/specs/atp) | 现行实现真源。PDS / Relay / App View。文内仍写「计划交 IETF」。 |
| 13 | [IETF ATP 章程](https://datatracker.ietf.org/doc/charter-ietf-atp/) | 工作组 **2026-03-19 已批**、Active。尚无 RFC。仓库稿 [draft-holmgren-at-repository](https://datatracker.ietf.org/doc/html/draft-holmgren-at-repository-02) 是 I-D，勿当 RFC。 |

旧文 [Harvard RSS 2.0](https://cyber.harvard.edu/rss/rss.html) 仍活但停在 **2.0.1**，勿当现行。sitemap / robots 归 [[queries/第三批蒸馏目标]] B3-SEO，不在本表。

## 如何运作

### 词表、编码、消费方

Schema.org 只定类型和属性（`Thing` → `CreativeWork` / `Person` 等）。怎么写进 HTML 是另一层：JSON-LD 脚本、Microdata 属性、或 RDFa。`@context` 常见仍写 `http://schema.org/`；站点 https 也能开，两写都要收。形状合同是另一族，见 [[concepts/JSON Schema与Protobuf]]；不要把词表类型写成 `$schema`。

V30.0 加了 GS1、Dublin Core、Open Graph 的**等价标注**。这表示词表可对齐，不表示 Facebook / X / Google 会按同一规则消费。

Open Graph 用 `meta property` 把页面变成图对象。四必填缺一，对象就不完整。结构化子属性（`og:image:width` 等）必须跟在对应根标签后面；再出现一个根标签，上一组就结束。`og:image` 的编码与 MIME 见 [[concepts/媒体格式与编解码]]，静图合同见 [[concepts/JPEG XL与HDR静图]]，不在本页展开。

Google Search 用这些标记做富结果资格，但**必填/推荐字段以 Search 文档为准**。schema.org 上多出来的属性，对 Google 可以无意义。站内检索是另一条，见 [[concepts/站内搜索与Pagefind]]，不要和富结果并成「一种搜索标记」。

X / Twitter Cards 曾用 `twitter:card` 等。2026-08-14：**没有可引用的第一方正文**。历史实现不能升格为现行规范。

Dublin Core 是更老的书目词表。ogp.me 自称受它启发；Schema.org 30.0 给了等价标注。ISO 15836 是付费快照，本库只记 DCMI 网页。

### 联合源：RSS / Atom / JSON Feed

三者都是「频道 + 条目」的拉模型。

RSS 2.0：根 `rss version="2.0"`，下一个 `channel`。频道必填 `title` / `link` / `description`。`item` 元素全可选，但至少要有 `title` 或 `description`。日期跟 RFC 822（年四位更好）。扩展必须进命名空间；核心元素自己不进命名空间，为了兼容 0.91/0.92。规范路线图写明：格式冻结，新能力走模块或新格式。

Atom：IETF 读源。有命名空间、必填 `id` / `updated` 等，比 RSS 严。AtomPub（5023）是用 HTTP 写 Atom 资源，不是阅读器解析的那份格式。完整/分页/归档源另见 RFC 5005。

JSON Feed 1.1：顶层 `version` + `title` + `items[]`。条目用 `id`；正文可以是 `content_text` 或 `content_html`。1.1 把单数 `author` 换成 `authors` 数组，旧字段永远合法，读端优先 `authors`。

推送不是源格式。[WebSub](https://www.w3.org/TR/websub/)（原 PubSubHubbub）是订阅通知；2018 Rec，2026-06-02 只改安全考虑。RSS 自己的 `cloud` 是更老的轻量 pub-sub，不要和 WebSub 并成一词。浏览器把加密报文投到 Service Worker 的那条，见 [[concepts/Web Push与角标]]，也不是 Feed。源文件若被 CDN 缓存，那是 [[concepts/边缘缓存与SWR]]，不是联合格式。PWA 可以缓存或离线打开源页，见 [[concepts/PWA与存储配额]]，那是安装与配额，不是 RSS/Atom 本身。

指标拉取也是拉模型，但名称空间完全不同：Prometheus 抓的是样本，见 [[concepts/Prometheus与OpenMetrics]]；遥测信号见 [[concepts/可观测与OpenTelemetry]]。两者都不是内容订阅源。

### 社交投递：ActivityPub 与 AT Protocol

ActivityPub：每个 actor 有 `inbox` / `outbox`。可以只做 C2S、只做 S2S，或都做。投的是 ActivityStreams 2.0 JSON，不是 RSS 条目。超媒体 UI 往返见 [[concepts/HTMX与超媒体]]，不要和 inbox/outbox 并成一种「开放网页」。

AT Protocol：身份在 DID，内容在可验证仓库，网络侧是 PDS + Relay（旧文常写 BGS）+ App View。应用约定在 Lexicon / NSID，不在核心协议里写关注或头像。官网「计划交 IETF」与 IETF ATP 组已成立**同时为真**；组已批 ≠ 已有 RFC。

Webmention：你的页链到对方时，发一条通知。它不提供条目列表，也不能替代 Feed。

## 必须保留的冲突

- X Cards **官方正文已死**（307 / 404 / 本轮 403）。无第一方现行规范。
- Google Search **不以** schema.org 为 Search 行为真源。
- Schema.org 30.0 已给 DC / OG 做等价标注；ogp.me 自称灵感来自 DC。词表可对齐，平台消费规则各写各的。
- schema.org 首页可带 development 横幅；现行发布仍是 V30.0。
- Harvard RSS 停在 2.0.1；现行是 rssboard **2.0.11**。
- AT Protocol 官网仍写「计划交 IETF」；IETF ATP 组 2026-03-19 已批。尚无 RFC；I-D 勿当 RFC。
- Schema.org ≠ JSON Schema。形状合同见 [[concepts/JSON Schema与Protobuf]]；HTTP 错误体见 [[concepts/HTTP合同与问题详情]]。
- Atom ≠ AtomPub。读源 vs 写协议。
- ActivityPub ≠ AT Protocol。W3C Rec vs 厂商规范 + 已批未出 RFC 的 IETF 组。
- Webmention ≠ Feed。通知 vs 源。
- RSS Advisory Board 文本不是 IETF/W3C Rec；功能冻结。
- sitemap / `changefreq` 归 [[queries/第三批蒸馏目标]] B3-SEO，不在本页。
- ISO 15836 付费，不收。
- 本页映射的是「公告可否联合、页面可否被机器读类型」；**不是**「工坊或卡必须上 Schema.org / Feed」。

## 例子

- 正例：文章页 JSON-LD `@type: Article`，另加 OG 四必填；Google 资格另对 Search 文档，不把 schema.org 全属性当必填。
- 正例：更新列表发 RSS 2.0.11 或 Atom 或 JSON Feed 1.1；阅读器拉源，不假装这是 ActivityPub。
- 正例：联邦社交用 ActivityPub inbox/outbox；AT 网用仓库 + Relay。两套并存，不写成「开放社交只有一种」。
- 反例：把 X Cards 旧博客或第三方备忘当现行规范。
- 反例：把 Harvard `rss.html` 或「RSS 2.0.1 已冻结」写成现行入口，丢掉 2.0.11。
- 反例：把 Schema.org 写成 JSON Schema，或把 Google 富结果失败怪罪「词表版本不是 30.0」。
- 反例：把 Webmention、WebSub、Web Push 或 Prometheus 抓取当成一种 RSS。

## 边界与易混概念

- 不包括：黑帽 SEO、sitemap/robots 细则、工坊 Gateway 字段、凭证、攻击步骤。
- Schema.org 词表 ≠ JSON-LD 语法 ≠ Google 富结果规则 ≠ OG 预览 ≠ 已死的 X Cards。
- Feed 格式 ≠ 推送（WebSub / RSS `cloud`）≠ 浏览器推送（[[concepts/Web Push与角标]]）≠ 链接通知（Webmention）≠ 联邦协议。
- 指标拉取 ≠ 内容源。Prometheus 与 OpenTelemetry 各管样本和信号，见上两页，不要和 RSS/Atom 并成「一种 pull」。
- h-entry / h-event 是微格式，日历真源是 iCalendar（[[queries/第三批蒸馏目标]] B3-Cal），不要和本页词表并成一套。
- CloudEvents 是事件信封，见 [[concepts/GraphQL与异步事件合同]]，不是订阅源。
- 若用 HTTP 暴露「列出更新」的机器接口，操作清单走 [[concepts/OpenAPI与Arazzo]]，错误体走 [[concepts/HTTP合同与问题详情]]，那不是 Schema.org，也不是 RSS。
- 易混：听到「结构化数据」就以为一份 schema.org 能同时满足搜索、Facebook、X。

## 映射到本仓库

卡运行时**未采用** Schema.org / OG / Feed / ActivityPub / AT Protocol。消息楼、开局页、控制中心仍走现有宿主与 MVU，见 [[concepts/角色卡技术路径总图]]。工坊主路径仍是同步 REST，见 [[concepts/后端架构名词与工坊对照]]。

若工坊或项目站要发更新列表，行业侧可映射 RSS / Atom / JSON Feed，选一种并钉 MIME 与发现链接。这是「公告可联合」，不是「卡必须出源」。联邦社交与 Webmention 只作概念对照。产品落点见 [[comparisons/工坊架构该上与不该上]]；渲染/SEO 心智见 [[concepts/前端架构名词与取舍]]。

本 Vault 不收 ISO 15836 全文，不把已死 X Cards 路径写进正式入口。

## 来源与证据

- Schema.org V30.0 与 DC/OG 等价标注：[schema.org](https://schema.org/) 页脚；[releases](https://schema.org/docs/releases.html) 30.0 行（PR #4689 等）。
- JSON-LD 1.1 废止 1.0：Rec 文首 Status。
- OG 四必填与灵感来源：[ogp.me](https://ogp.me/) Introduction / Basic Metadata / 页脚。
- X Cards 正文已死：B3-Semweb 采集（307/404）；本轮 `developer.x.com/.../abouts-cards` → 403。
- Search 不以 schema.org 为准：Google 导论 “Structured data vocabulary and format” 段。
- DCMI 现行与 `dcterms:`：Terms 页 Date Issued 2020-01-20 与 Introduction。
- RSS 2.0.11：rssboard 文首 Editor's Note 与 Roadmap 冻结句。
- Atom 读源：RFC 4287 文首。
- JSON Feed 1.1 与 MIME：规范页 Version 1.1 — 8/7/2020。
- ActivityPub 两层：Rec Abstract / Overview。
- Webmention 是通知：Rec Abstract。
- ATP 组已批、官网仍写计划交 IETF：datatracker 章程 2026-03-19 Approved；[atproto specs](https://atproto.com/specs/atp) “What is Missing?”。

账本：[[queries/第三批蒸馏目标]] B3-Semweb、B3-Feed。已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/JSON Schema与Protobuf]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/站内搜索与Pagefind]]
- [[concepts/HTMX与超媒体]]
- [[concepts/边缘缓存与SWR]]
- [[concepts/PWA与存储配额]]
- [[concepts/JPEG XL与HDR静图]]
- [[concepts/Web Push与角标]]
- [[concepts/媒体格式与编解码]]
- [[concepts/Prometheus与OpenMetrics]]
- [[concepts/可观测与OpenTelemetry]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/角色卡技术路径总图]]
