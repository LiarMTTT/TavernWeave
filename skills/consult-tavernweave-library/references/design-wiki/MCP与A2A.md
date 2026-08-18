---
title: MCP与A2A
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - agent-harness
  - safety
sources:
  - https://modelcontextprotocol.io/specification/2026-07-28
  - https://github.com/modelcontextprotocol/specification/blob/main/schema/2026-07-28/schema.ts
  - https://github.com/modelcontextprotocol/specification/blob/main/schema/2026-07-28/schema.json
  - https://modelcontextprotocol.io/specification/2026-07-28/schema
  - https://modelcontextprotocol.io/specification/2026-07-28/server/tools
  - https://modelcontextprotocol.io/specification/2026-07-28/architecture
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning
  - https://modelcontextprotocol.io/specification/2025-11-25
  - https://a2a-protocol.org/latest/specification/
  - https://a2a-protocol.org/v1.0.0/specification/
  - https://github.com/a2aproject/A2A/blob/main/specification/a2a.proto
  - https://a2a-protocol.org/latest/spec/a2a.json
  - https://a2a-protocol.org/latest/topics/a2a-and-mcp/
  - https://a2a-protocol.org/latest/topics/agent-discovery/
  - https://modelcontextprotocol.io/extensions/tasks/overview
  - 10-收件箱/写回候选/第五批-B5-MCP.md
  - queries/第五批蒸馏目标.md
  - concepts/HTTP合同与问题详情.md
knowledge_class: factual
---

# MCP与A2A

账本见 [[10-收件箱/写回候选/第五批-B5-MCP]]（B5-MCP，13 条入口）与 [[queries/第五批蒸馏目标]]。本页不是已采用技术，也不是本仓必须改接 MCP / A2A 的工单。检索时间：2026-08-14。只收官方 spec / schema，不写本仓怎么接、怎么配、怎么运维，也不写攻击步骤。

## 一句话定义

MCP（Model Context Protocol）是 **agent-to-tool** 合同：Host / Client / Server 用 JSON-RPC 列出并调用工具、资源和提示。A2A（Agent2Agent）是 **agent-to-agent** 合同：独立代理用 Agent Card 发现彼此，用有状态 `Task` 委派与共享结果。官方写 complementary，**不是同一层、也不是互相替代**。

## 为什么重要

「给模型接工具」和「让两个不透明代理协作」都叫 agent 协议，合同对象完全不同。混成一份，会把函数式 `tools/call` 当成跨代理任务总线，或把 A2A `Task` 当成子代理 / 工具调用。

本仓 [[20-Agent-Harness/README]] 的本地 JSON Schema 是任务 / 轨迹 / 证据的**仓内**合同，**不是**行业 MCP。[[70-协同桥接/README]] 写「LLMWiki 不是同名 MCP 产品」只说明主题相邻、防止混装，不构成采用或拒绝。

## 权威入口

