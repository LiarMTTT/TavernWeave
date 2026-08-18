---
title: Iceberg与湖仓
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
  - https://iceberg.apache.org/spec/
  - https://iceberg.apache.org/terms
  - https://iceberg.apache.org/rest-catalog-spec/
  - https://parquet.apache.org/docs/
  - https://parquet.apache.org/docs/file-format/
  - https://github.com/apache/parquet-format
  - https://arrow.apache.org/faq/
  - https://clickhouse.com/docs/reference/functions/table-functions/iceberg
  - https://clickhouse.com/docs/use-cases/data-lake/support-matrix
  - https://clickhouse.com/docs/engines/table-engines/integrations/iceberg
  - queries/第三批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# Iceberg与湖仓

本页不是已采用的表格式，也不是工坊要上对象存储湖表的工单。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]] **B3-Ice**（约 5 条）。只谈公开规范与引擎能力页，不写集群搭建、凭证或攻击步骤。

## 一句话定义

Apache Iceberg 是一份**表格式**规范：把分布式文件系统或对象存储里一堆慢变的不可变文件，当成一张可提交、可演进的表来管。湖仓是对象存储 + 表格式 + 目录 + 计算引擎叠在一起的架构称呼，不是 Iceberg 产品名，也不是某家数仓。

## 为什么重要

听到「上湖仓」先问三层：文件怎么落盘、表状态谁当真相、引擎读到哪一版。Parquet 只管单个列存文件；Iceberg 管「哪些文件构成当前快照」；Catalog 管「这张表现在的元数据指针」。三者并成一词，就会把「能读 Parquet」写成「已经上了 Iceberg」，或把 ClickHouse 集成写成「规范已齐」。工坊和酒馆卡 iframe **没有**对象存储湖表面；行业正当性仍保留，见文末映射。

分析表不是 OLTP 隔离切法，见 [[concepts/Postgres与多租户]]。Iceberg snapshot 是一次提交的文件集合，不是事件日志重放，见 [[concepts/事件溯源与CQRS]]。

## 权威入口

