---
title: MVU 变量闭环
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
  - 角色卡工作区/ST开发指南DB/B1_变量更新规则.md
  - 角色卡工作区/星月/星月 4.0.0/components/mvu_update_output_format.txt
  - 角色卡工作区/星月/星月 4.0.0/components/mvu_zod_cn.js
  - 角色卡工作区/星月/星月 4.0.0/components/zod_schema.js
knowledge_class: factual
---

# MVU 变量闭环

稳定卡的状态不靠模型「口头记住」，靠 MVU 三层：世界书教模型怎么改，bundle 真改，Zod 拦非法结构。指南真源是 `ST开发指南DB/B1_变量更新规则.md`。

## 三层

| 层 | 星月 4.0.0 文件 | 职责 |
|---|---|---|
| 规则进 prompt | `mvu_update_full.txt` / `_compact.txt` / `_output_format.txt`，世界书条目带 `[mvu_update]` | 告诉模型输出什么块 |
| bundle | `mvu_zod_cn.js` / `mvu_zod_global.js` 先等世界书 Ready，再 `import` MagVarUpdate `bundle.js` | 解析 `<UpdateVariable>`，打补丁，发事件 |
| schema | `zod_schema.js` | 结构约束；中英两套注册 |

`stat_data` 给下一轮模型和 HUD 读。`display_data` 只给前端。VWD `[value, desc]` 二元组在实战卡里已弃，路径直接指值，如 `/环境/时间`。

## 事件名必须用枚举

MVU 源码把初始化事件拼成 `'mag_variable_initiailized'`（`initiailized`，双 i）。这是库的已知拼写。**必须写 `Mvu.events.VARIABLE_INITIALIZED`，禁止手写字符串。** 手写正确英文会订阅到一个不存在的事件，HUD 永远不刷新。

刷新主挂点仍是 `Mvu.events.VARIABLE_UPDATE_ENDED`。

使用前 `await waitGlobalInitialized('Mvu')`（或生产卡的 Ready 信号 + 轮询降级）。

## 模型必须吐的块

星月 4.0.0 输出格式（节选语义，不是整份规则）：

```text
正文
<UpdateVariable>
<analysis>…本轮事实…</analysis>
<JSONPatch>
[{"op":"replace","path":"/<顶层根>/…","value":…}]
</JSONPatch>
</UpdateVariable>
```

硬约束：块在回复末尾且只有一个；`<analysis>` 必须在块内、在 JSONPatch 前；`op` 只用 `add` / `replace` / `remove` / `move`。顶层根白名单写在输出格式里，星月 4.0.0 包括：环境、user、天赋与技能、角色档案、资产库、配方、规则变化、任务、近期事件、雷达系统、居所、载具、莉莉丝的商店。

OMNI 青框展示的是这段 `<analysis>`，绿框展示同步结果。见 [[concepts/OMNI正则与data属性选择器]]。

## 脚本怎么挂上 bundle

`mvu_zod_cn.js` 先等 `XingyueWorldbookReady`（以及交错/融合时代同名 Ready），再从 `testingcf.jsdelivr.net` 拉 `MagVarUpdate/artifact/bundle.js`。全球档走 `cdn.jsdelivr.net`。两套内容相同，按网络选。

## HUD 怎么读

C2 四层：正则把状态栏 HTML 变成 iframe → iframe 里 `getVariables({type:'message'})` 或 `Mvu.getMvuData()` → 画 DOM → 听 `Mvu.events.VARIABLE_UPDATE_ENDED` 刷新。

星月 git-mount 的 blob 真身没有 TH 全局，必须 `injectBridge`，否则全是 `--`。见 [[concepts/git挂载与远程真身]]。

怪谈小手机用提交去抖后的快照，不靠消息楼 `<UpdateVariable>` 当挂载条件。见 [[concepts/小手机与宿主桥]]。

## 字段链

一条能回落的链：变量根 → 更新规则 → Zod → 状态栏读点。缺一截就不要做 HUD 花活。升格层序把变量放在最前，见 [[concepts/角色卡升格]]。

## 边界

- 不在本页展开 Zod 里的私密身体字段。
- 旧命令式更新规则见指南库归档 `B1_变量更新规则_命令式时代_归档.md`，稳定卡不走。
- ST 原生 `{{getvar}}` 三层变量和 MVU `stat_data` 不是同一存储，不要混写。

## 相关内容

- [[concepts/角色卡技术路径总图]]
- [[concepts/世界书注入路径]]
- [[concepts/控制中心与状态栏]]
- [[concepts/斜杠命令与宿主发送链]]
