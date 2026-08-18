---
title: Signals与TC39
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
  - https://github.com/tc39/proposal-signals
  - https://tc39.es/process-document/
  - https://github.com/proposal-signals/signal-polyfill
  - https://angular.dev/guide/signals
  - https://angular.dev/api/core/signal
  - https://docs.solidjs.com/concepts/intro-to-reactivity
  - https://docs.solidjs.com/reference/basic-reactivity/create-signal
  - https://docs.solidjs.com/concepts/stores
  - https://preactjs.com/guide/v10/signals/
  - https://vuejs.org/guide/essentials/reactivity-fundamentals.html
  - https://vuejs.org/guide/extras/reactivity-in-depth.html
  - https://vuejs.org/api/reactivity-core.html
  - queries/第五批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/前端架构名词与取舍.md
  - concepts/CRDT与local-first.md
knowledge_class: factual
---

# Signals与TC39

本页不是已采用技术，也不改工坊或角色卡栈。检索日 2026-08-14。账本枢纽是 [[queries/第五批蒸馏目标]] 的 **B5-Signal**；分路原稿仍在 [[10-收件箱/写回候选/第五批-B5-Signal]]。入口与阶段结论转引该页，本页未重抓。只收**信号原语**，不重收 Solid Start / Qwik City / RR7 modes。框架已出荷的 signal / `ref` **不是** TC39 Stage 草稿。

## 一句话定义

