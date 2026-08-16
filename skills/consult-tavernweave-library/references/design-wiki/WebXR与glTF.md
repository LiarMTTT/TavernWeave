---
title: WebXR与glTF
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
  - https://www.w3.org/TR/webxr/
  - https://www.w3.org/TR/webxr-ar-module-1/
  - https://www.w3.org/TR/webxr-gamepads-module-1/
  - https://www.w3.org/TR/webxr-hit-test-1/
  - https://www.w3.org/TR/webxr-dom-overlays-1/
  - https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
  - https://developer.mozilla.org/en-US/docs/Web/API/WebVR_API
  - https://www.khronos.org/gltf/
  - https://registry.khronos.org/glTF/
  - https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  - https://github.khronos.org/glTF-Validator/
  - https://modelviewer.dev/
  - https://modelviewer.dev/examples/augmentedreality/index.html
  - https://aframe.io/
  - https://aframe.io/docs/1.8.0/introduction/
  - https://developer.apple.com/augmented-reality/quick-look/
  - https://developers.google.com/ar/develop/java/scene-viewer
  - queries/第三批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - queries/第四批蒸馏目标.md
  - queries/第七批蒸馏目标.md
  - concepts/酒馆宿主与iframe分层.md
  - concepts/媒体库路径.md
  - concepts/CSP与Trusted Types.md
knowledge_class: factual
---

# WebXR与glTF

本页不是已采用技术，也不是工坊或角色卡必须上 XR / glTF 的工单。检索时间：2026-08-14。蒸馏 [[queries/第三批蒸馏目标]] **B3-XR**。引擎与着色只引用 [[queries/第二批蒸馏目标]] **B2-3D**、[[queries/第四批蒸馏目标]] **B4-3D**，不重抄。只谈公开会话合同与资产格式，不写攻击、指纹、盗版模型包或 ISO 付费全文。

## 一句话定义

WebXR 是浏览器里开 VR/AR 会话的合同：查能力、要会话、跑帧、交姿态。glTF 是运行时 3D 资产投递格式：JSON 描述场景，可打成单个 `.glb`。会话合同 ≠ 资产格式 ≠ 原生预览壳 ≠ Three/Babylon 引擎。

## 为什么重要

「页里转一个模型」和「进头显」不是同一条 API。资产走 glTF 或 USDZ；进会话走 `navigator.xr`；Android 还可能甩给 Scene Viewer，iOS 甩给 AR Quick Look。混成一词，就会把已废的 WebVR、付费 ISO 12113、或引擎手册当成 WebXR 正文。

卡 iframe 要安全上下文、瞬时激活，以及 Permissions-Policy `xr-spatial-tracking`，见 [[concepts/酒馆宿主与iframe分层]] 与 [[concepts/CSP与Trusted Types]]。无策略时不要假装能进头显。

## 权威入口

