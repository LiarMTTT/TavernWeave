# Tavern Cards 社区问答教程（供作者审阅）

这份整理稿写给 [ai4rpg/tavern-cards][repo] 的使用者。问题来自 2026-05-22 到 2026-09-24 联动帖里能读到的讨论，约 7,350 条消息；重复的提问和接连的追问已经合并，闲聊、短期的模型排名和服务商价格没有写进教程。

**答案以该仓库 2026-09-18 的 [e28fb56][snapshot] 快照为准。** 文中没有拿 Discord 消息链接当答案，这份文档也还没有经过作者审定。

## 先对几个词

| 原词 | 大白话 |
| --- | --- |
| Coding Agent | 能读写项目文件、跑命令的 AI 工作客户端 |
| Skill | Agent 按任务读取的工作说明 |
| 子代理 | 主 Agent 在特定步骤叫来帮忙的分工助手 |
| forge | 仓库自带的离线打包／解包命令行工具 |
| state | forge 的项目登记文件，比如 `tavern-cards-state.json`，记着项目里有哪些条目、开场、正则和配置 |
| 世界书 | 满足条件时，把设定塞进提示词的条目集合 |
| MVU | 一套让模型在回复里顺带更新变量（好感、地点、进度等）的方案 |
| schema／Zod | 规定变量有哪些字段、是什么类型的格式定义 |
| EJS | 一种模板写法，能按变量决定哪些世界书内容发给模型 |
| 正则 | 按规则找文本并替换，常用来挂状态栏或改显示效果 |
| 楼层 | 聊天记录里的一条消息 |
| 成品 | forge 打出来、可以导入酒馆的 JSON 或 PNG |

本文说“能导出”，只表示离线检查通过了。真的导进 SillyTavern（下称 ST）玩起来有没有问题，要另外在你的 ST 里试。

## 一、先安装，再完成第一张卡

### Q01. 这是“一句话自动出卡”的软件吗？我不会写代码能用吗？

**A：** 不是一句话就能出卡。它是给 Coding Agent 用的三套 Skill，外加一套离线工具。你负责定目标、给材料、做取舍；Agent 按“讨论方向 → 规划 → 分文件创作 → 检查 → 打包”一步步推进。中途可以改需求，也可以自己动手改文件。

不会写代码也能起步，但要用一个能读写本地文件、能调用工具的 Agent，只开一个普通聊天窗口不够。[仓库概览][readme]

### Q02. 三个 Skill 分别做什么？第一次应该找谁？

**A：** 从零做一张完整的卡，按这个顺序：

1. **tavern-design**：讨论叙事方向，写出 `design-spec.md`；
2. **tavern-cards**：建项目，写 `创作规划.yaml`、条目和变量，再用 forge 打包；
3. **tavern-ui**：需要复杂的消息楼层界面时才用。

只改一个开场白或一条世界书条目，直接走 tavern-cards 的局部任务就行，不用把整套流程重跑一遍。[设计入口][design] · [制卡入口][cards] · [前端入口][ui]

### Q03. 我已经打开 Agent，安装时该怎么说？

**A：** 把 [仓库地址][repo] 交给 Agent，然后这样说：

> 请按当前 README 安装 `tavern-design`、`tavern-cards`、`tavern-ui` 到这个客户端实际扫描的 Skill 目录；按需配置 `agents/` 子代理，运行 forge 的 `--help`，列出实际安装位置、测试结果和未通过项。

另外注意三点：仓库需要 Node.js；在 Windows 上，文档里的 bash 命令建议用 Git for Windows 自带的 Git Bash 来跑；装三套 Skill 和装子代理是两个步骤，要分别完成。[安装说明][readme]

### Q04. 为什么文件放进目录了，Agent 还是说找不到 Skill？

**A：** 按顺序查：

1. 放进去的是不是**当前客户端会扫描的目录**；
2. 三个 Skill 的文件夹里，是不是各有一个 `SKILL.md`；
3. 重启或重新加载客户端，开一个新任务，让 Agent 分别说出它实际读取的 Skill 入口。

仓库 README 里有三条自测提问和 forge `--help` 检查，可以照着做。要分清三件事：文件在目录里、Agent 看得见、这一轮真的用上了。前一件成立，后一件不一定成立。[安装自测][readme]

### Q05. Codex、Claude Code、OpenCode、Pi 的安装文件能直接互抄吗？

