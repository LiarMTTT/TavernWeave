---
title: 可观测与OpenTelemetry
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
  - https://opentelemetry.io/docs/
  - https://opentelemetry.io/docs/what-is-opentelemetry/
  - https://opentelemetry.io/docs/concepts/observability-primer/
  - https://opentelemetry.io/docs/concepts/signals/traces/
  - https://opentelemetry.io/docs/concepts/context-propagation/
  - https://opentelemetry.io/docs/specs/otel/overview/
  - https://opentelemetry.io/docs/languages/js/getting-started/browser/
  - https://opentelemetry.io/docs/specs/semconv/
  - https://www.w3.org/TR/trace-context/
  - https://www.w3.org/TR/baggage/
  - https://web.dev/articles/vitals
  - https://web.dev/articles/vitals-measurement-getting-started
  - https://web.dev/articles/vitals-field-measurement-best-practices
  - https://github.com/GoogleChrome/web-vitals
  - queries/第二批蒸馏目标.md
  - queries/前端视觉与灵感站点蒸馏目标.md
  - concepts/Web性能与INP.md
  - concepts/DORA五项与SLO.md
  - concepts/Prometheus与OpenMetrics.md
knowledge_class: factual
---

# 可观测与OpenTelemetry

本页不是已采用技术，也不是本仓库已落地的 RUM / 追踪。检索时间：2026-08-14。账本见 [[queries/第二批蒸馏目标]] **B2-Otel**（约 14 条）。文档真身是 [`opentelemetry.io`](https://opentelemetry.io/docs/)；采集时 [`otel.io`](https://otel.io/) **503**，不当入口。

B2-Otel-11 的 Web Vitals 与第一批架构 **A1** 同文，**不是新发现**。指标合同仍回 [[concepts/Web性能与INP]]；本页只谈它怎么被导出进遥测。

## 一句话定义

可观测是从系统**对外吐出的信号**理解内部状态，好问「为什么这样」、处理未知未知。OpenTelemetry（OTel）是 CNCF 的**厂商中立框架**：埋点、生成、收集、导出 traces / metrics / logs。它**不是**存储或可视化后端。

## 为什么重要

云与微服务让一次请求跨多进程。没有统一信号，只能翻各家日志、各家 APM 词。OTel 给一套 API / 语义约定 / 传输，数据仍归你；后端可以是 Jaeger、Prometheus 或商业产品。拉取、线格式与看板见 [[concepts/Prometheus与OpenMetrics]]，本页不重抄。入门课把可靠性写成「用户预期的事有没有发生」；SLI / SLO 只点到，专章在 [[concepts/DORA五项与SLO]]，本页不整页复述。

前端 RUM 不是第二套合同。场数据里的 LCP / INP / CLS 仍是 A1；OTel 浏览器埋点只是同一簇指标的导出面。实验室（Lighthouse）先抓回归，场数据才是合同。

## 权威入口

检索 2026-08-14。B2-Otel 满额 **14** 条（8–14 范围内）。OTLP、Collector、Trace Context Level 2、CrUX、Browser semconv 专页当时让位，正文只点到。不镜像采集行。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [遥测文档总口](https://opentelemetry.io/docs/) | CNCF 文档枢纽 |
| 2 | [何为开放遥测](https://opentelemetry.io/docs/what-is-opentelemetry/) | 框架不是后端 |
| 3 | [可观测入门课](https://opentelemetry.io/docs/concepts/observability-primer/) | 定义；log / span / trace |
| 4 | [追踪信号释义](https://opentelemetry.io/docs/concepts/signals/traces/) | span、属性、状态、kind |
| 5 | [上下文传播论](https://opentelemetry.io/docs/concepts/context-propagation/) | inject / extract；接到 `traceparent` |
| 6 | [规范总览正文](https://opentelemetry.io/docs/specs/otel/overview/) | 信号、约定、baggage、传播 |
| 7 | [浏览器埋点入](https://opentelemetry.io/docs/languages/js/getting-started/browser/) | 官方标 experimental |
| 8 | [语义约定总表](https://opentelemetry.io/docs/specs/semconv/) | 检索日 1.44.0；稳定度分区 |
| 9 | [追踪上下文标](https://www.w3.org/TR/trace-context/) | W3C REC：`traceparent` / `tracestate` |
| 10 | [行李头规范文](https://www.w3.org/TR/baggage/) | 与 Trace Context 独立；CR |
| 11 | [核心体验指标](https://web.dev/articles/vitals) | **= 第一批 A1**，不是新发现 |
| 12 | [现场测量入门](https://web.dev/articles/vitals-measurement-getting-started) | field ≠ lab |
| 13 | [现场上报实践](https://web.dev/articles/vitals-field-measurement-best-practices) | beacon / p75；示例非 OTel |
| 14 | [现场指标库文](https://github.com/GoogleChrome/web-vitals) | 测量库，非规范 |

刻意未收：OTLP / Collector 专页、Trace Context L2、CrUX、Browser semconv 专页、厂商 APM 报价、把 `otel.io` 当入口。

## 如何运作

### 框架四件，不是一个产品

[What is OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/) 列：规范、[OTLP](https://opentelemetry.io/docs/specs/otlp/) 协议、语义约定、语言 API / SDK、库生态、零代码埋点、[Collector](https://opentelemetry.io/docs/collector/)。存储与看板故意留给别的工具。历史是 OpenTracing 与 OpenCensus 合并。规范层检索日见 [Specification 1.60.0](https://opentelemetry.io/docs/specs/otel/)；版本常变，勿当教程钉死。

规范总览把客户端拆成 **API**（横切、埋点作者只许依赖它）、**SDK**（应用主人装）、**语义约定**、**Contrib**。埋点作者不得直接引用任何 SDK 包。

### 信号：trace / span / log

[入门课](https://opentelemetry.io/docs/concepts/observability-primer/)：应用「埋够了」是指排障不必再加探针。三件常用信号：

- **log**：带时间戳的消息，默认不绑某次请求。
- **span**：一次工作单元；有名、起止、属性、事件、链接、状态。
- **trace**：一次请求穿过多个服务的路径；由共享 `trace_id` 的一组 span 组成。根 span 无 `parent_id`。

[Traces](https://opentelemetry.io/docs/concepts/signals/traces/) 把 trace 看成带上下文的结构化日志集合，可来自不同进程。状态默认 `Unset`（无错完成）；`Error` 表示操作出错；`Ok` 是开发者**显式**盖章，多数情况不必写。Kind 提示后端怎么拼：`Client` / `Server` / `Internal` / `Producer` / `Consumer`。

文档站主信号是 traces / metrics / logs。规范总览举例把 tracing、metrics、**baggage** 写成三个独立信号；Profiles 已进 1.60.0 目录。两边都留，不要把「三支柱」写成规范唯一枚举。

十二因素把日志写成进程 `stdout` 事件流，见 [[concepts/十二因素与CAP]]；那是部署合同，不是 OTel 的 log 信号。

### 上下文传播

跨边界要对上同一条 trace，靠 **context**（至少 trace ID + span ID）和 **propagation**（序列化进载体）。默认传播器走 [W3C Trace Context](https://www.w3.org/TR/trace-context/) 的 `traceparent`：

```text
<version>-<trace-id>-<parent-id>-<trace-flags>
```

例：`00-a0892f3577b34da6a3ce929d0e0e4736-f03067aa0ba902b7-01`。发送侧 **inject**，接收侧 **extract**。无元数据字段的协议也能塞，但接收后必须剥掉再处理，否则行为未定义。默认传播器**因语言 SDK 而异**。RPC 元数据也是一种载体，协议面见 [[concepts/gRPC与Connect]]，本页不写接入步骤。

安全：不信任的入站头可伪造追踪图；出站到外部服务可能泄漏内部 ID 或 baggage。Baggage 是另一套键值，**独立于** Trace Context。

### 浏览器埋点（experimental）

[JS 浏览器起步](https://opentelemetry.io/docs/languages/js/getting-started/browser/) 官方标 **experimental**，大多未成规范。示例用 `WebTracerProvider`、`DocumentLoadInstrumentation`、可选 `ZoneContextManager`；服务端 HTML 可写 `<meta name="traceparent">` 把服务端采样决定交给页。常见包：`@opentelemetry/sdk-trace-web`、`instrumentation-document-load`、`auto-instrumentations-web`。语义约定 [Browser](https://opentelemetry.io/docs/specs/semconv/browser/) 检索日仍是 **Development**（B2 满额未单列该页）。

### Web Vitals 是导出面，回 A1

[Web Vitals](https://web.dev/articles/vitals) 已是第一批 **A1** 枢纽，也是 B2-Otel-11。LCP / INP / CLS 阈值、75 分位、场 vs 实验室，见 [[concepts/Web性能与INP]]。本页只记：

- [现场测量入门](https://web.dev/articles/vitals-measurement-getting-started) 把 RUM / field 与 lab 分开，并指向自建上报。CrUX 是抽样公开集，**不能替代**自有 RUM。
- [现场上报实践](https://web.dev/articles/vitals-field-measurement-best-practices) 讲 `sendBeacon`、`visibilitychange`、p75、禁均值。示例绑 GA / 自定义事件，**不是** OTel 导出。
- [web-vitals](https://github.com/GoogleChrome/web-vitals) 是 Chrome 测量库，对齐 CrUX / PSI 算法；GitHub 不是规范。

后出的 `@opentelemetry/browser-instrumentation` Web Vitals 仪用同一库吐结构化 log，仍 experimental，B2 满额未收。不要把它写成第二套指标合同。

## 必须保留的冲突

- **域名**：文档真身 `opentelemetry.io`。`otel.io` 采集时 503，不写进入口表。
- **与第一批重叠**：B2-Otel-11 = A1 = `web.dev/articles/vitals`。B2-Perf 也续写同一簇。记账本续写，不当新发现。
- **Trace Context 版本**：未标号 `/TR/trace-context/` 现指向 **v1 REC**（2021-11-23）。另有 Level 2 CR，B2 满额未收。勿把未标号 URL 当成 L2。
- **Baggage 成熟度**：2024-05-30 仍是 Candidate Recommendation Snapshot；浏览器 UA **不在**实现范围。隐私节写明可带用户可识别数据。
- **浏览器埋点**：官方 JS 起步标 experimental / mostly unspecified。Browser semconv 仍 Development。后出的 browser-instrumentation 也 experimental，未升本页入口。
- **信号枚举**：用户文档写 traces / metrics / logs；规范总览举例写 tracing / metrics / baggage；1.60.0 已有 Profiles。不静默收成「只有三支柱」。
- **规范版本**：总览与入口常变（检索日规范 1.60.0、semconv 1.44.0）。以当时页眉为准，不把版本钉成永远现行。
- **默认传播器因语言 SDK 而异**；不要写成「全语言默认都是 W3C」。
- **厂商 APM 术语与 OTel span / kind / status 不完全同名**。以概念页与规范为准。
- **现场上报实践的示例绑 GA**，不是 OTel exporter。web-vitals 是测量对齐，不是导出合同。
- **OTel ≠ Prometheus**。前者生成与导出；后者拉取、存储与 PromQL。兼容与改名冲突见 [[concepts/Prometheus与OpenMetrics]]，本页不裁定指标真身。
- 满额让位：OTLP、Collector、Trace Context L2、CrUX、Browser semconv 专页。需要时另开，不假装本页已蒸。
- 本页映射工坊与发卡的**信号边界**；**不是**「本仓已采用 OTel / 已接线 Collector」。

## 例子

- 正例：服务 A 调服务 B 时带 `traceparent`；B 抽出同一 `trace_id`，在 Jaeger 里看成一条瀑布。
- 正例：页加载 span 管「从开始到结束」；「可交互」用 span event，因为时间点有意义。
- 正例：自建 RUM 用 web-vitals 取 LCP / INP / CLS，再经 OTLP 导出；阈值仍读 A1，不另造合同。
- 反例：把 `verify-repo` 绿或工坊 `approved` 写成一条 trace 已落地。
- 反例：baggage 里塞用户凭证或 PII，再传到不信任下游。
- 反例：把 otel.io 短域、或厂商 APM 词，当成 OTel 规范真身。
- 反例：把本页写成「工坊必须上 OTel」，或把 CNCF 项目当成已采用证明。

## 边界与易混概念

- 不包括：本仓库已实施的 Collector / OTLP 网关 / 浏览器 RUM——**没有这回事**。
- 不包括：攻击步骤、凭证、把厂商报价页当规范。
- 易混：可观测 ≠ 监控仪表盘 ≠ 某家 APM 产品。OTel 管生成与导出，不管存和画。
- 易混：OTel ≠ Prometheus。存和刮见 [[concepts/Prometheus与OpenMetrics]]。
- 易混：log ≠ span ≠ trace。log 默认不绑请求；span 是有边界的工作单元；trace 是跨边界的因果链。
- 易混：`Unset` ≠ `Ok`。无错完成用默认 `Unset`；`Ok` 是显式终裁。
- 易混：Trace Context ≠ Baggage。前者传播追踪元数据；后者传播应用自定义键值，且规范写明可在无追踪时单独用。
- 易混：Web Vitals 合同 ≠ OTel 导出。同一簇指标；合同在 A1 / INP 页。
- 易混：CrUX ≠ 自有 RUM。公开抽样集不能代替自己的场数据。
- 易混：SLI / SLO ≠ OTel 信号。入门课只点到；专章在 DORA 页。
- 易混：十二因素 XI Logs（`stdout` 事件流）≠ OTel log 信号。前者是进程怎么吐日志，见 [[concepts/十二因素与CAP]]。
- 易混：功能开关评估点 ≠ span。运行时分支见 [[concepts/功能开关与OpenFeature]]。
- 区分：先问「在定义指标、在传播上下文，还是在选后端」；再问「这是规范、实验埋点，还是本仓产品门」。

## 映射到本仓库

映射放最后，不当过滤器。行业合同对独立站和嵌入 UI 都成立，**不是「卡不能谈可观测」**。本页不宣布已接线。**不要把本页写成工坊或发卡已采用 OpenTelemetry。**

| 本仓物 | 实际在验 | 不是 |
|---|---|---|
| `verify-repo` / `harness-smoke` | 静态链接与协议接通 | 分布式 trace、SLI |
| 工坊 Gateway 日志 | 同步 REST 生命周期 | Collector / OTLP 已落地 |
| 发卡真机门 | 导入、世界书、首条 | RUM 场数据合同 |
| 卡内 fail closed | 宿主契约失败则停 | span `Error` 或 SLO 燃烧 |
| [[concepts/C4与ADR]] | 说明方式入口 | 本页不是「已决定上 OTel」的 ADR |

iframe 与宿主是不同文档：框内交互可进顶层 Web Vitals 场数据，框内 `PerformanceObserver` / 页内 tracer 默认看不到跨框条目。这是指标与 API 的已知分叉，见 [[concepts/Web性能与INP]]、[[concepts/酒馆宿主与iframe分层]]，不是「嵌入就不用量」。跨框塞 `traceparent` 要自己设计载体，浏览器起步页的 meta 只覆盖**服务端渲染的那一页**。

卡内 fail closed 仍归 [[concepts/创意工坊与安全契约]]。工坊主路径仍是同步 REST，见 [[concepts/后端架构名词与工坊对照]] 与 [[comparisons/工坊架构该上与不该上]]。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表。

## 来源与证据

- 框架不是后端：[What is OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/)；存储与看板留给别的工具。
- log / span / trace：[可观测入门课](https://opentelemetry.io/docs/concepts/observability-primer/) 与 [Traces](https://opentelemetry.io/docs/concepts/signals/traces/)。
- 传播与 `traceparent`：[上下文传播](https://opentelemetry.io/docs/concepts/context-propagation/)；[W3C Trace Context](https://www.w3.org/TR/trace-context/) 未标号 URL 指向 v1 REC。
- Baggage 独立、CR、可带可识别数据：[W3C Baggage](https://www.w3.org/TR/baggage/)。
- 浏览器埋点 experimental：[JS 浏览器起步](https://opentelemetry.io/docs/languages/js/getting-started/browser/)。
- Web Vitals 合同与场/实验室：[[concepts/Web性能与INP]]；B2-Otel-11 = 第一批 A1。
- 现场上报示例绑 GA、非 OTel：[现场上报实践](https://web.dev/articles/vitals-field-measurement-best-practices)。
- 查询账本：[[queries/第二批蒸馏目标]] B2-Otel；重叠索引见 [[queries/前端视觉与灵感站点蒸馏目标]]。
- 分路原稿仍在 [[10-收件箱/写回候选/概念-可观测与OpenTelemetry]]。

已知冲突见上节，不静默覆盖。工坊或发卡真机未核任何 Collector / OTLP / 浏览器 RUM——本来就没有已落地的管线可验。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第二批蒸馏目标]]
- [[queries/前端视觉与灵感站点蒸馏目标]]
- [[10-收件箱/写回候选/概念-可观测与OpenTelemetry]]
- [[concepts/Prometheus与OpenMetrics]]
- [[concepts/Web性能与INP]]
- [[concepts/DORA五项与SLO]]
- [[concepts/十二因素与CAP]]
- [[concepts/功能开关与OpenFeature]]
- [[concepts/gRPC与Connect]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/C4与ADR]]
- [[concepts/创意工坊与安全契约]]
- [[concepts/酒馆宿主与iframe分层]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
