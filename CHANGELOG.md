# Changelog

## 0.5.0 - 2026-08-08

### 组件级更新交付

- 新增 `sillytavern-component-update`。用户可明确选择只生成可导入测试的正则/酒馆助手脚本组件，或生成整卡 pipeline handoff；组件模式不会产出角色卡 JSON/PNG。
- 新增 dry-run 计划、稳定 ID、输出路径、SHA-256、助手脚本按钮/数据与未知字段保留检查，避免为了修改一个组件而静默重封整卡。

### 正则、安全与数据库卡验证

- 新增 `sillytavern-render-regex-pipeline`，用 fixture 检查正则方言、placement/source、display/prompt、深度和替换结果，并明确列出离线工具无法替代的真实酒馆阶段。
- 新增 `sillytavern-rolecard-security`，只读扫描 HTML sink、动态执行、远程 JavaScript、跨帧通信、凭据形状、iframe 权限和可疑正则；报告不包含凭据值或代码长摘录。
- 新增 `sillytavern-database-rolecards`，校验卡内表结构、主键、类型、默认值、字段绑定及幂等迁移；同层兼容路线继续以 `DBR-C8-UNVERIFIED` 阻止，直到真实 SillyTavern 验收转正。

### 扩展、性能与媒体运行时

- 新增 `sillytavern-extension-dev`，提供 dry-run UI 扩展脚手架、manifest/入口/hook 校验和惰性能力快照门；默认不安装、不更新、不刷新真实酒馆。
- 新增 `sillytavern-rolecard-performance`，脱敏统计整卡、提示词、世界书、正则、助手脚本、远程引用与内嵌数据预算，并独立校验具名真实环境采集的 p50/p95 样本。
- 新增 `sillytavern-media-live2d-runtime`，校验本地媒体哈希、远程依赖、预加载预算、Tavern Helper 音频通道与 Live2D provider/fallback/销毁绑定；离线阶段不下载或执行远程资产。

### 发布门

- 七个新 Skill 均附 Node 脚本和可复跑 fixture；正式校验新增 JavaScript 语法检查与逐文件 Node 测试。
- replay 路由扩展到组件更新、正则阶段、安全审计、数据库卡迁移、扩展工程、大卡性能和媒体生命周期，并继续区分静态证据与真实运行时验收。

## 0.4.0 - 2026-07-26

### 新增角色卡类型识别

- TW 阵列现在会根据角色卡源码、卡内脚本和打包结果识别纯文字卡、MVU 卡、MVU Zod 卡和混合型角色卡，再执行对应检查。
- 纯文字卡不会再收到无关的 MVU、Zod、正则或脚本安装提醒。

### 新增配套资源提醒

- MVU Zod 卡会分别核对卡内变量结构脚本、国内/国外 MVU Zod 脚本、必需正则及其他助手脚本，发现缺失或启用状态错误时会明确列出，不再静默跳过。
- 依赖说明会区分已经随卡封装的内容、需要启用的酒馆扩展、运行时联网加载的内容以及仅供开发使用的工具，避免把所有依赖都写成用户安装项。
- 卡内 MVU Zod 脚本会继续按照角色卡既有的 Git/CDN 地址加载运行包；配套脚本已经随卡提供时，不要求用户另外安装 Zod。
- 国内版与国外版脚本会按照角色卡原有策略检查是否齐全以及哪一份应当启用，避免漏装、错选或同时启用。

### 组装与发布检查

- 缺少角色卡运行所必需的变量结构脚本、MVU Zod 国内/国外脚本、正则或其他助手脚本时，TW 会阻止组装或发布，直到缺失项得到处理。
- 远程加载内容不能只以“链接可以打开”作为完成依据；最终验收仍需在真实 SillyTavern 环境中确认脚本已经执行、相关功能可以正常使用。
- 升级 TW 不会自动改写已有角色卡；上述识别和提醒会在后续组装、补全或发布任务中生效。

## 0.3.0 - 2026-07-25

- Add independent custom CoT design and authoring for text cards, MVU cards, hybrid cards, plot direction, character behavior, NPC scheduling, system judgment, and output validation.
- Define the default `preset main CoT + card-specific increments + conditional modules` architecture, including stable phases, rule IDs, insertion order, semantic deduplication, prompt budgets, and generated full fallbacks.
- Separate author-written CoT prompts from hidden model reasoning, visible character thoughts, MVU `<analysis>`, update-model analysis, Zod schemas, and deterministic script calculation.
- Add ready-to-use lightweight, character/plot, and ensemble/system CoT templates plus explicit plot/update model routing and LLM/script ownership guidance.
- Define MVU zod same-generation and extra update-model routing, including marker matching, activation independence, shared-context budgeting, and a dual-mode acceptance matrix.
- Require card-bound and co-delivered worldbooks to resolve from the active manifest by stable ID and remain version- and content-aligned with maintained source.
- Extend manual replay coverage to 14 forward and 12 adversarial cases for custom CoT, dual-model prompt routing, script ownership, and stale worldbook packaging.

## 0.2.0 - 2026-07-22

- Add project-provided watch builds to the card-pipeline adapter contract.
- Connect source rebuilds, Tavern Helper real-time listener reloads, and real-SillyTavern execution evidence across the pipeline, embedded UI, and runtime-debug skills.
- Keep watch output as a development candidate and require a production build for final acceptance and release.

## 0.1.0 - 2026-07-22

- Establish the TavernWeave plugin and personal marketplace entry.
- Consolidate the four-part code cleanup workflow.
- Split rolecard authoring, components, pipeline, API, runtime, and embedded UI responsibilities.
- Add publishable derivatives for shadcn/Tailwind UI work and rolecard workshop operations.
- Pin API navigation to reproducible public upstream revisions without vendoring declarations.
- Gate releases on Python tests plus fingerprinted manual forward/adversarial replay evidence.
- Add a guarded personal-marketplace registration command and ESM-aware Tailwind config output.
- Add Claude Code plugin and marketplace manifests without duplicating the Skill array.
- License TavernWeave-authored material under PolyForm Noncommercial 1.0.0.
