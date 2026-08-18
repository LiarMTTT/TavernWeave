---
title: PWA与存储配额
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
  - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
  - https://developer.mozilla.org/en-US/docs/Web/API/Cache
  - https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
  - https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
  - https://web.dev/articles/storage-for-the-web
  - https://web.dev/articles/persistent-storage
  - https://web.dev/learn/pwa/caching
  - https://storage.spec.whatwg.org/
  - https://www.w3.org/TR/service-workers/
  - https://www.w3.org/TR/IndexedDB/
  - https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
  - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/酒馆宿主与iframe分层.md
knowledge_class: factual
---

# PWA与存储配额

本页不是已采用技术，也不改工坊或角色卡栈。检索时间：2026-08-14。账本枢纽是 [[queries/第二批蒸馏目标]] **B2-PWA**（16 条采集，本页收 13 条入口）。清单字段见 [[queries/第三批蒸馏目标]] B3-Mani；OPFS / 本机选取见 B3-FS 与 [[concepts/酒馆宿主与iframe分层]]。

## 一句话定义

PWA 是可安装的顶层 Web 应用：用清单向操作系统登记，用 Service Worker 拦截请求、用 Cache / IndexedDB / OPFS 做离线桶。存储配额是浏览器按**源**给这些桶的上限与驱逐规则。卡 iframe 不是 PWA。

## 为什么重要

离线、安装、角标都挂在「已安装的顶层应用」上。配额和驱逐决定这份离线数据能活多久。两件行业事实常被误套到嵌入框：Safari 连续七日无交互可清脚本可写存储；缓存里的 opaque 跨源响应用于配额时会被垫高。两者都是顶层 / 已安装站点的合同，不是状态栏 iframe 的存储合同。

## 权威入口

