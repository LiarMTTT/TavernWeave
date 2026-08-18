---
title: 功能开关与OpenFeature
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
  - https://openfeature.dev/docs/reference/intro/
  - https://openfeature.dev/specification/
  - https://openfeature.dev/specification/sections/flag-evaluation
  - https://openfeature.dev/docs/reference/concepts/evaluation-api
  - https://openfeature.dev/docs/reference/concepts/evaluation-context
  - https://openfeature.dev/docs/reference/concepts/provider
  - https://openfeature.dev/docs/reference/sdks/sdk-compatibility
  - https://www.cncf.io/projects/openfeature/
  - https://github.com/open-feature/spec
  - https://docs.getunleash.io/get-started/unleash-overview
  - https://docs.getunleash.io/concepts/feature-flags
  - https://docs.getunleash.io/sdks
  - https://docs.growthbook.io/features/basics
  - https://docs.growthbook.io/lib
  - https://docs.growthbook.io/lib/openfeature
  - https://docs.growthbook.io/self-host/remote-evaluation
  - queries/第二批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# 功能开关与OpenFeature

本页不是已采用技术，也不是工坊必须上开关平台的工单。检索时间：2026-08-14。账本见 [[queries/第二批蒸馏目标]] B2-Flag。只谈公开规范与厂商概念页，不写攻击步骤、凭证、成品或卡 JSON。

## 一句话定义

