# ST 数据目录与部署运维参考手册

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

> 面向角色卡开发与服务器运维的可检索参考文档
> 收集日期：2026-06-28 ｜ 交叉验证跨 15+ 个独立来源（官方文档 + GitHub 源码 + DeepWiki）

---

## 目录

0. [置信度分级体系（全手册适用）](#0-置信度分级体系全手册适用)
1. [机制总览](#1-机制总览)
2. [data/ 目录完整结构](#2-data-目录完整结构)
   - 2.1 [顶层目录树（源码实证）](#21-顶层目录树源码实证)
   - 2.2 [多用户模式下的目录扩展](#22-多用户模式下的目录扩展)
   - 2.3 [不需要备份的目录](#23-不需要备份的目录)
3. [config.yaml 完整字段参考](#3-configyaml-完整字段参考)
   - 3.1 [网络与监听](#31-网络与监听)
   - 3.2 [安全与 IP 白名单](#32-安全与-ip-白名单)
   - 3.3 [认证与会话](#33-认证与会话)
   - 3.4 [数据存储](#34-数据存储)
   - 3.5 [SSL/TLS](#35-ssltls)
   - 3.6 [备份](#36-备份)
   - 3.7 [性能与缓存](#37-性能与缓存)
   - 3.8 [缩略图](#38-缩略图)
   - 3.9 [扩展与插件](#39-扩展与插件)
   - 3.10 [日志、CORS、速率限制](#310-日志cors速率限制)
   - 3.11 [环境变量覆盖规则](#311-环境变量覆盖规则)
4. [Docker 部署完整范式](#4-docker-部署完整范式)
   - 4.1 [官方 docker-compose.yml](#41-官方-docker-composeyml)
   - 4.2 [路径映射表](#42-路径映射表)
   - 4.3 [非 root 用户运行](#43-非-root-用户运行)
   - 4.4 [更新流程](#44-更新流程)
   - 4.5 [Healthcheck 原理](#45-healthcheck-原理)
   - 4.6 [SELinux 环境挂载](#46-selinux-环境挂载)
   - 4.7 [IP 白名单陷阱（Linux Docker CE）](#47-ip-白名单陷阱linux-docker-ce)
5. [安装、分支与更新](#5-安装分支与更新)
   - 5.1 [Node.js 版本要求](#51-nodejs-版本要求)
   - 5.2 [分支策略](#52-分支策略)
   - 5.3 [更新升级命令](#53-更新升级命令)
6. [v1.12.0 迁移：旧路径 vs 新路径](#6-v1120-迁移旧路径-vs-新路径)
7. [多用户账户系统](#7-多用户账户系统)
   - 7.1 [启用方式](#71-启用方式)
   - 7.2 [用户角色](#72-用户角色)
   - 7.3 [Handle 规范](#73-handle-规范)
   - 7.4 [密码安全与限制](#74-密码安全与限制)
   - 7.5 [密码恢复](#75-密码恢复)
   - 7.6 [登录行为](#76-登录行为)
   - 7.7 [SSO 高级集成](#77-sso-高级集成)
8. [关键文件格式规范](#8-关键文件格式规范)
   - 8.1 [角色卡格式（PNG + tEXt chunk）](#81-角色卡格式png--text-chunk)
   - 8.2 [聊天记录格式（JSONL）](#82-聊天记录格式jsonl)
   - 8.3 [World Info（Lorebook）格式](#83-world-infolorebook-格式)
   - 8.4 [settings.json 结构概要](#84-settingsjson-结构概要)
   - 8.5 [默认内容脚手架](#85-默认内容脚手架)
9. [网络访问与安全](#9-网络访问与安全)
   - 9.1 [开放外网访问最小配置](#91-开放外网访问最小配置)
   - 9.2 [Cloudflare/Tailscale 推荐范式](#92-cloudflaretailscale-推荐范式)
   - 9.3 [反向代理（Nginx）关键注意点](#93-反向代理nginx关键注意点)
10. [备份与迁移操作规范](#10-备份与迁移操作规范)
    - 10.1 [完整手动备份清单](#101-完整手动备份清单)
    - 10.2 [Docker 完整备份](#102-docker-完整备份)
    - 10.3 [自动备份机制](#103-自动备份机制)
11. [高频避坑速查](#11-高频避坑速查)
12. [悬而未决：需真机验证的问题](#12-悬而未决需真机验证的问题)

---

## 0. 置信度分级体系（全手册适用）

> **收集日期统一声明**：本手册全部条目收集于 **2026-06-28**，交叉验证跨 15+ 个独立来源。回源核实基于 SillyTavern **v1.14.0** 运行时源码（`src/constants.js`、`src/users.js`、`src/healthcheck.js` 等）；手册中的字段/路径为采集时快照，行为与 v1.14.0 一致，但具体行号可能在后续版本漂移。

每条结论采用 **置信度等级 + 依据类型** 双轴标注。

### 置信度三级

| 级别 | 含义 | 判定标准 |
|---|---|---|
| **high** | 已坐实，可直接施工 | 有运行时证据（真机实测 / 读到运行时实现源码 / 生产卡验证）；结论是源码/文档的直接事实而非下游推导；不在悬案清单 |
| **medium** | 待验证，施工前须实测 | 强制二选一子标签：`medium·单源孤证`（单一来源、无第二源、无实测）/ `medium·推导未验证`（源码或逻辑推导成立但未跑通，须随附真机验证路径）|
| **low** | 孤证无源，禁止据此施工 | 零来源猜测 / 纯历史快照（须标年份 + 窄缩适用范围）|

### 依据类型标签（与置信度正交，强制标注）

`[运行时源码]`、`[真机]`、`[文档·多源]`、`[文档·单源]`、`[社区]`、`[推断]`、`[历史孤证:年份]`、`[无源·待考]`

### 两条铁规

1. **源码内部事实可标 high `[运行时源码]`，但跨步推导的运行时行为最高只能 `medium·推导未验证`**，除非已真机验证。
2. **节级标注 = 节内条目下确界**——禁止整节标 high 却内含悬案条目；冲突即在节内局部降级。正文断言凡命中悬案章（本手册第 12 章 U 系列）的，置信度不得高于该悬案对应级别，并交叉引用。

---

## 1. 机制总览

**核心结论**：SillyTavern 是 Node.js LLM 前端。v1.12.0 起将用户数据从 `/public` 目录迁移到独立的可配置 `data/` 目录，实现数据与服务器代码完全解耦，支持 Docker 卷挂载和多用户隔离。核心配置通过 `config.yaml` 管理，支持环境变量 `SILLYTAVERN_*` 前缀覆盖。

| 属性 | 说明 |
|---|---|
| 数据根目录 | `data/`（相对路径基准为 ST 安装目录，可通过 `dataRoot` 修改） |
| 单用户目录 | `data/default-user/`（handle 固定为 `"default-user"`） |
| 核心配置文件 | `config.yaml`（ST 安装根目录，不在 `data/` 内） |
| 运行时 | Node.js 20+，npm 管理依赖 |
| 进程启动 | `node server.js` 或通过 `Start.bat` / `start.sh` 封装启动 |

来源：docs.sillytavern.app + github.com/SillyTavern/SillyTavern/blob/release/src/constants.js ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]` `[运行时源码]`

---

## 2. data/ 目录完整结构

### 2.1 顶层目录树（源码实证）

来源：`src/constants.js` 中 `USER_DIRECTORY_TEMPLATE` 常量 + DeepWiki 数据管理章节

```
data/
├── default-user/                 ← 单用户模式唯一用户目录（handle = "default-user"）
│   ├── settings.json             ← 用户偏好设置（power_user 对象，debounce 1000ms 保存）
│   ├── secrets.json              ← API 密钥（明文存储，通过 readSecret/writeSecret 读写）
│   ├── content.log               ← 记录哪些默认内容已被复制到该用户目录
│   ├── characters/               ← 角色卡 PNG（含 tEXt chunk 嵌入 JSON）
│   │   └── {character_name}/     ← 同名子目录，存 expressions/精灵图等资产
│   ├── chats/                    ← 聊天记录，每角色一个子目录，.jsonl 文件
│   ├── worlds/                   ← World Info/Lorebook，.json 格式
│   ├── groups/                   ← 群组定义文件
│   ├── group chats/              ← 群聊记录（注意含空格）
│   ├── backgrounds/              ← 背景图片
│   ├── User Avatars/             ← 用户头像（注意含空格）
│   ├── user/                     ← 用户上传文件根
│   │   ├── images/               ← 上传图片
│   │   ├── files/                ← Data Bank 附件
│   │   └── workflows/            ← ComfyUI 工作流
│   ├── thumbnails/               ← 缩略图缓存（重启可重建，无需备份）
│   │   ├── bg/
│   │   ├── avatar/
│   │   └── persona/
│   ├── NovelAI Settings/         ← NovelAI 预设 .json
│   ├── KoboldAI Settings/        ← KoboldAI 预设
│   ├── OpenAI Settings/          ← OpenAI/ChatCompletion 预设
│   ├── TextGen Settings/         ← TextGen(ooba) 预设
│   ├── themes/                   ← UI 主题 .json
│   ├── movingUI/                 ← 可拖拽 UI 布局保存
│   ├── instruct/                 ← Instruct 模板
│   ├── context/                  ← Context 模板
│   ├── sysprompt/                ← System Prompt 预设
│   ├── reasoning/                ← 推理模板
│   ├── QuickReplies/             ← 快捷回复
│   ├── assets/                   ← 资产文件
│   ├── extensions/               ← 用户级 UI 扩展（仅自己可见）
│   ├── vectors/                  ← Data Bank RAG 向量嵌入（Vectra JSON 格式）
│   └── backups/                  ← 聊天自动备份（按 maxTotalBackups 轮转）
│
├── _cache/                       ← 服务器全局缓存（非用户专属）
│   └── characters/               ← 角色卡磁盘缓存（useDiskCache=true 时启用）
├── _css/                         ← 自定义 CSS（user.css）
├── _errors/                      ← 错误页面 HTML（whitelist/unauthorized 等）
├── _storage/                     ← 多用户账户数据（node-persist，禁止手动编辑）
├── _uploads/                     ← 临时上传目录（每次启动清空）
├── _webpack/                     ← 编译资产缓存（可重建）
├── access.log                    ← HTTP 请求日志（enableAccessLog=true 时写入）
├── heartbeat.json                ← Docker healthcheck 心跳文件
└── cookie-secret.txt             ← Cookie 签名密钥（自动生成，勿手动修改）
```

**避坑**：`group chats/` 和 `User Avatars/` 目录名含空格，shell 脚本操作须用引号包裹。

来源：github.com/SillyTavern/SillyTavern/blob/release/src/constants.js (`USER_DIRECTORY_TEMPLATE`) + DeepWiki 数据管理章节 ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[运行时源码]`

### 2.2 多用户模式下的目录扩展

启用 `enableUserAccounts: true` 后，每个用户拥有独立的同构目录：

```
data/
├── default-user/       ← 永不删除，作为无账户模式 fallback admin
├── alice/              ← 用户 handle（小写字母 + 数字 + 破折号）
├── bob-123/
└── _storage/           ← 所有账户元信息（node-persist，禁止手动编辑）
```

来源：docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 2.3 不需要备份的目录

| 目录 | 原因 |
|---|---|
| `thumbnails/` | 重启自动重建 |
| `_cache/` | 重启自动重建 |
| `_uploads/` | 每次启动自动清空 |
| `_webpack/` | 构建产物，可重建 |

来源：docs.sillytavern.app + 社区实践 ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

---

## 3. config.yaml 完整字段参考

来源：docs.sillytavern.app/administration/config-yaml/ + github.com/SillyTavern/SillyTavern/blob/release/default/config.yaml + 本地 v1.14.0 `default/config.yaml` 直读 ｜ 适用版本：v1.12.0+ ｜ 置信度：**节级 medium·推导未验证** `[文档·多源]` `[运行时源码]`（本节含多个字段在 v1.14.0 中不存在，属后续版本新增；节内各子节单独标注；原节级 high 与实际内容不符，降级）

### 3.1 网络与监听

| 字段 | 默认值 | 说明 |
|---|---|---|
| `port` | `8000` | 监听端口（1-65535） |
| `listen` | `false` | 是否接受非本机连接（`true` 才能外网访问） |
| `protocol.ipv4` | `true` | 启用 IPv4 |
| `protocol.ipv6` | `false` | 启用 IPv6 |
| `listenAddress.ipv4` | `0.0.0.0` | 绑定 IPv4 地址 |
| `listenAddress.ipv6` | `[::]` | 绑定 IPv6 地址 |
| `enableKeepAlive` | — | HTTP keep-alive（**v1.14.0 不存在此字段**，为后续版本新增）|
| `heartbeatInterval` | — | Docker healthcheck 心跳间隔（**v1.14.0 不存在此字段**，为后续版本新增）|

### 3.2 安全与 IP 白名单

| 字段 | 默认值 | 说明 |
|---|---|---|
| `whitelistMode` | `true` | 启用 IP 白名单 |
| `whitelist` | `["::1","127.0.0.1"]` | 允许的 IP 列表，支持 CIDR |
| `enableForwardedWhitelist` | `true` | 检查 X-Real-IP/X-Forwarded-For（反向代理用）|
| `whitelistDockerHosts` | `true` | 自动白名单 Docker 宿主机 IP |
| `disableCsrfProtection` | `false` | 禁用 CSRF（不推荐）|
| `securityOverride` | `false` | 跳过开放监听但无认证的安全警告 |

### 3.3 认证与会话

| 字段 | 默认值 | 说明 |
|---|---|---|
| `basicAuthMode` | `false` | 启用 HTTP Basic Auth |
| `basicAuthUser.username` | `"user"` | Basic Auth 用户名 |
| `basicAuthUser.password` | `"password"` | Basic Auth 密码 |
| `enableUserAccounts` | `false` | 启用多用户模式 |
| `enableDiscreetLogin` | `false` | 隐藏登录页用户列表（需手动输入 handle）|
| `sessionTimeout` | `-1` | 会话超时秒数（-1=禁用，0=关闭浏览器即过期，>0=定时）|
| `perUserBasicAuth` | `false` | 用账户密码作为 Basic Auth 凭证 |

### 3.4 数据存储

| 字段 | 默认值 | 说明 |
|---|---|---|
| `dataRoot` | `./data` | 用户数据根目录（绝对或完整相对路径，**不支持 `~`**）|
| `skipContentCheck` | `false` | 跳过默认内容检查/同步 |

**避坑**：`dataRoot` 不支持 shell 展开（`~`、`$HOME` 等），必须写完整路径。

### 3.5 SSL/TLS

| 字段 | 默认值 | 说明 |
|---|---|---|
| `ssl.enabled` | `false` | 启用 HTTPS |
| `ssl.keyPath` | `./certs/privkey.pem` | 私钥路径 |
| `ssl.certPath` | `./certs/cert.pem` | 证书路径 |
| `ssl.keyPassphrase` | `""` | 私钥密码 |

### 3.6 备份

| 字段 | 默认值 | 说明 |
|---|---|---|
| `backups.common.numberOfBackups` | `50` | 备份保留数量 |
| `backups.chat.enabled` | `true` | 启用聊天自动备份 |
| `backups.chat.checkIntegrity` | `true` | 保存前校验聊天文件完整性 |
| `backups.chat.throttleInterval` | `10000` | 备份节流间隔（毫秒）|
| `backups.chat.maxTotalBackups` | `-1` | 最大备份总数（-1=不限）|
| `backups.allowFullDataBackup` | — | **v1.14.0 不存在此字段**，为后续版本新增 |

### 3.7 性能与缓存

| 字段 | 默认值 | 说明 |
|---|---|---|
| `performance.lazyLoadCharacters` | `false` | 懒加载角色列表（v1.14.0 源码实测默认值为 `false`，非 `true`）[运行时源码] |
| `performance.useDiskCache` | `true` | 磁盘缓存角色卡（→ `data/_cache/characters`）|
| `performance.memoryCacheCapacity` | `100mb` | 内存缓存上限 |
| `performance.requestCompression.*` | — | **v1.14.0 不存在此字段组**，为后续版本新增 |

### 3.8 缩略图

| 字段 | 默认值 | 说明 |
|---|---|---|
| `thumbnails.enabled` | `true` | 启用缩略图生成 |
| `thumbnails.quality` | `95` | JPEG 质量（0-100）|
| `thumbnails.format` | `jpg` | 缩略图格式 |
| `thumbnails.dimensions.bg` | `[160,90]` | 背景缩略图尺寸（宽×高）|
| `thumbnails.dimensions.avatar` | `[96,144]` | 头像缩略图尺寸 |
| `thumbnails.dimensions.persona` | `[96,144]` | Persona 缩略图尺寸 |

### 3.9 扩展与插件

| 字段 | 默认值 | 说明 |
|---|---|---|
| `extensions.enabled` | `true` | 启用 UI 扩展 |
| `extensions.autoUpdate` | `true` | 自动更新扩展 |
| `extensions.models.autoDownload` | `true` | 自动下载 HF 模型 |
| `enableServerPlugins` | `false` | 启用服务端插件 |
| `enableServerPluginsAutoUpdate` | `true` | 自动更新服务端插件 |

### 3.10 日志、CORS、速率限制

| 字段 | 默认值 | 说明 |
|---|---|---|
| `logging.minLogLevel` | `0` | 日志级别（0=DEBUG, 3=ERROR）|
| `logging.enableAccessLog` | `true` | 写 HTTP 访问日志（→ `data/access.log`）|
| `enableCorsProxy` | `false` | 启用 CORS 代理中间件（v1.14.0 实际字段名为 `enableCorsProxy`，**不是** `cors.enabled`/`cors.origin` 嵌套结构，该嵌套结构为后续版本）`[运行时源码]` |
| `rateLimiting.preferRealIpHeader` | `false` | 使用 X-Real-IP 进行限速（v1.14.0 仅此一个子字段）|
| `rateLimiting.accountsLoginMaxAttempts` | — | **v1.14.0 不存在此字段**，为后续版本新增 |
| `rateLimiting.basicAuthMaxAttempts` | — | **v1.14.0 不存在此字段**，为后续版本新增 |

**避坑**：`enableCorsProxy: true` 会开放 CORS 代理，仅在必要扩展明确要求时开启（SSRF 风险）。

### 3.11 环境变量覆盖规则

```bash
# 格式：SILLYTAVERN_ + 大写字段名（嵌套用 _ 分隔）
SILLYTAVERN_DATAROOT=/custom/data
SILLYTAVERN_PORT=9000
SILLYTAVERN_ENABLEUSERACCOUNTS=true
# SILLYTAVERN_HEARTBEATINTERVAL=30  ← 仅适用于 v1.14.0 后的版本，该字段在 v1.14.0 中不存在
```

优先级从高到低：**命令行参数 > 环境变量 > config.yaml > 硬编码默认值**

来源：docs.sillytavern.app/administration/config-yaml/ + 本地 v1.14.0 `default/config.yaml` 直读 ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·推导未验证 `[文档·多源]` `[运行时源码]`（3.10 节 cors/rateLimiting 字段在 v1.14.0 中与文档描述不符，已在行内修正；此来源行为 3.1–3.11 整章通用注脚，降自 high）

---

## 4. Docker 部署完整范式

来源：github.com/SillyTavern/SillyTavern/blob/release/docker/docker-compose.yml（官方原始文件）

### 4.1 官方 docker-compose.yml

```yaml
# ── v1.14.0 本地源码实测版本（已与本地 docker/docker-compose.yml 直读核实）──
services:
  sillytavern:
    build: ..
    container_name: sillytavern
    hostname: sillytavern
    image: ghcr.io/sillytavern/sillytavern:latest
    environment:
      - NODE_ENV=production
      - FORCE_COLOR=1
    ports:
      - "8000:8000"
    volumes:
      - "./config:/home/node/app/config"
      - "./data:/home/node/app/data"
      - "./plugins:/home/node/app/plugins"
      - "./extensions:/home/node/app/public/scripts/extensions/third-party"
    restart: unless-stopped
```

> **版本差异警告**：`SILLYTAVERN_HEARTBEATINTERVAL=30` 环境变量和 `healthcheck` 块在 **v1.14.0 本地源码中不存在**，官方文档/GitHub release 分支的最新版本已新增这两项。若使用比 v1.14.0 更新的版本，请以 GitHub release 分支实际文件为准。

来源：本地 v1.14.0 `docker/docker-compose.yml` 直读 `[运行时源码]` + 官方文档（最新版本新增内容）`[文档·单源]` ｜ v1.14.0 适用版本置信度：high `[运行时源码]`；含 healthcheck 新字段部分：medium·单源孤证 `[文档·单源]`（未真机验证新版本）

### 4.2 路径映射表

| 宿主机路径 | 容器内路径 | 用途 |
|---|---|---|
| `./config` | `/home/node/app/config` | config.yaml 所在目录 |
| `./data` | `/home/node/app/data` | 用户数据目录（**必须挂载**）|
| `./plugins` | `/home/node/app/plugins` | 服务端插件 |
| `./extensions` | `/home/node/app/public/scripts/extensions/third-party` | 全局 UI 扩展 |

**注意**：全局扩展（admin 安装的）在 `public/scripts/extensions/third-party/`，需专门 volume 挂载；用户级扩展在 `data/{handle}/extensions/`，随 data 卷自动持久化。两条路径不同，不可混淆。

来源：官方 docker-compose.yml ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]` `[运行时源码]`

### 4.3 非 root 用户运行

```yaml
# 方法一：PUID/PGID（推荐，入口点自动修复所有权）
environment:
  - PUID=1000
  - PGID=1000

# 方法二：--user 标志
docker run --user 1000:1000 ...
```

来源：docs.sillytavern.app/installation/docker/ ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·单源孤证 `[文档·单源]`（官方文档记载，v1.14.0 本地 Dockerfile/docker-compose.yml 未验证 PUID/PGID 入口点实现；降自 high）

### 4.4 更新流程

```bash
cd SillyTavern/docker
docker compose down
# staging 分支镜像改为 :staging
docker rmi ghcr.io/sillytavern/sillytavern:latest
docker compose up -d
```

来源：docs.sillytavern.app/installation/docker/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 4.5 Healthcheck 原理

> **版本注意**：`src/healthcheck.js` 和 `heartbeatInterval` / `heartbeat.json` 机制在 **v1.14.0 本地源码中均不存在**（已 Glob + Grep 验证无此文件，config.yaml 中也无 heartbeatInterval 字段）。以下描述基于官方文档，适用于比 v1.14.0 更新的 release 版本。

服务器周期性写入时间戳到 `data/heartbeat.json`（心跳间隔由 `SILLYTAVERN_HEARTBEATINTERVAL` 控制，单位：秒），`src/healthcheck.js` 检查该文件是否存在且为最近更新。

**关键约束**：若修改了 `dataRoot`，必须同步设置 `SILLYTAVERN_DATAROOT` 环境变量，否则 healthcheck 找不到心跳文件，容器将始终报 unhealthy。

来源：docs.sillytavern.app/installation/docker/（最新 release 分支）｜ 适用版本：v1.14.0 以上某版本起 ｜ 置信度：medium·单源孤证 `[文档·单源]`（v1.14.0 本地源码无此机制，未真机验证引入版本；**原标注 high `[运行时源码]` 有误，降为 medium·单源孤证**）

### 4.6 SELinux 环境挂载

```yaml
volumes:
  - ./config:/home/node/app/config:z    # 共享 SELinux 标签（多容器共享）
  - ./data:/home/node/app/data:Z        # 私有 SELinux 标签（本容器专用）
```

来源：docs.sillytavern.app/installation/docker/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 4.7 IP 白名单陷阱（Linux Docker CE）

**现象**：Linux Docker CE 环境中，默认白名单 `127.0.0.1` 不包含 Docker 网关 IP，导致浏览器无法访问 ST。

**修复步骤**：

```bash
# 第一步：查找 Docker 网关 IP
docker network inspect docker_default | grep Gateway
# 典型输出：172.18.0.1

# 第二步：加入白名单（或开启自动检测）
```

```yaml
# config/config.yaml
whitelist:
  - 127.0.0.1
  - 172.18.0.1    # Docker 网关 IP
# 或：
whitelistDockerHosts: true   # 自动检测并白名单 Docker 宿主机 IP
```

来源：docs.sillytavern.app/installation/docker/ + 社区实践 ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

---

## 5. 安装、分支与更新

### 5.1 Node.js 版本要求

**当前要求**：Node.js **20+**（v18 已 EOL，2026 年官方要求 v20+）。推荐安装最新 LTS 版。

来源：docs.sillytavern.app/installation/ ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·单源孤证 `[文档·单源]`（来自社区综合指南，无官方明确版本表格）

### 5.2 分支策略

| 分支 | 更新频率 | 适用人群 | Docker 镜像 tag |
|---|---|---|---|
| `release` | 约每月一次 | 绝大多数用户、角色卡生产环境 | `latest` |
| `staging` | 每日多次 | 开发者/追新者 | `staging` |

**避坑**：staging 分支每日多次提交，不适合生产环境或角色卡开发依赖——功能/API 可能随时变动。

来源：docs.sillytavern.app/installation/ + github.com/SillyTavern/SillyTavern ｜ 适用版本：全版本 ｜ 置信度：high `[文档·多源]`

### 5.3 更新升级命令

```bash
# ---- 裸机安装（初次）----
git clone https://github.com/SillyTavern/SillyTavern -b release
cd SillyTavern
# Windows
Start.bat
# Linux/Mac（含 npm install 自动执行）
bash start.sh

# ---- 日常更新 ----
# Linux/Mac/Termux
cd SillyTavern && git pull && bash start.sh

# Windows 一键更新
UpdateAndStart.bat

# ---- 合并冲突处理 ----
git merge --abort
git reset --hard
git pull --rebase --autostash

# ---- npm 模块损坏修复 ----
rm -rf node_modules && npm cache clean --force && npm install

# ---- ZIP 包升级时的数据迁移（v>=1.12.0）----
cp -r /old/data /new/SillyTavern/data
cp /old/config.yaml /new/SillyTavern/config.yaml
```

来源：docs.sillytavern.app/installation/updating/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

---

## 6. v1.12.0 迁移：旧路径 vs 新路径

v1.12.0 将用户数据从 `/public` 迁出到独立 `data/` 目录，以下是完整路径映射：

| 旧位置（`<1.12.0`） | 新位置（`>=1.12.0`） |
|---|---|
| `/secrets.json` | `/data/default-user/secrets.json` |
| `/public/characters` | `/data/default-user/characters` |
| `/public/chats` | `/data/default-user/chats` |
| `/public/settings.json` | `/data/default-user/settings.json` |
| `/public/worlds` | `/data/default-user/worlds` |
| `/public/themes` | `/data/default-user/themes` |
| `/public/backgrounds` | `/data/default-user/backgrounds` |
| `/public/groups` | `/data/default-user/groups` |

**迁移行为差异**：
- **裸机安装**：首次启动自动迁移，旧数据备份到 `/backups/_migration/YYYY-MM-DD/`
- **Docker**：需手动迁移，新建 data 卷，将内容移入 `default-user/` 子目录
- **config.yaml**：保留原位（ST 安装根目录），不随数据一起迁移

**重要警告**：从 `<1.12.0` 升级时，禁止直接复制整个 `/public/` 目录到新版本，只选择性复制用户数据子目录到新的 `data/default-user/`，否则会引入旧版服务器文件导致混乱。

来源：docs.sillytavern.app/installation/st-1.12.0-migration-guide/ ｜ 适用版本：v1.12.0 迁移场景 ｜ 置信度：high `[文档·多源]`

---

## 7. 多用户账户系统

### 7.1 启用方式

```yaml
# config.yaml
enableUserAccounts: true
enableDiscreetLogin: false   # true = 不显示用户列表，需手动输入 handle
```

来源：docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 7.2 用户角色

| 角色 | 权限说明 |
|---|---|
| admin | 创建/删除/修改所有用户；为所有用户安装扩展 |
| regular | 仅管理自己的账户；只为自己安装扩展 |

- 所有新账户默认为 regular，需管理员手动提升
- `default-user` 永不删除，是 `enableUserAccounts: false` 时的 fallback admin

来源：docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 7.3 Handle 规范

**格式**：小写字母 + 数字 + 破折号（不含大写、空格、其他特殊字符）

合法示例：`alice`、`user-123`、`flux-the-cat`

对应目录路径：`data/{handle}/`

来源：docs.sillytavern.app/administration/multi-user/ + github.com/SillyTavern/SillyTavern/blob/release/src/users.js ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]` `[运行时源码]`

### 7.4 密码安全与限制

| 方面 | 说明 |
|---|---|
| 存储方式 | `scrypt` 哈希 + 每用户独立 salt |
| 账户数据位置 | `data/_storage/`（node-persist，禁止手动编辑）|
| 登录限速 | 失败 5 次/分钟（`rateLimiting.accountsLoginMaxAttempts`）|
| 安全定位 | 官方明确：密码是"基本隐私保护，不是安全特性" |
| API 密钥风险 | API 密钥以明文存于 `secrets.json`，有服务器文件系统权限即可读取 |

**重要警告**：多用户密码不是强安全边界。有服务器文件系统访问权限的人可直接读取 `secrets.json`。如需真正隔离，需配合操作系统级别的文件权限控制。

来源：docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 7.5 密码恢复

```bash
# 在服务器端运行（需能访问服务器命令行）
# password 参数可省略——省略则清空密码（设为空密码）
node recover.js [user-handle] [new-password]
```

> **已删除"4 位恢复码"说法**：v1.14.0 的 `recover.js` + `src/recover-password.js` 直读确认，密码恢复仅支持命令行方式，无任何"从服务器控制台获取 4 位码"机制（系原草稿无中生有）。`[运行时源码]`

来源：本地 v1.14.0 `recover.js`、`src/recover-password.js` 直读 + docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[运行时源码]`

### 7.6 登录行为

| 场景 | 行为 |
|---|---|
| 只有 1 个用户且无密码 | 直接跳过登录页 |
| `enableDiscreetLogin: false` | 显示用户列表，点击登录 |
| `enableDiscreetLogin: true` | 隐藏用户列表，需手动输入 handle |

来源：docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 7.7 SSO 高级集成

支持通过 Authelia 和 Authentik 反向代理头（`X-Real-IP`/`X-Forwarded-For`）实现自动登录。SSO 用户名需与 ST handle 大小写不敏感匹配。需同时开启 `enableForwardedWhitelist: true`。

来源：docs.sillytavern.app/administration/multi-user/ ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·单源孤证 `[文档·单源]`（无实测验证）

---

## 8. 关键文件格式规范

### 8.1 角色卡格式（PNG + tEXt chunk）

**核心结论**：角色卡以 **PNG 文件**形式存储，JSON 数据嵌入 `tEXt` chunk，keyword 为 `chara`（base64 编码）。同时支持多版本格式：

| 格式版本 | 说明 | 兼容性 |
|---|---|---|
| V1（遗留）| 平面 JSON | 只读，仍可导入 |
| V2 | `tEXt` chunk，keyword = `chara`（base64）| 读写，最广兼容 |
| V3（当前）| 优先读取，同时写入 V2 保持兼容 | 当前默认 |

支持导入的其他格式：JSON、CharX（ZIP）、BYAF、YAML

**核心 JSON 字段**：`name`、`description`、`personality`、`scenario`、`mes_example`、`system_prompt`、`tags`

**导出时自动移除的私有字段**（`unsetPrivateFields()`）：`fav`（收藏状态）、`chat`（当前聊天文件名）

**存储路径**：
- 角色卡文件：`data/{handle}/characters/{角色名}.png`
- 精灵图/资产：`data/{handle}/characters/{角色名}/`（同名子目录）

来源：本地 v1.14.0 `src/character-card-parser.js` 直读（V2=`chara`/V3=`ccv3` keyword 已验证）+ DeepWiki 角色管理章节 ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[运行时源码]`（keyword 值、V2/V3 并存、BYAF 格式支持均源码直读验证）；`unsetPrivateFields()` 函数名 + 导出字段清单未在后端 src 中找到（可能在前端），对应部分降为 medium·推导未验证 `[文档·多源]`

### 8.2 聊天记录格式（JSONL）

每个聊天文件为 `.jsonl` 格式，逐行解析：

```jsonl
// 第 1 行：header（元数据）
{"user_name":"User","character_name":"Assistant","create_date":"2024-01-15 @14h 30m 15s 123ms"}

// 后续行：消息（每行独立 JSON 对象）
{"name":"User","is_user":true,"is_name":true,"send_date":1705328415123,"mes":"Hello!","swipes":["Hello!"],"swipe_id":0,"extra":{}}
{"name":"Assistant","is_user":false,"is_name":true,"send_date":1705328416000,"mes":"Hi there!","swipes":["Hi there!","Hey!"],"swipe_id":0,"extra":{}}
```

**关键字段说明**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 发言者名称 |
| `is_user` | boolean | 是否为用户消息 |
| `is_name` | boolean | 是否显示名称 |
| `send_date` | number | 毫秒时间戳 |
| `mes` | string | 当前显示的消息内容 |
| `swipes` | string[] | 所有消息变体（swipe）数组 |
| `swipe_id` | number | 当前选中的变体索引 |
| `extra` | object | 附加数据（tokens、image 等）|

**存储路径**：`data/{handle}/chats/{角色名}/`（每角色一个子目录）

**群聊路径**：`data/{handle}/group chats/`（含空格）

**完整性保护**：integrity slug 机制防止多标签页并发覆盖。

**避坑**：
- 聊天文件重命名后，checkpoint 按文件名关联，重命名导致 checkpoint 失效。
- 改角色名不影响旧聊天文件，但旧文件无法在新名字下自动索引。

来源：github.com/SillyTavern/SillyTavern/issues/2151（社区 issue）+ DeepWiki 角色管理章节 ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·单源孤证 `[社区]` `[文档·多源]`（主要来源是 GitHub issue 和 DeepWiki，非直读运行时源码；原标 high `[运行时源码]` 依据类型标注有误，降级并修正依据类型；integrity slug 等细节未源码验证）

### 8.3 World Info（Lorebook）格式

**文件格式**：JSON（`.json`），存放于 `data/{handle}/worlds/`

**条目字段参考**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `uid` | number | 唯一标识符 |
| `keys` | string[] | 主触发关键词 |
| `keysecondary` | string[] | 副关键词（过滤逻辑）|
| `comment` | string | 条目备注/标题 |
| `content` | string | 插入提示词的文本内容 |
| `enabled` | boolean | 是否启用 |
| `constant` | boolean | 是否无条件触发 |
| `insertion_order` | number | 优先级（数值越高越靠前）|
| `position` | string/enum | 插入位置（Before/After Char Defs 等）|
| `scanDepth` | number | 扫描消息深度 |
| `caseSensitive` | boolean | 关键词大小写敏感 |
| `selectiveLogic` | number | 副关键词逻辑（AND ANY/AND ALL/NOT）|
| `probability` | number | 触发概率（0-100）|
| `group` | string | 包含组（同组互斥）|
| `role` | string | 消息角色分配 |
| `triggers` | string[] | 生成类型过滤 |
| `automationId` | string | STscript 集成 ID |
| `characterFilter` | object | 限制激活的角色 |

来源：docs.sillytavern.app/usage/core-concepts/worldinfo/ ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·单源孤证 `[文档·多源]`（条目字段有部分来自文档，具体枚举值未真机逐一验证）

### 8.4 settings.json 结构概要

**顶层代表性字段**：

| 字段 | 说明 |
|---|---|
| `user_name` | 用户显示名 |
| `amount_gen` | 生成 token 数上限 |
| `max_context` | 上下文窗口大小 |
| `extension_settings` | 所有扩展的配置中心（单一真相源）|
| `power_user` | UI 偏好、tokenizer、instruct/context/sysprompt 模板、主题 |

**保存机制**：
- 前端：debounce 1000ms 触发保存 + 每 10 分钟 auto-save
- 后端：`src/endpoints/settings.js` 持久化到 `settings.json`

**默认值来源**：`default/content/settings.json`（首次用户目录创建时同步）

来源：DeepWiki settings 管理章节 + docs.sillytavern.app ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·单源孤证 `[文档·多源]`（仅获得部分字段，完整 schema 见悬案 U4）

### 8.5 默认内容脚手架

```
default/
├── content/
│   ├── settings.json    ← 全局默认配置
│   └── index.json       ← 指定哪些文件复制给新用户（首次创建时）
└── scaffold/
    └── index.json       ← 每次服务器启动时复制给每个用户的文件
```

`content/` 和 `scaffold/` 走同一函数 `checkForNewContent()`（v1.14.0 `src/endpoints/content-manager.js` 直读），**均经过 `content.log` 去重**——已复制过的条目记录在 `content.log`，下次启动不会重复覆盖。`scaffold/` 的文件在**每次启动时都会检查**，但只有 `content.log` 中未登记的条目才实际复制，并非"无条件覆盖"。

来源：本地 v1.14.0 `src/endpoints/content-manager.js` 直读 `[运行时源码]` + DeepWiki `[文档·单源]` ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·推导未验证 `[运行时源码]`（源码逻辑清晰，但 scaffold 目录实际有哪些文件/下发频率未真机测试；原标注 medium·单源孤证 升级为 medium·推导未验证，依据类型改为含 [运行时源码]）

---

## 9. 网络访问与安全

### 9.1 开放外网访问最小配置

```yaml
# config.yaml — 最小可用外网访问配置
listen: true
whitelistMode: false   # 或保持 true 并添加具体 IP/CIDR
basicAuthMode: true
basicAuthUser:
  username: myuser
  password: strongpassword123
```

**官方警告**：禁止不加保护地将 ST 暴露到公网。Basic Auth 无独立限速（`rateLimiting.basicAuthMaxAttempts` 仅限 1 分钟 5 次），推荐用隧道/VPN 代替端口转发。

来源：docs.sillytavern.app/usage/remoteconnections/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 9.2 Cloudflare/Tailscale 推荐范式

**Tailscale**（最简单，免费个人使用）：
1. 两台设备各安装并登录 Tailscale
2. 将 Tailscale 分配的机器 IP 加入 ST 白名单
3. 访问：`http://<tailscale-machine-name>:8000/`

**Cloudflare Zero Trust**（支持 50 用户，免费）：
1. 用 `cloudflared tunnel` 创建隧道
2. 无需修改路由器或防火墙设置
3. 自带 Cloudflare 身份验证层

来源：docs.sillytavern.app/administration/tunneling/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 9.3 反向代理（Nginx）关键注意点

- Nginx 需正确配置 WebSocket upgrade headers（`Upgrade`、`Connection`）
- 需通过 `X-Real-IP`/`X-Forwarded-For` 传递真实 IP，并同时开启 `enableForwardedWhitelist: true`
- **不支持子路径部署**（issue #2025 尚未解决，只能挂在根路径 `/`）

来源：社区实践 + github.com/SillyTavern/SillyTavern/issues/2025 ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·推导未验证 `[社区]`（官方文档仅有 Traefik 范例，Nginx 无官方配置指南）

---

## 10. 备份与迁移操作规范

### 10.1 完整手动备份清单

以下是 `data/default-user/` 下的完整备份项：

```
必须备份（不可重建）：
├── characters/          ← 角色卡 PNG（含嵌入的全部数据）
├── chats/               ← 聊天记录 JSONL
├── worlds/              ← World Info
├── groups/              ← 群组定义
├── group chats/         ← 群聊记录
├── backgrounds/
├── User Avatars/
├── user/                ← 上传文件/图片/ComfyUI 工作流
├── NovelAI Settings/
├── KoboldAI Settings/
├── OpenAI Settings/
├── TextGen Settings/
├── themes/
├── instruct/
├── context/
├── sysprompt/
├── reasoning/
├── movingUI/
├── QuickReplies/
├── assets/
├── extensions/          ← 用户级扩展
├── vectors/             ← RAG 向量数据
├── backups/             ← 可选（聊天自动备份副本）
├── settings.json        ← 重要！所有 UI 设置和扩展配置
└── secrets.json         ← API 密钥（注意安全，勿明文传输）

可跳过（重启或重新生成）：
├── thumbnails/          ← 缩略图缓存
├── _cache/              ← 服务器缓存
└── _uploads/            ← 临时上传（启动自动清空）
```

来源：docs.sillytavern.app + 社区实践 ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 10.2 Docker 完整备份

```bash
# 停止容器后备份两个目录即可（config + data）
docker compose down
tar -czf backup-$(date +%Y%m%d).tar.gz ./config ./data

# 恢复
tar -xzf backup-YYYYMMDD.tar.gz
docker compose up -d
```

来源：docs.sillytavern.app/installation/docker/ ｜ 适用版本：v1.12.0+ ｜ 置信度：high `[文档·多源]`

### 10.3 自动备份机制

| 类型 | 触发条件 | 配置项 | 存放位置 |
|---|---|---|---|
| 聊天自动备份 | 每次修改后 throttle（默认 10000ms）| `backups.chat.*` | `data/{handle}/backups/` |
| 全量数据备份 | 用户手动在 UI 触发 | `backups.allowFullDataBackup: true`（**v1.14.0 config.yaml 中无此字段，为后续版本新增**）| 下载为 zip |
| 迁移备份 | v1.12.0 升级时首次启动 | 自动 | `backups/_migration/YYYY-MM-DD/` |

来源：docs.sillytavern.app + 本地 v1.14.0 `default/config.yaml` 直读 ｜ 适用版本：v1.12.0+ ｜ 置信度：medium·推导未验证 `[文档·多源]` `[运行时源码]`（聊天自动备份字段 v1.14.0 直读确认；全量备份字段为后续版本新增；节级降自 high）

---

## 11. 高频避坑速查

| # | 陷阱 | 现象 | 修复 | 置信度 |
|---|---|---|---|---|
| 1 | Docker IP 白名单 | 浏览器无法访问 ST（Linux Docker CE）| `docker network inspect docker_default \| grep Gateway`，将网关 IP 加白名单；或 `whitelistDockerHosts: true` | high `[文档·多源]` |
| 2 | Healthcheck 找不到心跳文件 | 容器始终报 unhealthy | 修改 `dataRoot` 后必须同步设置 `SILLYTAVERN_DATAROOT` 环境变量（**仅适用于含 healthcheck 机制的版本，v1.14.0 中该机制不存在**）| medium·单源孤证 `[文档·单源]`（原标 high `[运行时源码]` 有误；v1.14.0 本地无 src/healthcheck.js，降级）|
| 3 | dataRoot 路径不支持 `~` | 启动报错或路径解析错误 | 使用完整绝对路径或完整相对路径，不得包含 `~`、`$HOME` 等 shell 展开符 | high `[文档·多源]` |
| 4 | 从旧版 `/public/` 整体复制 | 新版服务器文件被旧版覆盖，行为异常 | 从 `<1.12.0` 升级只选择性复制用户数据子目录到 `data/default-user/`，禁止整体复制 `/public/` | high `[文档·多源]` |
| 5 | 多用户密码安全误解 | 误以为密码保护了 API 密钥 | `secrets.json` 明文存储，有服务器文件系统权限即可读取；密码仅是"基本隐私" | high `[文档·多源]` |
| 6 | 改角色名后旧聊天失联 | 旧聊天文件无法在新名字下自动索引 | chats 子目录按角色名建立，改名不自动迁移；需手动重命名 chats 子目录 | high `[运行时源码]` |
| 7 | 重命名聊天文件断 checkpoints | checkpoint 失效 | checkpoint 按文件名关联，重命名后需重建关联 | high `[运行时源码]` |
| 8 | Extensions 路径双轨 | 扩展只有自己可见/admin 安装无效 | 全局扩展（admin 安装）在 `public/scripts/extensions/third-party/`（Docker 需专门 volume 挂载）；用户级在 `data/{handle}/extensions/` | high `[文档·多源]` `[运行时源码]` |
| 9 | staging 分支用于生产 | 功能随时变动，角色卡行为不稳定 | 生产/角色卡开发依赖 release 分支 | high `[文档·多源]` |
| 10 | CORS proxy 宽松配置 | SSRF 漏洞 | v1.14.0 字段名为 `enableCorsProxy: true`（无 `cors.enabled/origin` 嵌套），宽松配置仅在必要时开启 | medium·推导未验证 `[运行时源码]`（v1.14.0 源码确认字段名；SSRF 风险为逻辑推导，原标 high `[文档·多源]` 依据类型有误，降级调整）|
| 11 | 不支持子路径部署 | Nginx 反代子路径访问失败 | ST 只能挂在根路径 `/`（issue #2025 未解决）| medium·推导未验证 `[社区]` |

---

## 12. 悬而未决：需真机验证的问题

### U1 — chats/ 子目录命名规则

**问题**：文档未明确 chats 子目录名是否完全使用角色 `name` 字段，还是经过特殊字符清洁处理（去除 `/`、`:`、`*` 等不合法文件名字符）或截断。

**验证路径**：创建含特殊字符名称角色（如 `Alice/Bob`、`角色:测试`），发一条消息后观察 `data/default-user/chats/` 实际生成的目录名。

置信度：low `[推断]`

---

### U2 — 角色卡内嵌 Lorebook 与 worlds/ 目录的同步关系

**问题**：角色卡可内嵌 lorebook 数据（存于 PNG chunk）。导出带绑定世界书的角色卡时，是否同步生成/更新 `worlds/` 目录下的独立 `.json` 文件，还是仅存于 PNG chunk 内？

**验证路径**：在 ST 中为角色绑定世界书后，检查导出前后 `worlds/` 目录变化；同时检查导入含内嵌 lorebook 的 PNG 是否在 `worlds/` 生成新文件。

置信度：low `[推断]`

---

### U3 — vectors/ 内部文件结构

**问题**：Vectra 库的 JSON 格式文档极少，`data/{handle}/vectors/` 下每个集合的文件命名与角色/聊天记录的对应关系不明确。

**验证路径**：启用 Data Bank 并上传文件后，直接查看 `data/{handle}/vectors/` 目录实际文件结构，对比 Vectra 仓库源码中的存储格式。

置信度：low `[推断]`

---

### U4 — settings.json 完整 schema

**问题**：仅获得顶层和 `power_user` 的部分字段，完整 schema 未见于文档。

**验证路径**：查阅 `default/content/settings.json`（ST 源码中）获取完整默认值结构；或在空白实例启动后直接读取生成的 `data/default-user/settings.json`。

置信度：medium·推导未验证 `[文档·单源]`（有单一来源指向默认文件位置，但未直接读取完整内容）

---

### U5 — `data/_storage/` 内部文件格式

**问题**：`_storage/` 使用 node-persist 存储多用户账户信息，官方明确禁止手动编辑但未公布格式。具体文件命名、handle/passwordHash/salt/role 等字段的 JSON schema 不明。

**验证路径**：创建多用户模式并添加测试账户后，查看 `data/_storage/` 目录实际内容（纯读取，不修改）。

置信度：low `[推断]`

---

### U6 — git pull 时 config.yaml 冲突行为

**问题**：如果 ST 仓库的 `default/config.yaml` 有改动而用户也有本地修改，`git pull --rebase` 可能产生冲突。推测：用户的 `config.yaml` 位于仓库根目录，而默认文件在 `default/config.yaml`，两者是不同文件，不会冲突——但需真机验证确认覆盖行为。

**验证路径**：在有本地 `config.yaml` 修改的情况下运行 `git pull`，观察文件是否被覆盖。

置信度：low `[推断]`（推测方向已给出，但未实测）

---

## 来源索引

| 来源 | URL |
|---|---|
| 官方文档 — config.yaml | https://docs.sillytavern.app/administration/config-yaml/ |
| 官方文档 — Docker 部署 | https://docs.sillytavern.app/installation/docker/ |
| 官方文档 — 多用户系统 | https://docs.sillytavern.app/administration/multi-user/ |
| 官方文档 — 更新升级 | https://docs.sillytavern.app/installation/updating/ |
| 官方文档 — v1.12.0 迁移指南 | https://docs.sillytavern.app/installation/st-1.12.0-migration-guide/ |
| 官方文档 — 远程访问 | https://docs.sillytavern.app/usage/remoteconnections/ |
| 官方文档 — World Info | https://docs.sillytavern.app/usage/core-concepts/worldinfo/ |
| 官方文档 — Data Bank | https://docs.sillytavern.app/usage/core-concepts/data-bank/ |
| 官方文档 — 隧道/穿透 | https://docs.sillytavern.app/administration/tunneling/ |
| GitHub 源码 — constants.js | https://github.com/SillyTavern/SillyTavern/blob/release/src/constants.js |
| GitHub 源码 — users.js | https://github.com/SillyTavern/SillyTavern/blob/release/src/users.js |
| GitHub 源码 — docker-compose.yml | https://github.com/SillyTavern/SillyTavern/blob/release/docker/docker-compose.yml |
| GitHub 源码 — default/config.yaml | https://github.com/SillyTavern/SillyTavern/blob/release/default/config.yaml |
| DeepWiki — 数据管理 | https://deepwiki.com/SillyTavern/SillyTavern/5-data-management |
| DeepWiki — 角色与聊天存储 | https://deepwiki.com/SillyTavern/SillyTavern/5.1-characters-and-chat-storage |
| DeepWiki — 认证与安全 | https://deepwiki.com/SillyTavern/SillyTavern/2.5-authentication-and-security |
| DeepWiki — settings 管理 | https://deepwiki.com/SillyTavern/SillyTavern/5.3-settings-and-configuration-management |
| GitHub Issue #2151（聊天格式）| https://github.com/SillyTavern/SillyTavern/issues/2151 |