**A：** 不能原样照抄。Skill 目录要放到每个客户端自己的扫描位置。

仓库里的 `agents/*.md`，有些客户端可以直接复制使用；但 **Codex 的自定义 agent 要先转换成 TOML**，把这些 Markdown 文件原样放进去不算装好。Pi 还需要装它的子代理扩展。具体路径和格式，以你正在用的客户端和当前仓库 README 为准，装完实际调用一次。[各客户端安装差异][readme]

### Q06. 子代理是什么？必须装吗？会自动帮我审稿吗？

**A：** 子代理是主 Agent 在特定步骤叫来帮忙的分工助手。仓库里有四个：

- `conversion-agent`：转化长篇材料；
- `schema-agent`：设计变量结构；
- `first-message-agent`：写叙事开场；
- `check-agent`：检查文字。

它们在什么时候被调用，写在各个 Skill 的流程里；审稿要等流程走到 `check-agent` 那一步，不是装上就随时自动审。想用它们，先确认你的客户端支持子代理、已经配置好，用的时候看调用记录。只在文件里看到名字，说明不了它运行过。[子代理安装][readme] · [调用点][cards]

### Q07. 工作目录和 `.cardrc.json` 到底放哪？能只做一张卡吗？

**A：** 推荐这样摆：

```text
写卡工作区/              ← 根目录
├─ .cardrc.json          ← 从 tavern-cards/assets/cardrc.json 复制过来
└─ cards/
   └─ {项目名}/          ← 每个项目一个文件夹
```

也就是：建一个写卡工作区根目录，把 `tavern-cards/assets/cardrc.json` 复制过来，改名为 `.cardrc.json`；每个项目放在 `cards/{项目名}/` 下。

forge 会从当前工作目录开始，一级一级往上找配置。只做一张卡也可以：已经有独立 `tavern-cards-state.json` 的临时项目，能按手册用 `--state` 直接指定它的路径。

开工前让 Agent 说清四个位置：当前目录、配置文件、项目 state、成品输出路径。把这四个说清楚，能少掉很多“找不到文件”的问题。[工作区安装][readme] · [forge 手册][manual]

### Q08. 安装好后，给 Agent 的第一句话怎么写？

**A：** 可以直接套用：

> 请使用本仓库的 tavern-design 和 tavern-cards，做一张【题材】角色卡；材料在【路径】，必须保留【设定】，第一版先实现【最小可玩目标】。先产出 `design-spec.md` 给我看，再建项目；每阶段说清生成文件和我该怎样试。

还拿不准要不要 MVU、EJS 或前端，就加一句“请根据玩法提出最简方案并说明代价”，不用先硬选一堆术语。[完整项目流程][cards]

### Q09. 手机端或 ChatGPT 网页能直接运行这一套吗？

**A：** 要看环境的能力，普通的手机聊天和 ChatGPT 网页对话通常达不到。这套流程需要一个能装 Skill、能读写项目文件、能运行 Node.js 命令的 Coding Agent。手机能玩 ST、能打开聊天，不说明手机上具备这些制作能力；ChatGPT 的普通对话也代替不了在本地跑 forge。

想换到别的环境里用，先分别实测三样：Skill 能不能加载、子代理能不能用、命令行工具能不能跑。[前置条件][readme]

### Q10. DSH 插件和 GitHub 这三个 Skill 是同一个安装包吗？

**A：** 不是，两边是分开装的。GitHub README 的正式安装步骤，装的是三套 Skill、`agents/` 和 forge；帖子里讨论的 DSH（DeepSeek Harness）插件，要按它自己的版本和说明来装。

所以，装好了 DSH 插件，不说明 Coding Agent 已经发现了三个 Skill；反过来，三个 Skill 装好了，也不能推定插件已经在 DSH 里运行。[安装范围][readme]

## 二、设计、材料与世界书

### Q11. 从零做卡，第一阶段到底要决定什么？

**A：** 先说清这几件事：项目定位、世界、核心角色、玩家怎样互动、创作方向和开场。tavern-design 把确认过的内容写进 `design-spec.md`，tavern-cards 再把它展开成具体条目的 `创作规划.yaml`。

别只在聊天里说一句“这个设定以后记着”。确认过的决定要写进项目文件，任务一长、上下文被压缩以后，才有东西可查。[叙事设计][design] · [创作规划][requirements]