功能开关（feature flag / feature toggle）是运行时可控的分支：不改源码、不重新部署，就能打开、关闭或改一条代码路径。[OpenFeature](https://openfeature.dev/docs/reference/intro/) 是 CNCF Incubating 的厂商无关评估 API；真正算值的是 Provider 后面的开关系统（本页收 [Unleash](https://docs.getunleash.io/concepts/feature-flags) 与 [GrowthBook](https://docs.growthbook.io/features/basics)）。

## 为什么重要

长寿分支、金丝雀、A/B、降级、按地域或许可限制功能，都要求「配置能变、评估能看上下文」。没有统一 API，每个服务绑死一家 SDK；有了 OpenFeature，应用代码只认 Evaluation API，换后端改 Provider。它**不**替你管理开关生命周期，也不保证厂商专有能力（粘性分桶、印象数据、可视化实验）能从公共接口露出。

这是发布控制合同，不是 HTTP 操作清单，也不是错误体。操作与错误体见 [[concepts/HTTP合同与问题详情]]、[[concepts/OpenAPI与Arazzo]]。部署进生产 ≠ 对用户可见：DORA 五项量的是交付吞吐与不稳，见 [[concepts/DORA五项与SLO]]，不要把开关平台写成已落地的发布门。

## 权威入口

检索 2026-08-14。16 条，不是教程，也不镜像全文。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [OpenFeature 导论](https://openfeature.dev/docs/reference/intro/) | B2-Flag 枢纽；开关定义与 SDK 抽象。发布路径对照 [[concepts/后端架构名词与工坊对照]] |
| 2 | [OpenFeature 规范](https://openfeature.dev/specification/) | 规范性条款；Experimental / Hardening / Stable。厂商无关合同另见 [[concepts/OpenAPI与Arazzo]] |
| 3 | [Flag Evaluation 专节](https://openfeature.dev/specification/sections/flag-evaluation) | Evaluation API、Provider、默认值。错误回默认值 ≠ [[concepts/HTTP合同与问题详情]] |
| 4 | [Evaluation API 概念](https://openfeature.dev/docs/reference/concepts/evaluation-api) | 基本/详细求值；出错或 No-op 回调用方默认值 |
| 5 | [Evaluation Context](https://openfeature.dev/docs/reference/concepts/evaluation-context) | 动态 vs 静态上下文；targetingKey |
| 6 | [Providers](https://openfeature.dev/docs/reference/concepts/provider) | 翻译层；domain / Multi-Provider |
| 7 | [SDK 兼容表](https://openfeature.dev/docs/reference/sdks/sdk-compatibility) | 服务端 dynamic-context；客户端 static-context |
| 8 | [CNCF OpenFeature](https://www.cncf.io/projects/openfeature/) | 2022-06-17 入会；2023-11-21 Incubating。成熟度 ≠ 本仓已采用 |
| 9 | [规范仓](https://github.com/open-feature/spec) | SDK 自己不算评估逻辑 |
| 10 | [Unleash 架构总览](https://docs.getunleash.io/get-started/unleash-overview) | 后端本地算；前端由服务端/Edge 算。Edge 下发 ≠ [[concepts/边缘缓存与SWR]] |
| 11 | [Unleash 开关概念](https://docs.getunleash.io/concepts/feature-flags) | 类型、生命周期、策略变体。生命周期 ≠ [[concepts/状态机与SCXML]] |
| 12 | [Unleash SDK 总览](https://docs.getunleash.io/sdks) | 官方 SDK；OpenFeature Provider 标 Beta |
| 13 | [GrowthBook 开关基础](https://docs.growthbook.io/features/basics) | key / 类型 / 默认值；禁用则 payload 不含该 feature |
| 14 | [GrowthBook SDK](https://docs.growthbook.io/lib) | 客户端 / 服务端 / 边缘；默认本地评估 |
| 15 | [GrowthBook OpenFeature](https://docs.growthbook.io/lib/openfeature) | Provider 覆盖 Python / Go / .NET / Java |
| 16 | [GrowthBook Remote Evaluation](https://docs.growthbook.io/self-host/remote-evaluation) | 客户端送属性，私有端点只回收已算值。远端先算 ≠ [[concepts/边缘缓存与SWR]] |

上表 **16** 条。B2 采集目标约 12 条，本表按枢纽展开，不镜像采集行。刻意未收：LaunchDarkly / Split 营销页、报价、接入菜谱、凭证样例、盗版 PDF、把开关写进卡 JSON 的成品。

## 如何运作

### 开关本身

最简形态是运行时可改的 if/else。完整系统还要管理面、环境、定向规则、审计，以及按主体算值的上下文。Unleash 把开关放在项目与环境里，用 activation strategy 决定对某个 Unleash Context 是否启用；多策略是 OR。GrowthBook 用唯一 feature key、类型（boolean / string / number / JSON）和默认值，再用规则覆盖。两边都把「代码进生产」和「对用户可见」拆开。

布尔旗一多，合法组合会炸。互斥状态与迁移归 [[concepts/状态机与SCXML]]；功能开关管的是同一状态下要不要走某条路径，不是状态机本身。

### OpenFeature 合同

[规范仓](https://github.com/open-feature/spec) 写明：SDK 只提供厂商无关对接面，**自己不算 flag**。应用设 Provider、取 Client、调用 `getBooleanValue` 等；出错或未设 Provider（No-op）都回调用方给的默认值。Provider 把参数译成某家系统的表示，可以包厂商 SDK、打 REST，或读本地文件。

评估上下文装定向用的任意数据。`targetingKey` 在 Evaluation API 里可选，但很多后端要它做百分比滚动。服务端 SDK 是 **dynamic-context**：全局 / Client / 调用点三层合并，每次求值可带不同上下文。客户端 SDK 是 **static-context**：上下文在 API 上异步更新，Provider 先 reconcile，再对缓存做同步求值。这是 OpenFeature 对「客户端 vs 服务端」的定义，不是「规则在不在浏览器里」。

### 评估发生在哪

三套官方说法并存，不要并成一句「运行时评估」：

1. **调用点**。OpenFeature 把评估定义成应用调用 Evaluation API 的那一次。
2. **本地对缓存规则求值**。Unleash 后端 SDK 拉全量配置，在进程内算（刷新默认约 15s）；GrowthBook 默认客户端与服务端 SDK 也是先拉 payload 再本地算。
3. **远端先算完再下发**。Unleash 前端 SDK 不在本地算，由 Unleash 或 Edge 按上下文返回已启用开关；GrowthBook [Remote Evaluation](https://docs.growthbook.io/self-host/remote-evaluation) 让客户端只拿已算好的值，规则与未用变体不到端上。

配置变更传到进程都有延迟。调用点拿到的值，可能是刚算的，也可能是上次拉取的远端结果。这不是 HTTP 新鲜度或 `stale-while-revalidate`，见 [[concepts/边缘缓存与SWR]]。这也不是事件日志重放，也不是跨服务补偿：事件真源见 [[concepts/事件溯源与CQRS]]；补偿见 [[concepts/Saga三义与补偿]]。

## 必须保留的冲突

- **评估时机与地点（最要紧）。** OpenFeature 把「评估」钉在 Evaluation API 调用点；Unleash 后端与 GrowthBook 默认 SDK 在本地对缓存规则求值；Unleash 前端与 GrowthBook Remote Evaluation 在服务端 / Edge / 私有端点先算完再下发。三套都是官方说法。不能写成单一的「客户端评估」或「运行时评估」。
- **「客户端 vs 服务端」至少三轴。** OpenFeature：dynamic-context vs static-context。Unleash：全量配置本地算 vs 只下发已算结果。GrowthBook：默认本地算（规则可见）vs Remote Evaluation（规则不可见）；文档还写多数人从客户端 SDK 起步。三轴不要并成一张表的同一列。
- **谁是应用合同。** OpenFeature：应用只依赖 Evaluation API，换 Provider 不改调用点。Unleash 与 GrowthBook：公共 API 只覆盖各家共有能力；要专有能力请用原生 SDK。Unleash 的 OpenFeature Provider 检索日仍标 Beta。两边都留。
- **GrowthBook OpenFeature 语言面窄。** 官方 Provider 列 Python / Go / .NET / Java，没有与 JS 客户端 SDK 对等的一条。JS 应用走原生 SDK 或自写 Provider，不能从本页推出「全语言已齐」。
- **禁用与默认值。** OpenFeature：禁用是 reason，不是 error；无 Provider / 出错回默认值。GrowthBook：整 feature 禁用则不进 payload，求值 `null`。不要用一家的禁用语义覆盖另一家。
- **Incubating ≠ 已采用。** CNCF 成熟度不是本仓库技术选型。映射句不是过滤器。本页**不是**「工坊已采用 OpenFeature / Unleash / GrowthBook」。
- **开关拉取 / 远端先算 ≠ HTTP 边缘缓存。** 配置刷新与 Remote Evaluation 不是 RFC 5861 的 SWR，也不等于 CDN 新鲜度。

## 例子

- 正例：服务用 OpenFeature Client 求 boolean，Provider 指向 Unleash 或 GrowthBook；换厂商只改 bootstrap。
- 正例：浏览器走 Unleash 前端 SDK 或 GrowthBook Remote Evaluation，端上不持有规则。
- 正例：后端 Unleash SDK 本地算，用户属性不出进程。
- 反例：把 OpenFeature 当成开关管理面（它没有 Admin UI，也不管生命周期）。
- 反例：因本页出现 Unleash / GrowthBook 就写进 recipe 或发卡依赖。
- 反例：把卡 iframe 里的 if/else 或世界书条目写成 OpenFeature 评估。
- 反例：把本页写成「工坊必须上开关平台」，或把 CNCF Incubating 当成已采用证明。

## 边界与易混概念

- 不包括：接入步骤、密钥、绕过定向、攻击评估端点、成品实验平台。
- OpenFeature ≠ 开关系统。前者是评估合同，后者才存规则与环境。
- 厂商 SDK ≠ OpenFeature 合同。专有能力往往只在原生 SDK。
- 客户端 SDK ≠ 浏览器里算规则。OpenFeature 的「客户端」指 static-context；Unleash 前端明确不在本地算。
- 评估 API 调用 ≠ 规则引擎刚跑完。调用点读到的可能是缓存的远端结果。
- 禁用语义分叉：OpenFeature 用 `disabled` reason，不当错误；GrowthBook 禁用则该 feature 不进 payload，求值 `null`，走 fallback。
- 功能开关 ≠ 状态机。开关是运行时路径；互斥状态见 [[concepts/状态机与SCXML]]。
- 功能开关 ≠ 事件溯源 / CQRS，也 ≠ Saga 补偿。
- 开关配置缓存 ≠ [[concepts/边缘缓存与SWR]] 的 HTTP 共享缓存。
- 易混：听到「标准开关 API」就以为专有能力（粘性分桶、印象、可视化实验）已经从公共接口露出。

## 映射到本仓库

这是独立服务与应用运行时的发布控制合同，不是卡 JSON、世界书或宿主 iframe 的开关模型。本仓也未采用任何开关平台。**不要把本页写成工坊或发卡已采用 OpenFeature / Unleash / GrowthBook。**

| 本仓物 | 实际在做 | 不是 |
|---|---|---|
| [[concepts/后端架构名词与工坊对照]] | 同步 REST + 审核状态机 | 开关管理面或 Evaluation API |
| [[comparisons/工坊架构该上与不该上]] | 发布 / 审核要同步可见 | 用远端开关当「已发布」真源 |
| [[concepts/酒馆宿主与iframe分层]] | 卡 UI 在宿主 / iframe 分层 | OpenFeature 评估点 |
| [[concepts/创意工坊与安全契约]] | 卡内 fail closed | 开关定向或实验分桶 |
| [[concepts/C4与ADR]] | 说明方式入口 | 本页不是「已决定上开关平台」的 ADR |
| 发卡 recipe / 世界书 | 条目与组件装配 | 功能开关 payload |

工坊主路径仍是同步 REST 与 `pending → approved / rejected / withdrawn`，见对照页。那是产品状态机，不是 OpenFeature 评估。卡内 if/else 或世界书条件注入，见 [[concepts/世界书注入路径]]，不要写成 Evaluation API。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表。

## 来源与证据

- 开关定义：OpenFeature 导论「运行时 if/else」；Unleash 概念页「不改源码管理功能」。
- OpenFeature 不算值：[规范仓 README](https://github.com/open-feature/spec)；Provider 概念页。
- 动态/静态上下文：Evaluation Context 概念页与 [SDK 兼容表](https://openfeature.dev/docs/reference/sdks/sdk-compatibility)。
- Unleash 评估地点：[架构总览](https://docs.getunleash.io/get-started/unleash-overview) 四格表；SDK 总览重复同一句。
- GrowthBook 默认本地算、可选远端算：[SDK 总览](https://docs.growthbook.io/lib) 与 Remote Evaluation 专页。
- 厂商对 OpenFeature 的保留：Unleash SDK 页标 Beta，并建议印象数据 / impact metrics 用原生 SDK；GrowthBook OpenFeature 页写粘性分桶、Visual Editor、SSE 用原生 SDK。
- CNCF：2022-06-17 接受，2023-11-21 Incubating。Apache-2.0。
- 账本：[[queries/第二批蒸馏目标]] B2-Flag。分路原稿仍在 [[10-收件箱/写回候选/概念-功能开关与OpenFeature]]。

已知冲突见上节，不静默覆盖。工坊或发卡真机未核任何开关平台——本来就没有已落地的 Provider 可验。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第二批蒸馏目标]]
- [[10-收件箱/写回候选/概念-功能开关与OpenFeature]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/状态机与SCXML]]
- [[concepts/DORA五项与SLO]]
- [[concepts/边缘缓存与SWR]]
- [[concepts/事件溯源与CQRS]]
- [[concepts/Saga三义与补偿]]
- [[concepts/C4与ADR]]
- [[concepts/创意工坊与安全契约]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/世界书注入路径]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
