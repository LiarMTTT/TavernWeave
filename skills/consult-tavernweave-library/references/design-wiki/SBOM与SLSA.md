---
title: SBOM与SLSA
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - safety
sources:
  - https://spdx.dev/
  - https://spdx.dev/learn/overview/
  - https://spdx.dev/use/specifications/
  - https://spdx.github.io/spdx-spec/v3.0.1/
  - https://spdx.dev/spdx-3-1-ontology-and-schema-available-for-review/
  - https://cyclonedx.org/
  - https://cyclonedx.org/specification/overview/
  - https://cyclonedx.org/capabilities/sbom/
  - https://cyclonedx.org/docs/1.7/json/
  - https://slsa.dev/
  - https://slsa.dev/spec/v1.2/
  - https://slsa.dev/spec/v1.2/about
  - https://slsa.dev/spec/v1.2/provenance
  - https://docs.sigstore.dev/
  - queries/第五批蒸馏目标.md
  - concepts/创意工坊与安全契约.md
knowledge_class: factual
---

# SBOM与SLSA

本页不是已采用清单格式，也不是工坊或角色卡必须上 SBOM / SLSA 的工单。检索时间：2026-08-14。账本枢纽是 [[queries/第五批蒸馏目标]] **B5-SBOM**（14 条官方入口，本页全收）。只谈公开规范分层，不写利用、绕过签名、伪造身份或供应链攻击步骤。

## 一句话定义

