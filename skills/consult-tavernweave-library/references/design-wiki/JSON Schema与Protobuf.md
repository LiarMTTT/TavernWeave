---
title: JSON Schema与Protobuf
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
  - https://json-schema.org/specification
  - https://json-schema.org/specification-links
  - https://json-schema.org/draft/2020-12/json-schema-core.html
  - https://json-schema.org/draft/2020-12/json-schema-validation.html
  - https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01
  - https://datatracker.ietf.org/doc/draft-ietf-jsonschema-json-schema/
  - https://protobuf.dev/overview/
  - https://protobuf.dev/programming-guides/proto3/
  - https://protobuf.dev/programming-guides/proto2/
  - https://protobuf.dev/editions/overview/
  - https://protobuf.dev/programming-guides/encoding/
  - https://protobuf.dev/programming-guides/json/
  - https://protobuf.dev/programming-guides/field_presence/
  - https://protobuf.dev/reference/protobuf/proto3-spec/
  - https://www.rfc-editor.org/rfc/rfc8949.html
  - https://www.rfc-editor.org/info/rfc7049
  - queries/第三批蒸馏目标.md
  - concepts/HTTP合同与问题详情.md
knowledge_class: factual
---

# JSON Schema与Protobuf

本页不是已采用技术，也不改工坊或角色卡栈。检索日 2026-08-14。账本枢纽是 [[queries/第三批蒸馏目标]] **B3-Schema**。HTTP 错误体 / OpenAPI / 公司风格指南见 [[concepts/HTTP合同与问题详情]]，本页不重蒸。

## 一句话定义

JSON Schema 是用 JSON 描述 JSON 形状的方言（现行站点钉 **2020-12**）。Protobuf 是 IDL + 编译器 + 运行时 + 线格式的另一条合同族。CBOR 是自描述二进制交换格式，现行文本是 [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html)（STD 94）。三者都不是「一种标准 JSON」。

## 为什么重要

同步 HTTP 要稳定字段，行业会先写形状，再选信封。JSON Schema 管「这份 JSON 长什么样」；Protobuf 管「跨语言消息怎么编号、怎么编解码」；CBOR 管「不要 schema 也能拆开的紧凑二进制」。版本钉错会静默裂开：实现仍跑 2020-12，有人却把过期 IETF 稿或新 WG 稿写成已成 RFC；或把 7049 当现行 CBOR。

## 权威入口

