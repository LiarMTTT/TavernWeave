---
title: 实时基建与Durable Objects
created: 2026-08-15
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
sources:
  - https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
  - https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
  - https://developers.cloudflare.com/durable-objects/best-practices/websockets/
  - https://developers.cloudflare.com/workers/runtime-apis/websockets/
  - https://docs.partykit.io/
  - https://docs.partykit.io/how-partykit-works/
  - https://docs.partykit.io/glossary/
  - https://blog.cloudflare.com/cloudflare-acquires-partykit/
  - https://github.com/cloudflare/partykit/blob/main/packages/partyserver/README.md
  - https://liveblocks.io/docs/concepts
  - https://liveblocks.io/docs/collaboration-features/multiplayer/sync-engine/liveblocks-storage
  - https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
  - https://websockets.spec.whatwg.org/
  - queries/第二批蒸馏目标.md
  - concepts/CRDT与local-first.md
knowledge_class: factual
---

# 实时基建与Durable Objects

本页不是已采用技术，也不改工坊或角色卡栈。检索时间：2026-08-15。账本见 [[queries/第二批蒸馏目标]]（B2-RT）。只收房间、连接、会话寿命的概念入口，不收报价、接入步骤、凭证或攻击。

## 一句话定义

实时基建是把多个客户端路由到**同一份房间实例**、并在连接还在时转发消息的通道层。Durable Object 是 Cloudflare 的一种有全局唯一名、单线程、计算与存储绑在一起的 Worker 实例，常被用来当这间房。它把更新送到人，**不负责**两份富文本怎么合。

## 为什么重要

「上实时」常被写成一条栈。实际至少四层：管道（WebSocket）、房间（谁跟谁在同一实例）、在场（光标、谁在线）、文档合并（CRDT）。混成一词，就会把休眠、信令、Yjs 更新和报价页当成同一份规范。[[concepts/CRDT与local-first]] 已把本页预告为通道概念页：管房间、连接、会话寿命。本仓库发卡与工坊**不因此改栈**；行业正当性仍保留。

## 权威入口

