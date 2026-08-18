---
title: Web Push与角标
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
  - https://www.w3.org/TR/push-api/
  - https://notifications.spec.whatwg.org/
  - https://developer.mozilla.org/en-US/docs/Web/API/Push_API
  - https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
  - https://www.rfc-editor.org/rfc/rfc8030.html
  - https://www.rfc-editor.org/rfc/rfc8292.html
  - https://www.rfc-editor.org/rfc/rfc8291.html
  - https://www.w3.org/TR/badging/
  - https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
  - https://webkit.org/blog/12945/meet-web-push/
  - https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
  - https://web.dev/articles/push-notifications-overview
  - https://web.dev/articles/push-notifications-permissions-ux
  - queries/第五批蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/PWA与存储配额.md
  - concepts/酒馆宿主与iframe分层.md
knowledge_class: factual
---

# Web Push与角标

本页不是已采用推送栈，也不改工坊或角色卡。检索时间：2026-08-14。只谈公开规范与平台门，不写攻击步骤、绕过或凭证。账本枢纽是 [[queries/第五批蒸馏目标]] **B5-Push**（13 条入口）。Service Worker 只当投递钩，不重蒸 [[queries/第二批蒸馏目标]] **B2-PWA** 的配额 / 七日 / `persist()`。Badging TR 本身已在 [[queries/第三批蒸馏目标]] B3-Mani，本页只收推送后的角标合同。

## 一句话定义

Push 是应用服务器经浏览器选定的推送服务，把加密报文投到源上的 Service Worker；Notifications 是操作系统把这件事亮到视口外；VAPID 只证明哪台应用服务器有权用这条订阅；Badging 只改已安装应用图标上的点或数字。四件事叠用，不是一个 API。

## 为什么重要

「Web Push」常被写成一份浏览器能力。合同其实分传输、身份、加密、订阅读、系统通知；角标还是另一份。Safari 宣称同一套标准 Push，但 iOS 另加主屏门。MDN 把 Push 标 Baseline Widely（2023-03）不能抹掉这条安装门。权限何时弹也不是一条规范。

## 权威入口

