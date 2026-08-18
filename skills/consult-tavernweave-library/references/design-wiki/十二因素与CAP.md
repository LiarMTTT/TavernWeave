---
title: 十二因素与CAP
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - research
  - tooling
sources:
  - https://12factor.net/
  - https://12factor.net/codebase
  - https://12factor.net/config
  - https://12factor.net/backing-services
  - https://12factor.net/build-release-run
  - https://12factor.net/processes
  - https://12factor.net/dev-prod-parity
  - https://12factor.net/logs
  - https://github.com/twelve-factor/twelve-factor
  - https://www.12factor.net/blog/open-source-announcement
  - https://github.com/twelve-factor/twelve-factor/blob/next/UPDATE_FAQ.md
  - https://github.com/twelve-factor/twelve-factor/blob/next/GOVERNANCE.md
  - https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/
  - https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# 十二因素与CAP

本页不是已采用的应用合同，也不是工坊已经在跑的一致性模型。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]] B3-12F。对照短句见 [[concepts/后端架构名词与工坊对照]]「十二因素与 CAP」；本页展开入口与冲突，不整段复制那一节。

## 一句话定义

十二因素是 2011 年面向 SaaS 的应用–平台合同：一份代码库、多份部署，配置进环境，进程无状态。CAP 说的是网络分区下，共享数据系统不能同时要完美的一致性与可用性。一层管怎么部署进程，一层管分区时怎么取舍数据，不要并成一张「云原生清单」。

## 为什么重要

听到「按十二因素做」先问看的是现网 2011 正文，还是 2024 修订仓的 `next`。听到「CAP 三选二」先问是教材口号，还是 Brewer 2012 自己标成误导的那一版。Gilbert/Lynch 2002 是形式化证明，本轮没有合法免费全文，不链盗版。工坊和角色卡都不因此改栈。

