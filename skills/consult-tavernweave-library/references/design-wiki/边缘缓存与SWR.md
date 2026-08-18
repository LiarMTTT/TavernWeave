---
title: 边缘缓存与SWR
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
  - https://httpwg.org/specs/rfc5861.html
  - https://www.rfc-editor.org/info/rfc5861
  - https://www.rfc-editor.org/rfc/rfc9111.html
  - https://www.rfc-editor.org/rfc/rfc9213.html
  - https://www.rfc-editor.org/rfc/rfc9110.html
  - https://www.rfc-editor.org/rfc/rfc9651.html
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
  - https://nextjs.org/docs/app/guides/incremental-static-regeneration
  - https://swr.vercel.app/docs/getting-started
  - https://developers.cloudflare.com/cache/concepts/cache-control/
  - https://developer.mozilla.org/en-US/docs/Web/API/Cache
  - https://html.spec.whatwg.org/multipage/speculative-loading.html
  - https://www.rfc-editor.org/rfc/rfc8297.html
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/前端架构名词与取舍.md
knowledge_class: factual
---

# 边缘缓存与SWR

本页不是已采用技术，也不是工坊必须改 `Cache-Control` 的工单。检索时间：2026-08-14。账本枢纽是 [[queries/第二批蒸馏目标]] 的 **B2-Edge**。

## 一句话定义

