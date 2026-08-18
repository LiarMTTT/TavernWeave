---
title: WebRTC信令边界
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
  - https://www.w3.org/TR/webrtc/
  - https://www.w3.org/TR/2025/REC-webrtc-20250313/
  - https://www.rfc-editor.org/rfc/rfc8825.html
  - https://www.rfc-editor.org/rfc/rfc9429.html
  - https://www.w3.org/TR/mediacapture-streams/
  - https://www.w3.org/TR/webrtc-stats/
  - https://www.rfc-editor.org/rfc/rfc8831.html
  - https://www.rfc-editor.org/rfc/rfc8445.html
  - queries/第三批蒸馏目标.md
  - concepts/CRDT与local-first.md
  - concepts/前端架构名词与取舍.md
knowledge_class: factual
---

# WebRTC信令边界

本页不是已采用技术，也不是工坊或角色卡必须改上对等通话的工单。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]]（B3-RTC）。只收 API / 协议入口与范围边界，不写攻击步骤、CVE 或利用。

## 一句话定义

W3C WebRTC Rec 是浏览器里的 **`RTCPeerConnection` API 合同**：把本地轨和任意数据送到实现对等协议的另一端。**信令协议与信令信道不在本 Rec。** IETF 总览同样把客户端—服务器、服务器—服务器的信令选择标为套件范围外。JSEP 只让脚本控制本端 offer/answer 与 ICE，不规定消息怎么送到对端。

## 为什么重要

「上 WebRTC」常被写成一条栈。实际至少四层：采集（getUserMedia）、对等 API（本 Rec）、媒体/数据平面（IETF 套件）、应用自选的信令。混成一词，就会把 WebSocket 信令房、TURN 中继、或 DataChannel 当成 Rec 里的同一份规范。本仓库卡 iframe 与工坊都不因此改成对等通话栈；行业正当性仍保留。

## 权威入口

