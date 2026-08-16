# git 挂载与资源加载

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

> 定位：覆盖 jsdelivr/testingcf CDN 的 ESM import 机制、分支 vs 版本锁定的缓存差异、SillyTavern TavernHelper 脚本执行上下文、多源 fallback 实战范式、离线 vendor 打包方案、Claude Code launch.json 挂载 ST 调试的完整参考。

---

## 置信度分级体系

**三级**：
- **high**：双源及以上交叉验证，或生产卡实测可用，可直接施工
- **medium**：单源文档或可信推断，施工前需小范围验证
- **low**：孤证无源或纯推断，**禁止直接施工**，需先取证

**依据类型轴**：
- `[运行时源码]`：从本地生产卡 JSON 直接提取的运行代码
- `[文档·多源]`：两个及以上独立文档/Issue 交叉确认
- `[文档·单源]`：仅一份官方或社区文档
- `[社区]`：论坛、Discord、Issue 讨论（无官方确认）
- `[推断]`：基于现象/命名/行为模式推断，无直接文献

**收集日期**：2026-06-28

**回源基准**：SillyTavern v1.14.0 + 本地成熟生产卡（星月私立高等学院 3.0.2）

---

## 目录

1. [机制总览](#1-机制总览)
2. [jsdelivr CDN ESM Import 机制](#2-jsdelivr-cdn-esm-import-机制)
   - 2.1 [URL 结构与缓存行为](#21-url-结构与缓存行为)
   - 2.2 [testingcf.jsdelivr.net 子域名](#22-testingcfjsdelivrnet-子域名)
   - 2.3 [/+esm 端点行为](#23-esm-端点行为)
3. [SillyTavern 脚本执行上下文](#3-sillytavern-脚本执行上下文)
   - 3.1 [TavernHelper 脚本类型与能力边界](#31-tavernhelper-脚本类型与能力边界)
   - 3.2 [世界书 Ready 信号模式](#32-世界书-ready-信号模式)
   - 3.3 [ST 的 CSP 与域限制](#33-st-的-csp-与域限制)
4. [完整可用范式代码](#4-完整可用范式代码)
   - 4.1 [三源 fallback git 挂载 loader](#41-三源-fallback-git-挂载-loader)
   - 4.2 [双源 CDN 带 worldbook ready 等待](#42-双源-cdn-带-worldbook-ready-等待)
   - 4.3 [单文件工具导入带 fallback](#43-单文件工具导入带-fallback)
   - 4.4 [npm 包 ESM 离线 vendor 导入](#44-npm-包-esm-离线-vendor-导入)
   - 4.5 [Claude Code launch.json 挂载 ST](#45-claude-code-launchjson-挂载-st)
5. [关键字段与 API 参考表](#5-关键字段与-api-参考表)
6. [高频避坑](#6-高频避坑)
7. [悬案：未决项与验证路径](#7-悬案未决项与验证路径)

---

## 1. 机制总览

本文档覆盖「在 SillyTavern 卡片脚本中从 GitHub/npm CDN 动态加载 JS 模块」这一完整技术链路，涵盖：

- **CDN 层**：jsdelivr URL 格式、缓存 TTL、ESM 转换、testingcf 子域名含义
- **ST 层**：TavernHelper 脚本执行模型、顶层 await、动态 import、全局变量通信
- **工程实践层**：多源 fallback 设计、离线 vendor 打包、版本锁定策略
- **调试层**：Claude Code preview/launch.json 与已运行 ST 的对接现状

核心实战来源为**星月私立高等学院 3.0.2 生产卡**（本地路径已验证运行），为最高可信度参考。

---

## 2. jsdelivr CDN ESM Import 机制

### 2.1 URL 结构与缓存行为

**核心结论**：jsdelivr 提供两类 URL 体系——npm 包和 GitHub 仓库文件——缓存行为因引用方式不同而差异极大。

**npm 包 URL**：
```
https://cdn.jsdelivr.net/npm/<package>@<version>/+esm    ← 锁定版本，永久缓存
https://cdn.jsdelivr.net/npm/<package>/+esm              ← 无版本，取最新，约 7 天更新
```

**GitHub 仓库文件 URL**：
```
https://cdn.jsdelivr.net/gh/<user>/<repo>@<version>/<path>       ← semver tag，永久不变
https://cdn.jsdelivr.net/gh/<user>/<repo>@<commit-hash>/<path>   ← commit hash，永久不变
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/<path>            ← 分支，12 小时更新
```

**缓存 TTL 参考表**：

| URL 模式 | 示例 | Cache TTL | 可更新 | 适用场景 |
|---|---|---|---|---|
| `@<semver-exact>` | `@3.1.0` | 永久（1 year header） | 不可（需 purge API） | 发布正式版 |
| `@<commit-hash>` | `@32b003a` | 永久 | 不可 | 精确锁定某次改动 |
| `@<version-alias>` | `@3` / `@latest` | 7 天 | 可（7 天后） | 大版本追踪 |
| `@<branch>` | `@main` | **12 小时** | 自动更新 | 开发热修 |
| 无版本 | `/npm/pinia/+esm` | ~7 天 | 发版后 7 天 | 原型阶段 |

**来源**：[jsdelivr README](https://cdn.jsdelivr.net/gh/jsdelivr/jsdelivr@master/README.md) `[文档·单源]`、[Issue #18532](https://github.com/jsdelivr/jsdelivr/issues/18532) `[社区]`（GitHub Issue，非官方文档） | **适用版本**：现行 jsdelivr 服务 | **置信度**：high `[文档·单源]` + `[社区]`（README 明确列出三种 TTL 分级，Issue 为佐证；缓存 TTL 数值直接来自官方 README，可信度高）

---

**避坑**：@main 分支 push 后最多 12 小时才生效于 CDN。版本 tag 一旦 push 即永久固化，连 purge API 都无法改内容（只能发新 tag）。

---

### 2.2 testingcf.jsdelivr.net 子域名

**核心结论**：`testingcf.jsdelivr.net` 是 jsdelivr 的 **Cloudflare 节点专用子域**，命名来自"testing Cloudflare"，为正式可用 CDN 端点，并非测试版。

与 `cdn.jsdelivr.net` 的区别：

| 子域名 | 调度方式 | 节点覆盖 | 国内可达性 |
|---|---|---|---|
| `cdn.jsdelivr.net` | Cloudflare + Fastly + Bunny + Gcore 多 CDN 调度 | 全球多节点 | 国内走 Quantil/专线路由 |
| `testingcf.jsdelivr.net` | 仅 Cloudflare anycast（4 个 IP） | Cloudflare 全球节点 | 随 Cloudflare 可达性 |

**在实战 fallback 链中的位置**：
```
cdn.jsdelivr.net（主）→ testingcf.jsdelivr.net（次）→ VPS 自托管（兜底）
```

**来源**：星月 3.0.2 生产卡运行时源码 + IP 解析推断 | **适用版本**：2026-06 实测 | **置信度**：medium `[运行时源码]` + `[推断]`（官方无文档明确区分两者调度策略）

---

**避坑**：若用户 ISP 屏蔽 Cloudflare，testingcf 与 cdn.jsdelivr.net 的 CF 节点会**同时失败**。此时 VPS 自托管才是真正意义上的兜底源，三源设计的价值在此体现。

---

### 2.3 /+esm 端点行为

**核心结论**：`/+esm` 后缀告知 jsdelivr 对该 npm 包执行 Rollup 打包转 ESM，输出浏览器可直接 `import()` 的模块格式。

核心行为：
- 自动将 CommonJS 包转换为 ESM（解决 `require is not defined` 问题）
- 依赖链递归打包，传递依赖版本由目标包的 `package.json` 锁定（once built，永久存储）——esm.run 页面仅说"once built, stored in permanent storage"，依赖不随时间漂移为推断 `[推断]`
- **不支持 SRI**（动态打包，哈希不固定；所有打包文件注释头有官方警告：`Do NOT use SRI with dynamically generated files`）——此条生产卡可直接观察到
- 仅适用于 npm 包，GitHub 文件 URL 不接受 `/+esm` 后缀（esm.run 文档未提及 GitHub URL）

**来源**：[esm.run 官方介绍](https://www.jsdelivr.com/esm) `[文档·单源]`、星月 3.0.2 MVU bundle 注释头直接观察（SRI 警告）`[运行时源码]` | **适用版本**：现行 jsdelivr esm.run 服务 | **置信度**：high `[文档·单源]` + `[运行时源码]`（SRI 不支持双源印证；依赖锁定为推断，降为 medium·推导未验证）

---

## 3. SillyTavern 脚本执行上下文

### 3.1 TavernHelper 脚本类型与能力边界

**核心结论**：TavernHelper 扩展提供 `type: "script"` 类型脚本容器，在 ST 卡片的 `data.extensions.tavern_helper.scripts` 数组中定义，每项含 `type`、`enabled`、`name`、`id`、`content`（脚本正文）、`info`、`button`、`data`、`export_with` 等字段；核心执行字段为 `content`，`enabled` 控制是否激活。

**执行能力**：

| 能力 | 可用性 | 说明 |
|---|---|---|
| 顶层 `await` | 可用 | 脚本运行在 async 上下文 |
| `import()` 动态导入 | 可用 | 无需 `type="module"` 标签 |
| `window.*` / `document.*` | 可用 | 完整 DOM 访问 |
| `window.SillyTavern.*` | 可用 | 访问 ST 上下文 |
| `window.parent.*` | 可用 | 若在 iframe 中执行则访问父框架 |
| 脚本间通信 | 通过全局变量 | `window.XingyueWorldbookReady` 等 |

**来源**：星月 3.0.2 `data.extensions.tavern_helper.scripts[0-4].content` 直接提取 | **适用版本**：TavernHelper（ST v1.14.0 环境） | **置信度**：high `[运行时源码]`

---

### 3.2 世界书 Ready 信号模式

**核心结论**：多个同源卡通过约定的全局 Promise 变量协调世界书初始化顺序，标准轮询等待模式如下：

```javascript
// 跨同源卡通用：等待世界书初始化完成
const waitXingyueWorldbookReady = async () => {
  const started = Date.now();
  const getReadyPromise = () => (
    window.XingyueWorldbookReady ||
    window['星月WorldbookReady'] ||
    window['星月学院WorldbookReady'] ||
    window.CrossedZoneWorldbookReady ||
    window.FusionEraWorldbookReady
  );
  while (!getReadyPromise()?.then && Date.now() - started < 5000) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const ready = getReadyPromise();
  if (ready?.then) await ready;
  else await new Promise(resolve => setTimeout(resolve, 1000));
};

await waitXingyueWorldbookReady();
await new Promise(resolve => setTimeout(resolve, 250)); // 额外 250ms 缓冲
```

**设计要点**：
- 5000ms 超时兜底，避免无限轮询
- 50ms 轮询间隔，平衡响应速度与 CPU 占用
- `?.then` 检测确认为真 Promise 对象，非 truthy 值即取 1000ms 降级等待
- 250ms 额外缓冲应对世界书写入后的异步状态同步延迟

**来源**：`ST开发指南DB\本地证据\星月历史\3.0.2\星月私立高等学院 MVU 3.0.2.json` → `data.extensions.tavern_helper.scripts[1].content` | **适用版本**：星月 3.0.2 / 交错宙域同源卡 | **置信度**：high `[运行时源码]`

---

### 3.3 ST 的 CSP 与域限制

**核心结论**：SillyTavern v1.14.0 主动将 CSP 禁用（`server-main.js` 中 `app.use(helmet({ contentSecurityPolicy: false }))`），即服务端**不下发任何 Content-Security-Policy 响应头**给前端页面。因此 TavernHelper 脚本中的 `import()` CDN 调用不受 CSP 限制，仅受浏览器正常 CORS 策略管控。

**`whitelistImportDomains`（config.yaml）**：
- 控制范围：ST **服务端代理下载**卡片/资源文件的来源域白名单（在 `content-manager.js` 中的 `downloadGenericPng` 等路径执行）
- **不影响** TavernHelper 脚本中的 `import()` CDN 调用（那是浏览器端行为，完全绕过服务端代理）
- 本地 v1.14.0 `default/config.yaml` 实测默认允许域：`localhost`、`cdn.discordapp.com`、`files.catbox.moe`、`raw.githubusercontent.com`、**`char-archive.evulid.cc`**（草稿原版漏列最后一项）

**对 `import()` 动态导入的限制**：
- ST 服务端层面无额外限制（CSP 已禁用）
- 由浏览器同源策略管控，jsdelivr 开放 CORS，故 `import('https://cdn.jsdelivr.net/...')` 在 ST 上下文中**默认可用，无需配置**

**两类配置的区别**：

| 场景 | 相关配置 | 需要修改？ |
|---|---|---|
| `import('https://cdn.jsdelivr.net/...')` | 无，浏览器 CORS | 不需要 |
| 在 ST 界面下载 CDN 托管的卡文件 | `whitelistImportDomains` | 需添加 cdn.jsdelivr.net |
| 访问 ST API（本地开发/调试） | `listen.whitelistDomains` | 需添加 localhost/开发 IP |

**来源**：`SillyTavern-1.14.0/src/server-main.js` 第 94-96 行（CSP 禁用）`[运行时源码]`；`SillyTavern-1.14.0/src/endpoints/content-manager.js` 第 22/972 行（whitelistImportDomains 作用域）`[运行时源码]`；本地 `default/config.yaml` 默认值 `[运行时源码]` | **适用版本**：ST v1.14.0 | **置信度**：high `[运行时源码]`（三处源码交叉，CSP 禁用为直接观察）

---

## 4. 完整可用范式代码

### 4.1 三源 fallback git 挂载 loader

**核心结论**：这是星月 3.0.2 控制中心的生产实现，完整可施工。主体托管在 GitHub @main 分支，push 后 12 小时内热修生效，不回封卡。三源 fallback 确保网络异常时降级可用。

```javascript
// [卡名] 控制中心 — git 挂载 loader
// 主体托管在 GitHub @main，改完 push 即热修，不回封卡。
// 三源 fallback（cdn → testingcf → VPS）；都失败留可见提示，不 brick。
(() => {
  const SOURCES = [
    'https://cdn.jsdelivr.net/gh/UserName/repo@main/runtime/cardname/version/control-center.js',
    'https://testingcf.jsdelivr.net/gh/UserName/repo@main/runtime/cardname/version/control-center.js',
    'https://your-vps-ip.sslip.io/runtime/cardname/version/control-center.js',
  ];
  const ok = () => !!(window.YourCardNamespace); // 检查主体是否注册成功
  (async () => {
    for (const url of SOURCES) {
      try { await import(url); if (ok()) return; } catch (e) { /* 下一个源 */ }
    }
    if (!ok()) {
      console.error('[卡名控制中心] 远程主体加载失败（cdn+testingcf+VPS 均失败），请检查网络后刷新重试。');
    }
  })();
})();
```

**来源**：`ST开发指南DB\本地证据\星月历史\3.0.2\星月私立高等学院 MVU 3.0.2.json` → `data.extensions.tavern_helper.scripts[4].content` | **适用版本**：TavernHelper + 任意 GitHub 托管文件 | **置信度**：high `[运行时源码]`

---

### 4.2 双源 CDN 带 worldbook ready 等待

**核心结论**：加载 MVU bundle 等依赖世界书初始化完成的模块时，必须先等待 Ready 信号再发起 import，避免竞态条件。

```javascript
// 1. 先等世界书初始化完成（轮询 5s 超时，见 3.2 节完整实现）
await waitXingyueWorldbookReady();
await new Promise(resolve => setTimeout(resolve, 250)); // 额外缓冲

// 2. 双源加载 bundle
try {
  await import('https://cdn.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js');
} catch {
  try {
    await import('https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js');
  } catch (e) {
    console.error('[mvu_zod_global] 双源加载均失败，MVU 将不可用', e);
  }
}
```

**来源**：`ST开发指南DB\本地证据\星月历史\3.0.2\星月私立高等学院 MVU 3.0.2.json` → `data.extensions.tavern_helper.scripts[1].content` | **适用版本**：星月 3.0.2 MVU | **置信度**：high `[运行时源码]`

---

### 4.3 单文件工具导入带 fallback

**核心结论**：当只需要导入单个工具文件（非整体 bundle）时，使用解构赋值直接提取所需导出，fallback 结构更紧凑。

```javascript
let registerMvuSchema;
try {
  ({ registerMvuSchema } = await import(
    'https://cdn.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js'
  ));
} catch (error) {
  console.warn('[CardName] CDN primary import failed, fallback to testingcf:', error);
  ({ registerMvuSchema } = await import(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js'
  ));
}
```

**来源**：`ST开发指南DB\本地证据\星月历史\3.0.2\星月私立高等学院 MVU 3.0.2.json` → `data.extensions.tavern_helper.scripts[0].content` | **适用版本**：TavernHelper | **置信度**：high `[运行时源码]`

---

### 4.4 npm 包 ESM 离线 vendor 导入

**核心结论**：编译后的 Webpack bundle 开头通过 testingcf CDN 加载 npm vendor 库，直接使用 `/+esm` 端点转换 ESM 格式。

```javascript
// bundle 开头的 ESM vendor imports（Webpack 编译输出）
import { klona as e } from 'https://testingcf.jsdelivr.net/npm/klona/+esm';
import { createPinia as t, defineStore as n, getActivePinia as a, setActivePinia as s }
  from 'https://testingcf.jsdelivr.net/npm/pinia/+esm';
import { compare as r } from 'https://testingcf.jsdelivr.net/npm/compare-versions/+esm';
import { default as o } from 'https://testingcf.jsdelivr.net/npm/json5/+esm';
import { jsonrepair as i } from 'https://testingcf.jsdelivr.net/npm/jsonrepair/+esm';
import * as l from 'https://testingcf.jsdelivr.net/npm/mathjs/+esm';
```

**注意**：上述 URL 无版本锁定（取 latest），约 7 天缓存后可能跳版本。生产环境应锁版本（如 `/npm/pinia@2.3.0/+esm`），原型阶段可接受无版本写法。

**离线 vendor flat-no-blob 模式**：`MVU-Zod-offline-vendor-loader-r5.json` 将所有 vendor 库内联打包为单一 IIFE（content 字段 166,439 字符），不使用 `URL.createObjectURL + Blob` 注入方式，规避部分浏览器对 blob: URL 的 CSP 限制，代价是文件体积极大。

**来源**：`ST开发指南DB\本地证据\星月历史\3.0.2\MVU\manifest.json` line 1（Webpack bundle 编译输出） | **适用版本**：Webpack ESM bundle | **置信度**：high `[运行时源码]`

---

### 4.5 Claude Code launch.json 挂载 ST

**当前已知（medium）**：Claude Code Desktop 通过 `.claude/launch.json` 配置预览服务器，连接 ST 的参考配置如下（`cwd` 绝对路径兼容性未经真机验证，见悬案 7.6）：

```json
{
  "version": "0.0.1",
  "autoVerify": false,
  "configurations": [
    {
      "name": "SillyTavern",
      "program": "server.js",
      "port": 8000,
      "cwd": "C:/path/to/SillyTavern",
      "autoPort": false
    }
  ]
}
```
<!-- ⚠️ 注意：官方文档说 cwd 为相对路径（relative to project root），绝对路径在 Windows 的实际兼容性未经真机验证——见悬案 7.6。
     runtimeExecutable:"node" + runtimeArgs:["server.js"] 已替换为官方推荐的 program:"server.js" 写法。-->

**字段说明**：
- `autoPort: false`：强制使用固定 8000 端口（OAuth/CORS 白名单依赖，ST 场景必须设为 false）
- `autoVerify: false`：关闭自动截图验证（ST 卡调试无法自动验证）
- `cwd`：官方文档明确说是"**相对路径**（relative to your project root）"，不是绝对路径；示例写 Windows 绝对路径可能无法按预期工作，建议用相对路径或 `${workspaceFolder}` 占位符

> **注意**：官方文档推荐用 `program: "server.js"` 来直接运行 Node.js 脚本（而非 `runtimeExecutable: "node"` + `runtimeArgs: ["server.js"]`，后者是通过包管理器调用的形式）。两种写法均可能可用，但官方示例对应两种不同语义，ST 场景建议改为 `"program": "server.js"`。

**重要限制**：当前 Claude Code **不支持 `url` 字段**直连已运行的服务器（[Issue #29315](https://github.com/anthropics/claude-code/issues/29315) 处于 open 状态，无 PR）。变通方案：
- 通过 `program`/`runtimeExecutable` 让 Claude preview 启动新 ST 进程（会与已开启的 ST 实例冲突端口）
- 或改用 Claude-in-Chrome 扩展直接操作已开启的 ST 浏览器标签页

**来源**：[Claude Code Desktop docs](https://code.claude.com/docs/en/desktop)（Configure preview servers 节）`[文档·单源]`、[Issue #29315](https://github.com/anthropics/claude-code/issues/29315)（Issue，非文档）`[社区]` | **适用版本**：Claude Code Desktop 当前版本 | **置信度**：medium·单源孤证 `[文档·单源]`（launch.json schema 仅有一份官方文档，Issue 不算第二文档源；`cwd` 相对路径要求、`program` vs `runtimeExecutable` 推荐用法为文档明确说明）

---

## 5. 关键字段与 API 参考表

| 字段/API | 位置 | 说明 | 置信度 |
|---|---|---|---|
| `type: "script"` | TavernHelper 脚本 JSON | 脚本类型，支持 async/await + dynamic import | high `[运行时源码]` |
| `data.extensions.tavern_helper.scripts` | card v3 JSON | TH 脚本数组，每项含 type/enabled/name/id/content/info/button 等字段 | high `[运行时源码]` |
| `data.extensions.tavern_helper.variables` | card v3 JSON | TH 持久变量存储（如 `stat_data` 等持久化数据） | high `[运行时源码]` |
| `window.XingyueWorldbookReady` | 全局 Promise | 世界书初始化完成信号，TH 脚本间协调 | high `[运行时源码]` |
| `window.XingyueControlCenter` | 全局 namespace | 控制中心主体加载成功的检测标志 | high `[运行时源码]` |
| `window.Mvu` / `window.parent?.Mvu` | 全局 namespace | MVU bundle 加载成功后注册的命名空间 | high `[运行时源码]` |
| `whitelistImportDomains` | ST config.yaml | ST 服务端代理下载域白名单（不影响 import() CDN） | high `[运行时源码]` |
| `launch.json configurations[].port` | `.claude/launch.json` | Claude preview 对接 ST 端口（默认 3000，非 8000） | medium·单源孤证 `[文档·单源]` |
| `launch.json configurations[].autoPort` | `.claude/launch.json` | false = 强制固定端口，ST 场景必须设为 false | medium·单源孤证 `[文档·单源]` |
| `/+esm` URL 后缀 | jsdelivr npm URL | 触发 Rollup 打包转 ESM，不支持 SRI | high `[文档·单源]` + `[运行时源码]` |
| `@main` 分支缓存 TTL | jsdelivr CDN | 12 小时自动更新 | high `[文档·单源]` + `[社区]` |
| `@<semver-exact>` 缓存 TTL | jsdelivr CDN | 永久，不可改内容 | high `[文档·单源]` + `[社区]` |

---

## 6. 高频避坑

**6.1 @main 分支 12 小时缓存陷阱**

push 后不会立即生效，CDN 最多 12 小时才同步新内容。生产热修需要即时生效时，可用 jsDelivr Purge API（需提前申请权限）。版本 tag 一旦 push 即永久固化，连 purge 都无法改内容，只能发新 tag。

来源：[jsdelivr README](https://cdn.jsdelivr.net/gh/jsdelivr/jsdelivr@master/README.md) `[文档·单源]`、[Issue #18532](https://github.com/jsdelivr/jsdelivr/issues/18532) `[社区]` | **置信度**：high `[文档·单源]` + `[社区]`（同 2.1 节缓存表来源，README 为直接依据）

---

**6.2 testingcf 仅走 Cloudflare 节点——双失效陷阱**

若用户 ISP 屏蔽 Cloudflare，`testingcf.jsdelivr.net` 与 `cdn.jsdelivr.net` 的 Cloudflare 节点会**同时失败**，两源形同一源。VPS 自托管是真正意义上的独立兜底，三源设计的价值正在于此。

来源：IP 解析推断 + 网络拓扑分析 | **置信度**：medium `[推断]`

---

**6.3 无版本号 /+esm URL 的最新版漂移**

`/npm/pinia/+esm` 取的是 npm latest，CDN 缓存约 7 天，缓存过期后会跳到最新版本。若依赖 API 稳定的库（pinia、mathjs、zod 等），**应显式锁版本**：
```
/npm/pinia@2.3.0/+esm    ← 推荐：生产锁版本
/npm/pinia/+esm           ← 不推荐：生产环境有漂移风险
```

来源：[jsDelivr README](https://cdn.jsdelivr.net/gh/jsdelivr/jsdelivr@master/README.md)（无版本 = latest，7 天 TTL）`[文档·单源]` | **置信度**：high `[文档·单源]`（7 天上限来自 CDN README，esm.run 页面未提；但与 2.1 节缓存表相互印证，结论可信）

---

**6.4 SRI 与 /+esm 不兼容**

jsdelivr 动态生成的 ESM 打包文件哈希不固定，`integrity` 属性无法使用。所有打包文件注释头有官方警告：

```
/* Do NOT use SRI with dynamically generated files! More information: ... */
```

来源：星月 3.0.2 MVU bundle 文件头注释（`Do NOT use SRI with dynamically generated files`）`[运行时源码]`、[esm.run 官方页](https://www.jsdelivr.com/esm) `[文档·单源]` | **置信度**：high `[运行时源码]` + `[文档·单源]`（双源交叉，可直接施工）

---

**6.5 whitelistImportDomains 不控制 script 加载域**

`config.yaml` 中的 `whitelistImportDomains` 字段**仅**影响 ST **服务端代理下载**卡片/资源文件时的来源域白名单（`src/endpoints/content-manager.js` 第 972 行有明确错误信息），不影响 TavernHelper 脚本内 `import()` 调用的 CDN 域。此外，ST v1.14.0 服务端主动禁用 CSP（`helmet({ contentSecurityPolicy: false })`），`import('https://cdn.jsdelivr.net/...')` 在 ST 上下文中默认可用，无需在 config.yaml 添加任何条目。

两者混淆是常见误判，会导致错误地修改 config.yaml 或错误地认为 CDN import 需要配置才能工作。

来源：`SillyTavern-1.14.0/src/endpoints/content-manager.js` 直接读取 `[运行时源码]`；`SillyTavern-1.14.0/src/server-main.js` helmet 配置 `[运行时源码]` | **置信度**：high `[运行时源码]`

---

**6.6 Claude Code preview 不支持连接已运行服务器**

`launch.json` 目前无 `url` 字段支持，只能通过 `runtimeExecutable` 启动新进程。挂载已运行的 ST 实例时，preview 会尝试在同端口启动新 ST 进程，与现有 ST 会话产生端口冲突。

当前推荐路径：改用 Claude-in-Chrome 扩展直接操作已开启的 ST 浏览器标签页，或等待 [Issue #29315](https://github.com/anthropics/claude-code/issues/29315) 合并。

来源：[Claude Code Desktop docs](https://code.claude.com/docs/en/desktop) `[文档·单源]`；[Issue #29315](https://github.com/anthropics/claude-code/issues/29315) `[社区]`（open，无 PR） | **置信度**：medium·单源孤证 `[文档·单源]`（`url` 字段缺失为文档观察，Issue 验证 feature request 仍 open）

---

**6.7 manifest.json 是 JS bundle，非标准 JSON**

`MVU/manifest.json` 文件名具有误导性，其内容是原始 Webpack 打包输出的 JS bundle 文本（以 `import{...}` 开头），通过 TavernHelper 的 script runner 执行。它**不是**标准 JSON 世界书条目。若按 JSON 格式尝试解析会直接报错。

来源：`ST开发指南DB\本地证据\星月历史\3.0.2\MVU\manifest.json` line 1 直接观察 | **置信度**：high `[运行时源码]`

---

**6.8 flat-no-blob 离线 vendor 的体积代价**

`MVU-Zod-offline-vendor-loader-r5.json` 使用"flat no-blob build"策略：将所有 vendor 库内联为单一 IIFE，不通过 `URL.createObjectURL + Blob` 注入。优点是规避部分浏览器对 blob: URL 的 CSP 限制；代价是 `content` 字段高达 **166,439 字符**，会显著增加卡文件体积。在网络条件允许时，CDN 动态加载方案（4.2 节）是更优选择。

来源：`ST开发指南DB\本地证据\星月历史\3.0.2\MVU-Zod-offline-vendor-loader-r5.json` 直接测量 | **置信度**：high `[运行时源码]`

---

## 7. 悬案：未决项与验证路径

**7.1 testingcf 与 cdn.jsdelivr.net CF 节点是否完全等同**

**问题**：testingcf 和 cdn.jsdelivr.net 的 Cloudflare 节点在流量调度、速率限制、服务协议上是否完全等同？官方无文档明确区分。

**当前认知**：基于 IP 解析推断两者均走 Cloudflare anycast，但是否共享同一速率限制桶未知。

**验证路径**：在不同 ISP 环境下 `curl -o /dev/null -s -w "%{time_total}" <url>` 对比两域名延迟；对比 `traceroute` 路径；观察高并发时两域名是否同步限速。

**置信度**：low `[推断]` | **禁止施工**：不可基于此推断设计依赖两者独立性的方案

---

**7.2 TavernHelper 脚本的确切执行时机**

**问题**：TH 脚本是在楼层渲染时执行、ST 初始化时执行，还是其他时机？当前通过 `waitXingyueWorldbookReady` 轮询处理竞态，但 TavernHelper 内部调度顺序无官方文档。

**当前认知**：生产卡通过 5000ms 超时轮询 + 250ms 缓冲规避竞态，在星月 3.0.2 上验证可用，但根因仍是 workaround 而非理解内部机制。

**验证路径**：在 ST 中的 TH 脚本加 `console.log(Date.now(), 'script start')` 打时间戳，与 `APP_READY` / `CHAT_CHANGED` 等 ST 事件时间戳对比，确定相对顺序。

**置信度**：medium `[运行时源码]`（现象已知，机制未知）

---

**7.3 无版本 /+esm URL 的精确更新周期**

**问题**：CDN cache 7 天后拉取新版，但 jsdelivr 内部何时轮询 npm latest 版本？若包每天发新版，CDN 最多延迟多久？

**当前认知**：官方文档仅说"7 days with purge option"，未给出 latest 拉取频率或内部队列机制。

**验证路径**：发布一个测试 npm 包，在 jsdelivr CDN 上追踪无版本 URL 的版本切换时间，记录从 npm 发版到 CDN 同步的实际延迟。

**置信度**：medium `[文档·单源]`（已知 7 天上限，精确延迟未知）

---

**7.4 多脚本重复 import 同一 URL 的去重行为**

**问题**：多个 TH 脚本可能重复 `import()` 同一 CDN URL（如 bundle.js）。浏览器模块系统应基于 URL 去重，但 TavernHelper 是否在独立 iframe 中执行脚本？若是，每个 iframe 有独立模块缓存，会导致重复网络请求。

**当前认知**：通过 `window.*` 全局变量检测（`if (ok()) return`）防止重复执行副作用，但并不能防止重复网络请求。

**验证路径**：在 ST Network 面板观察同一 bundle URL 的请求次数；使用 `import.meta` 检查脚本执行环境是否为独立 iframe。

**置信度**：medium `[推断]`

---

**7.6 launch.json `cwd` 绝对路径在 Windows 的实际行为**

**问题**：官方文档说 `cwd` 是"relative to your project root"（相对路径），但 ST 场景需要指向 ST 根目录（可能不在项目根下）。Windows 绝对路径（`C:/path/to/SillyTavern`）是否被 Claude preview 接受并正常工作？

**当前认知**：文档说明相对路径，但未明确禁止绝对路径。实际行为未经真机验证。

**验证路径**：在 `.claude/launch.json` 中分别用相对路径和绝对路径，观察 Claude preview 能否正确启动 ST 进程；同时测试 `${workspaceFolder}` 是否在 ST 挂载场景下可用。

**置信度**：low `[推断]` | **禁止施工**：不可直接照搬绝对路径写法而不做本地测试

---

**7.5 离线 vendor 与在线 bundle 共存的符号冲突风险**

**问题**：若 `MVU-Zod-offline-vendor-loader-r5.json`（内联 pinia）和 `manifest.json`（从 CDN 导入 pinia）同时激活，会否产生两份 pinia 实例、导致状态管理错乱？

**当前认知**：flat-no-blob 构建将 pinia 封装在 IIFE 作用域内，未注册到 `window.pinia`，理论上不与 CDN 版本冲突，但两份实例共存时 `getActivePinia()` 的行为未经测试。

**验证路径**：同时加载两者，在 ST console 中执行 `window.Mvu?.pinia === window.otherPinia` 类似检查；观察 pinia store 读写是否互相可见。

**置信度**：medium `[推断]`（存在风险，未量化）

---

## 附录：本地文件路径索引

| 路径 | 内容描述 |
|---|---|
| `ST开发指南DB\本地证据\星月历史\3.0.2\星月私立高等学院 MVU 3.0.2.json` | 主卡，含 TH scripts（git loader、CDN fallback、worldbook ready 等待） |
| `ST开发指南DB\本地证据\星月历史\3.0.2\MVU\manifest.json` | Webpack bundle（文件名误导性，实为 JS），开头有 testingcf CDN ESM imports |
| `ST开发指南DB\本地证据\星月历史\3.0.2\MVU-Zod-offline-vendor-loader-r5.json` | 离线 vendor（flat-no-blob IIFE，content 字段 166,439 字符） |
| `ST开发指南DB\本地证据\星月历史\3.0.2\MVU\compare-versions.json` | jsDelivr 打包的单个 npm 包 ESM 源码示例 |

---

## 参考来源

- [jsDelivr 官方 README](https://cdn.jsdelivr.net/gh/jsdelivr/jsdelivr@master/README.md)
- [jsDelivr esm.run 介绍](https://www.jsdelivr.com/esm)
- [jsDelivr GitHub URL 文档](https://www.jsdelivr.com/?docs=gh)
- [Issue #18532：major version pinning 缓存问题](https://github.com/jsdelivr/jsdelivr/issues/18532)
- [Issue #18263：esm.run 功能介绍](https://github.com/jsdelivr/jsdelivr/issues/18263)
- [Claude Code Desktop 文档（launch.json schema）](https://code.claude.com/docs/en/desktop)
- [Issue #29315：launch.json url 字段 feature request](https://github.com/anthropics/claude-code/issues/29315)
- [SillyTavern config.yaml 默认配置](https://github.com/SillyTavern/SillyTavern/blob/release/default/config.yaml)
- [SillyTavern Extensions API 文档](https://docs.sillytavern.app/for-contributors/writing-extensions/)
- [SillyTavern config.yaml 文档](https://docs.sillytavern.app/administration/config-yaml/)
- 星月私立高等学院 3.0.2 生产卡（本地验证运行，最高可信度参考）
