---
title: CSP与Trusted Types
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
  - https://www.w3.org/TR/CSP3/
  - https://www.w3.org/TR/CSP2/
  - https://www.w3.org/TR/trusted-types/
  - https://www.w3.org/TR/SRI/
  - https://www.w3.org/TR/2016/REC-SRI-20160623/
  - https://www.w3.org/TR/permissions-policy-1/
  - https://www.w3.org/TR/reporting-1/
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
  - https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
  - https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
  - 10-收件箱/写回候选/第五批-B5-CSP.md
  - queries/第五批蒸馏目标.md
  - concepts/创意工坊与安全契约.md
knowledge_class: factual
---

# CSP与Trusted Types

本页不是已采用防御栈，也不是工坊或宿主必须改响应头的工单。检索时间：2026-08-14。只写浏览器防御合同，不写绕过、payload、攻击步骤或 PoC。

## 一句话定义

四份合同互补，不是同一份头。Content Security Policy（CSP）约束文档能取/执行哪些资源；Trusted Types 把 DOM XSS 注入汇锁成只收不可伪造的类型化值；Subresource Integrity（SRI）核子资源字节是否对得上作者给出的哈希；Permissions Policy 选择开关浏览器能力。Trusted Types 的执行指令挂在 CSP 上。

## 为什么重要

用户代理默认会按文档声明去取并执行脚本、样式、框和 worker。作者需要一份浏览器能执行的合同，而不是事后靠字符串扫描。CSP3 文首写明：CSP **不是**注入防护第一线，是纵深。Trusted Types 只管 DOM 注入汇，不管服务端生成标记。卡内 origin allowlist 与契约 1.1.0 fail closed 是应用合同，见 [[concepts/创意工坊与安全契约]]，不要和浏览器头并成一份。

## 权威入口

