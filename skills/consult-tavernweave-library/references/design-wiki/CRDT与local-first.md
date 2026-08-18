---
title: CRDT与local-first
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
sources:
  - https://docs.yjs.dev/
  - https://docs.yjs.dev/getting-started/adding-awareness
  - https://github.com/yjs/y-protocols
  - https://automerge.org/docs/hello/
  - https://automerge.org/blog/rich-text/
  - https://automerge.org/docs/reference/documents/rich-text/
  - https://automerge.org/docs/reference/under-the-hood/merge-rules/
  - https://loro.dev/docs
  - https://www.inkandswitch.com/peritext/
  - https://www.inkandswitch.com/essay/local-first/
  - https://arxiv.org/abs/2409.14252
  - https://fluidframework.com/docs/build/presence
  - https://www.inkandswitch.com/upwelling/
  - https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
knowledge_class: factual
---

# CRDT与local-first

本页不是已采用技术，也不改工坊或角色卡栈。

## 一句话定义

CRDT 是一份可以在多台设备上独立改、事后交换更新就能收敛到同一结果的数据结构；local-first 是把本机副本当主本、云只当副本的软件取向。二者常一起出现，但不是同一层：一个管合并，一个管所有权。

## 为什么重要

云应用把服务器当真相，离线或分叉就变成「没发生」。local-first 反过来：本机先写，网络好了再同步。CRDT 让这份同步不必找中心裁判，也不必像 Git 那样让人手工解富文本冲突。行业用它做协作编辑、离线多端、分支后合并。本仓库的角色卡变量和独立工坊站**现在都不因此改栈**；行业正当性仍保留，见文末映射。

## 如何运作

CRDT 的合同是：各副本可并行更新；只要最终见到同一组更新，状态相同，与到达顺序无关。Yjs、Automerge、Loro 都把内部模型暴露成可并发改的共享类型（Map / Array / Text 等），再把增量编码成字节交给**任意**通道。文档层不假定 WebSocket、WebRTC 或邮件附件；通道怎么接，不在本页写。

先分三层，避免把房间服务和光标写进同一份文件：

| 层 | 活多久 | 典型入口 | 不负责 |
|---|---|---|---|
| 文档 CRDT | 进文件、可离线、可分支后再合 | Yjs / Automerge / Loro | 谁在线、光标、房间寻址 |
| 在场 | 随会话；人走即没 | Yjs Awareness、Fluid Presence | 正文历史、撤销栈 |
| 实时通道 | 连接在才有 | [[concepts/实时基建与Durable Objects]] | 两份富文本如何合并 |

