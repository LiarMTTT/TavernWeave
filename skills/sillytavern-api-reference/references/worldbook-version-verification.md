# E03：世界书版本核验链

这里补充世界书从入口到最终请求的核验记录，沿用 [API 核验流程](../SKILL.md)与[公开导航基线](core-facts.md)，不新增 API 层，也不提供可直接装入酒馆的代码。目标运行版本未知时，可以查固定源码、编写静态夹具，但不能把示例标为“可运行”。

## 先记录实际链，再选最小探针

1. **宿主与配置**：识别 SillyTavern 版本/commit、请求接口、当前卡/书绑定、相关开关及原生递归关闭状态。不能从导出条目推定全局设置。
2. **所选扩展**：记录 ST-Prompt-Template 和实际参与的助手、MVU、Zod/注册器版本、来源、执行上下文、加载/就绪证据。纯文字或原生用例不为测试强装扩展；浮动 Git/CDN URL 记为“未固定”，不以下载或 HTTP 成功证明执行。
3. **入口与 API**：逐项记录入口阶段、可达前提、符号、参数/返回值、变量作用域、消息窗口、缓存生命周期、处理顺序、目标缺失或禁用时的行为，以及预算边界。只查用例实际依赖的部分。
4. **固定权威**：查找与目标版本匹配的文档、实现和声明；来源有冲突时记录差异。源码能证明该修订的实现，不能证明用户已安装该修订，或跨扩展时序已在目标环境成立。
5. **隔离探针**：每次只验证一个契约，使用自行编写、不含远程依赖的材料。按 [E07](../../sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md)取得环境/操作授权后，观察入口→条件→读取→输出→最终请求，必要时比对前后状态。提示预览不自动授权模型调用。
6. **结论**：分别给出源码结论、目标环境观察、最终提示证据、模型行为结果及阻塞原因；只在适用版本和执行上下文下发布已实测示例。

每项记录复用项目现有依赖/证据账本，最少包含：`checkId`、依赖及交付类别、目标版本/commit、来源 URL 与路径/行、入口与上下文、输入/预期、实测结果/证据、状态、下一步。缺版本填 `unknown`，未执行填 `not-run`，不能用空白表示通过。

## 本次来源核验记录（2026-10-15）

以下为公开源码只读核验，沿用已有固定导航基线；不宣称最新版本。**用户目标宿主、扩展版本、配置和运行环境均未核验；本表没有任何 runtime pass。** 本次没有执行宿主脚本或远程依赖。

| ID | 固定来源与已读位置 | 本次可确认的窄结论 | 目标环境仍需验证 |
| --- | --- | --- | --- |
| V-HOST | [SillyTavern package.json](https://github.com/SillyTavern/SillyTavern/blob/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8/package.json) | 此修订声明 1.18.0 | 安装版本、请求接口和最终组装路径 |
| V-TEMPLATE | [模板 manifest](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/manifest.json) | 此修订声明 1.17.4.3 | 实际版本、开关、上下文与各入口是否可达 |
| V-HELPER | [助手 manifest](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/manifest.json) | 此修订声明 4.8.19 | 是否参与用例、安装版本与目标 frame 的暴露能力 |
| V-MVU | [MVU 固定快照](https://github.com/MagicalAstrogy/MagVarUpdate/tree/b42817925d0391c15fa242a8238d2bbe28eb6319) | 仅核对已有导航修订可读；不据 package 版本推断发布身份 | 所用加载器对应修订、注册器、Zod 来源/版本、就绪与持久化均未核验 |
| V-READ | [worldinfo.ts L212–275](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/function/worldinfo.ts#L212-L275)，[ejs.ts L321–355](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/function/ejs.ts#L321-L355) | 此路径没有按 `disable` 过滤；读取先找条目，再处理正文；未命中返回空字符串。名称比较还含匹配分支，不能把字符串名称当作绝对精确寻址保证 | 禁用目标能否被实际读到、最终输出、重名/特殊字符、外部书绑定与返回值 |
| V-WINDOW | [chat.ts L67–112](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/function/chat.ts#L67-L112) | 此模板快照的单参 `getChatMessages(-1)` 对全部聊天 `slice(-1)`；本例选择的 `getChatMessages(-1, 'user')` / `(-1, 'assistant')` 调用形态则先按角色过滤，再各自 `slice(-1)`，最后处理消息文本。因此分别取最后一条对应角色消息，不能称为最近三条。结论严格限定这些实参和模板快照，不移用助手同名 API；本例尚未经目标宿主实测 | 实际窗口、角色过滤、处理后的文本和目标版本差异 |
| V-STATE | [variables.ts L36–64](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/function/variables.ts#L36-L64)，[L398–500](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/function/variables.ts#L398-L500) | 此源码区分缓存与指定作用域，读取受消息/候选上下文和缓存刷新条件影响；缺失默认值不是初始化哨兵归一化 | 写入者、模板读取者、UI与下一轮是否读取同一消息/候选；不同入口是否误用旧缓存 |
| V-ENTRY | [handler.ts L76–132](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/modules/handler.ts#L76-L132)，[L975–987](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/src/modules/handler.ts#L975-L987) | 此实现有独立世界书预处理入口与其他生成/渲染处理器；不能把某一入口的顺序当作所有入口的全局顺序 | 选定入口真正到达、条件执行、后续原生选择和目标请求中出现 |
| V-BUDGET | [features_cn.md 的预算说明](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/docs/features_cn.md#L450-L460) | 此版本文档提示显式引入内容与宿主预测计数存在边界；`ignore_budget=false` 不能证明模板输出已按全局预算裁剪 | 实际最终请求的去重、分词及溢出处理，交 [E06](../../sillytavern-rolecard-performance/references/worldbook-output-budget.md) |

这些来源只用来定位事实，不复制上游教程或实现。相关项目的许可边界沿用 core-facts。源码中的原生递归示例不属于本次采用方案；TW 保持关闭原生递归的既定政策，不借版本核验更改用户卡配置。

## 按项目能力选待验问题

- 多个选择器分别使用章节、规则、实体别名时，逐项验证目标身份、入口可达性及实际输出；字段与目标完整性归 [E05](../../sillytavern-database-rolecards/references/worldbook-target-state-contract.md)。
- 使用禁用资料或状态投影时，分别验证实际读取、最终请求与存储前后；文件中存在初值、加载器或界面，不证明初始化、注册或消费闭环已成功。

API、排错和变量相关工作仍交给各自负责的技能；场景分类可以重叠，也可以调整。函数禁令、固定顺序、品牌绑定深度、六模板独占均不是证据。确认目标版本后才能给出精确函数实现，不向纯文字项目强加这些检查。
