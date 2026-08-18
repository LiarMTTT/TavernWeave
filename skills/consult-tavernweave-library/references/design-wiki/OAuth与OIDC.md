---
title: OAuth与OIDC
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
  - https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
  - https://datatracker.ietf.org/wg/oauth/documents/
  - https://www.rfc-editor.org/rfc/rfc6749.html
  - https://www.rfc-editor.org/rfc/rfc6750.html
  - https://www.rfc-editor.org/rfc/rfc7636.html
  - https://www.rfc-editor.org/rfc/rfc8252.html
  - https://www.rfc-editor.org/rfc/rfc8414.html
  - https://www.rfc-editor.org/rfc/rfc9101.html
  - https://www.rfc-editor.org/rfc/rfc9126.html
  - https://www.rfc-editor.org/rfc/rfc9207.html
  - https://www.rfc-editor.org/rfc/rfc9449.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
  - https://www.rfc-editor.org/rfc/rfc9728.html
  - https://openid.net/developers/specs/
  - https://openid.net/specs/openid-connect-core-1_0.html
  - https://openid.net/specs/openid-connect-discovery-1_0.html
  - https://openid.net/specs/fapi-security-profile-2_0-final.html
  - https://www.w3.org/TR/fedcm/
  - queries/第五批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# OAuth与OIDC

本页不是已采用授权栈，也不改工坊或角色卡鉴权。检索时间：2026-08-14。只谈公开规范入口，不写攻击步骤、绕过、PoC 或凭证。账本枢纽是 [[queries/第五批蒸馏目标]] **B5-OAuth**（15 条入口，本页全收）。人到依赖方的公钥凭证见 [[concepts/通行密钥规范入口]] 与 [[queries/第二批蒸馏目标]] **B2-Auth**，本页不重抄。

## 一句话定义

OAuth 是委托框架：客户端经授权服务器拿到对受保护资源的有限访问许可。OIDC 叠在 OAuth 2.0 上，用 `openid` scope 与 ID Token 回答「人是谁」。没有这层就还是纯委托。二者都不是授权模型，也不是通行密钥。

## 为什么重要

产品常把 RFC 6749、2.1 草案、OIDC、FAPI 并成「已经上了 OAuth 2.1」。哪一份已是 RFC / OpenID Final、哪一份仍是草案，决定能不能当现行合同引用。**OAuth 2.1 仍是草案**，不能写成已废止 2.0。工坊现网 OAuth 只证明发布者，见 [[concepts/后端架构名词与工坊对照]]；本页只给规范入口，不改那一页的落点。

## 权威入口

检索 2026-08-14。15 条，不是教程，也不镜像全文。B2-Auth 的 WebAuthn / CTAP 行不在此表。规范安全节只链不展开。