| # | 入口 | 检索日状态 | 管什么 |
|---|---|---|---|
| 1 | [CSP3](https://www.w3.org/TR/CSP3/) | **WD 2026-08-13** | 现行短名 `/TR/CSP/` 也落到这里。按 Fetch 重写 |
| 2 | [CSP2](https://www.w3.org/TR/CSP2/) | **Rec 2016-12-15** | 目前唯一 Recommendation |
| 3 | [Trusted Types](https://www.w3.org/TR/trusted-types/) | **WD 2026-06-23** | DOM XSS 注入汇的类型锁 |
| 4 | [SRI 现行短名](https://www.w3.org/TR/SRI/) | **WD 2026-03-20** | `integrity`；另加 Integrity-Policy |
| 5 | [SRI 2016 Rec](https://www.w3.org/TR/2016/REC-SRI-20160623/) | **Rec 2016-06-23** | 仍在的 Recommendation；无 Integrity-Policy |
| 6 | [Permissions Policy](https://www.w3.org/TR/permissions-policy-1/) | **WD 2026-06-18** | 能力开关；曾用名 Feature Policy |
| 7 | [Reporting API](https://www.w3.org/TR/reporting-1/) | **WD 2025-06-11** | `report-to` 共用基础设施 |
| 8 | [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) | 指南 | 投递头 vs `http-equiv` |
| 9 | [MDN Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) | **Baseline Newly**（2026-02 起） | 三类型；策略由作者自写 |
| 10 | [MDN SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) | 指南 | `sha256` / `sha384` / `sha512`；跨源须 CORS |
| 11 | [MDN Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy) | **Experimental，非 Baseline** | 头与 iframe `allow` |
| 12 | [MDN Permissions-Policy 头](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy) | 头参考 | 指令表与 `report-to` 参数 |

上表 **12** 条。`/TR/CSP/` 与 1 同文，`/TR/feature-policy/` 与 6 同文，不另计。采集账本见 [[queries/第五批蒸馏目标]] 与 [[10-收件箱/写回候选/第五批-B5-CSP]]。MDN 指南正文若含威胁示例，本页不摘。

## 如何运作

### 四份合同怎么分

1. **CSP**：服务器（或早期 `meta`）告诉用户代理：这个文档能取哪些子资源、能否跑行内脚本/样式、谁能嵌它。L3 用 Fetch 挂钩。`meta http-equiv` **不支持** Report-Only，也不支持 `report-uri` / `frame-ancestors` / `sandbox`。
2. **Trusted Types**：只锁 **DOM XSS 注入汇**。作者定义策略，汇只收 `TrustedHTML` / `TrustedScript` / `TrustedScriptURL`。服务端反射、资源禁闭、外泄、一般子资源加载，规范列为 **非目标**，并回指模板系统或 CSP `script-src`。执行面靠 CSP 指令 `require-trusted-types-for` / `trusted-types`。
3. **SRI**：核的是**内容哈希**，不是服务器身份。TLS 只证明连对了谁。跨源带 `integrity` 必须能按 CORS 读到体。2016 Rec 只管 `script`/`link` 上的 `integrity`；2026 WD 另加文档级 Integrity-Policy。
4. **Permissions Policy**：管能力（地理、全屏、摄像头等），不管脚本从哪来。与 Permissions API（用户授权）不是同一份。禁用后子框不能自己再打开。

报告通道：L3 把 `report-uri` 标为弃用，改走 `report-to` + Reporting API；两者同时出现时以后者为准。Reporting API 本身不是防御指令。

### 现行 Level 与短名

[CSP2](https://www.w3.org/TR/CSP2/) 是 **2016-12-15 Recommendation**，目前唯一 Rec。文首写 WG **预期** L3 废止本 Rec，并鼓励实现跟 L3。

[CSP3](https://www.w3.org/TR/CSP3/) 检索日是 **Working Draft，2026-08-13**。现行短名 `/TR/CSP/` 落到 L3，不是 Rec。L3 按 Fetch 重写；恢复 `frame-src`；增加 `worker-src`；`report-uri` 让位 `report-to`。检索日 L3 **尚未**废止 L2。

引用必须写清 Level 与成熟度，不能把短名当成 Rec。实现可以跟 L3 WD，引用 Rec 时仍要能指到 L2。

### Trusted Types 不是 CSP 替代

[Trusted Types](https://www.w3.org/TR/trusted-types/) 引言与 Non-goals 写明：目标是 DOM 注入汇；不管服务端生成标记、资源禁闭、外泄、跨源 `data:` 文档执行，也不防恶意作者。MDN 写明 API **不自带净化**，策略由作者自写。TT 指令挂在 CSP 上，**不能**写成「有 TT 就不必 CSP」。

MDN 标 Trusted Types 为 Baseline Newly（2026-02 起）；Permissions Policy 标 Experimental、非 Baseline。不要写成同一成熟度。

## 必须保留的冲突

- **CSP2 Rec vs CSP3 WD。** 2 是 Rec；1 是 WD，且 `/TR/CSP/` 现落到 1。L2 文首鼓励实现跟 L3，并预期 L3 废止 L2；检索日 L3 **尚未**废止 L2。引用必须写清 Level 与成熟度，不能把短名当成 Rec。
- Trusted Types 只覆盖 DOM XSS 一角；TT 指令挂在 CSP 上，不能替代 CSP。
- SRI 短名现为 2026 WD；2016 Rec 仍在 dated URL。Integrity-Policy 只在新 WD。
- Permissions Policy ≠ Feature Policy 旧头。改名后 HTTP 语法变了；iframe `allow` 仍是旧写法。
- Permissions Policy ≠ Permissions API ≠ CSP。
- Reporting API 仍是 WD（2025-06-11）；L3 的 `report-to` 建在这份草稿上。
- 本页是入口蒸馏，**不是**「工坊或宿主必须上 CSP3」。

## 例子

- 正例：新站点实现跟 L3 WD，文档同时标明 `/TR/CSP3/` 是 WD、`/TR/CSP2/` 仍是 Rec。
- 正例：用 HTTP 头发 CSP；需要 `frame-ancestors` / `sandbox` / Report-Only 时不用 `meta http-equiv`。
- 正例：DOM 写入汇走 Trusted Types 策略；脚本从哪来仍用 CSP `script-src`。
- 正例：跨源脚本同时给 `integrity` 与 CORS，让用户代理能读体核哈希。
- 正例：能力开关用 Permissions-Policy 头；嵌套框的 `allow` 按旧 Feature Policy 写法单独写。
- 反例：把 `/TR/CSP/` 短名写成 Recommendation。
- 反例：声称 L3 已废止 L2，或把 L2 当现行实现真源而不标成熟度。
- 反例：写「上了 Trusted Types 就不必 CSP」。
- 反例：把卡内 origin allowlist 叫做浏览器 CSP。
- 反例：把本页当成绕过、payload 或 PoC 手册。

## 边界与易混概念

- 不包括：绕过、XSS payload、攻击步骤、PoC、nonce 操作手册、净化库配置、卡 JSON/PNG、凭证。
- 不包括：各浏览器对 L3 指令的实现差表；HTML / Fetch 里 integrity 与 CSP 挂钩的逐节算法。
- CSP ≠ Trusted Types ≠ SRI ≠ Permissions Policy。四份互补。
- CSP ≠ 卡内安全契约。后者是应用层 fail closed，见 [[concepts/创意工坊与安全契约]]。
- Permissions Policy ≠ Permissions API。前者是文档/框的能力合同，后者是用户授权提示。
- SRI ≠ TLS。哈希核内容，证书核身份。
- `report-uri` ≠ `report-to`。L3 以后者为准；通道本身不构成允许列表。
- 易混：听到「有 CSP」就以为注入已防住。CSP3 自己说它是纵深，不是第一线。

## 映射到本仓库

[[concepts/创意工坊与安全契约]] 的 origin allowlist 与契约 1.1.0 fail closed 是**卡内应用合同**，不是浏览器 CSP / Trusted Types / SRI / Permissions Policy。

[[concepts/git挂载与远程真身]] 只顺口提到 CSP，不升本页新发现。iframe 谁造窗见 [[concepts/酒馆宿主与iframe分层]]。错误体合同见 [[concepts/HTTP合同与问题详情]]，与本页防御头不是同一份。

本页只回答「这四份防御合同分别管什么、哪一级成熟」。不把工坊 Gateway 或酒馆宿主写成必须部署上述头。未声称本仓库发卡已带这些头。

## 来源与证据

- CSP2 Rec：`/TR/CSP2/` 文首 2016-12-15 Recommendation；预期 L3 废止、鼓励跟 L3。
- CSP3 WD：`/TR/CSP3/` 文首 WD 2026-08-13；短名 `/TR/CSP/` 同文；文首「不是注入防护第一线」。
- Trusted Types：`/TR/trusted-types/` WD 2026-06-23；引言与 Non-goals。
- SRI：短名 `/TR/SRI/` WD 2026-03-20；dated Rec 2016-06-23。
- Permissions Policy：`/TR/permissions-policy-1/` WD 2026-06-18；`/TR/feature-policy/` 同文。
- Reporting：`/TR/reporting-1/` WD 2025-06-11。
- MDN：CSP 指南、Trusted Types API（Baseline Newly）、SRI、Permissions Policy（Experimental）。
- 采集账本：[[queries/第五批蒸馏目标]] B5-CSP；分路原稿 [[10-收件箱/写回候选/第五批-B5-CSP]]。

已知冲突见上节，不静默覆盖。L3 是否已在检索日之后废止 L2：以 `/TR/CSP2/` 与 `/TR/CSP3/` 文首为准，本页不预支。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖（CSP2 Rec vs CSP3 WD 两边留）
- [x] 只写防御合同，未写绕过、payload、攻击步骤、PoC
- [x] `tags` 只使用 SCHEMA 已有词（含 `safety`：只谈规范合同）
- [x] 已发布到正式区

## 相关内容

- [[concepts/创意工坊与安全契约]]
- [[concepts/git挂载与远程真身]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/HTTP合同与问题详情]]
- [[queries/第五批蒸馏目标]]
- [[10-收件箱/写回候选/第五批-B5-CSP]]
