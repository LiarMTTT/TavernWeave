---
title: SharedWorker与Web Locks
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
  - sillytavern
sources:
  - https://html.spec.whatwg.org/multipage/workers.html
  - https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
  - https://developer.mozilla.org/en-US/docs/Web/API/Worker
  - https://www.w3.org/TR/web-locks/
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
  - https://html.spec.whatwg.org/multipage/web-messaging.html#broadcastchannel
  - https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
  - https://wicg.github.io/storage-buckets/
  - https://wicg.github.io/storage-buckets/explainer.html
  - https://developer.chrome.com/docs/web-platform/storage-buckets
  - https://storage.spec.whatwg.org/
  - 10-收件箱/写回候选/第五批-B5-Worker.md
  - queries/第五批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/酒馆宿主与iframe分层.md
knowledge_class: factual
---

# SharedWorker与Web Locks

本页不是已采用技术，也不改工坊或角色卡栈。检索时间：2026-08-14。账本是 `10-收件箱/写回候选/第五批-B5-Worker.md`（B5-Worker，12 条），枢纽见 [[queries/第五批蒸馏目标]]。不重抄 [[queries/第二批蒸馏目标]] **B2-Wasm** / **B2-PWA**，也不重抄 [[queries/第三批蒸馏目标]] **B3-FS**。Service Worker 只当 HTML 点名的第三种 worker。

## 一句话定义

同源多浏览上下文要协作时，现行入口不是「一个 Worker API」：Dedicated Worker 绑创建者；SharedWorker 按 origin（另加脚本 URL / 可选名字）被多个上下文共用；BroadcastChannel 是同存储键上的命名广播；Web Locks 是同存储桶里的协作锁；Storage Buckets 想把「一个源一个默认桶」拆成可独立驱逐的命名桶——后一件不是 Rec。

## 为什么重要

多标签、多 iframe 看起来像「各过各的」，平台却按 origin / 存储键 / 存储桶把它们穿在一起。把 SharedWorker 当成「这个 iframe 文档自己的后台线程」，或把 Locks / BroadcastChannel 写成「只要同 origin 就通」，都会在第三方分区上静默切开。卡 iframe 是独立浏览上下文，但共享原语不按文档实例切。本仓库角色卡与工坊**不因此改栈**；行业正当性仍保留。

## 权威入口

