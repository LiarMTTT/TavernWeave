---
title: 组件库 registry 与 recipe
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
  - raw/workshop-cards-2026-08-13/模块化组件-README.md
  - raw/workshop-cards-2026-08-13/星月-README.md
knowledge_class: factual
---

# 组件库 registry 与 recipe

## 一句话定义

`模块化组件/registry.json` 是同源卡可复用源码的机器真源；recipe 只选择模块并声明输出，不保存第二份构建逻辑。

## 为什么重要

版本目录里的 `components/` 是发布快照。长期结构改在组件库，不在某一版快照里改目录形状。

## 如何运作

三档组装：

| 档 | 英文 | 做什么 |
|---|---|---|
| 变量核心 | `variable_core` | 只生成变量链路 |
| 组件装配 | `component_assembly` | 生成某张卡的装配适配 |
| 发布 | `release` | 必须生成 recipe 声明的 `requiredOutputs` |

入口命令（工作区根）：

```powershell
node card_workflow/tools/workflow_components.mjs --mode check
node card_workflow/tools/workflow_components.mjs --mode compose --recipe 模块化组件/recipes/xingyue-academy-v3.9.6.json --out "星月/星月 3.9.6/components"
```

字段整链必须同步：

```text
InitialVariables → Zod → full/compact 更新规则 → output_format
                 → cfMvuVarGroups → runtime / status bar
```

世界书、MVU、正则、Tavern Helper 是不同运行层，依赖写进 registry，不靠隐式全局。

## 例子

- 正例：星月 3.9.6 recipe 声明 25 项 `requiredOutputs`，因为状态栏真身改由 runtime 提供，不再本地生成完整 `status_bar_regex.html`。
- 反例：为凑旧门禁去启用 2.5.0 组件，把已经卸掉的 EJS / 全量状态栏 HTML 又装回来。

## 边界与易混概念

- CSV / XLSX 组件索引是给人看的导出，不参与构建。
- 普通版本迭代只动版本快照；只有明确「更新/回落组件库」才改 `模块化组件/`。
- 替换公共组件必须双向登记 `replaces` / `replacedBy`。

## 来源与证据

- 来源一：`raw/workshop-cards-2026-08-13/模块化组件-README.md`。摄入时组件库版本写 `0.4.0`，最新回落源是怪谈笔记 `0.9.7`，星月 release recipe 仍是 `xingyue-academy-v3.9.6.json`。
- 来源二：`raw/workshop-cards-2026-08-13/星月-README.md` 写组件库 `0.3.0`、源卡 `3.9.6`。
- 已知冲突：README 之间的 libraryVersion 与「当前稳定头」不一致。暂采纳：指针与星月 README 记录 2026-07-18 的 3.9.6 关闭点；组件库 README 记录此后又纳入怪谈笔记并升到 0.4.0；`星月 4.0.0/` 是更后的云酒馆竞态修复快照，recipe 未必已切。见 [[entities/星月私立高等学院]]。

## 相关内容

- [[concepts/角色卡升格]]
- [[concepts/打包回封路径]]
- [[concepts/角色卡前端名词中英对照]]
- [[entities/星月私立高等学院]]
