---
title: HTTP3与QUIC
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
  - https://www.rfc-editor.org/rfc/rfc9114.html
  - https://www.rfc-editor.org/rfc/rfc9000.html
  - https://www.rfc-editor.org/rfc/rfc9001.html
  - https://www.rfc-editor.org/rfc/rfc9002.html
  - https://www.rfc-editor.org/rfc/rfc9204.html
  - https://quicwg.org/
  - https://docs.deno.com/examples/quic/
  - https://docs.deno.com/runtime/fundamentals/http_server/
  - queries/第三批蒸馏目标.md
  - concepts/HTTP合同与问题详情.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# HTTP3与QUIC

本页不是已采用传输，也不是工坊必须改 QUIC 的工单。账本见 [[queries/第三批蒸馏目标]]（B3-H3）。检索日 2026-08-14。只收 IETF 合同与运行时文档入口，不写攻击、绕过、放大或凭证。

## 一句话定义

**QUIC** 是跑在 UDP 上的通用安全传输（现行 [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html)，2021-05）。**HTTP/3** 是把同一套 HTTP 语义映到 QUIC 上的映射（现行 [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html)，2022-06）。HTTP/3 不是新语义，也不是「更快的 HTTP/2 改名」。

## 为什么重要

HTTP/2 的多路复用对 TCP 不可见：丢一个包，同连接上未受影响的流也会停。QUIC 把流复用、每流可靠与拥塞控制做进传输层，HTTP/3 只负责帧与字段。语义仍归 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)，错误体与 OpenAPI 仍归 [[concepts/HTTP合同与问题详情]]。本仓库工坊与角色卡栈**不因此改传输**；行业正当性仍保留。

## 权威入口

本轮核过枢纽 [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html)。下列 **8** 条是 B3-H3 真源，不是镜像。

