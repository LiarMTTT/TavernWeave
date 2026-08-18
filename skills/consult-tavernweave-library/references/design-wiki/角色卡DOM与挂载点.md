---
title: 角色卡 DOM 与挂载点
created: 2026-08-13
updated: 2026-08-13
type: concept
status: active
tags:
  - wiki
  - concept
  - sillytavern
  - tooling
sources:
  - raw/workshop-cards-2026-08-13/analysis_omni-README.txt
  - raw/workshop-cards-2026-08-13/status_bar-mount_shell_remote-README.txt
  - 角色卡工作区/星月/星月 4.0.0/components/options_render_regex.html
  - 角色卡工作区/星月/星月 4.0.0/components/options_bridge.js
  - 角色卡工作区/星月/星月 4.0.0/components/dialog_bubble_regex.html
  - 角色卡工作区/星月/星月 4.0.0/components/update_variable_omni_done_regex.html
  - 角色卡工作区/星月/星月 4.0.0/components/opening_expand_regex.html
  - 角色卡工作区/星月/星月 4.0.0/components/media_library.js
  - 角色卡工作区/怪谈笔记/components/scripts/kdn_bridge.js
  - 角色卡工作区/怪谈笔记/components/statusbar.html
  - 角色卡工作区/交错宙域/v2.6.2_20260721_174430/components/status_bar_regex.html
knowledge_class: factual
---

# 角色卡 DOM 与挂载点

卡前端不是一张网页，而是几层互相看不见的文档。名词分三类：**宿主层**（SillyTavern / 酒馆助手给的框）、**协议属性**（`data-*`，脚本靠它找节点）、**装饰 class**（给人看，不能当选择器）。

产品真源是三张已验证稳定卡：[[entities/星月私立高等学院]]、[[entities/交错宙域]]、[[entities/怪谈笔记绮罗世界]]。口语总表见 [[concepts/角色卡前端名词中英对照]]。**谁造了哪个 iframe、宿主 chrome、净化钩子**见 [[concepts/酒馆宿主与iframe分层]]。本页只管卡侧 `data-*` 协议。

## 为什么重要

在消息楼里用 `.omni-analysis` 写 CSS 或 `querySelector`，真机会变成裸白或点不动。SillyTavern 会给消息 HTML 的 class 加 `custom-` 前缀。协议必须写在 `data-*` 上。

## 文档层（先认窗，再找节点）

分层全表、TH 官方名字、ST `chats.js` 净化钩子见 [[concepts/酒馆宿主与iframe分层]]。本页只留卡侧要用的最短对照。

| 中文 | English / identifier | 卡侧要点 |
|---|---|---|
| 宿主页 | host document | 小手机挂 `body`；输入框 `#send_textarea` |
| 脚本框 | `TH-script--…` | 控制中心 |
| 消息框 | `TH-message--楼号--序号` | 状态栏 ` ```html ` |
| 内层真身框 | blob iframe | git-mount；要 `injectBridge` |
| 楼层块 | `.mes[mesid]` | ST 属性名是 `mesid` |
| 正文槽 | `.mes_text` | OMNI/气泡/选项在这里，**不是** iframe |
| class 前缀 | `custom-` | 只改写进 `.mes_text` 的 class |

```text
宿主页
 ├─ 脚本框（控制中心）
 ├─ .mes_text 碎片 HTML（OMNI / 气泡 / 选项）
 └─ 消息框（状态栏）
      └─ blob 真身框（星月 git-mount）
