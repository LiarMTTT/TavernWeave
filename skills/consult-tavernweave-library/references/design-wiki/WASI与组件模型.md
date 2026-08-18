---
title: WASI与组件模型
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
sources:
  - https://wasi.dev/
  - https://wasi.dev/releases
  - https://wasi.dev/releases/wasi-p3
  - https://wasi.dev/releases/wasi-p2
  - https://wasi.dev/roadmap
  - https://component-model.bytecodealliance.org/
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# WASI与组件模型

本页不是已采用技术，也不是工坊必须改用 Wasm 宿主的工单。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]]（B3-WASI）。只收接口与组件合同入口，不收攻击、CVE 或沙箱绕过。

## 一句话定义

WASI（WebAssembly System Interface）是一组给编译到 Wasm 的程序用的标准轨系统 API。组件模型（Component Model）规定这些程序怎么用 WIT 做成可组合、可跨语言链接的**组件**，而不是只跑一个核心模块。WASI 0.3 已于 2026-06-11 发布；Bytecode Alliance 的组件模型手册本轮仍写「现行稳定是 0.2.0」。两边留。

## 为什么重要

没有这份合同，Wasm 只能靠各运行时私有导入碰文件、时钟、套接字。WASI 把能力做成可引用的接口；组件模型再让不同语言编出来的组件能直接组合，而不必先拆成 HTTP 微服务。版本钉错会静默裂开：有人按手册钉 0.2 的 `wasi:io` / `proxy`，另一边已按 0.3 的 `async func` / `service` 出货。本仓库工坊与角色卡栈**不因此换 Wasm 宿主**；行业正当性仍保留。

## 权威入口

