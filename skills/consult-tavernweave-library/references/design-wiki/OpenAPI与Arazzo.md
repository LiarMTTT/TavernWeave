---
title: OpenAPI与Arazzo
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
  - https://www.openapis.org/
  - https://www.openapis.org/what-is-openapi
  - https://spec.openapis.org/
  - https://spec.openapis.org/oas/latest.html
  - https://spec.openapis.org/oas/v3.1.2.html
  - https://spec.openapis.org/arazzo/latest.html
  - https://spec.openapis.org/overlay/latest.html
  - https://learn.openapis.org/
  - https://jsonapi.org/
  - https://jsonapi.org/format/
  - https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11
  - https://www.iana.org/assignments/media-types/application/vnd.hal+json
  - 10-收件箱/写回候选/第五批-B5-OpenAPI.md
  - queries/第三批蒸馏目标.md
  - concepts/HTTP合同与问题详情.md
knowledge_class: factual
---

# OpenAPI与Arazzo

本页不是已采用合同，也不改工坊或角色卡栈。检索日 2026-08-14。账本枢纽是 [[10-收件箱/写回候选/第五批-B5-OpenAPI]] **B5-OpenAPI**（14 条采集，本页全收）。公司风格指南回 [[queries/第三批蒸馏目标]] **B3-APIsty**；问题详情与 JSON Schema 双轨回 [[concepts/HTTP合同与问题详情]]。本页只收描述语言：OAS 3.1 / 3.2、Arazzo、Overlay、JSON:API、HAL。

## 一句话定义

OpenAPI Specification（OAS）是用 YAML/JSON 写 HTTP API 结构与句法的**描述语言**，和实现语言脱钩。Arazzo 描述跨接口的**调用序列**；Overlay 用 JSONPath 改已有描述文档。JSON:API 与 HAL 管资源/超媒体**文档形状**，不是 OAS 的替代品。

## 为什么重要

跨语言客户端要靠一份机器可读操作清单，而不是读源码或抓包。工坊「契约一句」已把公共 HTTP 指向 OpenAPI，见 [[concepts/后端架构名词与工坊对照]]。但「有 OAS 文件」不等于错误体已是 9457，也不等于 Schema 已等于 json-schema.org 2020-12，更不等于 Arazzo 工作流已是默认生产栈。先分清**描述操作 / 约束字段 / 约束资源文档 / 公司风格指南**四层。

## 权威入口

