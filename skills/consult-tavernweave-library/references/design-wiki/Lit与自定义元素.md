---
title: Lit与自定义元素
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - sillytavern
sources:
  - https://lit.dev/docs/
  - https://lit.dev/docs/components/defining/
  - https://html.spec.whatwg.org/multipage/custom-elements.html
  - https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals
  - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals
  - queries/第三批蒸馏目标.md
  - concepts/酒馆宿主与iframe分层.md
  - concepts/视觉CSS与设计token.md
knowledge_class: factual
---

# Lit与自定义元素

本页不是已采用技术，也不是发卡依赖。蒸馏自 [[queries/第三批蒸馏目标]] **B3-Lit**。检索日 2026-08-14。

## 一句话定义

Lit 是给**标准自定义元素**加响应式状态、声明模板和默认 Shadow DOM 的薄库。每个 Lit 组件都是 `HTMLElement`。自定义元素要进 `<form>` 提交、校验、恢复状态，真源是 WHATWG 的 **`ElementInternals`**，不是 Lit 的响应式属性，也不是 `@lit-labs/forms`。

## 为什么重要

「已经是自定义元素 / 已经用了 Lit」不等于能当表单控件。影子树里的原生 `<input>` 默认不代表宿主提交。平台合同是：`static formAssociated = true`，再 `attachInternals()`，再用 `setFormValue()` 把提交值交给用户代理。Lit 只降低样板；表单参与仍走这一条。

## 权威入口