B3-Ice 枢纽是 [Iceberg Table Spec](https://iceberg.apache.org/spec/)。下列 **5** 条是入口，不是教程，也不镜像全文。Parquet 与第三波 [[queries/第三批蒸馏目标]] **B3-OLAP**（Arrow）重叠，不在本页重蒸 Arrow。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Iceberg Table Spec](https://iceberg.apache.org/spec/) | B3-Ice 枢纽；v1–3 已采纳，v4 未采纳 |
| 2 | [Iceberg Terms](https://iceberg.apache.org/terms) | Catalog / Snapshot / Manifest / Partition spec |
| 3 | [REST Catalog Spec](https://iceberg.apache.org/rest-catalog-spec/) | 跨语言目录协议；OpenAPI，不是 Hive Thrift |
| 4 | [Parquet 文档](https://parquet.apache.org/docs/) | 列存**文件**格式入口；规范真身在 parquet-format 仓 |
| 5 | [Parquet File Format](https://parquet.apache.org/docs/file-format/) | `PAR1` + row group + 文件尾元数据；不是表快照 |

并行回指，不升条：[Arrow FAQ](https://arrow.apache.org/faq/)（内存列式 ≠ 落盘 Parquet）；ClickHouse [iceberg 表函数](https://clickhouse.com/docs/reference/functions/table-functions/iceberg) 与 [support-matrix](https://clickhouse.com/docs/use-cases/data-lake/support-matrix)（引擎能力，不是规范）。Delta / Hudi 见 [[10-收件箱/写回候选/第六批-B6-Delta]]，本页不重抄。REST Catalog 的合同形状见 [[concepts/OpenAPI与Arazzo]]、[[concepts/HTTP合同与问题详情]]，本页不重蒸 HTTP 错误体。

## 如何运作

### 三层不要并

| 层 | 官方心智 | 不是 |
|---|---|---|
| 文件格式 | Parquet / Avro / ORC：单个不可变数据文件怎么编码 | 不是表、不是目录、不是引擎 |
| 表格式 | Iceberg：用元数据文件跟踪**哪些**数据/删除文件构成一次提交 | 不是查询引擎，也不代替 Catalog |
| 目录 | Catalog：按名字找到表，交出**当前**元数据位置 | 不是 snapshot 里的文件清单 |

[规范概述](https://iceberg.apache.org/spec/)：表状态活在 metadata 文件里；每次变更写一份新 metadata，再用原子交换替换指针。一次 snapshot 列出当时全部数据文件。文件清单先落在 manifest，再由一份 manifest list 汇总。规划扫描时先看 manifest 统计，避免 O(n) 按分区目录扫对象存储。读者不持锁；写者乐观提交，指针已被别人换走就按新版本重试。

[Terms](https://iceberg.apache.org/terms)：Catalog 的第一职责是跟踪一张表的当前 metadata。REST / Hive Metastore / JDBC / Nessie 都是实现，不是四种表格式。[REST Catalog](https://iceberg.apache.org/rest-catalog-spec/) 把实现细节收到服务端，客户端只讲一份 OpenAPI；官方把它类比 Hive 的 Thrift 协议，不是 HMS 本身。

分区是表配置（hidden partitioning）：读计划用数据谓词，不靠路径字符串。v1 起数据文件格式是 Parquet、Avro、ORC。行级删除在 v2 起用 delete file（位置删除或等值删除）；v3 起位置删除还可编码成 deletion vector。

### 格式版本

规范原文（2026-08-14 抓取）：**Versions 1, 2 and 3 of the Iceberg spec are complete and adopted by the community. Version 4 is under active development and has not been formally adopted.**

| 版 | 规范一句话 | 本页用法 |
|---|---|---|
| v1 | 用不可变文件管分析表 | 基线；升 v2 后 v1 文件仍合法 |
| v2 | 行级更新/删除；delete file | 位置删除 + 等值删除 |
| v3 | 扩展类型与能力 | variant / 几何、列默认值、row lineage、**binary deletion vectors**、表加密键 |
| v4 | 元数据结构重整 | **未正式采纳**；已写相对路径，便于搬表而不重写元数据树 |

版本号只在会破坏向前兼容（旧读者读不懂新表）时递增。引擎未实现的能力，表可以继续按旧版写。v4 正文里已出现相对路径规则，不等于 v4 已被社区采纳。

### Parquet 与 Arrow

[Parquet](https://parquet.apache.org/docs/) 是列存**文件**格式。官方写明规范在 [parquet-format](https://github.com/apache/parquet-format) 仓，不是 Iceberg spec 的一章。Iceberg 用它当数据文件容器之一。

[Arrow FAQ](https://arrow.apache.org/faq/)：Parquet 不是运行时内存格式；Arrow 才是内存列式，常与 Parquet 成对出现（盘上 Parquet，内存 Arrow）。Arrow 主文档版本钉在 B3-OLAP，本页不升条、不写 v25 / JS v21。

## 必须保留的冲突

- **v1–3 已采纳，v4 未采纳。** 真源是 Iceberg spec 文首 Format Versioning。v4 章节已出现在同一页，仍写「under active development and has not been formally adopted」。不要把「页上有 v4 节」写成「v4 已发布 / 已采纳」。
- Iceberg 规范已采纳 v3，ClickHouse 官方仍写只读 v1/v2。表函数页开篇是 read-only 接口，并写 currently supports reading v1 and v2；[support-matrix](https://clickhouse.com/docs/use-cases/data-lake/support-matrix) 的 Format versions 写 **v1 and v2 supported. V3 not supported**。两边都留，不并成「ClickHouse 已跟规范 v3」。
- 同一份 ClickHouse 矩阵另标 INSERT 自 26.2 为 Beta、建表/DELETE 为 Experimental。这与「read-only」开篇句并存，不静默覆盖 B3 那句「只读 v1/v2」。
- Parquet ≠ Iceberg ≠ Arrow。文件、表、内存三层。
- Iceberg ≠ Delta ≠ Hudi。跨格式元数据生成归 B6-Delta，本页不裁定谁是湖仓标准。
- Flink 文档树里的 Iceberg 连接器旧路径 404；用法在 Iceberg 项目页。见 [[10-收件箱/写回候选/第四批-B4-DataEng]]，不改本页枢纽。

## 例子

- 正例：对象存储上多份 Parquet，Iceberg snapshot 列出当前集合；读引擎向 Catalog 要 metadata 指针，按 snapshot 规划文件，不扫整个桶。
- 正例：删一行时 v2 追加 position delete file，或 v3 写 deletion vector，不必立刻重写整份数据文件。
- 正例：Spark 与 Trino 配同一 REST Catalog，看到同一张表的当前 metadata。
- 反例：能用 DuckDB 读一个 `.parquet`，就声称「已经上 Iceberg / 湖仓」。
- 反例：把规范已采纳的 v3（deletion vector、variant）当成 ClickHouse 现网能力。
- 反例：把工坊对象存储里的角色卡包当成湖表，或把卡变量 `stat_data` 当成 Iceberg snapshot。

## 边界与易混概念

- 不包括：集群搭建、凭证、攻击步骤、基准营销、把某引擎写成「本仓库已采用」。
- 不包括：Delta PROTOCOL、Hudi timeline、XTable / UniForm 正文（B6-Delta）。
- 不包括：DuckDB / Arrow / SQLite 正文（B3-OLAP）；Flink / dbt 编排（B4-DataEng）。
- 易混：湖仓（架构称呼）≠ Iceberg（表格式）≠ ClickHouse / DuckDB（引擎）≠ Parquet（文件）。
- 易混：Catalog 的「当前指针」≠ snapshot 的「文件集合」≠ Parquet footer 的「列块偏移」。
- 易混：v2 position delete file ≠ v3 deletion vector ≠ Delta `deletionVectors` ≠ Hudi MoR log。
- 易混：REST Catalog 协议 ≠ 某一个商业目录产品，也 ≠ 工坊同步 REST。
- 易混：湖表对象存储 ≠ 工坊发布包对象存储。
- 易混：Iceberg snapshot ≠ [[concepts/事件溯源与CQRS]] 的事件日志；分析表 ≠ [[concepts/Postgres与多租户]] 的仓/池/桥。
- 易混：REST Catalog 的 OpenAPI ≠ [[concepts/gRPC与Connect]] 的 RPC 合同。
- 易混：Parquet 列存文件 ≠ [[concepts/媒体格式与编解码]] 的图/音视频容器与编解码。
- 易混：Iceberg 乐观提交换指针 ≠ [[concepts/十二因素与CAP]] 的无状态进程或 CAP 分区取舍。
- 区分：先问文件、表、目录、引擎哪一层；再问规范版与引擎声明的版是否同一句。

## 映射到本仓库

工坊当前：Gateway 同进程、目录静态、包进对象存储、同步 REST。对象存储里是发布包，不是 Iceberg 表。酒馆卡 iframe 无集群、无湖表扫描面。不上 Iceberg runtime、不上 REST Catalog、不把卡包目录改成 snapshot。这是产品落点，不是对表格式的行业否定。

| 本仓物 | 实际在做 | 不是 |
|---|---|---|
| [[concepts/后端架构名词与工坊对照]] | 同步 REST + 包进对象存储 | 湖表、Catalog、snapshot |
| [[comparisons/工坊架构该上与不该上]] | 发布 / 审核要同步可见 | 多引擎共用一份分析表 |
| [[concepts/Postgres与多租户]] | 弱多租户靠所有权 | 用湖表分区冒充租户隔离 |
| [[concepts/OpenAPI与Arazzo]] | 公共 HTTP 以后要补合同 | REST Catalog 已落地 |
| [[concepts/C4与ADR]] | 说明方式入口 | 本页不是「已决定上湖仓」的 ADR |
| 发卡 recipe / 世界书 | 条目与组件装配 | Iceberg manifest |

以后若做「多引擎共用一份分析表」，再单独立项，不从本页自动推出。引擎若跑在集群里，工作负载合同见 [[concepts/Kubernetes工作负载]]；平台可观测见 [[concepts/可观测与OpenTelemetry]]、[[concepts/Prometheus与OpenMetrics]]。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]。**不要把本页写成工坊或发卡已采用 Iceberg / 湖仓。**

## 来源与证据

- 表格式与版本句：Iceberg spec 文首 Format Versioning；v1–v4 各节；Overview 的 metadata 原子交换。检索 2026-08-14。
- Catalog / REST：Terms「tracking a table's current metadata」；REST Catalog Spec「common API (using the OpenAPI spec)」。
- Parquet：项目文档指 parquet-format 仓为规范真身；File Format 页给 `PAR1` 布局。
- Arrow 对照：FAQ「Parquet is not a runtime in-memory format」。
- ClickHouse：表函数开篇 read-only + reading v1 and v2；矩阵 Format versions = v1/v2，V3 not supported。
- 账本：[[queries/第三批蒸馏目标]] B3-Ice / B3-CH / B3-OLAP；第二批已点名「湖仓/ClickHouse」。Delta / Hudi 分路仍在 [[10-收件箱/写回候选/第六批-B6-Delta]]；Flink 旧路径见 [[10-收件箱/写回候选/第四批-B4-DataEng]]。

已知冲突见上节，不静默覆盖。未跑 ClickHouse / Spark / 对象存储真机。v4 邮件列表单条投票（相对路径等）不等于整份 v4 已采纳。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[10-收件箱/写回候选/第六批-B6-Delta]]
- [[10-收件箱/写回候选/第四批-B4-DataEng]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/Postgres与多租户]]
- [[concepts/事件溯源与CQRS]]
- [[concepts/Redis与日志队列]]
- [[concepts/ORM三面]]
- [[concepts/向量检索入口]]
- [[concepts/十二因素与CAP]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/可观测与OpenTelemetry]]
- [[concepts/Prometheus与OpenMetrics]]
- [[concepts/gRPC与Connect]]
- [[concepts/媒体格式与编解码]]
- [[concepts/C4与ADR]]
- [[concepts/Saga三义与补偿]]
