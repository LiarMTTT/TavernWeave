---
title: GraphQL与异步事件合同
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
sources:
  - https://spec.graphql.org/September2025/
  - https://spec.graphql.org/
  - https://github.com/graphql/graphql-over-http
  - https://graphql.github.io/graphql-over-http/draft/
  - https://graphql.org/learn/serving-over-http/
  - https://github.com/graphql/composite-schemas-spec
  - https://www.apollographql.com/docs/graphos/reference/federation/versions
  - https://www.asyncapi.com/docs/reference/specification/latest
  - https://cloudevents.io/
  - https://github.com/cloudevents/spec/tree/ce@v1.0.2/cloudevents
  - https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md
  - https://github.com/cloudevents/spec/blob/main/docs/RELEASES.md
knowledge_class: factual
---

# GraphQL与异步事件合同

账本见 [[queries/第三批蒸馏目标]]（B3-GQL、B3-Async）。本页不是已采用技术。

## 一句话定义

GraphQL 是**语言与执行合同**：客户端按类型系统自选字段，服务按文档执行 query / mutation / subscription。AsyncAPI 是**消息驱动 API 的机器可读描述**；CloudEvents 是**事件信封**。三者都不是 REST 的默认升级，也不等于 WebSocket。

## 为什么重要

同步 HTTP 合同管「现在就要答案」。字段形状因客户端而异、或事实要跨进程广播时，行业会另写查询语言、异步合同或事件信封。先分清**语言 / 传输 / 厂商拼图式 / 消息描述 / 事件信封**，才不会把 Apollo 文档、Stage 2 草案或 `main` 草稿当成现行规范。

## 权威入口

检索日 2026-08-14。下列 12 条是本页真源；语言规范不写传输。

