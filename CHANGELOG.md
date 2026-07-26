# Changelog

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
