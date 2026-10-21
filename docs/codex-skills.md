# Codex 使用与安装

TavernWeave 已有 23 个标准 Skill、各自的 `agents/openai.yaml` 和受支持的 `.codex-plugin/plugin.json`。本说明补充独立 Skill 的安装、路径解析和验收，不替换 Claude Code／DSH 的安装方式，也不修改用户的全局指令。

## 先选一种安装方式

- **插件方式**：使用 Codex 插件包及宿主当前提供的导入、市场或安装入口。包内的 `skills/` 由插件清单声明；不要将整个插件目录当作一个 Skill 塞入技能目录。账户侧启用见[统一插件指南](plugin-guide.md)。
- **独立 Skill 方式**：把完整的 23 个 Skill 目录放入当前 Codex 扫描的目录。常用位置是用户级 `~/.agents/skills/`，或目标项目的 `.agents/skills/`。仓库源码自己的 `skills/` 不等于项目级发现目录。

同一环境尽量选一种方式，避免插件、用户目录和项目目录各装一套同名 Skill。已有旧路径安装不要直接删除或迁移，先确认宿主实际加载的来源。`CODEX_HOME` 用于 Codex 配置，并不表示应把新安装目标机械替换成它的 `skills/` 子目录。

发现位置与调用方式依据[官方 Skills 文档](https://learn.chatgpt.com/docs/build-skills)核对；插件格式依据[官方打包文档](https://developers.openai.com/plugins/build/plugins)。现有兼容清单继续保留，不为适配而重命名 Skill 或强制改成另一种插件格式。

## 跨平台独立安装

需要 Python 3.9+。从本仓库或 Codex 插件包根目录运行，先看只读预览：

```sh
python3 scripts/install-codex-skills.py --target "$HOME/.agents/skills"
```

确认目标和变更清单后，再实际安装和核验：

```sh
python3 scripts/install-codex-skills.py --target "$HOME/.agents/skills" --apply
python3 scripts/install-codex-skills.py --target "$HOME/.agents/skills" --verify
```

Windows PowerShell 对应示例：

```powershell
py -3 scripts/install-codex-skills.py --target "$HOME/.agents/skills"
py -3 scripts/install-codex-skills.py --target "$HOME/.agents/skills" --apply
py -3 scripts/install-codex-skills.py --target "$HOME/.agents/skills" --verify
```

仅限某个项目使用时，将 `--target` 换成该项目真实路径，例如 `"/absolute/path/to/my-project/.agents/skills"`。脚本必须从 TavernWeave 的副本读取，不允许把安装目标放回同一份源码树。

如果同名 Skill 已有改动，预览会列出 `changedSkills`，默认不会覆盖。确认要替换后，使用相同目标并增加 `--apply --replace`。原目录会保留在回执 `backup` 指向的位置，位于扫描目录之外；无关个人 Skill 保持不变。需要恢复时先比较现有文件与备份，再明确选择要恢复的目录，不要自动回滚后来新增的工作。

安装器只复制技能及其资源，核对完整清单与文件哈希。不联网、不运行复制来的代码、不写 `AGENTS.md`／`CLAUDE.md`、不注册插件，也不处理偏好设置。链接、junction 和重解析路径会被保守拒绝；如确需在对应位置安装，先核实实际非链接目录。它处理普通文件操作失败的回滚，但不宣称具备断电事务恢复能力。`installed-with-cleanup-warning` 表示技能已安装，仅清理或回执落盘发生问题；按 `backup`／`retainedWorkDirectory` 查看保留内容，不要盲目重复安装。

原 PowerShell 安装器及独立授权的 Host Front Door 流程仍可用，见[安装与更新](../README.md#安装与更新)。

## 实际调用，不只检查文件

独立安装后，在目标项目的新任务里用 `/skills` 或输入 `$` 检查可见条目，再发出一个小请求：

```text
使用 $consult-tavernweave-library 为“角色卡世界书规划”选择最少的相关资料。
先说明当前加载的 Skill 来源；有 Node 时运行随包路由，没有终端时只读对应路由资料，并明确哪些检查没运行。
```

ChatGPT 的插件界面使用当前提供的技能选择入口，不必照搬 CLI 命令。任务里的 `$skill-name` 是调用意图，不是 shell 命令；带插件前缀时采用宿主返回的完整标识。Codex 通常会检测技能变化，未出现时重启后重试；本项目仍要求新任务观察，作为独立于文件安装的验收证据。

验证分开记录：

1. `--verify` 的 `matchedSkills: 23`：安装文件与选定源码匹配。
2. `quick_validate.py`：Skill 格式检查，不证明被选中或正确执行。
3. 当前宿主技能列表：发现状态；记录实际来源，检查重名。
4. 新任务选中技能、读到资料并完成小成果：调用观察。
5. Node／Python、浏览器、真实 SillyTavern、设备和人工验收：各自单独检查，不能相互替代。

## 脚本与资源路径

保留 23 个兄弟 Skill 目录及资源，不要只复制入口文件。`<skill-root>` 始终是当前所用 `SKILL.md` 的真实目录；输入和输出使用项目目录。带空格的路径作为完整参数引用。`skill://...` 只是宿主资源定位符，不能直接交给 Node 或 Python。

从任意项目目录使用一个已解析的绝对路径：

```sh
node "/absolute/skills/consult-tavernweave-library/scripts/query-library.mjs" --skill tavern-card-builder --intent "rolecard" --limit 1
```

没有终端时，Library Skill 可以按其说明只读机器路由与所需资料，报告路由脚本未执行。不能因为插件已加载就假定本机文件、登录态、浏览器或云端运行时可用。

项目指令遵守宿主实际加载链，包括有效的 `AGENTS.override.md`、`AGENTS.md` 与配置的备用名。安装映射不是项目规则的上级权威；见[官方 AGENTS.md 说明](https://learn.chatgpt.com/docs/agent-configuration/agents-md)。

## 维护者回归

```sh
python3 -B tests/test_codex_skill_install.py
python3 -B tests/test_plugin_packages.py
node --test tests/codex-skill-distribution.test.mjs
node scripts/sync-guidance.mjs --check
```

安装测试使用临时目录，覆盖预览、完整安装、幂等、备份、冲突、并发改动、回滚和路径限制，并从独立安装树运行资料路由及文本精修测试。它不触碰真实用户的 Codex 配置，也不代表已经完成所有操作系统或桌面插件的运行验收。