SBOM（Software Bill of Materials）是制品里有哪些软件成分的**清单文档**。现行社区至少有两份互不兼容的清单标准：[SPDX](https://spdx.dev/) 与 [CycloneDX](https://cyclonedx.org/)。[SLSA](https://slsa.dev/) 是让这类声明更可信的完整性等级与出处证明，**不是**第三份 SBOM schema。[Sigstore](https://docs.sigstore.dev/) 是身份基签名与透明日志，可签 SBOM，**不定义** BOM 对象模型。

## 为什么重要

发布物、依赖树和构建记录常被口头说成「有 SBOM」。不分清单、等级、签名，就会把许可证短名、一份 JSON、一份出处证明、一次签名当成同一件事。本仓既有「无 SPDX」多半指 License List 短名缺失（[[concepts/动画库与动效管线|Spline runtime]]、[[concepts/CRDT与local-first|Upwelling]] 等），不证明已采用 SPDX 3 文档或 CycloneDX 1.7。先分层，再谈要不要做。卡内 fail closed 仍归 [[concepts/创意工坊与安全契约]]，与本页的成分清单不是同一份合同。

## 权威入口

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [SPDX 枢纽](https://spdx.dev/) | System Package Data Exchange™ |
| 2 | [SPDX Overview](https://spdx.dev/learn/overview/) | 3.0 大改 2.2.1；License List 另述 |
| 3 | [SPDX Specifications](https://spdx.dev/use/specifications/) | Current 表写 3.0 |
| 4 | [SPDX 3.0.1 HTML](https://spdx.github.io/spdx-spec/v3.0.1/) | 规范 HTML 标题 3.0.1 |
| 5 | [SPDX 3.1-RC1 公告](https://spdx.dev/spdx-3-1-ontology-and-schema-available-for-review/) | 2026-01-26；不升现行 |
| 6 | [CycloneDX 枢纽](https://cyclonedx.org/) | OWASP full-stack BOM |
| 7 | [CycloneDX Specification Overview](https://cyclonedx.org/specification/overview/) | 1.7 / ECMA-424 |
| 8 | [CycloneDX SBOM 能力页](https://cyclonedx.org/capabilities/sbom/) | 只谈软件成分清单能力 |
| 9 | [CycloneDX 1.7 JSON](https://cyclonedx.org/docs/1.7/json/) | `bomFormat: "CycloneDX"` |
| 10 | [SLSA 枢纽](https://slsa.dev/) | 完整性框架；先生成 provenance |
| 11 | [SLSA specification v1.2](https://slsa.dev/spec/v1.2/) | 现行；Build + Source |
| 12 | [About SLSA](https://slsa.dev/spec/v1.2/about) | 配料表 vs 操作规范 |
| 13 | [SLSA Provenance](https://slsa.dev/spec/v1.2/provenance) | 出处 ≠ SBOM |
| 14 | [Sigstore 文档枢纽](https://docs.sigstore.dev/) | Cosign / Fulcio / Rekor；可签 SBOM |

上表 **14** 条。CISA/NTIA 最低元素、ISO 目录页、`spdx.org` 许可证表本轮不当新条。B5-SBOM 的采集行不在本页镜像。

## 如何运作

### 四层，不要并成一份合同

| 层 | 代表 | 合同怎么说 |
|---|---|---|
| 清单格式 A | SPDX | Linux Foundation；数据模型 + 多种序列化；可表示 SBOM 及其他 BOM |
| 清单格式 B | CycloneDX | OWASP / Ecma；另一份 BOM 对象模型；`bomFormat` 必须是 `"CycloneDX"` |
| 完整性等级 | SLSA | 轨道 + 级别 + 出处证明；不是第三份 SBOM schema |
| 签名与透明日志 | Sigstore | Cosign / Fulcio / Rekor；可签 SBOM，不定义 BOM schema |

「有一份 JSON」不等于「已有 SPDX 文档」。有签名也不等于有清单。

### SPDX：清单格式 A，不是短名表

[枢纽](https://spdx.dev/)自称 System Package Data Exchange™，能表示带软件组件的系统之 SBOM，以及 AI / 数据 / 安全引用。规范是可免费取得的国际开放标准（ISO/IEC 5962:2021）。

[Overview](https://spdx.dev/learn/overview/) 写三种独立用法：用 3.0 工具、套 3.0 规范、参与开发。规范定义底层数据模型与多种序列化。原重心是许可 / 安全 / 组成；**3.0 是对 SPDX 2.2.1 的大改**，而 2.2.1 即免费的 ISO/IEC 5962:2021。3.0 扩到 AI 模型、数据集、构建信息。另述「经策展的 SPDX 许可证标识符与例外」——那是**另一份** SPDX 产物，不是本页的清单文档。

[规范索引](https://spdx.dev/use/specifications/) Current Version 表只列 **3.0**。[HTML](https://spdx.github.io/spdx-spec/v3.0.1/) 标题是 **Version 3.0.1**。两边并陈，不并号。[3.1-RC1](https://spdx.dev/spdx-3-1-ontology-and-schema-available-for-review/)（2026-01-26）是第一个 release candidate，不升现行。

### CycloneDX：清单格式 B，不是 SPDX 的序列化

[枢纽](https://cyclonedx.org/)自称 full-stack Bill of Materials。能力分列 SBOM、SaaSBOM、CBOM、VEX、HBOM、AI/ML-BOM；与 SPDX 并列，不当同一清单。

[规范总览](https://cyclonedx.org/specification/overview/) Current Version **1.7**（2025-10-21）。文档：JSON / XML / Protobuf。媒体类型：`vnd.cyclonedx+json`、`vnd.cyclonedx+xml`、`x.vnd.cyclonedx+protobuf`。Developed By：OWASP Foundation、Ecma International。Standards：**ECMA-424**（2025-12-10，TC54）。约定文件名 `bom.json` / `bom.xml` / `*.cdx.json` / `*.cdx.xml`。

[1.7 JSON](https://cyclonedx.org/docs/1.7/json/)：`bomFormat` **Required**，枚举只能是 `"CycloneDX"`（帮助识别文件，因 BOM 无强制文件名、JSON Schema 无命名空间）。`specVersion` Required。VEX / CBOM 是同规范下的**其他能力**，不并进「一份 SBOM」。CycloneDX 的 JSON 形状可用 JSON Schema 描述，见 [[concepts/JSON Schema与Protobuf]]；那是文档约束，不是第二份清单标准。

### SLSA：让清单可信，不是第三份 schema

[枢纽](https://slsa.dev/)：Supply-chain Levels for Software Artifacts，读作 “salsa”。OpenSSF。级别是讨论供应链有多硬的共同语言。入门写「先生成 provenance」。**不是 BOM 格式站**。

[v1.2](https://slsa.dev/spec/v1.2/) 是本轮核到的现行规范：轨道 + 级别 + 建议的 attestation（含 provenance）。Build Track 与 Source Track 分列。Provenance 与 VSA **建议、非规范必选**。同站 v1.1 仍活，页上横幅写 1.2 才是 current。

[About](https://slsa.dev/spec/v1.2/about) 官方分层句：SBOM 像配料表；**SLSA 是让配料表可信的食品安全操作规范**。SLSA 不告诉你源码是否按安全编码写；一件制品的 SLSA 级别**独立于**其依赖的级别。轨道内级别递增；文中写 Build Track 现为 Level 1–3。

[Provenance](https://slsa.dev/spec/v1.2/provenance) = 可验证信息，把制品沿供应链追回产地：在哪、何时、如何产出。Build provenance ≠ Source provenance ≠ SBOM。

### Sigstore：签制品，不定义清单

[文档枢纽](https://docs.sigstore.dev/)：OpenSSF / Linux Foundation 公益服务。签的对象包括发行文件、容器、二进制、**SBOM** 等。短命密钥。三件：Cosign 客户端；Fulcio 证书机构（OIDC 身份绑到短命证）；Rekor 只追加透明日志。身份基 / “keyless” 是默认；不是第三份清单格式。OIDC 委托本身见 [[concepts/OAuth与OIDC]]，本页不重抄。本页只收概念，不抄签发命令。

## 本轮版本快照

| 对象 | 页上怎么写 | 不当成 |
|---|---|---|
| SPDX 社区现行 HTML | 3.0.1 | ISO 5962；3.1-RC1 |
| SPDX 规范索引 Current | 3.0 | 与 3.0.1 强行并号 |
| SPDX ISO | 5962:2021 = 2.2.1 | 「ISO 已是 3.x」 |
| CycloneDX 规范 | 1.7（2025-10-21）；ECMA-424（2025-12-10） | SPDX 的一种序列化 |
| SLSA | v1.2 现行；v1.1 页仍在 | 第三份 SBOM |
| Sigstore | Cosign + Fulcio + Rekor | BOM schema |

## 必须保留的冲突

- **SPDX ≠ CycloneDX。** 两份独立清单标准：组织（Linux Foundation vs OWASP/Ecma）、现行社区版本（SPDX 3.0.1 HTML vs CycloneDX 1.7）、国际标准号（ISO/IEC 5962:2021 = SPDX **2.2.1** vs ECMA-424）、媒体类型与文件约定、对象模型都不同。CycloneDX 要求 `bomFormat: "CycloneDX"`。不能写成「SBOM 就是 SPDX」或「两者是同一份清单的两个序列化」。两边都留，本页不裁定谁当工坊默认。
- **ISO 5962 ≠ SPDX 3。** 枢纽/规范索引把「SPDX 规范」挂到 ISO/IEC 5962:2021；Overview 写明该 ISO 是 **2.2.1**。索引 Current 写 3.0，HTML 标题写 3.0.1。3.1 只是 RC。
- **SLSA / Sigstore 不是清单。** About 把 SLSA 写成让 SBOM 可信的处理规范；Sigstore 只签制品。不要第三份 schema。
- **许可证短名 ≠ SBOM。** 本仓既有「无 SPDX」不证明已采用 SPDX 3 文档。
- 本页映射的是成分清单与出处分层；**不是**「工坊必须上 SPDX / CycloneDX / SLSA」。

## 例子

- 正例：一份 CycloneDX 1.7 JSON 写 `bomFormat: "CycloneDX"` 与 `specVersion`，列出组件与依赖。
- 正例：同一制品另附 SLSA Build provenance，说明在哪、何时、如何产出。
- 正例：用 Sigstore 签上述 SBOM 文件；验证看身份、根信任与 Rekor 收录，不把签名当第二份 schema。
- 反例：把「仓库有 SPDX-License-Identifier: MIT」写成「已有 SBOM」。
- 反例：把 SPDX 与 CycloneDX 写成同一份清单的两种序列化。
- 反例：把 SLSA 级别或 Cosign 签名写成第三份 BOM 格式。

## 边界与易混概念

- 不包括：扫描器接入课、签发命令、自建证书机构或透明日志菜谱。
- 不包括：威胁步骤、绕过签名、伪造身份、供应链利用。
- 不包括：CISA/NTIA 最低元素、Wikipedia、厂商博客当规范。
- 不包括：本仓库已落地的 SBOM 管线或默认格式——**没有这回事**。
- 易混：许可证短名 ≠ SBOM 文档。Overview 另述 License List；本仓「无 SPDX」指短名缺失。
- 易混：ISO/IEC 5962:2021 ≠ SPDX 3。ISO 是 2.2.1；3.0 是对它的大改。
- 易混：SLSA provenance ≠ SBOM。出处证明追产地；清单列成分。
- 易混：Sigstore 签名 ≠ BOM schema。签的是制品（可含 SBOM）。
- 易混：CycloneDX 的 VEX / CBOM ≠ 「一份 SBOM」。同规范下的其他能力。
- 区分：先问「在写清单、在谈完整性等级，还是在签名」；再问「这是 SPDX、CycloneDX，还是本仓许可栏短名」。

## 映射到本仓库

映射放最后，不当过滤器。行业合同对发卡和工坊都成立，**不是「卡不能谈成分清单」**。本页不宣布已接线，也不选默认格式。

| 本仓物 | 实际在验 | 不是 |
|---|---|---|
| 「无 SPDX」/ Spline runtime | 许可证短名或 LICENSE 缺失 | SPDX 3 文档或 CycloneDX 1.7 |
| `verify-repo` / `harness-smoke` | 静态链接与协议接通 | SBOM 生成或 SLSA 级别 |
| 工坊 Gateway 发布物 | 包与所有权生命周期 | 已附 provenance 或 Cosign |
| 创意工坊安全契约 | 宿主 fail closed | 供应链完整性轨道 |
| 发卡回封 / 构建链 | compose/pack 或行业打包器 | 已附 SBOM；见 [[concepts/打包回封路径]]、[[concepts/构建链与Vite]] |
| 集群工作负载 | Pod / Deployment 对象 | 镜像已带 SLSA；见 [[concepts/Kubernetes工作负载]] |

浏览器防御头见 [[concepts/CSP与Trusted Types]]，与本页清单不是同一份。第五批把 SBOM 与 OAuth、OCI 同组为「身份与清单」：委托框架 / BOM 格式 / 镜像合同，都不是发卡依赖。错误体合同见 [[concepts/HTTP合同与问题详情]]，也不在本页。

## 来源与证据

- SPDX 分层与 3.0 大改 2.2.1：枢纽、Overview、规范索引 Current 表、3.0.1 HTML 标题、3.1-RC1 公告（2026-01-26）。
- ISO/IEC 5962:2021 = SPDX 2.2.1：Overview 原文；不能写成「ISO 已是 3.x」。
- CycloneDX 1.7 / ECMA-424 / `bomFormat`：规范总览与 1.7 JSON。
- SLSA v1.2 现行、provenance ≠ SBOM：v1.2 文首、About 配料表句、Provenance 页。同站 v1.1 仍活，横幅写 1.2 才是 current。
- Sigstore 三件与可签 SBOM：文档枢纽；不抄签发命令。
- 查询账本：[[queries/第五批蒸馏目标]] B5-SBOM。

已知冲突见上节，不静默覆盖。3.1 是否已在检索日之后升现行、SLSA 是否另出新 current：以各站文首为准，本页不预支。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] SPDX vs CycloneDX 没有并成一份清单
- [x] 冲突没有被静默覆盖
- [x] 无利用 / 绕过 / 攻击步骤
- [x] `tags` 只使用 SCHEMA 已有词（含 `safety`：只谈规范分层）
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[concepts/创意工坊与安全契约]]
- [[concepts/CSP与Trusted Types]]
- [[concepts/OAuth与OIDC]]
- [[concepts/JSON Schema与Protobuf]]
- [[concepts/构建链与Vite]]
- [[concepts/打包回封路径]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/动画库与动效管线]]
- [[concepts/CRDT与local-first]]
- [[queries/第五批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