### Q12. 只有小说、漫画、规则书或一堆零散材料，怎么开始？

**A：** 先交代三点：材料从哪来、允许改编到什么程度、你最想保留的体验是什么。然后按材料类型处理：

- **长篇叙事材料**：tavern-design 会先把它转成能回头查的故事大纲，再和你一起补上材料里没回答的问题。
- **图片或漫画**：模型读图得出的内容要逐项核对，不能把它的猜测写成原作事实。
- **TRPG 规则书**：如果检定要精确地自动执行，已经超出这个仓库的通用写作流程，需要另外设计脚本和运行方案；叙事层面的规则，可以先规划成阶段指导或世界书条目。

[材料转化][conversion] · [项目边界][cards]

### Q13. 纯文字卡、MVU、EJS 和前端，第一版该选哪些？

**A：** 按需要一层层加：

1. **纯文字卡**：只需要人物、背景和对话规则。
2. **加 MVU**：要跨多条消息追踪好感、地点、进度这类状态。
3. **加 EJS**：要根据状态切换送给模型的条目。
4. **加 tavern-ui**：需要看得见的复杂交互，最后再考虑。

仓库建项目时，也是按 MVU、EJS、前端这三层需求分开确认的。另外，独立世界书不走这个仓库的 MVU/EJS 路线。[项目属性][setup]

### Q14. 已经有一张纯文字卡，能改成 MVU 卡吗？

**A：** 能，但不只是加一个状态栏。先把 PNG/JSON 解包成项目，读清原卡的结构，再确认哪些状态真的需要持续更新。

迁移要补的东西包括：`schema.ts`、初始变量、更新规则、`state.zod`、相关世界书和正则；还要让开场和这些内容对得上，并检查旧聊天还能不能接着用。

如果原卡本来就是旧版 MVU 卡，要不要升级，仓库流程要求先问用户、拿到明确的答复。[已有卡修改][modify] · [MVU 流程][mvu]

### Q15. 世界书的蓝灯、绿灯、插入位置和深度，能套一组万能数字吗？

**A：** 不能。蓝灯是常驻、一直插入的条目，绿灯是关键词命中才插入的条目。先判断这个条目是一直都需要，还是只在关键词、阶段或位置满足条件时才需要；再决定 `typeLists`、触发方式和它在提示词里的位置。

forge 的 `configure` 能按项目 state 里的阈值推算配置，但它不会替你判断剧情内容。在目标 ST 里看实际插进去了什么、试玩效果怎样，比照抄别人的深度数值靠谱。[项目配置][setup] · [forge 配置][manual]

### Q16. 自定义 NPC、随机出现的人物或原著剧情怎么稳定触发？

**A：** 先分清人物是哪种来源：

- **固定人物**：在规划里登记对应的条目。
- **不是事先写好的人物**（玩家输入的、运行中临时生成的）：要写清楚怎么生成、怎么记录、什么情况下再次出场，不能只挂一个模糊的关键词。

原著主线如果可能被玩家的选择绕开，先决定“允许偏离多少”，再设计阶段指导、事件条件和把剧情拉回来的线索。

要记住：世界书命中，只保证设定进了提示词，不保证模型会照着剧情走。[条目类型][entries] · [世界书机制][worldbook]

### Q17. AI 说查出几十个世界书冲突，我应该全部按建议改吗？

**A：** 不用全改。先把这些“冲突”分成三种：

- **硬矛盾**：两处说法不可能同时成立；
- **能共存的差异**：时间或视角不同，放在一起并不冲突；
- **只是措辞相近的重复**。

让 Agent 指出涉及的两处文件，以及对实际游玩有什么影响。会动到人物核心设定的建议，由作者拍板。检查报告只是线索，最后还要在 ST 里看条目插入和剧情表现；问题数清零了，不等于作品就合格了。[修改与质量修正][revision]

### Q18. 审稿越审越像模板文，甚至把我的人设改跑了，怎么止损？

**A：** 三步：

1. **先立规矩**：在 `design-spec.md` 和 `创作规划.yaml` 里写下不能改的人物动机、关系和语气样例。
2. **只改该改的**：让 `check-agent` 报出具体原句、问题类型和修改建议，主 Agent 只改确实有问题的地方。修完发现人物写偏了，就退回原设定，别为了过审继续改。
3. **该停就停**：重复扫描已经没有必须修改的地方，就停下来，把改动前后的差异交给作者看。

