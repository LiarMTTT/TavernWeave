---
title: Redis与日志队列
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
  - https://redis.io/docs/latest/develop/data-types/
  - https://redis.io/docs/latest/develop/data-types/compare-data-types/
  - https://redis.io/docs/latest/develop/use-cases/cache-aside/
  - https://redis.io/docs/latest/develop/use-cases/job-queue/
  - https://redis.io/docs/latest/develop/pubsub/
  - https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
  - https://redis.io/docs/latest/develop/data-types/streams/
  - https://redis.io/docs/latest/develop/use-cases/streaming/
  - https://redis.io/legal/licenses/
  - https://kafka.apache.org/intro/
  - https://kafka.apache.org/43/design/design/
  - https://docs.nats.io/nats-concepts/what-is-nats
  - https://docs.nats.io/nats-concepts/subjects
  - https://docs.nats.io/nats-concepts/jetstream
  - https://www.rabbitmq.com/tutorials/amqp-concepts
  - https://www.rabbitmq.com/docs/exchanges
  - https://www.rabbitmq.com/docs/streams
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# Redis与日志队列

本页不是已采用缓存或 broker，也不是工坊要上 Redis / Kafka 的工单。检索时间：2026-08-14。账本：[[queries/第三批蒸馏目标]] **B3-Redis**（约 16 条）。枢纽 [Redis data types](https://redis.io/docs/latest/develop/data-types/)。排除第二批 Saga / Outbox（见 [[concepts/Saga三义与补偿]]）。不收攻防、凭证、未授权访问。

## 一句话定义

Redis 是**数据结构服务器**：同一进程里用字符串、哈希、列表、集合、有序集合、流等类型做事。行业里的「队列」是**领取后出队**；「日志」是**只追加、可回放**。两者都可能跑在 Redis 上，但不是同一种合同。

## 为什么重要

口语常把 Redis 说成「缓存」，把 Kafka / Streams / 列表任务队列说成同一种「消息」。官方分层不是这样：缓存是旁路模式；列表任务队列是单工领取；Streams 与 Kafka topic 是追加日志；Pub/Sub 是至多一次、无历史。先分清**类型 / 队列 / 日志 / 瞬时广播 / 磁盘持久化 / 软件许可**，才不会把客户端 MIT、旧 persistence 路径或 0.8 设计档当成现行真源。

## 权威入口

检索时间：2026-08-14。下列为可点真源，不是镜像。许可另钉 [redis.io/legal/licenses](https://redis.io/legal/licenses/)。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [数据类型总览](https://redis.io/docs/latest/develop/data-types/) | B3 枢纽。Redis 自称 data structure server |
| 2 | [类型对照](https://redis.io/docs/latest/develop/data-types/compare-data-types/) | 时间序 + 多消费者协同读才选 Streams；否则 Lists |
| 3 | [旁路缓存](https://redis.io/docs/latest/develop/use-cases/cache-aside/) | 应用先读缓存，未命中再读源并回填；语言无关枢纽 |
| 4 | [任务队列](https://redis.io/docs/latest/develop/use-cases/job-queue/) | 列表存待领 ID，`BLMOVE` 原子搬到处理列表 |
| 5 | [Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) | 至多一次、无历史 |
| 6 | [持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) | 现行 OSS 页；旧 `/docs/manual/persistence/` **404** |
| 7 | [Streams](https://redis.io/docs/latest/develop/data-types/streams/) | 5.0 起追加日志；消费组可至少一次、可认领 |
| 8 | [流式用例](https://redis.io/docs/latest/develop/use-cases/streaming/) | 对照 Pub/Sub 与 job-queue |
| 9 | [Kafka Intro](https://kafka.apache.org/intro/) | 事件 / 主题 / 分区；Apache-2.0；现行 4.3 |
| 10 | [Kafka 4.3 Design](https://kafka.apache.org/43/design/design/) | 设计真身：持久化、投递语义、日志压缩 |
| 11 | [What is NATS](https://docs.nats.io/nats-concepts/what-is-nats) | Core 至多一次、无队列存储 |
| 12 | [Subjects](https://docs.nats.io/nats-concepts/subjects) | `*` / `>` |
| 13 | [JetStream](https://docs.nats.io/nats-concepts/jetstream) | 至少一次、可回放 |
| 14 | [AMQP 0-9-1 模型](https://www.rabbitmq.com/tutorials/amqp-concepts) | 交换机 / 队列 / 绑定；不是 AMQP 1.0 |
| 15 | [Exchanges](https://www.rabbitmq.com/docs/exchanges) | 当时文档头 4.3 |
| 16 | [RabbitMQ Streams](https://www.rabbitmq.com/docs/streams) | 只追加；补队列不是替 |

上表 **16** 条。B3-Redis 的采集行不在本页镜像。

## 如何运作

### Redis 先选类型

[数据类型总览](https://redis.io/docs/latest/develop/data-types/) 把自己写成 data structure server。通用面：字符串、哈希、列表、集合、有序集合、流；另有 JSON、时序、向量集、数组、概率结构。专用面（地理 / 概率 / 时序 / 向量）不要拿来当通用队列。

[对照选型](https://redis.io/docs/latest/develop/data-types/compare-data-types/) 的序列决策树：要时间序或**多个消费者协同读**，才选 Streams；否则用 Lists。官方排序口：Lists 适合队列、栈、线性结构；Streams 适合日志、时序、只追加，并自带消费组、至少一次。

| 模式 | 官方入口 | 合同 | 不是 |
|---|---|---|---|
| 旁路缓存 | [cache-aside](https://redis.io/docs/latest/develop/use-cases/cache-aside/) | 应用先读缓存，未命中再读源并回填 | 语言客户端专页不是总入口 |
| 任务队列 | [job-queue](https://redis.io/docs/latest/develop/use-cases/job-queue/) | 列表存待领 ID，`BLMOVE` 原子搬到处理列表；元数据在哈希 | 专用 broker 的替身；文内仍提已弃用的 `BRPOPLPUSH` |
| 发布订阅 | [Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) | 至多一次；订阅者当时不在就永不见 | 队列或日志；7.0+ 分片 Pub/Sub 只缩传播范围 |
| 流 | [Streams](https://redis.io/docs/latest/develop/data-types/streams/) | 5.0 起追加日志；消费组可至少一次、可认领 | Kafka 分区的等价物（官方自有对照节） |

[流式用例](https://redis.io/docs/latest/develop/use-cases/streaming/) 对照：Pub/Sub 无历史；job-queue 是单工领取；要扇出且各池独立进度，才用 Streams 消费组。

### 队列 ≠ 日志

两边都留，不要并成「消息中间件」一词。

- **队列**：领取是破坏性的，设计趋向空。Redis 列表任务队列、RabbitMQ 默认 queue、NATS queue group（组名是分活标签，Core **不落盘**）走这条。
- **日志**：只追加，消费不删条目，多游标可回放。Redis Streams、[Kafka topic](https://kafka.apache.org/intro/)（官方写：不像传统消息系统，消费后不删）、[RabbitMQ Streams](https://www.rabbitmq.com/docs/streams)（官方：补队列不是替）、NATS JetStream 走这条。
- **瞬时广播**：Redis Pub/Sub、Core NATS。无 broker 队列、无历史。不是上两条的弱化版。

AMQP 0-9-1 把消息发到 [exchange](https://www.rabbitmq.com/docs/exchanges)（教程常比邮箱），再按 binding 进 queue。[模型页](https://www.rabbitmq.com/tutorials/amqp-concepts) 是 0-9-1，不是 AMQP 1.0。NATS / Pulsar 深页第五批已收，本页不重抄。

Kafka topic 是追加日志，仍**不是**事件溯源的事件存储（缺按实体查流与乐观并发），见 [[concepts/事件溯源与CQRS]]。

### Kafka 设计真身在 4.3

[Intro](https://kafka.apache.org/intro/)：事件、主题、分区；主题多生产者多订阅者。`/documentation/` 现与 `/intro/` 同文，旧 `#design` 锚点失效。设计真身是 [4.3 Design](https://kafka.apache.org/43/design/design/)（页脚 2026-05-22 加 4.3 文档）：持久化、投递语义、日志压缩。`/08/design/` 仍活，但是 0.8 死档，勿引。

### 持久化 ≠ 消息日志

现行 OSS 页：[persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)。旧路径 `/docs/manual/persistence/` **404**。四档：RDB 快照、AOF 写日志、合用、关闭（缓存常见）。官方劝：要接近 PostgreSQL 级安全就 RDB+AOF；能接受数分钟丢失可用 RDB；**不鼓励单开 AOF**。7.0 多段 AOF；页内另有 `BACKUP` 族。外链的 Redis Software 持久化 UI 是商业产品页，不当 OSS 真源。AOF 是**进程如何落盘**；Streams / Kafka log 是**消息如何被读**。不要把两层「log」并成一词。

### Redis ≥8 是三许可，勿标 MIT

[Licenses](https://redis.io/legal/licenses/) 表：

| 版本 | 称呼 | 许可 |
|---|---|---|
| ≤7.2 | Redis | BSD-3-Clause |
| 7.4 | Redis Community Edition | RSALv2 **或** SSPLv1 |
| ≥8 | Redis Open Source | RSALv2 **或** SSPLv1 **或** AGPLv3 |

RSALv2 / SSPLv1 官方自写**不是**开源许可；AGPLv3 才是 OSI 认可的第三选项。客户端（redis-py、ioredis、jedis 等）多是 MIT / BSD，**不要**把客户端许可抄到服务器上。本页不收 Valkey 分叉专章（采集缺口）。

## 必须保留的冲突

- **队列 ≠ 日志。** 列表 / `BLMOVE`、AMQP queue 是破坏性领取；Streams / Kafka / RabbitMQ Stream / JetStream 是只追加可回放。Pub/Sub 与 Core NATS 两边都不是。
- **Redis ≥8 三许可（RSALv2 / SSPLv1 / AGPLv3），勿标 MIT。** ≤7.2 才是 BSD-3；7.4 双许可；客户端 MIT 不传到服务器。
- 旧 persistence 路径 404；现行页劝勿单开 AOF，并外链商业页。
- Kafka `/documentation/` 现等于 intro；设计在 `/43/design/design/`，不是 `/08/design/`。
- Kafka topic ≠ 事件存储。日志可回放，仍缺按实体查流与乐观并发，见 [[concepts/事件溯源与CQRS]]。
- 本仓不上队列主路径，不是对行业方案的否定。
- 本页映射工坊同步 REST 的**后加通知 / 导出**；**不是**「工坊必须上 Redis 或 Kafka」。

## 例子

- 正例：会话或热点读用旁路缓存；发信、导出用列表 + `BLMOVE`；要回放或消费组用 Streams。
- 正例：跨服务事件流、要按键保序且消费后仍在，用 Kafka 4.3 主题，不当成 Redis 列表。
- 反例：把 Redis ≥8 标成 MIT，或把 redis-py 的 MIT 写成服务器许可。
- 反例：引用 `/docs/manual/persistence/`，或把 `/08/design/` 当现行 Kafka 设计。
- 反例：用 Pub/Sub 当任务队列，或把 Streams 说成「就是队列」。
- 反例：把工坊发布审核改成队列主路径。审核要同步可见，见 [[comparisons/工坊架构该上与不该上]]。

## 边界与易混概念

- 不包括：Redlock 争议文、Streams 8.6 幂等专页、Valkey 专章、攻防、凭证、本仓上 Redis 的实施工单。
- 不包括：Saga / Outbox / Inbox（第二批；正式名 Idempotent Consumer）。
- 易混：队列 ≠ 日志 ≠ Pub/Sub ≠ AOF。
- 易混：NATS queue group ≠ AMQP queue。前者是兴趣图上的分活名。
- 易混：RabbitMQ Stream ≠ 默认 queue。声明时 `x-queue-type=stream` 钉死。
- 易混：Redis Software 持久化页 ≠ OSS persistence 概念页。
- 易混：Kafka topic ≠ 事件溯源事件存储。
- 区分：先问「领取后还在不在、要不要回放」；再问「这是行业合同还是本仓产品门」。

## 映射到本仓库

工坊通信主路径是同步 REST（`list` / `detail` / `create` / `update` / `withdraw` / `review`）。[[concepts/后端架构名词与工坊对照]] 写：消息队列只适合后加通知、导出、邮件，**不当同步 API 替身**。[[comparisons/行业架构方案何时用]] 同行。AsyncAPI 的 Kafka/AMQP binding 是合同描述，见 [[concepts/GraphQL与异步事件合同]]，不是本页真源。审核枚举是产品状态机，见 [[concepts/状态机与SCXML]]，不是 broker 消费组。

| 本仓对象 | 实际是 | 不是 |
|---|---|---|
| 发布 / 审核 | 同步 REST + 状态机 | Redis 列表或 Kafka 主题 |
| 卡 iframe / HUD | 宿主页挂载 | Pub/Sub 通道 |
| Wiki / 蒸馏门 | 来源可定位 + `verify-repo` | 消费组至少一次 |
| 发卡 JSON/PNG | 回封产物 | RDB / AOF |

**不要把本页写成工坊要上 Redis 或 Kafka。** 「现在不上」不是「这些不是正当行业方案」。

## 来源与证据

- 类型与选型：数据类型总览、对照决策树。
- 四种用法：cache-aside、job-queue（`BLMOVE`）、Pub/Sub、Streams / 流式用例。
- 持久化：现行 OSS persistence 页；本轮复现 `/docs/manual/persistence/` 404。
- Kafka：Intro 与 4.3 Design（页脚 2026-05-22）；`/08/design/` 是 0.8 死档。
- NATS：What is NATS / Subjects / JetStream。
- RabbitMQ：AMQP 0-9-1 模型、Exchanges、Streams。
- 许可：[redis.io/legal/licenses](https://redis.io/legal/licenses/)。
- 查询账本：[[queries/第三批蒸馏目标]] B3-Redis。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/Saga三义与补偿]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/事件溯源与CQRS]]
- [[concepts/状态机与SCXML]]
