# TavernWeave

TavernWeave 是一套面向 Codex 与 Claude Code 的 SillyTavern 工程 Skill 阵列，覆盖角色卡设计、MVU 变量系统、模块化源码、组件级更新、UI 扩展工程、正则与渲染验证、安全审计、结构化数据应用、大卡性能、音频与 Live2D 生命周期、构建发布、API 查证、真实运行时调试、嵌入式 UI、创意工坊运维与代码质量控制。

> TavernWeave 原创内容采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许非商业使用、修改和分发；未经版权方另行授权，原版、修改版及再分发版本均不得用于商业目的。分发时须保留许可证和版权声明。第三方内容仍适用其[各自的许可证](THIRD_PARTY_NOTICES.md)。

## Skill 阵列

| Skill | 主要职责 |
| --- | --- |
| `tavern-card-builder` | 识别角色卡类型与运行依赖，设计文字卡、MVU 变量卡与独立自定义 CoT，处理 CoT 模块编写、预设/卡片/世界书拼接与路由、Token 去重、schema、初始化、双更新模式和开局协议 |
| `sillytavern-card-components` | 无损拆卡、组件边界、封装/宿主/远程依赖声明、registry/recipe 与往返一致性 |
| `sillytavern-component-update` | 在组件制品与整卡封装之间显式选模式；单独生成可导入的角色卡正则、酒馆助手脚本或脚本文件夹，并把整卡请求交给既有 pipeline |
| `sillytavern-render-regex-pipeline` | 用可复跑 fixture 检查正则结构、作用来源、显示/提示词目的地、深度和替换阶段，并保留真实酒馆验收门 |
| `sillytavern-rolecard-security` | 只读扫描角色卡 HTML、正则、助手脚本和远程加载器的注入、动态执行、凭据形状、跨帧通信与权限风险 |
| `sillytavern-database-rolecards` | 校验卡内表结构、消息楼层/MVU 存储、字段绑定和幂等迁移；首批只支持正常多楼层路线 |
| `sillytavern-extension-dev` | 生成最小 UI 扩展脚手架，校验 manifest、入口、生命周期 hook、能力快照与版本门；默认不安装、不重载宿主 |
| `sillytavern-rolecard-performance` | 脱敏测量整卡、提示词、世界书、正则、助手脚本和内嵌媒体预算，并把静态指标与真实运行时采样分开验收 |
| `sillytavern-media-live2d-runtime` | 校验音频、图像、视频、多模态和 Live2D 资产清单、哈希、预加载、provider、fallback 与清理绑定 |
| `sillytavern-card-pipeline` | 执行依赖预检，驱动项目实时编译，并从维护源码组装、验证、打包 JSON/PNG，锁定必需脚本、正则和随附世界书 |
| `sillytavern-api-reference` | 查证 SillyTavern、Tavern Helper、宿主能力、远程加载器、STScript、EJS、宏和 MVU 的版本敏感 API |
| `sillytavern-runtime-debug` | 在真实 SillyTavern 中验证宿主/封装/远程/地区依赖并检查 iframe、控制台、DOM、样式、数据和生命周期 |
| `sillytavern-embedded-ui` | 设计或审查开局页、状态栏、控制中心、抽屉和弹窗 |
| `code-quality-workflow` | 统一执行代码审计、重构门控、最小修复、优化与回归验证 |
| `shadcn-tailwind-ui` | 使用 React、shadcn/ui、Radix 和 Tailwind 构建可访问产品界面 |
| `rolecard-workshop-ops` | 诊断与运维可配置的角色卡工坊发布链，同时保护生产坐标和凭据 |

## 安装

把仓库链接交给 Codex 或 Claude Code，并让 Agent 安装、启用 TavernWeave：

```text
请安装并启用这个 Skill 仓库：
https://github.com/LiarMTTT/TavernWeave
```

Agent 会根据当前环境选择 Codex 或 Claude Code 的安装入口。安装完成后，新建任务或会话再使用 Skill。

## 更新

```text
请把已安装的 TavernWeave 更新到这个仓库的最新版本：
https://github.com/LiarMTTT/TavernWeave
```