仓库有检查流程，但“无限轮扫描”不是验收标准。[写作检查][rules-check] · [修订流程][revision]

### Q19. 为什么同一个模型写卡时好时坏？换模型就能解决吗？

**A：** 不一定。模型、材料质量、任务范围和项目约束都会影响结果。先查三样：Agent 有没有读到已经确认的规划、有没有漏掉源材料、是不是一次揽了太多活。然后拿一小段条目，对比不同模型的效果。

通用的模型排名、某天某个套餐的体验，写进教程很快就会过时。叙事上的取舍还是要作者自己读，代码和变量还要靠结构校验和实际运行来确认。[创作流程][cards]

### Q20. 写卡消耗大量 token，怎么控制？

**A：** 几个办法：

- 把源材料和已确认的设定整理成项目文件，按章节或条目分批处理；只有长材料才交给 `conversion-agent` 分片。
- 改了哪里，就只重查受影响的范围。
- 先做一个能玩的小版本。遇到报错，把具体文件、命令、控制台信息和复现步骤交给 Agent，别让它一遍遍“全部重做”。

实际花费随客户端、模型、缓存和材料量变化，仓库没有给出“一张卡要多少 token”的通用数字。[材料分片][conversion] · [断点续接][resume]

## 三、MVU、EJS 与变量故障

### Q21. 选择 MVU 后，Skill 会自动把全部脚本装进卡里吗？

**A：** 不会凭一句“要 MVU”就全部装好。工作流会一步步带你做：创建三个核心文件、复制模板、应用 JSON Patch、登记脚本和正则；`pack` 打包时会检查关键内容。这些步骤不能跳过。

打包前，确认这几项都已登记：`state.mvu`、MVU 助手脚本、`state.zod`、`[InitVar]` 条目，以及五条相关正则。[MVU 收尾][mvu] · [打包清单][packaging]

### Q22. `schema.ts`、`initvar.yaml`、`变量更新规则.yaml` 分别干什么？

**A：**

| 文件 | 作用 |
| --- | --- |
| `schema.ts` | 定义有哪些字段、什么类型、怎样校验 |
| `initvar.yaml` | 新开聊天时的初始值 |
| `变量更新规则.yaml` | 告诉模型在什么情况下改哪些值 |

顺序是：先定 schema，再写初始值和规则，最后用 `validate-mvu` 检查初始值，并对照开场、世界书和 EJS 条件看是否一致。

另外，状态栏还得读对路径。这三个文件都通过了，不代表前端已经接上。[MVU 三文件][mvu]

### Q23. `validate-mvu` 报 `state.zod` 缺失或 `Cannot find module 'zod'` 怎么办？

**A：** 分情况处理：

- **`state.zod` 缺失**：查 `mvu-patch.json` 有没有把 `/zod` 描述符写进 state，`schemaPath` 是否指向真实存在的文件。
- **`Cannot find module 'zod'`**：仓库的校验工具已经提供了全局的 `z`／`_`，项目里的 `schema.ts` 不应该自己 `import zod` 或 `lodash`。按报错把这些 import 改掉就行，不要为了消掉报错随手给项目 `npm install`。
- **字段名重复**：按报错给出的行号去掉重复的键。

[MVU 排错][errors] · [forge 手册][manual]

### Q24. 变量管理器里有新值，状态栏却一直显示旧值，查哪一层？

**A：** 先对照三条路径，看是不是同一个：

1. 变量实际写到了哪里；
2. `schema.ts` 里定义的路径；
3. 前端 store 或文字状态栏读取的路径。

特别要查：是不是把 `人物.角色名.字段` 错写成了顶层的 `角色名.字段`。

路径对上以后，再看当前是哪条消息楼层、MVU 什么时候初始化、界面在等哪个刷新事件。用同一段聊天的变量快照、浏览器控制台和界面显示来定位，别只盯着 CSS 改。[MVU 路径][mvu] · [UI 变量读取][ui-mvu]

### Q25. EJS 是不是状态栏必需品？它和 MVU 有什么不同？

**A：** 不是必需品。三样东西分工不同：

- **MVU**：保存和更新状态；
- **EJS**：根据状态决定哪些世界书内容发给模型，或者在内容里插入会变的文字；
- **状态栏**：把状态显示给玩家看。

