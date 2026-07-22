# TavernWeave

TavernWeave 是一套面向 Codex 的 SillyTavern 角色卡工程 Skill 阵列，覆盖角色卡设计、MVU 变量系统、模块化源码、构建发布、API 查证、真实运行时调试、嵌入式 UI、创意工坊运维与代码质量控制。

仓库只保存可公开、可复用的流程与工具。项目专属适配、生产环境坐标、个人内置数据和开发日志不会进入公开历史或发布包。

> TavernWeave 使用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许个人学习、研究、实验、爱好项目及其他非商用用途；商业使用需另行取得书面授权。

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

## 职责边界

- `tavern-card-builder` 是制卡入口，不负责替代精确 API 查证、真实运行时验收或发布操作。
- 拆卡与组装分开：组件 Skill 管源码边界，Pipeline Skill 管构建产物与发布门。
- UI Skill 负责设计、实现和静态检查；真实 SillyTavern 验收只由 Runtime Debug Skill 闭环。
- Code Quality Skill 默认先审计和门控，不因“代码难看”直接重写稳定模块。
- Workshop Skill 只公开通用配置合同与安全流程，不包含真实主机、SSH 别名、密钥文件名或浏览器存储键。

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
powershell -File scripts/bootstrap-dev.ps1

& .\.private\venv\Scripts\python.exe `
  "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\update_plugin_cachebuster.py" `
  .

codex plugin add tavernweave-agent-skills@personal
```

## 开发与验证

首次准备本地验证环境：

```powershell
powershell -File scripts/bootstrap-dev.ps1
```

提交或打包前运行：

```powershell
powershell -File scripts/validate-release.ps1
powershell -File scripts/validate-with-codex-tools.ps1
powershell -File scripts/package-release.ps1
```

发布验证会检查：

- 9 个 Skill 与 plugin manifest 的结构；
- UTF-8、Markdown 链接、PowerShell 语法和 Python 测试；
- 私有路径、凭据形态、日志、HAR、trace、性能快照和调试产物；
- 正向及对抗回放结果是否齐全，并与当前 Skill 内容指纹一致；
- 发布 ZIP 是否只包含 Git tracked 文件。

修改任一 Skill 后，必须用新鲜隔离任务重新执行 `tests/replay/` 中的用例，再运行：

```powershell
powershell -File scripts/refresh-replay-fingerprints.ps1 -ConfirmedManualReplay
```

## 发布原则

- 维护源码与生成产物分离；修源码后重新构建，不直接修补发布包。
- 旧版发布物默认保留，新版本使用独立版本号和产物路径。
- 离线检查只能形成候选版本；运行时行为必须在真实 SillyTavern 中验收。
- API 导航固定到公开上游 revision，但目标安装版本和实际运行时始终优先。
- 不提交生产端点、凭据、私有绝对路径、项目数据或开发过程日志。

## 许可

TavernWeave 原创内容采用 [PolyForm Noncommercial License 1.0.0](LICENSE)，属于 source-available，而不是 OSI Open Source。商业使用未获默认授权。

仓库引用的独立上游项目继续适用各自许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
