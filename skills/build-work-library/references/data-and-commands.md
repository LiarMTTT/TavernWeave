# 资料格式与命令

## 保存权威与环境

Python 3.10+，使用标准库及该 Python 发行版提供的 `sqlite3`；不安装模型 SDK、向量服务或数据库服务。若当前 Python 缺少 sqlite3，报告缺少该模块，换用已具备它的解释器或按授权安排依赖。本工具读写 UTF-8；命令行 JSON 使用 Unicode 转义以兼容 Windows 默认代码页，JSON 解析后的中文不变。

`records/*.md` 是可编辑整理正文；`sources/*.json` 与已冻结的 `.txt` 是来源定位材料；`index/records.jsonl` 和导出的 SQLite 都可从当前资料重建。`.state/` 保存批次、用量、编辑观察日志和中断事务，其中 SQLite 小文件仅用于本地写入互斥，不存事实权威。一次命令检查源指纹并缓存该次读取；不支持人和 Agent 同时改同一文件。

项目目录必须新建且在作品/测试区域，不能位于 Skill 安装目录。原文切分以规范化 LF 文本中的 Unicode 字符位置为准，不是 UTF-8 字节数或 token。标题重号保留，稳定单元按出现顺序编号；长段落有界切分，机器单元数量不代表精读质量或原文章号。

## 初始化与来源

下面命令从本 Skill 目录执行；命令中的文件位置替换为当前已授权的实际路径。

```text
python scripts/work_library.py init --project <新项目目录> --title <作品名称>
python scripts/work_library.py add-source --project <项目目录> --input <source.json> --text <授权正文或网页短摘录.txt> --chunk-chars 6000
```

文本来源 JSON 示例：

```json
{
  "id": "novel-edition-a",
  "kind": "local-text",
  "title": "作品正文",
  "realm": "canon",
  "continuity": "novel-main",
  "edition": "用户选定底本",
  "phase": 0,
  "provenance": "用户提供的原文文件及其版本说明",
  "rights": "仅在当前授权项目内整理，不包含再分发授权"
}
```

`web-text` 额外要求实际页面 `url`、`retrieved_at`；`--text` 是执行者按允许范围保存的核验摘录，不是搜索摘要。`image` 不传 `--text`，额外要求页面 URL、采集时间、`inspection: not-viewed|viewed`、`inspection_ref`、`use: reference-only`；可选记录 `image_url`、作者、许可证、用途、关联角色。实际图片看不到可登记候选但不能提交视觉结论；不得通过伪造 viewed 跳过查看。

`realm` 为 `canon / reference / fanon / unknown`；`continuity` 区分原作、改编线或具体同人分支，`edition` 区分底本/修订。`phase` 是此来源最早可用于创作的知识阶段，未知为 null；本地连续文本再叠加条目出现顺序，所以后文证据不能进入开局。网页/图像的阶段需要实际核对，不按抓取时间猜剧情时间。

来源 ID 一经登记不覆盖。原文、身份或版本变化使用新来源 ID，重新绑定采样计划；不要改冻结文件来让旧引用看似继续成立。

## 样本与计划输入

```text
python scripts/work_library.py benchmark --project <项目目录> --input <sample-report.json>
python scripts/work_library.py plan --project <项目目录> --input <batch-plan.json>
```

样本报告包含 `samples`、`selected` 和 `reason`。每个 sample 包含 `id`、`strategy: sequential|native-subagents`、`source_ids`、`usage`、`unsupported_assertions` 和 `questions`。每个问题有 `question / answer / evidence / pass`；这些是执行者实际采样/核验的记录，工具不自动判定语义真假。

`usage` 格式：

```json
{"calls": 2, "kind": "measured", "input_tokens": 1200, "output_tokens": 360, "provenance": "该样本的真实宿主或 API 用量回执位置"}
```

示例数字只解释格式，不能拿来当实际测量。估算用 `estimated`；不可见用 `unavailable` 且两个 token 字段为 null。真实调用与失败重试都计入 calls。

`benchmark` 返回的 `benchmark_sha256` 必须原样用于计划。计划字段：

| 字段 | 含义 |
|---|---|
| `goal`、`authorization_note` | 用户实际目标与本轮明确授权原话/位置；不能由 Agent 编造授权 |
| `benchmark_sha256`、`strategy` | 精确样本报告与选中策略 |
| `units` | 明确的来源单元，如 `novel-edition-a/u000001`；按登记清单选择 |
| `roles` | 项目专用职责表，键为角色名，值为具体任务边界 |
| `max_batches`、`max_calls` | 本库批次计量的累计上限；更新计划不清零 |
| `calls_per_batch`、`max_units_per_batch` | 单批分配，单批单元数 1–8；按上下文容量选择 |
| `token_limit`、`tokens_per_batch` | 可见 token 时的累计启动门与单批预留；未知则 token_limit 为 null |
| `allow_unmeasured` | 用量无法实测时，用户是否已明确接受只按调用/批次数限制；默认不接受 |

