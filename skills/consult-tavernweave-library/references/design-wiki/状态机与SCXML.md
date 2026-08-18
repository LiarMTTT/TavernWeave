---
title: 状态机与SCXML
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
  - https://stately.ai/docs/state-machines-and-statecharts
  - https://stately.ai/docs/xstate
  - https://stately.ai/docs/actor-model
  - https://stately.ai/docs/migration
  - https://xstate.js.org/docs/guides/machines.html
  - https://xstate.js.org/docs/guides/scxml.html
  - https://www.w3.org/TR/scxml/
  - https://www.w3.org/2015/08/scxml-errata.html
  - https://www.sciencedirect.com/science/article/pii/0167642387900359
  - https://statecharts.dev/
  - https://github.com/matthewp/robot
  - https://gitlab.com/scion-scxml/scion
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
knowledge_class: factual
---

# 状态机与SCXML

本页不是已采用技术。检索日 2026-08-14。账本枢纽是 [[queries/第二批蒸馏目标]] 的 **B2-SM**。

## 一句话定义

有限状态机（FSM）用有限个互斥状态和确定性迁移描述「现在在哪、事件来了去哪」。状态图（statechart）在 FSM 上加层次、并发和通信。SCXML 是把状态图写成可执行 XML 的 W3C 合同。XState / robot3 / SCION 是实现，不是规范本身。

## 为什么重要

布尔旗一多就会出现「加载中又成功又失败」。状态机把合法组合写死，非法组合进不去。状态图再解决「状态爆炸」：子状态、并行区和消息，不必把每一种组合摊成一张平面表。行业用它做控件行为、向导、会话和长流程编排。本仓库的审核枚举和写回流程也是状态机，但那是产品/治理 FSM，不是 XState，更不是 SCXML 解释器。

## 权威入口

