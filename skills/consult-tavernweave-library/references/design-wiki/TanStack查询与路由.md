---
title: TanStack查询与路由
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
  - https://tanstack.com/
  - https://tanstack.com/llms.txt
  - https://tanstack.com/query/latest
  - https://tanstack.com/query/latest/docs/framework/react/overview
  - https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
  - https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state
  - https://raw.githubusercontent.com/TanStack/query/main/LICENSE
  - https://tanstack.com/router/latest
  - https://tanstack.com/router/latest/docs/framework/react/overview
  - https://tanstack.com/router/latest/docs/comparison
  - https://tanstack.com/router/latest/docs/how-to/migrate-from-react-router
  - https://raw.githubusercontent.com/TanStack/router/main/LICENSE
  - queries/第五批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/前端架构名词与取舍.md
  - concepts/边缘缓存与SWR.md
  - concepts/虚拟列表.md
  - concepts/HTTP合同与问题详情.md
knowledge_class: factual
---

# TanStack查询与路由

本页不是已采用前端栈，也不是工坊或酒馆卡必须换栈的工单。检索时间：2026-08-14。账本枢纽是 [[queries/第五批蒸馏目标]] 的 **B5-TanStack**；分路原稿仍在 [[10-收件箱/写回候选/第五批-B5-TanStack]]。只谈公开文档与许可，不写攻击步骤或凭证。本页只蒸 **Query** 与 **Router**。Form / Table 只当邻接边界；Virtual 只回指 [[concepts/虚拟列表]]。

## 一句话定义

TanStack Query 管的是**远程共享状态的客户端副本生命周期**（抓取、缓存、同步、更新），不是通用 HTTP 缓存，也不是 Redux / MobX / Zustand 的替代。TanStack Router 把**路由树当应用合同**、把 URL 当状态管理器；它不是 React Router 7。

## 为什么重要

列表、详情、权限这类数据：远程持久、异步到达、多人共有、别人能改、本地副本会过期。把它们塞进全局 store，等于手写缓存接线。Query 把这套接线收走，本地 theme / sidebar 仍可留 store。路由侧：筛选、页码、深链该进 URL，不该只活在内存。Router 用类型化路由树和 search schema 把 URL 变成合同，而不是字符串桶。工坊与酒馆卡都还没装这两件；本页只拆名词，不选型。

## 权威入口

