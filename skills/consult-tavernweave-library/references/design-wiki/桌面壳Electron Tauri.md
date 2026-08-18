---
title: 桌面壳Electron Tauri
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
  - https://www.electronjs.org/docs/latest/
  - https://www.electronjs.org/docs/latest/tutorial/process-model
  - https://www.electronjs.org/docs/latest/tutorial/ipc
  - https://www.electronjs.org/docs/latest/tutorial/security
  - https://v2.tauri.app/start/
  - https://v2.tauri.app/concept/architecture/
  - https://v2.tauri.app/security/
  - https://v2.tauri.app/reference/webview-versions/
  - https://v2.tauri.app/concept/inter-process-communication/
  - https://v3.wails.io/concepts/architecture/
  - https://v3.wails.io/quick-start/why-wails/
  - queries/第三批蒸馏目标.md
  - concepts/PWA与存储配额.md
  - concepts/酒馆宿主与iframe分层.md
knowledge_class: factual
---

# 桌面壳Electron Tauri

本页不是已采用桌面壳，也不是工坊或角色卡必须换壳的工单。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]]（B3-Desk，约 9 条）。只收官方入口与架构合同，不收攻击步骤、CVE 利用或打包绕过。

## 一句话定义

桌面壳是把 HTML/CSS/JS 界面装进操作系统窗口的框架。Electron 把 **Chromium 和 Node.js 打进自己的二进制**；Tauri 与 Wails 不捆浏览器，界面跑在**系统已有的 WebView** 里，系统调用分别走 Rust / Go。

## 为什么重要

「用网页做桌面应用」不是一条技术。捆一份 Chromium，三台机器上的像素和 API 面更齐，但安装包和补丁节奏跟你自己的发版走。借系统 WebView，包可以小到官方自称的几百 KB 到十几 MB，但 Windows 是 WebView2（Edge/Chromium）、macOS 是 WKWebView、Linux 是 webkit2gtk，能力面跟 OS 补丁走。本仓库角色卡跑在酒馆 iframe 里，**没有 OS 安装面**；本页只蒸行业合同，不写成要换壳。PWA 的安装面见 [[concepts/PWA与存储配额]]，不要和桌面壳并成一种「能装到桌面」。

## 权威入口

