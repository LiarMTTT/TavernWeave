---
title: Web性能与INP
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - tooling
  - research
knowledge_class: factual
sources:
  - https://web.dev/articles/vitals
  - https://web.dev/articles/inp
  - https://web.dev/articles/lcp
  - https://web.dev/articles/cls
  - https://web.dev/blog/inp-cwv-launch
  - https://web.dev/articles/optimize-long-tasks
  - https://html.spec.whatwg.org/multipage/speculative-loading.html
  - https://developer.chrome.com/docs/web-platform/prerender-pages
  - https://www.rfc-editor.org/rfc/rfc8297.html
  - https://developer.chrome.com/docs/web-platform/early-hints
  - https://chromium.googlesource.com/chromium/src/+/HEAD/docs/early-hints.md
  - https://developer.mozilla.org/en-US/docs/Web/API/Scheduling/isInputPending
  - queries/前端视觉与灵感站点蒸馏目标.md
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/前端架构名词与取舍.md
---

# Web性能与INP

本页蒸 **Core Web Vitals**（LCP / INP / CLS）以及预渲染、`103 Early Hints`。行业合同，不是本仓库采纳清单。第一批架构 A1 已链 [Web Vitals](https://web.dev/articles/vitals)；B2-Perf、B2-Otel-11 与它重叠，**不是新发现**。渲染位置名词见 [[concepts/前端架构名词与取舍]]，本页不整页复述。

## 一句话定义

Web 性能这里指：用一组可场测的用户中心指标，量「主内容何时可见、交互多久才画出下一帧、布局是否意外跳」，再用长任务让出与推测加载去改这些数。现行交互 Core Web Vital 是 **INP**，不是 FID。

## 为什么重要

站点主人生不必先当性能专家。Google 用 Web Vitals 把工具海里的信号收成三面：加载、交互、视觉稳定。场数据按移动/桌面分开，看 **75 分位**；三指标都过线才算过。

Chrome 使用数据显示，用户 90% 的时间花在加载之后，所以只盯首包不够。CrUX / PageSpeed / Search Console 能告诉你「有没有问题」；要归因到哪一次点击、哪一段长任务，还得自建 RUM。[web-vitals](https://github.com/GoogleChrome/web-vitals) 是官方包装，尽量对齐 Google 工具的计算差异，但**框内条目仍要子框自己上报**。

B2-Otel 里的 Web Vitals 仪表是同一套指标的导出面，仍回 A1，不要当成第二套合同。实验室（Lighthouse、无交互的 PSI 实验室栏）先抓回归；场数据才是合同。

## 如何运作

### INP

[INP](https://web.dev/articles/inp) 观察整次访问里的点击、轻触、键盘（含屏幕键盘）。**不**计滚动、悬停、缩放。一次交互是同一手势下的一组处理器（如 `pointerdown` + `pointerup` + `click`）；延迟从用户动手到浏览器**能画出下一帧**，含输入等待、处理、呈现。意图不是量网络请求或后续异步 UI 的全部收尾，而是下一帧被堵住多久。

页面 INP 通常取最差一次；交互很多时每 50 次丢掉一个最差，再报 75 分位。阈值：≤200 ms 好，200–500 ms 待改进，>500 ms 差。无点击/轻触/按键时可以没有 INP。实验室无交互时可用 TBT 作代理，**不能代替** INP。

2024-03-12 INP **正式取代 FID** 成为交互 Core Web Vital。FID 只量第一次交互的输入等待；INP 从输入等待一直量到下一帧，且覆盖整页生命周期。从后退/前进缓存恢复应把 INP 归零，当作新一次访问。iframe 里的交互计入指标（用户分不清框），但页面 JS API 看不到跨框内容，CrUX 与自建 RUM 会对不上。

### LCP

[LCP](https://web.dev/articles/lcp) 报视口内最大图、文本块或视频相对导航起点的绘制时刻。好线 ≤2.5 s（75 分位）。候选元素随后续帧更新，分析只报最后一条。图未解码、字体阻塞期的文本都不算已绘。改尺寸或位置不产生新候选，只看初次视口尺寸。

FCP 是「任何内容」，LCP 是「主内容」。全视口底图、低熵占位常被启发式丢掉，所以两套「contentful」不是同一集合。跨源图缺 `Timing-Allow-Origin` 时，旧实现只暴露加载时刻，可能假报 LCP 早于 FCP；Chrome 133 起即使无该头也给粗化绘制时刻。预渲染页应从 `activationStart` 起算，不是导航起点。后台标签的条目应忽略。iframe 内的 LCP 同样计入指标、API 默认不报。

### CLS

[CLS](https://web.dev/articles/cls) 是整页生命周期里**最大一串**意外位移的累计分。位移 = 已有可见元素的起点在两帧间变了；新插入或自身变大，只要不把别人推走，不算。窗口（session window）：相邻位移间隔 <1 s，窗最长 5 s；取窗口累计最大者。

单次分 = 影响分数 × 距离分数。好线 ≤0.1，>0.25 差。用户输入后 500 ms 内带 `hadRecentInput`，可排除。用 `transform: translate()` / `scale()` 做位移动画，不要改 `top` / `left` / `width` / `height`。从 bfcache 恢复应归零。iframe 位移计入指标、API 默认不报。

### 长任务

主线程一次只跑一件事。超过 **50 ms** 的是长任务；总时长减 50 ms 是阻塞段。拆函数不等于拆任务：五个同步调用仍是一条。让出主线程，好让输入和下一帧插队。

[web.dev 优化长任务](https://web.dev/articles/optimize-long-tasks) **不再推荐 `isInputPending()`**：它会假阴性、忽略动画与常规 UI 刷新，且已被 `scheduler.yield()` / `scheduler.postTask()` 替代。现行做法是按约 50 ms 预算让出，而不是「探测到输入再让」。`scheduler.yield()` 的续体会优先于同类新任务；缺实现时退回 `setTimeout(0)`，续体落到队尾，嵌套五层后浏览器还会加最少 5 ms 延迟。MDN 亦标 Avoid，指向 Scheduler。

### 预渲染与 103

两套不同的「提前干活」，不要并成一词。

**推测加载**（[WHATWG](https://html.spec.whatwg.org/multipage/speculative-loading.html)）：用 Speculation Rules JSON（`type="speculationrules"` 或 `Speculation-Rules` 头）声明 `prefetch` / `prerender`。Chrome 已恢复整页预渲染；旧 `<link rel=prerender>` 退化成 NoState Prefetch（只拉资源、不跑 JS）。规则可写 URL 列表或文档谓词（`href_matches` / `selector_matches`）。`eagerness` 控制何时猜：`immediate` / `eager` / `moderate` / `conservative`；列表规则默认 `immediate`，文档规则默认 `conservative`。猜中可把 LCP 压到接近 0，加载期 CLS 发生在激活前；错猜耗内存和带宽。规范里 `prerender` 在解析时仍可被降成 `prefetch`，完整预渲染行为看实现与 Prerendering Revamped。

**103 Early Hints**（[RFC 8297](https://www.rfc-editor.org/rfc/rfc8297.html)）：服务器在最终响应未定时，先发信息性响应，让客户端按 `Link` 做准备。RFC **仍是 Experimental**，不是 Internet Standard。Chrome 自 103 起对**顶层导航**处理 103，且 **只认 `preload` 与 `preconnect`，不含 `prefetch` / `dns-prefetch`**。子资源请求、iframe 导航、HTTP/1.1 上的 103 会被忽略；第二条及之后的 103 也不处理。103 对首次落地页最有用，站内第二跳收益下降。它不是 Speculation Rules，也不是已废的 H2 Push（Push 常把浏览器已有的资源再推一遍）。

## 权威入口

下列为可点真源，8–16 条。A1 总览重复列出，标明重叠。

1. [Web Vitals 总览（第一批 A1，非新发现）](https://web.dev/articles/vitals)
2. [INP](https://web.dev/articles/inp)
3. [LCP](https://web.dev/articles/lcp)
4. [CLS](https://web.dev/articles/cls)
5. [INP 正式成为 Core Web Vital（取代 FID）](https://web.dev/blog/inp-cwv-launch)
6. [INP 升格预告（2024-03-12）](https://web.dev/blog/inp-cwv-march-12)
7. [优化 INP](https://web.dev/articles/optimize-inp)
8. [优化长任务（勿用 isInputPending）](https://web.dev/articles/optimize-long-tasks)
9. [scheduler.yield()](https://developer.chrome.com/blog/use-scheduler-yield)
10. [MDN isInputPending（Avoid）](https://developer.mozilla.org/en-US/docs/Web/API/Scheduling/isInputPending)
11. [WHATWG Speculative loading](https://html.spec.whatwg.org/multipage/speculative-loading.html)
12. [Chrome 预渲染 / Speculation Rules](https://developer.chrome.com/docs/web-platform/prerender-pages)
13. [RFC 8297 Early Hints（Experimental）](https://www.rfc-editor.org/rfc/rfc8297.html)
14. [Chrome Early Hints（103 不含 prefetch）](https://developer.chrome.com/docs/web-platform/early-hints)
15. [Chromium `early-hints.md`](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/early-hints.md)
16. [web-vitals JS 库](https://github.com/GoogleChrome/web-vitals)

## 例子

- 正例：内容站 SSG 把 LCP 图与字体稳定住；交互岛用 `scheduler.yield()` 切开 >50 ms 的保存/校验；高置信下一页用 Speculation Rules `prerender`，落地页用 103 只 hint 稳定的 `preload`/`preconnect`。
- 正例：手风琴点击后立刻画出展开，再异步拉详情。INP 量的是下一帧，不是网络收尾。
- 反例：用 FID 或 TBT 对外宣称「交互 Core Web Vital 已过」。
- 反例：长循环里只在 `isInputPending()` 为真时让出；或把 103 的 `prefetch` 当成 Chrome 103 已实现。
- 反例：把「角色卡场景用不上」写成行业指标不存在。

## 边界与易混概念

- 不包括：离线合成、真机验收声称、本仓库「已采用」某库或某 CDN。
- INP ≠ FID ≠ TBT。FID 已退出 Core Web Vitals；TBT 是实验室代理。
- LCP ≠ FCP；全屏 splash 可以很快 FCP、很慢 LCP。
- 103 Early Hints ≠ Speculation Rules ≠ `<link rel=prefetch>` ≠ 已废 H2 Push。
- 预渲染 ≠ NoState Prefetch；旧 `rel=prerender` 不再是整页预渲染。
- 指标计入 iframe，页面 API 默认看不到框内条目：CrUX 与自建 RUM 会分叉。
- 滚动/悬停不进 INP；用户发起的位移在 500 ms 内可不进 CLS。

## 冲突

- **与第一批重叠**：A1 已是 Web Vitals 枢纽；B2-Perf、B2-Otel-11 再出现同一簇，记账本续写，不当新发现。
- **INP 取代 FID**：2024-03-12 起交互 Core Web Vital 是 INP。旧文、旧仪表仍写 FID 的，以 vitals / inp-cwv-launch 为准。
- **长任务不再推荐 isInputPending**：web.dev 与 MDN 一致改口；新文若仍教「有输入再让出」，与现行指南冲突，采用 yield 无条件让出。
- **RFC 8297 仍是 Experimental**；实现普及不等于 IETF 已升 Standard。
- **Chrome 103 的 103 不含 prefetch**（也不含 dns-prefetch）；只 preload / preconnect，且限顶层导航。RFC 举例可以写任意 `Link`，Chrome 实现更窄。两边都留。
- WHATWG 把 `prerender` 写成解析期可降级为 `prefetch`；Chrome 文档写整页预渲染。写「规范已保证整页预渲染」会过读。
- 实验室 Lighthouse 对 INP 画叉、改看 TBT：这是工具能力，不是指标降级。

## 映射到本仓库

映射放最后，不当过滤器。行业指标对独立站和嵌入 UI 都成立，**不是「卡不能谈性能」**。卡 JSON/PNG、真机验收、本仓是否接线，都不在本页宣布。

- **工坊 SSG**：独立工坊站默认 SSG/ISR + islands（见 [[comparisons/工坊架构该上与不该上]]、[[concepts/前端架构名词与取舍]]）。目录/营销页按普通内容站读 LCP/CLS（英雄图、字体、岛注水）。审核台若进岛，INP 跟岛内长任务走，不是「静态站无交互指标」。103 与 Speculation Rules 只对**顶层导航**有意义，不是 Gateway 写面合同，也不是「本仓已上 103」。
- **开局页**：一次性初始化器，见 [[concepts/开局页路径]]。首屏大图、网页字体、表单后插入会直接打 LCP/CLS；提交若被同步校验/写变量堵住，就是 INP。楼内裸 `<script>` 不一定执行（开局页路径已记），重逻辑不该赌首楼主线程一口气跑完。
- **iframe 与主线程**：TH 消息框是独立文档；宿主挂载的 HUD、选项桥、输入框与 ST 主题变量**同页事件循环**。Shadow DOM 同 JS 堆、同卡顿。框内长任务会进顶层 INP/LCP/CLS 的场数据，但卡内 `PerformanceObserver` 默认收不到跨框条目——这是指标与 API 的已知分叉，不是「嵌入就不用量」。iframe 导航上的 103，Chrome 忽略。跨文档 `backdrop-filter` 糊不到父页，那是视觉边界，见 [[concepts/酒馆宿主与iframe分层]]，不要用它否定性能合同。

本页不写「已采用 web-vitals / Speculation Rules / 103」。蒸馏目标仍在 [[queries/第二批蒸馏目标]]、[[queries/第三批蒸馏目标]]。

## 相关内容

- [[concepts/前端架构名词与取舍]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/开局页路径]]
- [[concepts/视觉CSS与设计token]]
- [[concepts/动画库与动效管线]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/嵌入三路径对照]]
- [[queries/前端视觉与灵感站点蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