检索日 2026-08-14。下表 **16** 条是本页真源；规范极厚只链不搬。ISO/IEC 12113:2022 付费全文不收。盗版模型包与攻击步骤不收。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [W3C WebXR Device API](https://www.w3.org/TR/webxr/) | B3-XR 枢纽；**CR Draft 2026-06-09**，不是 Rec。`navigator.xr.isSessionSupported()` / `requestSession()`；模式 `inline` / `immersive-vr`；`immersive-ar` 行为在 AR 模块。要安全上下文与瞬时激活；沉浸会话要 Permissions-Policy `xr-spatial-tracking` |
| 2 | [WebXR AR Module L1](https://www.w3.org/TR/webxr-ar-module-1/) | **CR Draft 2025-04-25**。定义 `immersive-ar`：独占设备且意图与真实环境混合。显示分 additive / pass-through / opaque |
| 3 | [WebXR Gamepads Module L1](https://www.w3.org/TR/webxr-gamepads-module-1/) | **WD 2025-07-07**。`XRInputSource.gamepad`；`xr-standard` 映射。此对象**不得**出现在 `navigator.getGamepads()` |
| 4 | [WebXR Hit Test](https://www.w3.org/TR/webxr-hit-test-1/) | **WD 2025-12-11**。对真实世界几何打射线；对应用自己的虚物打点不在范围。特性描述符 `hit-test` |
| 5 | [WebXR DOM Overlays](https://www.w3.org/TR/webxr-dom-overlays-1/) | **WD 2024-09-24**，页头自称 Unstable。沉浸会话里把**一个** DOM 元素画成透明 2D 层 |
| 6 | [MDN WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) | 实现面入口；标 Limited / Experimental。模块表含 Anchors / Depth / Hand / Layers / Lighting。AR 能力来自 AR 模块，不在核心 TR 写完 |
| 7 | [MDN WebVR API](https://developer.mozilla.org/en-US/docs/Web/API/WebVR_API) | **已废弃**；从未批准成标准；继任是 WebXR。`getVRDisplays()` / `requestPresent()` 不是现行合同 |
| 8 | [Khronos glTF 总站](https://www.khronos.org/gltf/) | runtime 3D asset delivery；JSON + `.glb`。提到 ISO/IEC 12113:2022，**付费全文不收** |
| 9 | [Khronos glTF Registry](https://registry.khronos.org/glTF/) | 现行 **2.0**；可读合同是 **2.0.1** HTML/PDF。补丁只做澄清与反向兼容修复。扩展另册 Markdown |
| 10 | [glTF 2.0.1 规范](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) | 页头 version **2.0.1**（2021-10-11）。API 中立的运行时投递，不是引擎场景图 |
| 11 | [glTF Validator](https://github.khronos.org/glTF-Validator/) | 对照 2.0 与扩展做校验；浏览器本地跑，不上传资产 |
| 12 | [`<model-viewer>`](https://modelviewer.dev/) | B3-XR-07；Apache-2.0。页内 3D + AR。WebXR 模式要 Device API / Hit Test / DOM Overlay。重叠 B3-Bab / B4-3D，不当新引擎 |
| 13 | [model-viewer AR 示例](https://modelviewer.dev/examples/augmentedreality/index.html) | 三壳：`webxr`（现默认）、`scene-viewer`、`quick-look`。iframe 要 `xr-spatial-tracking`；HTTPS。DOM **流不进** Scene Viewer / Quick Look。无 `ios-src` 时现场生成 USDZ |
| 14 | [A-Frame 1.8.0 介绍](https://aframe.io/docs/1.8.0/introduction/) | HTML + ECS，底层 three.js。首页仍标 **Make WebVR**，示例仍名 Hello WebVR；介绍仍写「unlimited access to … WebVR」且「optimized from the ground up for WebVR」。`/docs/` 根路径本轮 **500** |
| 15 | [Apple AR Quick Look 画廊](https://developer.apple.com/augmented-reality/quick-look/) | 画廊可读：Safari / Messages 等用 **USDZ**。ARKit 编程页 `documentation/arkit/previewing_a_model_with_ar_quick_look` 与连字符变体本轮 **超时**，不假装读过 |
| 16 | [Android Scene Viewer](https://developers.google.com/ar/develop/java/scene-viewer) | 原生 intent，不是页内 WebXR。`file=` 指向托管 glTF；要 ARCore 设备 + Play Services for AR + Google 应用 |

上表 **16** 条。同簇不占名额：B2-3D 的 WebGPU TR；B4-3D 的 Three / R3F / Babylon；B3-Bab；B3-Canv（Canvas 2D）。编辑稿 `https://immersive-web.github.io/webxr/` 对齐 TR，不另开条。USD 组合场景见 [[queries/第七批蒸馏目标]] **B7-USD**，不占本表。

## 如何运作

### 会话：查 → 点 → 要 → 帧

典型流：`isSessionSupported(mode)` → 页面广告 XR → 等瞬时激活 → `requestSession(mode)` → 帧循环出图直到会话结束。`inline` 必须支持，输出在 HTML 里；默认 inline 设备不报姿态。`immersive-vr` 独占头显且不意图混现实。`immersive-ar` 由 AR 模块定义，核心 TR 写明未实现该模块就不得把该模式列入设备。无 `xr-spatial-tracking` 时沉浸会话被拒；inline 仍可开，参考空间收成 `viewer`。

WebGL 上下文要 `xrCompatible` 才能交给会话。这是绑定，不是第二套渲染器。Three / Babylon 怎么建场景归 B2-3D / B4-3D。

手柄态在 Gamepads 模块：`XRInputSource.gamepad` 每帧原地更新，不能跨帧比对象引用。`id` 必须空串。

### 资产：glTF ≠ USDZ ≠ 引擎对象

glTF 2.0 用 JSON 描述 scenes / nodes / meshes / buffers / materials / textures / skins / animations，可打成 `.glb`。扩展（KHR_* 等）在 Registry 另册。校验用 Validator，不要用引擎「能打开」当符合性。ISO 12113:2022 只是国际标准编号，不是可免费引用的正文；本页以 Khronos 2.0.1 HTML 为准。

iOS Quick Look 主吃 USDZ（或 `.reality`）。model-viewer 可现场生成 USDZ，但示例写明自动档还不稳带动画。Android Scene Viewer 吃托管 glTF，走 intent，离开浏览器。

静图 / 视频容器与帧编解码归 [[concepts/媒体格式与编解码]]，不是 glTF。USD 是组合场景，不是本页的传输网格，见 [[queries/第七批蒸馏目标]] B7-USD。

### 三壳不要并成一词

| 壳 | 还在哪 | 资产 | DOM 能否跟着进 AR |
|---|---|---|---|
| WebXR + model-viewer / 自绘 | 浏览器会话 | glTF | 可以（DOM Overlay 另模块，仍 Unstable） |
| Scene Viewer | Android 原生 | glTF URL | 否 |
| AR Quick Look | iOS / visionOS 系统预览 | USDZ | 否 |

A-Frame 是 three.js 上的声明式壳，不是 WebXR 规范实现，也不是 glTF 校验器。

## 必须保留的冲突

- **A-Frame 仍写已废 WebVR。** MDN 写 WebVR 已弃、从未批准、应迁 WebXR。A-Frame 1.8.0 首页仍「Make WebVR」，介绍仍列 WebVR 并无条件写「为 WebVR 优化」。两边都留：文档口径过时；实现可能已坐在 Three / WebXR 上。不要静默改写成「A-Frame = WebXR」。
- **Apple AR Quick Look 文档超时。** 2026-08-14 直读 `developer.apple.com/documentation/arkit/previewing_a_model_with_ar_quick_look`（及连字符变体）超时。活源只到画廊页。不补未读到的 API 细节。
- **核心 CRD ≠ 模块 Rec。** Device API 是 2026-06-09 CRD；AR 是 2025-04-25 CRD；Gamepads / Hit Test / DOM Overlay 仍是 WD。MDN 模块表不是成熟度表。
- **页内 WebXR ≠ 原生预览。** Scene Viewer 与 Quick Look 带走会话；页面 DOM 不跟着走。
- **ISO 12113 ≠ 可引用正文。** 总站提到国际标准；本库只链 Khronos 2.0.1。
- **A-Frame `/docs/` 根路径本轮 500**；可读介绍在 `/docs/1.8.0/introduction/`。
- 本页映射 iframe 策略与资产槽位；**不是**「工坊已上 WebXR / glTF / model-viewer / A-Frame」。

## 例子

- 正例：先 `isSessionSupported('immersive-vr')`，用户点击后再 `requestSession`；iframe 写上 `allow="xr-spatial-tracking"`。
- 正例：商品模型发 glTF 2.0，用 Validator 过扩展；页内用 model-viewer，Android 可回落 Scene Viewer，iOS 另备 USDZ。
- 反例：把 A-Frame 文档里的 WebVR 写成现行标准，或调用 `navigator.getVRDisplays()`。
- 反例：引用 ISO 12113 付费 PDF，或把新闻里的「glTF 2.1」写成 Registry 现行版本。
- 反例：在无策略的 TH iframe 里申请 `immersive-ar`，或指望 Quick Look 里还能点页面按钮。

## 边界与易混概念

- 不包括：ISO 付费全文、盗版模型包、攻击或指纹利用步骤、卡 JSON/PNG、选题成品。
- WebXR ≠ WebVR。后者已废，从未成 Rec。
- WebXR ≠ OpenXR。OpenXR 是原生运行时，不在本页。
- glTF ≠ USDZ ≠ FBX。投递合同与系统预览格式不是同一个。
- glTF ≠ Three / Babylon 场景图。引擎入口见 B2-3D / B4-3D。
- glTF ≠ USD。传输网格 ≠ 组合场景；材质扩展也不等于 MaterialX。
- `<model-viewer>` ≠ 自建 `XRSession`。它是组件，默认可走三壳。
- Canvas 2D 归 B3-Canv；三维规范归 B2-3D。静图 / 视频编解码归 [[concepts/媒体格式与编解码]]。
- DOM Overlay ≠ 宿主 HUD。后者见 [[concepts/入口外壳与HUD宿主]]。
- 本页不是「工坊已上 XR」。

## 映射到本仓库

映射放最后，不当过滤器。本仓是否接线、真机是否验收，都不在本页宣布。

- **iframe**：[[concepts/酒馆宿主与iframe分层]]。沉浸会话要框上的 `xr-spatial-tracking`，还要安全上下文与瞬时激活。无策略时不要假装能进头显。策略头分层见 [[concepts/CSP与Trusted Types]]。
- **嵌入路径**：[[comparisons/嵌入三路径对照]]。原生预览壳会离开宿主页，不是 TH 消息框 HUD。
- **资产**：[[concepts/媒体库路径]] 管槽位与来源，不是 glTF 符合性。静图 / 视频合同见 [[concepts/媒体格式与编解码]]。
- **引擎**：Three / WebGPU / Babylon 不在本页展开，见 [[queries/第二批蒸馏目标]] B2-3D、[[queries/第四批蒸馏目标]] B4-3D。
- **USD**：组合场景与 MaterialX 见 [[queries/第七批蒸馏目标]] B7-USD，不要并进本页。
- **HUD**：[[concepts/入口外壳与HUD宿主]] 的抽屉 / 浮窗挂宿主 document，不是 WebXR DOM Overlay。
- **前端取舍**：行业壳与引擎选型不当过滤器，见 [[concepts/前端架构名词与取舍]]。卡内 fail closed 仍归 [[concepts/创意工坊与安全契约]]。

本页不写「已采用 WebXR / glTF / model-viewer / A-Frame」。账本仍在 [[queries/第三批蒸馏目标]]。

## 来源与证据

- WebXR 核心与模块成熟度：Device API CR Draft 2026-06-09；AR Module CR Draft 2025-04-25；Gamepads WD 2025-07-07；Hit Test WD 2025-12-11；DOM Overlays WD 2024-09-24（页头 Unstable）。
- WebVR 已废：MDN WebVR API（从未批准成标准；继任 WebXR）。
- glTF 现行可读合同：Khronos Registry 2.0 + 2.0.1 HTML（2021-10-11）。ISO/IEC 12113:2022 付费全文不收。
- 校验：glTF Validator 对照 2.0 与扩展，本地跑、不上传。
- 三壳：model-viewer AR 示例（`webxr` / `scene-viewer` / `quick-look`）；Scene Viewer 官方 intent 页；Apple 画廊页（USDZ）。
- A-Frame 文档仍写 WebVR：1.8.0 介绍；`/docs/` 根路径本轮 500。
- Apple ARKit 编程页本轮超时：活源只到画廊，不补未读 API。
- 查询账本：[[queries/第三批蒸馏目标]] B3-XR；邻接 [[queries/第二批蒸馏目标]] B2-3D、[[queries/第四批蒸馏目标]] B4-3D、[[queries/第七批蒸馏目标]] B7-USD。
- 分路原稿仍在 [[10-收件箱/写回候选/概念-WebXR与glTF]]。

已知冲突见上节，不静默覆盖。工坊或发卡真机未核任何 XR 会话——本来就没有已落地的 `XRSession` 可验。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] 一句话定义；会话 / 资产 / 预览壳分开
- [x] 权威入口 16 条；ISO 付费、盗版、攻击已排除
- [x] Apple 文档超时与 A-Frame/WebVR 冲突未覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[queries/第四批蒸馏目标]]
- [[queries/第七批蒸馏目标]]
- [[10-收件箱/写回候选/概念-WebXR与glTF]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/媒体库路径]]
- [[concepts/媒体格式与编解码]]
- [[concepts/CSP与Trusted Types]]
- [[concepts/入口外壳与HUD宿主]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/创意工坊与安全契约]]
- [[concepts/概念分级]]
- [[comparisons/嵌入三路径对照]]