检索日 2026-08-14。下表 **5** 条，对齐 B3-Lit 约条。采集行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [What is Lit](https://lit.dev/docs/) | 每个 Lit 组件都是标准 Web Component；互操作靠浏览器原生模型 |
| 2 | [Defining a component](https://lit.dev/docs/components/defining/) | `@customElement` = `customElements.define`；`LitElement` → `ReactiveElement` → `HTMLElement` |
| 3 | [WHATWG custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) | 自主元素、`formAssociated`、FACE 回调、`attachInternals`、`ElementInternals` |
| 4 | [MDN ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) | 表单参与 + AOM；无构造器，只由 `attachInternals()` 返回 |
| 5 | [MDN attachInternals](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals) | 非自定义元素、internals 被关、同一元素调用两次，均抛错 |

影子树默认行为另见 [Lit Shadow DOM](https://lit.dev/docs/components/shadow-dom/)，不算上表第 6 条。2019 的 [web.dev more-capable-form-controls](https://web.dev/articles/more-capable-form-controls) 是教程，不是规范真身。

## 如何运作

### Lit 是自定义元素，不是另一套组件模型

[What is Lit](https://lit.dev/docs/) 写：每个 Lit 组件都是标准 Web Component，可在任何 HTML 环境、任何框架或无框架里当内置元素用。站点开发者不必写 Lit 代码。Lit 自称大约 5 KB（压缩后），更新只动动态部分，不重建整棵虚拟树再 diff。

[Defining](https://lit.dev/docs/components/defining/)：定义 Lit 组件就是定义自定义 HTML 元素。`LitElement` 继承 `HTMLElement` 的全部标准属性与方法。注册面是 `customElements.define`；装饰器只是缩写。

因此：**Lit ≠ 替代自定义元素的框架。** 它是 `HTMLElement` 上的响应式与模板层。生命周期仍是 WHATWG 那套 `connectedCallback` 等；Lit 另加响应式更新循环，覆盖标准回调时必须 `super`。

### 表单参与真源是 ElementInternals

WHATWG 非规范节「Creating a form-associated custom element」把两步钉死：

1. 静态 `formAssociated = true`，自主自定义元素才变成 **form-associated custom element（FACE）**。
2. 构造里 `this._internals = this.attachInternals()`，用 `ElementInternals` 实现内置控件已有的能力。

提交值不靠影子里有没有 `<input>`，靠 `internals.setFormValue(value, state)`。规范例：日期控件界面显示 `3/15/2019`，提交 `"2019-03-15"`——前者是 **state**（恢复/自动填充），后者是 **submission value**。`value` 可以是 `null`、字符串、`File` 或 `FormData` 条目列表。元素不是 FACE 时，`setFormValue` 抛 `NotSupportedError`。

FACE 另有回调：`formAssociatedCallback`、`formResetCallback`、`formDisabledCallback`、`formStateRestoreCallback`。`name` / `disabled` / `form` / `readonly` 在 FACE 上有平台语义：`disabled` 阻止提交值；`readonly` 使元素退出约束校验。

MDN：`ElementInternals` 没有构造器；对象只由 `HTMLElement.attachInternals()` 返回。它同时暴露 AOM（默认 `role` / `aria*`）和 `states`（`:state()`）。表单参与与无障碍默认语义共用这一对象，但仍是**平台接口**，不是 Lit API。

`@lit-labs/forms` 的 `FormAssociated` / `FormControl` 只是替你调 `attachInternals` 和 `setFormValue`。它是 labs 封装，**不能**写成表单参与真源，也不能写成 Lit 核心已内建 FACE。

### attachInternals 只能一次

WHATWG：`attachInternals()` 在下列情况抛 `NotSupportedError`——不是自定义元素、定义关闭了 internals、**同一元素调用两次**、元素状态还不是 `precustomized` / `custom`。每个 `HTMLElement` 只有一份 attached internals，初值为 null。

冲突点：有人在基类里为了 `:state()` 先调一次，子类或 `@lit-labs/forms` 再调一次，第二次必炸。真源仍是「一元素一份 internals」；谁先 `attach`，谁必须把同一对象往下传。不要为了 labs mixin 再发明第二份。

### 影子树里的原生控件 ≠ 宿主表单控件

Lit 默认 `createRenderRoot` 建 **open** `shadowRoot`，模板画在影子里。[Lit Shadow DOM](https://lit.dev/docs/components/shadow-dom/) 给的好处是 DOM 作用域、样式作用域、slot 组合。`document.querySelector` 默认进不去影子。

这与表单是两件事。影子里的 `<input name="x">` 通常**不会**进入外层 `<form>` 的控件集合，提交时也没有宿主元素的名字。FACE + `setFormValue` 就是为了让**宿主自定义元素本身**像内置控件一样 listed / labelable / submittable / resettable。

旧做法「影子里藏原生 input，靠它提交」不是现行合同。规范真源是 `ElementInternals`。隐藏 input 只是垫片，两边都留：能跑 ≠ 平台语义。

Shadow DOM 抗的是样式和选择器误伤，不是安全边界，也不是表单边界。同 JS 堆、同主线程。见 [[concepts/视觉CSS与设计token]]、[[concepts/酒馆宿主与iframe分层]]。

## 例子

- 正例：`class X extends HTMLElement { static formAssociated = true; constructor(){ super(); this._i = this.attachInternals(); } }`，值变时 `this._i.setFormValue(...)`。
- 正例：Lit 组件同样设 `static formAssociated`，在构造或首次更新里 `attachInternals()` **一次**，响应式属性变化时再 `setFormValue`。
- 正例：校验走 `internals.setValidity(...)` / `checkValidity()`，不要只改影子里 input 的 `required` 就以为外层表单知道。
- 反例：写成「用了 Lit 就会自动参加 form submit」。
- 反例：把 `@lit-labs/forms` 或 web.dev 2019 文当成 FACE 规范真源。
- 反例：基类和 mixin 各调一次 `attachInternals()`。
- 反例：因本页出现 Lit 就写进 recipe / 发卡依赖。

## 边界与易混概念

- 不包括：本仓库已采用 Lit、把 Lit 打进 PNG、选型工单、攻击或凭证。
- Lit ≠ React / Vue 那种虚拟树框架；官方对比的是「互操作、少锁定」，不是「已经取代自定义元素」。
- 自定义元素 ≠ FACE。没有 `formAssociated` 就不是表单控件。
- `ElementInternals` ≠ 只做表单。它还管默认 ARIA 与 `:state()`。
- `attachInternals` ≠ `attachShadow`。影子是渲染根；internals 是作者侧内部能力。两者独立，都只能按规范各来一次。
- `@lit-labs/forms` ≠ Lit 核心。labs 封装不能上抬成真源。
- 影子内原生 input ≠ 宿主提交值。
- 区分方法：先问元素有没有 `formAssociated`；再问提交值是不是 `setFormValue` 交给用户代理的；最后才问用没用 Lit。

## 映射到本仓库

稳定卡今天的壳是宿主挂载、TH iframe、正则 HTML 碎片，见 [[concepts/酒馆宿主与iframe分层]]、[[concepts/角色卡DOM与挂载点]]。**映射 ≠ 本仓库已采用 Lit。** 消息楼里的 class 还会被 ST 加 `custom-` 前缀；协议在 `data-*`，不在自定义标签名。

若某块 HUD 自己定义了自定义元素：浮层 / 焦点的根仍按窗选，见 [[concepts/无头组件与根节点]]；要进宿主页上的 `<form>`，必须走 FACE + `ElementInternals`，不能假定影子里的 input 会被 ST 或浏览器收走。跨 iframe 没有这份表单合同——框内元素参加的是**框内** document 的 form。

## 来源与证据

权威入口上表 5 条。已知冲突（不得静默覆盖）：

- **ElementInternals 才是表单参与真源。** WHATWG 用 `formAssociated` + `attachInternals` + `setFormValue` 定义 FACE。Lit 文档教的是自定义元素与影子树，不替代这条。`@lit-labs/forms` 是 labs 封装，web.dev 2019 文是教程。
- Lit 组件 = 标准自定义元素；不是另一套与 CE 并列的模型。
- 影子内原生控件能「看起来像输入」，不等于 listed / submittable。
- `attachInternals()` 一元素一次；基类先取 internals 与 mixin 再取，冲突保留，采用「同一对象下传」。
- Shadow DOM 抗样式 ≠ 安全边界 ≠ 表单边界。
- 工坊「现在不用 Lit」≠「自定义元素或 FACE 不正当」。

尚缺：未抓 `@lit-labs/forms` 发布是否已出 labs；未跑浏览器或酒馆真机。Wiki 门不要求真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/角色卡DOM与挂载点]]
- [[concepts/无头组件与根节点]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/前端架构名词与取舍]]