## 权威入口

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Twelve-Factor 现网枢纽](https://12factor.net/) | 2011 正文仍在；应用–平台合同 |
| 2 | [I. Codebase](https://12factor.net/codebase) | 一份代码库，多份部署 |
| 3 | [III. Config](https://12factor.net/config) | 配置进环境；开源试纸 |
| 4 | [IV. Backing services](https://12factor.net/backing-services) | 可插拔资源 |
| 5 | [V. Build, release, run](https://12factor.net/build-release-run) | 三阶段分离 |
| 6 | [VI. Processes](https://12factor.net/processes) | 无状态进程；禁粘性会话 |
| 7 | [X. Dev/prod parity](https://12factor.net/dev-prod-parity) | 缩小时间 / 人员 / 工具差距 |
| 8 | [XI. Logs](https://12factor.net/logs) | 事件流 / `stdout` |
| 9 | [修订仓](https://github.com/twelve-factor/twelve-factor) | 默认枝 `next`，尚未替换现网 |
| 10 | [2024-11-12 开源公告](https://www.12factor.net/blog/open-source-announcement) | 原文钉 2011；刷新开始 |
| 11 | [UPDATE_FAQ](https://github.com/twelve-factor/twelve-factor/blob/next/UPDATE_FAQ.md) | 改什么、不改什么；拟保持十二项 |
| 12 | [GOVERNANCE](https://github.com/twelve-factor/twelve-factor/blob/next/GOVERNANCE.md) | `next` → `main` 才算正式改宣言 |
| 13 | [CAP Twelve Years Later（InfoQ）](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/) | Brewer 2012；「三选二」标误导 |
| 14 | [Perspectives on the CAP Theorem（MIT TDS）](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf) | Gilbert/Lynch 2012 合法免费综述，不是 2002 证明文 |

上表 **14** 条。B3-12F 的采集行不在本页镜像。

## 如何运作

### 现网仍是 2011 正文

[12factor.net](https://12factor.net/) 在 2026-08-14 仍是 Adam Wiggins / Heroku 经验合成的方法论。写给「把软件当服务来跑」的开发与运维。目标：声明式搭建、与操作系统合同干净、适合云平台、缩小开发与生产差异、扩缩不必先改架构。语言与 backing service 组合不限。

[2024-11-12 开源公告](https://www.12factor.net/blog/open-source-announcement) 把原文钉在 2011。修订仓 FAQ 把导言说成「和 2012 一样真」。年份两边留，不以 FAQ 覆盖公告。

### 十二项（现网标题）

| # | 因素 | 现网一句 |
|---|---|---|
| I | [Codebase](https://12factor.net/codebase) | 一份版本库，多份部署。多份代码库就不是一个 app，是分布式系统；共享代码抽成库。 |
| II | Dependencies | 显式声明并隔离依赖。 |
| III | [Config](https://12factor.net/config) | 随部署而变的东西进环境变量，不进代码。试纸：随时开源也不泄凭证。内部路由 / 模块接线不算这类 config。 |
| IV | [Backing services](https://12factor.net/backing-services) | 数据库、队列、SMTP、缓存都是可插拔资源；换第三方只改句柄，不改代码。 |
| V | [Build, release, run](https://12factor.net/build-release-run) | 构建出包 → 包加配置成不可变 release → 再跑。运行时改代码回不去构建。 |
| VI | [Processes](https://12factor.net/processes) | 一个或多个无状态、不共享内存的进程；持久化进 backing service。粘性会话是违规。 |
| VII | Port binding | 通过绑定端口导出服务。 |
| VIII | Concurrency | 用进程模型横向扩。 |
| IX | Disposability | 快起、优雅停，最大化鲁棒。 |
| X | [Dev/prod parity](https://12factor.net/dev-prod-parity) | 缩小时间 / 人员 / 工具差距；各部署用同一类、同一版本的 backing service。 |
| XI | [Logs](https://12factor.net/logs) | 日志是事件流；进程写无缓冲 `stdout`，路由与存档交给执行环境。 |
| XII | Admin processes | 管理任务当一次性进程跑。 |

这是 2011 合同，不是 Kubernetes 清单，也不是「必须先拆成微服务」的理由。工作负载对象怎么补齐，见 [[concepts/Kubernetes工作负载]]。依赖声明也不是成分清单，见 [[concepts/SBOM与SLSA]]。

### 2024 修订仓尚未替换现网

[twelve-factor/twelve-factor](https://github.com/twelve-factor/twelve-factor) 于 2024-10 建仓，默认枝 `next`。README 写明：这里是**将要**替换 12factor.net 的更新正文；改动先留在 `next`，维护者认为本轮完成才算数。

[UPDATE_FAQ](https://github.com/twelve-factor/twelve-factor/blob/next/UPDATE_FAQ.md)：先拆原则 / 例子 / 指导并更新例子；意图保持十二项；原文会继续留在新站。范围仍是应用与平台的接口，不是把 DRY / YAGNI 收成新因素。

[GOVERNANCE](https://github.com/twelve-factor/twelve-factor/blob/next/GOVERNANCE.md)：中大改在 `next`；大版本要维护者超半数签字，才从 `next` 进 `main` 并正式改宣言，一年至多一次。品牌现阶段仍由 Heroku 控。

因此：仓里的 `next` ≠ 现网站。培训若把修订稿写成「现行十二因素」，与现网冲突；两边都留。

### CAP：教材「三选二」与 Brewer 2012

[Brewer 2012 *CAP Twelve Years Later*](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/)（先刊 IEEE *Computer*；InfoQ 与 IEEE Computer Society 合作转载，本页只用这一合法免费入口）：

- C：相当于只有一份最新数据。
- A：这份数据可更新（高可用）。
- P：能容忍网络分区。

「三选二」当初是为了打开设计空间。Brewer 把这句标成误导：它过度简化。CAP **只禁止**分区存在时同时要完美的 C 和 A。分区少见时，没有理由先放弃 C 或 A。选择可以按操作、数据、用户、子系统细分；C / A / P 都是连续量，不是开关。现代目标是：为具体应用最大化说得通的 C+A 组合，并显式计划分区期与恢复。

操作上，分区是通信的时限。超时后必须做分区决策：取消操作（降 A）或继续（冒不一致）。无限重试等于选 C。没有全局「已分区」共识。

分区管理三步：检测 → 进入显式分区模式（限制部分操作，或记下恢复所需历史）→ 恢复时收敛状态并补偿分区期的错。ATM 例子：分区期仍允许有上限的取现（保 A、限风险），恢复后再审计与收费补偿。

ACID 的 C / A 与 CAP 的 C / A **不是同一对字母**。选可用性并不自动丢掉原子性或耐久。事件溯源 / CQRS、CRDT 是另两套数据与合并模型，见 [[concepts/事件溯源与CQRS]]、[[concepts/CRDT与local-first]]，不要写成 CAP 的三个字母。

### 2002 证明文无合法免费全文

Seth Gilbert / Nancy Lynch, *Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services*, ACM SIGACT News 33(2), 2002。本轮未找到作者页或开放获取的合法免费全文。ACM Digital Library 书目页要登录或付费才能看正文。本页不链盗版 PDF，也不把付费页写成免费入口。

同作者 2012 的 [*Perspectives on the CAP Theorem*](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf) 挂在 MIT TDS 组，是合法免费综述：按 2002 文回顾形式化，并把 CAP 放进「不可靠系统里安全与活性不能同时保证」的更大框。它仍写：不可靠时必须在实践中牺牲 C 或 A（或两者都松）。这与 Brewer 2012「分区少见时不必先弃 C 或 A」并置，不互相覆盖。2012 综述 ≠ 2002 证明文。

## 必须保留的冲突

- 现网 2011 正文 vs 修订仓 2024 `next`「将替换」但未替换。
- 教材 / 旧文「CAP 三选二」vs Brewer 2012 标为误导。
- Gilbert/Lynch 2012 综述仍用「不可靠时须牺牲 C 或 A」的形式化口吻 vs Brewer 2012「分区少见时不必先弃 C 或 A」。两边按作者留。
- 开源公告写 2011，FAQ 把导言说成 2012。
- 2002 证明文无合法免费全文；2012 综述不能冒充 2002。
- 工坊「现在不上」≠「十二因素 / CAP 不正当」。
- 本页映射工坊与发卡的**部署合同与分区取舍**；**不是**「本仓库已采用十二因素或已选定 CAP 点」。

## 例子

- 正例：同一 Git 仓出开发 / 预发 / 生产多份部署；凭证只在环境变量；进程无状态，会话进 Redis。缓存与队列句柄见 [[concepts/Redis与日志队列]]。
- 正例：构建产物与配置合成带唯一 ID 的不可变 release；回滚换上一个 release，不在运行时改代码。
- 正例：分区期 ATM 按上限继续取现，恢复后对账并补偿透支——按操作选 A，用审计补 C。
- 反例：把 `next` 枝草稿写成 12factor.net 现行正文。
- 反例：给单机工坊或酒馆 iframe 贴 CA / CP / AP 标签。
- 反例：读到「三选二」就先把审核库改成最终一致，或先放弃可用性。
- 反例：把 Gilbert 2002 的盗版 PDF 或付费 DL 写成免费依据。

## 边界与易混概念

- 不包括：盗版论文、攻击步骤、凭证、把修订仓写成已替换现网。
- 不包括：本仓库已采用十二因素或已选定 CAP 点——**没有这回事**。
- 现网 2011 ≠ 修订仓 `next`。
- 十二因素 ≠ 微服务、≠ Kubernetes、≠ DORA 五项。交付结果指标见 [[concepts/DORA五项与SLO]]。
- 粘性会话违规 ≠ 浏览器 Session Cookie。后者是宿主会话，不是把用户态缓存在某个卡进程里。
- 发卡 compose / pack / 回封 ≠ Build / Release / Run。回封主链见 [[concepts/打包回封路径]]；行业打包器见 [[concepts/构建链与Vite]]。
- Config 进环境 ≠ 功能开关平台。运行时分支见 [[concepts/功能开关与OpenFeature]]。
- CAP 的 C ≠ ACID 的 C；CAP 的 A ≠ ACID 的 Atomicity。
- Brewer 2012 的分区恢复补偿 ≠ [[concepts/Saga三义与补偿]] 的三义，只是用了同一家族的「事后补」。
- Gilbert/Lynch 2012 综述 ≠ 2002 证明文。
- C4 图画的是运行时边界，不是十二因素的进程合同，见 [[concepts/C4与ADR]]。
- 区分：先问「在谈部署合同还是分区取舍」；再问「依据是现网、修订仓，还是哪一年的 CAP 表述」。

## 映射到本仓库

当前工坊：Gateway 同进程；同步 REST；目录静态；包进对象存储；审核状态机要同步可见结果。角色卡跑在酒馆 iframe，无 OS 安装面，也没有十二因素那种平台进程模型。详见 [[concepts/后端架构名词与工坊对照]]、[[comparisons/工坊架构该上与不该上]]、[[concepts/酒馆宿主与iframe分层]]。

这是产品落点，不是对十二因素或 CAP 的行业否定。**不要把本页写成工坊或发卡已采用十二因素，或已选定 CA / CP / AP。**

| 本仓物 | 实际在做 | 不是 |
|---|---|---|
| 凭证不进 Vault、不进卡源码 | 安全红线，见 [[concepts/创意工坊与安全契约]] | 已落实 Config 因素 |
| `verify-repo` 绿 | 静态检查 | CAP 可用性，也不是 Build / Release |
| 工坊 `approved` | 审核状态机同步可见 | 已选一致性点 |
| 真机导入成功 | 产品验收 | 十二因素 release |
| 发卡 compose / pack / 回封 | 源码拼卡 | Build / Release / Run |
| Gateway 同进程 + 同步 REST | 产品主路径 | 必须先贴 CA / CP / AP，或先上分区模式 |

HTTP 操作合同与错误体是另一层，见 [[concepts/HTTP合同与问题详情]]。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表。

## 来源与证据

权威入口以上表 14 条与 [[queries/第三批蒸馏目标]] B3-12F 为准。只收合法免费页。

1. [Twelve-Factor 现网枢纽](https://12factor.net/) — B3-12F；2011 正文仍在。
2. [I. Codebase](https://12factor.net/codebase) — 一份代码库，多份部署。
3. [III. Config](https://12factor.net/config) — 配置进环境；开源试纸。
4. [IV. Backing services](https://12factor.net/backing-services) — 可插拔资源。
5. [V. Build, release, run](https://12factor.net/build-release-run) — 三阶段分离。
6. [VI. Processes](https://12factor.net/processes) — 无状态进程；禁粘性会话。
7. [X. Dev/prod parity](https://12factor.net/dev-prod-parity) — 缩小三类差距。
8. [XI. Logs](https://12factor.net/logs) — 事件流 / `stdout`。
9. [修订仓](https://github.com/twelve-factor/twelve-factor) — 默认枝 `next`，尚未替换现网。
10. [2024-11-12 开源公告](https://www.12factor.net/blog/open-source-announcement) — 原文钉 2011；刷新开始。
11. [UPDATE_FAQ](https://github.com/twelve-factor/twelve-factor/blob/next/UPDATE_FAQ.md) — 改什么、不改什么；拟保持十二项。
12. [GOVERNANCE](https://github.com/twelve-factor/twelve-factor/blob/next/GOVERNANCE.md) — `next` → `main` 才算正式改宣言。
13. [CAP Twelve Years Later（InfoQ）](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/) — Brewer 2012；「三选二」标误导。
14. [Perspectives on the CAP Theorem（MIT TDS）](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf) — Gilbert/Lynch 2012 合法免费综述，不是 2002 证明文。

已知冲突见上节，不静默覆盖。尚缺：Gilbert/Lynch 2002 合法免费全文；IEEE *Computer* 2012 付费页不收，改用 InfoQ 转载。未跑工坊或 SillyTavern 真机。`12factor.net/about` 本轮 404。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/创意工坊与安全契约]]
- [[concepts/Saga三义与补偿]]
- [[concepts/DORA五项与SLO]]
- [[concepts/C4与ADR]]
- [[concepts/Kubernetes工作负载]]
- [[concepts/SBOM与SLSA]]
- [[concepts/Redis与日志队列]]
- [[concepts/事件溯源与CQRS]]
- [[concepts/CRDT与local-first]]
- [[concepts/功能开关与OpenFeature]]
- [[concepts/打包回封路径]]
- [[concepts/构建链与Vite]]
- [[concepts/HTTP合同与问题详情]]
- [[concepts/酒馆宿主与iframe分层]]
