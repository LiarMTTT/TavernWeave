# Changelog

## 奶人教程 0.5.2 - 2026-07-26

在线阅读：[TavernWeave · Vibe Code 制卡入门](https://liarmttt.github.io/TavernWeave/newbie-guide/)

这次更新把教程从“会让 Agent 修改东西”，继续推进到“看懂 Agent 怎么工作，并能根据真实运行证据指挥它 Debug”。

### 新增与补全

- 第一至三章划为入门篇，第四章开始进入进阶篇。
- 补全第一章 02：用零基础能理解的方式解释 Agent 是什么、接到任务后怎样查看现场、使用工具、检查结果和继续修正。
- 加入新手指挥模板、含糊需求与可执行需求对比、实际反馈模板，以及用户和 Agent 的职责边界。
- 强调知识越全面，指挥 AI 的效率越高；暂时讲不清时，可以向 AI 提供可靠样本，让它先弄明白，再用你能听懂的方式教回来。
- 新增第四章“监听真实酒馆实例”，介绍真实 SillyTavern、调试 Probe、本机 Mock 接收端和 Agent 事件分析组成的调试链。
- 增加 Agent Mock 与 VS Code 的对比：前者适合观察长时间事件顺序和生命周期，后者适合检查断点、调用栈与局部变量。
- 加入联合调试路线：先用事件流缩小范围，再用断点检查精确状态，最后回到真实酒馆完成正式验收。

### 阅读体验

- PC 页面扩大正文空间，减少无意义装饰，把信息密度和可读性放在前面。
- 左侧目录改为按章节折叠，并明确标出“第一至三章入门、第四章起进阶”。
- 顶部说明调整为“Vibe Code 制卡入门”，避免被误解为泛用 Vibe Code 教程。
- 手机端继续保留抽屉目录和纵向阅读布局。

### 阅读建议

- 第一次接触 Agent：从第一章 00、01、02 开始。
- 正在制作变量卡：阅读第二章的 Zod、CoT 与计算脚本。
- 正在制作状态栏、按钮或交互：阅读第三章的脚本、正则、UI 和生命周期。
- 功能只在真实酒馆中出问题：直接进入第四章，从运行时证据和联合调试开始。

### 需要记住

- Agent 的完成声明不能代替实际结果。
- 文件存在、页面出现和构建成功，都不能单独证明功能正确。
- 真实 SillyTavern 仍然是角色卡功能的最终验收环境。
- 第四章的接收器只是讲清原理的最小示例，不是所有项目都应该照抄的标准答案。
- 应先调查自己的构建方式、运行边界、可用事件、故障类型和敏感数据，再设计合理的 Debug 机制。

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