下列 **12** 条是 B5-TanStack 在 2026-08-14 直读过的官方页，不是镜像。Form / Table / Virtual 入口不在本表展开。B5-TanStack 采集行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [tanstack.com](https://tanstack.com/) | 栈根；现网写 MIT、**paid tiers none** |
| 2 | [llms.txt](https://tanstack.com/llms.txt) | 代理索引；仍列旧包名 `react-location` |
| 3 | [Query 产品页](https://tanstack.com/query/latest) | **v5 Latest**；「server-state standard」；旧名 React Query |
| 4 | [Query 概述](https://tanstack.com/query/latest/docs/framework/react/overview) | 抓取 / 缓存 / 同步 / 更新 **server state** |
| 5 | [Query 默认值](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) | 默认视缓存为 stale；无观察者 5 分钟 `gcTime` |
| 6 | [Query 是否替代客户端状态](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state) | **不替代** Redux / MobX / Zustand |
| 7 | [Query LICENSE](https://raw.githubusercontent.com/TanStack/query/main/LICENSE) | MIT；Copyright 2021-present Tanner Linsley |
| 8 | [Router 产品页](https://tanstack.com/router/latest) | 路由树是应用合同；现网 React + Solid |
| 9 | [Router 概述](https://tanstack.com/router/latest/docs/framework/react/overview) | 自带轻量 SWR 缓存；松散基于 Query |
| 10 | [Router 对照](https://tanstack.com/router/latest/docs/comparison) | 与 **React Router DOM**、Next.js 分列 |
| 11 | [迁出 RR7](https://tanstack.com/router/latest/docs/how-to/migrate-from-react-router) | 卸 `react-router`，换 `@tanstack/react-router` |
| 12 | [Router LICENSE](https://raw.githubusercontent.com/TanStack/router/main/LICENSE) | MIT；Copyright 2021-present Tanner Linsley |

上表 **12** 条。

## 如何运作

### Query：副本生命周期，不是通用缓存

官方对 server state 的定义是：远程持久、走异步 API、共享所有权、别人能改、客户端副本会过期。产品页同时写「server-state standard」和「gives async data a cache, a lifecycle」。两边都留：它**有**缓存，但缓存对象是这份会过期的远程副本，不是「通用 HTTP 缓存层」。

[Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)：`useQuery` 默认把缓存当 **stale**。`staleTime: Infinity` 仍可被 `invalidateQueries` 打脏；`'static'` 连手动失效也不触发重抓。无观察者后默认 **5 分钟** `gcTime`。失败默认静默重试 3 次再进 UI。

[Does this replace client state](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state) 短答：它替换的是客户端里那套异步缓存接线，**不是**本地 / 客户端状态管理器。Redux / MobX / Zustand 也能硬存异步数据，但更笨。theme、sidebar 仍可留全局 store。[[concepts/前端架构名词与取舍]] 已按此分层，不是本页新发现。细粒度读时订阅见 [[concepts/Signals与TC39]]，那是客户端原语，不是这份会过期的远程副本。

### Router：路由树是合同，不是 RR7

[产品页](https://tanstack.com/router/latest)：「The route tree is the application contract。」URL 是状态管理器。框架面现网是 **React 与 Solid**。要用服务器时加 Start，**同一棵路由树**；Start 不是本页主条。

[概述](https://tanstack.com/router/latest/docs/framework/react/overview)：自带 loader 的轻量 SWR 缓存，**松散基于 Query，面更小**；并设计去接 Query / SWR / Apollo。致谢写明站在 Remix 等肩上，这是谱系，不是同一合同。`llms.txt` 仍列 `react-location`；现网安装与迁移页写的是 `@tanstack/react-router`，旧名不当现包。

[对照表](https://tanstack.com/router/latest/docs/comparison) 三列：TanStack Router / Start · **React Router DOM** · Next.js。Search Param Schema Validation：TanStack ✅，React Router 🛑。SWR Loader Caching：TanStack ✅，React Router 🛑。文件路由两边都有，不是同一套生成物。search 字段形状若要对照文档约束，见 [[concepts/JSON Schema与Protobuf]]；那是 schema 方言，不是 Router 自己的路由树合同。

[迁出 RR7](https://tanstack.com/router/latest/docs/how-to/migrate-from-react-router) 标题就是 *Migrate from React Router v7*：卸 `react-router`、换 `@tanstack/react-router`、另生 `routeTree.gen.ts`。RR7 的 `action` 在该页写成「通常用 mutation 或表单库」，不是对等 API。B3-Meta 已写：Remix 一名两物，v2 继任是 RR7。词汇像（loader / 文件路由），合同不是一份。

### 邻接件只记边界

- Form：产品页仍标 **v1 Latest**；2026-08-06 有 v2 alpha。**不要把 Latest 写成 v2**。B2-Form 是 APG / combobox，不是本库。
- Table：**v9 Latest**（2026-08-04 stable）；无头引擎不是 AG Grid。旧 `/docs/introduction` 本波 404。无头控件的根节点心智见 [[concepts/无头组件与根节点]]。
- Virtual：只回指 [[concepts/虚拟列表]]（B3-Virt；坐标器不是组件）。本页不重开。

许可：根站口径全家 MIT、无付费档。Query / Router 版权年都是 2021-present。同 SPDX 仍按仓分条。`query.gg` 是付费课，不是 SPDX。文档站点正文没有另标 CC，本页不发明第二份文档许可。

## 必须保留的冲突

- **Query 缓存 vs 服务器状态**：官方定义的是远程共享状态的客户端副本生命周期（stale / 后台重抓 / `gcTime`），不是通用缓存，也不是 Redux 替代。两边都留，不要并成「Query = 缓存」或「Query 没有缓存」。
- **Router ≠ RR7**：官方对照表分列；官方迁移页是 *from React Router v7*。loader / 文件路由词汇相近，search 校验、路由树生成、action 面不是同一合同。
- Router 自带缓存 **≠** Query 缓存。概述写明前者面更小、松散基于后者。
- Router 的「SWR」≠ RFC 5861 的 `stale-while-revalidate`，也 ≠ Vercel `useSWR`。HTTP 那一层见 [[concepts/边缘缓存与SWR]]。
- Form：**v1 Latest** 与 **v2 alpha** 并存。
- Table V9 已 stable；`/docs/introduction` 死。Virtual 已在 [[concepts/虚拟列表]]。
- `react-location` 是旧名，不是现包 `@tanstack/react-router`。
- [[concepts/前端架构名词与取舍]] 已引 Query 做服务端状态映射，不是已采用 `@tanstack/react-query`。

## 例子

- 正例：把「别人会改、刷新还要在」的列表 / 详情交给 Query；modal 开合、当前 tab 留本地 UI state。
- 正例：筛选和页码进 Router 的 search schema，不只写在内存。
- 正例：从 RR7 迁出时另生 `routeTree.gen.ts`，不要假定 `action` 一对一还能用。
- 反例：用 Query 替代 Redux / Zustand，把 theme、sidebar 也塞进 query cache。
- 反例：把 Query 写成通用 HTTP 缓存或 CDN `Cache-Control`。
- 反例：把 TanStack Router 与 React Router 7 当成同一合同，或把 Remix 谱系写成同一份 API。
- 反例：把 Router loader 的轻量 SWR 缓存写成已经装了 Query。
- 反例：把本仓库或酒馆卡写成「已采用 TanStack」。

## 边界与易混概念

- 不包括：Start / DB / Store / AI / Charts / Pacer 当本页主条。
- 不包括：Form / Table 的完整版本面（只记 Latest ≠ alpha、无头 ≠ AG Grid）。
- 不包括：攻击与缓存投毒步骤、query.gg 付费课、成品皮肤、卡 JSON/PNG。
- 不包括：把 Query 当卡变量心智。卡变量仍以 [[concepts/MVU变量闭环]] 为准。
- 不包括：把 Query 写成超媒体客户端。服务器继续出 HTML 的那条见 [[concepts/HTMX与超媒体]]。
- 易混：听到「缓存」就以为是 HTTP / CDN / [[concepts/PWA与存储配额]] 的 Cache API。
- 易混：听到「SWR」就以为 Router、`useSWR` 和 RFC 5861 是同一个旋钮。
- 易混：文件路由两边都有，就当成生成物相同。

## 映射到本仓库

[[concepts/前端架构名词与取舍]] 已把「服务端状态 / Query」与本地 UI state、全局 store 分开。那是分层，不是安装面。酒馆卡 iframe 无 Query / Router 安装面，见 [[concepts/酒馆宿主与iframe分层]]。超媒体路径（服务器继续出 HTML）见 [[concepts/HTMX与超媒体]]，不要和 Query 的 JSON 客户端副本并成一条。工坊独立站若以后要选型，仍须另核许可与兼容，不能从本页升格成「已采用」。Gateway 同步 REST 的错误体仍归 [[concepts/HTTP合同与问题详情]]；操作清单若以后要生成客户端，见 [[concepts/OpenAPI与Arazzo]]。

## 来源与证据

- Query 定义与默认值：产品页、概述、Important Defaults、Does this replace client-state（2026-08-14 直读，见 B5）。
- Router 合同与 RR7 分列：产品页、概述、comparison、migrate-from-react-router。
- 许可：两仓 raw `LICENSE`；根站 MIT、无付费档。
- 查询账本：[[queries/第五批蒸馏目标]] B5-TanStack；Virtual 回指 [[concepts/虚拟列表]] / [[queries/第三批蒸馏目标]] B3-Virt。分路原稿仍在 [[10-收件箱/写回候选/第五批-B5-TanStack]]。
- 状态分层已有页：[[concepts/前端架构名词与取舍]]。

已知冲突见上节，不静默覆盖。某次安装是否真的带了 Query 或 Router：以该项目 lockfile 为准，标未知。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区
- [ ] 同步 `index.md` 与 `log.md`（本波不改）

## 相关内容

- [[concepts/前端架构名词与取舍]]
- [[concepts/MVU变量闭环]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/边缘缓存与SWR]]
- [[concepts/虚拟列表]]
- [[concepts/HTMX与超媒体]]
- [[concepts/Signals与TC39]]
- [[concepts/PWA与存储配额]]
- [[concepts/JSON Schema与Protobuf]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/无头组件与根节点]]
- [[queries/第五批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-TanStack]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
