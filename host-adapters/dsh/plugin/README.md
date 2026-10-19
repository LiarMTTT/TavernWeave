# TavernWeave X DSH

TavernWeave 的 DeepSeek Harness（DSH）插件包。

- 一个可选 Agent 预设 **TavernWeave X DSH**（preset id: `tavernweave`）；
- 包内直接携带 TavernWeave 的 **23 个 Skill**（不依赖用户先装技能包）；
- 自动注入 **TavernWeave Host Front Door**（不再要求写 `AGENTS.md`）；
- 包内同时携带 **神之手 DSH 客户端面板**：Skill 轮盘、完整浮窗、世界书、前端设计＆动效数据库、项目/卡管理；一次安装，不再单独装第二个 UI 包；
- 安装/升级/卸载走 DSH 自己的插件机制（bundle patch），不复制文件到用户技能目录。

## 要求

- DeepSeek Harness `0.2.1-rc.2`（`engines.dsh` 已声明；DSH 仍处于 Developer Preview，升级 DSH 后需重新核验）。
- 安装后新建会话，在 Agent preset 选择器里选择 **TavernWeave X DSH**。

## 安装（DSH 桌面版）

1. 解压发行资产或保留 `.tgz`；
2. 侧栏 **插件 → 添加插件 → 安装第三方插件**；
3. 选择本包（本地目录 / `.tgz`）；
4. 安装完成后启用该 bundle；
5. 新建任务，选择 **TavernWeave X DSH** preset。

## 安装（CLI / Web profile）

```sh
dsh plugin --profile <profile> add <包名|git 地址|tarball|本地路径>
```

`desktop` profile 由 Desktop shell 管理，不要直接用 `dsh plugin --profile desktop`。

## 卸载

在插件页停用并移除 **TavernWeave X DSH** bundle；或用 `dsh plugin --profile <profile> remove liarmttt-tavernweave-dsh`。
卸载后不残留技能目录或全局指令文件。

## 行为边界

- 提供 Skill、前门口径、可选 preset 和 DSH 客户端面板；不改变 DSH 的模型、账号、网络或权限设置。
- 不实现偏好持久化；四档大白话引导仍是当前任务内选择。
- 世界书/项目/卡管理只读写用户选定路径；卡内脚本不执行，卡内容不写回。
- 若之前单独装过旧 `godhand-dsh` UI 包，升级到本包前先移除旧包，避免同一套界面重复加载。
- 真实 SillyTavern、模型效果与跨平台验收与安装是不同证据，安装成功不等于这些已通过。
