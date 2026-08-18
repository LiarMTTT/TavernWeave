---
title: WinterTC与服务器JS
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
  - https://wintertc.org/
  - https://wintertc.org/faq
  - https://wintertc.org/work
  - https://www.w3.org/groups/cg/wintercg/
  - https://www.w3.org/community/wintercg/
  - https://www.w3.org/community/wintercg/2025/01/10/goodbye-wintercg-welcome-wintertc/
  - https://ecma-international.org/publications-and-standards/standards/ecma-429/
  - https://min-common-api.proposal.wintertc.org/
  - https://ecma-international.org/wp-content/uploads/ECMA-429_1st_edition_december_2025.pdf
  - https://runtime-keys.proposal.wintertc.org/
  - https://docs.deno.com/api/web/about/
  - https://bun.sh/docs/runtime/web-apis
  - https://nodejs.org/api/globals.html
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# WinterTC与服务器JS

本页不是已采用技术，也不是工坊或角色卡换运行时的工单。账本见 [[queries/第三批蒸馏目标]]（B3-Winter）。检索日 2026-08-14。只收委员会与运行时合同入口，不收攻击、CVE 或利用步骤。

## 一句话定义

WinterTC（Ecma TC55）是给**服务器 / 边缘上的 JS 运行时**订最低公共 Web API 面的技术委员会。它不发明一门新语言，也不替代 ECMA-262。现行标准号是 **ECMA-429**（Minimum common web API，2025 快照）。前身 WinterCG 是 W3C 社区组，**不能**发标准。

## 为什么重要

浏览器外的 JS 都在抄 Web API，但抄哪些、哪里允许偏，过去没有可引用的最低面。没有这份合同，`fetch` / `URL` / Streams 在 Node、Deno、边缘运行时上的「看起来像浏览器」只是各自文档。WinterTC 把最低面钉成 Ecma 标准，并把改 Web 规范的需求送回 WHATWG / W3C，而不是另起一份分叉 Fetch。本仓库工坊与角色卡栈**不因此换运行时**；行业正当性仍保留。

## 权威入口

