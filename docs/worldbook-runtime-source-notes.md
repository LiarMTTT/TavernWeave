# 世界书运行合同：交付追溯记录

2026-10-15。本文件用于本次交付复核，不是 Skill 日常加载资料，也不是另一套 API 或运行规范。Skill 正文、入口和配套示例不保留本次预设或作品的来源说明；它们使用独立组织的合同和自写桥梁夹具。本文件保留必要来源身份、静态发现及采用边界，便于审查迁移没有丢掉证据。

## 输入与证据等级

| 输入 | 确定身份 | 此次用途 |
| --- | --- | --- |
| 珠玑预设 | 上传文件名 `【珠矶预设化】V1.71 (1).json`；SHA-256 `f7c3a88836bda71f35353d2193d0db0ec0430d1af275d1e9957bdf6930936e4a` | 只作方法线索与去重复核；以《珠玑预设-逐条整合清单-v2.json》的零基 P 索引定位，P 索引不是世界书 UID |
| 斗罗大陆-KK | 上传文件名 `斗罗大陆-KK (1).json`，来源版本 V3.0 Demo；SHA-256 `d2de21bc259711f984a4163a1f71812ea52460ea1e81e95398dc271ae4f8986d` | JSON 解析及代码字符串阅读，提出跨组件待验问题 |
| 已完成的只读报告 | 《斗罗大陆-KK-进阶世界书配置拆解.md》，2026-10-15 | 复核目标映射、消息窗口、状态链、投影和预算；报告未作为可运行实现迁入 |

用户未获得预设作者许可，本次只允许方法启发；不得搬入其独特段落、模板、书摘或代码。新增合同按既有 TW 职责重新组织，桥梁、水位、外港、章节与预算数据均为自写例。这里的标题、标识和最小目标名称只用于追溯，不主张第三方材料的许可或所有权，也不构成法律保证。没有随补丁附上完整预设、角色卡、原始报告或远程脚本。

只读解析确认源卡内嵌 526 条：26 条启用，其中 18 条常驻、8 条非恒定；启用条目中 6 条含 EJS。四个选择控制器与一项状态投影提供了静态研究线索。计数、启用标记、脚本存在及结构合理均不是运行证据。本次未导入酒馆、未执行卡内脚本/模板/正则、未执行远程依赖、未调用模型；真实运行与模型行为仍为 `not-run`。

## E03：从源卡疑问到官方固定源码