本轮打开过 [TR/webrtc](https://www.w3.org/TR/webrtc/)：页眉 **W3C Recommendation 13 March 2025**，短链指向 `REC-webrtc-20250313`。下列 **8** 条是本页真源，对齐账本「约条 8」。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [WebRTC Rec](https://www.w3.org/TR/webrtc/) | 现行枢纽。WebIDL API。含 Candidate Amendments。信令信道写 **unspecified means**。 |
| 2 | [REC-webrtc-20250313](https://www.w3.org/TR/2025/REC-webrtc-20250313/) | 同文带日期快照。Latest ED 在 `w3c.github.io/webrtc-pc/`，不要把 ED 当 Rec。 |
| 3 | [RFC 8825](https://www.rfc-editor.org/rfc/rfc8825.html) | 2021-01 总览 / 适用性声明。本身不定协议。信令路径选择 **outside the scope**。 |
| 4 | [RFC 9429 JSEP](https://www.rfc-editor.org/rfc/rfc9429.html) | 2024-04 Standards Track。**废止 RFC 8829**。不规定信令模型；与投递机制完全解耦。 |
| 5 | [Media Capture](https://www.w3.org/TR/mediacapture-streams/) | getUserMedia 真源。本轮 **CRD 2025-10-09**，不是 Rec。Rec 只扩展 `MediaStream` / `MediaStreamTrack`。 |
| 6 | [WebRTC Stats](https://www.w3.org/TR/webrtc-stats/) | `getStats` 标识符。本轮 **CRD 2025-09-25**，不是 Rec。 |
| 7 | [RFC 8831](https://www.rfc-editor.org/rfc/rfc8831.html) | 2021-01 数据通道：非媒体走 SCTP-over-DTLS。不是信令规范。 |
| 8 | [RFC 8445](https://www.rfc-editor.org/rfc/rfc8445.html) | ICE。JSEP / Rec 的连通性检查真源。8825 写明多数实现当时仍近 RFC 5245。 |

RFC 8826 / 8827 是安全架构与安全功能指针。本页**不蒸**其内容。

## 如何运作

### Rec 管本端对象

`RTCPeerConnection` 让一页与另一浏览器或实现对等协议的端点通信。引言三面：ICE / STUN / TURN 穿越；收发本地轨；直接送任意数据。总览在 RFC 8825 与 RFC 8826；采集在 GETUSERMEDIA。规范产品是实现这些接口的 user agent。

### 信令信道不在 Rec

§4.1：通信靠交换控制消息（a signaling protocol），信道由**未规定的手段**提供，一般是页内脚本经服务器，例如 `WebSocket` 或 `XMLHttpRequest`。Rec 定义 `createOffer` / `createAnswer` / `setLocalDescription` / `setRemoteDescription` / `addIceCandidate`，以及只读 `signalingState`。这些是本端状态，不是 SIP、也不是某家房间协议。

### JSEP 解耦投递

RFC 9429：媒体平面可控，信令平面尽量留给应用。实现几乎完全脱离核心信令流；脚本负责（1）传入本地/远端 session description，（2）与 ICE 状态机交互。offer/answer 仍按 RFC 3264 交换，但寻址、重传、fork、glare 全交给应用。图示是 Web App 之间走 App-Specific Signaling，JSEP 实现之间走 Media。

### IETF 总览同口径

RFC 8825：媒体路径尽量直连，必须符合套件；信令路径（high path）可经能改写信号的服务器。客户端—服务器与服务器—服务器选哪种协议、二者如何翻译，**在本文所述 WebRTC 协议套件范围外**。典型是 TLS 上的应用自有协议，不是网元透明插 SIP ALG。

### 采集与统计是邻接合同

麦克风/摄像头权限与约束在 Media Capture（仍 CRD）。`getStats` 的对象标识在 webrtc-stats（仍 CRD）。DataChannel 的非媒体传输在 RFC 8831，建立之后才有；它不能替代信令信道去完成首次 offer/answer。

### ICE 与 trickle

候选收集与连通性检查在实现内，因为只有实现知道候选。Trickle ICE（RFC 8838）允许描述先走、候选后到。`onicecandidate` 把候选交给应用，再由应用自己的信令送出。`canTrickleIceCandidates` 看远端描述是否声明支持。

## 行业何时该上

对照 [[concepts/前端架构名词与取舍]] 的实时表：那里列了轮询 / SSE / WebSocket，没有把 WebRTC 写成默认双向通道。

| 合同 | 何时该上 | 不该当成 |
|---|---|---|
| WebRTC Rec API | 浏览器要对等送轨或 DataChannel | 信令协议；房间服务；「Rec 已规定 WebSocket」 |
| 应用信令（常 WS / HTTP） | 交换 SDP 与 ICE 候选 | Rec 的一部分；媒体平面 |
| JSEP / RFC 9429 | 要对齐 offer/answer 与 ICE 时序 | 可替换 Rec 的第二套 API |
| getUserMedia | 要本机麦/摄/屏 | 已是 Rec；对等传输本身 |
| RFC 8831 DataChannel | 对等连上之后送非媒体消息 | 首次协商用的信令总线 |
| TURN / `iceServers` | 直连失败时的中继配置 | 信令服务器；Rec 里的必选公网中继 |

## 必须保留的冲突

- 信令不在 Rec，也不在 IETF 套件。Rec 仍暴露 `signalingState` 与 offer/answer API；8825 / 9429 把协议与投递标为范围外。不要把 API 状态机写成「规范已定信令」。
- Rec 已是 2025-03-13，但含 Candidate Amendments；ED 另站。8825 仍引用当时的 W3C WD 短名。
- JSEP 现行 9429，旧文与部分实现注释仍写 8829。
- getUserMedia 与 Stats 仍是 CRD，WebRTC API 已是 Rec。
- 8825 正式依赖 RFC 8445，同时写多数实现当时仍近 RFC 5245。
- 「工坊 / 卡不采用 WebRTC」不是「Rec 不是正当行业合同」。

## 例子

- 正例：页内 `createOffer` → `setLocalDescription` → 把 SDP **用自己的** WebSocket 房间送出；对端 `setRemoteDescription` → `createAnswer` 再送回。信道是应用合同。
- 正例：把 Yjs / Automerge 增量交给已建立的 DataChannel。通道选择见 [[concepts/CRDT与local-first]]；文档层不假定 WebRTC。
- 反例：写「按 WebRTC Rec 做信令」或把 `signalingState` 当成房间协议状态机。
- 反例：引用 RFC 8829 当现行 JSEP，或把 2025-03-13 Rec 写成「已无修正、与 ED 逐字相同」。
- 反例：把 getUserMedia 或 `getStats` 标识符写成 Rec 正文；二者本轮仍是 CRD。
- 反例：用 DataChannel 充当**第一条** offer 的投递通道——通道本身还没协商完。

## 边界与易混概念

- 不包括：CVE、凭证、具体 SFU 产品课、工坊换栈工单。
- WebRTC Rec ≠ 信令规范。Rec 有 `signalingState`，没有信令协议。
- JSEP ≠ 信令协议。JSEP 是本端控制面；投递机制完全解耦。
- RFC 8829 ≠ 现行 JSEP。现行是 RFC 9429。
- getUserMedia ≠ `RTCPeerConnection`。前者仍是 CRD。
- DataChannel ≠ 信令信道。前者是对等数据平面。
- WebSocket ≠ WebRTC。WS 常被选作信令载体，不是 Rec 的必选。
- WebRTC ≠ WebCodecs。帧编解码见 [[concepts/媒体格式与编解码]]；对等传输是本页。
- 酒馆卡 iframe 不是对等通话宿主；本页不自动落到卡内。见 [[concepts/酒馆宿主与iframe分层]]。

## 映射到本仓库

当前发卡与工坊开发线都不因本页改上对等通话或自建信令房。[[concepts/前端架构名词与取舍]] 的实时默认仍是轮询 / SSE / WebSocket。[[concepts/CRDT与local-first]] 把 WebRTC 只当可选字节通道。本页只钉入口与冲突，不是采用通知。

## 来源与证据

- Rec 日期与地位：本轮 [TR/webrtc](https://www.w3.org/TR/webrtc/)「W3C Recommendation 13 March 2025」；「This document includes Candidate Amendments。」
- 信令未规定：同文 §4.1「signaling channel which is provided by unspecified means」。
- 套件范围外：RFC 8825「The choice of protocols for client-server and inter-server signaling … are outside the scope of the WebRTC protocol suite」。
- JSEP 解耦与废止：RFC 9429 Abstract「obsoletes RFC 8829」；§3.1「totally decoupled from the actual mechanism」。
- 采集 / 统计仍是草案：Media Capture CRD 2025-10-09；webrtc-stats CRD 2025-09-25。
- 数据通道：RFC 8831 Abstract，非媒体走 SCTP-over-DTLS。
- 查询账本：[[queries/第三批蒸馏目标]] B3-RTC。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/CRDT与local-first]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/酒馆宿主与iframe分层]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/媒体格式与编解码]]