13 条是入口，不镜像全文。规范页已打开；GitHub `schema.ts` / `schema.json` 采集轮 HTML 未吐正文，路径以规范页声明为准。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) | 本批枢纽。权威以 TypeScript `schema.ts` 为准。JSON-RPC 2.0。角色 Hosts / Clients / Servers。服务器原语：Resources、Prompts、**Tools**。灵感来自 LSP，不是代理间任务总线。 |
| 2 | [schema.ts 2026-07-28](https://github.com/modelcontextprotocol/specification/blob/main/schema/2026-07-28/schema.ts) | 全部协议消息的 **source of truth**。 |
| 3 | [schema.json](https://github.com/modelcontextprotocol/specification/blob/main/schema/2026-07-28/schema.json) + [Schema Reference](https://modelcontextprotocol.io/specification/2026-07-28/schema) | JSON Schema **从 TS 生成**，给工具用，不是另一份真源。嵌入 schema 默认 JSON Schema 2020-12。 |
| 4 | [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) | **工具合同**。`tools/list` / `tools/call`；`inputSchema` 必为 JSON Schema 对象，不得 `null`；可选 `outputSchema`。工具是 model-controlled；描述/注解默认不信任（除非来自可信服务器），调用前要用户同意。这是同意原则，不是攻击教程。 |
| 5 | [Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture) | Host 协调多个 Client；每个 Client **1:1** 连一个 Server。现行修订自称 **stateless**：每请求自带版本与能力。Server 不应读整段对话，也看不见其他 Server。 |
| 6 | [Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning) | **Modern** = `2026-07-28` 及以后：无握手，每请求 `_meta.io.modelcontextprotocol/protocolVersion`。**Legacy** = `2025-11-25` 及以前：`initialize` 会话。不支持则 `-32022` `UnsupportedProtocolVersionError`。 |
| 7 | [2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) | 上一修订仍在线。旧文写 Stateful connections；新文去掉会话与 `initialize`，实验性 tasks **移出核心**。两边都留。 |
| 8 | [A2A Specification](https://a2a-protocol.org/latest/specification/) | 站标 Latest Released **1.0.0**。钉死页 [v1.0.0](https://a2a-protocol.org/v1.0.0/specification/)。目标：独立、可不透明的代理之间发现能力、协商模态、**管理协作任务**、交换信息，而不读对方内部状态、记忆或工具。三层：数据模型 → 抽象操作 → 绑定（JSON-RPC / gRPC / HTTP+JSON）。协议版本用 Major.Minor，补丁号不参与兼容谈判。 |
| 9 | [`specification/a2a.proto`](https://github.com/a2aproject/A2A/blob/main/specification/a2a.proto) | 数据对象与请求/响应的 **single authoritative normative** 定义。包名 `lf.a2a.v1`。`Task` 注释：A2A 的 **core unit of action**。正文另写 `spec/a2a.proto`；本轮活文件是 `specification/a2a.proto`。`/latest/spec/a2a.proto` 本轮 **500**。 |
| 10 | [a2a.json](https://a2a-protocol.org/latest/spec/a2a.json) | 自述 *Non-normative JSON Schema bundle extracted from proto*；`$schema` 2020-12；`version: "v1"`。JSON **不得**当真源。规范写的 `specification/json/a2a.json` 本轮 **404**。 |
| 11 | [A2A and MCP](https://a2a-protocol.org/latest/topics/a2a-and-mcp/) | **官方分层**。MCP：代理如何用单个工具/资源（结构化输入输出，常无状态）。A2A：独立代理如何当对等方协作（发现、协商、共享任务、多轮）。**不是替代**。A2A 明文：不是子代理/工具调用协议，那些用框架原语或 MCP。 |
| 12 | [Agent Discovery](https://a2a-protocol.org/latest/topics/agent-discovery/) | Agent Card 是 A2A Server 的 JSON 自述（身份、端点、能力、鉴权、skills）。推荐 `https://{domain}/.well-known/agent-card.json`（RFC 8615）。登记处 API **规范未规定**。只记发现合同，不写绕过鉴权。 |
| 13 | [MCP Tasks 扩展](https://modelcontextprotocol.io/extensions/tasks/overview) | `io.modelcontextprotocol/tasks`：给**长耗时 MCP 操作**（常是 `tools/call`）一个可轮询句柄。这是工具层异步，**不是** A2A 的代理间 `Task`。2026-07-28 已移出核心。 |

上表 **13** 条。B5-MCP 采集行不在本页镜像。

官方身份（不占编号）：Linux Foundation 2025-06-23 立项稿与 Google 捐赠稿指向 <https://github.com/a2aproject/A2A>。仓是规范宿主，稿不是 schema。A2A 首页还写 IBM ACP 已并入 A2A；这是治理/谱系句，不是「MCP 被并入」。

## 如何运作

### 两层对照，不合并

MCP 核心对象是 Tool / Resource / Prompt；A2A 核心对象是 Task / Message / AgentCard。MCP 不是代理间任务总线；A2A 不是子代理或工具调用协议。

### MCP 工具面

服务器公布工具清单；模型经 Client 调 `tools/call`。`inputSchema` 是 JSON Schema 对象。Host 协调多个 Client，每个 Client 只看见自己那一个 Server。现行修订每请求自带版本与能力，不靠会话握手。工具描述默认不信任，调用前要用户同意——到此为止，不展开利用面。

### MCP 世代

`2025-11-25` 及以前是 Legacy：`initialize` 建会话，旧文自称 Stateful。`2026-07-28` 起是 Modern：无握手。实验性 tasks 从核心挪到扩展 `io.modelcontextprotocol/tasks`。旧入口仍活，不以新废旧。

### A2A 任务面

先有数据模型（Task / Message / AgentCard / Part / Artifact），再有抽象操作（Send Message / Get Task / Cancel Task 等），最后绑到 JSON-RPC、gRPC 或 HTTP+JSON。对等代理不读对方内部状态、记忆或工具。发现靠 Agent Card，不是靠 MCP `tools/list`。

### schema 真源各走各的

MCP 以 **TypeScript `schema.ts`** 为准，JSON 是生成物。A2A 以 **`a2a.proto`** 为准，JSON 自述非规范。不要用「都有 JSON Schema」抹平。JSON Schema 方言本身见 [[concepts/JSON Schema与Protobuf]]，本页不重蒸 2020-12。

### 两个 Task

MCP Tasks 扩展给单次工具调用一个可轮询句柄；A2A `Task` 是跨代理协作的工作单元。同名不同层。叠加也不是等同：A2A 写远程代理可以把部分 skill 暴露成 MCP 资源，同时写 A2A 主场是有状态协作，超出一次工具调用。

## 必须保留的冲突

- **不是同一层**：MCP 是工具/资源合同（host–client–server，函数式调用）。A2A 是代理间任务合同（对等、有状态 Task、Agent Card）。官方写 complementary，禁止并成一个协议。
- **两个 Task**：MCP Tasks 扩展服务单次 `tools/call` 的异步句柄；A2A `Task` 是跨代理协作的工作单元。
- **schema 真源**：MCP 以 TS 为准、JSON 生成；A2A 以 proto 为准、JSON 非规范。
- **MCP 世代**：`2025-11-25` 有会话握手；`2026-07-28` 无会话、每请求带版本。旧入口仍活。
- **A2A 钉死 vs latest**：两页都标 1.0.0，HTML / JSON 体积不同；`main` proto 比 `v1.0.0` 标签长。以钉死页对发布，latest 当现网站。
- **proto 路径**：正文写 `spec/a2a.proto`，活文件是 `specification/a2a.proto`。两边留。
- **叠加不是等同**：部分 skill 可暴露成 MCP 资源 ≠ A2A 退化成一次工具调用。
- **仓内 Schema ≠ 行业 MCP**：本仓 Harness 四份 JSON Schema 是任务信封 / 轨迹 / 证据的本地合同，不能写成 MCP `schema.ts` 或 A2A `a2a.proto` 的实现。

## 例子

- 正例：一个代理要读日历、查库存，走 MCP `tools/list` / `tools/call`；工具 schema 钉在 MCP `schema.ts` 这一代。
- 正例：两个独立代理要发现对方、委派多轮任务、共享 Artifact，走 A2A Agent Card + `Task`；真源钉 `a2a.proto`。
- 正例：长耗时的同一次 `tools/call` 需要可轮询句柄，用 MCP Tasks 扩展，不把它写成 A2A 任务总线。
- 反例：把 MCP 和 A2A 并成「一种 agent 协议」，或把 A2A 写成 MCP 的继任。
- 反例：看见两边都有 JSON Schema 或都有名叫 Task 的对象，就当成同一合同。
- 反例：用 `2025-11-25` 的 `initialize` 会话心智去读 `2026-07-28`，或把 latest HTML 体积差当成「已经不是 1.0.0」。
- 反例：把本仓 Harness 的 task / trace Schema 写成「已经在跑 MCP」。

## 边界与易混概念

- 不包括：SDK / 教程 / Inspector / Registry 发布；Cursor 或 Hermes 配置；本仓 Harness 改接工单；越狱、提示注入利用、攻击步骤；安全最佳实践里的攻击向量清单。
- MCP ≠ A2A。分层以 [A2A and MCP](https://a2a-protocol.org/latest/topics/a2a-and-mcp/) 为准，不以第三方「MCP vs A2A」博客为准。
- MCP Tasks 扩展 ≠ A2A `Task`。
- MCP `schema.ts` ≠ 生成的 `schema.json`；A2A `a2a.proto` ≠ 非规范 `a2a.json`。
- IBM ACP 并入 A2A ≠ MCP 被并入。
- 本仓 Harness 本地 JSON Schema ≠ MCP / A2A 现行规范。
- 「LLMWiki 不是同名 MCP 产品」≠ 本仓已接入或拒绝接入 MCP。本页只收行业入口，不裁定本仓要不要接。

## 映射到本仓库

[[20-Agent-Harness/README]] 有本地协议 Schema（任务、轨迹、证据、结果）；校验器只覆盖这四份仓内关键字子集。那是 **Harness 自己的合同**，不是 Model Context Protocol，也不是 A2A。本页不替换 `20-Agent-Harness/01-协议/`，不升成本仓接入指南。

[[70-协同桥接/README]] 把「同名 MCP 产品」标成不要混装：那是防把 Hermes 内置 Markdown LLMWiki 换成带 SQLite / Web / MCP 凭证的另一实现，不是行业分层结论。

HTTP 错误体、OpenAPI 与 JSON Schema 方言见 [[concepts/HTTP合同与问题详情]]、[[concepts/JSON Schema与Protobuf]]、[[concepts/OpenAPI与Arazzo]]，本页不重收 RFC 9457 / OAS。不是已采用技术，也不做成品。本仓是否接入：未裁定。

## 来源与证据

- MCP 现行修订、角色、原语、LSP 灵感： [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) 与 Architecture / Tools / Versioning。
- 消息真源是 TS、JSON 生成：规范页与 basic 对 `schema.ts` 的声明。
- A2A 1.0.0、三层、`Task` 是核心工作单元：规范正文与 `specification/a2a.proto` 注释。
- 官方分层 complementary、不是替代： [A2A and MCP](https://a2a-protocol.org/latest/topics/a2a-and-mcp/)。
- Agent Card 发现合同： [Agent Discovery](https://a2a-protocol.org/latest/topics/agent-discovery/)。
- MCP Tasks 已出核心、只服务工具层异步：Changelog + [Tasks 扩展](https://modelcontextprotocol.io/extensions/tasks/overview)。
- 查询账本：[[10-收件箱/写回候选/第五批-B5-MCP]]；枢纽表见 [[queries/第五批蒸馏目标]] B5-MCP。
- 采集缺口（待复核，不静默填）：GitHub schema 文件正文未吐；`/latest/spec/a2a.proto` 500；latest 与 v1.0.0 的逐字段差未对完。

已知冲突见上节，不静默覆盖。本仓是否接入：未裁定。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区；本波不改 `index.md` 与 `log.md`

## 相关内容

- [[concepts/HTTP合同与问题详情]]
- [[concepts/JSON Schema与Protobuf]]
- [[concepts/OpenAPI与Arazzo]]
- [[20-Agent-Harness/README]]
- [[70-协同桥接/README]]
- [[queries/第五批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-MCP]]
