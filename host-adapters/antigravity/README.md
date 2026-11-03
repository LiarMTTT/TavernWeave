# Antigravity / AGY 适配

此适配把现有 23 个 Skill、由维护源生成的 Host Front Door 常驻规则，以及 AGY 工具名的 `tavernweave` Agent 组成一个原生插件。它不设置默认引导挡位，也不启用持续洗稿。模型执行、IDE 界面与真实 SillyTavern 验收分别记录。

## 构建与安装

需要 Node.js 22 或更新版本，以及带 `plugin validate` 命令的 AGY CLI。以下构建命令在源码仓库根运行：

```sh
node scripts/build-antigravity-plugin.mjs --check
node scripts/build-antigravity-plugin.mjs
```

构建结果在 `dist/TavernWeave-Antigravity-v<版本>/`，版本来自 `tavernweave-install-manifest.json`。也可传 `--output-dir <新目录>`；构建器拒绝覆盖已有目录。它读取当前工作树，修改中的文件也会进入候选包；发行前必须审查并提交相应源码。生成目录不是新的维护源。

将下面的 `<生成目录>` 换成构建回执里的绝对路径：

```sh
agy plugin validate "<生成目录>" --strict --json
agy plugin install "<生成目录>"
agy plugin list --json
```

安装和更新均针对生成的 AGY 包。不要把仓库根直接作为 AGY 安装目标：仓库根仍是现有 Claude 插件，AGY 的 Claude 导入转换不属于这份原生适配的验收路径。更新前先检查 `plugin list --json` 的来源与实际路径；存在同名旧包时按本机 AGY 的更新提示处理，不另建不同名字的重复安装。

当前官方文档列出的全局插件目录为 `~/.gemini/config/plugins/`，项目目录为 `.agents/plugins/`；以实际 `plugin list --json` 回执为准。需要项目隔离验证时，将生成包放在测试项目的 `.agents/plugins/` 下，在该项目中检查发现结果。

生成包包含：

- `.antigravity-plugin/plugin.json`：AGY 原生清单。
- `skills/`：完整共用 Skill 目录，名称和 description 保持不变。
- `rules/AGENTS.md`：从 `host-adapters/tavernweave-front-door.md` 生成；不手改生成文件。
- `agents/tavernweave.md`：AGY 原生工具清单；用实际文件读取能力加载 Skill。
- `build-receipt.json`：文件构建回执，不冒充客户端加载或人类验收。

AGY 通过常驻规则加载前门，不使用 Claude 的 SessionStart hook、`CLAUDE_PLUGIN_ROOT` 或 Soul 切换 UI。因此无需向个人全局规则再安装一份前门；现有项目若已含前门，应核对版本和重复来源。`manage-host-front-door.ps1` 仍只管理 Codex/Claude 的全局文件。

## 挡位与持续洗稿

两个随包管理器均支持 `--host antigravity`，保留原有显式授权、仅预览受控区块、预览令牌、备份、编码和无关内容保护。

客户端 `--scope-root` 是已核实的 `.gemini` 目录（不是 `config/`）。支持的目标为其中的 `AGENTS.md`、`GEMINI.md`、`config/AGENTS.md`、`config/GEMINI.md`。若已有同类受控区块，沿用其目标；没有时可提议 `.gemini/AGENTS.md`，但不自动选择或保存任何偏好。

例如，只查询挡位：

```sh
node "<consult-skill-root>/scripts/manage-guidance-preference.mjs" --host antigravity --scope-root "<绝对路径/.gemini>" --target "<绝对路径/.gemini/AGENTS.md>"
```

洗稿管理器还支持 `--scope workspace`：`--scope-root` 为选定项目目录，目标可以是该目录的 `AGENTS.md` / `GEMINI.md` 或 `.agents/` 中的同名文件。旧 `.agent/`、`_agents/`、`_agent/` 别名也纳入检查。

AGY 的规则叠加读取，不采用 Codex 的首个非空文件优先规则。管理器会检查上述默认文件、默认规则目录的直接 `.md` 子文件，以及工作区到 Git 根的默认规则；其他文件已有同类受控区块时拒绝新增，保持原文件不动。预览令牌也绑定这些文件的内容，其他来源在预览后变化时须重新预览。

此管理器不解释自定义 `rules.json` 或 `@[label](path)` 引用；发现它们会停止并要求核对实际加载来源。其他插件、额外挂载工作区、宿主私有配置和规则总预算仍需在宿主里检查，文件回执不声称完整解析宿主。插件升级只更新包内容，不覆盖用户保存的挡位或洗稿区块。

## 验证与边界

```sh
node --test tests/antigravity-plugin.test.mjs tests/antigravity-persistence.test.mjs
```

静态验收应包含：23 个 Skill 的字节一致性、生成规则来源、AGY Agent 工具名、未夹带 Claude hook/UI、重复和冲突设置拒绝、预览后变更拦截、备份及无关内容保留。AGY 原生严格校验应显示 23 skills、1 agent、1 rule、0 hooks，且零错误、零警告。

本次验证快照（2026-11-04，Windows / AGY CLI 1.4.5）：

| 检查 | 观察结果 |
| --- | --- |
| AGY 包与设置保存、原有保存管理器 | 46 项通过、0 项失败 |
| Claude hook 与宿主设置文件映射回归 | 9 项通过、0 项失败 |
| 原生 `plugin validate --strict --json` | 23 skills、1 agent、1 rule、0 hooks，`findings: []` |
| 隔离 Git 项目中的 AGY 新会话 | 会话报告前门与测试插件路径下的 23 个 Skill 可见；同时报告本机另有同名全局副本，不能把这次结果解释为无重复安装 |
| 实际 Skill 读取 | 流式事件记录确认 `view_file` 读取测试包的 Soul / Library 主文件及必要参考；不是仅根据 description 推断 |
| Soul 解析与完整激活 | 解析脚本被无交互 `command` 权限门自动拒绝，未取得最终激活回执；未绕过权限门 |
| 隔离偏好查询 | 事件中查询工具完成，但该会话最终答复为空；此项不记为端到端验收通过 |
| 全量发行检查 | 未通过；基线已有 2.3.6 安装清单与 2.3.5 Codex/Claude 清单、DSH 断言不一致；本改动另使两个 Skill 的历史回放指纹过期 |

全量运行还出现过两次 Windows `EPERM` 重命名错误（AGY 设置用例及未改动的 mirror-history 用例）；单独重跑这两套用例为 40 通过、1 跳过、0 失败，原因未确定。历史回放尚未全量重跑，不能只刷新指纹冒充完成；继续保留旧证据并将该门列为待完成。App / IDE、真实用户设置的跨会话保存、完整口令流程和人类验收仍未完成。

实机验收单独记录客户端版本和表面（App / CLI / IDE），在新会话检查 Skill 和规则来源，再实际调用一个 Skill、Soul 口令及设置查询。保存设置的测试只能使用隔离目录或用户已授权的真实目标；不得为了测试替用户选择长期挡位。关闭、更新插件后还需检查是否有旧副本残留。静态校验、CLI 组件发现、模型遵循与 IDE UI 不是同一项证据。

Soul 图形切换界面、Claude hook 导入转换、AGY Marketplace 发布及真实 SillyTavern 行为不在此适配内。

官方依据（2026-11-04 核对）：[插件结构与规则](https://antigravity.google/docs/build-plugins)、[默认发现与累计规则](https://antigravity.google/docs/customization-discovery)、[插件安装与核验](https://antigravity.google/docs/plugins)、[Agent 配置](https://antigravity.google/docs/subagents)。
