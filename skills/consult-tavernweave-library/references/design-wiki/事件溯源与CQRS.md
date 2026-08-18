---
title: 事件溯源与CQRS
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
  - https://martinfowler.com/eaaDev/EventSourcing.html
  - https://martinfowler.com/bliki/CQRS.html
  - https://martinfowler.com/bliki/ReportingDatabase.html
  - https://martinfowler.com/eaaDev/EventCollaboration.html
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view
  - https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven
  - https://docs.kurrent.io/getting-started/concepts.html
  - https://docs.kurrent.io/server/v24.10/features/streams.html
  - https://docs.kurrent.io/server/v26.0/features/projections/
  - https://docs.kurrent.io/server/v25.0/features/persistent-subscriptions.html
  - queries/第五批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# 事件溯源与CQRS

本页不是已采用技术，也不是工坊必须上事件存储或读写双模型的工单。检索时间：2026-08-14。账本见 [[queries/第五批蒸馏目标]] B5-ES。对照页已有 CQRS 一句；本页补 ES 专口，不重抄 [[concepts/Saga三义与补偿]]。

## 一句话定义

事件溯源（Event Sourcing）把每次状态变更收成事件，按施加顺序保存，用重放重建状态。CQRS 把更新模型与读取模型分开，**可以没有事件**。二者常叠用，定义不是一条。

## 为什么重要

听到「上 ES/CQRS」先问是拆读写，还是以事件为真源。[[concepts/后端架构名词与工坊对照]] 已写「不绑定」；微软示意图常叠画，仍分专页。对称 CRUD + 一条状态机不必上双模型，更不必上事件存储。工坊发布 / 审核主路径仍是同步 REST + 状态机，不上事件溯源——这是产品落点，不是行业否定。

## 权威入口

账本 12 条见 [[queries/第五批蒸馏目标]] B5-ES。本页只钉定义与冲突，不镜像采集行。