检索 2026-08-15。下列 **13** 条是入口，不是教程，也不镜像全文。不收产品报价页。账本采集目标约 12 条。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [What are Durable Objects?](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/) | B2-RT 枢纽。全局唯一名 + 附属存储；有状态 serverless |
| 2 | [Lifecycle of a Durable Object](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/) | 活跃 / 空闲 / 休眠 / 不活跃；无 shutdown hook |
| 3 | [Use WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) | 一实例可挂多客户端；标准 WS 与 Hibernation 两套 API |
| 4 | [Workers WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/) | 有 WebSocket ≠ 有全局唯一房间 |
| 5 | [What is PartyKit](https://docs.partykit.io/) | 多人实时应用的托管/运行时叙事 |
| 6 | [How PartyKit works](https://docs.partykit.io/how-partykit-works/) | 同一 `id` 进同一房间；底层是 Durable Object |
| 7 | [PartyKit Glossary](https://docs.partykit.io/glossary/) | Party / Room / Server 在他们书里几乎同义 |
| 8 | [Cloudflare acquires PartyKit](https://blog.cloudflare.com/cloudflare-acquires-partykit/) | 2024-04 收购公告；不是 API 合同 |
| 9 | [PartyServer README](https://github.com/cloudflare/partykit/blob/main/packages/partyserver/README.md) | 跑在 Durable Objects 上的库；**不是** PartyKit 托管台 |
| 10 | [Liveblocks Concepts](https://liveblocks.io/docs/concepts) | 房间 = 边缘上的有状态 WebSocket 服务器 |
| 11 | [Liveblocks Storage](https://liveblocks.io/docs/collaboration-features/multiplayer/sync-engine/liveblocks-storage) | Storage / Presence / Broadcast；合并层另走 |
| 12 | [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) | 浏览器管道 API，不管房间寻址 |
| 13 | [WHATWG WebSockets](https://websockets.spec.whatwg.org/) | Living Standard。本轮页眉 **Last Updated 15 March 2026** |

`https://liveblocks.io/docs/concepts/how-liveblocks-works` 本轮打开后与第 10 条同文（Rooms 锚点在此）。`https://liveblocks.io/docs/ready-made-features/presence` 本轮落到营销落地页，不升条。Durable Objects 总览页链了 Pricing，本页不收。

## 如何运作

### 四层先切开

| 层 | 活多久 | 本页是否负责 | 典型入口 |
|---|---|---|---|
| 实时通道 / 房间 | 连接在、实例被寻址时 | **是** | Durable Objects、PartyKit 房间、Liveblocks Room |
| 文档 CRDT | 进文件、可离线再合 | 否 | [[concepts/CRDT与local-first]] |
| 在场 | 随会话；人走即没 | 只点名，不蒸合并 | Yjs Awareness、Fluid Presence、Liveblocks Presence |
| WebRTC 信令 | 协商 offer/answer 的那段 | 否 | [[concepts/WebRTC信令边界]] |

通道把字节送到人。CRDT 决定两份更新怎么收敛。在场是短暂态。WebRTC Rec **不规定**信令协议；房间服务常被拿去当信令载体，那是应用选择，不是 Rec 的一部分。

### Durable Objects：一名字一实例

官方定义：Durable Object 是一种特殊的 Cloudflare Worker，把计算和存储绑在一起。与普通 Worker 的差别：

1. **全局唯一名**：可以从世界任何地方把请求打到**这一份**对象，用来协调多个客户端。
2. **附属持久存储**：和对象住在一起，官方称强一致且访问快；正文写容量上限 **10 GB**（检索日；脚注未核）。

另外几条官方要点：首次访问才隐式创建；空闲数秒后可休眠；内存态在休眠后重置，需要留下的必须写入附属存储；单线程、协作式多任务；命名空间对应一个实现类，官方写「对能创建多少个没有硬上限」。可选用 Actor 模型来理解：一实例收消息、在自己的单线程上下文里跑、再往外发。本页不写 stub / RPC 接入步骤。

官方也写：Durable Objects **尚未**出现在每一个 Cloudflare 数据中心；现网机房他们指向 `where.durableobjects.live`。本轮**未打开**该站。

### 生命周期与休眠

[生命周期页](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/)：只创建 stub **不会**实例化；对 stub 调用方法之后，生命周期才开始。状态包括：内存中活跃；内存中空闲但不可休眠；内存中空闲且可休眠；已休眠；不活跃（可能冷启动）。

可休眠的条件必须**同时**成立，其中包括：没有未完成的 `setTimeout` / `setInterval`；没有进行中的 `fetch()`；**没有使用 Web 标准 WebSocket API**；没有仍在处理的请求；没有活动的出站 TCP / 出站 WebSocket。满足条件后，官方写当前是空闲 **10 秒**进入休眠。不可休眠的空闲对象，官方写再过 **70–140 秒**无事件会被整份逐出，进入不活跃。

休眠时：对象离开内存；**已休眠的 WebSocket 客户端仍连在 Cloudflare 网上**；内存态丢；再有事件会重新跑 `constructor`。官方明确**不提供** shutdown hook，理由是不能保证每次关机都能跑到。关机时，官方写 WebSocket 会被断开，好让新实例尽快接管。

[Use WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) 把 API 分成两套：Hibernation（闲时对象可睡、客户端不断）与 Web 标准 WebSocket。一实例可作多客户端的协调点（聊天室、多人游戏是他们举的例子）。官方用计费时长解释为何推荐 Hibernation；**报价与计费数字本页不收**。

### PartyKit：房间是 Durable Object

[How PartyKit works](https://docs.partykit.io/how-partykit-works/)：每个 PartyKit 服务器（Party）背后是一个 Durable Object。同一 `id` 保证进同一房间（同一实例）；新 `id` 会要一个新实例。房间有状态，可以按普通 JS/TS 类持有内存。传输是标准 HTTP 与标准 WebSocket，不绑死某一家客户端 SDK。

[Glossary](https://docs.partykit.io/glossary/) 把 Party、Room、Server 都写成「一份 Durable Object」。这是 PartyKit 书的用词，不是 IETF 房间标准。

### PartyServer 不是同一份托管台

Cloudflare [收购公告](https://blog.cloudflare.com/cloudflare-acquires-partykit/)日期是 **2024-04-05**。收购后，[PartyServer README](https://github.com/cloudflare/partykit/blob/main/packages/partyserver/README.md) 自称：在 Durable Objects 上做实时应用的库，**受 PartyKit 启发**。它自己列的差别包括：URL 与服务器名解耦；不含 PartyKit 对其它服务的绑定；**没有** PartyKit 那种自动推断的 Durable Object 绑定与 migration，要在 Wrangler 配置里手写。本页不写配置步骤。

`docs.partykit.io` 本轮仍活，仍按「CLI 部署到 PartyKit runtime」叙述。它与 PartyServer、裸 Durable Objects **不是**已经并成一条「现行唯一入口」。哪一条才是 2026 年推荐部署路径：本页标**不确定**。

### Liveblocks：房间是产品原语

[Concepts](https://liveblocks.io/docs/concepts)：Liveblocks 自称实时基础设施 **加上** 无冲突同步层。房间是「边缘上的有状态 WebSocket 服务器」，通常映射到产品里的一份文档、白板、表格之类。房间里的原语包括 Presence、Broadcast、Storage、Feeds、Threads。平台叙事是用 WebSocket 做在场、连接管理、低延迟消息和房间编排。

[Storage](https://liveblocks.io/docs/collaboration-features/multiplayer/sync-engine/liveblocks-storage) 把 Storage 写成 `LiveList` / `LiveMap` / `LiveObject` 这类 **conflict-free / CRDT-like** 结构，数据按房间永久存放；Presence 用来做头像栈、光标；Broadcast 是事件，不是文档历史。服务端 `setPresence` 官方写成会过期的短暂值。**合并规则不在本页写**，见 [[concepts/CRDT与local-first]]。

Concepts 页提到项目有区域、环境、密钥等产品容器字段。本页只承认「房间是通道」，不收密钥、鉴权步骤或报价。US / EU 区域官方标了更高套餐，**不链报价页**。

### WebSocket 只是管道

[WHATWG WebSockets](https://websockets.spec.whatwg.org/) 提供浏览器里的双向通信 API，不管房间名、也不管多客户端如何汇合。[MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) 本轮标 **Baseline Widely available \***，2015-07 起跨浏览器，部分能力支持度不一。

[Workers WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/) 让普通 Worker 也能当 WebSocket 端点。这只证明「这条进程能说话」。没有全局唯一名，就不能把它自动当成「全世界进同一间房」。兼容日 ≥ `2026-04-07` 时，Workers 默认自动回 Close；≥ `2026-03-17` 时 `binaryType` 默认 `"blob"`。这是管道行为，不是房间语义。

## 必须保留的冲突

- 通道 ≠ CRDT ≠ 在场 ≠ WebRTC 信令。四层都正当，不要并成「实时 = Yjs」或「实时 = Durable Objects」。
- PartyKit 托管台、PartyServer 库、裸 Durable Objects：三套官方树都还在。收购（2024-04）**没有**让 `docs.partykit.io` 消失，也没有把 PartyServer 写成「PartyKit 的唯一继任 RFC」。
- PartyKit 词汇表把 Durable Object 写成「无限可扩展」；Cloudflare 枢纽更谨慎：创建数量无硬上限，但**不是每个数据中心都有**。两边都留。
- 使用 **Web 标准 WebSocket API** 会让 Durable Object **不能**按生命周期页进入休眠。Hibernation API 是 Cloudflare 扩展，不是 WHATWG 的一部分。
- 休眠：连接可仍在网上，对象内存态会丢。不要把「连接还在」写成「类字段还在」。
- Liveblocks 房间 ≠ Liveblocks Storage。前者是通道；后者官方自称 CRDT-like，本页不负责怎么合。
- 普通 Worker 有 WebSocket ≠ 有 Durable Object 房间。
- 「工坊 / 卡不上房间服务」不是「行业没有房间原语」。

## 例子

- 正例：聊天室或对局用同一个房间 `id` 寻址；后加入的人进**同一**实例，实例再广播。寻址是通道，消息体可以是任意字节。
- 正例：Yjs / Automerge 的 update 字节走房间的 WebSocket；合并仍在 `Y.Doc` / Automerge 文档里，见 [[concepts/CRDT与local-first]]。
- 正例：光标、头像栈走 Presence / Awareness；人断线即没，不写进文档历史。
- 正例：WebRTC 的 SDP / ICE 候选用房间当信令载体。载体是应用合同，不是 WebRTC Rec，见 [[concepts/WebRTC信令边界]]。
- 反例：把两份富文本的合并写进房间对象，或把 Durable Objects 枢纽当成 CRDT 规范。
- 反例：把 SharedWorker 当成「多用户房间」。它是同源多浏览上下文，见 [[concepts/SharedWorker与Web Locks]]。
- 反例：把本机 Cache / IndexedDB 配额当成房间会话寿命，见 [[concepts/PWA与存储配额]]。
- 反例：收报价页、写 wrangler / 密钥 / 鉴权步骤，或把 PartyKit 示例主机名当成本仓库接入教程。

## 边界与易混概念

- 不包括：报价、凭证、攻击或绕过、具体接入步骤、某家 pub/sub 的报价对照。
- 实时通道 ≠ CRDT。通道可送任意字节；收敛合同在文档层。
- 在场 ≠ 文档。一份随会话死，一份进文件。
- WebSocket ≠ 房间。管道没有「同一 `id` 进同一实例」的保证。
- Durable Object ≠ 浏览器标准。它是 Cloudflare 运行时原语。
- PartyKit ≠ PartyServer。一个是他们文档里的托管/runtime 叙事，一个是 DO 上的库。
- Liveblocks ≠ Durable Objects。Liveblocks 是托管产品，自述房间跑在边缘 WebSocket 上；底层是否等于用户自己的 DO 类，官方概念页**没有**写成「你在写 Durable Object」，本页不臆测。
- WebRTC 信令 ≠ 房间产品。Rec 把信令信道标为未规定手段。
- 同源多标签的 SharedWorker / Web Locks ≠ 跨用户房间。
- 卡 iframe 不是多人房间宿主；本页不自动落到卡内。

## 映射到本仓库

当前发卡是单会话、单模型写手：世界书教格式，bundle 打补丁，Zod 拦结构。没有「多玩家各持连接、进同一房间广播」的合同。独立工坊站已用同步 REST + 静态目录；[[comparisons/工坊架构该上与不该上]] 写明目录更新稀，WebSocket / SSE 推目录没有主路径收益。[[concepts/前端架构名词与取舍]] 的实时表把 WebSocket 留给协作编辑、对战、在场；那是行业表，不是「工坊必须上房间」。

本页只钉入口与冲突，不是采用通知。以后若做「多人同时改同一份卡源」，那是新产品面，再单独立项。

## 来源与证据

- Durable Object 定义与双特性：枢纽页「globally-unique name」「durable storage」；有状态 serverless。
- 生命周期与无 hook：lifecycle 页状态表、休眠条件、10 秒 / 70–140 秒、shutdown 节「hooks are not provided」。
- WebSocket 与休眠：Use WebSockets「thousands of clients per instance」；休眠时客户端仍连、内存重置。
- PartyKit 一 id 一房间：How PartyKit works；词汇表 Party = Durable Object。
- 收购与分叉：Cloudflare 博客 2024-04-05；PartyServer README「Inspired by PartyKit」及自列差别。
- Liveblocks 房间与原语：Concepts「stateful WebSocket server on the edge」；Storage 自称 CRDT-like，Presence 为短暂指示。
- 管道：WHATWG Living Standard（2026-03-15）；MDN Baseline Widely available *。
- 账本：[[queries/第二批蒸馏目标]] B2-RT。预告关系：[[concepts/CRDT与local-first]]。

已知冲突见上节，不静默覆盖。PartyKit 托管台是否仍为推荐部署路径、`where.durableobjects.live` 现网覆盖、10 GB 脚注：本轮未核，标未知。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[concepts/CRDT与local-first]]
- [[concepts/WebRTC信令边界]]
- [[concepts/SharedWorker与Web Locks]]
- [[concepts/PWA与存储配额]]
- [[concepts/前端架构名词与取舍]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[queries/第二批蒸馏目标]]
