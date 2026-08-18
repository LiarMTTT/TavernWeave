---
title: DORA五项与SLO
created: 2026-08-14
updated: 2026-08-14
type: concept
status: active
tags:
  - wiki
  - concept
  - research
  - tooling
sources:
  - https://dora.dev/guides/dora-metrics/
  - https://dora.dev/insights/dora-metrics-history/
  - https://dora.dev/research
  - https://dora.dev/quickcheck/
  - https://sre.google/sre-book/table-of-contents/
  - https://sre.google/sre-book/service-level-objectives/
  - https://sre.google/workbook/table-of-contents/
  - https://sre.google/workbook/implementing-slos/
  - https://sre.google/workbook/slo-engineering-case-studies/
  - https://sre.google/workbook/alerting-on-slos/
  - https://sre.google/resources/book-update/slos/
knowledge_class: factual
---

# DORA五项与SLO

本页不是已采用 KPI，也不是本仓库已落地的仪表盘。检索日 2026-08-14。账本来自 [[queries/第三批蒸馏目标]] B3-DORA 与 [[queries/第二批蒸馏目标]] B2-Book。

## 一句话定义

DORA 五项是软件**交付结果**的吞吐与不稳指标；SLO 是用户可感知可靠性的**目标值**。两套东西相邻，不是同一张表。

## 为什么重要

团队需要能对照、能改进的交付结果，也需要能做取舍的可靠性目标。DORA 用五项预测组织绩效与成员福祉；SRE 用 SLI / SLO / 错误预算决定先做功能还是先补可靠。本页只收官方入口，不把它们写成工坊或发卡已经在跑的 KPI。

## 如何运作

### 现行五项（不是四键）