| # | 入口 | 钉什么 |
|---|---|---|
| 1 | [Fowler Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | ES 专口。变更收成事件对象，按序保存，寿命与应用状态相同。能重建、时间点查询、重放。官方记录可以是事件日志，也可以是当前应用状态。快照是加速，不是另立真源。 |
| 2 | [Fowler CQRS](https://martinfowler.com/bliki/CQRS.html) | 写模型与读模型分开。可共库或各库。**可以没有事件。** 多数系统是高风险复杂度；只该用在个别 Bounded Context。 |
| 3 | [Reporting Database](https://martinfowler.com/bliki/ReportingDatabase.html) | 查询很重但领域不配 CQRS 时，先卸报表到只读库。Reporting DB ≠ 全量 CQRS。 |
| 4 | [Event Collaboration](https://martinfowler.com/eaaDev/EventCollaboration.html) | 组件靠广播协作，发送方不认订阅者。说话方式，不是「状态由事件序列重建」。 |
| 5 | [微软 Event Sourcing](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) | 追加存储记下动作；事件存储是当前状态的权威源。按实体一条 eventstream，重放叫 *rehydration*。迁入迁出都贵，多数部分用传统数据管理即可。 |
| 6 | [微软 CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs) | 命令改数据，查询只回 DTO。基础档可共库分逻辑；进阶档分库、分扩。**消息不是 CQRS 要件。** 「部分实现把 ES 收进 CQRS」。 |
| 7 | [Materialized View](https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view) | 预计算、可丢、可从源重建的只读投影。ES 源不宜直接查时常常必要，不是 CQRS 本身。 |
| 8 | [Event-driven 风格](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven) | 生产者 / 通道 / 消费者。EDA 是集成风格。耐久日志能重放 ≠ 领域状态以事件为真源。 |
| 9 | [Kurrent Concepts](https://docs.kurrent.io/getting-started/concepts.html) | 事件是过去的事实；日志只追加、是最终真源；流按 stream ID 切；乐观并发按流版本。 |
| 10 | [Event streams](https://docs.kurrent.io/server/v24.10/features/streams.html) | 一流多属一实体；`$all` 不可往里写。中间不能抽删一条。正文仍写 EventStoreDB。 |
| 11 | [Projections](https://docs.kurrent.io/server/v26.0/features/projections/) | 反应式追加或链接。许多问题更适合另挂读模型 + catch-up，不要默认当 CQRS 读侧。 |
| 12 | [Persistent subscriptions](https://docs.kurrent.io/server/v25.0/features/persistent-subscriptions.html) | 服务器记位点、至少一次、组内竞速，**不保证顺序**。投递层，不是溯源定义。 |

`docs.eventstore.com` 本轮超时，概念页以 `docs.kurrent.io` 为准。产品线现用 KurrentDB 名；v24.10 流页仍写 EventStoreDB。同一产品，两名并存。

## 如何运作

### 事件溯源：状态由事件序列重建

Fowler：每次变更收成事件对象并按施加顺序保存。能完整重建、时间点查询、重放。官方记录可以是事件日志，也可以是当前应用状态；后者成立时，日志可以只做审计与特殊处理。快照加速重放，不是另立真源。

微软：事件存储是关于当前状态的权威源。按实体一条流，重放叫 rehydration。全量重放贵，所以常做物化视图。同页硬钉：

- **事件存储 ≠ 消息代理。** Kafka 一类缺按实体查流与乐观并发，适合扇出，不能替事件存储。
- 纠正靠再追加补偿事件，原事件留下。这是同一条流上的不可变纠正，**不是**跨服务 [[concepts/Saga三义与补偿|Saga]]。
- 快照优化重水合，事件流仍是真源。
- 投递通常至少一次，消费要幂等。

Kurrent：细粒度流按实体切，不是一条大杂流。事件与位置不可改。截断 / 软删 / 硬删是产品语义，中间不能抽删一条。

### CQRS：读写模型分开，可以没有事件

Fowler（Greg Young 一路）：更新模型与读取模型分开。通常是两套对象模型。可以共库，也可以各库。**可以没有事件。** 读写不对称或要分扩时才值。CQRS 页写它「naturally fits」任务 UI、Event Collaboration、最终一致、Event Sourcing——是常叠，不是定义合并。

微软：基础档可共库分逻辑；进阶档分库、分扩、分存储技术。消息不是要件。部分实现把事件存储当写模型与单一真源，读模型从事件做物化视图。叠用代价：最终一致、复杂度上升、视图生成要快照。

领域不配 CQRS 但查询很重时，先看 Reporting Database：主系统仍服务多数查询，只把吃重报表卸到另一套只读库。

### 常叠用不是同一条

对照页已写「常和 CQRS 组合，**不绑定**」。本页两边都留，不静默合成一词。

| 可以单独成立 | 不能据此合并定义 |
|---|---|
| CQRS 共库分对象、无事件 | 「上了 CQRS 就是事件溯源」 |
| ES 以当前状态为官方记录、不拆读写 | 「上了事件日志就是 CQRS」 |
| 物化视图服务 ES 查询 | 物化视图 = CQRS |
| ES 常与 CQRS 画在一张图 | 两页互链 = 同一模式 |

## 必须保留的冲突

- **ES ≠ CQRS。** Fowler：CQRS 可以没有事件；ES 可以把当前状态当官方记录、不必拆读写。微软：两页互链、示意图常叠画，仍分专页。常叠用不是同一模式。
- 审计日志 ≠ 事件溯源（Fowler 允许当前状态作官方记录；微软 / Kurrent 把事件存储写成权威源）。
- 事件存储 ≠ Kafka / 总线。
- 补偿事件 ≠ [[concepts/Saga三义与补偿|Saga]] 三义。
- Event Collaboration / EDA / Reporting DB / 物化视图 / 持久订阅 / 产品投影都不是 ES。
- EventStoreDB 与 KurrentDB 是更名，不是两种模式。
- 工坊「现在不上」≠「行业不正当」。本页映射产品落点，**不是**「工坊已采用 ES / CQRS」。

## 近邻不是 ES

| 词 | 一句话 | 不是什么 |
|---|---|---|
| Event Collaboration | 广播状态变化，发送方不认订阅者 | 不是用事件序列重建状态 |
| EDA | 生产者 / 通道 / 消费者的集成风格 | 耐久日志能重放 ≠ ES |
| Reporting Database | 报表卸到只读库 | 不是全量 CQRS |
| 物化视图 | 可丢、可重建的只读投影 | 不是 CQRS 本身 |
| 持久订阅 | 服务器记位点的投递 | 不是溯源定义 |
| 产品投影 | 长时间相关查询；官方劝另挂读模型 | 不是 CQRS 读侧默认解 |
| 补偿事件 | 同一流再追加一条纠正 | 不是 [[concepts/Saga三义与补偿|Saga]] 三义 |

## 例子

- 正例：读写不对称、读侧要单独扩，只拆 CQRS 对象模型，共库、无事件。
- 正例：要审计与时间点重建，事件流当真源；查询另做物化视图。可以叠 CQRS，不是必须。
- 正例：查询很重但写模型仍对称，先上 Reporting Database，不上全量 CQRS。
- 反例：把 ES 与 CQRS 写成一词，或把「常组合」当成定义合并。
- 反例：用 Kafka 当事件存储；或把补偿事件写成跨服务 Saga。
- 反例：把 Event Collaboration / EDA / 持久订阅 / 产品投影当成事件溯源。
- 反例：工坊审核主路径上事件存储，却把「现在不上」写成「ES / CQRS 不正当」。

## 边界与易混概念

- 不包括：Saga / Outbox / Inbox 重抄、攻击与 ACL、默认口令、Kafka 运维、工坊已采用声明。Saga 回 [[concepts/Saga三义与补偿]]。
- **ES ≠ CQRS。** Fowler：CQRS 可以没有事件；ES 可以把当前状态当官方记录、不必拆读写。微软：两页互链、示意图常叠画，仍分专页。
- Fowler 允许「日志只做审计、当前状态是官方记录」；微软 ES 与 Kurrent 把事件存储 / 日志写成权威源。冲突留：审计日志 ≠ 事件溯源。
- 事件存储 ≠ Kafka / 总线。
- 补偿事件 ≠ Saga 三义。
- EventStoreDB 与 KurrentDB 是更名，不是两种模式。
- Greg Young / Udi Dahan 原文、EventStore 客户端 SDK、工坊或 EventStore 真机本轮未核。

## 映射到本仓库

对照页已写：对称的包 CRUD + 状态机不必上双模型。[[comparisons/工坊架构该上与不该上]]：现在不上 CQRS / 事件溯源。[[comparisons/行业架构方案何时用]]：读写不对称才考虑 CQRS；要审计、重放、时间旅行才考虑事件溯源，且不绑定 CQRS。

当前工坊：Gateway 同进程；同步 REST（`list` / `detail` / `create` / `update` / `withdraw` / `review`）；审核状态机 `pending → approved / rejected / withdrawn`。发布 / 审核要同步可见，主路径不上事件存储、不上读写双模型。这是产品落点，不是对 ES / CQRS 的行业否定。

## 来源与证据

权威入口以上表 12 条与 [[queries/第五批蒸馏目标]] B5-ES 为准。分路原稿仍在 [[10-收件箱/写回候选/第五批-B5-ES]]。对照句见 [[concepts/后端架构名词与工坊对照]]「写读分离与事件」。

已知冲突见上节，不静默覆盖。

尚缺：Greg Young / Udi Dahan 原文（Fowler CQRS 外链）；EventStore 客户端 SDK 合同；`docs.eventstore.com` 是否仍镜像；工坊或 EventStore 真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] ES ≠ CQRS 两边都留
- [x] 未重抄 Saga；未写攻击步骤
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[queries/第五批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-ES]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/Saga三义与补偿]]
- [[concepts/状态机与SCXML]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/HTTP合同与问题详情]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
