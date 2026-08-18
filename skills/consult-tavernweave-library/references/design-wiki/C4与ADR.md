---
title: C4与ADR
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - research
  - tooling
sources:
  - https://c4model.com/
  - https://c4model.com/introduction
  - https://c4model.com/abstractions
  - https://c4model.com/abstractions/container
  - https://c4model.com/abstractions/component
  - https://c4model.com/diagrams
  - https://c4model.com/diagrams/code
  - https://c4model.com/faq
  - https://adr.github.io/
  - https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - https://adr.github.io/madr/
  - https://arc42.org/overview/
  - https://docs.arc42.org/home/
  - https://docs.arc42.org/section-9/
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# C4与ADR

本页不是已采用的画图规范，也不是已落地的决策日志。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]] B3-C4。只收官方入口，不收生成器站，不收盗版书。

## 一句话定义

C4 是一套**架构图**（代码地图的缩放层）；arc42 是架构说明的**十二节骨架**；ADR 是**单条**架构决策及其理由。三者可嵌套，不是同一层，也不能互相替换。

## 为什么重要

团队常把「画张 C4」「补一份 arc42」「写个 ADR」当成三选一。官方各自回答不同问题：图怎么分层、整本说明放哪些节、这一条决定为什么留下。混层会导致一张图里塞流程与部署、十二节被当成四张图、或把整本模板误写成一条决策。本页只收官方入口。

## 权威入口

