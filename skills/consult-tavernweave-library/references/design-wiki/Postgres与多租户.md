---
title: Postgres与多租户
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
  - https://www.postgresql.org/docs/current/transaction-iso.html
  - https://www.postgresql.org/docs/current/applevel-consistency.html
  - https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html
  - https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - https://www.postgresql.org/docs/current/sql-createpolicy.html
  - https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models
  - https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/storage-data
  - https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html
  - https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html
  - https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/bridge.html
  - https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/matrix.html
  - https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html
  - https://cloud.google.com/spanner/docs/implement-multi-tenancy
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
  - concepts/ORM三面.md
knowledge_class: factual
---

# Postgres与多租户

本页不是已采用库栈，也不是工坊要上 RLS / schema-per-tenant 的工单。检索时间：2026-08-14。账本：[[queries/第二批蒸馏目标]] B2-Data、B2-Tenant。`/docs/current/` 当时指向 **PostgreSQL 18.6**。只谈公开文档，不写攻击、绕过或凭证。

## 一句话定义

Postgres 给应用的是一套隔离等级、锁和行安全策略；多租户是把「谁的数据」切到实例、库、schema 或行上的产品选择。两层常叠用，不是同一张图。

## 为什么重要

听到「上多租户」先问切在哪一层：独占实例、每租户一库、每租户一 schema，还是同行加 `tenant_id`。隔离等级回答并发看见什么；RLS 回答漏写 `WHERE` 时库还拦不拦。云厂商对「单库里按对象切开」说法不一致，本页两边留，不并成一种标准切法。查询面自称见 [[concepts/ORM三面]]，不替代本页的隔离切法。工坊当前是弱多租户，隔离靠所有权，见文末映射。

