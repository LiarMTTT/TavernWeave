---
title: 表单与combobox
created: 2026-08-15
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - safety
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  - https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
  - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid
  - https://developer.mozilla.org/en-US/docs/Web/CSS/:invalid
  - https://developer.mozilla.org/en-US/docs/Web/CSS/:user-valid
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation
  - https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation
  - https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid
  - https://www.w3.org/TR/selectors-4/#user-invalid-pseudo
  - https://html.spec.whatwg.org/multipage/input.html
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
  - queries/第二批蒸馏目标.md
knowledge_class: factual
---

# 表单与combobox

本页不是已采用表单库，也不是工坊必须换 Form 实现的工单。蒸馏自 [[queries/第二批蒸馏目标]] **B2-Form**。检索日 2026-08-15。只谈公开平台合同与 APG 模式，不写攻击步骤、绕过或凭证。

## 一句话定义

表单是浏览器替作者收值、做客户端约束、再提交的平台合同。Constraint Validation 是其中的约束层。Combobox 是 [APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) 的一种**模式**：一个输入面 + 默认收起的弹出层（listbox / grid / tree / dialog），用来从集合里选值或给建议。APG 不是规范，见 [[concepts/无障碍与包容设计]]。

## 为什么重要

空必填一进页就全红、把搜索选择做成无角色 `div`、把 HTML `autocomplete` 和 `aria-autocomplete` 并成一个词，都会让人填不下去或读屏报错。开局向导、设置项、筛选都是表单；看起来像「可搜下拉」的控件往往该对 combobox，却不是独立 listbox，也不是浏览器自动填充。本页只蒸平台与模式，不写成「工坊已采用某 Form 库」。

## 权威入口

