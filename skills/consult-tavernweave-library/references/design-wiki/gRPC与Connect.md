---
title: gRPC与Connect
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
  - https://grpc.io/docs/what-is-grpc/introduction/
  - https://grpc.io/docs/what-is-grpc/core-concepts/
  - https://grpc.io/docs/what-is-grpc/faq/
  - https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
  - https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
  - https://grpc.io/blog/state-of-grpc-web/
  - https://grpc.io/docs/platforms/web/basics/
  - https://connectrpc.com/docs/introduction
  - https://connectrpc.com/docs/protocol
  - https://connectrpc.com/docs/faq/
  - https://connectrpc.com/docs/web/choosing-a-protocol
  - https://grpc.io/docs/languages/go/quickstart/
  - https://connectrpc.com/docs/go/getting-started
  - https://github.com/grpc/proposal/blob/master/G2-http3-protocol.md
  - 10-收件箱/写回候选/第五批-B5-gRPC.md
  - queries/第五批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/JSON Schema与Protobuf.md
  - concepts/HTTP合同与问题详情.md
  - concepts/HTTP3与QUIC.md
knowledge_class: factual
---

# gRPC与Connect

本页不是已采用技术，也不是工坊必须改 RPC 栈的工单。检索时间：2026-08-14。只谈公开传输合同，不写攻击步骤、绕过或凭证。账本见 [[queries/第五批蒸馏目标]] B5-gRPC；分路原稿仍在 [[10-收件箱/写回候选/第五批-B5-gRPC]]。形状与字段战争见 [[concepts/JSON Schema与Protobuf]]，本页不重蒸。

## 一句话定义

gRPC 是带**传输合同**的 RPC：默认用 Protocol Buffers 当 IDL 和交换格式，线上按 HTTP/2 映射发带长度前缀的消息，状态多半在 trailers。Connect 是浏览器友好、且与 gRPC 兼容的 HTTP API 库族，同一份 `.proto` 服务可走 **gRPC / gRPC-Web / Connect** 三种 HTTP 映射。三者不是三份 schema。

## 为什么重要

GraphQL 语言规范故意不写传输；gRPC **写**。浏览器没有 HTTP/2 帧控制面，也不支持 trailers，所以不能把「服务端已经是 gRPC」直接接到网页 `fetch`。不先分清原生合同、Web 合同、Connect 自有协议，就会把 Envoy 翻译代理、JSON 调试面或 HTTP/3 提案写成「gRPC 已经换代」。

## 权威入口