小手机：挂宿主 body
```

脚本框和消息框不是同一个 `window`。blob 真身再隔一层。细则见 iframe 页。

**硬规则适用范围：** 写进消息楼、会被 ST 改 class 的那段 HTML（OMNI、对话气泡、行动选项、开局远程占位）。卡自己完全控制的 iframe 文档内部，class 选择器可以工作；但跨层查找、以及任何可能落到消息楼的模板，仍应走 `data-*`。

## 命名空间（看见前缀就知道哪张卡、哪一层）

| 前缀 | 卡 | 管什么 |
|---|---|---|
| `data-xy-*` | 星月 | OMNI、开局远程、对话气泡、媒体管理器 |
| `data-xyopt-*` | 星月 | 行动选项（正则挂载 + `options_bridge.js`） |
| `data-xyph-*` | 星月 | 小手机根（从怪谈移植） |
| `data-kdn-*` | 怪谈笔记 | 小手机 HUD 根、壳皮肤、结算卡 |
| `data-kdnopt-*` | 怪谈笔记 | 行动选项，结构同 `data-xyopt-*` |
| `data-kdnopen-*` | 怪谈笔记 | 开局授予者表单 |
| `data-cz-*` | 交错宙域 | 状态栏媒体块等卡族协议 |
| `id="xingyue-*"` | 星月 | 控制中心面板、魔棒按钮、HUD 抽屉 |
| `id="xy-phone-root"` | 星月 | 小手机根 |
| `id="kdn-statusbar-root"` | 怪谈笔记 | 小手机根 |

`class="xy-*"` / `omni-*` / `kdn-*` / `cz-*` 是装饰或 iframe 内部样式。消息楼里不要用它们当协议。

## 星月：消息楼挂载点

正则先吐占位，JS 再扫 `data-*` 填真 UI。

### OMNI

| 属性 | 含义 |
|---|---|
| `data-xy-omni="analysis"` | 预分析青框挂载点 |
| `data-xy-omni="done"` | 变量同步完成绿框 |
| `data-xy-omni="progress"` | 同步中琥珀框 |
| `data-xy-omni-raw` | 框里的原文容器，给媒体库/控制中心提取 |
| `data-xy-omni-fallback` | 真身模板还没到时的占位字 |
| `data-xy-omni-ready="1"` | 这格已经渲过，避免重复挂 |
| `data-xy-omni-rendering="1"` | 正在拉模板 |
| `data-xy-omni-state` | 同步结果状态（如 `ok`） |
| `data-xy-analysis-edit` | 「预分析」按钮，点了走控制中心 |
| `data-xy-analysis-reroll` | 从预分析整楼重算 |
| `data-xy-var-tune` | 「微调」按钮 |

```html
<div class="xy-omni-mount" data-xy-omni="done">
  <div data-xy-omni-fallback>变量更新完成，正在读取 JSONPatch…</div>
</div>
```

`class="xy-omni-mount"` 只是给人看。扫描用 `[data-xy-omni]:not([data-xy-omni-ready])`。

### 开局远程壳

`first_message_opening.html` 在 4.0.0 只留标记行；楼里真正占位的是 `opening_expand_regex.html`。

| 属性 | 含义 |
|---|---|
| `data-xy-opening-remote` | 远程开局页的楼内挂载根 |
| `data-xy-opening-phase` | `loading` 等阶段 |
| `data-xy-remote-state` | `idle` / `loading` / `loaded` / `error` |
| `data-xy-remote-owner` | 谁占着这次远程加载 |
| `data-xy-opening-status` | 状态文案节点 |
| `data-xy-opening-retry` | 失败重试按钮 |
| `data-xy-opening-shell` | 加载中的内层壳 |
| `data-xy-opening-page` | 真身开局页根（值常是版本号） |
| `data-xy-opening-view` | 开局视图名，如 `boot` |
| `data-xy-opening-step` | 向导步 |

CSS 用 `[data-xy-opening-remote]:not([data-xy-remote-state="loaded"])`，不用 class。

### 对话气泡

| 属性 | 含义 |
|---|---|
| `data-xy-dialog-render` | 成对对话气泡挂载点 |
| `data-xy-dialog-speaker` | 说话人 |
| `data-xy-dialog-avatar` | 头像槽 |
| `data-xy-dialog-content-source` | 隐藏 textarea，原文在这里 |
| `data-xy-dialog-content-cache` | 已解析正文缓存 |
| `data-xy-dialog-ready` | `1` 已渲 / `0` 空内容 |
| `data-xy-cot-dialog-render` | CoT 档对话挂载点 |
| `data-xy-cot-dialog-source` | CoT 原文 |

媒体库扫 `[data-xy-dialog-render]`，也兼容 `.xy-dialog-render` 和 `.custom-xy-dialog-render`，因为 ST 可能已经加过前缀。

### 行动选项

| 属性 | 含义 |
|---|---|
| `data-xyopt-root` | 一组选项的根。桥扫这个。 |
| `data-xyopt-raw` | 隐藏原文 |
| `data-xyopt-list` | 按钮被填进这里 |
| `data-xyopt-choice` | 单个选项按钮，值是序号 |
| `data-xyopt-direct` | 直发开关 |
| `data-xyopt-collapse` | 收起/展开 |
| `data-xyopt-toggle` | 直发开关的外层 label |
| `data-xyopt-tip` | 状态提示 |
| `data-xyopt-head` | 标题行 |

根上有 `container-type: inline-size`，窄了从两列变一列。样式选择器全是 `[data-xyopt-list]`，没有 class 协议。

### 媒体管理器（控制中心里）

`data-xy-media-manager-trigger` / `-status` / `-type` / `-name` / `-slot` / `-list` / `-filter`：工坊/媒体库面板内部控件，不在消息楼。

## 怪谈笔记：小手机 + 楼内桥

| 属性 | 含义 |
|---|---|
| `data-kdn-hud-root` | `#kdn-statusbar-root` 上，HUD 根标记 |
| `data-kdn-build` | 构建号，如 `1.0.9` |
| `data-kdn-shell` | 壳皮肤：`terminal` / `clear` 等 |
| `data-kdn-charm` | 挂饰皮肤：`seal` / `crystal` / `keycard` |
| `data-kdn="floatgrab"` | 拖动抓手 |
| `data-kdn-editing` | 主屏是否在编辑小组件 |
| `data-kdnopt-*` | 与星月 `data-xyopt-*` 同构的行动选项 |
| `data-kdnopen-root` | 开局表单根 |
| `data-kdnopen="字段名"` | 开局字段，如 `对怪谈笔记的态度` |
| `data-kdnopen-go` / `-skip` | 提交 / 跳过 |
| `data-kdn-settlement` | 变量结算卡根 |
| `data-kdn-settlement-analysis` | 结算卡里的预分析段 |
| `data-kdn-settlement-patch` | 结算卡里的 JSONPatch 段 |