| # | 入口 | 钉什么 |
|---|---|---|
| 1 | [RFC 9114 HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html) | 枢纽。HTTP 语义在 QUIC 上的映射；ALPN 缺省 `h3`；发现见 §3.1。 |
| 2 | [RFC 9000 QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) | 传输本身：流、连接、迁移、帧。应用协议之一才是 HTTP/3。 |
| 3 | [RFC 9001 QUIC-TLS](https://www.rfc-editor.org/rfc/rfc9001.html) | QUIC 用 TLS 1.3（或更新）做握手与密钥；不是「再套一层 TLS over TCP」。 |
| 4 | [RFC 9002 Recovery](https://www.rfc-editor.org/rfc/rfc9002.html) | 丢包检测与示例拥塞控制。不是 HTTP 帧规范。 |
| 5 | [RFC 9204 QPACK](https://www.rfc-editor.org/rfc/rfc9204.html) | HTTP/3 字段压缩。HPACK 假定全连接有序，QUIC 不给这个保证。 |
| 6 | [quicwg.org](https://quicwg.org/) | QUIC WG 现行枢纽。明文：HTTP/3 与 QPACK **已交回 HTTP WG** 维护。 |
| 7 | [Deno Communicate over QUIC](https://docs.deno.com/examples/quic/) | Deno **有** QUIC 示例与 `Deno.connectQuic` / `QuicEndpoint`。标 unstable。 |
| 8 | [Deno Writing an HTTP Server](https://docs.deno.com/runtime/fundamentals/http_server/) | `Deno.serve` 正文只写 HTTP/1.1 与 HTTP/2。本轮 **无** HTTP/3 专页。 |

gRPC / Connect 怎么挂 HTTP/3 不在本页，见 [[concepts/gRPC与Connect]]。缓存语义回 [[concepts/边缘缓存与SWR]]，不在此重抄。

## 如何运作

### 两层不要并成一词

QUIC 是传输：一条连接里多条独立流，始终加密，包走 UDP。HTTP/3 是应用映射：知道对端有 HTTP/3 之后，打开 QUIC 连接，用 `h3` 做 ALPN，再在流上走 HEADERS / DATA 等帧。RFC 9114 写明：部分 HTTP/2 能力已被 QUIC 吞掉，其余在 QUIC 之上重做。

### 语义不变

方法、状态码、字段名仍是 RFC 9110。换 HTTP/3 不会自动改错误 JSON，也不会让 OpenAPI 变成另一份合同。

### 发现与回退

客户端可以对 `https` URI 直接试 QUIC；未另选协议时 ALPN 用 `h3`。源站也可用 `Alt-Svc`（或 HTTP/2 的 ALTSVC 帧）宣告等价 HTTP/3 端点，例如 `Alt-Svc: h3=":50781"`。UDP 被拦时，9114 要求客户端改试基于 TCP 的 HTTP。服务器可在任意 UDP 端口提供 HTTP/3；替代服务广告必须带显式端口。

### `http` URI 不能直接当 HTTP/3

9114 §3.1.2：`http` 方案把权威绑在「能收 TCP」上。HTTP/3 不用 TCP，因此不能直接访问 `http` 权威源；除非扩展（如 Alt-Svc）另指一个也权威、且能走 HTTP/3 的服务。

### 为什么不能继续用 HPACK

HPACK 依赖各流帧全局有序。QUIC 流互不阻塞，这个保证没了。QPACK 把表更新放到单独的单向流，编码后的字段段只引用表、不改表，用来换压缩率与队头阻塞。

### 连接怎么建

HTTP/3 现行绑 QUIC v1；别的 QUIC 版本要另文规定。QUIC v1 握手是 TLS ≥1.3。域名目标必须能在握手里告诉服务器（通常 SNI）。QUIC 传输参数在加密握手里设；HTTP/3 自己的 SETTINGS 必须作为各自控制流的首帧发出。

### Deno 合同停在传输

第 7 条示例自己写：QUIC 是 HTTP/3 **底下**的传输，示例 ALPN 却是 `echo`，不是 `h3` 站点。第 8 条与 `fetch` 文档只承认 HTTP/1.1 / HTTP/2 自动协商。有 QUIC API ≠ `fetch` / `Deno.serve` 已是 HTTP/3。WebTransport 示例会用 ALPN `h3`，那是另一套 API，不是本页的 HTTP/3 文档页。

## 行业何时该上

| 合同 | 何时该上 | 不该当成 |
|---|---|---|
| RFC 9114 | 要对浏览器或 CDN 提供 HTTP/3，或写 `h3` / Alt-Svc | 「上了 HTTP/3 语义就变了」；QUIC 本身 |
| RFC 9000 族 | 自研非 HTTP 应用协议跑在 QUIC 上 | HTTP/3 帧表；「有 QUIC 就有 HTTP/3」 |
| RFC 9204 | 实现或评 HTTP/3 字段压缩 | 可把 HPACK 原样搬到 HTTP/3 |
| HTTP WG 维护面 | 查 HTTP/3 / QPACK 的后续扩展 | 仍把 quicwg.org 当 HTTP/3 现行编辑组 |
| Deno QUIC API | 在 Deno 里做原始 QUIC 流（unstable） | `Deno.serve` / `fetch` 的 HTTP/3 已交付 |

## 必须保留的冲突

- HTTP/3 已交回 HTTP WG，quicwg.org 仍列出 RFC 9114 / 9204。列出的是起源与指针，不是「QUIC WG 仍维护 HTTP/3」。
- Deno 有 QUIC 文档，无 HTTP/3 文档页。
- `http` URI 的权威模型与 HTTP/3 的 UDP 传输对不上；不能直接当 HTTP/3。
- 「工坊现在不换传输」不是「9114 不是正当行业合同」。

## 例子

- 正例：源站继续用 RFC 9110 语义与既有错误体；边缘打开 HTTP/3 只换映射与发现。
- 正例：UDP 不通时回落 HTTP/2 或 HTTP/1.1，不当成「HTTP/3 没标准化」。
- 正例：要在 Deno 里试传输，打开第 7 条 QUIC 示例，并标 unstable；不要写成官方 HTTP/3 指南。
- 反例：把 Google 早期 gQUIC 或「HTTP over QUIC」旧名当成现行 RFC 9114。
- 反例：看见 `Deno.connectQuic({ alpnProtocols: ["h3"] })` 就写「Deno 已文档化 HTTP/3」。
- 反例：把 QPACK 写成 HPACK 的别名，或把 HTTP/3 写成 QUIC WG 仍在主笔的规范。

## 边界与易混概念

- 不包括：攻击面、0-RTT 利用、放大、中间盒绕过、CVE、工坊换传输工单。
- HTTP/3 ≠ QUIC。前者是映射，后者是传输。
- HTTP/3 ≠ 新 HTTP 语义。语义在 RFC 9110。
- HPACK ≠ QPACK。有序假设不同。
- QUIC-TLS ≠ TLS-over-TCP。密钥日程嵌在 QUIC 包里。
- Alt-Svc 广告 ≠ 已经连上 HTTP/3。客户端可以试，也可以不试。
- Deno QUIC ≠ Deno HTTP/3。本轮无后者专页。
- WebTransport 用 `h3` ALPN ≠ `fetch` 已走 HTTP/3。
- 酒馆卡 iframe 与工坊同步 REST 都不因本页改 UDP。

## 映射到本仓库

当前工坊公共面是同步 REST，卡 runtime 走宿主与双 CDN，都不因本页改 QUIC。这是产品落点，不是对 IETF 的否定。行业对照仍见 [[comparisons/行业架构方案何时用]] 与 [[concepts/后端架构名词与工坊对照]]。本页只钉入口与冲突。

## 来源与证据

- 映射与发现：本轮打开 [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html) 文首、§1–§3.2。
- 传输与 TLS：RFC 9000 / 9001 文首；恢复算法在 9002，不在 9114。
- QPACK 替换 HPACK：RFC 9114 §2 与 RFC 9204 文首。
- 交回 HTTP WG：本轮 [quicwg.org](https://quicwg.org/)「Ownership of these drafts has now transferred back to the HTTP WG。」
- Deno 有 QUIC、无 HTTP/3 专页：第 7 条示例存在；第 8 条只列 HTTP/1.1 与 HTTP/2。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/边缘缓存与SWR]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/gRPC与Connect]]