它们可以配合着用，也可以只用需要的那部分。仓库把 EJS 分成三级：整条条目的显示／隐藏 → 控制条目里的段落 → 动态文本。先用能表达你玩法的最简单那一级。[EJS 流程][ejs]

### Q26. EJS 报 `xxx is not defined`，但有时生成又正常，是为什么？

**A：** 一种原因是：`@@if` 直接用了另一个条目通过 `define()` 注册的短名。条目在不同阶段的处理顺序不一样，用到它的时候，那个短名可能还没注册上。

仓库目前的建议：

- 条件里直接写带默认值的 `getvar('stat_data.路径', { defaults: 值 })`；
- 需要局部短名，就在当前条目里用 `@@private` 加 `const` 定义。

改完以后，分别检查打开聊天时和实际生成时是否正常。[EJS 运行时报错][errors]

### Q27. EJS 报 `Identifier ... has already been declared` 怎么修？

**A：** 如果条目内容里用了 `const`／`let`，同一个条目被处理多次时，就可能在模板作用域里重复声明。

按仓库指南，在条目第一行加上 `@@private`，让局部变量各管各的、互不冲突；然后在实际 ST 里重新打开聊天、重新生成来检查。[EJS 作用域排错][errors]

### Q28. `{{user}}` 写进条目后，解包变成 `.txt`，是文件坏了吗？

**A：** 不一定坏了。仓库说明，ST 宏 `{{user}}` 的双花括号会让 YAML 解析出错，forge 解包时可能改用 `.txt` 保存。

在这套工程里写条目，仓库推荐用 `<user>` 代表玩家。已有的卡解包后，先核对原文和打包结果；别只因为后缀变了，就批量重写内容。[宏约定][cards] · [解包行为][manual]

### Q29. 旧卡的 MVU 不是 Zod 版，能直接用新版 forge 打包吗？

**A：** 别直接打。先备份，再解包检查 `mvu`、`state.zod`、变量格式和脚本。

仓库有旧 MVU 的迁移路线，但转换变量值、初始值和更新规则，可能改变存档的表现，所以要先征得卡作者同意，并用旧聊天样本测试。forge 能读进来，只说明文件能解析，不等于迁移已经完成。[旧卡迁移][modify]

## 四、状态栏与前端界面

### Q30. 只想显示几个数值，为什么 Agent 要我建 Vue 项目和 CDN？

**A：** 先看 `ui_mode` 选的是哪个：

- **`text`**：文字状态栏，简单显示几个数值用这个。
- **`frontend`**：需要组件和复杂交互才选，并走 tavern-ui。

前端路线要单独的 `tavern_helper_template` 项目，还要构建、预览和部署，工作量大得多，不是每张 MVU 卡都要上。[UI 模式][cards] · [文字状态栏][text-ui] · [前端路线][ui]

### Q31. 前端状态栏需要额外下载什么？样式只能用固定模板吗？

**A：** 要下载第三方的 `tavern_helper_template` 作为开发底子，会用到 Vue 3 等工具。但模板只是工程骨架，不限定界面长什么样。

做法是：先把角色卡的 `schema.ts` 接进模板，再讲清楚配色、布局、哪些信息优先、怎样交互，让 Agent 按 `design-spec.md` 设计组件。只复制一段 HTML、没有模板项目和构建流程，通常接不完整。[前端开发][ui] · [界面构思][ui-design]

### Q32. 开场能看到文字，却没有状态栏占位符，为什么？

**A：** 先看开场文件的后缀。这套 forge 打包 MVU 卡时，会给 `.txt` 开场白自动追加 `<StatusPlaceHolderImpl/>`（已经有了就跳过）；`.md` 开场白不会自动追加。

然后查最终成品里的首条消息、状态栏正则和助手脚本齐不齐，再开一个新聊天看实际显示。源码里没看到占位符，不代表最终的卡里没有。[打包规则][manual] · [已有卡开场][modify]

### Q33. 状态栏白屏或读不到变量，最短排错顺序是什么？

**A：** 按这个顺序一项项查：

1. 变量有没有更新；
2. 读取路径、消息楼层对不对；
3. `schema.ts` 的两份副本是否一致；
4. 构建是否成功输出；
5. 占位符和正则有没有挂上；
6. 浏览器控制台有没有报错。

