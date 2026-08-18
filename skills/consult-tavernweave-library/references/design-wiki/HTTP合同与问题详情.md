---
title: HTTP合同与问题详情
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - safety
sources:
  - https://www.rfc-editor.org/rfc/rfc9457.html
  - https://json-schema.org/specification
  - https://google.aip.dev/
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# HTTP合同与问题详情

本页不是已采用规范，也不是工坊必须改错误体的工单。检索时间：2026-08-14。只谈公开规范与风格指南，不写攻击步骤、绕过或凭证。

## 一句话定义

HTTP 合同是调用方能稳定依赖的表面：动词、路径、状态码、媒体类型、成功体与错误体。问题详情是其中一种**可复用错误体**，现行 IETF 文本是 [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)，媒体类型 `application/problem+json`（另有 XML 等价物）。它废止了 RFC 7807，但**不强迫**每个 API 都改用它。

## 为什么重要

状态码只能说「大概哪一类失败」。机器客户端还要知道失败类型、这一次发生在哪、人能读的短说明。没有合同，客户端只能猜字符串；合同乱了，重试、分页和版本会静默裂开。工坊主路径已经是同步 REST，见 [[concepts/后端架构名词与工坊对照]]「契约一句」：公共 HTTP 用 OpenAPI 这类跨语言合同，要生成客户端再补文件。本页只补错误体、schema 与风格指南，不复制那一页。

