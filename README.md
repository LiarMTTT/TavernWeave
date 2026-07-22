# TavernWeave

TavernWeave 是一套面向 Codex 的 SillyTavern 角色卡工程 Skill 阵列，覆盖角色卡设计、MVU 变量系统、模块化源码、构建发布、API 查证、真实运行时调试、嵌入式 UI、创意工坊运维与代码质量控制。

> TavernWeave 原创内容采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许非商业使用、修改和分发；未经版权方另行授权，原版、修改版及再分发版本均不得用于商业目的。分发时须保留许可证和版权声明。第三方内容仍适用其[各自的许可证](THIRD_PARTY_NOTICES.md)。

## Skill 阵列

| Skill | 主要职责 |
| --- | --- |
| `tavern-card-builder` | 设计文字卡或 MVU 变量卡，处理 schema、初始化、更新规则、世界书、提示词和开局协议 |
| `sillytavern-card-components` | 无损拆卡、组件边界、依赖声明、registry/recipe 与往返一致性 |
| `sillytavern-card-pipeline` | 从维护源码组装、验证、打包 JSON/PNG，并执行版本与发布门 |
| `sillytavern-api-reference` | 查证 SillyTavern、Tavern Helper、STScript、EJS、宏和 MVU 的版本敏感 API |
| `sillytavern-runtime-debug` | 在真实 SillyTavern 中复现问题，检查 iframe、控制台、DOM、样式、数据和生命周期 |
| `sillytavern-embedded-ui` | 设计或审查开局页、状态栏、控制中心、抽屉和弹窗 |
| `code-quality-workflow` | 统一执行代码审计、重构门控、最小修复、优化与回归验证 |
| `shadcn-tailwind-ui` | 使用 React、shadcn/ui、Radix 和 Tailwind 构建可访问产品界面 |
| `rolecard-workshop-ops` | 诊断与运维可配置的角色卡工坊发布链，同时保护生产坐标和凭据 |

## 安装

将仓库克隆到个人 marketplace 的标准插件路径：

```powershell
$sourceRoot = Join-Path $env:USERPROFILE 'plugins\tavernweave-agent-skills'
if (Test-Path -LiteralPath $sourceRoot) {
    throw "目标已存在：$sourceRoot"
}

git clone -- https://github.com/LiarMTTT/TavernWeave.git $sourceRoot
Set-Location $sourceRoot
powershell -File scripts/register-local.ps1
codex plugin add tavernweave-agent-skills@personal
```

`register-local.ps1` 只创建或更新 TavernWeave 在个人 marketplace 中的条目，不会覆盖其他插件。若仓库实际位于其他位置，可先在标准插件路径建立目录联接。

安装或更新后，请新建一个 Codex 任务再测试 Skill 触发。

## 更新

```powershell
Set-Location "$env:USERPROFILE\plugins\tavernweave-agent-skills"
git pull --ff-only
powershell -File scripts/register-local.ps1
codex plugin add tavernweave-agent-skills@personal
```