Agent 如果能连上浏览器调试工具，可以让它直接读目标 ST 的控制台；连不上，就把报错原文、成品版本和重现步骤交给它。先找出是哪一层坏了再改代码，别一遍遍重写整个前端。[前端环境][ui-env] · [运行时排错][ui-runtime]

### Q34. 电脑上正常，手机上状态栏挤成一列怎么办？

**A：** 给 Agent 准备这些：同一个界面的电脑和手机截图、手机上装着界面的那个框有多宽、哪些内容最重要必须保留。让它检查写死的宽度、换行、滚动和触控。

界面实际嵌在消息楼层／iframe（消息里的小网页框）里，判断布局要以这个框为准，而不是整个屏幕。离线预览调好以后，还要在目标手机的 ST 里实际打开、操作一遍。[前端设计][ui] · [运行环境][ui-runtime]

### Q35. 本地预览好看，就表示 ST 里能用了吗？

**A：** 不表示。本地 `pnpm watch` 和网页预览，只能证明开发输出的一部分。在 ST 里还要验证：酒馆助手、正则占位符、iframe、MVU 初始化和交互。

发布前，再拿正式构建和最终打包的卡复测一遍。否则开发服务器还开着时看到的效果，容易被误当成离线成品的效果。[本地预览][ui] · [打包流程][packaging]

### Q36. 前端一定要上 GitHub／CDN 吗？改了代码为什么别人看不到？

**A：** 不一定要上。仓库给了三条路：

- **CDN**：远程加载，方便复用，但多层缓存可能让别人一直看到旧版；
- **自托管**；
- **全量内联**：代码直接放进卡里，但卡里的代码体积会变大。

别人看不到更新，先查当前正则加载的是本地开发地址还是正式 URL，再查构建产物、上传的版本、缓存和玩家的浏览器。公开推送和部署，要按项目授权来做。[部署与缓存][ui]

### Q37. Agent 直接开始画前端，没问风格和交互，怎么补救？

**A：** 先补一小段界面约束：玩家第一眼看什么、哪些信息可以折叠、视觉参考、手机上怎么排、哪些交互必须保留。然后让 Agent 更新 `design-spec.md` 里的 UI 部分。

仓库的 tavern-ui 规定，遇到双线叙事、非标准交互、对风格有明确期待或有参考卡的情况，要先做设计构思。已经有界面的，就基于实际截图和源码来改，不用推倒重来。[设计构思][ui-design]

## 五、打包、迁移与验收

### Q38. forge 工具在哪？怎么先确认命令能跑？

**A：** 脚本在已安装的 `tavern-cards/scripts/tavern-cards-forge.mjs`。

- **先试能不能跑**：在那个 Skill 目录下运行 `node scripts/tavern-cards-forge.mjs --help`。
- **做真实项目**：从写卡工作区的根目录调用这个脚本，并确认 forge 找到的是本项目的 `.cardrc.json`，或者用 `--state` 明确指定。

整理本文时，用当前仓库快照跑过 `--help`，能列出 `init`、`configure`、`pack`、`unpack`、`validate-mvu`、`export` 等命令。这只说明仓库里的脚本能跑，不代表你的客户端里已经装好了。[forge 手册][manual]

### Q39. AI 说“打包完成”，成品在哪？为什么我找不到？

**A：** 让它把三样东西贴出来：本次执行的完整命令、退出结果、成品的**完整绝对路径**。

forge 决定输出位置的顺序是：先看 `--output`；没给的话，看 `.cardrc.json` 里项目的 `artifact`；再没有，就用 state 同目录下的默认文件名。格式回退时，后缀也会跟着变。只看到“成功”两个字，可能会找错文件，或者拿到的是上一次的成品。[输出路径][manual] · [打包格式][packaging]

### Q40. 为什么我想要 PNG，结果得到 JSON？

**A：** 有两种情况会这样：

- 角色卡项目没设头像，本来就输出 JSON；
- 头像路径填了，但图片不是合法的 PNG，forge 会给出警告，改为输出 JSON。

查一下 `form`、`avatar`、打包警告和最终路径。要 PNG，就准备一张合法的 PNG 头像再重新打包。独立世界书始终输出 JSON。[格式规则][manual] · [打包警告][errors]

### Q41. 只有别人给的 PNG／JSON，可以直接修改吗？

**A：** 先用 `unpack` 解包成项目，把结构、条目和特殊组件给用户看过，再改内容。