## 批次、资料条目与接续

```text
python scripts/work_library.py next --project <项目目录>
python scripts/work_library.py usage --project <项目目录> --input <attempt-usage.json>
python scripts/work_library.py commit --project <项目目录> --input <candidate.json>
python scripts/work_library.py status --project <项目目录>
python scripts/work_library.py pause --project <项目目录>
python scripts/work_library.py resume --project <项目目录>
python scripts/work_library.py recover --project <项目目录>
```

`next` 返回 batch_id、确切单元、原文片段/图片来源卡、来源哈希、项目角色和已登记尝试；不会发起模型调用。`usage` 在 usage 格式上增加 `batch_id` 与唯一 `attempt_id`。相同 attempt 原样重复提交不加总；不同回执不能复用同一个 attempt ID。已知花费即使超过预算也照记，后续不继续开新批次。

候选包含 `batch_id`、`records`、实际 `review_note`；确实无资料时提供非空 `empty_reason`。每条记录包含：

| 字段 | 含义 |
|---|---|
| `id` | 稳定小写字母/数字/横线/下划线 ID，不用标题拼目录路径 |
| `kind` | character/event/place/faction/rule/relationship/visual/question |
| `name`、`aliases`、`body` | 名称、别名列表、人能编辑的 Markdown 正文 |
| `realm`、`continuity`、`status` | 来源身份、改编/同人线、confirmed/inference/uncertain |
| `known_from` | 最早可以揭示此条资料的知识阶段，未知为 null |
| `evidence` | 必填来源证据数组；悬项也引用其问题上下文 |
| `base_sha256` | 新建时缺省；修改既有条目时必须是当前 Markdown 字节哈希 |

文字证据为 `unit_id / source_sha256 / start / quote`：使用 next 的来源哈希和定位范围，start 是原文全文的 Unicode 字符位置，quote 必须逐字匹配且落在该单元内。视觉证据为 `unit_id / source_sha256 / locator / observation`：来源须已实际查看并带回执。视觉结论的语义真实性由实际查看者核验，本地工具只能检查登记与范围。

跨批次更新人物/专题档案可以原样保留旧条目的证据；新增证据必须来自本批分配单元。重复 batch_id＋相同候选返回 already_committed；不同内容不能冒用已提交批次。引用通过只证明原文存在，review_note 不能代替真实核验。

Markdown 记录由工具生成，顶部是 `tw-work-record:v1` 标记与 JSON 元数据代码块，其后全部是资料正文。人可直接改正文；改元数据时保持 JSON 有效与来源关系正确。人完成编辑后，Agent 读当前正文再重建索引；不从旧索引回写覆盖。

中断写入会留下 `.state/pending.json`。`recover` 在所有待写文件仍匹配前态或目标态时补齐，遇到人的新修改就停止并保留账本。它不是强制覆盖命令；不要手删 pending 来掩盖半批状态。正常执行者互斥自动随进程释放，无法替任意外部编辑器锁住文件。

## 重建、检索与导出

```text
python scripts/work_library.py reindex --project <项目目录>
python scripts/work_library.py query --project <项目目录> --query <人物或问题关键词> --realm canon --continuity novel-main --as-of 3 --limit 20
python scripts/work_library.py export-sqlite --project <项目目录> --out <新导出文件.sqlite>
```

查询读取当前 Markdown，默认保留来源标签；可用 realm、continuity、阶段上限筛选。阶段未知的记录不会进入指定上限的结果。支持关键词/别名匹配，不宣称语义向量检索；Agent 需要组合问题时多次有界查询并回查证据。结果含条目 ID、来源与当前文档哈希，便于二创资料包引用。

`reindex` 重建 JSONL，并记录前后文档哈希；日志标记“观察到变化”，不捏造是谁改了内容。SQLite 导出含 records 和 sources 两表、完整记录 JSON、正文与来源指针，可离线查询；它是当次快照，不是新的编辑权威。目标已存在时拒绝覆盖；无模型也能重建、查询和导出。[Python sqlite3 文档](https://docs.python.org/3/library/sqlite3.html)说明本工具使用的本地数据库接口。
