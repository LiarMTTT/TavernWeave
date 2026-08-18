---
title: 入口外壳与 HUD 宿主
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
  - 角色卡工作区/ST开发指南DB/C11_悬浮球与功能入口.md
  - 角色卡工作区/ST开发指南DB/C12_抽屉式状态栏-移动端方案.md
  - 角色卡工作区/ST开发指南DB/C13_浮窗式状态栏.md
  - 角色卡工作区/ST开发指南DB/C2_前端应用-状态栏与控制中心.md
  - 角色卡工作区/星月/星月 4.0.0/components/control_center.js
knowledge_class: factual
---

# 入口外壳与 HUD 宿主

玩家从哪点开面板，和面板里读什么变量，是两层。C11 / C12 / C13 管入口外壳；内容链仍归 C2 和 [[concepts/控制中心与状态栏]]。

## 三件外壳

| 手册 | 形态 | 稳定卡怎么用 |
|---|---|---|
| C11 | 桌面悬浮球 | 只分发命令：打开控制中心、状态栏、小手机。球自己不读 `stat_data` |
| C12 | 移动端抽屉 | 安全区、软键盘、`visualViewport`。小手机可以住在抽屉里 |
| C13 | 浮窗 / 弹出层 | 确认、媒体管理、设置。不要再造第四套宿主 |

内容仍走：正则铺壳 → TH ` ```html ` iframe → `getVariables` / `Mvu.getMvuData` → `VARIABLE_UPDATE_ENDED`。

## 宿主窗口

脚本经常跑在消息 iframe 或控制中心 script-iframe 里。要摸 ST 输入框、`document.body`、TH 全局，必须 `hostWindow()` / `hostDocument()` 向上爬，不能假定当前 `window` 就是酒馆主窗。认窗见 [[concepts/酒馆宿主与iframe分层]]。卡侧 `data-*` 见 [[concepts/角色卡DOM与挂载点]]。

## 谁挂在哪

| 表面 | 挂哪 | 几份 |
|---|---|---|
| 正则状态栏 | 消息楼 iframe / blob | 每楼可能一份，要去重 |
| git-mount 真身 | 薄壳 iframe 里的 blob | 外层壳同步高度 |
| 小手机 | 宿主 `document.body` | 单例 |
| 控制中心 | TH 脚本 iframe | 一份 runtime |
| 悬浮球 | 宿主层 | 一份，只发命令 |

交错 2.6.2 把整页 HUD 塞进状态栏正则，入口和内容叠在同一份 HTML。星月 4.0.0 把入口、远程真身、小手机拆开。

## 边界

- C9 宿主美化（改 ST 自己的 CSS）不是这三张卡的主路径。
- C6 独立前端、C5 同层前端：未走。
- 悬浮球拖尾 / 玻璃手感属于视觉项：先沙盘后实装，本页不记像素值。

## 相关内容

- [[concepts/控制中心与状态栏]]
- [[concepts/小手机与宿主桥]]
- [[concepts/git挂载与远程真身]]
- [[concepts/酒馆宿主与iframe分层]]
- [[comparisons/三张稳定卡前端对照]]
- [[concepts/角色卡技术路径总图]]