星月小手机根是 `data-xyph-hud-root` + `data-xyph-build`，职责同 `data-kdn-hud-root`。

## 交错宙域：卡内状态栏动作

交错 2.6.2 状态栏是卡内整页 HTML，不走星月 git-mount。动作仍大量写在 `data-*` 上，例如：

| 属性 | 含义 |
|---|---|
| `data-cz-media-block` | 头像/立绘块 |
| `data-cz-media-action` | 媒体按钮动作 |
| `data-cz-media-toggle` | 临时切正常/赤裸立绘 |
| `data-cz-media-settings` | 打开头像立绘设置 |
| `data-batch-key` / `data-batch-action` | 批量选择 |
| `data-detail` | 展开/折叠一条详情 |
| `data-block` | 展开某个角色/机体块 |
| `data-group` / `data-char` | 删除或迁移时的目标 |
| `data-kind` / `data-key` | 属性/技能加点 |

这些是 HUD 内部协议。不要和消息楼 OMNI 的 `data-xy-omni` 混用。

## 根节点 ID（不是 data，但常被当成「那个 DOM」）

| ID | 含义 |
|---|---|
| `xingyue-control-center-panel` | 控制中心面板 |
| `xingyue-control-center-wand-button` | 魔棒菜单里的入口按钮 |
| `xingyue-hud-drawer` | 移动端 HUD 抽屉 |
| `xy-phone-root` | 星月小手机 |
| `kdn-statusbar-root` | 怪谈小手机 |

## 实现摘录

```javascript
// 消息楼：只扫 data，不要扫 class
document.querySelectorAll('[data-xy-omni]:not([data-xy-omni-ready])');
document.querySelectorAll('[data-xyopt-root]');
```

```css
/* 消息楼样式：属性选择器 */
[data-xy-omni="analysis"] summary::-webkit-details-marker { display: none; }
[data-xyopt-list] { display: grid; }

/* 会失配（ST 加了 custom-） */
.omni-analysis summary::marker { display: none; }
```

```javascript
// 气泡：兼容「还没加前缀 / 已经 custom-」两种
node.querySelector(
  '[data-xy-dialog-content-source], .xy-dialog-content-source, .custom-xy-dialog-content-source'
);
```

## 边界

- 本页列的是**协议属性**，不是把每张卡的皮肤 class 抄一遍。`data-kdn-charm="crystal"` 这类是皮肤开关，不是新的一层文档。
- 未展开 Zod 私密字段，也未把 `control_center.js` 内嵌 fallback 整段搬进来。
- 末日之后 / 终末浮城的 DOM 名只当设计档，不写进本页主表。
- 酒馆助手官方 API 名仍以 ST / TH 文档为准；本页是卡侧 DOM 约定。

## 相关内容

- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/角色卡技术路径总图]]
- [[concepts/小手机与宿主桥]]
- [[concepts/行动选项桥]]
- [[concepts/OMNI正则与data属性选择器]]
- [[concepts/控制中心与状态栏]]
- [[concepts/角色卡前端名词中英对照]]
- [[entities/星月私立高等学院]]
- [[entities/怪谈笔记绮罗世界]]
- [[entities/交错宙域]]
