---
name: reflect-on-vibe-code-growth
description: Reassess a user's complete Vibe Code capability network from currently available Codex, Chat, project-state, and delivery evidence; produce both a detailed standalone text assessment form and a seven-part interactive Vibe Code 成长历程 report; compare only genuinely comparable dimensions with prior immutable mirror records; and optionally save an append-only local history. Use when the user says 照镜子, 分析我的 Vibe Code 成长历程, 再次核验成长, 和上次履历比较, 保存照镜子履历, 从上一次履历继续分析, 只要文字评估, or 导出文字评估表单. Keep exact measurements, user reports, estimates, behavior-evidence scores, and unverifiable claims separate.
---

# 照镜子 · Vibe Code 成长历程

把当前可用证据整理成一次新的完整能力评估，并在用户明确要求保存时追加为不可改写的本地履历节点。上一次履历只是一份历史证据，不是本次评分锚点、能力上限、固定分母或永久量表。

## 恢复证据边界

先读取当前任务可访问的项目权威、Git/工作树、交付物、验证回执和用户授权的 Codex/Chat 记录。记录每个来源的实际观察窗口与缺口，不虚构不可访问的时间段。

默认只保存脱敏摘要、指标、证据引用和判断，不保存完整原始聊天、私有日志、凭据、密钥、Cookie、会话材料或未脱敏内容。若用户只要求分析，不要擅自创建本地履历。

把每条证据明确标成以下一种：

- `exact`：由可复算导出、文件、哈希或机器记录直接得到；
- `user-reported`：用户自报，保留原始口径说明；
- `phase-estimate`：阶段估算，写明假设和误差；
- `behavioral-evidence-score`：基于行为证据的评分，不冒充精确测量；
- `unverifiable`：当前证据无法核验。

Chat 没有统一精确 Token 导出时，不得用可见字符换算 Token，不得把 Chat 与 Codex Token 直接相加。只有具名官方导出且口径一致时才能标为 `exact`。

## 重新评估完整能力网络

每次再次核验都从当前证据重新评估，不从旧分数向上或向下“续算”。至少审查：

1. 决断力；
2. 纠错能力与反应速度；
3. 学习速度与跨域迁移；
4. 驾驶同步率与持续校准；
5. 产品定义与架构；
6. 验收证据与交付；
7. Token 经济性；
8. 项目组合与可持续性；
9. 深度思考能力：社会议题、未来展望、现实观察反馈、项目结构、规划与技术讨论中的问题分层、因果链、反例和观点修正；
10. 上游架构能力：自研架构、理解和运用外部架构、抽象稳定约束、决定下游接口与把架构落成权威或工作流；
11. 创新能力：改造既有项目、复用轮子、优化升级、跨域组合、吸收参考素材后形成新结构或新体验。

不要重复计分：深度思考评价讨论过程与现实反馈，不等同于学习速度；上游架构评价能否定义和约束下游，不等同于一般系统理解；创新评价素材的吸收转化和可验证改造，不以新奇命名、参考文件数量或开坑数量代替真实创新。

允许发现新维度、合并或退役旧维度。为每个当前维度保存稳定的 `dimensionId`、`confidence`、`scoringMethod`、证据引用和当前分数或不可评分原因。评分是当前窗口的行为证据判断，不是未来能力上限。

对项目完成度分别报告：定义、实现、自动验证、构建/封装、人工验收、发布/在线回读。不得以任一前置门冒充后续门。

## 执行再次核验协议

读取上一节点前，先运行历史校验：

```bash
node scripts/validate-mirror-record.mjs --root <照镜子履历根目录>
```

若哈希不符、索引漂移、前序缺失、游离节点或量表映射不完整，停止连续性结论并报告损坏；不得悄悄从零开始。

比较时遵守：