## 权威入口

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html) | 现行问题详情；废止 7807 |
| 2 | [RFC 7807 状态页](https://www.rfc-editor.org/info/rfc7807) | 被废止的旧文本，只作历史 |
| 3 | [Idempotency-Key 草案 -07](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) | 已过期，暂无继任 RFC |
| 4 | [JSON Schema Specification](https://json-schema.org/specification) | 站点称 **2020-12** 现行 |
| 5 | [JSON Schema 版本表](https://json-schema.org/specification-links) | 旧 IETF 标识与过期草案对照 |
| 6 | [jsonschema WG 新稿](https://datatracker.ietf.org/doc/draft-ietf-jsonschema-json-schema/) | 新 WG 稿并行，未取代 2020-12 |
| 7 | [RFC 8949 CBOR](https://www.rfc-editor.org/rfc/rfc8949.html) | 废止 RFC 7049；交换格式兼容 |
| 8 | [Google AIP 总站](https://google.aip.dev/) | 公司风格指南枢纽，不是 IETF RFC |
| 9 | [AIP-193 Errors](https://google.aip.dev/193) | `google.rpc.Status` / HTTP `{error:{…}}` |
| 10 | [AIP-158 Pagination](https://google.aip.dev/158) | 集合分页的**公司**写法 |
| 11 | [AIP-185 Versioning](https://google.aip.dev/185) | URI 里放 `v1` 的**公司**写法 |
| 12 | [Google 旧 API 总则](https://cloud.google.com/apis/design) | 各节只转 AIP，不再当独立真源 |
| 13 | [Microsoft 根 Guidelines.md](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md) | 已废；通知读者改看专册 |
| 14 | [Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md) | 现行 Azure 专册；版本用查询参数 |
| 15 | [OpenAPI 最新规范](https://spec.openapis.org/oas/latest.html) | HTTP 操作合同，不是 JSON Schema 本身 |
| 16 | [RFC 9110 HTTP 语义](https://www.rfc-editor.org/rfc/rfc9110.html) | 状态码与协商；不管 `/v1/` 或分页 |

上表 **16** 条。B2-API / B3-Schema / B3-APIsty 的采集行不在本页镜像。

## 如何运作

### HTTP 合同三层

1. **传输语义**：状态码、方法幂等、内容协商，归 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)。
2. **操作清单**：路径、参数、成功/失败体，行业常用 [OpenAPI](https://spec.openapis.org/oas/latest.html) 写下来。
3. **文档形状**：JSON 字段约束用 JSON Schema；二进制信封常用 Protobuf，二者不是同一份规范。

「有 OpenAPI 文件」不等于「错误体已经是 9457」。OpenAPI 可以描述任意 JSON 错误对象。

### RFC 9457 问题对象

规范对象是一个 JSON 对象，常见成员：

| 成员 | 作用 |
|---|---|
| `type` | 问题类型 URI；缺省视为 `about:blank`（只重复状态码语义） |
| `title` | 对类型的短摘要，不应随每次发生而变（本地化除外） |
| `status` | 咨询性状态码；必须与真实 HTTP 状态码一致 |
| `detail` | 这一次的人读说明；客户端不应靠解析它取字段 |
| `instance` | 这一次发生的 URI；可解引用或只当不透明标识 |

允许按问题类型加扩展成员；不认识的扩展必须忽略。多种不同类型同时失败时，规范建议回**最相关或最紧急**的一条，而不是随便做一个「批处理错误袋」。9457 新增了常见问题类型的 IANA 登记处，并写明 `type` 可以是不可解引用 URI。附录 A 给了一份非规范 JSON Schema，标题仍写 “RFC 7807 problem object”——那是附录用词残留，**不能**据此说 7807 仍现行。

9457 自己说：若响应仍是资源的一种表示，或已有领域错误格式，不必改用问题详情。它要避免的是每家再发明一套 fault 文档，不是替换已有领域体。

规范安全节只给设计约束：问题详情不是调试通道；不要经 HTTP 接口给出实现内部信息。本页到此为止，不展开利用面。

### JSON Schema 与并行稿

[json-schema.org/specification](https://json-schema.org/specification) 写明现行版本是 **2020-12**，上一版 2019-09。规范拆成 Core 与 Validation。2020-12 对应的 IETF 文是 `draft-bhutton-json-schema-01` 等，按 Internet-Draft 规则早已过期。与此同时，[jsonschema WG](https://datatracker.ietf.org/doc/draft-ietf-jsonschema-json-schema/) 的新稿在推进；该稿自述尚未准备好让实现者拿它替换已广泛实现的版本。两边都留：站点现行 ≠ IETF 已成 RFC；新 WG 稿 ≠ 立刻改 `$schema`。

Protobuf 是另一条合同族（IDL + 编解码）。CBOR 现行是 [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html)，**RFC 7049 已被 8949 废止**；8949 明确不创造新的交换格式版本。

### 风格指南不是 IETF 分页/版本 RFC

Google 的分页、版本、错误分别在 AIP-158 / AIP-185 / AIP-193。AIP-193 的 HTTP JSON 是 `{ "error": { "code", "message", "status", "details" } }`，与 9457 的扁平 `type`/`title`/`detail` **不是同一信封**。AIP-185 把主版本放在 URI 第一段（`v1`，不暴露 minor/patch）。Azure 专册要求每个操作带查询参数 `api-version`。这是两家公司书，不是 IETF 对 `/v1/` 或集合分页的专用 RFC。

**IETF 无集合分页专用 RFC，无 `/v1/` URL 版本规范。** 需要分页或版本策略时，引用公司指南或自己写进 OpenAPI，不要伪称「有 RFC」。

幂等：使 `POST`/`PATCH` 可安全重试的 `Idempotency-Key` 草案 **-07 已过期**（datatracker 标 Expired & archived，过期日 2026-04-18），**暂无继任 RFC**。产品可以自定幂等键，但不能把它写成已标准化的 HTTP 字段。

## 必须保留的冲突

- RFC 7807 已被 **9457** 废止。
- 幂等键草案 -07 已过期，暂无继任 RFC。
- IETF 无集合分页专用 RFC，无 `/v1/` URL 版本规范。
- JSON Schema 站点称 2020-12 现行，IETF 旧草案过期、新 WG 稿并行。
- RFC 7049 已被 8949 废止（CBOR）。
- Google 旧 API 总则只转 AIP；Microsoft 根 `Guidelines.md` 已废，看 azure 专册。
- 9457 问题详情 ≠ AIP-193 `error` 信封 ≠ Azure 专册错误章。三套都正当，不要并成一种「标准错误 JSON」。
- OpenAPI ≠ JSON Schema；Protobuf ≠ JSON Schema。
- 本页映射工坊同步 REST 的**错误体选择**；**不是**「工坊必须上 9457」。

## 例子

- 正例：4xx/5xx 固定一种已文档化的错误对象；`type` 或机器可读码稳定，人读句子可本地化。
- 正例：集合一开始就带分页字段（AIP-158 的理由：后加分页会改行为）。这是风格建议，不是 IETF 强制。
- 正例：工坊 `create` / `update` / `withdraw` / `review` 失败时，状态码 + 一种稳定 JSON，字段写进以后的 OpenAPI。
- 反例：把 7807 当现行标准，或把过期幂等键草案写成 RFC。
- 反例：把 AIP 的 `/v1/` 或 Azure 的 `api-version` 说成 IETF 规定。
- 反例：用 `detail` 当调试堆栈；或同一失败有时 9457、有时 AIP-193、有时裸字符串。

## 边界与易混概念

- 不包括：具体 Gateway schema、OAuth 密钥、对象存储凭证、攻击或绕过步骤。
- 问题详情 ≠ 授权模型，也 ≠ 重试算法。
- `status` 成员 ≠ 真实 HTTP 状态码的替代品；中间件仍看响应行。
- 公司风格指南可对内当「必须」，对外只是一家之书。
- 易混：听到「标准错误格式」就以为全世界只剩 9457。9457 明文允许已有领域格式继续用。

## 映射到本仓库

当前工坊：同步 REST（`list` / `detail` / `create` / `update` / `withdraw` / `review`），公共合同以后要生成客户端再补 OpenAPI，见 [[concepts/后端架构名词与工坊对照]] 与 [[comparisons/工坊架构该上与不该上]]。本页只问错误体要不要对齐行业信封。

对齐方式是**选一种并写进合同**：9457、AIP-193 形、或现有领域 JSON 都可以。选定之后客户端按字段读，不要解析散文。这是「同步 REST 错误体要稳定」，不是「工坊必须上 9457」，也不是对 GraphQL / tRPC 的行业否定。卡内 fail closed 仍归 [[concepts/创意工坊与安全契约]]。本 Vault 不收 Gateway 真身字段。

## 来源与证据

- 问题详情与废止关系：RFC 9457 文首与 Appendix D；7807 状态页。
- 幂等键过期：datatracker 对该 draft 的 Expired & archived。
- JSON Schema 双轨：官方 specification / specification-links，以及 jsonschema WG 新稿自述。
- CBOR：RFC 8949 文首「Obsoletes: 7049」。
- 风格指南空心化：`cloud.google.com/apis/design` 各节转 AIP；Microsoft 根 `Guidelines.md` 的 deprecation notice 指向 azure / graph 专册。
- 查询账本：[[queries/第二批蒸馏目标]] B2-API；[[queries/第三批蒸馏目标]] B3-Schema、B3-APIsty。

已知冲突见上节，不静默覆盖。IETF 是否会给幂等键或分页另出 RFC：尚无继任文本，标未知。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词（含 `safety`：只谈规范约束）
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/创意工坊与安全契约]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[concepts/Saga三义与补偿]]
- [[concepts/GraphQL与异步事件合同]]