检索日 2026-08-14。下列 12 条是本页真源；G2 与 Connect Go 入门是并行入口，不升格为现行专页。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Introduction](https://grpc.io/docs/what-is-grpc/introduction/) | 默认 Protobuf IDL + 交换格式；`protoc` + 插件出 stub |
| 2 | [Core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/) | 四种 RPC；stub / channel / deadline / metadata |
| 3 | [FAQ](https://grpc.io/docs/what-is-grpc/faq/) | CNCF；现网最新 **v1.82.0**；浏览器走 gRPC-Web（GA） |
| 4 | [`PROTOCOL-HTTP2`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md) | `application/grpc`；状态在 **trailers**；HTTP 常 200 |
| 5 | [`PROTOCOL-WEB`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md) | 浏览器限制 → 另一套协议；`application/grpc-web` |
| 6 | [State of gRPC-Web](https://grpc.io/blog/state-of-grpc-web/) | 浏览器实现不了 HTTP/2 gRPC 规格（2019，仍挂 grpc.io） |
| 7 | [Web Basics](https://grpc.io/docs/platforms/web/basics/) | Envoy `grpc_web` 过滤器做翻译代理 |
| 8 | [Connect 引言](https://connectrpc.com/docs/introduction) | 三协议；自称 HTTP/1.1、HTTP/2、**HTTP/3** |
| 9 | [Connect 协议](https://connectrpc.com/docs/protocol) | 不绑某一 HTTP 版本；**不用 trailers**；双向流要 HTTP/2 |
| 10 | [Connect FAQ](https://connectrpc.com/docs/faq/) | 浏览器无 trailers → 不能说 gRPC；HTTP/3 实现未齐 |
| 11 | [选协议](https://connectrpc.com/docs/web/choosing-a-protocol) | 浏览器默认 Connect+JSON；gRPC-Web 默认二进制 |
| 12 | [Go Quick start](https://grpc.io/docs/languages/go/quickstart/) | `protoc-gen-go` ≠ `protoc-gen-go-grpc` ≠ `protoc-gen-connect-go` |

并行：[Connect Go 入门](https://connectrpc.com/docs/go/getting-started)、[G2 HTTP/3](https://github.com/grpc/proposal/blob/master/G2-http3-protocol.md)。G2 不是 grpc.io 文档树里的现行专页。

## 如何运作

### 原生 gRPC

客户端像调本地对象一样调另一台机器上的方法。四种方法：一元、服务端流、客户端流、双向流。生命周期含 deadline（超时变 `DEADLINE_EXCEEDED`）、取消（已做修改不回滚）、metadata（键不得以 `grpc-` 开头）、channel。成功判定两边独立。

[`PROTOCOL-HTTP2`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md)：`:method POST`、`:path /Service/Method`、`content-type` 以 `application/grpc` 开头、`te: trailers`。响应 HTTP 状态多为 **200**；`grpc-status` / `grpc-message` 在 Trailers（或 Trailers-Only）。消息是 1 字节压缩旗 + 4 字节大端长度 + 载荷。Protobuf 时 Content-Type 为 `application/grpc+proto`。路径静态，不按 REST 从 path / query 拆参数。

### 代码生成分家

`protoc` 加插件同时出消息代码和 RPC stub。Go：`protoc-gen-go` 出 `*.pb.go`；`protoc-gen-go-grpc` 出 `*_grpc.pb.go`。Connect 另装 `protoc-gen-connect-go`，生成单独包（handler + client），再 import 消息包，避免把 RPC 框架拖进每个消息包。形状编译器仍是 `protoc` / Buf，字段战争不在本页。

### 浏览器墙

2019 博文仍挂 grpc.io：**当前不可能在浏览器里实现 HTTP/2 gRPC 规格**——没有足够细的请求控制；无法强制 HTTP/2；即使能，也拿不到原始 HTTP/2 帧。Connect FAQ（检索日仍有效）：HTTP 规格里有 trailers 几十年，**浏览器仍不支持**；gRPC 大量用 trailers，故浏览器里的代码不能说 gRPC 协议。grpc.io FAQ 对「能在浏览器用吗」的答案是 **gRPC-Web 已 GA**，不是「浏览器直接说 HTTP/2 gRPC」。

### gRPC-Web

[`PROTOCOL-WEB`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md) 因为浏览器限制，实现的是与原生不同的协议，方便代理翻译。Content-Type：`application/grpc-web` / `application/grpc-web-text`。支持任意 HTTP/*，不依赖 HTTP/2 帧。Trailers 打进响应体最后一条 length-prefixed 消息（首字节 MSB=1）。官方教程用 Envoy `envoy.grpc_web` 把浏览器请求转到后端 gRPC。这是教程部署，不是「所有实现都必须 Envoy」——Connect 服务器可本地说 gRPC-Web。`PROTOCOL-WEB` 曾期望 WHATWG Streams 让原生协议变成可选；2026-08-14 现网 FAQ 仍写浏览器不支持 trailers。两边留。

### Connect

服务端默认三种入口都收；客户端默认 Connect，可开关切 gRPC / gRPC-Web。协议不依赖某一 HTTP 版本的成帧细节，**完全不用 HTTP trailers**。一元：`application/proto` / `application/json`，像精简 REST；无副作用且标了 `idempotency_level = NO_SIDE_EFFECTS` 可用 GET。流：`application/connect+proto` / `+json`；双向流**要求 HTTP/2**，其余也可 HTTP/1.1。路径仍是 `/Package.Service/Method`。浏览器默认 Connect+JSON（可用 GET）；gRPC-Web 默认二进制，因并非所有 gRPC-Web 实现都收 JSON。OpenAPI 面向 REST/HTTP，Connect FAQ 写明**不适用于**这类 RPC；描述语言见 [[concepts/OpenAPI与Arazzo]]，错误体与 HTTP 语义见 [[concepts/HTTP合同与问题详情]]。

### HTTP/2 与 HTTP/3

原生 gRPC 现行合同是 `PROTOCOL-HTTP2`。G2 提案标 Status **Implemented**、实现栏只写 **grpc-dotnet**、更新日期 2021-08-25；请求 / 响应形状不变，Content-Type 仍是 `application/grpc`。Connect 协议自称跨 HTTP/1.1/2/3，但 FAQ 写「不是所有实现都有 HTTP/3」。不要写成「gRPC 已改 HTTP/3」，也不要写成「gRPC 永远不能 HTTP/3」。HTTP/3 本身见 [[concepts/HTTP3与QUIC]]（账本 B3-H3）。

## 必须保留的冲突

- **浏览器必须走 gRPC-Web 或 Connect，不能说原生 gRPC。** `PROTOCOL-HTTP2` 要 HTTP/2 帧与 trailers。`PROTOCOL-WEB`、2019 博文、Connect FAQ 一致：浏览器没有这套控制面。`PROTOCOL-WEB` 曾期望 WHATWG Streams 让原生协议变成可选；2026-08-14 现网 FAQ 仍写浏览器不支持 trailers。代理模型两边留：官方 Web 教程用 Envoy；Connect 服务端可本地收 gRPC-Web。不裁定「必须 / 不必 Envoy」。
- HTTP/2 vs HTTP/3：现行原生合同仍是 `PROTOCOL-HTTP2`；G2 不是文档树专页；Connect HTTP/3 实现未齐。
- 三协议不是三个 schema。
- 版本钉：FAQ v1.82.0 vs 例子 v1.81.1。
- HTTP 200 ≠ RPC 成功。原生 gRPC 常 200，看 trailers 里的 `grpc-status`。
- OpenAPI ≠ Connect / gRPC 合同。
- **映射 ≠ 采用。**

## 例子

- 正例：服务与服务之间用原生 gRPC（HTTP/2 + trailers）；网页客户端走 Connect 或 gRPC-Web，不要对 `fetch` 假装能发 `application/grpc`。
- 正例：同一份 `.proto` 服务，后端 Connect 同时收三协议；浏览器 `createConnectTransport()` 默认 JSON，对接只会 gRPC-Web 的后端再切 `createGrpcWebTransport()`。
- 正例：Go 消息插件和 RPC 插件分开装，Connect handler 单独成包。
- 反例：把「gRPC-Web 已 GA」写成浏览器已经能说原生 gRPC。
- 反例：把 Envoy 写成唯一合法部署，或把 Connect 本地收 gRPC-Web 写成官方 Web 教程已经改口。
- 反例：把 G2 或 Connect 自称 HTTP/3 写成「gRPC 现行合同已是 HTTP/3」。
- 反例：因本页出现 gRPC 就写进工坊主路径或发卡 recipe。

## 边界与易混概念

- 不包括：攻击面、凭证、鉴权拦截器、TLS 套件、CORS 利用、OpenAPI 路径战争、JSON Schema / proto edition 字段战争、工坊 Gateway 真身、成品。
- 原生 gRPC ≠ gRPC-Web ≠ Connect 协议。同一份服务，三种 HTTP 映射。
- gRPC 写传输；GraphQL 语言规范不写。见 [[concepts/GraphQL与异步事件合同]]。
- Protobuf 形状 ≠ RPC 传输。字段怎么写见 [[concepts/JSON Schema与Protobuf]]。
- HTTP 200 ≠ RPC 成功。原生 gRPC 常 200，看 trailers 里的 `grpc-status`。
- Connect 默认 JSON ≠ 换了一份 schema。
- OpenAPI ≠ Connect / gRPC 合同。
- FAQ v1.82.0 ≠ Go Quick start 例子 v1.81.1。两边留。

## 映射到本仓库

当前工坊：模块化单体 + 同步 REST（`list` / `detail` / `create` / `update` / `withdraw` / `review`），公共合同以后要生成客户端再补 OpenAPI，见 [[concepts/后端架构名词与工坊对照]]「契约一句」与 [[comparisons/工坊架构该上与不该上]]。

因此：

1. **本仓未采用** gRPC / gRPC-Web / Connect 当主路径。
2. 若以后要对内 RPC，先分清浏览器不能说原生 gRPC，再选 gRPC-Web 或 Connect。
3. 形状入口仍是 `protobuf.dev`；传输合同以本页四条骨架为准。
4. 本 Vault 不收 Gateway 真身字段或凭证。
5. **映射 ≠ 采用。**

## 来源与证据

- 原生映射与 trailers：[`PROTOCOL-HTTP2`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md)。
- 浏览器墙：[`PROTOCOL-WEB`](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md)、[2019 博文](https://grpc.io/blog/state-of-grpc-web/)、[Connect FAQ](https://connectrpc.com/docs/faq/)、[grpc.io FAQ](https://grpc.io/docs/what-is-grpc/faq/)。
- Envoy 教程 vs Connect 本地收：[Web Basics](https://grpc.io/docs/platforms/web/basics/) 与 [Connect 引言](https://connectrpc.com/docs/introduction)。
- Connect 不用 trailers、双向流要 HTTP/2：[协议](https://connectrpc.com/docs/protocol)。
- 浏览器选协议：[choosing-a-protocol](https://connectrpc.com/docs/web/choosing-a-protocol)。
- 插件分家：[Go Quick start](https://grpc.io/docs/languages/go/quickstart/)、[Connect Go](https://connectrpc.com/docs/go/getting-started)。
- HTTP/3：G2 提案（Implemented / 仅 grpc-dotnet / 2021-08-25）；Connect FAQ「不是所有实现都有」。传输语义见 [[concepts/HTTP3与QUIC]]。
- 账本：[[queries/第五批蒸馏目标]] B5-gRPC；分路原稿 [[10-收件箱/写回候选/第五批-B5-gRPC]]。形状对照 [[queries/第三批蒸馏目标]] B3-Schema 与 [[concepts/JSON Schema与Protobuf]]。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第五批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-gRPC]]
- [[concepts/JSON Schema与Protobuf]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/HTTP3与QUIC]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[queries/第三批蒸馏目标]]
