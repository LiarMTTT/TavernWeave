---
title: git 挂载与远程真身
created: 2026-08-13
updated: 2026-08-13
type: concept
status: active
tags:
  - wiki
  - concept
  - sillytavern
  - tooling
sources:
  - 角色卡工作区/ST开发指南DB/D1_git挂载与资源加载.md
  - raw/workshop-cards-2026-08-13/status_bar-mount_shell_remote-README.txt
  - 角色卡工作区/星月/星月 4.0.0/components/mvu_zod_cn.js
knowledge_class: factual
---

# git 挂载与远程真身

卡内只留薄壳，真身从 GitHub/jsDelivr 拉。push runtime 就能热修，不必每次重发卡。指南：`D1_git挂载与资源加载.md`。状态栏壳样本：`status_bar-mount_shell_remote`。

## 谁在用

| 东西 | 星月 | 交错 | 怪谈 |
|---|---|---|---|
| 状态栏/开局/控制中心 runtime | 3.9.6+ git-mount | 控制中心本地为主 | HUD 内嵌脚本，不靠远程 HTML |
| MVU bundle | 两边 CDN 都用过 | 同 | 同 |
| 远程 Git loader 政策 | 要 | 可用 | 卡内 |

末日之后设计档**禁止**远程 Git loader。

## 状态栏壳四段

```text
1. 双源：cdn.jsdelivr.net → testingcf.jsdelivr.net
2. 基址：window.XY_RT_BASE，否则内联 BASE / BASE_CF
3. Blob URL 赋给内层 iframe（跨源 document.write 会被拦）
4. injectBridge：给 blob 自载 jQuery/lodash，镜像 TH 全局，getVariables 走顶层 Mvu
```

出卡必改：`BASE` / `BASE_CF` 里的 `runtime/xingyue/<ver>`。换仓库改 `LiarMTTT/rolecard-diy-workshop@main/runtime/<family>/<ver>`。

隔离：CC 的 script-iframe 和状态栏 message-iframe 不是同一 `window`，`XY_RT_BASE` 经常到不了壳，壳恒走内联。版本写错就拉错真身。

高度：`syncHeight` + ResizeObserver，把内层高度同步到外层 iframe。

版本检测（可休眠）：真身注释 `<!-- XY-SB-VERSION -->` 对 GitHub raw `VERSION.txt`。缺一处就静默跳过。

## 和全量本地版互斥

同名输出 `status_bar_regex.html`：要么薄壳，要么卡内整页。交错 2.6.2 走整页。星月 3.9.6 起不再生成完整本地 HUD HTML。

## 其它远程

Zod 脚本动态 `import` MagVarUpdate `bundle.js`，同样双 CDN。世界书 Ready 信号后再 import，见 [[concepts/MVU变量闭环]]。

D1 还覆盖 npm `/+esm`、离线 vendor、CSP。稳定卡主路径是 jsDelivr git 路径，不是把整个 node_modules 塞进卡。

## 相关内容

- [[concepts/控制中心与状态栏]]
- [[concepts/角色卡DOM与挂载点]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/角色卡技术路径总图]]
