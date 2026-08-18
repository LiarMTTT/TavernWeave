---
title: Saga三义与补偿
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
  - https://microservices.io/patterns/data/saga.html
  - https://microservices.io/patterns/data/transactional-outbox.html
  - https://microservices.io/patterns/communication-style/idempotent-consumer.html
  - https://docs.temporal.io/
  - https://docs.temporal.io/design-patterns/saga-pattern
  - https://www.omg.org/spec/BPMN/2.0.2
  - https://www.omg.org/spec/BPMN/2.0.1
  - https://www.iso.org/standard/62652.html
  - https://docs.camunda.io/docs/components/modeler/bpmn/compensation-events/
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/retry
  - https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
knowledge_class: factual
---

# Saga三义与补偿

蒸馏自 [[queries/第二批蒸馏目标]] B2-Dist 与 [[queries/第三批蒸馏目标]] B3-WF / B3-RL / B3-CB。检索日 2026-08-14。不是本仓库已采用的分布式事务栈。

## 一句话定义

「Saga」不是一个词。口语里至少三义并存：[microservices.io 数据模式](https://microservices.io/patterns/data/saga.html)（跨服务本地事务序列）、[Temporal 补偿代码](https://docs.temporal.io/design-patterns/saga-pattern)（工作流里手写的补偿栈）、[BPMN 补偿事件](https://docs.camunda.io/docs/components/modeler/bpmn/compensation-events/)（图上的边界事件与补偿处理器）。三者都谈失败后怎么撤，但合同、载体和触发方式不同，不要并成一词。

## 为什么重要

听到「上个 Saga」先问是哪一义：消息编排、引擎代码，还是流程图符号。Outbox / Inbox 是数据 Saga 的配套，不是工作流引擎功能。限流、熔断、舱壁、重试是韧性层，不是补偿层。工坊当前用同步 REST + 审核状态机，不上分布式 Saga；这是产品映射，不是对行业方案的否定。

## Saga 三义

| 义 | 真源 | 载体 | 回滚怎么发生 | 不是什么 |
|---|---|---|---|---|
| 数据模式 | [microservices.io Saga](https://microservices.io/patterns/data/saga.html) | 每服务本地事务 + 消息 | 某步因业务规则失败，再跑一串补偿事务；编舞靠事件，编排靠协调器 | 不是 Temporal API，也不是 BPMN 符号 |
| Temporal 补偿代码 | [Temporal Saga Pattern](https://docs.temporal.io/design-patterns/saga-pattern) | Workflow 里的补偿列表；Java 有 `Saga` helper | 失败后按登记顺序的逆序（LIFO）跑补偿 Activity；官方建议先登记再执行正向 Activity | 不是 BPMN 图元素，也不规定编舞/编排消息协议 |
| BPMN 补偿事件 | OMG BPMN；实现说明见 [Camunda Compensation events](https://docs.camunda.io/docs/components/modeler/bpmn/compensation-events/) | 边界补偿事件 + `isForCompensation` 处理器 + 中间/结束抛出 | 抛补偿后只调用**已成功完成**活动的 handler；用 association，不用 sequence flow | 不是 Temporal 闭包栈，也不是 Database-per-Service 的消息 Saga |

1987 年数据库长事务论文是更早的历史线，本页不并入上表三义。

## 如何运作

### 数据模式：本地事务串 + 补偿事务

前提是 [Database per Service](https://microservices.io/patterns/data/saga.html)：订单与客户不在同一库，不能开一条跨服务 ACID。2PC 被标成不可用选项。做法是把一笔跨服务生意写成一串本地事务；每步改自己的库，再发消息触发下一步。某步因业务规则失败，就对已完成的步骤跑补偿事务。协调有两种：编舞（各服务发领域事件）与编排（协调器发命令）。

代价写在同一页：没有自动回滚，补偿要人设计；没有 ACID 的隔离，并发 Saga 可能读到中间态，要用对策。发起方若用同步 `POST` 开异步流，还要另定如何得知结局（等完再回、轮询、或事后推事件）。

可靠跨出下一步，服务必须**原子地**改库并发布消息。传统「库 + 消息代理」2PC 同样被排除。配套是 [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)：同一本地事务里写入业务行和 outbox；独立 relay 再投递。Event Sourcing 是另一条原子出路，不绑定必须上。

Relay 可能投两次。消费侧正式名是 [Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html)，不是「Inbox 模式」。做法是记下已处理消息 ID（独立 `PROCESSED_MESSAGES` 表，或写进业务实体），重复投递当一次。口语 Inbox 指这件事，写正式名。

本轮检索 [martinfowler.com](https://martinfowler.com/)：**没有** Saga / Outbox 专文。近邻是 [Transactionless](https://martinfowler.com/bliki/Transactionless.html)、[Two-Phase Commit](https://martinfowler.com/articles/patterns-of-distributed-systems/two-phase-commit.html)、[Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)。不要把 Fowler 层文当成这两条模式的真源。

### Temporal：补偿是代码，不是图

[Temporal 文档总入口](https://docs.temporal.io/) 把自己写成 Durable Execution：Workflow / Activity、崩溃后续跑、Activity 默认可重试。这里的「Saga」是设计模式页：每步配一个能撤自己副作用的补偿；失败则逆序执行。各 SDK 载体不同（Python/Go 列表、TypeScript `unshift`、Java `saga.addCompensation` + `compensate()`），合同相同：先登记、逆序跑、补偿必须幂等，并能处理「正向 Activity 根本没跑完 / 没跑成」。

官方对比两种登记时机：先登记更安全（刷卡已发生但 Activity 报失败时仍能撤），补偿要能 no-op；后登记只撤已成功步，逻辑简单，但半成功会漏撤。这是代码约定，不是 BPMN 的「只补偿已完成活动」。Temporal 的 Activity 重试与补偿栈叠用，但重试本身不是 Saga。

### BPMN：补偿是事件与处理器

[ISO/IEC 19510:2013](https://www.iso.org/standard/62652.html) **等于** [OMG BPMN 2.0.1](https://www.omg.org/spec/BPMN/2.0.1)。OMG 现行正式版是 [BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2)（2014-01）。不要把 ISO 号写成 2.0.2，也不要把 2.0.2 写成 ISO 正文。

图上的合同：活动挂补偿边界事件；handler 带补偿标记、用 association 挂上，不进正常顺序流。进程走到补偿中间抛出或结束事件时，在作用域内调用已完成活动的 handler；进行中或已终止的不调。可按 `activityRef` 只补某活动，否则广播该作用域。Camunda 页是实现说明，规范真身在 OMG PDF。

### 限流 ≠ 节流 ≠ 令牌桶

[微软 Rate Limiting](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern)（2026-06-08）：**调用方**控制自己往下游送请求的速率，好待在对方的 throttling 限额内，少制造 429 风暴。典型是批量摄入；常配持久队列，按容量出队。

[微软 Throttling](https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling)（2026-05-29）：**被调用方 / 系统**给实例、租户或整服务设资源上限，过载时拒绝、降级或推迟，以保住 SLO。策略包括按主体限额、功能降级、队列削峰。Outbound rate limits 在节流页里是保护不健康依赖的一种手段，仍不是 Rate Limiting 那一页的定义。

令牌桶是实现算法。Azure API Management 经典档用滑动窗口，v2 档用令牌桶——这是产品实现，不是「Rate Limiting 模式 = 令牌桶公式」。三词不要互换。

### 熔断 / 舱壁 / 重试：另一层

| 模式 | 管什么 | 典型状态 / 手段 |
|---|---|---|
| [Retry](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) | 短暂故障，预期再试能成 | 取消 / 立即重试 / 延迟重试；要看是否幂等 |
| [Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) | 别对大概率失败的远程调用死磕 | Closed → Open → Half-Open |
| [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) | 隔离资源池，一舱进水整船不沉 | 连接池、线程池、分实例、分队列 |

微软写明：Retry 期望成功，Breaker 阻止很可能失败的调用；二者可叠，但重试必须理会断路器已开。舱壁页建议与 retry / breaker / throttling 组合。Azure 模式总表把 Saga 建在 Compensating Transaction 上；B3-CB 裁定 **Saga 行不采，回 B2-Dist**。补偿事务与数据 Saga 相近，仍不要用来把上面三义并成一词。

这一层回答「这次调用还要不要打出去、资源会不会被一个坏依赖抽干」。Saga 三义回答「跨步生意失败后业务状态怎么收」。不是同一层。

## 例子

- 正例：订单与额度分库，用数据 Saga + Outbox + Idempotent Consumer 串本地事务；失败走补偿，不开 2PC。
- 正例：Temporal Workflow 在 `addBankAccount` 前登记 `disconnectBankAccounts`，下游半成功也能幂等撤。
- 正例：BPMN 图给「已订机票」挂补偿 handler，取消行程时抛补偿事件，只撤已完成活动。
- 正例：调用方按 Rate Limiting 匀速写入；服务方按 Throttling 在过载时 429 / 降级；依赖持续失败时熔断，线程池按舱壁切开。
- 反例：把 Temporal `Saga` helper、BPMN 补偿事件、microservices.io 编舞写成「一种 Saga」。
- 反例：把口语 Inbox 写成正式模式名；或引用 Fowler 当 Saga/Outbox 专文。
- 反例：把令牌桶公式、节流、限流三词互换；或把熔断当分布式事务。
- 反例：工坊审核主路径上分布式 Saga / 事件总线，却把「现在不上」写成「这些模式不正当」。

## 边界与易混概念

- 不包括：具体引擎选型、工坊已采用声明、攻击或凭证。
- 三义并存，不要并成一词。
- Inbox 正式名是 Idempotent Consumer。
- Fowler 无 Saga/Outbox 专文。
- ISO 19510 = BPMN 2.0.1；OMG 现行 2.0.2。
- 微软 Rate Limiting ≠ Throttling ≠ 令牌桶公式。
- 熔断 / 舱壁 / 重试与 Saga 不是同一层。
- Azure Saga 专页本轮不采，数据模式回 microservices.io。
- Camunda 是 BPMN 实现说明，不是 OMG 规范替代。
- Temporal 文档总入口讲平台；补偿合同以 saga-pattern 页为准。
- 区分方法：先问载体是消息、代码列表，还是图事件；再问这一层管的是业务补偿还是调用韧性。

## 映射到本仓库

当前工坊：Gateway 同进程；同步 REST（`list` / `detail` / `create` / `update` / `withdraw` / `review`）；审核状态机 `pending → approved / rejected / withdrawn`。发布 / 审核要同步可见结果，主路径不上分布式数据 Saga、不上 Temporal/BPMN 补偿引擎、不上 Outbox 中枢。队列以后可以后加通知，不能当审核骨架。限流 / 熔断若出现，也只是边缘保护，不是补偿层。详见 [[concepts/后端架构名词与工坊对照]]、[[comparisons/工坊架构该上与不该上]]。

这是产品落点，不是对 Saga / Outbox / 工作流补偿 / 限流熔断的行业否定。对称 CRUD + 一条状态机够用时，本地事务比跨服务补偿便宜。

## 来源与证据

权威入口（16）：

1. [Saga（数据模式）](https://microservices.io/patterns/data/saga.html) — B2-Dist 枢纽。
2. [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) — 改库与发消息的原子配套。
3. [Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html) — Inbox 正式名。
4. [Temporal 文档总入口](https://docs.temporal.io/) — Durable Execution 平台。
5. [Temporal Saga Pattern](https://docs.temporal.io/design-patterns/saga-pattern) — 补偿代码合同。
6. [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2) — OMG 现行正式版。
7. [OMG BPMN 2.0.1](https://www.omg.org/spec/BPMN/2.0.1) — 与 ISO 19510 同一正文。
8. [ISO/IEC 19510:2013](https://www.iso.org/standard/62652.html) — 国际标准号；正文 = 2.0.1。
9. [Camunda Compensation events](https://docs.camunda.io/docs/components/modeler/bpmn/compensation-events/) — BPMN 补偿事件的实现说明。
10. [Rate Limiting](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern) — 调用方控速。
11. [Throttling](https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling) — 系统侧限额。
12. [Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) — 断路。
13. [Retry](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) — 短暂故障重试。
14. [Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) — 舱壁隔离。
15. [[queries/第二批蒸馏目标]] — B2-Dist 账本。
16. [[queries/第三批蒸馏目标]] — B3-WF / B3-RL / B3-CB 账本。

已知冲突（不得静默覆盖）：

- Saga 三义并存；B3-WF 与 B3-CB 都要求不要并成一词。
- Inbox 正式名是 Idempotent Consumer；Fowler 无 Saga/Outbox 专文。
- ISO 19510 = 2.0.1，OMG 现行 2.0.2。
- 微软 Rate Limiting ≠ Throttling ≠ 令牌桶公式。
- 熔断 / 舱壁 / 重试与 Saga 不是同一层；Azure Saga 行回 B2-Dist。
- 工坊「现在不上」≠「行业不正当」。

尚缺：ISO 页本次抓取超时，等式转引 OMG 2.0.1 与 ISO 条目摘要；Camunda 站点对 LLM 入口有时落到总索引，补偿语义以该路径人工页为准。未跑工坊或 Temporal/Camunda 真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/创意工坊与安全契约]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/DORA五项与SLO]]