检索 2026-08-14。13 条，不是教程，也不镜像全文。B2 采集 16 条里的离线菜谱 / SW 周期课未升格进本表。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) | B2-PWA 枢纽；注册、等待激活、`fetch` / `waitUntil` |
| 2 | [MDN PWA 总览](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) | 安装、离线、SW、Cache、IndexedDB 分指南 |
| 3 | [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) | 请求/响应桶；不跟 HTTP 缓存头；条目须自删 |
| 4 | [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | 结构化数据 / Blob；SW 里存业务数据 |
| 5 | [配额与驱逐](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | best-effort vs persistent；LRU；Safari 主动清 |
| 6 | [web.dev 网页存储](https://web.dev/articles/storage-for-the-web) | Cache / IDB / OPFS 怎么选；七日句；数字会过时 |
| 7 | [web.dev 持久存储](https://web.dev/articles/persistent-storage) | `persist()` / `persisted()`；勿在 onload 求 |
| 8 | [web.dev PWA 缓存](https://web.dev/learn/pwa/caching) | opaque 常按约 7 MB 计配额 |
| 9 | [WHATWG Storage](https://storage.spec.whatwg.org/) | 桶、`persist()`、`estimate()` 平台模型 |
| 10 | [W3C Service Workers](https://www.w3.org/TR/service-workers/) | 2026-08-12 Nightly CRD；含 Cache / CacheStorage |
| 11 | [IndexedDB 3.0](https://www.w3.org/TR/IndexedDB/) | 事务、对象仓库；拟取代 2.0 |
| 12 | [WebKit 七日与 ITP](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) | 脚本可写存储七日帽；主屏应用另计 |
| 13 | [MDN Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest) | 安装元数据。规范字段详页在 B3-Mani，本条只证「有安装面」 |

刻意未收：Workbox（库，不是平台 API）、AppCache / WebSQL、Edge 教程、2019 Service Workers 1 旧 CR。

## 如何运作

PWA 不是单一 API。安装面是 Web App Manifest（`name` / `icons` / `start_url` / `display` / 作用域）；运行面是 [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)（安全上下文、无 DOM、无 Web Storage）；数据面是 Cache（URL→Response）、IndexedDB（结构化 / Blob）、OPFS（源私有文件）。[Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) 不跟 HTTP 缓存头走，条目不过期除非自删。

默认是 **best-effort**：压力下按 LRU 整源删除，不先问用户。[WHATWG Storage](https://storage.spec.whatwg.org/)（2026-03-15 活标准）把桶、`persist()`、`estimate()` 收成平台模型。`navigator.storage.persist()` 只挡**存储压力驱逐**。Chrome 按参与度 / 已安装 / 通知权限静默批或拒；Firefox 弹窗。用户仍可手清。不要在 `onload` 求。`persist()` **不是** Safari 七日清除的豁免。

配额按源，不按路径。`estimate()` 是估值，防指纹；跨源资源体积会被垫。写满抛 `QuotaExceededError`，须 `try/catch`。Web Storage（`localStorage` / `sessionStorage`）各约 5 MiB、同步、SW 不可用，不当离线主桶。

### Safari 七日清除

[WebKit 2020-03-24](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)：自 iOS / iPadOS 13.4、Safari 13.1 起，该站在「Safari 使用日」里连续七日无点击 / 轻触，脚本可写存储会被删。受影响（排除部分遗留类型）：IndexedDB、LocalStorage、Media keys、SessionStorage、Service Worker 注册与 Cache。服务器 Set-Cookie 豁免。计数的是 Safari 使用日，不是墙上七日。

加到主屏、以 standalone / fullscreen 跑的 Web 应用**不是 Safari 的一部分**，有自己的使用日计数；按预期使用就会重置，不应被这条清掉。WebKit 写：若已安装 Web 应用仍被清，视为严重 bug。酒馆卡 iframe 没有这层主屏计数。

### opaque 虚报配额

`no-cors` 跨源响应进 Cache 后是 opaque：脚本读不到体和头。[web.dev 缓存课](https://web.dev/learn/pwa/caching) 写：部分浏览器上报很大的体积，例如 **7 MB**，即使文件只有 1 KB。MDN 配额页写：`estimate()` 会故意垫高跨源用量。这是防泄露跨源真实体积，不是「这个文件真占 7 MB」。CDN 字体 / 图若按 opaque 进 Cache，会提前撞配额。同源或 CORS 可读响应才按近真实体积计。

## 必须保留的冲突

- **Safari 配额数字分叉。** MDN：macOS 14 / iOS 17 起，WebKit 浏览器应用每源约磁盘 60%，嵌入 WKWebView 约 15%，主屏 Web 应用按浏览器档；旧版先给 1 GiB 再问。web.dev 存储文仍写 Safari「大约 1 GB，满了再问、每次 +200 MB」，并自称未找到官方文档。两边都留；写现行 WebKit 用 MDN + WebKit 博客，web.dev 数字标会过时。
- **Firefox 配额数字分叉。** MDN：best-effort 取磁盘 10% 与 10 GiB 站点组上限的较小者；persistent 可达磁盘 50%、封顶 8 TiB。web.dev：浏览器最多用剩余磁盘 50%，eTLD+1 组 2 GB。两边都留，不以一篇覆盖另一篇。
- **`persist()` 挡不住七日。** 压力 LRU 跳过 persistent 源；Safari 主动清是另一条，豁免靠主屏应用计数，不是 `persist()`。
- **`estimate()` 虚报是合同。** 跨源 / opaque 被垫；不能用返回值当真实字节或指纹。
- **SW 规范双轨。** `/TR/service-workers/` 是 Nightly CRD；Service Workers 1 另向 Rec。实现常落后条文。
- **IndexedDB 3.0 拟取代 2.0**，部分能力未齐；窗口里的原生 API 仍偏事件，不是全 Promise。
- **B3-Mani / B3-FS 重叠。** 清单 WD、Share Target 无 TR 且仓已归档、OPFS vs 本机选取，详页不在本文件。本页只证安装面与存储桶分层。
- **映射 ≠ 采用。** 卡 iframe 不是 PWA，不等于行业不再谈 PWA。

## 例子

- 正例：独立工坊站若要离线目录，用 SW + Cache 存壳资源，用 IndexedDB 存结构化草稿，写前看 `estimate()`，写时接 `QuotaExceededError`。
- 正例：已加到主屏的顶层 PWA 用自己的使用日计数，不跟 Safari 标签页共用七日帽。
- 正例：跨源 CDN 资源要进 Cache，先走 CORS，避免一条 1 KB 图按 7 MB 计。
- 反例：把七日清除或 opaque 虚报写成「状态栏 iframe / blob 真身的存储合同」。
- 反例：在卡 iframe 里注册 SW、写 `localStorage`，当成角色进度真源。
- 反例：以为 `persist()` 能挡住 Safari 七日，或挡住用户手清。
- 反例：因本页出现 PWA 就写进 recipe / 发卡依赖。

## 边界与易混概念

- 不包括：Workbox 接入、离线菜谱逐步实现、把卡做成可安装应用、攻击或绕过存储隔离。
- PWA ≠ 「网页能缓存」。没有 OS 安装面就没有独立于 Safari 的主屏计数，也没有徽章 / Share Target / 文件处理。
- `persist()` ≠ 七日豁免。前者挡压力 LRU；后者是 Safari ITP 主动清，豁免靠已安装 Web 应用的独立计数。
- `estimate()` ≠ 真实占用。opaque 垫高是特性，不是 bug。
- Cache ≠ HTTP 缓存。Cache API 不认 `Cache-Control`。
- OPFS ≠ 本机选取。前者 `getDirectory()`，后者 `showOpenFilePicker` 等，见宿主页。
- Web Storage ≠ Storage Manager。`localStorage` 同步且 SW 不可见。
- 清单字段、Share Target 归档、徽章：B3-Mani / 宿主页，本页不重蒸。

## 映射到本仓库

映射放最后，不当过滤器。行业句对独立站仍成立。

[[concepts/酒馆宿主与iframe分层]] 已写：ST 框架不给角色卡开 iframe；楼里能跑 JS 的框是酒馆助手或卡自己塞的。Web App Manifest / 徽章 / Share Target / 文件处理挂在已安装顶层应用，**不自动落到卡**。卡 iframe 没有 OS 安装面，也没有独立于 Safari 的主屏使用日。

因此：

1. **卡 iframe 不是 PWA。** 不要把七日清除或 opaque 虚报配额当成状态栏、控制中心或 blob 真身的存储合同。
2. 卡侧持久状态仍走 chat 变量、`eventOn` / `eventEmit` 和宿主桥，见宿主页与 [[concepts/MVU变量闭环]]。
3. blob 真身再隔一层，默认无 TH 全局，桶跟 `blob:` / 该框 origin 有关，见 [[concepts/git挂载与远程真身]]。
4. 独立工坊站**可以**谈 PWA / 配额；那是顶层站点合同，不是「本仓已上 PWA」。
5. 宿主 ST 若跑在本机或非 Safari，七日句对它也不自动成立。不要从卡框反推宿主存储政策。

本页不写「已采用 Service Worker / Workbox / persist()」。

## 来源与证据

- 七日：WebKit 2020-03-24 原文；MDN 配额页「Proactive eviction」；web.dev 存储文写 iOS 13.4 / Safari 13.1，已安装 PWA 例外。
- opaque：web.dev PWA 缓存课「7Mb / 1Kb」；MDN `estimate()` 垫跨源。iframe 补丁曾引 Workbox 运行时缓存，本页以平台课为准，不把库升入口。
- `persist()`：WHATWG Storage；web.dev 持久存储（Chrome 静默、Firefox 弹窗、勿 onload）。
- SW 规范：`/TR/service-workers/` 2026-08-14 直读为 Nightly CRD（2026-08-12），并写 Service Workers 1 另沿 Recommendation 轨道。
- 账本：[[queries/第二批蒸馏目标]] B2-PWA；重叠 [[queries/第三批蒸馏目标]] B3-Mani / B3-FS。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区

## 相关内容

- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/git挂载与远程真身]]
- [[concepts/MVU变量闭环]]
- [[concepts/CRDT与local-first]]
- [[comparisons/嵌入三路径对照]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