[DORA 指南](https://dora.dev/guides/dora-metrics/)（2026-01-05）写明现行是**五项**，从最初四键演到现在。按吞吐 / 不稳分组：

| 因子 | 指标 | 量什么 |
|---|---|---|
| 吞吐 Throughput | Change lead time | 提交进版本控制 → 部署到生产 |
| 吞吐 | Deployment frequency | 一段时间内的部署次数，或两次部署间隔 |
| 吞吐 | Failed deployment recovery time | 一次需要立刻干预的失败部署，恢复要多久 |
| 不稳 Instability | Change fail rate | 部署后必须立刻干预（回滚 / hotfix）的比例 |
| 不稳 | Deployment rework rate | 因生产事故而做的**计划外**部署比例 |

研究结论：速度与稳定长期不是互斥；高绩效组五项都好，低绩效组五项都差。指南要求按**单个应用或服务**量，不要把多团队、多系统揉成一个组织分去比。

[演变史](https://dora.dev/insights/dora-metrics-history/)（2026-01-02）：2014 先试四变量，当年变更失败率未并进同一潜变量；2015 才定吞吐 / 稳定对偶；2018 另加可用性，改称 SDO，交付核仍是四键；2021 可用性扩成可靠性，年报曾误把可靠性叫「第五项」——史文明写那是**运营绩效**，不是交付第五项；2023 把 MTTR / 恢复服务时间改成 Failed deployment recovery time，只覆盖**变更引起**的损伤，不含机房停电这类外因；2024 才把 Deployment rework rate 加成交付第五项。恢复时间现在算吞吐，不再跟旧 MTTR 一起算稳定。

年报入口只记 [dora.dev/research](https://dora.dev/research)。Core Model 故意落后于当年分析。自测入口 [Quick Check](https://dora.dev/quickcheck/) 现为五题，不存答案。

### SLO 专章（只收官方 HTML）

SRE 本页只收书中 SLO 专章与 Workbook 相关章，走 [sre.google](https://sre.google/sre-book/table-of-contents/) 合法 HTML（CC BY-NC-ND 4.0）。不收盗版 PDF，不把整本 SRE / Accelerate 当本页正文。

[书第 4 章](https://sre.google/sre-book/service-level-objectives/) 三分：

- **SLI**：某方面服务水平的定量指标（延迟、错误率、可用性 / yield、耐久）。
- **SLO**：该 SLI 的目标或区间。问「没达到会怎样」若无约定后果，多半只是 SLO。
- **SLA**：含后果的合同（退款、处罚等）。SRE 通常不写 SLA，但要帮着避免触发后果。

[Workbook 第 2 章](https://sre.google/workbook/implementing-slos/) 把 SLI 写成 good / total；错误预算 = `100% − SLO`。100% 不是合理目标：用户链路本身不满 100%，且变更是故障主因。没有经批准的 SLO、没有错误预算政策，SLO 只是又一个汇报数字，不是决策工具。同书第 3 章是案例，第 5 章把 SLO 收成告警（推荐多窗口多燃烧率）。官方索引：[SLO 专章入口](https://sre.google/resources/book-update/slos/)。

## 例子

- 正例：对**一个**生产服务量五项，用 Quick Check 或对话定基线，再改最紧约束。
- 正例：首页「100 毫秒内成功返回的请求 / 全部请求」作 SLI，SLO 99.9%，四周错误预算用来决定能不能发大功能。
- 反例：下令「年底每应用每天必须部署多次」——指南点名这是把指标当目标（Goodhart）。
- 反例：把手机壳与大型机、或把发卡 JSON 与工坊 Gateway 揉成一个 DORA 分。
- 反例：`verify-repo` 绿、或工坊 `approved`，写成 Change lead time / Change fail rate 已落地。

## 边界与易混概念

- 不包括：盗版 Accelerate / SRE PDF；攻击演练；把年报 PDF 镜像进 Vault。
- 不包括：本仓库已实施的 DORA 仪表盘或 SLO 燃烧告警——**没有这回事**。
- 易混：四键（旧交付核）≠ 2021 误称的「第五项可靠性」≠ 2024 起的交付五项。
- 易混：MTTR / 恢复服务时间 ≠ Failed deployment recovery time。后者只覆盖变更引发、需立刻干预的失败部署。
- 易混：Change fail rate ≠ Deployment rework rate。前者是失败部署占比，后者是事故触发的计划外部署占比。
- 易混：DORA 五项 ≠ SLO / SLI / SLA。前者是交付结果；后者是用户体验目标与合同。
- 易混：错误预算 ≠ 产品发布门。预算管可靠性与功能的取舍；发布门管「这件东西能不能出」。
- 区分：先问「在量交付过程还是用户体验」；再问「有没有合同后果」；最后问「这是研究指标还是本仓产品检查单」。

## 映射到本仓库（产品门 ≠ DORA 五项）

发卡发布门、工坊审核门、Wiki 静态门都是**产品门**。它们回答「这份产物能不能出」。DORA 五项回答「这个应用的交付过程快不稳不稳」。**不要把 DORA 写成工坊 KPI 已落地。**

| 本仓门 | 实际在验 | 不是 |
|---|---|---|
| 发卡发布门 | 真机导入 SillyTavern：能进、世界书能加载、首条正常、已声明扩展能起。见 [[50-创意库/README]]、[[concepts/打包回封路径]] | Deployment frequency / Change lead time |
| Wiki / 蒸馏门 | 来源可定位 + `verify-repo`。知识摄入不套真机 | 五项里的任何一项 |
| 工坊发布 / 审核门 | 状态机 `pending → approved / rejected / withdrawn`；公开列表只出已批准。见 [[comparisons/工坊架构该上与不该上]] | Change fail rate、SLO、错误预算 |
| 打包回封 | compose / pack / 嵌入对账；创意库 `allow_release: false` 不产出发卡物 | Failed deployment recovery time |
| 卡内 fail closed | 宿主契约失败则停，不是燃烧率告警。见 [[concepts/创意工坊与安全契约]] | Workbook 第 5 章的 SLO 告警 |

对照句：星月 / 交错 / 怪谈「已验证稳定、可有已知 bug」是产品类，不是 SLO 未破。工坊同步 REST 与审核状态机是已用后端形态，不是 DORA 采集管线。行业「何时用」仍看 [[comparisons/行业架构方案何时用]]，本页不改那张表。

## 来源与证据

权威入口 11 条（6–12 范围内）：

1. [DORA 五项指南](https://dora.dev/guides/dora-metrics/) — 现行定义、分组、误区。
2. [五项演变史](https://dora.dev/insights/dora-metrics-history/) — 四键 → 五项；MTTR 改名；2021 误称。
3. [年报与 Core 入口](https://dora.dev/research) — 只记此入口，不镜像各年 PDF。
4. [DORA Quick Check](https://dora.dev/quickcheck/) — 五题自测。
5. [SRE 书目录](https://sre.google/sre-book/table-of-contents/) — B2-Book 合法总入口。
6. [书第 4 章 SLO](https://sre.google/sre-book/service-level-objectives/) — SLI / SLO / SLA。
7. [Workbook 目录](https://sre.google/workbook/table-of-contents/) — 只从这里进专章。
8. [Workbook 第 2 章](https://sre.google/workbook/implementing-slos/) — 错误预算配方。
9. [Workbook 第 3 章](https://sre.google/workbook/slo-engineering-case-studies/) — 案例，不是规范。
10. [Workbook 第 5 章](https://sre.google/workbook/alerting-on-slos/) — 按 SLO 告警。
11. [官方 SLO 专章索引](https://sre.google/resources/book-update/slos/) — 书 + Workbook 合法汇总。

已知冲突（不静默覆盖）：

- 现行五项 vs 大量旧文、培训、工具仍写四键。
- 2021 年报把可靠性叫「第五项」；史文与 2024 模型都否定它是交付第五项。交付第五项是 2024 的 Deployment rework rate。
- 2023 起恢复时间只覆盖变更失败；旧 MTTR 覆盖更宽。
- 恢复时间：2015 模型在稳定侧，2026 指南在吞吐侧。两边按年份留。
- 2024 年报 PDF 在 [research](https://dora.dev/research) 下仍有「four keys」残留句，同时正文已出现五项因子表。以指南 + 演变史为现行定义，年报按年引用，不删 PDF 里的旧句。
- DORA 五项与 SLO 不是同一套指标；错误预算不是发卡 / 工坊发布门。
- SRE 只收官方 HTML 专章。Accelerate 纸书与盗版 PDF 不进本页。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 `SCHEMA.md` 的 Tag Taxonomy
- [x] 已发布到正式区，并同步 `index.md` 与 `log.md`

## 相关内容

- [[queries/第三批蒸馏目标]]
- [[queries/第二批蒸馏目标]]
- [[concepts/后端架构名词与工坊对照]]
- [[comparisons/工坊架构该上与不该上]]
- [[comparisons/行业架构方案何时用]]
- [[concepts/打包回封路径]]
- [[concepts/创意工坊与安全契约]]
- [[50-创意库/README]]