本轮 WebFetch 核过 [wasi.dev](https://wasi.dev/)：W3C WebAssembly 社区组下的 WASI Subgroup；里程碑写作 0.1 / 0.2 / 0.3（也叫 Preview 1/2/3 或 P1/P2/P3）。下列 **6** 条是本页真源。

| # | 入口 | 钉什么 |
|---|---|---|
| 1 | [wasi.dev](https://wasi.dev/) | 现行枢纽。WASI 是标准轨 API 组；能力沙箱、无环境权限。正文已列三个里程碑，并指向 WASI 0.3。 |
| 2 | [Releases](https://wasi.dev/releases) | 表：0.3 **Stable**（原生 async）、0.2 **Stable**（组件模型 + WIT）、0.1 **Legacy**（类 POSIX 模块）。组件用 0.2 或 0.3；模块用 0.1。提案到 Phase 5 才出 1.0。 |
| 3 | [WASI 0.3](https://wasi.dev/releases/wasi-p3) | 0.3.0 发布于 **2026-06-11**。`wasi:io` 整包删除；async 下沉到组件模型 Canonical ABI。 |
| 4 | [WASI 0.2](https://wasi.dev/releases/wasi-p2) | 本轮开篇仍写「**WASI 0.2 is the most recent stable WASI release**」。同时又提 0.3 删掉 `wasi:io`。0.2.0 投票日写 2024-01-24。 |
| 5 | [Roadmap](https://wasi.dev/roadmap) | 再次钉 0.3.0 = 2026-06-11；实现可并列跑 0.2，或用 0.3 虚拟化 0.2。 |
| 6 | [组件模型手册](https://component-model.bytecodealliance.org/) | Bytecode Alliance 用户手册。Status 段本轮仍写：「The current stable release of WASI is **WASI 0.2.0**」（2024-01-25）。 |

Bytecode Alliance 另有批准说明（Subgroup 已批准 0.3.0），不挤进上表六条。不收运行时安全通告或利用步骤。

## 如何运作

**模块 ≠ 组件。** 核心 Wasm 模块对接 WASI 0.1（WITX，类 POSIX）。0.2 起 API 用 WIT，消费面是组件：一份 WIT 世界（world）声明导入/导出，绑定生成器再吐出各语言胶水。发布表写明：0.2 发布后 0.1 在运行时里仍更常见，并仍有生产在用。两边留：里程碑已过 ≠ 0.1 已死。

**0.2 能组合接口，不能组合唤醒。** 0.2 用 `wasi:io` 的 `pollable` / `input-stream` / `output-stream` / `poll` 表达异步。`pollable` 绑在单个组件实例上。A→B→Host 时，B 没法把宿主的就绪信号转给 A，唤醒链会断。0.3 专页称 sandwich problem：0.2 能写 async，却不能跨组件边界组合它。

**0.3 把调度交给运行时。** Canonical ABI 原生提供 `async func`、`stream<T>`、`future<T>`。绑定器按语言吐 `async fn` / `Promise` / 协程。读侧常见 `tuple<stream<T>, future<result<…>>>`：流给数据，future 独立报告成败。写侧方向翻转：0.2 是拿 `output-stream` 往里写；0.3 是传入 `stream<T>`，收回完成 future。`wasi:io` 没有 0.3 版。

**世界改了名字。** 0.2：`wasi:cli/command`、`wasi:http/proxy`。0.3：CLI 的 `run` 变成 `async func`；HTTP 的 `proxy` 换成 `service`，并新增可再导入 handler 的 `middleware`。时钟把 `wall-clock` / `datetime` 改成 `system-clock` / `instant`。套接字从多接口收成 `types` + `ip-name-lookup`。这些是合同变更，不是皮肤。

**稳定里程碑 ≠ Phase 5 成标。** 发布表把 0.2 / 0.3 标 Stable，同时又写提案留在 0.x，直到 Phase 5 才出 1.0。Phase 3 表里仍列 I/O、HTTP 等。不要把「0.3 Stable」读成「已是 WASI 1.0 / W3C Rec」。

**能力模型只记原则。** 枢纽写：模块或组件起步没有环境权限，只能做宿主显式授予的事。本页到此为止，不写绕过。

## 行业何时该上

| 合同 | 何时该上 | 不该当成 |
|---|---|---|
| WASI 0.2 + WIT 世界 | 要跨语言组合、运行时已认证 0.2、还不需要跨组件原生 async | 「手册写 0.2 现行，所以 0.3 不存在」 |
| WASI 0.3 Canonical ABI | 组件链要传 `stream` / `future`，或 HTTP 要 `service` / `middleware` | 「发布了就必须立刻迁」；WASI 1.0 |
| WASI 0.1 模块 | 运行时只认 Preview 1，或存量模块还在生产 | 组件模型；WIT 世界 |
| 组件模型手册 | 学 WIT、怎么编第一个组件 | 2026-08-14 的版本真源 |
| 各运行时文档 | 该运行时实际支持哪一档、默认开不开 async | WASI 符合性证书 |

## 必须保留的冲突

- 0.3 已批准/发布 vs 手册仍写 0.2 最新。两边都留。
- 0.2 专页一边自称最新，一边已经解释 0.3 如何删除 `wasi:io`。
- 手册日期 2024-01-25 与 0.2 专页投票日 2024-01-24 差一天。
- 发布表 Stable ≠ Phase 5 / 1.0。
- 「工坊现在不上 WASI」不是「WASI 不是正当行业合同」。
- 本页映射工坊与角色卡的**宿主选择**；**不是**「工坊必须上 WASI」。

## 例子

- 正例：新组件要跨语言链接，先看发布表决定钉 0.2 还是 0.3，再打开对应专页对世界名。
- 正例：0.3 运行时上继续跑 0.2 组件：按路线图并列实现或把 0.2 进口虚拟化成 0.3 原语；`wasmtime serve` 可按组件分发。
- 反例：只打开组件模型手册首页，把「现行稳定 0.2.0」写成 2026-08-14 的全站结论。
- 反例：把 0.2 专页「most recent stable」覆盖 0.3 专页的 2026-06-11 发布日。
- 反例：把「0.3 Stable」写成 WASI 1.0，或把酒馆 iframe 当成 WASI 宿主。

## 边界与易混概念

- 不包括：攻击面、CVE、沙箱绕过、工坊换栈工单、具体打分榜。
- WASI ≠ 组件模型。前者是系统 API 提案组；后者是二进制与 ABI 架构。0.2 起 WASI 长在组件模型上，仍是两份合同。
- WASI 0.1 模块 ≠ 0.2/0.3 组件。Preview 1「组件」常只是带固定导入的核心模块。
- 0.2 `wasi:io` ≠ 0.3 原语。0.3 没有 `wasi:io`。
- 0.2 `wasi:http/proxy` ≠ 0.3 `wasi:http/service` / `middleware`。
- 手册「现行 0.2.0」≠ wasi.dev 发布表「0.3 Stable」。
- 里程碑 Stable ≠ Phase 5 成标 ≠ 1.0。
- 运行时列出 Wasmtime / jco / WAMR ≠ 该运行时已默认开 0.3。
- 酒馆卡 iframe 不是 WASI 平台；本页不自动落到卡内宿主。见 [[concepts/酒馆宿主与iframe分层]]。

## 映射到本仓库

当前工坊与角色卡开发线都不因本页改用 Wasmtime / jco，也不把 WASI 写成已采用依赖。卡 iframe 没有 OS 安装面，更没有 WASI 预开目录。这是产品落点，不是对 Subgroup 的否定。行业对照仍见 [[comparisons/行业架构方案何时用]]、[[comparisons/工坊架构该上与不该上]] 与 [[concepts/后端架构名词与工坊对照]]。这是「WASI 入口与冲突要钉住」，不是「工坊必须上 WASI」。

## 来源与证据

- 枢纽与三档里程碑：本轮打开 [wasi.dev](https://wasi.dev/)。
- 0.3 发布日与删 `wasi:io`：[WASI 0.3](https://wasi.dev/releases/wasi-p3)、[Roadmap](https://wasi.dev/roadmap)。
- 0.2 仍自称最新稳定：[WASI 0.2](https://wasi.dev/releases/wasi-p2) 开篇句。
- 手册仍钉 0.2.0：[组件模型手册](https://component-model.bytecodealliance.org/) Status。
- 发布表同时标 0.2 / 0.3 为 Stable、0.1 为 Legacy：[Releases](https://wasi.dev/releases)。
- 查询账本：[[queries/第三批蒸馏目标]] B3-WASI。

已知冲突见上节，不静默覆盖。

1. **0.3 已批准/发布 vs 手册仍写 0.2 最新。** [WASI 0.3](https://wasi.dev/releases/wasi-p3) 与 [Roadmap](https://wasi.dev/roadmap) 钉 0.3.0 = 2026-06-11；[Releases](https://wasi.dev/releases) 把 0.3 标 Stable。同日 [组件模型手册](https://component-model.bytecodealliance.org/) 仍写现行稳定是 WASI 0.2.0（2024-01-25）；[WASI 0.2](https://wasi.dev/releases/wasi-p2) 开篇仍写 0.2 是最近一次稳定发布。
2. 0.2 专页一边自称最新，一边已经解释 0.3 如何删除 `wasi:io`。
3. 手册日期 2024-01-25 与 0.2 专页投票日 2024-01-24 差一天。
4. 发布表 Stable ≠ Phase 5 / 1.0。
5. 「工坊现在不上 WASI」不是「WASI 不是正当行业合同」。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/酒馆宿主与iframe分层]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/WinterTC与服务器JS]]
- [[concepts/HTTP3与QUIC]]
