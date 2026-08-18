---
title: ORM三面
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
  - https://www.prisma.io/docs/orm
  - https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma
  - https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
  - https://www.prisma.io/docs/orm/next
  - https://www.prisma.io/docs/next
  - https://www.prisma.io/docs/orm/next/reference
  - https://www.prisma.io/docs/orm/next/fundamentals/reading-data
  - https://www.prisma.io/docs/orm/next/reference/orm-client
  - https://orm.drizzle.team/docs/overview
  - https://orm.drizzle.team/docs/data-querying
  - https://orm.drizzle.team/docs/rqb
  - https://kysely.dev/docs/intro
  - https://kysely.dev/docs/recipes/relations
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# ORM三面

本页不是已采用技术，也不是工坊必须改数据层的工单。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]]（B3-ORM）。只谈公开文档里的查询面自称，不写攻击、绕过或凭证。

## 一句话定义

「ORM 三面」不是一个标准，而是三家 TypeScript 数据层对自己的定位：Prisma 同时活着 **7 GA** 与 **Next EA** 两套产品查询面；Drizzle **自称**同时有 SQL-like 与 Relational 的双面 ORM；Kysely **明文**「不是 ORM」，只做类型安全的 SQL 查询构建器。

## 为什么重要

听到「上个 ORM」先问对方指哪一面。嵌套对象 Client、链式 model API、SQL 形 builder、关系 `with`、以及「我根本不是 ORM」，生成的 SQL 和对调用方的承诺都不一样。先分清**产品代际**和**自称品类**，才不会把 Early Access 写成现行 GA，或把查询构建器写成关系映射器。

## 权威入口

检索日 2026-08-14。下列 13 条是本页真源。凭证、连接串、攻击面不收。

