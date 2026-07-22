# TavernWeave

TavernWeave 是一套面向 Codex 与 Claude Code 的 SillyTavern 角色卡工程 Skill 阵列，覆盖角色卡设计、MVU 变量系统、模块化源码、构建发布、API 查证、真实运行时调试、嵌入式 UI、创意工坊运维与代码质量控制。

> TavernWeave 原创内容采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许非商业使用、修改和分发；未经版权方另行授权，原版、修改版及再分发版本均不得用于商业目的。分发时须保留许可证和版权声明。第三方内容仍适用其[各自的许可证](THIRD_PARTY_NOTICES.md)。

## Skill 阵列

| Skill | 主要职责 |
| --- | --- |
| `tavern-card-builder` | 设计文字卡或 MVU 变量卡，处理 schema、初始化、更新规则、世界书、提示词和开局协议 |
| `sillytavern-card-components` | 无损拆卡、组件边界、依赖声明、registry/recipe 与往返一致性 |
| `sillytavern-card-pipeline` | 驱动项目自带实时编译，并从维护源码组装、验证、打包 JSON/PNG，执行版本与发布门 |
| `sillytavern-api-reference` | 查证 SillyTavern、Tavern Helper、STScript、EJS、宏和 MVU 的版本敏感 API |
| `sillytavern-runtime-debug` | 在真实 SillyTavern 中复现问题，检查 iframe、控制台、DOM、样式、数据和生命周期 |
| `sillytavern-embedded-ui` | 设计或审查开局页、状态栏、控制中心、抽屉和弹窗 |
| `code-quality-workflow` | 统一执行代码审计、重构门控、最小修复、优化与回归验证 |
| `shadcn-tailwind-ui` | 使用 React、shadcn/ui、Radix 和 Tailwind 构建可访问产品界面 |
| `rolecard-workshop-ops` | 诊断与运维可配置的角色卡工坊发布链，同时保护生产坐标和凭据 |

## 安装

把仓库链接交给 Codex 或 Claude Code，并让 Agent 安装、启用 TavernWeave：

```text
请安装并启用这个 Skill 仓库：
https://github.com/LiarMTTT/TavernWeave
```

Agent 会根据当前环境选择 Codex 或 Claude Code 的安装入口。安装完成后，新建任务或会话再使用 Skill。

## 更新

```text
请把已安装的 TavernWeave 更新到这个仓库的最新版本：
https://github.com/LiarMTTT/TavernWeave
```