检索 2026-08-14。12 条，不是教程。MDN `Storage_Buckets_API`、`StorageBucket`、`/TR/storage-buckets/` 检索日 404，不升条。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [HTML Workers](https://html.spec.whatwg.org/multipage/workers.html) | Dedicated 绑创建者；Shared 按 origin 命名；构造比 storage key + URL + 名字 |
| 2 | [MDN SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) | Baseline Newly 2026-05；多窗口 / iframe 共用；须同 origin；走 `port` |
| 3 | [MDN Using web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) | 寿命、`extendedLifetime`；Firefox 隐私窗不共享 |
| 4 | [MDN Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) | Dedicated 对照；Baseline Widely 2015-07 |
| 5 | [Web Locks](https://www.w3.org/TR/web-locks/) | WD 2025-09-24；锁管理器挂存储桶；不是 Rec |
| 6 | [MDN Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) | Baseline Widely 2022-03；`ifAvailable` / `steal` / `signal` / `query()` |
| 7 | [HTML BroadcastChannel](https://html.spec.whatwg.org/multipage/web-messaging.html#broadcastchannel) | 目的地按 storage key + 频道名 |
| 8 | [MDN Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) | 先写同 origin，再写顶层站点分区 |
| 9 | [Storage Buckets 规范](https://wicg.github.io/storage-buckets/) | 非 Rec；`persisted` / `quota` / `expires` |
| 10 | [Storage Buckets 解释稿](https://wicg.github.io/storage-buckets/explainer.html) | 提议改 Storage Standard；另写 `durability` |
| 11 | [Chrome Storage Buckets](https://developer.chrome.com/docs/web-platform/storage-buckets) | Chromium 122；`durability` 为提示 |
| 12 | [Storage Standard](https://storage.spec.whatwg.org/) | shelf / default 桶；`persist()` 只改 default |

上表 **12** 条。B5-Worker 的采集行不在本页镜像。B2-PWA / B2-Wasm / B3-FS 不重抄。

## 如何运作

五面不要并成一层：

1. **Dedicated Worker（对照）**：一个创建者、一条隐式消息口、无 DOM。不是多标签协调原语。MDN Worker 是 Baseline Widely（2015-07）。
2. **SharedWorker**：同 origin、同脚本 URL（可选名字）共用一个 `SharedWorkerGlobalScope`。新客户端走 `connect` + `MessagePort`。HTML 引言：不同站点同名不撞；同站不同脚本 URL 会失败。构造算法另比 constructor storage key。MDN 标 Baseline Newly（2026-05）。构造器不在 `DedicatedWorkerGlobalScope`。
3. **BroadcastChannel**：轻量广播。HTML 用 storage key 选目的地；MDN 用顶层站点分区解释同一事实。发送者自己不收。无协商、无语义。
4. **Web Locks**：`navigator.locks.request()`；默认 exclusive，可 shared。异步获锁、回调结束即放。锁名无平台语义。规范：每个存储桶一个 lock manager；分区存储的 UA 必须同样分区锁。规范是 WD（2025-09-24）；MDN 标 Baseline Widely（2022-03）。
5. **Storage Buckets**：`navigator.storageBuckets.open/keys/delete`。给站点显式命名桶，UA 可按桶驱逐。WICG CG Report（2023-12-19），文首写明不是 W3C Standard、不在 Standards Track。Chrome 122 起已装。WHATWG Storage 检索日仍只保证 default 桶；`persist()` 只改 default 桶，全有全无。

寿命（MDN Using）：无引用即停；同 origin 导航可短暂保活；`extendedLifetime` 可在引用清空后再活一小段。Firefox 隐私窗与普通窗不共享。

## 必须保留的冲突

- **SharedWorker：引言 origin vs 构造 storage key。** 01 引言与 02 写同 origin；构造步骤匹配 constructor storage key + URL + 名字（`data:` 用创建环境的 key）。与 07 同一套 key，第三方分区会切开。不要并成「只要同 origin 就共用」。
- **Web Locks：WD ≠ Baseline Widely。** 05 是 2025-09-24 WD，文首禁止当已定稿引用。06 标 2022-03 起 Baseline Widely。成熟度两套尺子。
- **Locks 范围：origin 口吻 vs 存储桶条文。** 05 摘要写「同 origin」；正文与隐私节写锁管理器按存储桶。06 文首跟摘要口吻。
- **BroadcastChannel：同 origin ≠ 同存储分区。** 08 先写同 origin，再写顶层站点分区。07 匹配的是 storage key。
- **Storage Buckets 不是 Rec，但 Chrome 已装。** 09 是 CG Report 2023-12-19。11 写 Chromium 122 起可用。MDN 专页与 `/TR/storage-buckets/` 404。不能写成 Recommendation，也不能写成「平台已齐」。
- **Chrome `durability` ≠ 09 的选项表。** 11 / 10 有 `'strict'` / `'relaxed'` 提示；09 只有 `persisted` / `quota` / `expires`。
- **SharedWorker 成熟度。** 02 是 Baseline Newly（2026-05）；04 Dedicated 是 2015-07 Widely。HTML 章头「现行引擎都有」不能抹掉 Shared 晚齐。
- **映射 ≠ 采用。** 卡 iframe 共享按 origin，不等于卡必须上 SharedWorker。

## 例子

- 正例：同 origin 的两个窗口（或两个 iframe）`new SharedWorker(同一脚本 URL, 同一名字)`，共用一个 `SharedWorkerGlobalScope`，新客户端走 `connect`。
- 正例：多标签抢同一资源时用 `navigator.locks.request('name', …)`；回调结束即放，不自造「锁文件」。
- 正例：同存储键上的 `BroadcastChannel('x')` 做轻量广播；发送者自己不收。
- 反例：以为每个卡 iframe 文档各有一份 SharedWorker，互不相见。
- 反例：从 Dedicated Worker 里再 `new SharedWorker()`。
- 反例：把 Storage Buckets 写成 Recommendation，或把 Chrome `durability` 写进 09 的选项表。
- 反例：因本页出现这些 API 就写进 recipe / 发卡依赖。

## 边界与易混概念

- 不包括：SW 专论、Wasm 进 Worker、OPFS、跨源 `postMessage` 教程、攻击/绕过、凭证、成品、工坊或卡已采用声明。
- SharedWorker ≠ Dedicated Worker。后者绑创建者；前者按 origin + URL + 名字共用。
- SharedWorker ≠ Service Worker。SW 回 B2-PWA。
- 同 origin ≠ 同存储分区。BroadcastChannel 跟存储键走；第三方 iframe 可被切开。
- Locks 摘要「同 origin」≠ 规范正文「按存储桶」。分区存储的 UA 必须同样分区锁。
- `persist()`（default 桶整包）≠ 按桶 `persisted`。前者 B2-PWA 已收。
- Storage Buckets ≠ 已进 WHATWG Storage 的多桶 API。12 检索日仍写「likely in the future」。

## 映射到本仓库

卡 iframe 是独立浏览上下文；SharedWorker 按 origin 共享，不按 iframe 文档实例。

行业句对独立站仍成立。本页不写「已采用 SharedWorker / Locks / BroadcastChannel / 多桶」。blob 真身再隔一层，桶跟 `blob:` / 该框 origin 有关，见 [[concepts/git挂载与远程真身]]。分层见 [[concepts/酒馆宿主与iframe分层]]。配额与 SW 见 [[concepts/PWA与存储配额]]。

## 来源与证据

- Shared 作用域：HTML Workers 引言与构造步骤；MDN SharedWorker。
- Locks：W3C WD 正文（锁管理器按桶）与 MDN 实现面。
- Broadcast：HTML storage key；MDN 顶层站点分区例句（`a.com` 里的 `b.com` iframe 不能跟顶层 `b.com` 通话）。
- 多桶：09 文首非 Standard；11 Chromium 122；12 仍只保证 default 桶。
- 账本：`10-收件箱/写回候选/第五批-B5-Worker.md`；枢纽 [[queries/第五批蒸馏目标]]；重叠 [[queries/第二批蒸馏目标]] B2-PWA / B2-Wasm、[[queries/第三批蒸馏目标]] B3-FS。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（`index.md` / `log.md` 本波不改）

## 相关内容

- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/git挂载与远程真身]]
- [[concepts/控制中心与状态栏]]
- [[concepts/PWA与存储配额]]
- [[queries/第五批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
