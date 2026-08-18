---
title: OMNI 正则与 data 属性选择器
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
  - raw/workshop-cards-2026-08-13/交错宙域-v2.0.0-README.md
knowledge_class: factual
---

# OMNI 正则与 data 属性选择器

## 一句话定义

OMNI 是变量预分析 / 变量同步的消息楼美化层。选择器必须走 `data-*`，因为 SillyTavern 会给消息 HTML 的 class 加 `custom-` 前缀，class 选择器会失配。

## 为什么重要

用 class 写样式或查找挂载点，在真机上会变成裸白或吞正文。这是同源卡显示层的硬规则。

## 如何运作

两块面板：

| 中文 | 英文 / 代码 | 作用 |
|---|---|---|
| 预分析青框 | Panel A，`<analysis>`，`data-xy-omni="analysis"` | 只读展示思维链预分析 |
| 变量同步绿框 | Panel B，变量更新完成 | 展示同步结果；进度另有琥珀框 |

正则只做显示：`markdownOnly: true`，`promptOnly: false`。框出现在聊天里不等于泄漏进模型上下文。

匹配不能用裸 `[\s\S]*?` 跨标签。预分析用「不跨同名标签」的惰性匹配，防止模型在规划里裸写 `<analysis>` 时把整段正文吞进框。

挂载示例：

```html
<div data-xy-omni="analysis">
  <div data-xy-omni-raw><!-- 原文 --></div>
</div>
```

```css
[data-xy-omni="analysis"] summary::-webkit-details-marker {
  display: none;
}
```

`class="omni-analysis"` 只当可读装饰，不参与任何选择器。媒体库与控制中心提取挂载点同样走 data 属性。

视觉主体用内联 `style=`（clip-path、渐变、徽章）。`<style>` 块只隐藏 details marker。

## 例子

- 正例：交错宙域 OMNI 在生成结束后一次性 DOM 后处理，不改消息原文、不写变量、不监听流式 token。
- 反例：progress 版用 `[\s\S]*$` 吞正文；已从模块中删除。

## 边界与易混概念

- 编辑预分析、整楼重算 `rerollFromAnalysis` 属于控制中心 handler，不属于正则模块。
- 思维链里若出现完整 `<analysis>…</analysis>` 对，页面会多一个青框；功能无损害，正则层无法消掉。
- 指南库曾推断 DOMPurify 会剥内联 style；生产 OMNI 靠内联且真机可用，该推断按误报处理，仍以真机为准。

## 来源与证据

- `raw/workshop-cards-2026-08-13/analysis_omni-README.txt`
- `raw/workshop-cards-2026-08-13/交错宙域-v2.0.0-README.md`

## 相关内容

- [[concepts/消息渲染与正则管线]]
- [[concepts/媒体库路径]]
- [[concepts/控制中心与状态栏]]
- [[concepts/角色卡DOM与挂载点]]
- [[concepts/角色卡前端名词中英对照]]