| # | 入口 | 检索日状态 | 管什么 |
|---|---|---|---|
| 1 | [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html) | PS，2012-10；被 8252 / 8996 / 9700 更新 | OAuth 2.0 授权框架；废止 1.0（5849） |
| 2 | [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html) | PS，2012-10；被 8996 / 9700 更新 | Bearer 持有即用；不是持有证明 |
| 3 | [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html) | PS，2015-09 | PKCE；公开客户端的 code 交换绑定 |
| 4 | [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html) | BCP 212，2017-10；更新 6749 | 原生应用走外部用户代理 |
| 5 | [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html) | PS，2018-06 | 授权服务器元数据 |
| 6 | [RFC 9101](https://www.rfc-editor.org/rfc/rfc9101.html) | PS，2021-08 | JAR：请求参数进 JWT；与 PAR 互补 |
| 7 | [RFC 9126](https://www.rfc-editor.org/rfc/rfc9126.html) | PS，2021-09 | PAR：直推授权请求，换 `request_uri` |
| 8 | [RFC 9207](https://www.rfc-editor.org/rfc/rfc9207.html) | PS，2022-03 | 授权响应里的 `iss` |
| 9 | [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html) | PS，2023-09 | DPoP：应用层持有证明 |
| 10 | [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) | BCP 240，2025-01；更新 6749 / 6750 / 6819 | 现行安全实践；写明 2.1 将吸收本文 |
| 11 | [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728.html) | PS，2025-04 | 受保护资源元数据；对 8414 |
| 12 | [draft-ietf-oauth-v2-1-15](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) | **WG Document**；2026-03-02；过期 2026-09-03；里程碑 Dec 2026 交 IESG | 自称将替换 6749 / 6750；**还不是 RFC** |
| 13 | [OIDC Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) | OpenID **Final**；短链已含 errata set 2；2023-12-15 | 叠在 OAuth 2.0 上的身份层与 ID Token |
| 14 | [OIDC Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html) | Final + errata set 2；2023-12-15 | RP 发现 OP 与 OAuth 端点 |
| 15 | [FAPI 2.0 Security Profile](https://openid.net/specs/fapi-security-profile-2_0-final.html) | OpenID **Final**，2025-02-22 | 高安全剖面，不是新框架 |

W3C 对照（不升为本表第 16 条）：[FedCM](https://www.w3.org/TR/fedcm/) 检索日仍是 **FPWD，2024-08-20**。浏览器联邦登录 API，不是 OAuth / OIDC 文本。B2-Auth 已收，见 [[concepts/通行密钥规范入口]]。

刻意未收：`draft-ietf-oauth-browser-based-apps`（RFC Ed Queue，尚无 RFC 号）；`draft-ietf-oauth-security-topics-update-03`（仍是 WG Document，不能写成已替换 9700）；已过期 Token Binding 草案；RFC 10027（跨设备流 BCP 247，相邻但不在本题）；OIDC Dynamic Client Registration 与 RFC 7591（同族不另开行）；oauth.net 社区门户、厂商 SDK、OpenID 2.0 历史。

## 如何运作

OAuth / OIDC 不是单一 RFC。六层只标边界，不写实现步骤。

1. **委托**：[RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html) 写授权码等许可类型；[RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html) 收原生应用走外部用户代理。[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) 与 2.1 草案收紧仍写在 6749 里的旧模式，但 6749 正文仍在。**2.1 仍是 `-15` 草案，不是现行 RFC。**
2. **绑定**：[RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html) PKCE（读 pixy）绑 code 交换；[RFC 9126](https://www.rfc-editor.org/rfc/rfc9126.html) PAR 把请求体从用户代理挪到直连，换 `request_uri`；[RFC 9101](https://www.rfc-editor.org/rfc/rfc9101.html) JAR 可选再把参数装进 JWT。PAR ≠ JAR，可并用。
3. **出示**：[RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html) Bearer 是持有即用；[RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html) DPoP 另加应用层持有证明，约束 access / refresh。DPoP 不代替客户端认证，也不废止 6750。
4. **发现**：[RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html) 看授权服务器；[RFC 9728](https://www.rfc-editor.org/rfc/rfc9728.html) 看资源服务器；OIDC Discovery 再加 OP 身份端点。
5. **身份层**：[OIDC Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) 要 `openid` scope 与 ID Token。OAuth 本身不提供标准的最终用户认证信息。
6. **剖面**：[FAPI 2.0](https://openid.net/specs/fapi-security-profile-2_0-final.html) 挑选并加严 1–5（PKCE `S256`、PAR、发送方约束），不是第三套框架。

[RFC 9207](https://www.rfc-editor.org/rfc/rfc9207.html) 给授权响应加 `iss`。规范安全节只链不展开，不摘利用面。

## 必须保留的冲突

- **2.1 未废 6749。** `-15` 文首写 replaces / obsoletes 6749 与 6750，但 datatracker 状态是 I-D Exists / WG Document。6749 仍是已刊 PS。9700 也写 2.1 尚在开发、将吸收 BCP。两边都留，不把草案当已废止 2.0。
- 2.1 自称与 2.0 兼容但收紧：PKCE 进核心；Implicit 与 Resource Owner Credentials **不写入** 2.1。6749 正文仍列这些许可类型。9700：ROPC **MUST NOT**；implicit（`response_type=token`）**SHOULD NOT**。产品若只引 6749 会与 BCP / 2.1 草案打架。
- PKCE 三档不要并成「只给 App」：7636 标题针对公开客户端；9700 对公开客户端 **MUST**、对机密客户端 **RECOMMENDED**；2.1 把 PKCE 收成核心要求。
- PAR ≠ JAR；DPoP ≠ Bearer ≠ mTLS。9126 写明 PAR 与 JAR 可并用。9449 **不是**客户端认证方法，也不取代 6750。
- OAuth ≠ OIDC ≠ 授权模型 ≠ WebAuthn。OIDC Core 自写叠在 6749 上；没有这层就没有标准 ID Token。
- OIDC 短链检索日已是 **errata set 2**，不是 2014 初版。Discovery 同步。
- FAPI 2.0 是剖面。未采用 FAPI ≠ 未采用 OAuth。
- FedCM 是 FPWD；AuthZEN 是 PDP 合同。浏览器应用 BCP、9700 修订草案、过期 Token Binding：**不成 RFC 不升表**。
- **映射 ≠ 采用。** 工坊 OAuth 只证明发布者，不等于行业不再谈 2.1 / OIDC。

## 例子

- 正例：现行可引用的授权框架写成 **RFC 6749 + RFC 9700**，并另注 2.1 仍是 `-15` 草案。
- 正例：要身份层就引 OIDC Core（errata set 2）与 Discovery，不把「有 OAuth」写成「已有 ID Token」。
- 正例：高安全剖面另引 FAPI 2.0 Final；未采用 FAPI ≠ 未采用 OAuth。
- 反例：把 datatracker 上的 2.1 草案写成已废止 6749 / 6750。
- 反例：把 PKCE、PAR、JAR、DPoP 并成同一个开关，或把 DPoP 写成已取代 Bearer RFC。
- 反例：把 FedCM、AuthZEN PDP API 或通行密钥叫做 OAuth / OIDC 的下一版。
- 反例：因本页出现 OAuth 就写进 recipe / 发卡依赖，或写成「本仓库已采用 2.1 / DPoP / PAR / FAPI」。
- 反例：把本页当成攻击、绕过或 PoC 手册。

## 边界与易混概念

- 不包括：钓鱼、凭证样例、厂商接入教程、OWASP 操作清单、把卡做成登录提供方。规范安全节回链 9700 / 各 RFC，不摘利用面。
- 不包括：攻击步骤、绕过、PoC、Gateway token、对象存储凭证、卡 JSON/PNG。
- OAuth ≠ OIDC。前者是委托；后者才给标准的最终用户认证信息。
- OAuth ≠ 授权模型。工坊对照页已写这句：委托证明「谁来证明人」，不管角色与权限表。
- OAuth ≠ WebAuthn。通行密钥是另一场仪式，见 [[concepts/通行密钥规范入口]]。
- PAR ≠ JAR。9126 直推载荷；9101 把参数装进 JWT。FAPI 2.0 要 PAR，不是自动要 JAR。
- DPoP ≠ Bearer ≠ 证书绑定。6750 持有即用；9449 应用层持有证明；证书绑定见 RFC 8705（本批不升表）。
- FAPI 2.0 是剖面，不是第三套授权框架。
- FedCM 是 W3C FPWD，不能写成 OIDC 的下一版。
- OpenID 目录里的 AuthZEN Authorization API 是 PDP/PEP 决策合同，不是授权码流。名字都叫 authorization，合同不同。

## 映射到本仓库

映射放最后，不当过滤器。行业句对独立站仍成立。

[[concepts/后端架构名词与工坊对照]] 已写：Cookie 管浏览器会话；JWT 管声明信封；OAuth 管谁来证明人。三件可叠，不是三选一。当前工坊：Gateway 同进程管包生命周期 + 所有权 + 审核；**OAuth 只证明发布者**，伪匿名，不是玩家追踪。卡内 fail closed 见 [[concepts/创意工坊与安全契约]]。产品禁令表见 [[comparisons/工坊架构该上与不该上]]。

因此：

1. **本仓现网不是 OAuth 2.1 / OIDC / FAPI 栈。** 不要把草案或剖面写成已采用依赖。
2. 发布者证明仍按对照页：OAuth 委托，不是授权模型，也不是卡内角色权限。
3. 人到依赖方的公钥凭证走 [[concepts/通行密钥规范入口]]，不与本页并成「无密码登录」。
4. 独立工坊站**可以**谈 6749 + 9700 或将来的 2.1；那是顶层站点合同，不是「本仓已上 2.1」。

本页不写「已采用 2.1 / PKCE / PAR / DPoP / FAPI」。

## 来源与证据

- 查询账本：[[queries/第五批蒸馏目标]] B5-OAuth；细表仍在 [[10-收件箱/写回候选/第五批-B5-OAuth]]；边界对照 [[queries/第二批蒸馏目标]] B2-Auth。
- 版本钉：2.1 为 **-15**（2026-03-02，过期 2026-09-03，里程碑 Dec 2026 交 IESG）；OIDC 短链 errata set 2（2023-12-15）；FAPI Final **2025-02-22**；9700 = BCP 240（2025-01）；9728 = 2025-04。
- 2.1 状态：datatracker 为 I-D Exists / WG Document，Intended RFC status 为空；文首自称 replaces / obsoletes 6749 与 6750。
- 9700 文首写 2.1 尚在开发、将吸收本文。6749 检索日仍是已刊 PS。
- FedCM：`/TR/fedcm/` 文首 FPWD 2024-08-20。
- 时间：2026-08-14。B5 账本记 WebFetch 核过上表枢纽文首与 WG 文档表。超时 / 404 不升表。

已知冲突见上节，不静默覆盖。2.1 是否已在检索日之后交 IESG 或成 RFC：以 datatracker 对该 draft 的状态为准，本页不预支。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词（含 `safety`：只谈规范入口，不写攻击）
- [x] 已发布到正式区

## 相关内容

- [[concepts/后端架构名词与工坊对照]]
- [[concepts/创意工坊与安全契约]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/通行密钥规范入口]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[queries/第五批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-OAuth]]