边缘缓存是把可复用的 HTTP 响应放在离用户更近的**共享缓存**（常是 CDN）里，按新鲜度决定直接给、先校验、还是回源。本页的 **SWR** 只指 [RFC 5861](https://httpwg.org/specs/rfc5861.html) 的 `stale-while-revalidate`：新鲜期过后，缓存可以先给陈旧副本，同时在后台再验证。**`swr` ≠ `isr`。** 它也不是 React 的 `useSWR`。

## 为什么重要

源站不必为每个 GET 再算一遍。浏览器私有缓存、CDN 共享缓存、源站前的一层，寿命可以分开写。写错层会出现：浏览器还拿着旧页、CDN 已经过期；或把只该给一个人的响应放进共享缓存。工坊站默认 SSG/ISR、卡 runtime 走双 CDN，都是「分发或渲染」而不是本页要选的协议。本页只把 HTTP 缓存合同和三个常被并成一词的「SWR」拆开。

## 权威入口

B2-Edge 枢纽是 RFC 5861。下列 **14** 条是 2026-08-14 直读过的官方页，不是镜像。B2-Edge 采集行不在本页逐条复述。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [RFC 5861（HTTPWG）](https://httpwg.org/specs/rfc5861.html) | `stale-while-revalidate` 与 `stale-if-error`；二者独立 |
| 2 | [RFC 5861 状态页](https://www.rfc-editor.org/info/rfc5861) | **Informational**，不是 Standards Track |
| 3 | [RFC 9111 HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html) | 现行缓存 STD 98；废止 7234；引用 5861 作陈旧扩展 |
| 4 | [RFC 9213 Targeted Cache Control](https://www.rfc-editor.org/rfc/rfc9213.html) | `CDN-Cache-Control`；对准一类缓存 |
| 5 | [RFC 9110 HTTP 语义](https://www.rfc-editor.org/rfc/rfc9110.html) | ETag / Last-Modified / Vary / GET；不管 CDN 产品 |
| 6 | [RFC 9651 Structured Fields](https://www.rfc-editor.org/rfc/rfc9651.html) | 现行结构化字段；9213 仍引已废的 8941 |
| 7 | [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) | 指令速查，不是 IETF 真源 |
| 8 | [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) | 新鲜度 / 校验导读 |
| 9 | [Next.js ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration) | 框架重建静态页；**不是** HTTP SWR |
| 10 | [Vercel SWR 入门](https://swr.vercel.app/docs/getting-started) | React `useSWR` 钩子；客户端拉数 |
| 11 | [Cloudflare Origin Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/) | 一家 CDN 的实现面；正文仍写对齐 7234 |
| 12 | [MDN Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) | Service Worker / Cache Storage，另一层 |
| 13 | [WHATWG speculative loading](https://html.spec.whatwg.org/multipage/speculative-loading.html) | 推测加载 ≠ 新鲜度；归 B3-Hint |
| 14 | [RFC 8297 103 Early Hints](https://www.rfc-editor.org/rfc/rfc8297.html) | 103 ≠ 缓存；仍是 Experimental |

上表 **14** 条。图 CDN（B3-Img）、PWA 配额（见 [[concepts/PWA与存储配额]]）、Durable Objects（见 [[concepts/实时基建与Durable Objects]]）不在本页展开。

## 如何运作

### 新鲜、陈旧、再验证

[RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) 把缓存分成**私有**（常跟一个用户代理）和**共享**（中间人、CDN）。目标是复用先前响应，而不是强迫每家都存。响应在新鲜寿命内可直接复用；过期后通常要带着 ETag / Last-Modified 回源再验证（9110 的条件请求）。没有显式过期时，缓存可以对「可启发式缓存」的状态码估一个寿命，常见上界是 `Last-Modified` 距今间隔的约 10%。启发式不是 `max-age` 的替代写法。

`Age` 是沿路各缓存驻留时间之和。9111 §5.5 **废止 `Warning`**：陈旧与否看 `Age` 和其他字段，不要再要求 `Warning: 110`。

### RFC 5861：两扇独立的窗

5861 是 2010 年 Informational 扩展，不是 9111 正文里的指令。9111 §4.2.4 明确：除非断开、客户端/源站明示（例如 5861），或另有带外合同，缓存不得主动给陈旧响应。

- `Cache-Control: max-age=600, stale-while-revalidate=30`：600 秒内新鲜；再 30 秒内可以先给陈旧副本，并**不阻塞**地再验证。窗过完仍未验证，就不应继续按 SWR 供陈旧。异步验证通常由**落在窗内的请求**触发；窗太窄或流量太稀，就会有请求挡住等源站。
- `stale-if-error`：再验证得到 500/502/503/504（或等价连通失败）时，可在标明的陈旧上限内改给旧成功响应。它不改变新鲜度计算。

两扇窗独立。有 SWR 不等于出错也兜底；有 SIE 不等于后台静默刷新。5861 安全节反对为了 SWR 去预取或自动刷新，以免放大请求。

### 对准 CDN：RFC 9213

`Cache-Control` 对所有缓存一视同仁；`s-maxage` 只覆盖共享缓存的寿命，盖不住 `stale-while-revalidate` 这类扩展。9213 用**目标列表**选第一个有效的 `*-Cache-Control`。CDN 缓存若吃到有效的 `CDN-Cache-Control`，**必须忽略**同响应里的 `Cache-Control` 与 `Expires`。例：`Cache-Control: max-age=60, s-maxage=120` 加 `CDN-Cache-Control: max-age=600`，CDN / 其他共享缓存 / 浏览器寿命可以是 600 / 120 / 60。

代价是 **Age 惩罚**：CDN 按更长寿命继续供的响应，下游看起来可能已经陈旧。实现上有人会改 `Date`/`Expires` 或去掉 `Age`；9213 不强制某一种。目标字段按 Structured Fields 解析；用普通 `Cache-Control` 解析器会互操作失败。9213 仍规范引用 RFC 8941；现行结构化字段是 **RFC 9651**（废止 8941）。两边都留。

### 三词不要并

| 词 | 真源 | 层 |
|---|---|---|
| HTTP SWR | RFC 5861 `stale-while-revalidate` | 缓存供陈旧 + 后台再验证 |
| ISR | [Next ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration) | 框架按 `revalidate` / `revalidatePath` 重建**页面** |
| `useSWR` | [swr.vercel.app](https://swr.vercel.app/docs/getting-started) | React 钩子：去重、内存缓存、聚焦再拉 |

Next 文档自己用 “background regeneration (stale-while-revalidate)” 形容 ISR，这是命名撞车，不是「ISR = RFC 5861」。ISR 不支持静态导出；`revalidate = 60` 是路由段配置。`useSWR` 管组件要哪份 JSON，不管 CDN 怎么存 HTML。

### 实现面会改语义

[Cloudflare Origin Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/) 写：企业可开关「严格尊重源站」；免费档默认开。正文仍写对齐 **RFC 7234**，而现行是 9111。`s-maxage` 带 `proxy-revalidate` 语义，**共享缓存不得在未再验证时供陈旧**，因此不要和 `stale-while-revalidate` 写在同一套共享策略里。Always Online 开着时，Cloudflare 会忽略 SWR/SIE。Workers Cache API 的 `match`/`put` 也不支持这两扇窗。厂商头（`CDN-Cache-Control`、`Cloudflare-CDN-Cache-Control`）是 9213 约定，不是第二份 IETF 新鲜度模型。

## 必须保留的冲突

- **`swr` ≠ `isr`。** HTTP `stale-while-revalidate` ≠ Next ISR ≠ React `useSWR`。
- RFC 5861 是 **Informational**；RFC 9111 是 STD 98，废止 7234，并把 5861 当「允许供陈旧」的扩展引用。
- 5861 仍写陈旧响应应带 `Warning`；9111 **废止 Warning**，改看 `Age`。
- `stale-while-revalidate` ≠ `stale-if-error`；两扇窗独立。
- `s-maxage` 隐含 `proxy-revalidate`，会关掉共享缓存上的 SWR。
- 9213：有效 `CDN-Cache-Control` 让该 CDN **忽略** `Cache-Control`/`Expires`；`s-maxage` 不能代替对 SWR 的对准。
- 共享缓存 ≠ 私有缓存 ≠ 9213 的 CDN 类；边缘计算（Worker / Durable Object）≠ 边缘缓存。
- Cloudflare 实现文仍引 7234；OCC 开关会改变 `max-age=0` / `no-cache` 是「不存」还是「存了必再验证」。
- 9213 引 RFC 8941；8941 已被 9651 废止。
- 103 / Speculation Rules ≠ 新鲜度（见 [[concepts/Web性能与INP]]、B3-Hint）。
- Service Worker Cache API ≠ HTTP 共享缓存（见 [[concepts/PWA与存储配额]]）。
- 图 CDN 变换（B3-Img）≠ HTTP 缓存语义。
- 工坊 SSG/ISR 是渲染落点，**不是**「本仓已上 HTTP SWR」。
- 卡双 CDN（[[concepts/git挂载与远程真身]]）是资源分发，不是源站 `Cache-Control` 策略。

## 例子

- 正例：公开目录 HTML 写 `max-age` + 可选的 `CDN-Cache-Control`；浏览器短、CDN 长。
- 正例：可容忍短暂陈旧的只读 GET，加独立的 `stale-while-revalidate`，且**不要**再给共享缓存加 `s-maxage` 来「顺便」延寿。
- 正例：源站 5xx 时宁可给旧成功页，用 `stale-if-error`，不要指望 SWR 代劳。
- 反例：把 ISR 的 `export const revalidate = 60` 写成 RFC 5861。
- 反例：把 `useSWR('/api/user')` 当成 CDN 指令，或把审核写结果交给共享 SWR。
- 反例：个人仪表 `Cache-Control: public`，或 `no-store` 的响应还指望 CDN 命中。

## 边界与易混概念

- 不包括：对象存储凭证、缓存投毒/绕过步骤、报价页、本仓库「已采用」某 CDN。
- 不包括：把 103、预渲染、字体子集、图变换写成缓存新鲜度。
- 启发式新鲜度 ≠ 显式 `max-age`。
- `no-store`（不要存）≠ `no-cache`（可存但用前必须再验证）。
- 易混：听到「SWR」就以为框架、钩子和 HTTP 指令是同一个旋钮。

## 映射到本仓库

独立工坊站默认 **SSG/ISR + islands**，目录是缓存静态读，见 [[concepts/前端架构名词与取舍]]、[[comparisons/工坊架构该上与不该上]]。那是渲染与产品缓存，不是源站必须发出 5861 指令。发布 / 审核要同步可见，写面不要靠共享 SWR 藏旧状态。

卡侧 git 挂载是 jsDelivr 双源拉 runtime，见 [[concepts/git挂载与远程真身]]。那是分发失败时换源，不是 `CDN-Cache-Control`。本页不把工坊或卡写成「已上边缘 SWR」。Gateway 同步 REST 的错误体仍归 [[concepts/HTTP合同与问题详情]]。

## 来源与证据

- 两扇窗与 Informational：RFC 5861 正文与 `/info/rfc5861`。
- 现行缓存、供陈旧条件、废止 Warning / 7234：RFC 9111 文首、§4.2.4、§5.5。
- 对准 CDN 与 Age 惩罚：RFC 9213 §2–3。
- ISR / `useSWR`：Next 16 文档与 swr.vercel.app 入门（2026-08-14 直读）。
- 实现分叉：Cloudflare OCC 页（仍写 7234；`s-maxage` 关掉 SWR）。
- 账本：[[queries/第二批蒸馏目标]] B2-Edge；重叠见 B3-Hint、B3-Img、[[concepts/PWA与存储配额]]。

已知冲突见上节，不静默覆盖。某家 CDN 是否完整实现 5861 两扇窗：以该家文档为准，标未知。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[concepts/前端架构名词与取舍]]
- [[concepts/Web性能与INP]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/git挂载与远程真身]]
- [[concepts/PWA与存储配额]]
- [[comparisons/工坊架构该上与不该上]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