检索 2026-08-14。下列 **13** 条，不是教程，也不镜像全文。Apple Developer「Sending web push…」短链本次超时，不以它升条；Apple 平台真源是 WebKit 两篇。B5-Push 采集行不在本页镜像。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Push API](https://www.w3.org/TR/push-api/) | WD 2025-12-01；订阅读、`push` 事件 |
| 2 | [Notifications](https://notifications.spec.whatwg.org/) | WHATWG LS 2026-03-15；系统通知抽象 |
| 3 | [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) | Baseline Widely；`subscribe()`、endpoint 须保密 |
| 4 | [MDN Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) | Limited；`Notification()` vs `showNotification()` |
| 5 | [RFC 8030](https://www.rfc-editor.org/rfc/rfc8030.html) | Web Push 传输 |
| 6 | [RFC 8292 VAPID](https://www.rfc-editor.org/rfc/rfc8292.html) | 应用服务器自愿身份 |
| 7 | [RFC 8291](https://www.rfc-editor.org/rfc/rfc8291.html) | 报文加密 |
| 8 | [Badging API](https://www.w3.org/TR/badging/) | WD 2026-04-27；`setAppBadge` / `clearAppBadge` |
| 9 | [MDN Badging](https://developer.mozilla.org/en-US/docs/Web/API/Badging_API) | Limited；`0` 即清除 |
| 10 | [WebKit Meet Web Push](https://webkit.org/blog/12945/meet-web-push/) | Safari 16 / macOS Ventura；标签可订 |
| 11 | [WebKit iOS/iPadOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) | 16.4；**仅主屏 Web 应用** |
| 12 | [web.dev Push 总览](https://web.dev/articles/push-notifications-overview) | Push ≠ Notification；现不允许静默推 |
| 13 | [web.dev 权限 UX](https://web.dev/articles/push-notifications-permissions-ux) | 双许可 / 禁落地即弹 |

刻意未收：Permissions WD（只查授权态）、Chrome Android 轻提示（权限冲突证据，不是第二份 Push 规范）、Lighthouse onload 审计、Push 编辑草稿、旧 Safari Push Package / Website Push ID、FCM 控制台、web-push 库 README。

## 如何运作

### 五层合同

1. **传输**：[RFC 8030](https://www.rfc-editor.org/rfc/rfc8030.html)（2016-12）规定应用服务器如何把 HTTP 报文交给推送服务。
2. **身份**：[RFC 8292 VAPID](https://www.rfc-editor.org/rfc/rfc8292.html)（2017-11）用 JWT 把订阅绑到一对应用服务器密钥。这不是加密密钥。
3. **加密**：[RFC 8291](https://www.rfc-editor.org/rfc/rfc8291.html)（2017-11）保护报文；推送服务读不到明文。`applicationServerKey` ≠ `p256dh`。
4. **订阅读**：[Push API](https://www.w3.org/TR/push-api/) 是 **WD 2025-12-01**，不是 Rec。管 `PushManager.subscribe()`、`push` 事件。声明式推送（`web_push: 8030`）写在 WD 里，不是 Baseline。
5. **亮出来**：[Notifications](https://notifications.spec.whatwg.org/) 是 WHATWG LS（**2026-03-15**）。`/TR/notifications/` 现网落到这篇，不要写成 W3C Rec。

[Badging](https://www.w3.org/TR/badging/)（**WD 2026-04-27**）是另一份：`setAppBadge` / `clearAppBadge` 写已安装应用的主屏 / Dock 角标。通知里的 badge 图是通知位图，不是这份 API。

`endpoint` 是能力 URL：知道它就能投。须保密。本页不写盗用或伪造步骤。推送服务由用户代理选定，站点只按 `PushSubscription.endpoint` 投。

### Safari 与主屏门

WebKit 两篇都写：同一套 W3C Push + Notifications + Service Worker，应用做特征检测、放行 `*.push.apple.com`。

**另一边必须留**：macOS Safari 16 可在**标签页**订；iOS/iPadOS 16.4 **只给已加到主屏**、且清单 `display` 为 `standalone` / `fullscreen` 的 Web 应用。Safari 标签里的站点没有这层安装面，就没有 iOS 推送。写「Safari 支持 Web Push」必须拆平台。

### 权限提示不是一条合同

规范（含 Permissions WD）只标准化查询与授权态，不规定何时弹系统提示。几套策略不要并成一种：

- MDN：须用户手势；Firefox 72 起无手势会被拒。
- web.dev：价值主张 / 双许可 / 设置面板 / 被动开关；**禁落地即弹**；被永久 Block 后站点不能再要。
- Chrome Lighthouse 把 onload `requestPermission()` 标失败。Chrome 80 起低接受率进安静 UI。
- Android Chrome 155 起非阻塞提示可超时，`requestPermission()` 回到 `default`，须听 `permissions.onchange`。
- Safari / iOS：**必须**用户手势，且先过主屏门。

### 可见通知与角标

Chrome/Edge 拒 `userVisibleOnly !== true`。WebKit：违 `userVisibleOnly`（不亮可见通知）会**撤订阅**。web.dev：浏览器目前不允许无可见通知的静默推。Firefox 对不亮通知的推送另有配额；Chrome 无此条。都不是「可以做静默推」。

MDN：Push 已 Baseline Widely；Notifications 与 Badging 仍 Limited。三套成熟度不同。Badging 实现面：`nothing` / `flag` / 整数；`0` 即清除。iOS 上 Badging 跟通知权限走。

## 必须保留的冲突

- **iOS 只给已加主屏的 Web 应用。** 同一套标准 Push：macOS Safari 16 可在标签页订；iOS/iPadOS 16.4 只给已加到主屏且 `display` 为 `standalone` / `fullscreen` 的 Web 应用。MDN Baseline Widely 不能抹掉这条安装门。两边都留。
- 权限提示策略不是一条合同：手势、双许可、安静 UI、超时回到 `default` 不要并成一种。
- Push API 是 WD，不是 Rec。Notifications 真源是 WHATWG LS，不是 W3C Rec。
- Push 已 Baseline；Notifications 与 Badging 仍 Limited。
- VAPID 身份 ≠ 8291 加密；`applicationServerKey` ≠ `p256dh`。
- 违 `userVisibleOnly` 在 WebKit 会撤订阅；现浏览器不允许无可见通知的静默推。
- 本页映射独立站的推送 / 角标合同；**不是**「本仓库已采用 Web Push」。

## 例子

- 正例：独立工坊站若谈推送，按五层分开写：8030 投递、8292 身份、8291 加密、Push API 订阅、Notifications 亮出。
- 正例：写 Safari 支持时拆 macOS 标签 vs iOS 主屏门，不写「Safari 已 Baseline」。
- 正例：角标用 `setAppBadge`；通知小图标用 Notifications 的 badge 位图。两套不混名。
- 反例：落地即弹 `requestPermission()`，或把「手势 / 双许可 / 安静 UI / 超时 default」并成一种提示。
- 反例：把 VAPID 密钥当报文加密密钥，或把 `userVisibleOnly: false` 当成静默推开关。
- 反例：因本页出现 Push 就写进 recipe / 发卡依赖。

## 边界与易混概念

- 不包括：垃圾推送教程、onload 弹权限菜谱、绕过权限、静默推利用、endpoint 盗用、攻击、PoC、FCM 操作、旧 Safari Push Package、把库接入当规范。
- Push ≠ Notification。前者是投到 SW；后者是 OS 亮出来。
- VAPID ≠ 8291 加密。身份密钥不是 ECDH 密钥。
- 通知 badge 图 ≠ Badging API。
- 旧 Website Push ID ≠ RFC 8030。
- B2-PWA 的配额 / 七日 / `persist()` **不是**推送权限，也不挡撤订阅。见 [[concepts/PWA与存储配额]]。
- 声明式推送不是 Baseline。

## 映射到本仓库

酒馆卡 iframe 无 OS 安装面，也不是顶层 PWA：Push / 主屏门 / `setAppBadge` 不自动落到卡。分层见 [[concepts/酒馆宿主与iframe分层]]。SW 作为第三种 worker 见 [[concepts/SharedWorker与Web Locks]]。独立工坊站可以谈推送，那是顶层站点合同；本页不写「本仓库已采用 Web Push」。

## 来源与证据

- 五层：Push API WD 20251201；Notifications LS 2026-03-15；RFC 8030 / 8291 / 8292 文首；Badging WD 20260427。
- Safari 门：WebKit 2022「Meet Web Push」（Safari 16 / 标签）；WebKit「Web Push for web apps on iOS and iPadOS」（16.4 / 仅主屏）。
- 权限：web.dev 两篇；MDN Push / Notifications；Chrome Android 155 轻提示作冲突证据，不升条。
- 账本：[[queries/第五批蒸馏目标]] B5-Push；分路原稿仍在 `10-收件箱/写回候选/第五批-B5-Push.md`。重叠 [[queries/第二批蒸馏目标]] B2-PWA（SW / 配额）、[[queries/第三批蒸馏目标]] B3-Mani（清单 `display` / 角标 TR）。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词（含 `safety`：只谈规范约束）
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[concepts/PWA与存储配额]]
- [[concepts/SharedWorker与Web Locks]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/创意工坊与安全契约]]
- [[concepts/git挂载与远程真身]]
- [[queries/第五批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