Signals 是「读时自动订阅、写时通知依赖」的响应式原语。TC39 有一份 [proposal-signals](https://github.com/tc39/proposal-signals) 草稿，页首钉 **Stage 1**。Angular / Solid / Preact / Vue 的信号（或等价的 `ref`）已经是现行产品合同。Stage 1 不是语言已出荷。

## 为什么重要

外文常把「提案仓活着」写成「JS 已有标准 Signals」，或反过来用框架出荷倒推「标准已定」。两边都不对。提案自比 Promises/A+：先对齐生态，再谈标准；与 Promises 不同的是，它**不求统一应用面**，只求信号图与自动追踪的核心语义。计划在多框架原型验证前**不升出 Stage 1**，且「只有实践上适合多框架、且相对框架自带信号有真实收益才标准化」。卡内或工坊若当「浏览器全局已有 `Signal`」，会在现行 ECMAScript 上静默没有这个对象。

## 权威入口

入口 **12** 条。`https://tc39.es/proposal-signals/` 本轮 **404**，真身在 GitHub。B5-Signal 的采集行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [tc39/proposal-signals](https://github.com/tc39/proposal-signals) | 本页枢纽。Stage 1；末推 2026-01-25。草稿 `Signal.State` / `Computed` / `subtle`。无内置 `effect`。 |
| 2 | [TC39 Process](https://tc39.es/process-document/) | Stage 1 = under consideration，尚未选定首选方案（那是 Stage 2）。Stage 4 才 ready to be included。 |
| 3 | [signal-polyfill](https://github.com/proposal-signals/signal-polyfill) | 提案点名的预览。README：**Do not use this in production**。无 `effect`。 |
| 4 | [Angular Signals](https://angular.dev/guide/signals) | **已出荷**。`signal(0)` 是 getter；`set` / `update`；`computed`；`effect`。 |
| 5 | [Angular `signal()`](https://angular.dev/api/core/signal) | `WritableSignal<T>`。`@angular/forms/signals` 是表单层，不当新原语。 |
| 6 | [Solid Intro](https://docs.solidjs.com/concepts/intro-to-reactivity) | 末更 2026-04-28。`createSignal` → `[getter, setter]`。组件函数只跑一次。 |
| 7 | [Solid `createSignal`](https://docs.solidjs.com/reference/basic-reactivity/create-signal) | `equals` 页内 Default `false` vs 正文 `===`，两边留。 |
| 8 | [Solid Stores](https://docs.solidjs.com/concepts/stores) | `createStore` **不是** `createSignal`。signals 追踪单值；stores 用 Proxy。 |
| 9 | [Preact Signals](https://preactjs.com/guide/v10/signals/) | `.value`；`computed` / `effect` / `batch`。`createModel` 是容器层。 |
| 10 | [Vue Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) | 推荐 `ref()`。DOM 更新进 next tick。 |
| 11 | [Vue Connection to Signals](https://vuejs.org/guide/extras/reactivity-in-depth.html) | 官方：signal ≡ `ref`。细粒度订阅渲染**不是**资格条件。 |
| 12 | [Vue Reactivity Core](https://vuejs.org/api/reactivity-core.html) | `ref` / `computed` / `reactive` / `watchEffect`。默认 `flush: 'pre'`。 |

## 如何运作

### 主冲突：Stage 1 ≠ 框架已出荷

两边都留，不得互相覆盖：

- **语言侧仍是 Stage 1**。仓与 [process-document](https://tc39.es/process-document/) 钉 under consideration。Stage 2 才选首选方案，且仍可能永不进标准。polyfill 禁生产。`tc39.es/proposal-signals/` 404，不能把短链升成规范 URL。
- **四框架原语已出荷**。Angular `signal`、Solid `createSignal`、Preact `@preact/signals`、Vue `ref` 都是现行产品页，不是「等标准再实现」的预告。

不能用提案草稿覆盖出荷 API，也不能用出荷倒写成「JS 已有标准 Signals」。Stage 1 比「已收口未入库」更早，更不能当语言全局。框架 signal ≠ Stage 草稿。

### 应用面分裂

提案自己写：`.get()` / `.set()` **与所有流行 Signals API 都不一致**。目标是框架内核互操作，不是统一 `signal()`。

| 线 | 读 | 写 | 派生 | 副作用 |
|---|---|---|---|---|
| 提案草稿 | `Signal.State#get` | `#set` | `Signal.Computed` | **无** `effect`；框架用 `Signal.subtle.Watcher` |
| Angular | `count()` | `count.set` / `update` | `computed` | `effect` / `afterRenderEffect` |
| Solid | `count()` | `setCount` | memo | `createEffect` |
| Preact | `count.value` | 赋 `.value` | `computed` | `effect` |
| Vue | `count.value` | 赋 `.value` | `computed` | `watchEffect` / `watch` |

写操作在提案里同步立即可见；`notify` 同步，但禁止在回调里读写信号。这是内核合同，不是应用面教程。

### 信号 ≠ 细粒度 store

Vue 明文：细粒度订阅渲染不是成为 signal 的必要属性；现靠编译器 + VDOM，并在探 Vapor（未写成已替换）。Solid 把 `createStore` 写成另一原语。Preact 用 `createModel` 把信号、computed、effect、action 捆成容器。提案把「递归响应式 store proxy」列在**组合目标**，不是 `Signal.State` 本身。Pinia / Zustand / Jotai / 「Signals Store」营销名不能当原语入口。

### effect、相等、调度

- 提案故意不收 `effect`（调度属框架）；四框架都有，名字各异。polyfill 同样留给库作者用 `Watcher` 自造。
- 相等：Angular / 提案写 `Object.is`。Solid `createSignal` 页 Default `false`（每次都更新）vs 正文 `===`，同页双留，不裁定。
- 同步：提案写 set 同步、computed 同步可读。Vue 官方写 DOM 更新进 next tick；`watchEffect` 默认 `flush: 'pre'`，不是提案 `Watcher.notify` 的同步中断。不要并成同一调度。
- Angular `asReadonly()` 只挡 `set`/`update`，不挡深突变。异步边界后不再追踪。`effect` 官方标给「非响应式 API」的副作用，不是默认派生。

### Solid 两页措辞

Stores 页写 signals「trigger a full re-render」；Intro 页写组件只跑一次、只更新用到的读取。两句并陈，不单边采用。

## 必须保留的冲突

- **提案 Stage 1 vs 框架已出荷。** 仓与 process 钉 under consideration；Angular / Solid / Preact / Vue 原语页是现行产品。不能用草稿覆盖出荷 API，也不能用出荷写成「JS 已有标准 Signals」。框架 signal ≠ Stage 草稿。
- 应用面分裂：提案 `.get`/`.set` 自承不跟流行面。
- 信号 ≠ 细粒度 store 商标。
- effect 有无：提案无，四框架有。
- 相等默认：Solid 同页打架。
- 同步合同：提案同步 vs Vue next tick。
- 入口死活：`tc39.es/proposal-signals/` 404。
- Solid Stores / Intro 两页措辞并陈。
- **映射 ≠ 采用。** 本页补状态分层缺口，不是「卡内要上 Signals」，更不是浏览器全局已有 `Signal`。

## 例子

- 正例：讲「JS 标准 Signals」时先报 Stage 1，再分列框架合同。
- 正例：对照原语用上表，不把 `createStore` / `reactive()` / `createModel` 写成 `signal()`。
- 反例：因提案仓活着，写成「浏览器已有 `Signal`」。
- 反例：用 Angular / Vue 出荷倒推「TC39 已收口」。
- 反例：把 `signal-polyfill` 塞进角色卡当生产依赖。
- 反例：把 Fluid Presence 的 transport `signal` 并进本词。

## 边界与易混概念

- 不包括：路由元框架（B3-Meta）、表单层 `@angular/forms/signals`、Svelte runes（提案列过设计输入，本批不点名收）、MobX / RxJS 当「Signals」商标、攻击步骤。
- Signals ≠ Fluid / WebRTC 的 signal 信道。后者见 [[concepts/CRDT与local-first]]、[[concepts/WebRTC信令边界]]。
- Signals ≠ UI / Query / 全局 store 三分。后者见 [[concepts/前端架构名词与取舍]] 的「状态分层」，那里无信号原语专节。
- `useOptimistic` 是 React 乐观 UI，不是信号图。
- 区分方法：先问是 TC39 草稿还是某框架出荷页；再问是单值原语还是 store / model。

## 映射到本仓库

[[concepts/前端架构名词与取舍]] 管状态分层，不收本原语。本页补那一缺口，不是发布令，也不是「卡内要上 Signals」。角色卡嵌入 UI 今天仍按各卡已选栈（宿主 DOM、自管状态、MVU）即可，见 [[concepts/MVU变量闭环]]。不要为对齐提案引入禁生产 polyfill。这是产品落点，不是对 Signals 的行业否定。现不上的取舍见 [[comparisons/工坊架构该上与不该上]]、[[comparisons/行业架构方案何时用]]。

## 来源与证据

权威入口上表 12 条，转引 B5-Signal 2026-08-14 检索。查询账本：[[queries/第五批蒸馏目标]] B5-Signal；[[queries/第三批蒸馏目标]] 的 B3-Meta 只作「不重收路由元框架」边界。

已知冲突见上节，不静默覆盖。

尚缺：polyfill README 直抓全文待复核；提案是否仍停 Stage 1（末推 2026-01-25）；Solid `equals` 默认以源码还是文档为准。未跑浏览器或酒馆真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[queries/第五批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-Signal]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/CRDT与local-first]]
- [[concepts/WebRTC信令边界]]
- [[concepts/MVU变量闭环]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