- `/data/character_book/entries/363`（ID 692109）、`399`（ID 762363）、`417`（ID 796517）包含按角色读取聊天的调用形态：`getChatMessages(-1, 'user')` 与 `getChatMessages(-1, 'assistant')`，后续对返回数组再取末尾若干项。不能据后续切片或注释把前面的 API 解释成“最近三条”。
- 固定模板修订 `ada54bb22e3dab0a07e473d383b4c2fe40bc6573` 的 [chat.ts L67–112](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/function/chat.ts#L67-L112)在第二参数为角色字符串时先过滤角色，再 `slice(-1)`，最后处理文本；单参 `(-1)` 则对全部聊天切片。这只解释该模板修订和这些参数，不解释助手同名 API，也不证明源卡作者安装了该修订。
- 源卡 MVU 加载器位于 `/data/extensions/tavern_helper/scripts/0`（ID `c957f8b2-888a-40f9-b5d8-3204dc1023bf`）；schema 注册器位于同数组 `1`（ID `bcf4884f-325c-472e-a05b-1a333297ad26`）。二者使用未固定修订的远程依赖。具体框架、注册器、Zod 版本和成功就绪均未核验；不把固定官方快照追认成这些加载器的实际版本。
- 旧拆解报告读取的 API 文档 blob SHA `cca1501847e15c4d609e4e570b5c8f3b40307784` 是文件标识，不是仓库提交。本次以可定位的固定源码补充窄结论，保留这个区别。

宿主、模板、助手、MVU 的官方来源及许可边界继续留在 [E03 版本核验](../skills/sillytavern-api-reference/references/worldbook-version-verification.md)和 [core-facts](../skills/sillytavern-api-reference/references/core-facts.md)，作为技术核验资料；它们不携带上述作品追溯。E03 的日常例子将角色参数称为“本例选择的调用形态”，并明确目标宿主尚未实测。

## E05：保留的静态缺口与通用落点

以下索引均指源卡 `data.character_book.entries` 的零基位置；ID 是该条目的原始标识，只供复核，不用于自写夹具。

| 位置 | 静态发现与限制 | 通用合同落点 |
| --- | --- | --- |
| 399 / ID 762363 | 字面目标 `[斗二]-设定-魂核凝聚规则` 在内嵌条目中无精确同名项；外部书能否补齐未确认 | 缺失、外部待核对与外部已核对分开 |
| 363 / ID 692109 | 地点/势力路由包含“星斗战网”等目标，而素材归于设定类别；不等于素材完全不存在 | 类别、别名、稳定身份和目标位置分别校验 |
| 113 / ID 232196；初值 119 / ID 237405 | 章节判断排除“待初始化”，初值章节却是“未开始”；特殊年表路径后仍构造另一动态名称 | 统一初始化哨兵；只允许有效时代/时期/章节组合 |
| 417 / ID 796517 | 人物别名路由与其他选择器独立运行，精确名称展开存在不匹配；不能从文本提及推定实体在场 | 类型化别名、目标枚举和明确状态优先级 |

开局写入位置 `/data/extensions/regex_scripts/13/replaceString`（ID `396330c2-0a28-419c-82e6-c88b071957f3`）只写时代和章节，未同步时期；写入失败分支后调用方仍准备发送/生成。世界书控制器 `/data/extensions/tavern_helper/scripts/2`（ID `5f43d13f-a087-41c0-89ec-da3d70595a2f`）写 latest message，而开局可能写当前消息。静态结构提示需检查同一消息/候选、写入确认与后续消费，不能直接断言目标环境已发生错读。

另有 UI 脚本 `/data/extensions/tavern_helper/scripts/4`（ID `598b7be8-3205-48cb-9376-1edfe68b18b9`）使用 `玩家/女性NPC/男性NPC`，主 schema 与初值使用 `主角信息/NPC列表`。没有适配证据时，这是跨组件字段合同缺口；不据此宣称核心章节 EJS 全部失效。

[E05 目标与状态合同](../skills/sillytavern-database-rolecards/references/worldbook-target-state-contract.md)用自写桥梁/外港/章节反例表达这些通用检查，不携带源作品人物、目标名或真实索引/ID。字段账本、初始化、迁移和唯一写入者仍由原有技能负责。

## E06：投影与跨入口预算的边界

源卡 452 / ID 862183 先读取状态并深拷贝，再对副本折叠离场模块、输出模型视图。`delete` 在该路径上操作副本，不能称为删除底层存档。其空值判断将 0/false 视作无实质数据，具体风险是模块已隐藏而折叠提示也不出现；不能把空值判断单独解释成存档删除条件。

四个控制器的局部别名集合、多个独立条件和 `ignore_budget=false` 不构成最终请求已统一去重或预算受控的证据。原生入口与模板读取的交界、最终分词与必要内容超额仍需实际请求验证。

[E06 输出预算](../skills/sillytavern-rolecard-performance/references/worldbook-output-budget.md)采用独立的内容身份仲裁合同及 `archivedModule` 自写数据，区分持久状态与只读投影，保留 0/false 的语义。没有移植源卡算法、条件表或脚本。

## 预设线索与既有职责复用

下列仅是本组 E03/E05/E06/E07 的必要追溯子集，完整逐条状态仍以[交付采用表](dual-task-adoption.json)为准。名称不再写入日常技能；identifier 与 P 索引用于识别同一输入，不表示整段内容获得采用。

| P 索引 | 原始 identifier | 本组处理 |
| --- | --- | --- |
| P058 | `3ceb57f1-8fc2-4620-a767-4f5dec313343` | 信息选择线索；E06 独立定义预算边界 |
| P059 | `d021d3b4-08cc-4f03-9533-652cda89f10b` | 复用正则处理 owner，不另写教程 |
| P060 | `a0c7da7d-d719-4ab3-973a-36b0b07b2579` | 复用 API owner；E03 只补核验链 |
| P061 | `64a559d6-1422-4297-9d9b-a17dbe2e8b49` | 仅作可调整、非独占场景线索；不搬模板 |
| P062 | `39a6ef9d-f4e4-4c3b-9b8b-87ed2a3209b0` | 复用 runtime-debug；E07 只补隔离合同 |
| P063 | `81c4a3bf-980d-4517-b4af-06e13f12e5fd` | 格式、导出及 ID 保护复用 owner，预算交 E06 |
| P064 | `399f98bd-0bfb-4e72-881c-0086099f4a6b` | 只取信息选择问题，不采用固定位置配方 |
| P065 | `4bf7935c-04a5-4439-9c7a-60a32a8fee29` | 复用 variable-systems §1/5/6 |
| P066 | `97e54e0b-80f5-4c18-8838-1525faae8e2a` | 复用 variable-systems §1/5/6 |
| P067 | `baf12b8d-ba7d-4ea3-89e3-8d3a4efeb171` | 复用 variable-systems §3/4/6 与 API 交付边界 |
| P068 | `52cf6da7-01e0-45ac-8b89-e567f46ac34a` | 复用 variable-systems §3/4/6 与 API 交付边界 |
| P088 | `bb9bb9b7-3b3d-4b1a-8eb9-0a23ed3d799d` | 复用 variable-systems §2/3 |
| P089 | `54bb0739-c20b-4937-908c-13a58a02fda2` | 复用 variable-systems §4 |
| P090 | `4c520657-a4b7-460f-95cf-96c1931c4cdc` | 复用 variable-systems §1/5 |
| P091 | `ab3873d5-addb-4c35-bfc7-2930c328e4a4` | 复用 variable-systems §5/8 |
| P092 | `91aaf23e-caa0-4fbc-88c8-79d081dc6a09` | 复用卡类型 §5–8、variable-systems §6/7 |
| P093 | `781cb01d-bc3b-49e5-9a49-3f23414b85f2` | 复用 variable-systems §2–6 |
| P094 | `fb0a625b-afa6-4d27-abd3-f45a48cec61f` | 复用 variable-systems §1/3/6 |
| P095 | `8c14b5b6-e2b2-4d99-b31a-058a0df17fd8` | 复用 variable-systems §4/6 |
| P096 | `4c52e88d-7749-46c7-ad04-004068618beb` | 复用 variable-systems §5/8 |
| P099 | `4b26ee27-58af-458d-a698-7f88f2a40e5e` | 场景独立改写，实际函数以目标版本核验 |
| P143 | `9f0c7363-3af8-4da6-9b12-693157b5a0e8` | 只作世界书输出问题线索；E06 不搬原格式模板 |

上述章节见 [variable-systems](../skills/tavern-card-builder/references/variable-systems.md)与[卡类型/依赖](../skills/tavern-card-builder/references/card-types-and-runtime-dependencies.md)。本组不采用固定顺序、品牌绑定深度、关键词数量配额、六模板独占或原生递归方案；没有从 P049–P051 提取内容。

## E07：验收产物不升级为运行证明

[隔离检查](../skills/sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md)、自写 JSON 夹具、空白观察记录和结构校验器均不读取或执行上述原始材料。Node 测试使用合成结构，只能验证设计规则与记录边界。真实宿主、最终请求、状态回写、下一轮消费和模型行为仍分别待验。

`runtimeBlockers` 与 `modelBlockers` 保持独立：运行组装通过而模型等待授权是合法记录；不能删除模型阻塞以换取结构通过。空白记录继续保留 `not-run` 和空观察值。迁移来源说明未更改这一校验逻辑。