上表 **14** 条。B3-C4 的采集行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [C4 官网](https://c4model.com/) | 发明人 Simon Brown 站；图模型真源 |
| 2 | [Introduction](https://c4model.com/introduction) | 「代码的地图」；四层缩放 |
| 3 | [Abstractions](https://c4model.com/abstractions) | 人 / 系统 / 容器 / 组件 / 代码 |
| 4 | [Container](https://c4model.com/abstractions/container) | Not Docker；运行时边界 |
| 5 | [Component](https://c4model.com/abstractions/component) | 接口后的功能组；不可单独部署 |
| 6 | [Diagrams](https://c4model.com/diagrams) | 四张静态 + 三张配套；多数团队前两张即可 |
| 7 | [Code 图](https://c4model.com/diagrams/code) | 可选；不推荐长期手维护 |
| 8 | [C4 FAQ](https://c4model.com/faq) | 与 UML / arc42 关系；不暗示过程 |
| 9 | [ADR 组织入口](https://adr.github.io/) | AD / ASR / ADR / 决策日志词汇 |
| 10 | [Nygard 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) | 一条一文件；推翻保留 |
| 11 | [MADR](https://adr.github.io/madr/) | Markdown 模板；3.0 / 4.0 改名史 |
| 12 | [arc42 十二节总览](https://arc42.org/overview/) | 骨架入口 |
| 13 | [arc42 文档首页](https://docs.arc42.org/home/) | 十二节分页与提示 |
| 14 | [arc42 第 9 节](https://docs.arc42.org/section-9/) | 决策可写成 ADR，须回指第 4 节 |

## 如何运作

### 三者不是同一层

| 层 | 是什么 | 官方入口 | 不是什么 |
|---|---|---|---|
| C4 | 静态结构图的缩放：上下文 → 容器 → 组件 → 代码；另有景观 / 动态 / 部署三张配套图 | [c4model.com](https://c4model.com/) | 不是文档目录，也不是决策日志 |
| arc42 | 十二节可裁剪骨架：该写什么、按什么顺序写 | [arc42 overview](https://arc42.org/overview/) | 不是图符号，也不等于一条 ADR |
| ADR | 一条架构显著决策 + 理由；多条构成决策日志 | [adr.github.io](https://adr.github.io/) | 不是十二节全文，也不是 C4 的第四层 |

[C4 FAQ](https://c4model.com/faq) 写明可以和 arc42 **组合**，并给了节到图的对应：第 3 节 Context and Scope → 系统上下文图；积木视图 L1 / L2 / L3 → 容器 / 组件 / 代码图。组合不等于同一层：arc42 还有目标、约束、策略、运行、部署、横切、质量、风险、词汇等节，C4 并不覆盖。

### C4：图，不是过程

[Introduction](https://c4model.com/introduction) 把 C4 说成「代码的地图」，按缩放讲不同故事。[Diagrams](https://c4model.com/diagrams) 点名四张静态图：系统上下文、容器、组件、代码。多数团队只需前两张。另有三张配套：系统景观、动态、部署。C4 只管静态结构；流程、状态机、领域模型、数据模型要另补 UML / BPMN / ER 等。状态机合同见 [[concepts/状态机与SCXML]]，不是 C4 的第四层。

[Abstractions](https://c4model.com/abstractions)：软件系统由一个或多个容器（应用与数据存储）组成，容器里是组件，组件由代码元素实现；人使用这些系统。

[Container](https://c4model.com/abstractions/container) 标题即 **Not Docker**：容器是运行时边界（Web 应用、桌面/移动端、无服务器函数、数据库、对象存储、文件系统等）。JAR / DLL 通常不是容器。以服务端渲染 HTML 为主的站点多半是**一个**容器；若大量前端脚本自成 SPA，则是**两个**容器（两个进程空间）。超媒体取向见 [[concepts/HTMX与超媒体]]，那是页面形态，不是 C4 符号。S3 / RDS 这类托管存储，因桶和 schema 仍由你负责，按容器画，不画成外部系统。

[Component](https://c4model.com/abstractions/component)：一组藏在明确接口后的相关功能。组件**不是**独立部署单元；可部署的是容器。包名、JAR、文件夹通常也不是组件。这与 UI 自定义元素、WASI 组件模型不是同一词，见 [[concepts/Lit与自定义元素]]、[[concepts/WASI与组件模型]]。

[Code 图](https://c4model.com/diagrams/code) 官方标 **不推荐**作长期文档：IDE 可按需生成；只给最重要或最复杂的组件。FAQ：第四张图 2010 年叫 classes，2015–2016 改名 code。C4 **不**暗示设计流程或岗位分工（不是分析师画上下文、架构师画容器、开发只画代码）。

### arc42：十二节骨架

[overview](https://arc42.org/overview/) 与 [docs 首页](https://docs.arc42.org/home/) 十二节一致：1 引言与目标；2 约束；3 上下文与范围；4 方案策略；5 积木视图（通常最厚）；6 运行时视图；7 部署视图；8 横切概念；9 架构决策；10 质量需求；11 风险与技术债；12 词汇表。可裁剪；更轻可用一页 canvas。模板自 2005 年起，工具无关。

### ADR：一条决策

[adr.github.io](https://adr.github.io/)：架构决策（AD）是针对架构显著需求的有理由选择；ADR 捕捉**一条** AD 及其理由；集合才是决策日志。组织目标是统一词汇与工具指针，不是单一强制模板。背景指向 Zdun 等的可持续决策与 Y 句式，也指向 2011 年 Nygard 博文。

[Nygard 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)：一条 ADR 对应一条显著决策；放在仓内 `doc/arch/adr-NNN.md`；序号单调不复用；推翻则旧条标 superseded，不删。结构：Title / Context / Decision / Status / Consequences。全文一两页。Context 价值中立；Decision 用「We will …」；后果正负中性都写。

[arc42 第 9 节](https://docs.arc42.org/section-9/) 把 ADR 当作该节的一种形式，也可改用表或分节；重要决策若已在第 4 节写过，此处引用，避免重复。它推荐 Nygard 结构，并指向 adr GitHub 上的其他模板。

[MADR](https://adr.github.io/madr/) 是 Markdown 模板，不是第三套「架构方法」。现行站头写 Markdown Architectural Decision Records。3.0.0-beta（2022-05-17）曾改名为 Markdown **Any** Decision Records；4.0.0（2024-09-17）为强调架构工作，又拼回 Architectural，并写仍可用于任何决策。3.0.0 把正负后果并回 Consequences。完整模板另有 Decision Drivers、Considered Options、Confirmation 等可选节。双许可 MIT 或 CC0。

HTTP 操作合同、错误体与 schema 是另一层，见 [[concepts/HTTP合同与问题详情]]、[[concepts/OpenAPI与Arazzo]]；不要把 OpenAPI 文件写成一条 ADR，也不要把 ADR 写成接口清单。

## 必须保留的冲突

- C4 / arc42 / ADR 可组合，但不是同一层。FAQ 的节映射是嵌入，不是三选一。
- C4 container：官方写 Not Docker，同页又写有时与 Docker 等基础设施容器有对应。两边留。
- C4 vs UML：已用 UML 且有效则继续；C4 是简化，也可当走向 UML 的台阶。FAQ 把「倒退」与「够用」并列。
- 第四张图：旧名 classes，现行 code。
- ADR 模板：Nygard 四段、Y 句式、MADR 全模板并存；arc42 第 9 节还允许表或分节。
- MADR 3.0.0-beta 改称 Any Decision Records；4.0.0 站头改回 Architectural，并写仍可记任何决策。
- 「软件系统」是 C4 最难定义的抽象；组织口语里的应用 / 产品 / 服务不要直接等同。
- 本页映射工坊与发卡的**说明方式**；**不是**「本仓库已采用 C4 / arc42 / ADR」。

## 例子

- 正例：先画系统上下文和容器图，说明酒馆宿主、卡内 iframe、工坊 Gateway 各是哪个软件系统 / 容器，见 [[concepts/酒馆宿主与iframe分层]]；一条 ADR 只记「卡 UI 是否另开 iframe」。
- 正例：若要整本说明，用 arc42 当目录：第 3 / 5 节嵌 C4 图，第 9 节链 ADR 文件。
- 反例：把 C4、arc42、ADR 写成三选一的「架构文档格式」。
- 反例：一张图里混系统、Docker 服务、React 组件和类。
- 反例：把 `AGENTS.md` 或本页写成「本仓库已采用 ADR / C4」。

## 边界与易混概念

- 不包括：Structurizr / IcePanel / C4-PlantUML 等生成器或建模站；不把它们当 C4 真源。
- 不包括：Simon Brown 或 arc42 纸书的盗版 PDF；付费课不进本页。
- 不包括：本仓库已实施的 C4 图集、arc42 手册或 ADR 目录——**没有这回事**。
- 易混：C4 container ≠ Docker 容器。官方否认等同，又承认有时一一对应。两边按原文留。
- 易混：C4 component ≠ UI 组件 / npm 包 / JAR，也 ≠ WASI 组件。
- 易混：C4 软件系统 ≠ 产品域、限界上下文、能力、部落或小队。
- 易混：C4 四张图 ≠ arc42 十二节。FAQ 的节映射是嵌入关系。
- 易混：ADR ≠ 会议纪要 ≠ 整本架构说明。Nygard：一条记录一个决定。
- 易混：Nygard 四段 ≠ Y 句式 ≠ MADR 全模板。adr.github.io 指向多模板并存。
- 易混：MADR 3.x「Any」≠ 4.0 站头的「Architectural」。改名史两边留。
- 易混：C4 第四层 classes（2010）≠ code（2015 后）。现行用 code。
- 易混：事件溯源 / CQRS 是运行时数据与读写模型，见 [[concepts/事件溯源与CQRS]]；不是 C4 图，也不是一条 ADR。
- 区分：先问「要的是图、目录，还是这一条决定」；再问「container 是运行时边界还是镜像」；最后问「这是行业入口还是本仓已采用」。

## 映射到本仓库

本仓用 Wiki 页、对照表和治理文件回答「名词怎么用、产物能不能出」。那不是 C4 图，也不是 ADR 日志。**不要把本页写成工坊或发卡已采用 C4 / arc42 / ADR。**

| 本仓物 | 实际在做 | 不是 |
|---|---|---|
| [[concepts/后端架构名词与工坊对照]] | 后端名词与工坊现状对照 | C4 容器图 |
| [[comparisons/行业架构方案何时用]] | 行业方案何时上 | arc42 十二节正文 |
| [[comparisons/工坊架构该上与不该上]] | 工坊产品取舍 | 一条 ADR |
| `AGENTS.md` / `SCHEMA.md` | 治理与写回门 | 决策日志；推翻也不按 superseded 编号留旧条 |
| 发卡发布 / 打包回封 | 真机导入与嵌入对账 | 部署图或 arc42 第 7 节 |

对照句：星月 / 交错 / 怪谈的稳定验收是产品门，不是 C4 代码图。工坊同步 REST 与审核状态机是已用后端形态，不是 arc42 实例。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表。

## 来源与证据

权威入口以上表 14 条与 [[queries/第三批蒸馏目标]] B3-C4 为准。不收生成器站，不收盗版书。

1. [C4 官网](https://c4model.com/) — 发明人 Simon Brown 站；图模型真源。
2. [Introduction](https://c4model.com/introduction) — 「代码的地图」；四层缩放。
3. [Abstractions](https://c4model.com/abstractions) — 人 / 系统 / 容器 / 组件 / 代码。
4. [Container](https://c4model.com/abstractions/container) — Not Docker；运行时边界。
5. [Component](https://c4model.com/abstractions/component) — 接口后的功能组；不可单独部署。
6. [Diagrams](https://c4model.com/diagrams) — 四张静态 + 三张配套；多数团队前两张即可。
7. [Code 图](https://c4model.com/diagrams/code) — 可选；不推荐长期手维护。
8. [C4 FAQ](https://c4model.com/faq) — 与 UML / arc42 关系；不暗示过程。
9. [ADR 组织入口](https://adr.github.io/) — AD / ASR / ADR / 决策日志词汇。
10. [Nygard 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — 一条一文件；推翻保留。
11. [MADR](https://adr.github.io/madr/) — Markdown 模板；3.0 / 4.0 改名史。
12. [arc42 十二节总览](https://arc42.org/overview/) — 骨架入口。
13. [arc42 文档首页](https://docs.arc42.org/home/) — 十二节分页与提示。
14. [arc42 第 9 节](https://docs.arc42.org/section-9/) — 决策可写成 ADR，须回指第 4 节。

已知冲突见上节，不静默覆盖。未跑工坊或发卡的 C4/ADR 真机——本来就没有已落地的图集或决策日志可验。

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
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/状态机与SCXML]]
- [[concepts/HTMX与超媒体]]
- [[concepts/事件溯源与CQRS]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/Lit与自定义元素]]
- [[concepts/WASI与组件模型]]