## 权威入口

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [事务隔离](https://www.postgresql.org/docs/current/transaction-iso.html) | B2-Data 枢纽；四档现象与 PG 实现 |
| 2 | [应用层一致性](https://www.postgresql.org/docs/current/applevel-consistency.html) | Serializable 可「只重试」；逻辑副本尚不覆盖 |
| 3 | [隔离失败重试](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html) | `40001` 整段重试；库不自动重试 |
| 4 | [行安全策略](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | `ENABLE` 后默认拒绝；owner / `BYPASSRLS` 绕过 |
| 5 | [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html) | `USING` vs `WITH CHECK`；`PERMISSIVE` OR / `RESTRICTIVE` AND |
| 6 | [Azure 租户模型](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models) | B2-Tenant 枢纽；隔离是谱，不是一刀 |
| 7 | [Azure 数据层](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/storage-data) | 单库「每租户一张表」标反模式 |
| 8 | [AWS 仓池桥](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html) | silo / pool / bridge，可按层混用 |
| 9 | [AWS 分区三模型](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html) | 落到 PG：仓=实例、桥=库或 schema、池=同行 |
| 10 | [AWS 桥接档](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/bridge.html) | schema-per-tenant 是正式桥选项 |
| 11 | [AWS 决策矩阵](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/matrix.html) | 四格对照隔离、迁移、成本 |
| 12 | [AWS 池化 RLS](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html) | pool **必须** RLS；推荐会话变量 |
| 13 | [Spanner 四级](https://cloud.google.com/spanner/docs/implement-multi-tenancy) | Instance / Database / Table / Row |

上表 **13** 条。B2-Data 的类型/索引/UTIL 行、B3-CDC 逻辑复制、B3-PGR / B3-Neon 不在本页镜像。CDC / FTS / pgvector 见 [[concepts/向量检索入口]]。

## 如何运作

### 隔离等级：四档名，三档实现

[事务隔离](https://www.postgresql.org/docs/current/transaction-iso.html) 用脏读、不可重复读、幻读、序列化异常定义四档。PostgreSQL 对外接受四档名，内部只实现三档：**Read Uncommitted 行为等于 Read Committed**（默认）。Repeatable Read **不允许幻读**（标准允许更严）。Serializable 才禁止序列化异常。

默认 RC 下，两次 `SELECT` 可以看见不同已提交数据。复杂校验不要靠「连读两次合计」。[应用层一致性](https://www.postgresql.org/docs/current/applevel-consistency.html)：写和需要一致读的读都走 Serializable，业务校验可以「只重试」；否则用 `FOR UPDATE` / `FOR SHARE` / 表锁。警告：**可串行化完整性尚不覆盖热备与逻辑副本**。

[隔离失败](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html)：`40001` 必须整段重试，包括决定 SQL 和取值的应用逻辑。库不自动重试。死锁 `40P01` 也可重试。序列（`serial`）改动对其它事务立刻可见，回滚也不撤计数。

### 行安全：漏写 WHERE 时库还拦不拦

[RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) 在 `GRANT` 之上再按行过滤。`ENABLE ROW LEVEL SECURITY` 之后，普通查询必须被策略放行；**没有策略 = 默认拒绝**。表所有者通常不受策略约束，除非 `FORCE ROW LEVEL SECURITY`。超级用户和 `BYPASSRLS` 角色始终绕过。`TRUNCATE` 与 `REFERENCES` 不受 RLS。引用完整性检查（UNIQUE / PK / FK）也绕过策略，以免破坏完整性——这是规范约束，本页不展开利用面。

[CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)：`USING` 管看见哪些行，`WITH CHECK` 管写入哪些行；只写 `USING` 时二者相同。多条 `PERMISSIVE` 用 OR，`RESTRICTIVE` 用 AND。备份场景可把 `row_security` 设为 `off`：不会静默漏行，而是在结果会被策略过滤时报错。

AWS 池化档写明：pool **必须** RLS；推荐 `current_setting('app.current_tenant')`，不要每租户一个数据库用户。这是厂商建议，不是 Postgres 规范要求。

### 租户模型是谱

[Azure 租户模型](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models) 把隔离画成连续谱：全独占（什么都不共享）→ 垂直分区（有的共享、有的独占）→ 全共享。先定义租户（B2B 组织 vs B2C 个人/家庭），再映射逻辑租户到部署（stamp / 有时叫超租户）。共享部署靠应用代码和租户标识切开；独占部署可以少写多租户代码，但贵。

[AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html) 用三个词：silo（部分或全部资源独占，但仍共享身份与开通）、pool（共享资源）、bridge（按层混用）。不是整系统一刀切。

[AWS PG 分区](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html) 把三词落到 Postgres：**仓 = 每租户实例/集群**；**桥 = 同实例里每租户一库，或同库里每租户一 schema**；**池 = 同 schema 同行**。[桥接专页](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/bridge.html) 把 schema-per-tenant 写成正式选项，并说它是 RLS 的替代，开通成本略高。这里的 “database” 是 PG 逻辑库，不是一台 RDS 实例。

[决策矩阵](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/matrix.html) 四格并列：silo、桥-分库、桥-分 schema、pool。schema 桥：中等租户数、需要跨租户对照时「首选」；pool：租户多、每户数据少，隔离最弱，必须自己做 RLS。

[Spanner](https://cloud.google.com/spanner/docs/implement-multi-tenancy) 另给四级：Instance / Database / Table / Row。Table 级可用 named schema。这是第三家词汇，不拿来裁决 Azure / AWS。

## 必须保留的冲突

- **Azure vs AWS，两边都留。** Azure 数据层把单库「每租户一张表」（table-based isolation）标反模式，推 **tenant 列** 或 **每租户一库**。AWS 把 **schema-per-tenant** 列为正式桥接档，并给对照矩阵。表 ≠ schema；两家切的粒度不同，不要并成一句「云厂商禁止/允许 schema-per-tenant」。
- Azure 隔离是谱；AWS 是 silo / pool / bridge 三词。词表不同，映射时写清，不要互换。
- PG 对外四档隔离名，内部三档；RU=RC。
- Serializable 完整性尚不覆盖热备与逻辑副本。
- RLS 默认拒绝 ≠ 已写策略；owner / `BYPASSRLS` / `TRUNCATE` / 引用完整性不走策略。
- AWS「pool 必须 RLS」是厂商档，不是 Postgres 强制。
- B3-PGR 的 schema isolation 是 API 版本切面，不是租户隔离。B3-Neon 分支语义另页。
- 工坊「现在不上」≠「这些切法不正当」。

## 例子

- 正例：共享表加 `tenant_id`，会话设 `app.current_tenant`，RLS `USING` 对齐；应用仍带租户条件，策略当第二道门。
- 正例：合规要求独占时 silo（每租户实例）；中等户数、要跨户对照时走 AWS 的 schema 桥，并接受 catalog 膨胀。
- 正例：业务校验走 Serializable，捕获 `40001` 后整段重试，不把半段提交当成功。
- 反例：单库为每个租户建一套表，却说「这是 Azure 推荐」。Azure 点名这是反模式。
- 反例：把 Azure「不要每租户一张表」写成「AWS 的 schema-per-tenant 不正当」，或反过来。
- 反例：只靠应用 `WHERE tenant_id`、表未 `ENABLE` RLS，却声称 pool 已隔离。
- 反例：把工坊「多发布者共享目录、隔离靠所有权」写成已经上了 schema-per-tenant 或 RLS。

## 边界与易混概念

- 不包括：具体连接串、凭证、攻击步骤、厂商报价、B3 的 CDC / PostgREST / Neon 正文。
- 不包括：本仓库已落地的 Postgres 多租户——**没有这回事**。
- 易混：table-per-tenant ≠ schema-per-tenant ≠ database-per-tenant ≠ instance-per-tenant。
- 易混：RLS ≠ `GRANT`；策略过滤行，权限管对象。
- 易混：租户标识列 ≠ 行安全。列是数据形状，策略才是漏写 `WHERE` 时的库门。
- 易混：Azure「部署 / stamp」≠ AWS silo。前者是逻辑租户到基础设施的映射，后者是资源独占程度。
- 易混：逻辑复制的「可串行化」提交语义 ≠ 本页事务隔离档。
- 易混：隔离切法 ≠ [[concepts/ORM三面]] 的查询面自称。Prisma / Drizzle / Kysely 不决定仓、池、桥。
- 区分：先问切在实例、库、schema 还是行；再问并发看见什么；最后问漏写过滤条件时谁拦。

## 映射到本仓库

当前工坊：Gateway 同进程；目录静态；包进对象存储；同步 REST；审核状态机 `pending → approved / rejected / withdrawn`；OAuth 只证明发布者；**弱多租户靠所有权**。见 [[concepts/后端架构名词与工坊对照]]、[[comparisons/工坊架构该上与不该上]]。数据访问未采用 Prisma / Drizzle / Kysely，见 [[concepts/ORM三面]]。

不上 schema-per-tenant、不上共享库 RLS、不按发布者拆库来模拟强隔离。这是产品落点，不是对仓/池/桥或 RLS 的行业否定。对称 CRUD + 所有权够用时，共享目录比每发布者一 schema 便宜。卡内 fail closed 仍归 [[concepts/创意工坊与安全契约]]。本 Vault 不收 Gateway 真身字段。

## 来源与证据

- 隔离与重试：PG 18 手册 13.2 / 13.4 / 13.5；`/docs/current/` 检索日指向 18.6。
- RLS：手册 5.9 与 `CREATE POLICY`。
- Azure：租户模型谱 + 数据层反模式句（table-based isolation）。
- AWS：SaaS Lens 三词；PG 分区 / 桥接 / 矩阵 / RLS 建议。
- Google：Spanner 四级，只作第三家词汇。
- 查询账本：[[queries/第二批蒸馏目标]] B2-Data、B2-Tenant。

已知冲突见上节，不静默覆盖。Azure 是否会另出 schema-per-tenant 专档、AWS 是否改口：尚无继任文本，标未知。未跑工坊或 Postgres 真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/创意工坊与安全契约]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/ORM三面]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/Saga三义与补偿]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/事件溯源与CQRS]]
- [[concepts/向量检索入口]]
- [[concepts/Redis与日志队列]]
- [[concepts/Iceberg与湖仓]]
- [[concepts/十二因素与CAP]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/功能开关与OpenFeature]]
- [[concepts/CRDT与local-first]]