B2-SM 枢纽是 Stately 的状态机/状态图导论。下列 12 条是入口，不是教程，也不镜像全文。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [State machines and statecharts](https://stately.ai/docs/state-machines-and-statecharts) | B2-SM 枢纽。FSM 一次一态；状态图加层次 / 并发 / 通信。Studio 把两者都叫 state machines |
| 2 | [XState v5](https://stately.ai/docs/xstate) | 现行库文档。事件驱动 + 状态图 + 演员模型；v4 文档另指 `xstate.js.org/docs` |
| 3 | [Actor model](https://stately.ai/docs/actor-model) | 跑起来的机器是演员：封装状态、邮箱串行、只靠事件通信、可 spawn/invoke |
| 4 | [v4 → v5 迁移](https://stately.ai/docs/migration) | `Machine()` → `createMachine()`；`interpret()` → `createActor()`；v5 要 TypeScript ≥ 5.0 |
| 5 | [v4 Machines](https://xstate.js.org/docs/guides/machines.html) | 页眉写明 **v4 不再维护**。第二参仍是 actions/guards/services，不是 v5 的 `setup()` |
| 6 | [v4 SCXML 对照](https://xstate.js.org/docs/guides/scxml.html) | v4 自称兼容 SCXML；`on` ≈ `<transition>`，`_event` 是 SCXML 事件形 |
| 7 | [SCXML 1.0 Rec](https://www.w3.org/TR/scxml/) | 2015-09-01 Recommendation。CCXML + Harel；解释算法在 Appendix D |
| 8 | [SCXML errata](https://www.w3.org/2015/08/scxml-errata.html) | 2016-12-28 止 7 条编辑勘误；无 pending。Rec 未出 1.1 |
| 9 | [Harel 1987](https://www.sciencedirect.com/science/article/pii/0167642387900359) | 状态图原文：层次 + 正交并发 + 广播。doi:10.1016/0167-6423(87)90035-9 |
| 10 | [statecharts.dev](https://statecharts.dev/) | 概念站。SCXML 定语义边角；库对规范是「不同程度支持」，不是等价物 |
| 11 | [robot3 / Robot](https://github.com/matthewp/robot) | 小函数式不可变 FSM，BSD-2-Clause。活文档声明在 [thisrobot.life](https://thisrobot.life/)；**旧 guides 路径 404**，见冲突 |
| 12 | [SCION GitLab](https://gitlab.com/scion-scxml/scion) | SCXML 编译/运行单仓。GitHub `jbeard4/SCION` 只是迁址 stub |

## 如何运作

先分四层，避免把论文、XML、JS 库和一条审核枚举写成同一个东西：

| 层 | 合同 | 典型入口 | 不负责 |
|---|---|---|---|
| 形式 | 状态、事件、确定性迁移；状态图再加层次/并发/通信 | Harel 1987；Stately 导论 | 某种文件格式、某个 npm 包 |
| 规范 | XML 文档 + Appendix D 解释算法 | SCXML Rec / errata | 必须用 XState 或必须用 XML 才能做 FSM |
| 实现 | 把机器跑成演员或 service | XState v5、robot3、SCION | 取代 HTTP 合同或 MVU 补丁协议 |
| 产品枚举 | 少数命名状态、人工推进 | 工坊审核、写回状态机 | 层次、并行区、SCXML 解释器 |

FSM：启动进入唯一顶层初始态；任一时刻只在一个原子态；同一「状态 × 事件」总指向同一目标。状态图用父态装子态、用并行区同时活两块、用事件/演员通信，避免把「走路×摇尾」摊成四格。

XState v5：`createMachine` / `setup().createMachine` 写逻辑；`createActor(machine).start()` 才是活实例。演员只改自己的状态，靠 `send` / 快照订阅往来。`@xstate/store` 是另一条小事件 store，官方说「不必上状态图时从这儿起」，不要和 `xstate` 并成一个包。

robot3：`state` + `transition` + `interpret`。嵌套靠 `invoke` 另一台机器，不是 SCXML 复合态。它仍用 `interpret`；不要把 XState v5 的 `createActor` 抄过去。

SCION：按 SCXML 跑。`scion-core` 2.x 跟 Appendix D；1.x 旧语义已弃，要兼容走 `scion-core-legacy`。这是实现声明，不是 Rec 改版。

## 必须保留的冲突

- **robot3 旧 guides 404。** 当日 WebFetch：`thisrobot.life/guides`、`/guides.html`、`/api.html`、`/api/createMachine.html`、`/integrations.html` 均 404。README 仍链 integrations。搜索索引还能看到 `/guides.html` 旧目录，以抓取 404 为准，不把旧 guides 当现行文档。活入口是 GitHub + 首页声明。
- **v5 / v4 文档不要并。** 现行在 `stately.ai/docs`。`xstate.js.org/docs/guides/*` 是未维护 v4。根路径 `xstate.js.org/docs` 现场像 v5 README，不要和 guides 当成同一份。
- **Studio 用词。** 官方把 FSM 和状态图都叫 state machines；本页叙述仍分开。
- **「兼容 SCXML」≠ 就是 SCXML 解释器。** v4 有对照页；v5 主文档不把 `scxmlToMachine` 当主路径。转换若出现，在工具链，不升成 Rec 实现声明。
- **SCION 址。** GitHub stub → GitLab。README 仍指 `scion.scxml.io`，当日抓取超时。1.x 语义 ≠ Appendix D。
- **勘误未改 Rec 版本。** 七条编辑勘误，没有 SCXML 1.1。
- **VS Code 扩展。** v5 文档写明尚未完全支持 v5。
- **映射 ≠ 采用。** 审核枚举、写回流程、Zag 控件机都不是「已采用 XState/SCXML」。

## 例子

- 正例：播放器 `stopped / playing / paused`，`PLAY` / `PAUSE` / `STOP` 写死；全屏是父态，里面再分播放/暂停。
- 正例：狗「散步」父态里并行「走/跑」和「摇尾/不摇」——Stately 导论的并行区。
- 正例：工坊包 `pending → approved / rejected / withdrawn`。合法边三条，不必上 XState。
- 反例：`isLoading && isSuccess && isError` 三旗同时为真。
- 反例：把 Zag 控件机、Temporal 工作流、SCXML 文档写成「都是 XState」。
- 反例：因本页出现 XState 就写进发卡 recipe。

## 边界与易混概念

- 不包括：接入步骤、Studio 付费面、把某库写成「本仓库已采用」。
- FSM ≠ 状态图 ≠ SCXML ≠ XState。一层是模型，一层是 XML 合同，一层是 JS 实现。
- 演员模型 ≠ 状态机。XState 明文：跑起来的机器才是演员；演员也可以不是状态机。
- robot3 ≠ 迷你 XState。前者是扁平/可组合 FSM；后者按状态图 + 演员编排。
- 审核/写回「状态机」≠ SCXML。命名状态加合法边，不是解释器。
- Temporal / BPMN（[[queries/第三批蒸馏目标]] B3-WF）是工作流引擎，不是客户端状态图。Saga 三义见 [[concepts/Saga三义与补偿]]。
- Zag 机器是无头控件行为，见 [[concepts/无头组件与根节点]]；映射 iframe 根，不是本页枢纽。
- HTMX「少前端状态机」是超媒体取向，见 [[concepts/HTMX与超媒体]]、[[concepts/前端架构名词与取舍]]，不是行业否定。

## 映射到本仓库

独立工坊站已用同步 REST + 审核枚举 `pending → approved / rejected / withdrawn`。公开列表只出已批准。这是一条本地状态机，不必上 SCXML，也不必上 XState 演员系统。写回治理是 `captured → … → published`，见 [[10-收件箱/写回候选/README-写回候选怎么用|写回候选怎么用]]，同样不是规范解释器。

角色卡变量以 **MVU** 为心智：模型吐补丁、bundle 应用、Zod 拦结构。开合/拖拽是本地 UI state。不要把 `stat_data` 改写成状态图上下文。控件若将来要对齐无头库，根节点问题归 Zag/`getRootNode`，不归本页。

两边都留行业正当性。复杂向导、多演员会话、要可视化的长流程，行业该看上表。本页不按「卡用不上」删 SCXML / XState / robot3。现不上是产品映射，见 [[comparisons/工坊架构该上与不该上]]、[[comparisons/行业架构方案何时用]]。

## 来源与证据

- FSM / 状态图：Stately 导论（一次一态；层次/并发/通信）；Harel 1987 ScienceDirect。
- SCXML：Rec 2015-09-01；errata 止 2016-12-28，七条编辑级。
- XState v5 / 演员 / 迁移：stately.ai 三页。v4 对照与 SCXML 事件形：`xstate.js.org/docs/guides/*`，页眉自称不再维护。
- robot3：GitHub README 指向 `thisrobot.life`；旧 guides 路径当日 404。
- SCION：GitLab README；GitHub 仓是迁址页。
- 查询账本：[[queries/第二批蒸馏目标]] B2-SM；[[queries/第三批蒸馏目标]] B3-WF。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/无头组件与根节点]]
- [[concepts/Saga三义与补偿]]
- [[concepts/MVU变量闭环]]
- [[concepts/HTMX与超媒体]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