三库分工（B2-CRDT 枢纽仍是 [Yjs 文档](https://docs.yjs.dev/)）：

| 库 | 官方怎么说 | 本页用法 |
|---|---|---|
| Yjs | 高性能共享类型；文档自称 WIP，README 仍是更好的源；网络无关 | B2 枢纽。不升其它库替代它 |
| Automerge | 本机可离线改，上线再同步；像 Git 但能自动合复杂结构 | local-first 主叙事。富文本另见 Peritext 并入 |
| Loro | 用 CRDT 解并行编辑；状态可按 JSON 建模；自称含 Event Graph Walker | 第三入口。官方「何时不用」：要强一致、大数据/媒体流、或包体敏感（WASM 约 970KB gzip）时另选 |

[Peritext](https://www.inkandswitch.com/peritext/)（B3-LF 枢纽）是富文本 CRDT：行内加粗、颜色、链接、评论按「跨两个字符的区间」合并，而不是把 HTML 树当真相。2022 文说原型挂在简化版 Automerge 上、希望回并。后来 [Automerge 2.2](https://automerge.org/blog/rich-text/) 落地富文本（span + block marker），[合并规则](https://automerge.org/docs/reference/under-the-hood/merge-rules/) 的 marks 一节回指 Peritext。**并入不等于改枢纽**：B2-CRDT 仍指向 Yjs 文档，不把 Automerge 升成替代入口。

[Eg-walker](https://arxiv.org/abs/2409.14252)（EuroSys 2025，Gentle / Kleppmann）是文本协作算法：稳态只持有纯文本；合并时临时建 CRDT，合完即丢，不落盘、不上网。权威在 arXiv；Ink & Switch **无专文**。Loro 对照表自称实现了 Event Graph Walker，发明实现是 Diamond-types。这是实现声明，不是 I&S 论文。

在场（光标、选区、谁在线）是**短暂态**，不入文档 CRDT。Yjs 明文：Awareness 不进 `Y.Doc`，离线即删；[y-protocols](https://github.com/yjs/y-protocols) 用独立 state-based CRDT，约 30 秒无刷新则本地摘掉。Fluid [Presence](https://fluidframework.com/docs/build/presence)（B3-Pres 枢纽，2.42.0 起 beta）：会话里每人一份别人只读的 `Latest` / `LatestMap`；人走光，会话数据消失。它不是 Fluid DDS，也不保证文档那种最终一致（官方写明走 signal，重连期可能丢）。通知是事件，不留会话状态。

[local-first 七理想](https://www.inkandswitch.com/essay/local-first/)（Kleppmann 等，Onward! 2019）把「云是主本」翻过来：

1. 本机先响应，不必等跨洋往返才出字。
2. 同一份工作能在手机 / 平板 / 电脑之间走，不被锁在一台机器。
3. 网络可选：飞机、隧道、关蜂窝也能写，稍后同步。
4. 多人可同时改，不必排队传文件。
5. 软件和数据要活得过某家云服务停机。
6. 默认少把全文交给别人的计算机。
7. 最终所有权在用户：能备份、能导出、能删。

CRDT 主要托住第 3、4 条，不是七条的全部。没有 CRDT 也可以做本机文件；有 CRDT 也可以仍把服务器当主本。Upwelling 用 Automerge 做「实时 + 草稿分支」的写作原型，用来缓解「鱼缸效应」（别人盯着你打字）。[概念文](https://www.inkandswitch.com/upwelling/)可引，[源码仓](https://github.com/inkandswitch/upwelling-code) **无 SPDX / 无 LICENSE**（#279 仍开），不可当可再分发实现。

实时基建见 [[concepts/实时基建与Durable Objects]]（B2-RT 枢纽：[Durable Objects 概念](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/)）：管房间、连接、会话寿命。它把更新送到人，不负责「两份富文本怎么合」。通道实现细节排除；本页不写接入步骤。

OT 与 CRDT 只点一句：OT（如 Google Docs 所用 Jupiter）假定一条由中心服务管理的线性时间线；CRDT 不需要这条中心线，任意两版本最终见到同一组更新即可收敛。完整对照是第四批候选，本页不展开。

## 权威入口

检索 2026-08-14。下列 14 条是入口，不是教程，也不镜像全文。

1. [Yjs 文档](https://docs.yjs.dev/) — B2-CRDT 枢纽；共享类型与网络无关。
2. [Yjs Awareness](https://docs.yjs.dev/getting-started/adding-awareness) — 在场不进文档。
3. [y-protocols](https://github.com/yjs/y-protocols) — Sync / Awareness 编码合同。
4. [Automerge Hello](https://automerge.org/docs/hello/) — 本机主本、自动合并、网络无关。
5. [Automerge 2.2 富文本](https://automerge.org/blog/rich-text/) — Peritext 后并入的产品说明。
6. [Automerge Rich Text](https://automerge.org/docs/reference/documents/rich-text/) — marks / blocks API。
7. [Automerge 合并规则](https://automerge.org/docs/reference/under-the-hood/merge-rules/) — 文本 marks 回指 Peritext。
8. [Loro 文档](https://loro.dev/docs) — 第三库入口与「何时不用」。
9. [Peritext](https://www.inkandswitch.com/peritext/) — B3-LF 枢纽；富文本意图模型。
10. [local-first 长文](https://www.inkandswitch.com/essay/local-first/) — 七理想；活入口见冲突。
11. [Eg-walker arXiv:2409.14252](https://arxiv.org/abs/2409.14252) — 算法权威；I&S 无专文。
12. [Fluid Presence](https://fluidframework.com/docs/build/presence) — B3-Pres 枢纽；短暂态。
13. [Upwelling 概念](https://www.inkandswitch.com/upwelling/) — 实时与草稿分支；代码无 SPDX。
14. [Durable Objects 概念](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/) — B2-RT 枢纽；只当通道概念。

## 例子

- 正例：两台设备离线改同一 `Y.Map` / Automerge 文档 / `LoroDoc`，事后交换 update 字节，键值都在，顺序无关。
- 正例：Alice 给整句加粗、Bob 在句中插入词；Peritext / Automerge 富文本让新词落在加粗区间内，而不是「树节点二选一丢一半」。
- 正例：光标和「谁在打字」走 Awareness 或 Presence；关页即消失，下次打开文档里没有这些点。
- 反例：把角色卡 `stat_data` 当成要 Y.Map 同步的共享文档。卡变量是模型吐补丁、bundle 应用、Zod 拦结构，见 [[concepts/MVU变量闭环]]。
- 反例：独立工坊目录为「看起来像协作」上 Yjs。目录是缓存静态读，更新稀，见 [[comparisons/工坊架构该上与不该上]]。
- 反例：把在场写进文档 CRDT，当永久历史；或把 WebSocket 接入步骤当成本页教程。

## 边界与易混概念

- 不包括：实时通道接入、房间服务搭建、OT 专页、把某库写成「本仓库已采用」。
- CRDT ≠ local-first。可以在中心服务器上只用 Automerge 做并发合并；也可以 local-first 却用别的同步。
- 文档 CRDT ≠ 在场。一份进文件、一份随会话死。
- Peritext ≠ 新的 B2 枢纽。它解释富文本意图，实现已进 Automerge，入口表不改枢纽。
- Eg-walker ≠ 「又一个 Yjs」。它多数时间不当作常驻 CRDT 元数据来持有。
- Upwelling 概念可引，源码不可当已许可组件。
- 乐观 UI 的单步回滚（[[concepts/前端架构名词与取舍]]）不是多副本 CRDT，也不是撤销栈。

## 映射到本仓库

角色卡变量以 **MVU** 为心智，不是 CRDT。稳定卡是单会话、单模型写手：世界书教格式，bundle 打 JSON Patch，Zod 拦非法结构，`stat_data` 给下一轮和 HUD。没有「多玩家各持一份角色卡状态、离线一周再交换 update」的合同。把 MVU 换成 Yjs 不会让模型更听话，只会把补丁协议和 Zod 门拆掉。

独立工坊站也不因此要上 Yjs。已用模块化单体 + 同步 REST + SSG/ISR + islands；目录不是共享编辑器。发布 / 审核要同步可见结果，不靠无中心合并。以后若做「多人同时改同一份卡源」，那是新产品面，再单独立项，不从本页自动推出。

两边都留行业正当性。协作编辑器、离线多端文档、在场光标，行业该看上表入口。本页不按「卡用不上」删 Yjs / Automerge / Loro / Presence。卡与工坊的「现不上」是产品映射，见 [[comparisons/行业架构方案何时用]]、[[comparisons/工坊架构该上与不该上]]。

## 来源与证据

- 三库与网络无关：Yjs 引言、Automerge Hello、Loro 用任意方法送 bytes。
- 在场不入文档：Yjs Awareness 文；Fluid Presence Overview（会话结束即消失；与 DDS 不同）。
- Peritext → Automerge：2022 文「希望回并」；2.2 博客与 merge-rules 已回指。
- Eg-walker：arXiv:2409.14252 / doi:10.1145/3689031.3696076。I&S 站点无同名专文。
- Upwelling：概念文可抓；`upwelling-code` 无 LICENSE，issue #279（2023-08-14）仍问许可。
- 账本：[[queries/第二批蒸馏目标]] B2-CRDT / B2-RT；[[queries/第三批蒸馏目标]] B3-LF / B3-Pres。

### 已知冲突或版本差异

- B2-CRDT 枢纽是 `docs.yjs.dev`。Peritext 并入 Automerge **不**把枢纽改成 Automerge。
- `https://www.inkandswitch.com/local-first.html`（Yjs 文档仍链此）2026-08-14 抓取 500；活入口是 `/essay/local-first/`。
- Automerge 2.2 博客用 yjs-prosemirror 结构冲突丢列表项当反例。这是 Automerge 方主张，本页不裁定「Yjs 不能做富文本」。
- Loro 自称有 Eg-walker；权威论文在 arXiv，I&S 无专文。两句都留。
- Fluid Presence 官方：走 signal，不保证所有客户端最终一致；Notifications 仍 alpha，`unicast` 实际仍广播。
- Upwelling 代码无 SPDX，不能写成 MIT/Apache。
- Yjs 文档站自称 WIP；冲突时以 README / y-protocols 为准。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[concepts/MVU变量闭环]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/后端架构名词与工坊对照]]
- [[concepts/实时基建与Durable Objects]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
