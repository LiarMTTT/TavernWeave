---
title: HTMX与超媒体
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
  - https://htmx.org/essays/when-to-use-hypermedia/
  - https://htmx.org/essays/hypermedia-on-whatever-youd-like/
  - https://htmx.org/essays/locality-of-behaviour/
  - https://htmx.org/essays/hypermedia-friendly-scripting/
  - https://data-star.dev/guide/getting_started
  - https://alpinejs.dev/start-here
  - https://stimulus.hotwired.dev/handbook/introduction
  - https://htmx.org/essays/hypermedia-driven-applications/
  - queries/第三批蒸馏目标.md
  - queries/前端视觉与灵感站点蒸馏目标.md
  - concepts/前端架构名词与取舍.md
  - comparisons/行业架构方案何时用.md
knowledge_class: factual
---

# HTMX与超媒体

本页不是已采用技术，也不是换栈工单。检索日 2026-08-14。账本枢纽是 [[queries/第三批蒸馏目标]] 的 **B3-Htmx**（7 条）。

第一批已收 [HTMX HDA](https://htmx.org/essays/hypermedia-driven-applications/)，见 [[queries/前端视觉与灵感站点蒸馏目标]] 与 [[concepts/前端架构名词与取舍]] 的一行定义。**本页不重蒸 HDA 长论**，只互指。

## 一句话定义

超媒体驱动的界面：服务器继续出 HTML（或 HTML 补丁），浏览器用声明式属性做增强，而不是先拉 JSON 再在客户端重写整棵 UI。HTMX 把 HTML 加成超媒体控件；Alpine / Stimulus 管页内短暂态；Datastar 自称把「后端补丁 + 前端 `data-*`」合成一套。

## 为什么重要

[[concepts/前端架构名词与取舍]] 已把 HTMX / HDA 放进页面形态表：服务器已能出 HTML、交互是增强时少前端状态机；复杂客户端编排仍弱，见 [[concepts/状态机与SCXML]] 与 [[concepts/Signals与TC39]]。本页补 B3 深页：何时该上、行为局部、友好脚本、HOWL，以及 Datastar / Alpine / Stimulus 三套增强合同。名词本身没有对错；对错在交互粒度和离线/高频需求对不上。

## 权威入口

B3-Htmx 枢纽是 [When Should You Use Hypermedia](https://htmx.org/essays/when-to-use-hypermedia/)（2022-10-23）。下列 **7** 条是本批真源。HDA 长论不算第 8 条。

| # | 入口 | 本页用它记什么 |
|---|---|---|
| 1 | [When to use](https://htmx.org/essays/when-to-use-hypermedia/) | 文本/CRUD/嵌套块宜；离线、高频态、表格动态依赖不宜 |
| 2 | [HOWL](https://htmx.org/essays/hypermedia-on-whatever-youd-like/) | 超媒体前端把后端语言从「必须 JS」里松开 |
| 3 | [LoB](https://htmx.org/essays/locality-of-behaviour/) | 行为应在单元内一眼可见；与 DRY、SoC 官方承认互斥 |
| 4 | [Friendly scripting](https://htmx.org/essays/hypermedia-friendly-scripting/) | 互指 HDA；网络交换仍走超媒体；事件、岛屿、禁当 JSON RPC |
| 5 | [Datastar 入门](https://data-star.dev/guide/getting_started) | `data-*` + `@get`；`text/html` 按 id morph，或 SSE 补丁 |
| 6 | [Alpine 起步](https://alpinejs.dev/start-here) | `x-data` / `x-on` / `x-show`；页内钉 jsDelivr `3.15.8` |
| 7 | [Stimulus 手册](https://stimulus.hotwired.dev/handbook/introduction) | 增强「已有 HTML」；`data-controller` 桥到 JS |

许可（B3 采集，本轮未再打开各仓 LICENSE 文件）：HTMX 库 0BSD、随笔无 SPDX；Alpine / Stimulus MIT；Datastar **核心 MIT、Pro 另购**。

## 如何运作

### 不是二选一

[When to use](https://htmx.org/essays/when-to-use-hypermedia/) 借 Rich Harris 的 Transitional：同一应用可以混超媒体与 SPA 岛。HTMX 与 Harris **同意要混**，**不同意线画在哪**——作者认为有了 htmx，超媒体能走得比多数人以为的更远。游戏核心可以自己管指针，设置页仍可用超媒体。官方还写：把 SPA 岛嵌进更大的超媒体应用，通常比反过来容易。岛的组件合同见 [[concepts/Lit与自定义元素]] 与 [[concepts/无头组件与根节点]]。

### 何时该上、何时不该

宜：UI 主要是文本和图片；表单 CRUD；更新落在边界清楚的嵌套块里（计数与集合同区，才能一次换一块）；深链和首屏。Contexte 用 htmx 换 React 的演示被作者自己限定为「媒体站极适合」，**不是**「任何团队换栈都砍 67%」。

不宜：依赖在渲染时算不出来（电子表格那种任意公式）；必须离线全功能（Service Worker 只标复杂选项，不是默认合同，见 [[concepts/PWA与存储配额]] 与 [[concepts/CRDT与local-first]]）；UI 态极高频（鼠标轨迹、对战帧；长列表虚拟化见 [[concepts/虚拟列表]]）；要整段复制 React 系组件（如 shadcn）；团队/招聘不认超媒体。Twitter / Gmail 被作者当成「能用超媒体做」的粗粒度例子；Google Sheets / Maps 当成反例。绝大多数站点远小于这四者。

超媒体 API 可以跟 UI 走：区块改了，端点可以整段改。这是超媒体开发的特点，不是稳定 JSON 资源 API。JSON 资源合同见 [[concepts/HTTP合同与问题详情]]、[[concepts/OpenAPI与Arazzo]] 与 [[concepts/JSON Schema与Protobuf]]。

### HOWL：前端是 HTML，后端随便

[HOWL](https://htmx.org/essays/hypermedia-on-whatever-youd-like/)（Hypermedia On Whatever you'd Like）：前端主要是 HTML 加一点友好脚本时，「后端为何不也用 JS」的压力会下降。作者说这不是反 JS——htmx 本身用 JS 写成，服务器用 JS/TS 也可以，见 [[concepts/WinterTC与服务器JS]]。HOWL 只恢复 MPA 那条「服务器语言可选」。

### LoB 与友好脚本

[LoB](https://htmx.org/essays/locality-of-behaviour/)：看一个单元就应看出它做什么。`<button hx-get="/clicked">` 比把点击逻辑藏进另一份 jQuery 文件更符合 LoB。LoB 不是把实现内联，而是把**调用**放在看得见的地方。官方明文：LoB 常与 DRY、SoC 打架；htmx 允许属性写在父节点以免重复，这是用 DRY 换 LoB。离得越远（隔几行 < 隔一页 < 隔文件），违规越重。没有硬规则。

[Friendly scripting](https://htmx.org/essays/hypermedia-friendly-scripting/) 把 HDA 里「脚本只增强、不颠覆」展开成可检查的拇指规则（**不重抄 HDA 正文**）：

1. 尊重 HATEOAS：不要用 `fetch` / `XHR` 去换纯 JSON 数据 API，除非响应仍是超媒体。客户端查询层见 [[concepts/TanStack查询与路由]]。
2. 纯前端短暂态可以留在客户端（开合、显隐）。要改服务器上的系统态，必须走超媒体交换。
3. 组件用自定义事件对外说话，htmx 才能 `hx-trigger` 把它变成超媒体控件（例：Sortable.js 的 `end`）。
4. 必须自己管网络的复杂控件，做成岛，再用事件接回外层超媒体。
5. 内联脚本（Alpine、hyperscript）可选，不是友好脚本的必要条件。内联与信任边界见 [[concepts/CSP与Trusted Types]]。
6. 现实库常不守 HATEOAS：能包一层就包，不能就隔离使用，不要为纯度花光复杂度预算。

### 三套增强，不是三个 HTMX

| 库 | 合同 | 不是 |
|---|---|---|
| Alpine | 在已有 HTML 上声明 `x-data` 等，跟踪页内对象；`x-show` / `x-model` / `x-for` 管显隐、绑定、循环 | 不是超媒体交换层；起步页钉的 `3.15.8` 不是「永远最新」 |
| Stimulus | 志向有限：给「已经有的 HTML」接 controller；`data-controller` 像 `class` 接 CSS 那样接 JS | 不是 SPA；手册站采集时标 3.2.2（2023-08-07） |
| Datastar | 入门页自称后端反应像 htmx、前端反应像 Alpine；`@get()` 发 fetch；`text/html` 按元素 id morph；`text/event-stream` 则是 `datastar-patch-elements` SSE | 不是 HTMX 的另一发行版；核心 MIT ≠ Pro |

Datastar 默认 morph：只改变动的 DOM，并只重应用改过的 `data-*`，以保留前端态。响应里必须已有对应 id，morph 才接得上。SSE 事件之间要空两行。入门页推荐自托管脚本，CDN 只当最快起步。`data-*` 选择器习惯见 [[concepts/OMNI正则与data属性选择器]]。

## 例子

- 正例：媒体站、后台表单、设置页用超媒体；深链和首屏走 HTML。
- 正例：联系人详情把邮箱计数和邮箱列表放同一块，一次替换该块。
- 正例：拖拽岛触发事件，外层 `hx-trigger` / 等价物再 POST HTML。
- 正例：Alpine 只做下拉开合，不把开合同步成服务器资源。
- 反例：把 Contexte 的 67% 写成「换 htmx 的普遍收益」。
- 反例：每个 mousemove 打一枪超媒体请求。
- 反例：把 Datastar 写成「HTMX + Alpine 的官方合并发行」，或把核心 MIT 写成整站（含 Pro）都 MIT。
- 反例：因本页出现这些库就写进 recipe / 发卡依赖。

## 边界与易混概念

- 不包括：HDA 长论重述、*Hypermedia Systems* 全书、hyperscript 语言全文、具体后端 SDK 教程。
- 不包括：本仓库已采用 HTMX / Datastar / Alpine / Stimulus。
- 易混：HDA（第一批已收的架构随笔）≠ 本页的「何时用 / LoB / 友好脚本」。
- 易混：HOWL ≠ 「禁止服务器用 JS」。
- 易混：LoB ≠ 把实现细节糊进标记；也 ≠ 可以无视 DRY。
- 易混：Alpine / Stimulus 的页内态 ≠ 超媒体交换。短暂态可以本地；系统态不行。
- 易混：Datastar 的 SSE 补丁 ≠ HTMX 的 `hx-*` 属性面；事件名和 morph 策略是另一份合同。
- 易混：Transitional 混用 ≠ 「已经是 SPA」。岛堆多了仍会变成伪 SPA，见 [[concepts/前端架构名词与取舍]]。
- 酒馆卡 iframe 无这套超媒体往返的默认宿主；映射见末节，不是选型。

## 来源与证据

- 何时用、嵌套块、离线/高频反例：本轮打开 [when-to-use-hypermedia](https://htmx.org/essays/when-to-use-hypermedia/)。
- HOWL 与 JS Pressure：本轮打开 [hypermedia-on-whatever-youd-like](https://htmx.org/essays/hypermedia-on-whatever-youd-like/)。
- LoB 定义及与 DRY/SoC 的冲突：本轮打开 [locality-of-behaviour](https://htmx.org/essays/locality-of-behaviour/)。
- 友好脚本六条：本轮打开 [hypermedia-friendly-scripting](https://htmx.org/essays/hypermedia-friendly-scripting/)；HDA 只互指，不摘长论。
- Datastar morph / SSE：本轮打开 [getting_started](https://data-star.dev/guide/getting_started)。
- Alpine 指令与 `3.15.8` 钉死：本轮打开 [start-here](https://alpinejs.dev/start-here)。
- Stimulus 定位：本轮打开 [handbook/introduction](https://stimulus.hotwired.dev/handbook/introduction)。
- 许可分叉与 Stimulus 版本标：[[queries/第三批蒸馏目标]] B3-Htmx 采集行（2026-08-14）。

### 已知冲突（不静默覆盖）

- **Datastar 核心 MIT ≠ Pro。** B3 钉：核心 MIT、Pro 另购。入门页只讲 MIT 核心脚本与自托管；不要写成整套产品线同一许可。
- **LoB 与 DRY / SoC 官方互斥。** 作者要你做主观取舍，不是选一个原理消灭另一个。
- **HDA 不重收。** 第一批已有长论入口；本页只蒸深页。前端架构页的一行定义仍有效，本页不替换它。
- **随笔无 SPDX，库有许可。** 四篇 htmx.org/essays 本轮未见 SPDX；0BSD 只标库。
- **Alpine 起步页版本钉死。** `3.15.8` 是该教程 CDN 行，不是现行唯一发行。
- **与 Harris 的线。** 双方都要 Transitional；线的位置两边留，本页不判谁赢。

## 映射到本仓库

角色卡 HUD：入口挂宿主 document，整页脚本走 TH iframe，开合/拖拽是本地 UI state，MVU 是服务端状态心智，见 [[concepts/入口外壳与HUD宿主]] 与 [[concepts/酒馆宿主与iframe分层]]。这不是 HTMX 往返，也不是 Datastar SSE。独立工坊站当前落点仍是 SSG/ISR + islands，见 [[comparisons/工坊架构该上与不该上]] 与 [[concepts/边缘缓存与SWR]]。映射 ≠ 本仓库已采用 HTMX / Alpine / Stimulus / Datastar。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] 未重蒸第一批 HDA 长论
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [ ] 同步 `index.md` 与 `log.md`（本波不改）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[queries/前端视觉与灵感站点蒸馏目标]]
- [[concepts/前端架构名词与取舍]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/状态机与SCXML]]
- [[concepts/WinterTC与服务器JS]]
- [[concepts/Lit与自定义元素]]
- [[concepts/边缘缓存与SWR]]
- [[concepts/PWA与存储配额]]
- [[concepts/CSP与Trusted Types]]
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/Signals与TC39]]
- [[concepts/虚拟列表]]
- [[concepts/JSON Schema与Protobuf]]
- [[concepts/TanStack查询与路由]]
