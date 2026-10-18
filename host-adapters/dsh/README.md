# TavernWeave X DSH（DeepSeek Harness 插件包）

这是 TavernWeave 2.1.0 起的 **DSH 正式适配入口**：一个可安装的 DeepSeek Harness bundle 插件包，内含 23 个 TavernWeave Skill、Host Front Door 和可选的 `tavernweave` Agent 预设。

> 旧的 TW Lite 离线预设（`tw-lite-entry` / `tw-lite-full` / `tw-lite-contract.json`）自 2.1.0 起已移除，不再维护。仓库历史里仍可追溯。

## 组成

| 文件 | 作用 |
|---|---|
| [`plugin/index.js`](plugin/index.js) | Host 插件：注册 23 个 Skill（带资源基目录）、注入 Host Front Door |
| [`plugin/cordis.patch.yml`](plugin/cordis.patch.yml) | Bundle patch：插入 `tavernweave` preset（含 persona/instructions/终端/fs/skill/ask-user/present/compaction） |
| [`plugin/package.template.json`](plugin/package.template.json) | 包元数据模板，构建时写入版本号 |
| [`plugin/locale/`](plugin/locale/)、[`plugin/icon.svg`](plugin/icon.svg) | 插件页展示元信息 |
| [`dsh-plugin-contract.json`](dsh-plugin-contract.json) | 机器合同：审计版本、组成、安装/卸载、运行时门禁 |
| [`../../scripts/build-dsh-plugin.mjs`](../../scripts/build-dsh-plugin.mjs) | 生成 `.tgz` 发行资产并做包内校验 |

## 安装

### 桌面版（DSH Desktop）

1. 取得发行资产 `TavernWeave-DSH-v2.1.0.tgz`（或解压后的目录）；
2. 侧栏 **插件 → 添加插件 → 安装第三方插件**；
3. 填入本地路径或 `.tgz`，完成安装并启用 bundle；
4. 新建任务 → Agent preset 选择 **TavernWeave X DSH**。

### CLI / Web profile

```sh
dsh plugin --profile <profile> add <本地路径|tarball|git 地址|包名>
```

`desktop` profile 由 Desktop shell 管理：Desktop 自带运行时的 `dsh plugin --profile desktop ...` 可以执行；通过 npm 安装的 `dsh` CLI 会拒绝该 profile。普通用户优先在插件页操作。

## 与现有 TW 包的关系

- Codex / Claude Code 的 ZIP 与技能包安装方式**保持不变**；
- DSH 使用本插件包，不再需要把 `skills/` 复制到 `.agents/skills`；
- 如果之前把 TW 的 Host Front Door 写进了 `AGENTS.md`，DSH 里应移除该区块，避免与插件注入重复（Codex/Claude 仍保留）。

## 当前状态

- `dsh-plugin-contract.json` 的 `runtimeAccepted` 记录真实 DSH 安装验收是否完成；在翻转为 `true` 前，一切能力声明只到"包结构/静态检查 + 部分运行证据"层级。
- 已完成部分：打包 tgz 安装进隔离 SDK profile，真实模型轮次中 `skill` 工具成功加载 `consult-tavernweave-library`，目录含全部 23 个 TW Skill，模型逐字引用 Host Front Door 规则（详见 [runtime-acceptance.md](runtime-acceptance.md)）。
- 已完成：DSH Desktop 插件页出现 bundle、新任务选择 `TavernWeave X DSH` preset、23 个 Skill 目录、`开启soul模式` 激活 Soul（见 `runtime-acceptance.md`）。
- 尚未完成：pwsh 依赖任务（当前 OneDrive reparse-point 工作区被 DSH workspace-write 沙箱挡住，见合同 knownEnvironmentIssues；可切完全权限或换普通目录后重测）、禁用/卸载清理、Linux/WSL、真实 SillyTavern 与模型效果。
- 不支持（v1）：偏好持久化、专用 UI、客户端扩展。