| # | 入口 | 钉什么 |
|---|---|---|
| 1 | [GraphQL September 2025](https://spec.graphql.org/September2025/) | 现行**语言**规范。规范文本许可是 [OWFa 1.0](https://spec.graphql.org/September2025/)（源码 MIT、数据集 CC0）。请求与订阅都写明不要求特定序列化或传输。 |
| 2 | [spec.graphql.org 版本表](https://spec.graphql.org/) | Latest Release = September 2025（2025-09-03）。另有 Working Draft，不要把草稿当现行。 |
| 3 | [graphql-over-http 仓](https://github.com/graphql/graphql-over-http) | 传输草案，仓头写 **Stage 2: Draft**。语言规范故意不写传输层。 |
| 4 | [GraphQL over HTTP 渲染稿](https://graphql.github.io/graphql-over-http/draft/) | 同上草案的可读页；不覆盖语言规范。 |
| 5 | [Serving over HTTP](https://graphql.org/learn/serving-over-http/) | graphql.org 教学对齐草案，**不是**语言规范。只覆盖无状态 query/mutation。 |
| 6 | [composite-schemas-spec](https://github.com/graphql/composite-schemas-spec) | 基金会拼图式，仓头 **Stage 0: Preliminary**。与 Apollo Federation **并行**，不是其继任。 |
| 7 | [Apollo Federation 版本目录](https://www.apollographql.com/docs/graphos/reference/federation/versions) | 厂商目录**有** v2.9（2024-08，引入 `@cost` / `@listSize`）。本轮直链 `/docs/federation/v2.9/` 与 `/docs/graphos/reference/federation/v2.9/` **404**。 |
| 8 | [AsyncAPI latest](https://www.asyncapi.com/docs/reference/specification/latest) | 现页钉 **3.1.0**（Apache-2.0）。协议无关；bindings 才写 AMQP/MQTT/Kafka/WS/HTTP 等。 |
| 9 | [cloudevents.io](https://cloudevents.io/) | CNCF Graduated。发布说明钉 **v1.0.2**（2022-02-05）。 |
| 10 | [CloudEvents v1.0.2 树](https://github.com/cloudevents/spec/tree/ce@v1.0.2/cloudevents) | **发布钉**。必填上下文：`id` / `source` / `specversion` / `type`。序列化里 `specversion` 仍写 `1.0`（只带主次，补丁不改字段值）。 |
| 11 | [CloudEvents main spec.md](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md) | 标题是 **1.0.3-wip**，不是已发布。 |
| 12 | [CloudEvents RELEASES](https://github.com/cloudevents/spec/blob/main/docs/RELEASES.md) | 已发布最后一档仍是 1.0.2。CESQL 1.0.0 是另一份规范。 |

基金会语言规范**没有** Persisted Queries 专章。Apollo APQ、以及 graphql-over-http 仓里的 Persisted Documents RFC / 附录，都不是基金会语言规范。

## 如何运作

**GraphQL 语言。** 文档里是操作（query 只读取、mutation 先写再取、subscription 按事件流取）和可复用 fragment。服务公布类型系统；客户端按字段粒度要数据，响应形状跟请求走。规范还写校验、执行、内省。它不是通用编程语言，也不规定存储。请求由 schema、document、可选 operationName / variableValues / initialValue / extensions 组成；`extensions` 留给实现，避免乱加顶层字段。

**语言规范写什么、不写什么。** 写语法、类型、执行算法、响应里 `data` / `errors` / `extensions` 的形状。不写 HTTP 方法、状态码、媒体类型、URL、WebSocket 子协议、持久化查询 ID。订阅只规定源事件流如何变成响应流，以及何时结束；确认、缓冲、重传、QoS 故意留给实现。

**传输另册。** 语言规范 §6 写：请求与订阅都不要求特定序列化或传输。HTTP 常见，但是 Stage 2 草案与教学页，不是 2025-09 正文。教学页：单端点（常 `/graphql`）、POST 必做、GET 仅 query；`Accept` 走向 `application/graphql-response+json`。有 `data` 且非 null 时仍给 2xx（HTTP 没有「部分成功」码）。鉴权在进 GraphQL 之前；字段授权在执行期，允许部分响应。

**拼图式两套。** Apollo Federation 是厂商超图：子图 `@link` 到 `https://specs.apollo.dev/federation/v2.x`。基金会 Composite Schemas 要标准化组合与分布式执行，仍是 Stage 0。并存，不要写成「基金会已经取代 Federation」。

**AsyncAPI 3.1.0。** 描述应用在 channel 上 send / receive 的消息 API，不假定拓扑。server 可以是 broker 或带 WS 的服务。规范不建议从 receiver 文档机械翻成 sender：channel、summary、operation id 都可能对不上，中间还可能有转发。协议细节进 bindings，不进核心对象。文档除 Components 外声明的东西，实现必须用到。

**CloudEvents。** 跨厂商的事件数据描述。必填四元组让中间人能不拆 payload 就路由。JSON 格式所有实现必须支持。结构化模式把整事件放进消息体；二进制模式把 data 放进体、属性放进协议元数据。它不是 broker，也不替代 AsyncAPI 的操作/通道图。

## 行业何时该上

对照 [[comparisons/行业架构方案何时用]] 与 [[concepts/后端架构名词与工坊对照]]。本页补合同层，不删那些行。

| 合同 | 何时该上 | 不该当成 |
|---|---|---|
| 同步 REST / OpenAPI | 现在就要答案；固定动词；跨语言 HTTP | 「落后，必须升 GraphQL」 |
| GraphQL | 多客户端要自选字段、少 over-fetch | REST 默认升级；传输规范；Persisted Queries 已标准化 |
| GraphQL over HTTP | 已决定 GraphQL，要客户端/库互操作 | 已 Accepted 的传输标准（仍是 Stage 2） |
| Federation / Composite Schemas | 多团队多子图要一张超图 | 小 CRUD 的默认切法；两套规范已合一 |
| AsyncAPI | 消息驱动、多协议、要对通道和操作 | 同步审核结果的替身；从对端文档自动生成 |
| CloudEvents | 事件要跨厂商/平台，先统一信封 | 队列或 broker 本身 |
| WebSocket / SSE | 高频双向，或只听进度 | 合同层；GraphQL 语言正文 |

N+1、字段级授权、缓存键都比 REST 难，这是行业页已写的代价，不是工坊禁令。

## 例子

- 正例：移动端和后台要的字段差很多，用 GraphQL 让客户端自选；HTTP 互操作另看 Stage 2 草案，不假装语言规范已写传输。
- 正例：订单已确认要扇出库存、邮件、审计，用消息通道（AsyncAPI 描述）+ CloudEvents 信封；下单同步应答仍走 REST。
- 反例：把 `spec.graphql.org/September2025` 当成 HTTP 状态码或 `application/graphql-response+json` 的真源。
- 反例：把 Apollo Federation 写成基金会现行规范，或把 Composite Schemas Stage 0 写成已取代 Federation。
- 反例：引用 `/docs/federation/v2.9/` 当稳定直链；目录有 v2.9，版本路径本轮 404。
- 反例：把 CloudEvents `main` 的 1.0.3-wip 写成已发布，或把信封 `specversion: 1.0` 误认为「还停留在 1.0.0」。

## 边界与易混概念

- 不包括：具体 GraphQL 服务器实现、攻击面清单、工坊 Gateway schema、凭证。
- GraphQL 语言 ≠ GraphQL over HTTP ≠ graphql.org 教学页。
- 基金会无 Persisted Queries 规范 ≠ 业界没有 APQ / trusted documents。后者是厂商或传输仓 RFC。
- Apollo Federation ≠ Composite Schemas。并行；成熟度差一档（产品目录 vs Stage 0）。
- AsyncAPI ≠ CloudEvents。前者画应用与通道，后者封一条事件。
- GraphQL subscription ≠ WebSocket ≠ CloudEvents。订阅是语言里的长活操作；WS 是传输；CloudEvents 是信封。
- 「latest」要钉死：AsyncAPI latest 现为 3.1.0；CloudEvents 发布钉 1.0.2。

## 来源与证据

- 语言现行与 OWFa、以及「不要求特定传输」： [September 2025](https://spec.graphql.org/September2025/) Overview / §6 请求注记 / §6.2.3 Delivery Agnostic / Licensing 表。
- 传输仍 Stage 2：[graphql-over-http](https://github.com/graphql/graphql-over-http) 仓头与 `spec/GraphQLOverHTTP.md`。
- 基金会无 Persisted Queries：2025-09 正文无此专章；传输仓 RFC 与 Apollo APQ 不能填这个空。
- Federation 目录有 v2.9、直链 404：版本页有 `## v2.9`；本轮打开 `/docs/federation/v2.9/`、`/docs/graphos/reference/federation/v2.9/` 返回 404。
- 两套拼图式并行：Composite Schemas 仓 Stage 0；Apollo 版本目录仍在发 v2.x。
- AsyncAPI 3.1.0：官方 latest 页标题与 Version 3.1.0。
- CloudEvents 发布 1.0.2、`main` 1.0.3-wip：cloudevents.io 发布说明、`ce@v1.0.2` 树、`main` spec 标题、RELEASES 表。

已知冲突（不静默覆盖）：

1. 语言规范不写传输；HTTP 仍是 Stage 2。教学页可对齐草案，但不能升格为 2025-09 正文。
2. 基金会无 Persisted Queries 规范；厂商 APQ 与 over-HTTP RFC 并存，名称还和 trusted documents 缠在一起。
3. Apollo Federation 与基金会 Composite Schemas Stage 0 并行。
4. Apollo v2.9 **目录有、直链曾 404**（本轮复现）。
5. CloudEvents 发布钉 v1.0.2，`main` 是 1.0.3-wip；信封 `specversion` 仍是 `1.0`。
6. AsyncAPI 不建议 receiver/sender 文档对翻。
7. 「工坊现在不上」不是「GraphQL / AsyncAPI 不是正当行业方案」。

## 映射到本仓库

当前工坊：模块化单体 + 同步 REST（`list` / `detail` / `create` / `update` / `withdraw` / `review`）；审核要同步可见。**不上 GraphQL，也不上 AsyncAPI / CloudEvents 当主路径。** 这是产品落点，见 [[comparisons/工坊架构该上与不该上]]。

行业页仍必须写清何时该上：[[comparisons/行业架构方案何时用]] 已有 GraphQL 行与 WebSocket / SSE 行；[[concepts/后端架构名词与工坊对照]] 契约一句写 GraphQL「不是 REST 的默认升级」。本页补规范钉与冲突，不把工坊禁令写成行业否定。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/HTTP合同与问题详情]]
