---
title: Prometheus与OpenMetrics
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
  - https://prometheus.io/docs/introduction/overview/
  - https://prometheus.io/docs/concepts/data_model/
  - https://prometheus.io/docs/concepts/metric_types/
  - https://prometheus.io/docs/instrumenting/exposition_formats/
  - https://prometheus.io/docs/specs/om/open_metrics_spec/
  - https://openmetrics.io/
  - https://prometheus.io/docs/prometheus/latest/querying/basics/
  - https://prometheus.io/docs/practices/naming/
  - https://grafana.com/docs/grafana/latest/fundamentals/
  - https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/
  - https://prometheus.io/docs/visualization/grafana/
  - https://opentelemetry.io/docs/specs/otel/compatibility/prometheus_and_openmetrics/
  - https://www.cncf.io/projects/openmetrics/
  - https://www.cncf.io/blog/2024/09/18/openmetrics-is-archived-merged-into-prometheus/
  - https://github.com/prometheus/OpenMetrics
  - https://datatracker.ietf.org/doc/draft-richih-opsawg-openmetrics/
  - queries/第五批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - concepts/可观测与OpenTelemetry.md
  - concepts/DORA五项与SLO.md
knowledge_class: factual
---

# Prometheus与OpenMetrics

本页不是已采用管线，也不是本仓库已落地的刮取或看板。检索时间：2026-08-14。账本枢纽是 [[queries/第五批蒸馏目标]] **B5-Prom**（13 条官方入口）。只谈公开规范与线格式，不写攻击步骤、凭证或默认口令。

[[concepts/可观测与OpenTelemetry]] 已写：OTel 不是存储或看板，后端可以是 Jaeger、Prometheus 或商业产品。本页不当新发现「可用 Prometheus」，只展开**拉取、线格式、PromQL、Grafana 仪表**。不重抄 traces / span / `traceparent` / baggage / 浏览器 RUM。SLI / SLO 回 [[concepts/DORA五项与SLO]]。

## 一句话定义

Prometheus 是按 HTTP **拉取**采集的时序指标系统：样本用指标名加标签标识，用 PromQL 查询。OpenMetrics 1.0 是收紧后的**线格式**，不是另一套存储。Grafana OSS 是查、画、告警、探索的可视化面，不是指标库。

## 为什么重要

云服务要把数值时序留下来排障，但不能假装 100% 按请求计费。没有统一 exposition，各进程各吐各的；没有查询语言，看板只能硬绑存储。Prometheus 合同是刮取 + 文本/OM/protobuf + PromQL。OTel 指标模型与这条线格式靠兼容专页翻译，不是同一合同。

## 权威入口

