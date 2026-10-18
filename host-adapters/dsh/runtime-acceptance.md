# TavernWeave X DSH 运行时验收记录（进行中）

> 机器合同：[`dsh-plugin-contract.json`](dsh-plugin-contract.json)。在 `runtimeAccepted` 翻转为 `true` 之前，本文件只记录部分证据。

## 已完成：SDK JSON-RPC 运行时的真实模型轮次（2026-10-18）

- DSH：`0.2.1-rc.2`（本机安装版 `@deepseek-ai/dsh` 版本）
- 安装路径：把构建出的 `TavernWeave-DSH-v2.1.0.tgz` 解压后，用 bundled `dsh` CLI 安装进隔离 profile：
  `dsh plugin --profile twsdk add link:<extracted package>`（bundle 自动追加到 profile 的 `dsh.profile.bundles`）。
- 由于 `sdk` profile 不含 agent-preset 注册表，测试用 `--patch` 把 host 插件作为全局行挂载；这与正式 preset 路径共享同一个 `index.js` 与同一份打包内容。
- 客户端：自写 JSON-RPC stdio 客户端（`dsh-sdk-acceptance.mjs`），`initialize` 使用 `provider=deepseek-account, model=deepseek-flash, reasoningEffort=max`，向会话发送一条中文提示词。
- 观测结果（会话 `tw-acceptance-1792311534928`）：
  - agent 调用了 `skill` 工具并加载 `consult-tavernweave-library`，工具结果包含完整 Skill 正文与 `<skill_resources>` 目录提示；
  - 会话目录含全部 23 个 TavernWeave Skill（`activate-tavernweave-soul` … `worldbook-design-and-writing`），另有 2 个来自该 profile 自身文件系统 provider 的环境 Skill（非 TW）；
  - 模型在 reasoning 中引用了 **TavernWeave Host Front Door** 的规则，并在正式回复中逐字引用了其中一条英文规则，说明 system-prompt section 注入对模型可见；
  - 单轮 usage：input 2004 / output 1048 / cache-read 11264 tokens（一次小请求）。
- 证据文件（默认工作区，不随仓库分发）：`reviews/dsh-acceptance/sdk-result.json`、`sdk-notifications.json`。

## 尚未完成（转正前必须补）

- DSH Desktop 插件页从发行资产安装、启用 bundle；
- 新建任务选择 **TavernWeave X DSH** preset 并真实执行一个 TW 任务；
- 禁用/卸载后确认注册项清理干净；
- Linux/WSL 路径与 bash 分支；
- 真实 SillyTavern 与模型效果（与安装验收分开，不得合并声明）。
