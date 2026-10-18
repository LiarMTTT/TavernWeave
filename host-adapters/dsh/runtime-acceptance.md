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

## 第二轮：Soul 模式真实激活（同一 SDK 运行时，2026-10-18）

- 输入：`开启Soul模式`
- 观测（会话 `tw-acceptance-1792312025185`）：
  - agent 调用 `skill` 工具，参数为 `{"name": "activate-tavernweave-soul"}`，并读取 persona-kernel、mode-contract、atong-mode 等随包 references；
  - 执行 `scripts/resolve-soul-command.mjs "开启 Soul 模式"`，返回 **Soul Mode 已开启（任务级 / Portable，阿瞳）**，并按插件执行合同汇报人格内核、创作者档案与引导挡位未设置；
  - 该轮同时尝试 `pwsh` 时遇到本机 DSH 沙箱 ACL 初始化失败（`SetNamedSecurityInfoW failed (Win32 5)`），agent 如实报告"命令解析脚本没跑通"，没有伪造成功回执。这是测试 profile 的终端沙箱问题，与插件/Skill 加载无关。
- 结论：Skill 目录、`skill` 工具、Soul Skill 的资源相对路径与 Front Door 路由在真实模型轮次中均生效；不包含终端沙箱可用性证明。

## 第三轮：DSH Desktop 图形界面实机验收（2026-10-18）

- 会话：`session-18841be2-eb38-43cc-b6fd-b4c7f4fc537e`，workspace `E:\OneDrive\ST-\TavernWeave`。
- 观测：
  - 会话日志出现 `agent-preset/selected` → `tavernweave`；界面顶部显示 **TavernWeave X DSH**，插件页已出现该 bundle；
  - 新任务 system-reminder 的 `available_skills` 含全部 23 个 TavernWeave Skill 与 Host Front Door；
  - 用户输入 `开启soul模式`，agent 调用 `skill` 工具加载 `activate-tavernweave-soul`，返回阿瞳 Soul Mode（任务级 / Portable），并如实报告终端命令未跑通；
  - 插件页图标第一版误画成 T+V（显示 `TV`），已改为 TW 字形路径并改为 `icon-tw.svg` 做缓存失效。
- 发现的环境问题（非插件缺陷）：
  - `pwsh` 工具报 `SetNamedSecurityInfoW failed (Win32 5): grantWrite(E:\OneDrive\ST-\TavernWeave)`，连 `Get-Location` 都失败；
  - 用随包 `diagnose-windows-sandbox-acl` 诊断：路径链上 `E:\OneDrive` 是 **reparse point**（OneDrive 重定向目录），脚本按设计拒绝穿越 reparse point 改 ACL，verdict `PRECONDITION`，`nextAction=stop`；报告在 `reviews/dsh-acceptance/acl-recovery/`。
  - 工作区在 OneDrive 重定向目录内时，DSH 的 workspace-write 沙箱无法完成 ACL 授权。解决办法：把该会话切到 **完全权限（full access）**，或把工作区放到非 reparse point 的普通目录（如 `E:\TavernWeave`）。
  - 这不是 TavernWeave 插件/Skill 的问题：preset、Skill 目录、Front Door、Soul 激活均已在同一会话生效。

## 第四轮：普通路径的 ACL 修复后，沙箱终端恢复（SDK 复核，2026-10-18）

- 对 `E:\Documents\deepseek-harness\default-workspace\reviews\dsh-acceptance` 运行随包诊断脚本：verdict `PRECONDITION` → 选中 grant 目标 → 备份 DACL → 添加当前用户 FullControl ACE → 复读验证 `writeOwner=true`（`GRANTED`，`nextAction=verify_original_confined_operation`）。
- 同一 SDK 会话随后发送 `开启Soul模式，然后运行 Get-Location 并告诉我结果`：agent 加载 Soul Skill 并进入阿瞳模式，`pwsh` 的 `Get-Location` **执行成功**，返回上述目录；不再出现 `SetNamedSecurityInfoW`。
- 结论：DSH 的 workspace-write 沙箱在普通本地目录上可以通过一次性 ACL 修复恢复；**OneDrive 重定向目录（reparse point）无法这样修复**，需要完全权限或换工作区。

## 尚未完成（转正前必须补）

- DSH Desktop 插件页从发行资产安装、启用 bundle；
- 新建任务选择 **TavernWeave X DSH** preset 并真实执行一个 TW 任务；
- 禁用/卸载后确认注册项清理干净；
- Linux/WSL 路径与 bash 分支；
- 真实 SillyTavern 与模型效果（与安装验收分开，不得合并声明）。
