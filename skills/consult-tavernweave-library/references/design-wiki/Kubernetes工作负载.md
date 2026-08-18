---
title: Kubernetes工作负载
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
  - https://kubernetes.io/docs/concepts/workloads/
  - https://kubernetes.io/docs/concepts/workloads/pods/
  - https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
  - https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/
  - https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
  - https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/
  - https://kubernetes.io/docs/concepts/workloads/controllers/job/
  - https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
  - https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/
  - https://kubernetes.io/docs/concepts/workloads/management/
  - https://kubernetes.io/docs/concepts/configuration/overview/
  - https://kubernetes.io/blog/2025/11/25/configuration-good-practices/
  - https://kubernetes.io/docs/concepts/configuration/
  - https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/
  - https://www.cncf.io/projects/kubernetes/
  - https://kubernetes.io/docs/concepts/configuration/configmap/
  - queries/第三批蒸馏目标.md
  - concepts/后端架构名词与工坊对照.md
knowledge_class: factual
---

# Kubernetes工作负载

本页不是已采用编排，也不是本仓库要上 K8s 的工单。检索时间：2026-08-14。账本见 [[queries/第三批蒸馏目标]] B3-K8s。只收 [k8s.io 工作负载概念](https://kubernetes.io/docs/concepts/workloads/) 与 [CNCF 项目页](https://www.cncf.io/projects/kubernetes/)。不收 Secret 操作、攻防步骤、集群接管。

## 一句话定义

Kubernetes 工作负载是跑在集群里的应用；真正调度的最小单位是 **Pod**，日常用的是更高一层的控制器：Deployment / ReplicaSet / StatefulSet / DaemonSet / Job（以及按日程创建 Job 的 CronJob）。

## 为什么重要

行业里「上 K8s」常被说成一件事。官方分层不是这样：Pod 会随节点故障一起死掉且不会自行复活；控制器才按你声明的状态补齐。本页只蒸这层合同，不写成工坊 Gateway 或发卡 JSON 已经跑在集群上。C4 的容器 / 部署图是说明用符号，不是本页这些 API 对象，见 [[concepts/C4与ADR]]。十二因素的无状态进程也不管 ReplicaSet 怎么补齐，见 [[concepts/十二因素与CAP]]。Deployment 滚动到集群，也不等于功能对用户可见，见 [[concepts/功能开关与OpenFeature]]。

## 权威入口

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [工作负载总览](https://kubernetes.io/docs/concepts/workloads/) | 层与内置控制器；节点致命故障对已跑 Pod 是终态 |
| 2 | [Pod](https://kubernetes.io/docs/concepts/workloads/pods/) | 最小可部署单位；少建裸 Pod |
| 3 | [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) | B3-K8s 枢纽；声明式更新 Pod 与 ReplicaSet |
| 4 | [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/) | 按 selector 维持数量；建议经 Deployment |
| 5 | [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) | 粘性身份、有序扩缩、卷认领 |
| 6 | [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) | 每个（或某些）节点一份 |
| 7 | [Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) | 跑完即停；重试直到成功完成数达标 |
| 8 | [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) | 按日程建 Job；不保证恰好一次 |
| 9 | [ReplicationController](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/) | 遗留页，已被 Deployment + ReplicaSet 取代 |
| 10 | [Managing Workloads](https://kubernetes.io/docs/concepts/workloads/management/) | 清单组织与滚动；Helm 标第三方 |
| 11 | [configuration/overview（现网改道）](https://kubernetes.io/docs/concepts/configuration/overview/) | 旧概念路径，现为博客正文 |
| 12 | [Configuration Good Practices 博客](https://kubernetes.io/blog/2025/11/25/configuration-good-practices/) | 2025-11-25 真身，不是现行概念规范 |
| 13 | [Configuration 概念索引](https://kubernetes.io/docs/concepts/configuration/) | 2021-06-16；不再列出 overview |
| 14 | [Recommended Labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/) | `app.kubernetes.io/*` 推荐不是强制 |
| 15 | [CNCF Kubernetes](https://www.cncf.io/projects/kubernetes/) | 2016-03-10 孵化 / 2018-03-06 毕业 |
| 16 | [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) | 非机密键值；上限 1 MiB；不收 Secret |

上表 **16** 条。B3-K8s 的采集行不在本页镜像。

## 如何运作

### 层（从底到顶）

| 层 | 官方一句话 | 管什么 | 不管什么 |
|---|---|---|---|
| Pod | 最小可部署计算单位 | 同机共网共盘的一组容器 | 节点挂了不会自己再起一个 |
| ReplicaSet | 维持指定数量的相同 Pod | 按 selector 收养 / 创建 / 删除 | 不提供声明式滚动更新 |
| Deployment | 声明式更新 Pod 与 ReplicaSet | 无状态、可互换副本的滚动与回滚 | 不要手改它名下的 ReplicaSet |
| StatefulSet | 一组有粘性身份的 Pod | 稳定网络名、有序扩缩、卷认领 | 删/缩容默认不删卷；要自备 Headless Service |
| DaemonSet | 节点本地设施 | 每个（或某些）节点一份 | 不是按副本数水平扩前端 |
| Job | 跑完即停的一次性任务 | 重试直到成功完成数达标 | 不是常驻服务 |
| CronJob | 按日程创建 Job | crontab 式重复 | 不保证恰好一次；Job 应幂等 |

[工作负载总览](https://kubernetes.io/docs/concepts/workloads/)：节点上的致命故障对已在跑的 Pod 是终态，要恢复必须新建 Pod。内置控制器就是干这个的。Deployment + ReplicaSet 替换遗留 ReplicationController。生态里还可以用 CRD 加第三方工作负载；那是扩展，不是核心六种。v1.35 **alpha**（默认关）另有 Workload API / `PodGroupTemplate`，给 gang scheduling 用。它不是 Deployment 的继任，两边留。

### Pod

[Pods](https://kubernetes.io/docs/concepts/workloads/pods/)：一组共位置、共调度的容器，模型是应用的「逻辑主机」。常见是一容器一 Pod；多容器只给紧耦合。水平扩容靠多个 Pod，不靠一个 Pod 里堆副本。官方写：即使单实例也很少直接建裸 Pod，应走 Deployment 或 Job；要记状态再看 StatefulSet。Pod 相对短暂：跑完、被删、被驱逐或节点失败就结束。**重启容器 ≠ 重启 Pod**——Pod 不是进程，是容器环境，对象一直活到被删除。v1.25 起 `.spec.os.name` 只认 `linux` / `windows`。到 v1.36，该字段**不**影响 kube-scheduler 选节点；选错 OS 要靠节点标签 + `nodeSelector`。两边按版本留。

### ReplicaSet 与 Deployment

[ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/) 用 selector + replicas + template 维持数量。官方建议：除非要自定义更新编排或根本不更新，否则不要直接操作 ReplicaSet，写 Deployment。Deployment 拥有并管理 ReplicaSet；[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) 明文：**不要管理 Deployment 名下的 ReplicaSet**。ReplicaSet 仍是一等 API，也可做 HPA 目标。无 OwnerReference（或 Owner 不是 Controller）且标签匹配的裸 Pod 会被立刻收养——超员则杀掉。这与「永远只通过 Deployment」的建议并存，两边留。[ReplicationController](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/) 仍有概念页，但标题已写 Legacy，被 Deployment + ReplicaSet 取代（RC 无集合选择器）。

### StatefulSet / DaemonSet / Job

[StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)：同模板但**不可互换**，身份跨重调度粘住。限制：卷要 StorageClass 或预置；删/缩容不删卷（数据安全优先）；网络身份靠你自建的 Headless Service；直接删除不保证有序终止（先缩到 0）；默认 `OrderedReady` 滚动可能卡死要人手修。示例用 `ReadWriteOnce`，正文另写生产更推荐 `ReadWriteOncePod`。

[DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)：存储 / 日志 / 监控这类节点守护。加节点就加 Pod，删节点就回收。对比 Deployment：前端无状态、在乎副本与滚动 → Deployment；必须在每台（或某类）机器上有一份、好让别的 Pod 能跑 → DaemonSet。静态 Pod（kubelet 看目录、不经 apiserver）仍写在替代方案里，同时写「未来可能弃用」。

[Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/)：创建 Pod 并重试直到成功完成数够；删 Job 清它建的 Pod。要按日程重复，用 [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)（v1.21 stable）。CronJob 在某些情况下会建出 0 个或两个并发 Job，因此 Job 应幂等。`CRON_TZ` / `TZ` 写进 `schedule` 从未官方支持，时区用 `.spec.timeZone`。`startingDeadlineSeconds` 小于 10 秒可能根本排不上（控制器约 10 秒看一次）。错过超过 100 次则本次不启动并打日志。

### configuration/overview 已改道博客

B3-K8s 点名：旧概念路径 [`/docs/concepts/configuration/overview/`](https://kubernetes.io/docs/concepts/configuration/overview/) 现网仍 200，但正文已是 2025-11-25 Kirti Goyal 的博客 [Configuration Good Practices](https://kubernetes.io/blog/2025/11/25/configuration-good-practices/)（页脚 2026-01-03「Reorganize 2025 blog content」）。博客自称受原 Configuration Best Practices 启发，不是现行概念规范。[Configuration 概念索引](https://kubernetes.io/docs/concepts/configuration/) 末更仍标 2021-06-16，子页是 ConfigMaps / Secrets / 资源管理 / kubeconfig / Windows，**不再列出 overview**。旧路径与博客真身、与索引缺页三边都留，不把博客当概念真源，也不假装 overview 还在概念树里。

博客里的工作负载句与概念页同层：裸 Pod 测试可以、生产危险；常驻用 Deployment（它会建 ReplicaSet）；跑完用 Job。管理页 [Managing Workloads](https://kubernetes.io/docs/concepts/workloads/management/) 仍在概念树：清单里 Service 写在 Deployment 前面；Helm 标第三方，Kustomize 是 kubectl 原生。推荐标签 [`app.kubernetes.io/*`](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/) 方便工具互操作，**不是**核心工具的硬性要求；官方写明 Kubernetes 不是 PaaS，没有强制的「应用」对象。ConfigMap 只记边界：[非机密键值](https://kubernetes.io/docs/concepts/configuration/configmap/)，与镜像解耦，上限 1 MiB。机密走 Secret——本页不收 Secret 操作。[CNCF](https://www.cncf.io/projects/kubernetes/)：2016-03-10 入孵化，2018-03-06 毕业。项目文档真身在 kubernetes.io，不在 CNCF 商店或案例页。

## 必须保留的冲突

- `configuration/overview` 现网已改道 2025-11-25 博客；博客 URL 才是真身；Configuration 索引仍停在 2021 且不再列 overview。不把博客升成概念规范。
- ReplicaSet：概念页说「可能永远不必手改」；它仍是一等 API 且可做 HPA 目标，并能收养匹配标签的裸 Pod。
- ReplicationController 概念页仍在，同时标题写 Legacy、推荐 Deployment。
- Workload API（v1.35 alpha，默认关）与内置六种控制器并行，不是替换。
- 静态 Pod 仍写引导用途，DaemonSet 页同时写「未来可能弃用」。
- StatefulSet 示例用 `ReadWriteOnce`，正文推荐生产用 `ReadWriteOncePod`。
- CronJob 可能建 0 或 2 个 Job；`startingDeadlineSeconds < 10` 可能排不上。
- v1.36：`spec.os.name` 不参与调度选点，与「写了 OS 就会落到对的节点」的口语冲突。
- 推荐标签不是核心工具硬性要求。
- 本仓产物门 ≠ 集群工作负载；本页不是上 K8s 工单，也不是已采用编排。

## 例子

- 正例：无状态前端写 Deployment，让它管 ReplicaSet 和滚动。
- 正例：要稳定 DNS 名和卷认领的库用 StatefulSet + 自建 Headless Service。
- 正例：节点日志采集用 DaemonSet；一次性迁移用 Job；每天备份用 CronJob 且任务幂等。
- 反例：手改 Deployment 名下的 ReplicaSet。
- 反例：把发卡 JSON / 工坊 Gateway 写成已经是集群里的 Deployment。
- 反例：把 `/docs/concepts/configuration/overview/` 当现行概念规范引用。

## 边界与易混概念

- 不包括：Secret 创建/挂载/轮换；RBAC 提权；攻防、渗透、集群接管；把本仓迁到 K8s 的实施工单。
- 不包括：Helm chart 市场、云厂商托管控制面——管理页只点名 Helm 为第三方，清单看 CNCF Landscape。
- 易混：Pod ≠ 容器；重启容器 ≠ 重建 Pod。
- 易混：ReplicaSet ≠ Deployment。前者保数量，后者声明式更新并拥有前者。
- 易混：StatefulSet ≠ 「带盘的 Deployment」。身份、顺序、卷生命周期都不同。
- 易混：DaemonSet ≠ 「replicas 等于节点数的 Deployment」。调度语义绑节点，不是水平副本。
- 易混：Job ≠ Deployment。跑完即停 vs 常驻。CronJob 只负责按日程**创建** Job。
- 易混：ReplicationController（遗留）≠ ReplicaSet（现行复制原语）≠ Deployment（推荐入口）。
- 易混：静态 Pod ≠ DaemonSet。前者不经 apiserver，文档同时写「可能弃用」。
- 易混：Workload API（v1.35 alpha）≠ 上表六种内置控制器。
- 易混：gRPC / Connect 是 RPC 合同，见 [[concepts/gRPC与Connect]]，不是 Deployment。
- 易混：StatefulSet 粘性身份 ≠ 多租户切库 / RLS，见 [[concepts/Postgres与多租户]]。
- 区分：先问「要常驻、有身份、绑节点，还是跑完」；再问「这是行业合同还是本仓产品门」。
- 相邻账本不并进本页：网格与 Gateway API 见 [[queries/第四批蒸馏目标]]；镜像合同见 [[queries/第五批蒸馏目标]] B5-OCI；GitOps 见 [[queries/第七批蒸馏目标]]；Helm 专口见 [[queries/第八批蒸馏目标]]。观测入口见 [[concepts/可观测与OpenTelemetry]]、[[concepts/Prometheus与OpenMetrics]]，不是工作负载对象。制品清单见 [[concepts/SBOM与SLSA]]，也不是 Pod。

## 映射到本仓库

工坊目录、发卡 JSON/PNG、Wiki 静态检查都是**产物门**。它们回答「这份东西能不能出」。K8s 工作负载回答「集群里谁来保证副本、身份、节点守护或跑完」。**不要把本页写成工坊要上 K8s 的工单，也不要写成已经采用。**

| 本仓对象 | 实际是 | 不是 |
|---|---|---|
| 创意库项目 / 发卡物 | 源文件 + 回封 JSON/PNG，见 [[50-创意库/README]]、[[concepts/打包回封路径]] | Deployment / Pod |
| 工坊发布审核 | 同步 REST + `pending → approved / rejected / withdrawn`，见 [[comparisons/工坊架构该上与不该上]] | ReplicaSet 保活 |
| Wiki / 蒸馏门 | 来源可定位 + `verify-repo` | Job 完成数 |
| 卡内 iframe HUD | 宿主页挂载，见 [[concepts/入口外壳与HUD宿主]] | DaemonSet 节点守护 |
| 世界书 / MVU | 提示与变量闭环，见 [[concepts/MVU变量闭环]] | StatefulSet 粘性身份 |
| 有状态库 / 多租户 | 隔离切在实例、库、schema 或行，见 [[concepts/Postgres与多租户]] | StatefulSet 网络名与卷认领 |

对照句：星月 / 交错 / 怪谈「已验证稳定」是产品类，不是集群 Ready。交付结果指标见 [[concepts/DORA五项与SLO]]，也不是 Pod Ready。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表，也不新增「本仓应部署 K8s」。

## 来源与证据

权威入口以上表 16 条与 [[queries/第三批蒸馏目标]] B3-K8s 为准。只收 k8s.io 与 CNCF 项目页。

- 层与控制器：工作负载总览、Pod、Deployment、ReplicaSet、StatefulSet、DaemonSet、Job、CronJob。
- 遗留：ReplicationController 概念页仍在，标题写 Legacy。
- 管理与标签：Managing Workloads；Recommended Labels 不是强制。
- `configuration/overview` 现网改道 2025-11-25 博客；Configuration 索引 2021-06-16 不再列 overview。
- CNCF：2016-03-10 孵化，2018-03-06 毕业。文档真身在 kubernetes.io。
- ConfigMap：非机密、1 MiB；不收 Secret 操作。

已知冲突见上节，不静默覆盖。未跑工坊或发卡的 K8s 真机——本来就没有已落地的集群工作负载可验。

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
- [[comparisons/行业架构方案何时用]]
- [[comparisons/工坊架构该上与不该上]]
- [[concepts/C4与ADR]]
- [[concepts/十二因素与CAP]]
- [[concepts/DORA五项与SLO]]
- [[concepts/功能开关与OpenFeature]]
- [[concepts/Redis与日志队列]]
- [[concepts/Postgres与多租户]]
- [[concepts/可观测与OpenTelemetry]]
- [[concepts/Prometheus与OpenMetrics]]
- [[concepts/SBOM与SLSA]]
- [[concepts/gRPC与Connect]]
- [[concepts/打包回封路径]]
- [[concepts/入口外壳与HUD宿主]]
- [[concepts/MVU变量闭环]]
- [[50-创意库/README]]