1. 旧节点保留当时分数、量表和证据窗口，不回写历史。
2. 先重新评估当前完整网络，再查看差异。
3. 审查旧证据是否仍有效、是否需要重验，但不让历史高分锁死当前判断。
4. `rubricVersion` 变化时必须提供维度映射。
5. 只有量表、含义和评分方法可比的维度才计算数值 `delta`。
6. 合并、退役或量表变化项标记“量表变化，不直接比较”，不得强算。
7. 报告同时展示历史轨迹、当前重新评估和可比变化。

结构化履历遵循 [mirror-record.schema.json](references/mirror-record.schema.json)。

## 生成报告与保存履历

默认执行双轨输出：

1. 先在回复正文给出一份可独立阅读、复制和保存的完整 Markdown 文字评估表单；
2. 再以 [vibe-code-growth-report.html](assets/vibe-code-growth-report.html) 生成七章交互报告：精简总表、能力网络、四项核心、Token 经济、项目达成、历程、结论。

交互报告沿用“Vibe Code 两月能力驾驶舱”原始画板的视觉语法：紧凑标题与口径图例、轻量章节按钮、安静表格、核心—能力簇—维度的层级网、选中节点详情、横向分配条、项目完成表、时间线和双栏结论。不要套用 TavernWeave 新手教程、侧栏课程、章节阅读器或宣传落地页外壳。所有核心、能力簇和维度节点都必须是完整命中区域的原生按钮，支持鼠标与键盘选择；不得用只有圆形局部可命中的 SVG 分组伪装成整颗可点击节点。

两种输出必须来自同一份结构化记录，证据边界、分数、项目门和结论不得互相漂移。不得只给一组短卡片或一个 HTML 路径来替代完整文字判断。

用户说“只要文字评估”“输出单份文字评估表单”时，运行 [render-text-assessment.mjs](scripts/render-text-assessment.mjs) 或按同一格式直接输出一份连续 Markdown；不强制生成画板，也不要把文字拆成多份附件。用户只要画板时可以省略正文长表，但画板仍要保留查看、复制和导出完整文字评估的入口。

文字评估至少包括：结论先行、证据边界、完整能力网络、四项核心、Token 经济、项目六道门、成长历程、历史可比变化、下一阶段建议和最终判断。每个主要能力都要呈现“当前判断—证据—限制—下一步”，不能压缩成只有分数和一句标签。

交互模板必须由当前记录数据驱动，不得把任何用户的具体 Token、评分、项目或首份报告数字写成默认值。画板的信息密度应与文字评估对齐：精简总表之后仍需保留完整维度表、证据展开、六门项目状态、历史映射和行动协议，不能用装饰性大卡片吞掉实质内容。

报告中的“导出 HTML”“导出 JSON”和“导出文字评估”只产生便携副本。权威本地保存必须由脚本完成：

```bash
node scripts/save-mirror-record.mjs \
  --root <照镜子履历根目录> \
  --record <当前评估草稿.json> \
  --template assets/vibe-code-growth-report.html
```

脚本会验证现有链，确定性生成单份 `assessment.md`，计算 record/report/assessment SHA-256，创建新的 `records/<recordId>/record.json`、`report.html` 和 `assessment.md`，再原子更新 `index.json` 与 `latest.json`。它拒绝覆盖既有节点、拒绝敏感字段、拒绝断链，并在量表变化时验证映射。旧版节点没有 `assessment.md` 时仍按原哈希规则只读验证，不得回写补档。

保存后再次运行校验脚本，并返回绝对路径、record/report/assessment 哈希和前序关系。不要把 `.private` 履历、完整对话或用户具体能力数字加入公开 Skill 源码。

## 交付

返回：

1. 当前证据窗口、来源类别和不可核验缺口；
2. 完整能力网络与四项核心判断；
3. 分层项目达成、Token 经济与可持续性；
4. 历史轨迹、当前重新评估、可比变化和量表变化项；
5. 单份文字评估、交互报告与结构化记录路径；
6. 自动验证、未执行的真实宿主/新任务发现/安装/人工验收/提交/发布门；
7. 下一条明确验收或再次核验指令。