| # | 入口 | 钉什么 |
|---|---|---|
| 1 | [Prisma ORM 总览](https://www.prisma.io/docs/orm) | 本区文档钉 **Prisma 7** 为现行 **generally available**。横幅另推 Next EA。Client 例是 `prisma.user.findMany({ include })`。直连必须给 driver adapter。 |
| 2 | [What is Prisma ORM](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma) | 7 的查询面：生成 Client，返回普通对象。`findMany` / `create` / `update` 吃嵌套 `where` / `include` / `data`。Client 与 Migrate 开源；**Studio 不开源**。 |
| 3 | [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) | 7 是破坏升级：`prisma-client` 生成器、`output` 必填、adapter 必给。**v7 尚不支持 MongoDB**，官方写继续用 v6。 |
| 4 | [What is Prisma Next](https://www.prisma.io/docs/orm/next) | Next 是下一主版本，现为 **Early Access**。要留在现行 GA 就继续 Prisma 7。合同优先，不是 7 的小改。 |
| 5 | [Introduction to Prisma Next](https://www.prisma.io/docs/next) | 同一 EA：又写 Next 是**新项目推荐起点**、通往 Prisma 8。与「GA 仍是 7」并存，两边留。 |
| 6 | [Prisma Next API reference](https://www.prisma.io/docs/orm/next/reference) | Next **自写 three query surfaces**：ORM client（`where` / `create` / `include`，PG+Mongo）；SQL query builder（`select` / `innerJoin`，**仅 PG**）；pipeline builder（Mongo，走 `db.query`）。再往下才是 raw。 |
| 7 | [Reading data with Prisma Next](https://www.prisma.io/docs/orm/next/fundamentals/reading-data) | 给 7 用户的对照：`findMany` → `.all()`，`findFirst` / `findUnique` → `.first()`。 |
| 8 | [Prisma Next ORM client](https://www.prisma.io/docs/orm/next/reference/orm-client) | 入口是 `postgres(...)` / `mongo(...)` 之后的 **`.orm` facet**（如 `db.orm.public.User.where({ email }).first()`），不是 7 的 `new PrismaClient().user.findUnique`。 |
| 9 | [Why Drizzle](https://orm.drizzle.team/docs/overview) | 自称 **the only ORM with both relational and SQL-like query APIs**。SQL-like 是核心；Queries API 管嵌套关系。宣称关系查询「exactly 1 SQL query」。 |
| 10 | [Drizzle Query Data](https://orm.drizzle.team/docs/data-querying) | 两套写法并列：`db.select().from().leftJoin()` 对 SQL；`db.query.users.findMany({ with })` 对嵌套。由调用方选。 |
| 11 | [Drizzle Queries / RQB](https://orm.drizzle.team/docs/rqb) | 关系查询是 schema + query builder 的**可选扩展**。`with` 里的列必须走回调参数，不能直接用导入的 table 对象。 |
| 12 | [Kysely Introduction](https://kysely.dev/docs/intro) | 自称 type-safe、autocomplete-friendly 的 **TypeScript SQL query builder**，受 Knex 启发。不是 ORM 页。 |
| 13 | [Kysely Relations 配方](https://kysely.dev/docs/recipes/relations) | 原文全大写：**Kysely IS NOT an ORM. Kysely DOES NOT have the concept of relations.** 嵌套靠方言 JSON 函数；`jsonArrayFrom` / `jsonObjectFrom` 是 SQL 助手，不是关系 API。 |

上表 **13** 条。B3-ORM 采集行不在本页镜像。

## 如何运作

### Prisma 7 GA

Schema 建模 → `prisma generate` 出 Client → `prisma.user.findMany({ where, include })`。查询面是**嵌套对象**：过滤、关系和写入都塞进一个参数袋。7 起直连必须注入 driver adapter；连接 URL 走 `prisma.config.ts`，不在此抄。Mongo 不在 7 的 GA 面里。

### Prisma Next EA

Schema（或 TypeScript）先编成可 diff 的合同，再对合同写链式查询。日常走 `.orm`：`.where().all()` / `.first()`。官方把 7 的 `findMany` / `findUnique` 映射到这两个 terminal。要 join / 聚合且 ORM client 没露出来，走 SQL query builder（现只钉 PostgreSQL）。Mongo 聚合走 pipeline builder。这是另一套产品 API，不是 7 的别名。

### Drizzle

核心是 SQL-like：`select` / `from` / `join` 与生成 SQL 接近 1:1。另给 `db.query.*.findMany({ with })` 取嵌套行，并宣称单条 SQL。两面都自称 ORM。关系面是 opt-in，不是唯一入口。

### Kysely

你自备 `Database` 接口（或 codegen）。运行时 JS 类型由 `pg` / `mysql2` 等驱动决定，Kysely **不改**运行时输出类型。写法是 `selectFrom('person').selectAll().execute()`。没有「关系」概念；要嵌套就自己写 JSON 子查询。入门页还写：不要把库凭证写进源码。本页不收连接串。

## 行业何时该上

对照 [[concepts/后端架构名词与工坊对照]] 的三层「领域常绑 ORM」——那是分层代价，不是本页三家已采用。行业总表见 [[comparisons/行业架构方案何时用]]。

| 面 | 何时该上 | 不该当成 |
|---|---|---|
| Prisma 7 Client | 要 schema-first、生成类型、嵌套 `include`，且接受 GA 工具链 | Next EA；Mongo 已在 7 就绪 |
| Prisma Next | 评 EA、或新项目愿跟合同/链式 API 走 | 现行 GA；「已经是 Prisma 8」 |
| Drizzle 双面 | 要 SQL 形 builder，偶尔用 `with` 取嵌套 | 「唯一真正的 ORM」已成行业标准（这是自称） |
| Kysely | 只要类型安全 SQL，自己管 schema / 迁移 / 关系 | ORM；有 `jsonArrayFrom` 就等于关系映射 |
| 原始驱动 / SQL | 每条语句都要手写、或引擎特性无封装 | 「没有类型就不能查」 |

N+1、对象-关系阻抗、泄漏的抽象都是行业页已写的代价，不是工坊禁令。

## 必须保留的冲突

- 账本写「7 GA 与 Next EA **两套**查询面」；Next 参考页自写产品内 **three query surfaces**。跨版本是两套产品 API（7 嵌套对象 vs Next 链式）；Next 产品内是三面。两边留。
- `/docs/next` 写 Next 是新项目推荐起点；`/docs/orm` 与 upgrade 钉 GA 仍是 7，Mongo 还要留 v6。
- Drizzle 自称「唯一同时有 relational + SQL-like 的 ORM」；Prisma Next 也公开 ORM client + SQL query builder。自称两边留，本页不判谁赢。
- Kysely 提供 JSON 嵌套助手 ≠ 它承认关系或自称 ORM。
- 「工坊现在不上这些库」不是「行业不该用 ORM / 查询构建器」。
- Prisma 7 嵌套对象 Client ≠ Prisma Next `.orm` 链式 ≠ Next SQL QB ≠ Next Mongo pipeline。
- Prisma 7 GA ≠ Prisma Next EA ≠ Prisma 8（8 尚未作为现行发布钉在本批文档）。
- 本页映射工坊数据访问词表；**不是**「工坊必须上 Prisma / Drizzle / Kysely」。

## 例子

- 正例：生产要稳定生成 Client 和 `findMany({ include })`，钉 Prisma **7** 文档区，不把 Next 示例贴进 7 代码。
- 正例：同一 Drizzle 项目里，报表用 `select().from().leftJoin()`，详情页用 `db.query.users.findMany({ with })`；两面都是官方给的。
- 正例：Kysely 用 `jsonArrayFrom` 嵌宠物列表，并在注释里写「这不是 ORM 关系」。
- 反例：把 `db.orm.public.User.where().all()` 写成 Prisma 7。
- 反例：因 Drizzle 自称「唯一双面」就写「Prisma 没有 SQL 形 API」——Next 参考页已公开 SQL query builder。
- 反例：把 Kysely 配方里的 JSON 嵌套升级成「Kysely 其实是 ORM」。

## 边界与易混概念

- 不包括：注入/绕过、连接串与密钥、工坊 Gateway schema、具体成品选型工单。
- Prisma 7 嵌套对象 Client ≠ Prisma Next `.orm` 链式 ≠ Next SQL QB ≠ Next Mongo pipeline。
- Prisma 7 GA ≠ Prisma Next EA ≠ Prisma 8（8 尚未作为现行发布钉在本批文档）。
- Drizzle SQL-like ≠ Drizzle Relational Queries。后者 opt-in。
- Kysely ≠ ORM。官方连 relations 概念都否认。
- 「latest / Next / 推荐新项目」要看所在页：`/docs/orm` 钉 7；`/docs/next` 推 Next。

## 映射到本仓库

当前工坊：模块化单体 + 同步 REST；数据访问未采用 Prisma / Drizzle / Kysely。三层里「领域常绑 ORM」只说明横切变更贵，见 [[concepts/后端架构名词与工坊对照]]。本页补查询面钉与冲突，不把工坊禁令写成行业否定，也不写成已采用清单。

## 来源与证据

- 7 是现行 GA、Next 是 EA：[/docs/orm](https://www.prisma.io/docs/orm) 正文与横幅；[/docs/orm/next](https://www.prisma.io/docs/orm/next)「continue with Prisma 7」。
- 7 查询面是嵌套对象 Client：[What is Prisma](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma) 的 `findMany` / `include` / `create`。
- 7 破坏点与 Mongo 仍走 v6：[Upgrade to v7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)。
- Next 三面与 `.orm` 对照：[API reference](https://www.prisma.io/docs/orm/next/reference)、[reading-data](https://www.prisma.io/docs/orm/next/fundamentals/reading-data)、[orm-client](https://www.prisma.io/docs/orm/next/reference/orm-client)。
- 新项目推荐 Next：[/docs/next](https://www.prisma.io/docs/next) 原句。
- Drizzle 双面自称：[overview](https://orm.drizzle.team/docs/overview)、[data-querying](https://orm.drizzle.team/docs/data-querying)、[rqb](https://orm.drizzle.team/docs/rqb)。
- Kysely 明文非 ORM：[intro](https://kysely.dev/docs/intro)、[relations](https://kysely.dev/docs/recipes/relations)。
- 查询账本：[[queries/第三批蒸馏目标]] B3-ORM。

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
- [[concepts/HTTP合同与问题详情]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/Postgres与多租户]]