- **普通合并模式**：会尽量保留已有的工程文件。
- **`--fresh`**：全新解包，不能和 `--state` 一起用。用之前先确认输出目录，做好备份。

外部卡的条目可能暂时归到 `unknown`；只是改改文字的话，不一定要马上重新分类。[修改外部卡][modify] · [解包选项][manual]

### Q42. 改了文件，为什么打包后没变？`configure`、`patch`、`pack` 分别管什么？

**A：**

| 命令 | 管什么 |
| --- | --- |
| `patch` | 修改 state 里的登记和配置 |
| `configure` | 根据 state 推算缺失的触发方式、位置等字段 |
| `pack` | 读取已登记的文件，生成 ST 成品 |

改了没生效，先查两点：改的文件有没有登记在 `entryManifest`、开场或正则里；当前命令对着的是不是正确的项目。

已有的卡要覆盖旧设置时，才谨慎使用 `configure --force`。路径字段改名可以交给 patch，它会自动重命名磁盘上的文件；自己手动挪文件，反而可能让 state 对不上。[forge 命令][manual] · [外部卡流程][modify]

### Q43. 打包报“文件不存在”“非 UTF-8”“重复键”，应先做什么？

**A：** 先把报错对应到具体的 state 路径和磁盘文件，再查：条目有没有登记、路径对不对、文本是不是 UTF-8 编码。重复键就按报错给出的 `schema.ts` 行号去重。

修好这一处，重跑原来的命令。别为了让报错消失，删掉一整类条目或变量。forge 能在离线时先查出这些问题，但代替不了在 ST 里运行测试。[打包预检][manual] · [错误处理][errors]

### Q44. 让 Agent 自动把成品导进 ST、自己调试，能算这个仓库的默认功能吗？

**A：** 不能。这个仓库的 forge 负责离线的项目和成品，README 没有把“自动操作真实 ST”列进默认交付。

如果你的客户端另外接了浏览器驱动，可以单独安排测试：固定成品版本、全新导入、看控制台和变量、试开场和切换聊天。驱动其实没接上时，要写明“没做实机验收”。[仓库范围][readme]

### Q45. 长任务被压缩或换了会话，确认过的设定丢了怎么办？

**A：** 马上把已确认的决定写进 `design-spec.md`、`创作规划.yaml` 或项目的续接文件。改条目前先同步规划；结束时记下当前的 state、成品、已经通过的检查和下一步。

新会话先读这些文件，再从上次的阶段接着做。只在聊天里说一句“我记住了”，保护不了一个长期项目。[规划同步][cards] · [断点续接][resume]

### Q46. 什么时候能说“做完了”？作者还要亲自验什么？

**A：** 至少分清这五件事，不能拿其中一件代替另一件：

1. 源文件写完；
2. forge 离线检查通过；
3. JSON／PNG 内容核对过；
4. 在目标 ST 里导入并玩过；
5. 作者本人认可。

变量卡要检查：新聊天初始化、几轮更新、不同开场、状态栏显示。前端卡还要查窄屏、控制台和交互。AI 的检查建议可能误伤人设，作品认不认可只能由作者决定，自动扫描替不了。[打包清单][packaging] · [修订流程][revision]

## 六、与 TavernWeave 混搭

### Q47. Tavern Cards 和 TavernWeave 能同时安装吗？会互相覆盖吗？

**A：** 能同时装。两边的 Skill 名字不一样，不会同名覆盖，按各自的 README 装到同一个客户端实际扫描的目录就行。但这只是文件放在一起，客户端不一定会自动选对工作流。

开工时直接说明分工，比如：“本项目由 Tavern Cards 的 `design-spec.md`／`创作规划.yaml`／forge 管主流程，TW 只处理【指定问题】”，并让 Agent 报告实际用了哪些 Skill。别把两个仓库的模板文件混进同一个说不清来源的目录。[Tavern Cards 安装][readme] · [TavernWeave 概览][tw-readme]

### Q48. 两边都有制卡能力，应该让谁管哪一步？

**A：** 项目用的是 Tavern Cards 的工程，就以它的 state、规划和 forge 为准，作品内容以这边的文件为唯一依据。TW 按需补上更专门的检查：API 核对、真实 ST 调试、组件安全、性能或媒体。

要改同一张卡时，先定好谁改源码、谁负责打包、谁负责验收，再让第二套 Skill 读取已经做出的决定。这样两边才不会各自重写同一个字段。[Tavern Cards 流程][cards] · [TW 能力清单][tw-readme]