检索 2026-08-14。16 条，不镜像全文。B3 采集行不在本页逐条复制。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [JSON Schema Specification](https://json-schema.org/specification) | B3-Schema 枢纽；站点称 **2020-12** 现行 |
| 2 | [版本表](https://json-schema.org/specification-links) | 年月元模式、bhutton IETF 标识、未发布 snapshot |
| 3 | [2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core.html) | `$schema` / `$id` / `$ref` / 词汇表；仍标 I-D |
| 4 | [2020-12 Validation](https://json-schema.org/draft/2020-12/json-schema-validation.html) | `type` / `required` / `properties` 等断言词 |
| 5 | [draft-bhutton-json-schema-01](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01) | 2020-12 对应 IETF 文；2022-12 已过期 |
| 6 | [jsonschema WG 新稿](https://datatracker.ietf.org/doc/draft-ietf-jsonschema-json-schema/) | `-02`，2026-07-01；自述勿替换已实现版本 |
| 7 | [Protobuf Overview](https://protobuf.dev/overview/) | IDL + 生成代码 + 线格式；非正式标准组织规范 |
| 8 | [proto3 语言指南](https://protobuf.dev/programming-guides/proto3/) | 现行常用语法；推荐标量 `optional` |
| 9 | [proto2 语言指南](https://protobuf.dev/programming-guides/proto2/) | `required` 禁用于新字段；packed 要显式开 |
| 10 | [Editions 总览](https://protobuf.dev/editions/overview/) | 取代 proto2/proto3 标签；已发布最新 **2024** |
| 11 | [Encoding](https://protobuf.dev/programming-guides/encoding/) | 字段号 + wire type；例子按 2023+ |
| 12 | [ProtoJSON](https://protobuf.dev/programming-guides/json/) | Protobuf→JSON 映射，不是 JSON Schema |
| 13 | [Field Presence](https://protobuf.dev/programming-guides/field_presence/) | 隐式 / 显式 / editions 默认 |
| 14 | [proto3 语言规格](https://protobuf.dev/reference/protobuf/proto3-spec/) | 自承不完整；`protoc` 为真源 |
| 15 | [RFC 8949 CBOR](https://www.rfc-editor.org/rfc/rfc8949.html) | STD 94；废止 7049；格式未换代 |
| 16 | [RFC 7049 状态页](https://www.rfc-editor.org/info/rfc7049) | 已 obsolete，只作历史 |

刻意未收：gRPC / Connect 传输、AIP 错误信封、攻击面、凭证、工坊 Gateway 真身字段。

## 如何运作

### JSON Schema：站点现行 ≠ IETF RFC

[json-schema.org/specification](https://json-schema.org/specification) 写明现行版本是 **2020-12**，上一版 2019-09。规范拆成 Core 与 Validation；Relative JSON Pointer 另册，Core/Validation 几乎不用它。元模式从原「Draft 8」起改用年月标识，通用方言元模式是 `https://json-schema.org/draft/2020-12/schema`。

[版本表](https://json-schema.org/specification-links) 把 2020-12 的 IETF 标识写成 `draft-bhutton-json-schema-00/01` 与对应 Validation 稿，发布日 2022-06-16。渲染 Core 页标题仍是 Internet-Draft，过期日 2022-12。按 I-D 六个月规则，**这些 bhutton 稿早已过期**，从未升 RFC。

与此同时，[jsonschema WG](https://datatracker.ietf.org/doc/draft-ietf-jsonschema-json-schema/) 的 `draft-ietf-jsonschema-json-schema-02`（2026-07-01，过期 2027-01-02）在推进，意向 Proposed Standard，状态仍是 WG Document。该稿自述：「literally a draft」，**尚未准备好让实现者拿它替换已广泛实现的版本**。站点「Latest Snapshot」是另一份未发布草稿。两边都留：站点现行 ≠ IETF 已成 RFC；新 WG 稿 ≠ 立刻改 `$schema`。

OpenAPI 可以引用 JSON Schema，但 OpenAPI 不是 JSON Schema 本身，见 HTTP 合同页与 [[concepts/OpenAPI与Arazzo]]。

### Protobuf：proto2 / proto3 / editions 并行

[Overview](https://protobuf.dev/overview/)：`.proto` 定义 + `protoc` 生成代码 + 语言运行时 + 线格式。适合几兆以内的结构化记录；整消息假定能进内存。官方写明：**不是任何组织的正式标准**。线格式不是规范编码：同一逻辑消息可以有多种合法字节，不能未解析就比相等。

[proto3](https://protobuf.dev/programming-guides/proto3/) 用 `syntax = "proto3"`；不写 `syntax`/`edition` 时编译器按 **proto2**。标量默认可选；推荐给标量加 `optional`（显式存在），以便迁 editions。不加则走隐式存在：默认值（0 / 空串 / false / 枚举 0）不落线，读端分不清「没写」和「写成默认」。枚举第一个值必须是 0。proto3 重复数值字段默认 packed。

[proto2](https://protobuf.dev/programming-guides/proto2/) 仍有 `required`。官方写 **Do not use**：proto3 与 editions 已去掉该标签；语义应放应用层。`required` 几乎改不掉；未识别枚举会被当成缺字段，连带让 required 检查失败。proto2 重复数值默认不 packed，新代码应显式 `[packed = true]`。

[Editions](https://protobuf.dev/editions/overview/) 用 `edition = "2023"` / `"2024"` 取代 `syntax`。现行已发布 edition 是 **2024**。它是一组带默认值的 feature，可在文件 / 消息 / 字段上覆盖。官方写：不改二进制、文本、JSON 序列化；可与 proto2/proto3 互 import。`required` 标签不可用，旧语义用 `features.field_presence = LEGACY_REQUIRED`。Editions 默认显式存在，可用 `IMPLICIT` 对齐 proto3 隐式标量。

[线格式](https://protobuf.dev/programming-guides/encoding/) 是带编号的 TLV：字段号 + wire type + 载荷。旧解析器靠类型跳过未知字段。字段号 1–15 占一字节；**永不复用**已用或已 reserve 的号。编码页例子按 Edition 2023+。

[ProtoJSON](https://protobuf.dev/programming-guides/json/) 是 Protobuf 消息的规范 JSON 映射，**不是**给任意 JSON Schema 用的。它写不出 `number[][]` 或 `number|string` 这类常见 JSON Schema 形。字段名进载荷（默认 lowerCamelCase）；一般不传播未知字段；删字段会让旧 JSON 解析失败。int64 默认输出字符串，避免超过 2^53 丢精度。

[proto3 语言规格](https://protobuf.dev/reference/protobuf/proto3-spec/) 自承不完整，真源是 C++ `protoc`。

RPC 怎么走 HTTP/2 或浏览器，不在本页。

### CBOR：8949 废止 7049，格式未换代

[RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html) 废止 [RFC 7049](https://www.rfc-editor.org/info/rfc7049)。文首写：编辑改进、细节与勘误，**与 7049 交换格式完全兼容，不创造新的格式版本**。目标含小代码体积、无需 schema 即可解码、覆盖 JSON 类型并加字节串。它不是 Protobuf 的 IETF 替代品，也不是 JSON Schema 的二进制版。

## 必须保留的冲突

- 站点称 2020-12 现行，IETF 旧草案已过期、新 WG 稿并行。实现基线仍是 2020-12；WG `-02` 自述不是替换件。
- RFC 7049 已被 8949 废止；8949 不换代交换格式。
- Protobuf 官方自称非正式标准；CBOR 是 IETF STD 94。不要并成「都是 RFC」。
- proto2 / proto3 / edition 2023 / 2024 语法并行；默认存在性不同。
- ProtoJSON ≠ JSON Schema；OpenAPI ≠ JSON Schema。
- proto3 语言规格页 ≠ `protoc` 行为。
- HTTP 合同页已书签双轨与 CBOR 废止句；本页是形状/编码专页，不覆盖那一页的错误体结论。
- **映射 ≠ 采用。**

## 例子

- 正例：公共 HTTP JSON 用 2020-12 写字段约束，`$schema` 钉 `draft/2020-12`；错误体另选 9457 或领域对象，见 HTTP 合同页。
- 正例：跨语言、要按字段号演进的内部消息用 proto3（标量加 `optional`）或 edition 2024；删字段先 `reserved` 号。
- 正例：受限节点要自描述二进制、且已有 JSON 数据模型，用 CBOR 8949，不要引 7049。
- 反例：把过期 `draft-bhutton-*` 或 WG `-02` 写成「JSON Schema 已是 RFC」，或立刻改生产 `$schema`。
- 反例：把 ProtoJSON 当成 JSON Schema 方言，或把 JSON Schema 文件喂给 `protoc`。
- 反例：新字段标 proto2 `required`，或复用字段号。
- 反例：因本页出现 Protobuf / CBOR 就写进工坊主路径或发卡 recipe。

## 边界与易混概念

- 不包括：攻击、绕过、凭证、OAuth 密钥、Gateway 真身 schema、gRPC 传输步骤。
- JSON Schema ≠ OpenAPI ≠ Schema.org ≠ ProtoJSON。
- 站点 2020-12 ≠ 已成 RFC；WG 新稿 ≠ 现行实现基线。
- Protobuf ≠ JSON Schema：前者要 `.proto` 才能完整解释字节；后者描述的是 JSON 实例。
- proto3 ≠ editions。edition 2024 已发布，不等于全行业已弃 proto3。
- ProtoJSON 演进规则 ≠ 二进制线格式演进规则。
- CBOR 8949 ≠ 「CBOR 2.0」。兼容 7049 交换格式。
- CBOR 可无 schema 解码；Protobuf 线格式不能。
- 酒馆角色卡 JSON / PNG 载荷 ≠ JSON Schema 2020-12 方言。

## 映射到本仓库

映射放最后，不当过滤器。行业句对独立服务仍成立。

当前工坊：同步 REST；公共合同以后要生成客户端再补 OpenAPI，见 [[concepts/后端架构名词与工坊对照]]「契约一句」与 [[comparisons/工坊架构该上与不该上]]。HTTP 错误体怎么选，见 [[concepts/HTTP合同与问题详情]]。

因此：

1. **本仓未采用** 2020-12、IETF 新稿、proto3 / editions 或 CBOR 当主交换格式。
2. 若以后补 OpenAPI，字段形状用 JSON Schema 时钉 **2020-12**，不要抄 WG `-02`。
3. Protobuf / gRPC 不是工坊主路径；形状若要对照，入口仍是 `protobuf.dev`，传输另页。
4. 卡 JSON 是角色卡格式，不是本页的 schema 方言。
5. 本 Vault 不收 Gateway 真身字段或凭证。

## 来源与证据

- 2020-12 现行：specification 文首；版本表 2022-06-16 与 bhutton 标识。
- bhutton 过期：datatracker / 渲染 Core 的 Expires 2022-12。
- WG 并行且勿替换：`draft-ietf-jsonschema-json-schema-02` Introduction。
- Protobuf 非标准组织规范、线格式非规范：overview。
- proto2 `required` 禁用、editions 最新 2024、存在性默认：proto2 / editions / field_presence。
- ProtoJSON 不能表达任意 JSON Schema：json 页 Non-goals。
- proto3 规格不完整：proto3-spec 页首。
- CBOR：8949 文首 Obsoletes 7049；7049 状态页 obsolete。
- 账本：[[queries/第三批蒸馏目标]] B3-Schema。

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
- [[concepts/OpenAPI与Arazzo]]
- [[concepts/GraphQL与异步事件合同]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[queries/第三批蒸馏目标]]