本轮 WebFetch 核过 [wintertc.org](https://wintertc.org/)：TC55，目标是跨服务器运行时的 API 互操作，先订与 Web 共享的 minimum common API，并与 WHATWG / W3C 协作。下列 **13** 条是本页真源。

| # | 入口 | 钉什么 |
|---|---|---|
| 1 | [wintertc.org](https://wintertc.org/) | 现行枢纽。WinterTC = Ecma TC55，Technical Committee on Web-interoperable Server Runtimes。 |
| 2 | [WinterTC FAQ](https://wintertc.org/faq) | 目标、不做什么、与 WinterCG 的关系。本轮正文仍写「WinterTC 就绪后 WinterCG **将**关闭」——与第 4 条冲突，两边留。成员组织写 Bloomberg / Cloudflare / Deno / Igalia / Node.js。 |
| 3 | [WinterTC Work](https://wintertc.org/work) | Minimum Common API 标 **Standard**；Runtime Keys 标 **Technical Report**；Sockets / Iterable Streams / CLI 标 **Proposal**；Fetch 与 Web Crypto Streams 是向 WHATWG / WICG 收集需求，不是 WinterTC 分叉稿。 |
| 4 | [W3C groups/cg/wintercg](https://www.w3.org/groups/cg/wintercg/) | 「The Web-interoperable Runtimes Community Group was **closed on 3 April 2025**.」工作已转 Ecma。 |
| 5 | [W3C community/wintercg](https://www.w3.org/community/wintercg/) | 同组社区首页：「This group was closed on **2025-04-03**.」 |
| 6 | [Goodbye WinterCG, welcome WinterTC](https://www.w3.org/community/wintercg/2025/01/10/goodbye-wintercg-welcome-wintertc/) | 2025-01-10 移交说明。当时仍写「WinterTC 完全就绪后社区组再关」。 |
| 7 | [ECMA-429 目录](https://ecma-international.org/publications-and-standards/standards/ecma-429/) | Ecma 出版物页：2025 快照的 Minimum common web API。 |
| 8 | [min-common-api 可读站](https://min-common-api.proposal.wintertc.org/) | 本轮页眉仍是 **Draft, 31 July 2026**。同一页又写「adopted by the General Assembly of December 2025」。可读站 ≠ 已摘 Draft 标。 |
| 9 | [ECMA-429 1st ed. PDF](https://ecma-international.org/wp-content/uploads/ECMA-429_1st_edition_december_2025.pdf) | 封面 **1st Edition / December 2025**。大会已过；不要只凭第 8 条的 Draft 标说「还没通过」。 |
| 10 | [Runtime Keys](https://runtime-keys.proposal.wintertc.org/) | 运行时标识符技术报告。收录**不**等于符合 Minimum Common API，也不等于背书。机器源 `runtime-keys.json`；「Published version: To be determined upon Ecma TR publication」。键含 `node` / `deno` / `bun` / `workerd` 等。 |
| 11 | [Deno Web Platform APIs](https://docs.deno.com/api/web/about/) | Deno **官方** Web 合同。自称实现大量 Web Platform API，差异写在本页（如 fetch、Cache）。不是 ECMA-429 符合性声明。 |
| 12 | [Bun Web APIs](https://bun.sh/docs/runtime/web-apis) | Bun **官方** Web 合同。声明 DOM / History 等浏览器面不相关；其余按类列出部分或完整支持。不是符合性证书。 |
| 13 | [Node.js Global objects](https://nodejs.org/api/globals.html) | Node **官方** 全局合同（本轮文档头为 v26.7.0）。列出 Node 自有全局，并纳入 AbortController、`fetch`、WebSocket 等 Web API。规范自己举例：Node 的 `globalThis` **不是** EventTarget。 |

Deno / Bun / Node 只收到上表合同页。不收安全通告、漏洞细节或攻击面清单。

## 如何运作

**两代组织。** 2022-05 在 W3C 成立 WinterCG（社区组，谁都能参加，但不能发标准）。2024-12 成立 Ecma TC55 / WinterTC。2025-01 公开发移交。W3C 组页钉 **2025-04-03 已关**。FAQ 本轮仍用将来时，当作过期句子，不要回写成「还没关」。

**ECMA-429 管什么。** 2025 快照：从 W3C / WHATWG 里抽出一份**最低**公共面，给想跟 Web 互操作的服务器运行时。符合实现必须按对应 Web 规范提供所列接口与属性，并符合 ECMA-262。可以多实现未列入的 Web API。扩展不得让规范行为不合规。年更是委员会意向，不是本页已见到的第二版。

**最低面在哪一层。** 索引要求 `globalThis` 上出现 DOM 的 AbortController / EventTarget、Fetch 的 `fetch` / Request / Response / Headers、URL / URLPattern、Streams、Encoding、File API 的 Blob / File、CompressionStream、Web Crypto、`performance`、WebAssembly 等。Web Workers **不强制**；只有运行时真有 `WorkerGlobalScope` 时才补事件处理器。`FormData` 的 HTML 表单参数不在最低面里，缺省行为有定义，传入 HTML 元素则本版不规定。

**全局对象不是 Window。** 规范不要求实现 `Window` / `WorkerGlobalScope` 接口本身，但可把主全局映射到 Window、把 worker 全局映射到 WorkerGlobalScope。对不上这些接口的全局，只能稳妥实现 `[Exposed=*]` 的 API。为避免新全局砸旧代码，允许拿掉 `readonly`，让用户删或覆盖。Node 被规范点名：异常走 `process` 的 `uncaughtException` / `unhandledRejection`，而不是 `window.onerror`。

**允许的偏离。** 服务器常没有 origin，因而会违反 Fetch「给请求加 Origin」的要求；规范要求把偏离和影响写进运行时文档。默认 `User-Agent` / `navigator.userAgent` 用来识别运行时，应看成不透明整串。

**WinterTC 不另写 Fetch。** FAQ 与 Work 一致：不 fork 现有 Web 规范；要改 Fetch 或 Web Crypto 流式，把需求送回 WHATWG / WICG。Sockets、CLI、`import.meta` / `navigator` 登记处都还不是 ECMA-429。

**Runtime key ≠ 符合性。** `deno` / `bun` / `node` 在表里，只说明标识符已登记。报告写明：收录不蕴含符合任何 Ecma 规范（含 Minimum Common API）。

## 行业何时该上

| 合同 | 何时该上 | 不该当成 |
|---|---|---|
| ECMA-429 最低面 | 库要在多个 Web 互操作运行时上跑同一套 `fetch` / URL / Streams | 「实现了 fetch 就等于符合 429」；浏览器 DOM 全集 |
| 各运行时官方合同 | 要用该运行时的超集、偏差、权限模型 | WinterTC 符合性声明 |
| Runtime Keys | 配置、条件导出、检测要稳定字符串 | 符合性、性能排名、背书 |
| Sockets / CLI 提案 | 需要 TCP 或 argv / env 的跨运行时面 | 已进 ECMA-429 |
| 运行时专有 API（`Deno.*` / `Bun.*` / `node:`） | 该运行时上的文件、进程、权限 | 最低公共 Web 面 |

## 必须保留的冲突

- ECMA-429 已过 2025-12 大会，可读站 2026-08-14 仍挂 Draft。目录页与 PDF 是已发布标准一侧；`min-common-api.proposal.wintertc.org` 页眉是 Draft 一侧。同一可读页甚至两句话并存。
- W3C 写 WinterCG 2025-04-03 已关；FAQ 与 2025-01 博文仍用「将关闭」。
- Runtime key 有名 ≠ 符合 Minimum Common API。
- FAQ 成员名单与 Keys 表不是同一集合（例如 `bun`）。
- 「工坊现在不换运行时」不是「429 不是正当行业合同」。

## 例子

- 正例：跨 Node / Deno / 边缘写可移植库时，先按 ECMA-429 最低面设计，再打开第 11–13 条看超集和偏离。
- 正例：要 TCP 或统一 `argv`，去 Work 页的 Proposal，不把它们写进「429 已标准化」。
- 反例：看见可读站页眉 Draft，就说大会还没过；或看见 PDF 的 December 2025，就说可读站已不是 Draft。
- 反例：把 runtime key 表里有 `bun` 写成「Bun 已符合 Minimum Common API」，或把 FAQ 成员名单写成符合性名单。
- 反例：把 WinterCG 文档或 wintercg.org 旧域当成 2026-08-14 的现行枢纽。

## 边界与易混概念

- 不包括：攻击面、CVE、绕过、凭证、具体打分榜、工坊换栈工单。
- WinterCG ≠ WinterTC。前者已关；后者才能发 Ecma 标准。
- ECMA-429 ≠ ECMA-262。429 是 Web API **子集**的运行时合同；语言仍是 262。
- 大会通过 ≠ 可读站已摘 Draft 标。2026-08-14 两边同时为真。
- Runtime key 收录 ≠ 符合 429。
- Deno / Bun / Node 官方合同 ≠ 429 符合性证书。三者都声明自己的 Web 超集或偏差。
- WinterTC 成员组织 ≠ 运行时实现清单。FAQ 未列 Oven / Bun；Keys 表有 `bun`。
- 提案中的 Sockets / CLI ≠ 已发布标准。
- 酒馆卡 iframe 不是服务器 JS 运行时；本页不自动落到卡内宿主。

## 映射到本仓库

当前工坊与角色卡开发线都不因本页改用 Deno / Bun，也不把 ECMA-429 写成已采用依赖。这是产品落点，不是对委员会的否定。行业对照仍见 [[comparisons/行业架构方案何时用]] 与 [[concepts/后端架构名词与工坊对照]]。本页只钉入口与冲突。

## 来源与证据

- 枢纽与 TC55 定位：本轮打开 [wintertc.org](https://wintertc.org/)。
- WinterCG 关闭日：W3C 组页「closed on 3 April 2025」；社区首页「closed on 2025-04-03」。
- FAQ 仍用将来时谈关闭：本轮 [faq](https://wintertc.org/faq)「When WinterTC is fully set up… WinterCG will close」。
- 大会已过、可读站仍 Draft：PDF 1st Edition December 2025；可读站页眉 Draft, 31 July 2026，正文同时写 December 2025 GA。
- 不 fork Web 规范：[faq](https://wintertc.org/faq)「What are we NOT trying to do?」与 [work](https://wintertc.org/work) 的 Fetch / Web Crypto Streams 行。
- Keys 不蕴含符合性：[runtime-keys](https://runtime-keys.proposal.wintertc.org/) Note 2；Published version 仍 TBD。
- 三家运行时合同：Deno about、Bun Web APIs、Node globals（本轮标题 v26.7.0）。

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
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/WASI与组件模型]]
- [[concepts/边缘缓存与SWR]]
- [[concepts/HTTP3与QUIC]]
- [[concepts/SharedWorker与Web Locks]]
- [[concepts/JS Temporal]]
- [[concepts/MCP与A2A]]
- [[10-收件箱/写回候选/第七批-B7-Hono]]