检索日 2026-08-15。下表 **14** 条对齐 B2-Form 约条。采集行不在本页镜像。APG 总论、符合性与命令面板叠法见 [[concepts/无障碍与包容设计]]，本表不重抄。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | B2-Form 枢纽；输入面 + 弹出层；可编辑与仅选择分轨 |
| 2 | [APG Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) | 独立选项列表；不是 combobox 的输入面 |
| 3 | [APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | combobox 的 dialog 弹出层；命令面板叠法回指无障碍页 |
| 4 | [MDN `:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) | Baseline Widely（约 2023-11）；交互或提交后再标无效 |
| 5 | [MDN `:invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:invalid) | Baseline Widely（约 2015-07）；约束一失败就匹配 |
| 6 | [MDN `:user-valid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-valid) | 与 `:user-invalid` 同档；交互后再标有效 |
| 7 | [MDN Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) | 属性约束、`checkValidity` / `reportValidity`、`setCustomValidity` |
| 8 | [WHATWG Constraints](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation) | 候选、受苦状态、静态/交互校验、`user validity` |
| 9 | [WHATWG `:user-invalid`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid) | HTML 选择器：`input` / `textarea` / `select` 且 `user validity` 为真 |
| 10 | [Selectors 4 `:user-invalid`](https://www.w3.org/TR/selectors-4/#user-invalid-pseudo) | 下限：提交后、再次交互或 reset 前；其余可 UA 定义 |
| 11 | [WHATWG `input`](https://html.spec.whatwg.org/multipage/input.html) | 用户提交变更时把 `user validity` 置真；reset 置回假 |
| 12 | [MDN `autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) | 浏览器自动填充令牌；≠ `aria-autocomplete` |
| 13 | [MDN `datalist`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist) | 建议列表；隐式 role 是 listbox；本波标 Limited |
| 14 | [WHATWG autocomplete](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill) | 自动填充令牌真源；本页不镜像令牌表 |

TanStack Form 入口不在本表。邻接边界见 [[concepts/TanStack查询与路由]]。

## 如何运作

### 原生 Constraint Validation

HTML 先用语义 `type`（如 `email` / `url`）和属性（`required`、`pattern`、`min` / `max`、`minlength` / `maxlength`、`step`）声明约束，不必先写脚本。更复杂的跨字段约束用 `setCustomValidity(message)`：空字符串表示通过，非空字符串是自定义错误文案。

WHATWG 把控件分成：是不是**约束校验候选**、是否正**受苦**于某条效度状态（缺值、类型不符、pattern、过长过短、越界、步进、坏输入、自定义错误）。不在任何受苦状态，才算满足约束。`disabled` 的元素仍可在 DOM 里带效度状态，但被排除出候选，提交时不会拦。

两套触发：

1. **静态**：`checkValidity()`。只算过不过，通常用来决定 `:valid` / `:invalid`。
2. **交互**：`reportValidity()` 或用户提交表单。会向用户报告失败。

`novalidate` / `formnovalidate` 关掉提交时的交互校验。对 `HTMLFormElement` 调 `submit()` **不会**走交互校验；要点提交按钮，或走会走提交算法的那条（如 `requestSubmit()`）。`minlength` / `maxlength` 只在用户编辑过的值上检查，脚本赋值即使再调 `checkValidity()` 也不走这两条——规范原文如此。

自定义元素要进 `<form>` 的提交与校验，真源是 `formAssociated` + `ElementInternals`（`setFormValue` / `setValidity`），不是影子树里藏了一个 `<input>`。本页不重抄，见 [[concepts/Lit与自定义元素]]。

客户端约束改善体验，**不是**安全机制。WHATWG 写明服务器不应依赖它。本页到此为止，不写绕过步骤。服务端失败体若走 HTTP API，见 [[concepts/HTTP合同与问题详情]]；那是响应信封，不是字段旁的校验文案。

### `:invalid` 与 `:user-invalid`

`:invalid` 匹配「候选但不满足约束」的元素，以及拥有这类后代的 `form` / `fieldset`。空的必填框在进页时就已经是 `:invalid`。用它画红框，会在用户还没碰表单时全红。

HTML 给 `input` / `textarea` / `select` 一个 **`user validity` 布尔**，初值为假。为真之后，不满足约束的控件才匹配 `:user-invalid`；满足约束的才匹配 `:user-valid`。规范里能核到的置真时机：

- 用户**提交**一次变更（与 `change` 一起；拖滑块松手这类「先操作再提交」也算）；
- 表单进入提交事件流程时，该表所有可提交控件一并置真。

`reset` 算法把 `user validity` 置回假。Gecko 默认给 `:user-invalid` 画红光，不给 `:invalid` 画默认样式——这是引擎默认，不是「`:invalid` 已废」。

[Selectors 4](https://www.w3.org/TR/selectors-4/#user-invalid-pseudo) 只规定**下限**：提交过之后、用户再次与该控件交互或 reset 之前，必须能匹配；也允许在「改过值并失焦」等其它合适时机匹配。精确规则交给宿主语言；HTML 用 `user validity` 落地。MDN `:user-invalid` 第一句按「交互之后」，第二句复述的是 Selectors 4 下限（提交后到再次交互前）。两句不要并成「只在提交后的一个窗口里亮」。`:user-invalid` 仍必须同时是 `:invalid`。

MDN：`:user-invalid` / `:user-valid` 为 Baseline Widely，约 2023-11 起跨引擎；`:invalid` 约 2015-07。HTML 选择器条文只点名 `input` / `textarea` / `select`。FACE 自定义元素能否匹配 `:user-invalid`，本页标**不确定**；它们仍可走约束校验与 `:invalid`，校验 API 回指 Lit 页。

字段错要贴在字段旁并保持到改对。Toast 与通知分层见无障碍页，本页不重开。

### APG combobox

APG：combobox 是带关联弹出层的输入控件。弹出层可以是 listbox、grid、tree 或 dialog。默认**收起**。打开条件由实现自定：下箭头 / 打开按钮、获焦即开、或可编辑时打到若干字符才开。

最能定交互的是能不能打字：

- **仅选择（select-only）**：值只能从弹出层选。有的浏览器会把 `size="1"` 的 HTML `select` 对辅助技术报成 combobox。
- **可编辑（editable）**：可打任意值，或只允许离散集合（此时打字用来过滤建议）。

自动完成有四种形态，对应 `aria-autocomplete`：

| 形态 | `aria-autocomplete` | 要点 |
|---|---|---|
| 无自动完成 | `none` | 弹出层内容不随已打字符变 |
| 列表 + 手选 | `list` | 建议随输入变；不选手动项则保留已打字符串 |
| 列表 + 自动选 | `list` | 第一项自动高亮；失焦时除非改选或改字，否则吃掉该项 |
| 列表 + 行内补全 | `both` | 同上，且未打完的补全串出现在光标后并呈选中态 |

输入面元素 `role="combobox"`，用 `aria-controls` 指向弹出层（可见时必须设；指向不可见元素也合法）。ARIA 1.0 曾用 `aria-owns`，APG **强烈建议**改 `aria-controls`。弹出层不是 listbox 时，还要设对应的 `aria-haspopup`（`grid` / `tree` / `dialog`）；listbox 是 combobox 的隐式 `aria-haspopup`。`aria-expanded` 随开合。listbox / grid / tree 弹出层：DOM 焦点留在 combobox，辅助技术焦点走 `aria-activedescendant`。**dialog 弹出层相反**：DOM 焦点进入对话框，不走 `aria-activedescendant`。

本页不搬整份键盘表。只留区分点：Tab 只进 combobox 本身，打开按钮和弹出层不进页级 Tab 序；Escape 关层，可选择再清空；在 listbox 弹出层里选中跟随焦点，且一次只选一个建议。

### listbox、autocomplete、datalist 易混

APG 自己把 combobox 和 **listbox / menu button** 分开：combobox 能把已选值呈现在可复制的输入面里；用户可在弹出层里逛一圈再 Escape，**不改**先前的值。单选 listbox 一移动焦点就改值，Escape 没有这套撤销。menu button 不能标 `aria-required`，收起时也没有「当前值」。命令面板没有 APG 专模，是 Dialog + Listbox 的叠用，见无障碍页；不要把命令面板写成 combobox 专模。

三套「自动完成」不是一个词：

1. **HTML `autocomplete`**：给用户代理的自动填充令牌（`email`、`current-password`、`shipping postal-code` 等）。有助于 WCAG 2.2 成功标准 1.3.5 Identify Input Purpose。`off` 常被密码管理器忽略。这是填充，不是建议列表键盘模型。
2. **`aria-autocomplete`**：combobox 弹出层如何随输入给建议。
3. **`<datalist>`**：给关联控件的建议 `<option>`。它本身不是输入；控件仍可接受通过校验的任意值。隐式 ARIA role 是 **listbox**。MDN 本波标 **Limited availability**，不是 Baseline；并记下缩放、高对比、部分读屏组合不朗读建议等缺口。`input` + `datalist` **不是** APG combobox 实现。

控件换皮（`appearance: base` / `base-select`）和 `field-sizing` 只回指 [[concepts/CSS平台2026]]（该页声明不重抄 B2-Layout 的 `field-sizing`）。本页不蒸换皮。

超媒体表单（声明式 `hx-*` 提交、服务器回 HTML 碎片）仍坐在原生 `<form>` 上，约束层不自动消失。见 [[concepts/HTMX与超媒体]]。

## 必须保留的冲突

- **APG 是模式指南，不是 Rec。** 跟了 combobox 示例 ≠ 符合 WCAG。符合性仍看无障碍页的 WCAG 轴。
- **`:invalid` ≠ `:user-invalid`。** 前者进页即可亮；后者看 HTML 的 `user validity`。
- **Selectors 4 下限 ≠ HTML 精确规则 ≠ MDN 两句摘要。** Selectors 4 允许提交后以外的匹配；HTML 用 `user validity`；MDN 第二句不要当成「只在提交后亮」。
- **HTML `:user-invalid` 条文只点名 `input` / `textarea` / `select`。** FACE 能否匹配，不确定。
- **combobox ≠ listbox ≠ menu button ≠ 命令面板。** 命令面板叠 Dialog+Listbox。
- **`aria-autocomplete` ≠ HTML `autocomplete` ≠ `<datalist>`。** 建议行为、自动填充、原生建议列表是三份合同。
- **`datalist` 不是 Baseline（MDN 本波 Limited），也不是 APG combobox。**
- **ARIA 1.0 的 `aria-owns` 不是现行推荐。** APG 要 `aria-controls`。
- **`form.submit()` 跳过交互校验**；点提交按钮或 `requestSubmit()` 才会走。`novalidate` 再关一档。
- **TanStack Form 只是邻接。** 产品页 v1 Latest 与 v2 alpha 并存，见 [[concepts/TanStack查询与路由]]。B2-Form 蒸的是 APG / `:user-invalid`，不是「已采用 Form」。
- 客户端约束 ≠ 服务端校验 ≠ HTTP 问题详情信封。

## 例子

- 正例：必填邮箱用原生 `type="email"` + 可见 `<label>`；红框走 `:user-invalid`；错误文本写在字段旁并用 `aria-describedby` 挂上。
- 正例：可搜地点做成 APG combobox（可编辑 + list 弹出层），`aria-expanded` / `aria-controls` / `aria-activedescendant` 按开合更新。
- 正例：只允许枚举值、又不需要打字过滤时，优先原生 `<select>`，或 select-only combobox；不要先上无角色列表。
- 正例：姓名、地址字段带正确的 HTML `autocomplete` 令牌；建议下拉另走 combobox 或（知道缺口的前提下）`datalist`。
- 反例：用 `:invalid` 给空必填进页全红。
- 反例：把 combobox 做成「看起来像搜索、读屏却是一堆无角色 div」。
- 反例：把 HTML `autocomplete="list"` 或 `datalist` 写成已经实现了 `aria-autocomplete`。
- 反例：因本页出现 Form / combobox，就写进 recipe 或「已采用 TanStack Form」。

## 边界与易混概念

- 不包括：已采用表单库、发卡依赖、成品皮肤、卡 JSON/PNG、攻击或凭证。
- 不包括：整页复述 APG 键盘表、WCAG 成功标准全文、ElementInternals 步骤、控件换皮语法。
- 不包括：把本页蒸成 TanStack Form 版本面。
- 无障碍总论、Toast ≠ 字段错、命令面板叠法 → [[concepts/无障碍与包容设计]]。
- FACE / `setValidity` → [[concepts/Lit与自定义元素]]。
- `field-sizing`、`appearance: base` / `base-select` → [[concepts/CSS平台2026]]。
- 超媒体提交 → [[concepts/HTMX与超媒体]]。
- API 错误信封 → [[concepts/HTTP合同与问题详情]]。
- 无头库的 combobox 行为合同 → [[concepts/无头组件与根节点]]；无头 ≠ 已有皮肤。
- 易混：听到「autocomplete」就以为只有一种。
- 易混：听到「下拉」就以为是 combobox。原生 `select`、独立 listbox、menu、`datalist`、dialog 日历都可能长得像下拉。

## 映射到本仓库

当前工坊没有「已采用 Form 库」。本页只问平台合同，不改发卡依赖。

开局向导和授予者表是表单：可见标签、原生约束、`:user-invalid`、字段旁持久错误。控制中心设置同样是表单。若做可搜选择，按 combobox 模式，不要用无角色列表冒充。跨 iframe 没有跨文档表单合同——框内控件参加的是**框内** document 的 `<form>`，见 [[concepts/酒馆宿主与iframe分层]]。自定义元素要进宿主页表单，回指 Lit 页，不在本页重写 FACE。

服务端或 Gateway 的失败体若已是 HTTP JSON，对齐 [[concepts/HTTP合同与问题详情]] 的「选一种信封」；不要和字段旁文案并成一种「标准错误」。HTMX 式碎片更新若出现，约束仍在原生表单上，除非作者显式 `novalidate`。

## 来源与证据

- Combobox / listbox 分层与 `aria-controls`：APG Combobox、APG Listbox（2026-08-15 直读）。
- `user validity` 与选择器范围：WHATWG form-control-infrastructure、semantics-other、input 的 change / reset。
- Selectors 4 下限与「可在其它合适时机匹配」：Selectors Level 4 § 12.3.4。
- Baseline 日期：MDN `:invalid`、`:user-invalid`、`:user-valid` 页头。
- `datalist` Limited 与隐式 listbox：MDN `datalist` 本波。
- 自动填充令牌与 1.3.5：MDN `autocomplete` Accessibility 节。
- 查询账本：[[queries/第二批蒸馏目标]] B2-Form。

已知冲突见上节，不静默覆盖。FACE 是否匹配 `:user-invalid`、各引擎把「提交变更」算到哪一次按键：未跑真机，标不确定。Wiki 门不要求真机。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词（含 `safety`：只谈「客户端校验不是安全机制」）
- [x] 已发布到正式区

## 相关内容

- [[concepts/无障碍与包容设计]]
- [[concepts/Lit与自定义元素]]
- [[concepts/CSS平台2026]]
- [[concepts/TanStack查询与路由]]
- [[concepts/HTMX与超媒体]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/无头组件与根节点]]
- [[concepts/开局页路径]]
- [[concepts/控制中心与状态栏]]
- [[concepts/酒馆宿主与iframe分层]]
- [[queries/第二批蒸馏目标]]