检索 2026-08-14。B5-Prom 满额 **13** 条。不镜像采集行。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Prometheus 总览](https://prometheus.io/docs/introduction/overview/) | 本页枢纽；拉取、单节点、不适合计费 |
| 2 | [数据模型](https://prometheus.io/docs/concepts/data_model/) | 名 + 标签；UTF-8 是 v3 SHOULD 例外 |
| 3 | [指标类型](https://prometheus.io/docs/concepts/metric_types/) | 库有 TYPE；服务器多半当 float |
| 4 | [Exposition 格式](https://prometheus.io/docs/instrumenting/exposition_formats/) | 0.0.4 / OM 文本 / Prom protobuf |
| 5 | [OpenMetrics 1.0](https://prometheus.io/docs/specs/om/open_metrics_spec/) | 现行规范挂 prometheus.io |
| 6 | [openmetrics.io](https://openmetrics.io/) | 本轮仍自称 sandbox；不写成现行治理真身 |
| 7 | [PromQL 入门](https://prometheus.io/docs/prometheus/latest/querying/basics/) | instant / range；不是 OTLP |
| 8 | [命名惯例](https://prometheus.io/docs/practices/naming/) | 单位进名字；反对只放元数据 |
| 9 | [Grafana 基础](https://grafana.com/docs/grafana/latest/fundamentals/) | 查、画、告警、探索 |
| 10 | [创建仪表](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/) | 面板 + 查询 |
| 11 | [Prometheus 对 Grafana](https://prometheus.io/docs/visualization/grafana/) | 内置数据源；不抄口令 |
| 12 | [OTel ↔ Prom/OM 兼容](https://opentelemetry.io/docs/specs/otel/compatibility/prometheus_and_openmetrics/) | 状态 Mixed |
| 13 | [CNCF OpenMetrics](https://www.cncf.io/projects/openmetrics/) | 2024-07-02 Archived；配套 [并入 Prometheus](https://www.cncf.io/blog/2024/09/18/openmetrics-is-archived-merged-into-prometheus/) |

刻意未收：厂商报价、Mimir 集群菜谱、默认登录口令、把 `openmetrics.io` 首页当现行治理真身。

## 如何运作

### 拉取，不是推送默认

[Overview](https://prometheus.io/docs/introduction/overview/)：SoundCloud 起源，2016 进 CNCF（K8s 之后第二个托管项目）。时序 + 标签；**HTTP scrape**；短命作业才走中间 Pushgateway；单节点自治、不依赖分布式存储。适合纯数值时序与排障；**不适合**要 100% 准确的按请求计费。图由 Grafana 或其他 API 消费者画。刮取目标若跑在集群里，工作负载对象见 [[concepts/Kubernetes工作负载]]，本页不升 Pod 合同。

Exposition 是 HTTP GET，语义面见 [[concepts/HTTP合同与问题详情]]；本页只管指标线格式，不谈错误体。

### 数据模型与类型

[数据模型](https://prometheus.io/docs/concepts/data_model/)：时序由指标名 + 标签唯一标识。名/标签 MAY 用任意 UTF-8；**SHOULD** 仍走旧字符集。UTF-8 名是 Prometheus **v3.0.0** 才加，生态未齐时守 SHOULD。`__` 前缀标签保留。空标签值 ≡ 无该标签。冒号留给 recording rules。

[指标类型](https://prometheus.io/docs/concepts/metric_types/)：库 API 四件 Counter / Gauge / Histogram / Summary。除 native histogram 外，**服务器目前不消费 TYPE**，都压成无类型 float 时序。Classic histogram 拆成 `_bucket{le=}` / `_sum` / `_count`；native 是复合样本。v3.0 起 `le` / `quantile` 按 OpenMetrics Canonical Numbers 规范化。

### 三套线格式

[Exposition](https://prometheus.io/docs/instrumenting/exposition_formats/)：Prom 2.0 起默认文本 `text/plain;version=0.0.4`。OpenMetrics 文本 `application/openmetrics-text;version=1.0.0`，以 `# EOF` 收尾；≥2.5.0 可刮，≥2.23.0 可联邦。Protobuf 在 2.0 曾标废弃，**3.0 复活**并积极维护。3.0 起缺/不可解析 `Content-Type` **刮取失败**。OM protobuf ≠ Prom protobuf。

[OpenMetrics 1.0](https://prometheus.io/docs/specs/om/open_metrics_spec/)：Published，2020-11。线格式，与传输无关；实现者 **MUST** 对文档化 URL 做 HTTP GET，**SHOULD** 为 `/metrics`。比 Prom 文本多 Info / StateSet / GaugeHistogram，以及 unit、exemplar、created timestamp。扫荡式改 0.0.4 或 1.0 视为越界。文内写「目的是带进 IETF」；并注 **2.0 在 Prometheus 工作组进行**。Exemplars 可挂 Trace ID，只记「线格式可选挂钩」，追踪合同仍回 [[concepts/可观测与OpenTelemetry]]。

### PromQL 与命名

[PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/)：instant / range；四类型 instant vector / range vector / scalar / string。`rate` 对 gauge float 不报错，对 gauge histogram 会警告。默认 lookback 5 分钟；目标不再吐某序列则标 stale。不是 OTLP。

[命名惯例](https://prometheus.io/docs/practices/naming/)：惯例不是强制。**SHOULD** 单位作后缀、计数加 `_total`、用基本单位。OTel 等约定**不把单位/类型写进名字**；Prometheus **强烈建议写进名字**，理由是 YAML 告警/录制规则要能裸读，以及避免 `process_cpu` 秒与毫秒撞名。高基数标签（用户 ID / 邮箱）明确警告。

### Grafana 是可视化面

[Fundamentals](https://grafana.com/docs/grafana/latest/fundamentals/)：Grafana OSS 查询、可视化、告警、探索指标/日志/追踪，不管存在哪。Loki / Tempo / Mimir / Pyroscope 是旁项目，本页不当新栈。

[创建仪表](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/)：仪表 = 面板集合；**每个面板至少一条查询**才能出图。`/dashboards/` 总口本轮直抓超时，定义句来自同站检索回填。

[Prometheus 对 Grafana](https://prometheus.io/docs/visualization/grafana/)：数据源自 Grafana 2.5.0（2015-10-28）内置。面板里写 PromQL；7.2+ 建议 `$__rate_interval`。不抄默认登录口令。

十二因素把日志写成进程 `stdout` 事件流，见 [[concepts/十二因素与CAP]]；那是部署合同，不是 Prom 时序，也不是 Grafana 数据源。

## 必须保留的冲突

- **OpenMetrics 归属**：[`openmetrics.io`](https://openmetrics.io/) 本轮仍写「CNCF **sandbox** project」、已发布、文本+protobuf。CNCF 项目页写 2018-08-10 入驻、**2024-07-02 Archived**；2024-09-18 社区文写资产迁入 Prometheus，IETF RFC **未成**，仓库现 [prometheus/OpenMetrics](https://github.com/prometheus/OpenMetrics)。1.0 正文仍写「带进 IETF」；[draft-richih-opsawg-openmetrics-00](https://datatracker.ietf.org/doc/draft-richih-opsawg-openmetrics/) 2021-05-29 **Expired**，不是 RFC。2.0 在 Prometheus 治理下进行。两边（独立标准叙事 vs 已收回 Prom 格式）都留；不把该首页写成现行治理真身。
- **OTel 指标 vs Prometheus exposition**：OTel 主张能从 Prom/StatsD **无损译入**；译出到 Prom 线格式却要改名、补后缀（例：`hvac.on` + 单位 `s` → `hvac_on_seconds_total`）。反向：Prom 名 **MUST** 作 OTLP Name 且 **SHOULD NOT** 改。兼容专页状态 Mixed。Prometheus 命名页公开反对「单位只放元数据」。两边都留，本页不裁定谁是指标真身。
- **线格式三套**：0.0.4 文本 / OM 1.0 文本 / Prom protobuf。Protobuf 废弃后又在 3.0 复活。
- **TYPE 是否生效**：库与线格式有类型；服务器除 native histogram 外仍当无类型 float。
- **Grafana 仪表专页**：fundamentals 与 create-dashboard 核到；`/dashboards/` 与 datasource 专页本轮超时，不假装整节已镜像。
- 本页映射的是拉取与线格式；**不是**「工坊必须上 Prometheus / Grafana」。

## 例子

- 正例：进程在 `/metrics` 吐 0.0.4 或 OM 文本；Prometheus 按 HTTP GET 刮取；Grafana 面板写 PromQL。
- 正例：counter 名带 `_total` 与单位后缀，如 `http_requests_total`；告警规则能裸读。
- 正例：短命批处理经 Pushgateway，长跑服务仍走拉取。
- 反例：把 OTel 指标名 `hvac.on` 原样当 Prom 名，或把译出改名当成「同一套指标」。
- 反例：把 Grafana、Mimir 或工坊日志写成 Prometheus 已落地。
- 反例：把 `openmetrics.io` 首页写成现行 CNCF sandbox 真身，或把 Expired IETF draft 写成 RFC。

## 边界与易混概念

- 不包括：本仓库已实施的刮取、Pushgateway、Grafana——**没有这回事**。
- 不包括：攻击步骤、凭证、默认口令、厂商报价、Mimir 集群搭建。
- 不包括：OTel traces / 传播 / RUM（回 [[concepts/可观测与OpenTelemetry]]）；SLO 燃烧（回 [[concepts/DORA五项与SLO]]）。
- 易混：Prometheus ≠ OTel。前者是拉取+存储+PromQL；后者是生成/导出框架。
- 易混：OpenMetrics ≠ 独立现行项目。1.0 是线格式；归属说法冲突，见上节。
- 易混：Grafana ≠ 指标库。它查别人的数据。
- 易混：库 TYPE ≠ 服务器类型。除 native histogram 外，服务器当无类型 float。
- 易混：OM protobuf ≠ Prom protobuf。兼容专页写 Prom 尚未支持 OM protobuf。
- 易混：十二因素 XI Logs（`stdout` 事件流）≠ Prom 时序。前者见 [[concepts/十二因素与CAP]]。
- 易混：Gateway 同步 REST 日志 ≠ `/metrics` exposition。
- 区分：先问「在刮、在查、在画，还是在跨模型翻译」；再问「这是规范、过期草案，还是本仓产品门」。

## 映射到本仓库

映射放最后，不当过滤器。行业合同对独立站和嵌入 UI 都成立。本页不宣布已接线。**不要把本页写成工坊或发卡已采用 Prometheus / OpenMetrics / Grafana。**

| 本仓物 | 实际在验 | 不是 |
|---|---|---|
| `verify-repo` / `harness-smoke` | 静态链接与协议接通 | Prometheus 刮取、PromQL |
| 工坊 Gateway 日志 | 同步 REST 生命周期 | `/metrics` exposition 已落地 |
| 发卡真机门 | 导入、世界书、首条 | Grafana 仪表或 SLO 燃烧 |
| 卡内 fail closed | 宿主契约失败则停 | Grafana 告警或错误预算 |
| [[concepts/C4与ADR]] | 说明方式入口 | 本页不是「已决定上 Prometheus」的 ADR |
| 集群工作负载 | Pod / Deployment 对象 | 已挂 scrape；见 [[concepts/Kubernetes工作负载]] |

第五批把 CSP、Push、Prom 同组为「站点防御与观测」：浏览器头 / 推送五层 / 拉取线格式。浏览器防御头见 [[concepts/CSP与Trusted Types]]，与本页线格式不是同一份。卡内 fail closed 仍归 [[concepts/创意工坊与安全契约]]。工坊主路径仍是同步 REST，见 [[concepts/后端架构名词与工坊对照]] 与 [[comparisons/工坊架构该上与不该上]]。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表。

## 来源与证据

- 拉取、单节点、不适合计费：[Overview](https://prometheus.io/docs/introduction/overview/)。
- 名 + 标签、UTF-8 是 v3 SHOULD：[数据模型](https://prometheus.io/docs/concepts/data_model/)。
- 库 TYPE vs 服务器 float：[指标类型](https://prometheus.io/docs/concepts/metric_types/)。
- 三套线格式与 3.0 `Content-Type` 失败：[Exposition](https://prometheus.io/docs/instrumenting/exposition_formats/)。
- OpenMetrics 1.0 现行正文挂 prometheus.io：[OM 规范](https://prometheus.io/docs/specs/om/open_metrics_spec/)。
- PromQL instant / range，不是 OTLP：[查询入门](https://prometheus.io/docs/prometheus/latest/querying/basics/)。
- 单位进名字、反对只放元数据：[命名惯例](https://prometheus.io/docs/practices/naming/)。
- Grafana 是可视化面：Fundamentals、create-dashboard；Prometheus 内置数据源页。`/dashboards/` 本轮超时。
- OTel ↔ Prom 译名与 Mixed：[兼容专页](https://opentelemetry.io/docs/specs/otel/compatibility/prometheus_and_openmetrics/)。
- OpenMetrics 归档并入 Prometheus：CNCF 项目页 2024-07-02 Archived；[2024-09-18 社区文](https://www.cncf.io/blog/2024/09/18/openmetrics-is-archived-merged-into-prometheus/)。`openmetrics.io` 本轮仍写 sandbox。
- IETF 稿过期： [draft-richih-opsawg-openmetrics-00](https://datatracker.ietf.org/doc/draft-richih-opsawg-openmetrics/) 2021-05-29 Expired，不是 RFC。
- 查询账本：[[queries/第五批蒸馏目标]] B5-Prom；与 B2-Otel 的后端选项重叠见 [[queries/第二批蒸馏目标]]。
- 分路原稿仍在 [[10-收件箱/写回候选/第五批-B5-Prom]]。

已知冲突见上节，不静默覆盖。工坊或发卡真机未核任何刮取、Pushgateway 或 Grafana——本来就没有已落地的管线可验。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第五批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-Prom]]
- [[concepts/可观测与OpenTelemetry]]
- [[concepts/DORA五项与SLO]]
- [[concepts/Web性能与INP]]
- [[concepts/十二因素与CAP]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/CSP与Trusted Types]]
- [[concepts/gRPC与Connect]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/C4与ADR]]
- [[concepts/创意工坊与安全契约]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