### Q49. 混搭后，TW 的检查通过了，是否表示 Tavern Cards 已经打包成功、可以发布？

**A：** 不表示。这是几件不同的事：TW 的离线审查、浏览器检查和真实 ST 测试结果；Tavern Cards 的 forge 输出；Git 提交和公开发布。

报告里要写清楚：查的是哪份源文件、哪个 JSON／PNG、哪个 ST 版本。如果要对外转发或二次修改，也要先看对方仓库 README 里的许可说明。[打包与许可][readme] · [TW 的检查与验收范围][tw-readme]

## 七、工具与服务边界

### Q50. Agent 查不到原作资料，是换一个模型 API 就能联网吗？

**A：** 不一定。能不能联网，要看当前的 Coding Agent 手上有没有能调用的搜索工具，这一轮有没有调用记录。模型能聊天、仓库里有 Skill、Agent 能上网搜，是三件不同的事。

要查资料，就把原文件交给它，或者在客户端里配好它支持的搜索工具，并逐条核对来源。模型“知道的故事”，不能直接当成查到的原作事实。[材料转化][conversion]

### Q51. 装了这些 Skill，模型就会接受所有题材和写法吗？

**A：** 不会。Skill 负责组织创作和制作的步骤，改不了模型或服务方的内容规则。

遇到拒答，先分清是题材内容、工具权限，还是技术错误。允许范围内的世界设定、数据结构、打包和排错都可以继续做；别把“装了 Skill”理解成解除了限制。[仓库范围][readme]

## 给作者的校对点

1. [README 安装自测][readme] 里写的是 tavern-design “大方向讨论六个维度”，而当前的 [tavern-design Skill][design] 列了七项，第七项是 SFW／NSFW 边界。建议两边统一，免得用户照新版流程回答，却被旧的自测文案判成不对。
2. 帖子里常有人把 DSH 插件、三套 Skill、子代理、酒馆助手模板放在同一句“装好了”里。教程里把这四处的安装和运行分开检查，会清楚很多。
3. 读者反复报告三类体验问题：check-agent 一轮轮反复、角色设定被审稿改偏、前端本地预览和真实 ST 不一致。本文给了止损和核对办法；要不要写进上游 Skill，由作者决定。

## 主要依据

- [仓库 README 与安装说明][readme]
- [tavern-design 工作流程][design]、[tavern-cards 工作流程][cards]、[tavern-ui 工作流程][ui]
- [forge 完整命令手册][manual]、[MVU 流程][mvu]、[EJS 流程][ejs]、[错误处理][errors]
- [TavernWeave 的能力与验收范围][tw-readme]

[repo]: https://github.com/ai4rpg/tavern-cards
[snapshot]: https://github.com/ai4rpg/tavern-cards/tree/e28fb561f114a4c0636921878c245e5fc181bf33
[readme]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/README.md
[design]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-design/SKILL.md
[cards]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/SKILL.md
[ui]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-ui/SKILL.md
[requirements]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/requirements.md
[conversion]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-design/references/conversion.md
[setup]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/project-setup.md
[entries]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/requirements/entry-types.md
[worldbook]: https://github.com/LiarMTTT/TavernWeave/blob/612c51980549e179bb73ead699aa1c37680db08e/skills/consult-tavernweave-library/references/st-guides/A3_%E4%B8%96%E7%95%8C%E4%B9%A6%E4%BC%98%E5%8C%96.md
[revision]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/revision.md
[rules-check]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/rules-check.md
[resume]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/resume.md
[mvu]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/mvu/guide.md
[ejs]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/ejs/guide.md
[errors]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/error-handling.md
[ui-mvu]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-ui/references/mvu-variables.md
[text-ui]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/ui/text.md
[ui-design]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-ui/references/design-thinking.md
[ui-env]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-ui/references/environments/tavern-helper-template.md
[ui-runtime]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-ui/references/environments/tavern-helper-runtime.md
[manual]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/manual.md
[packaging]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/packaging.md
[modify]: https://github.com/ai4rpg/tavern-cards/blob/e28fb561f114a4c0636921878c245e5fc181bf33/tavern-cards/references/modify-existing.md
[tw-readme]: https://github.com/LiarMTTT/TavernWeave/blob/612c51980549e179bb73ead699aa1c37680db08e/README.md