本轮打开过 [Electron docs/latest](https://www.electronjs.org/docs/latest/)。下列 **9** 条是本页真源。`wails.io` 本轮撞 Cloudflare 人机验证，可读正文改走 `v3.wails.io`。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Electron Introduction](https://www.electronjs.org/docs/latest/) | 用 JS/HTML/CSS 做桌面应用；**把 Chromium 和 Node.js 嵌进二进制**，一份代码对 Windows / macOS / Linux。本轮 Fiddle 示例戳 43.4.0。 |
| 2 | [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) | 架构从 Chromium 继承：一个 main（Node 环境）+ 每个窗口一个 renderer（按 Web 标准，默认无 Node）。preload + `contextBridge`；`contextIsolation` 默认开。 |
| 3 | [Security](https://www.electronjs.org/docs/latest/tutorial/security) | Electron **不是浏览器**。发产品等于同时发 Electron、Chromium 共享库和 Node。清单只作防御合同入口，本页不抄操作步骤。 |
| 4 | [What is Tauri](https://v2.tauri.app/start/) | 任意编到 HTML/JS/CSS 的前端；后端可用 Rust / Swift / Kotlin。三条优势里写明：**用系统原生 webview 换更小包**；最小应用可小于 600KB。 |
| 5 | [Tauri Architecture](https://v2.tauri.app/concept/architecture/) | 不是内核包装、不是 VM。TAO 管窗，WRY 管 WebView。最终二进制由 Rust 编出，不另运一份 JS 运行时。MIT 或 Apache-2.0。 |
| 6 | [Tauri Security](https://v2.tauri.app/security/) | 明文：**依赖操作系统 WebView，不把 WebView 打进应用二进制**。理由是 OS / WebView 维护者平均比「自己捆引擎的应用开发者」更快把补丁滚到用户。 |
| 7 | [Webview Versions](https://v2.tauri.app/reference/webview-versions/) | Windows = WebView2（Edge / Chromium，可自更新）；macOS/iOS = 预装 WKWebView；Linux = `webkit2gtk`；Android = 系统 WebView。系统 WebView **可以仍是 Chromium 系**，只是不捆。 |
| 8 | [How Wails Works](https://v3.wails.io/concepts/architecture/) | Go 后端 + Web 前端。原话：不像 Electron，**不捆浏览器，用操作系统原生 WebView**。对照表 Browser 列：OS-provided WebView vs Bundled Chromium。Windows 点名 WebView2。 |
| 9 | [Why Wails](https://v3.wails.io/quick-start/why-wails/) | 同一架构主张。体积 / 内存 / 启动数字是 Wails 自己的对照，本页不当作本仓库实测。 |

上表 **9** 条。B3-Desk 的采集行不在本页镜像。IPC 专页（Electron / Tauri）只作进程合同补充，不另占入口位。

## 如何运作

### 两条渲染合同

Electron 自己带一份 Chromium，renderer 的行为「至少跟这份 Chromium 走」。Tauri / Wails 问 OS 要 WebView：Windows 上常常仍是 Chromium 家族（WebView2），macOS 是 WebKit，Linux 发行版的 webkit2gtk 版本散。冲突在「谁发引擎、谁补丁」，不在「一边用 Chromium、一边绝对不用」。

### 进程与语言

Electron：main 跑 Node，管 `BrowserWindow` / 生命周期 / 原生菜单；renderer 写普通网页；两边用 IPC，preload 用 `contextBridge` 暴露白名单。历史上 renderer 默认可开完整 Node，现已关。Tauri：Rust 核心拥有系统资源；WebView 里的前端只经 IPC（Events 单向，Commands 像 `fetch` 的 `invoke`，参数要能 JSON 序列化）；能力面由 capabilities 收。Wails：Go 编成原生二进制，前端经内存桥调已注册的导出方法，再 JSON 往返。这和 [[concepts/gRPC与Connect]] 的跨进程 RPC 不是同一条合同：桌面壳桥在本机窗与核心之间，不因此变成网络 API。

### 补丁节奏

Electron 安全页把「跟上最新 Electron」写成责任：你发的是框架 + Chromium + Node 的捆包。Tauri 安全页把「不捆 WebView」写成设计取舍：补丁跟 OS / WebView 包走，承认两边理论上都能同样快，但捆引擎要更重的基础设施。Wails 把 WebView2 写成 Win10/11 预装、跟 Windows Update。安装包分层与清单格式见 [[concepts/SBOM与SLSA]]，本页不把 SBOM 写成换壳前提。

### 窗口库

Tauri 的窗是 TAO（winit 分叉，补菜单和托盘），WebView 抽象是 WRY。Wails v3 各平台自己接 WebView2 / WKWebView / WebKitGTK。Electron 的窗就是 `BrowserWindow`，底下仍是那份自带 Chromium。

## 行业何时该上

| 合同 | 何时该上 | 不该当成 |
|---|---|---|
| Electron 自带 Chromium + Node | 要三平台同一套 Blink / 同一套 DevTools / 现成 Node 生态 | 「网页应用自动获得浏览器沙箱」 |
| Tauri 系统 WebView + Rust | 要小包、要 Rust 核心与 capabilities，并能接受各 OS WebView 差 | 「不是 Chromium」；Windows 上 WebView2 仍是 Edge/Chromium |
| Wails 系统 WebView + Go | 后端已是 Go，要单文件原生二进制 | `wails.io` 现网枢纽；本轮可读站是 `v3.wails.io` |
| PWA / 清单 / Service Worker | 顶层站点要安装到浏览器/OS 的 Web 安装面 | 桌面壳；酒馆 iframe 无安装面 |
| 酒馆助手消息 iframe | 卡 HUD 要整页脚本隔离 | 桌面主进程、Node、Rust/Go 桥 |

十二因素把进程写成无状态、可丢可补的 dyno，见 [[concepts/十二因素与CAP]]；桌面壳是用户机器上的长驻窗 + 原生菜单，不要把「发一个 Electron 包」写成已经满足十二因素。集群工作负载见 [[concepts/Kubernetes工作负载]]，也不是本机窗。

## 必须保留的冲突

- Electron 把 Chromium（以及 Node）打进二进制；Tauri / Wails 用系统 WebView，不捆浏览器。这是账本冲突，也是三家官方自己的对照轴。
- 系统 WebView 在 Windows 上仍是 Chromium 系（WebView2）。「不捆」≠「不用 Chromium」。
- `wails.io` 本轮不可读；架构正文在 `v3.wails.io`。
- Wails 体积数字是自家对照，不是本仓库基准。
- 「工坊和角色卡现在不上桌面壳」不是「这三条不是正当行业合同」。
- 桌面壳 ≠ PWA ≠ 酒馆 iframe。三条安装面 / 进程面不要并成一种「能跑网页」。

## 例子

- 正例：要 VS Code 那种「每台机器同一份 Chromium」再选 Electron，并按它的进程模型把特权留在 main。
- 正例：要小安装包且能接受「Windows 跟 Edge 走、macOS 跟系统 WebKit 走」再选 Tauri / Wails。
- 正例：读 Tauri Webview Versions 再写 caniuse 预期，不要假设 Linux 发行版和 macOS 14 是同一个引擎。
- 反例：把「Tauri/Wails 不用 Chromium」写成事实。Windows WebView2 官方就写 based on Edge / Chromium。
- 反例：把角色卡 iframe 或工坊静态站写成「已经在用桌面壳」。
- 反例：把 Wails 对照表里的 15MB / 150MB 写成第三方基准，或把 `wails.io` 当 2026-08-14 的可读枢纽。

## 边界与易混概念

- 不包括：攻击面清单操作、CVE 利用、关闭 `webSecurity` 的做法、凭证、本仓库换壳工单。
- Electron 捆 Chromium ≠ Tauri/Wails 的系统 WebView。这是 B3-Desk 必须保留的冲突。
- 系统 WebView ≠ 「非 Chromium」。Windows WebView2 与 Android 系统 WebView 都是 Chromium 系，只是不随应用二进制走。
- 桌面壳 ≠ PWA。PWA 是顶层 Web 的安装与离线合同；壳是 OS 进程 + 原生窗。角标 / 推送挂在已安装顶层应用，见 [[concepts/Web Push与角标]]，不自动落到卡 iframe。
- 桌面壳 ≠ 酒馆 iframe。卡没有主进程，也没有 OS 安装面。见 [[concepts/酒馆宿主与iframe分层]]、[[comparisons/嵌入三路径对照]]。
- Electron 不是浏览器。官方安全页原话。浏览器防御头见 [[concepts/CSP与Trusted Types]]；本页不把 CSP 写成 Electron 已自带沙箱。
- Tauri 不是 VM，也不是轻量内核包装。
- Wails v2 文档站与 v3 可读站不是同一 URL；本轮 `wails.io` 停在 Cloudflare。
- 无头组件在 Electron 里仍要传对 `getRootNode`。见 [[concepts/无头组件与根节点]]。
- 前端构建链（Vite 等）编的是 Web 产物，见 [[concepts/构建链与Vite]]；打进桌面壳是另一步，不因此变成已采用壳。

## 映射到本仓库

当前工坊是静态目录 + Gateway，角色卡 HUD 落在宿主挂载与酒馆助手 iframe，见 [[comparisons/行业架构方案何时用]] 与 [[comparisons/工坊架构该上与不该上]]。桌面壳不因此变成已采用依赖，也不自动把清单 / 徽章 / 文件处理落到卡上。卡 iframe 没有 main 进程，也没有 Node / Rust / Go 桥。这是产品落点，不是对三条行业合同的否定。

本页只问「网页装进 OS 窗」的两条渲染合同与补丁节奏，不是「工坊必须上 Electron / Tauri / Wails」。

## 来源与证据

- Electron 捆 Chromium + Node：本轮 [docs/latest](https://www.electronjs.org/docs/latest/)「By embedding Chromium and Node.js into its binary」。
- 进程模型从 Chromium 继承：[process-model](https://www.electronjs.org/docs/latest/tutorial/process-model)。
- 发产品等于发捆包：[security](https://www.electronjs.org/docs/latest/tutorial/security)「shipping a bundle composed of Electron, Chromium shared library and Node.js」。
- Tauri 用系统 webview、最小可 <600KB：[start](https://v2.tauri.app/start/)。
- Tauri 明文不捆 WebView：[security](https://v2.tauri.app/security/)「(Not) Bundling WebViews」。
- Windows WebView2 仍是 Chromium：[webview-versions](https://v2.tauri.app/reference/webview-versions/)。
- Wails 不捆浏览器：[architecture](https://v3.wails.io/concepts/architecture/)。
- `wails.io` 本轮 Cloudflare：Ray ID `a2afd7bd580e7ae9`。
- 查询账本：[[queries/第三批蒸馏目标]] B3-Desk。

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
- [[concepts/PWA与存储配额]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/前端架构名词与取舍]]
- [[concepts/无头组件与根节点]]
- [[concepts/CSP与Trusted Types]]
- [[concepts/构建链与Vite]]
- [[concepts/SBOM与SLSA]]
- [[concepts/十二因素与CAP]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/Web Push与角标]]
- [[concepts/gRPC与Connect]]
- [[comparisons/嵌入三路径对照]]
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