检索 2026-08-14。14 条，不是教程，也不镜像全文。B3-APIsty / 9457 / JSON Schema 双轨未升格进本表。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [OAI 枢纽](https://www.openapis.org/) | 「最广泛使用的 API **描述**标准」；OAS / Arazzo 走 `latest`，Overlay 按钮仍钉 v1.0.0.html |
| 2 | [出版物枢纽](https://spec.openapis.org/) | 权威 HTML；Learn / Tooling 是伴读，不是规范真身 |
| 3 | [OAS 3.2.0](https://spec.openapis.org/oas/latest.html) | `latest` = **3.2.0**（2025-09-19）；Apache-2.0；minor 可做低影响不兼容 |
| 4 | [OAS 3.1.2](https://spec.openapis.org/oas/v3.1.2.html) | 同日补丁；3.1.* 工具应兼容整条 3.1 线 |
| 5 | [Schema 方言](https://spec.openapis.org/oas/latest.html) | Schema Object 自称 2020-12 **超集**；默认方言仍是 `oas/3.1/dialect/base` |
| 6 | [Learn](https://learn.openapis.org/) | OAS 伴读；「最发达工具生态」对象是 **OAS**，不是 Arazzo |
| 7 | [Arazzo 1.1.0](https://spec.openapis.org/arazzo/latest.html) | 现行 **1.1.0**（2026-05-17）；描述调用序列 |
| 8 | [Overlay 1.1.0](https://spec.openapis.org/overlay/latest.html) | 现行 **1.1.0**（2026-01-14）；JSONPath 改描述文档 |
| 9 | [What is OAS](https://www.openapis.org/what-is-openapi) | 页标 2023-12-20；只讲 OAS 生命周期，**未写** Arazzo / Overlay |
| 10 | [JSON:API 枢纽](https://jsonapi.org/) | 媒体类型 `application/vnd.api+json`；1.1 终稿 2022-09-30 |
| 11 | [JSON:API 1.1](https://jsonapi.org/format/) | 现行 1.1；只加不删；`data` 与 `errors` 不得同文档共存 |
| 12 | [JSON:API 错误](https://jsonapi.org/format/) | 顶层 `errors[]`；`status` 是字符串 ≠ 9457 单对象 |
| 13 | [HAL I-D](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11) | `-11` 2023-10-19，过期 2024-04-21；草案媒体类型 `application/hal+json`；**不是 RFC** |
| 14 | [HAL IANA](https://www.iana.org/assignments/media-types/application/vnd.hal+json) | 2011-07-14 登记 **`application/vnd.hal+json`** |

刻意未收：9457 / 7807 / 幂等键、AIP / Azure 专册、GraphQL / AsyncAPI 正文、盗版规范 PDF。

## 如何运作

### OAS 3.1 / 3.2 是描述语言

[What is OpenAPI](https://www.openapis.org/what-is-openapi)（页标 2023-12-20）：OAS 写 HTTP API 的结构与句法。3.2.0 正文：OpenAPI Document（OAD）给人与机器发现能力。`latest.html` = **3.2.0**（2025-09-19）；3.1 线现行补丁是 [3.1.2](https://spec.openapis.org/oas/v3.1.2.html)，与 3.2.0 **同一天**发布。钉 3.1 线看 `v3.1.2.html`，不要把 `latest` 当成 3.1。3.0.4（2024-10-24）仍公布，其 Schema Object **不是** 2020-12。minor 版本**可以**做低影响不兼容。OAS 可描述任意 JSON 错误体——包括 9457、AIP-193 或 JSON:API `errors[]`。

### Schema Object：超集声称 vs 默认方言

3.1 / 3.2 都写：Schema Object 是 JSON Schema Draft **2020-12 的超集**；未另述则关键字语义跟 JSON Schema；允许布尔 schema。默认 `$schema` 却是 OAS 方言 `https://spec.openapis.org/oas/3.1/dialect/base`（**3.2 仍用 3.1 这条 URI**），不是 json-schema.org 通用元 schema。`description` / `format` 被 OAS 加长；另有 `int32` 等格式。OAS 基础词表 `$vocabulary` 为 **false**，通用 JSON Schema 实现可以把 `discriminator` / `xml` / `example` 当未知关键字。`spec.openapis.org` 上的 JSON Schema **仅供参考**，冲突以 HTML 规范为准。可用 `jsonSchemaDialect` / `$schema` 改默认；工具必须认 OAS 方言，其他草案只是 MAY。不要写成「3.1 已等于 2020-12」，也不要写成「3.1 仍是 3.0 那套分叉」。站点 2020-12 vs IETF 新稿仍归 HTTP 合同页。

### Arazzo / Overlay：已发布 ≠ 与 OAS 同成熟度

Arazzo 现行 **1.1.0**（2026-05-17；首发 1.0.0，2024-05-29）：至少一份 `sourceDescriptions` + 至少一个 workflow；可指向 OpenAPI **或** AsyncAPI。Overlay 现行 **1.1.0**（2026-01-14；首发 1.0.0，2024-10-17）：对已有 OAD 做可重复变换，`target` 是 RFC 9535 JSONPath，动作 `update` / `remove` / `copy`。Overlay 1.0.0 自述由**少数早期工具**实现。Learn 的「最发达工具生态」句只覆盖 OAS。OAI 首页 Overlay 按钮仍指向 **v1.0.0.html**；Arazzo / OAS 用 `latest`。What-is 页停在 2023-12、未提两份伴生规范。

### JSON:API 与 HAL：文档形状，不是 OAS

JSON:API 管资源怎么请求/修改、服务器怎么回；主对象是 `data` / `included` / `links`，不是 path+verb 清单。可用 OAS **描述**一个 JSON:API 服务，二者不是替代。1.1 终稿 2022-09-30；只加不删；`data` 与 `errors` 不得同文档共存。顶层 `errors[]` 的 `status` 是**字符串**，信封和媒体类型都不是 RFC 9457。HAL 只约定 `_links` / `_embedded`。草案自称 `application/hal+json`；IANA 实际登记的是 **`application/vnd.hal+json`**。过期 I-D ≠ 已废止实践，也 ≠ RFC。

## 必须保留的冲突

- **3.1 JSON Schema 对齐程度（两边留）。** 规范侧：Schema Object = 2020-12 **超集**，关键字默认不另加语义。实现侧：默认方言是 OAS `3.1/dialect/base`（3.2 仍用此 URI）；基础词表可被通用校验器忽略；参考 JSON Schema 非规范；3.0 线仍不是 2020-12。不要写成「3.1 已等于 json-schema.org 2020-12」，也不要写成「3.1 仍是 3.0 那套分叉」。站点 2020-12 vs IETF 新稿仍归 HTTP 合同页。
- **Arazzo 成熟度（两边留）。** 规范侧：OAI 正式规范，已到 1.1.0，首页与 OAS 并列。生态侧：比 OAS 年轻两年；Learn 工具生态句不覆盖它；Overlay 正文承认早期工具少；首页 Overlay 仍链 1.0.0。已发布 ≠ 默认生产栈。
- JSON:API `errors[]` ≠ RFC 9457。HAL 草案 `application/hal+json` ≠ IANA `application/vnd.hal+json`。
- `latest.html` = 3.2.0，不是 3.1。3.2 方言 URI 是否改成 `oas/3.2/dialect/base`：本波未见，标待复核。
- **映射 ≠ 采用。** 工坊「以后补 OAS 文件」不等于本仓已上 3.2 或 Arazzo。

## 例子

- 正例：工坊以后要生成跨语言客户端，对象是一份 OAS 文件（钉 3.1.2 或跟 `latest` 走 3.2.0），错误体形状另写，不假装已是 9457。
- 正例：用 OAS 描述一个 JSON:API 服务；文档形状仍归 JSON:API，操作清单归 OAS。
- 正例：多步「先建再查」流程若要机器可读，另写 Arazzo，并声明工具是否认 1.1.0。
- 反例：把 `latest.html` 当成 3.1，或把 3.0.4 Schema Object 当成 2020-12。
- 反例：把通用 JSON Schema 校验器直接套 OAS 方言，却期望 `discriminator` / `xml` 生效。
- 反例：因 Arazzo / Overlay 已发布，就写成默认生产栈或「本仓已采用」。
- 反例：把 JSON:API `errors[]` 或 HAL `_links` 写成 OAS 的替代，或把草案 `hal+json` 写成 IANA 类型。

## 边界与易混概念

- 不包括：攻击步骤、扫描清单、绕过、凭证、盗版 PDF、安装清单、角色卡 / 工坊成品。
- OAS ≠ JSON Schema。Schema Object 自称 2020-12 超集，默认方言仍是 OAS `3.1/dialect/base`。
- OAS ≠ JSON:API ≠ HAL ≠ AIP。描述操作、约束资源文档、公司风格指南是三层。
- Arazzo ≠ OAS。前者是调用序列，后者是 path+verb 清单；Arazzo 可引用 AsyncAPI，不把 GraphQL 升进本页。
- Overlay ≠ 新 API。它改已有 OAD，不单独定义资源。
- JSON:API `errors[]` ≠ RFC 9457 `application/problem+json`。字段名像，信封和媒体类型不是同一份。
- HAL 草案媒体类型 ≠ IANA 登记类型。过期 I-D 不是 RFC。
- `latest.html` = 3.2.0；要 3.1 线请钉 `v3.1.2.html`。
- 分页 / `/v1/` / 9457 / 幂等键过期：回 HTTP 合同页，本页不重蒸。

## 映射到本仓库

映射放最后，不当过滤器。行业句对独立 HTTP 合同仍成立。

[[concepts/后端架构名词与工坊对照]]「契约一句」：公共 API 用 OpenAPI 这类跨语言合同，要生成客户端再补文件。[[concepts/HTTP合同与问题详情]] 已写：有 OAS 文件 ≠ 错误体已是 9457。本页只补描述语言版本、方言和伴生规范。

因此：

1. **工坊若补跨语言 HTTP 合同，对象是 OAS 文件**（3.1.2 或 3.2.0），不是 Arazzo 工作流，也不是必须改 JSON:API / HAL 信封。
2. Schema 校验不要默认当成 json-schema.org 2020-12；先认 OAS 方言，再决定要不要改 `jsonSchemaDialect`。
3. 角色卡 JSON/PNG、世界书、MVU 不是 OAS 文档。不要把本页写进 recipe / 发卡依赖。
4. 异步事件合同仍归 [[concepts/GraphQL与异步事件合同]]。Arazzo 可引用 AsyncAPI，不升 GraphQL 条。
5. 本页不写「已采用 OpenAPI 3.2 / Arazzo / Overlay / JSON:API」。

## 来源与证据

- OAS 版本：`spec.openapis.org/oas/latest.html` = 3.2.0（2025-09-19）；`v3.1.2.html` 同日；3.0.4 仍公布。
- 方言：3.1 / 3.2 HTML 自称 2020-12 超集；默认 `$schema` 为 `oas/3.1/dialect/base`（3.2 仍用此 URI）；参考 JSON Schema 非规范。
- Arazzo / Overlay：各自 `latest` 为 1.1.0；Learn 工具生态句只覆盖 OAS；首页 Overlay 仍链 1.0.0。
- JSON:API：jsonapi.org/format 1.1；`data`/`errors` 互斥；`status` 为字符串。
- HAL：I-D `-11` 过期；IANA 登记 `vnd.hal+json`。
- 账本：B5-OpenAPI；重叠 B3-APIsty / HTTP 合同页 / B3-Schema。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[concepts/HTTP合同与问题详情]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/后端架构名词与工坊对照]]
- [[10-收件箱/写回候选/第五批-B5-OpenAPI]]
- [[queries/第三批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
