# 表情立绘与 Live2D 参考手册

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

## Character Expressions · Live2D · VRM · Costume 系统完整参考

> **适用对象**：基于 SillyTavern 的角色卡立绘/动画系统搭建与调试参考；含静态 Sprites、Live2D 骨骼动画、VRM 3D 模型、服装切换四大子系统。
>
> **置信度说明**：本手册采用「三级 + 依据类型」双轴标注，完整规则见下方〈0 置信度分级体系〉。

---

## 目录

0. [置信度分级体系（全手册适用）](#0-置信度分级体系全手册适用)
1. [系统架构总览](#1-系统架构总览)
2. [静态 Sprites 文件系统](#2-静态-sprites-文件系统)
3. [28 个情绪标签完整列表](#3-28-个情绪标签完整列表)
4. [文件命名解析算法](#4-文件命名解析算法)
5. [ZIP 批量上传规范](#5-zip-批量上传规范)
6. [多图像随机选择机制](#6-多图像随机选择机制)
7. [分类（Classify）系统](#7-分类-classify-系统)
8. [LLM 分类 Prompt 与 Pipeline](#8-llm-分类-prompt-与-pipeline)
9. [extension_settings 配置字段完整参考](#9-extension_settings-配置字段完整参考)
10. [STscript / Slash Command API](#10-stscript--slash-command-api)
11. [Costume / 服装切换系统](#11-costume--服装切换系统)
12. [Live2D 扩展技术规格](#12-live2d-扩展技术规格)
13. [VRM 扩展技术规格](#13-vrm-扩展技术规格)
14. [Visual Novel 模式下的行为](#14-visual-novel-模式下的行为)
15. [服务端 API 端点参考](#15-服务端-api-端点参考)
16. [expressions-plus 第三方扩展](#16-expressions-plus-第三方扩展)
17. [talkinghead（历史·已废弃）](#17-talkinghead历史已废弃)
18. [高频避坑](#18-高频避坑)
19. [施工直用范式代码](#19-施工直用范式代码)
20. [悬案（未决项 + 真机验证路径）](#20-悬案未决项--真机验证路径)

---

## 0 置信度分级体系（全手册适用）

> **收集日期统一声明**：本手册全部条目收集于 **2026-06-28**。回源核实基于本地 SillyTavern **v1.14.0** + 本地成熟卡（星月2.5.0 / 交错2.6.0）；Live2D / VRM 为独立扩展仓（Extension-Live2d / Extension-VRM），相关条目已在标注处单独说明。

每条结论采用 **置信度等级 + 依据类型** 双轴标注。

### 置信度三级

| 级别 | 含义 | 判定标准 |
|---|---|---|
| **high** | 已坐实，可直接施工 | 有运行时证据（真机实测 / 读到运行时实现源码 / 生产卡验证）；非 beta 未合并特性；结论不含跨步推导；不在悬案清单 |
| **medium** | 待验证，施工前须实测 | 强制二选一子标签：`medium·单源孤证`（单一来源、无第二源、无实测）/ `medium·推导未验证`（源码或逻辑推导成立但未跑通，**须随附真机验证路径**）|
| **low** | 孤证无源，禁止据此施工 | 零来源猜测 / 纯历史快照（须标年份 + 窄缩适用范围）|

### 依据类型标签（与置信度正交，强制标注）

`[运行时源码]`、`[真机]`、`[文档·多源]`、`[文档·单源]`、`[类型声明]`、`[历史孤证:年份]`、`[无源·待考]`

### 两条铁规

1. **仅由 `[类型声明]` 支撑的「运行时行为 / 可用性」结论，最高只能 `medium·推导未验证`**——除非另有 `[运行时源码]` 或 `[真机]` 佐证才升 high。
2. **节级标注 = 节内条目下确界**——禁止整节标 high 却内含悬案条目；冲突即拆节。

---

## 1 系统架构总览

### 1.1 分层架构

```
[AI 输出文本]
     │
     ▼
[classification 分类层]  ←── 可选：Local BERT / Main API LLM / WebLLM / Extras(废弃)
     │  情绪标签 (string)
     ▼
[sprite 匹配层]  ←── /data/<user>/characters/<CharName>/<label>.png
     │  文件路径
     ▼
[渲染层]  ←── 普通模式(侧边) / VN 模式(居中) / Live2D / VRM
```

来源：`SillyTavern/SillyTavern:staging/public/scripts/extensions/expressions/index.js` | 适用版本：ST 1.12.x–1.15.x | **high** `[运行时源码]`

### 1.2 三大渲染引擎对比

| 引擎 | 状态 | 依赖 | 特性 |
|------|------|------|------|
| 静态 Sprites | 原生内置，无需额外安装 | 无 | PNG/WebP/GIF，全自动情绪切换 |
| Live2D | 独立扩展，官方维护 | Extension-Live2d | 2D 骨骼动画，口型同步，hitArea 交互 |
| VRM | 独立扩展，官方维护 | Extension-VRM | 3D 模型，FBX/BVH 动画，BlendShape 表情 |
| talkinghead | **1.12.13 已废弃** | SillyTavern-Extras（OBSOLETE） | 单图生成 Live2D 式运动，历史参考 |

来源：`docs.sillytavern.app/extensions/live2d/`、`/extensions/vrm/`、`/extensions/talkinghead/` | 适用版本：ST 1.12.x–1.15.x | **high** `[文档·多源]`

---

## 2 静态 Sprites 文件系统

### 2.1 文件夹路径结构

```
/data/<user-handle>/characters/
├── CharacterName.png              ← 角色卡头像
└── CharacterName/                 ← 与角色卡文件名精确同名（不含扩展名）
    ├── joy.png                    ← 基础命名
    ├── joy-1.png                  ← 多变体（破折号+数字后缀）
    ├── joy.expressive.png         ← 多变体（点+描述后缀）
    ├── admiration.png
    ├── ... (共 28 个标签对应文件)
    └── [subfolder]/               ← 服装覆盖子文件夹（见第 11 章）
        └── joy.png
```

本地真机验证路径：`<local-user-path>/OneDrive\ST-\SillyTavern-1.14.0\data\default-user\characters\Seraphina\`（28 个文件已全部验证存在）

来源：真机验证 + `src/endpoints/sprites.js` | 适用版本：ST 1.12.x–1.15.x | **high** `[真机]` + `[运行时源码]`

**关键规则：文件夹名必须与角色卡文件名精确一致**（Linux 区分大小写，Windows 不区分；部署 Linux 服务器后若大小写不一致，立绘全部失效——见 18 节坑1）。

### 2.2 支持的图片格式

- `image/*` 类型（由服务端 mime-types 校验）
- 常用：PNG、WebP、GIF（GIF 支持动图）
- 非图片文件上传会被服务端拒绝

来源：`src/endpoints/sprites.js` | **high** `[运行时源码]`

---

## 3 28 个情绪标签完整列表

来源：`staging/public/scripts/extensions/expressions/index.js` 中 `DEFAULT_EXPRESSIONS` 数组 + 本地真机目录二次确认（Seraphina 28 文件吻合）。

```javascript
const DEFAULT_EXPRESSIONS = [
    'admiration',     // 钦佩
    'amusement',      // 娱乐/逗乐
    'anger',          // 愤怒
    'annoyance',      // 烦恼
    'approval',       // 认可
    'caring',         // 关爱
    'confusion',      // 困惑
    'curiosity',      // 好奇
    'desire',         // 渴望
    'disappointment', // 失望
    'disapproval',    // 不认可
    'disgust',        // 厌恶
    'embarrassment',  // 尴尬
    'excitement',     // 兴奋
    'fear',           // 恐惧
    'gratitude',      // 感激
    'grief',          // 悲恸
    'joy',            // 喜悦
    'love',           // 爱
    'nervousness',    // 紧张
    'optimism',       // 乐观
    'pride',          // 自豪
    'realization',    // 顿悟
    'relief',         // 释然
    'remorse',        // 懊悔
    'sadness',        // 悲伤
    'surprise',       // 惊讶
    'neutral'         // 中性（fallback 首选）
];
```

共 **28 个标签**，`neutral` 包含在内。`love` 是否属于标准 GoEmotions 28 集存在轻微歧义，详见第 20 章悬案 U1。

来源：运行时源码 `DEFAULT_EXPRESSIONS` + 真机目录验证 | 适用版本：ST 1.12.x–1.15.x | **high** `[运行时源码]` + `[真机]`

**最小可用子集建议**：`neutral`（必备）、`joy`、`sadness`、`anger`、`fear`、`surprise`、`disgust` 共 7 个覆盖基础情绪；其余按需补充。

---

## 4 文件命名解析算法

来源：`src/endpoints/sprites.js`（服务端）。

```javascript
// ST 内部文件命名解析逻辑
const fileName = path.parse(pathToSprite).name.toLowerCase();
const label = fileName.match(/^(.+?)(?:[-\.].*?)?$/)?.[1] ?? fileName;
```

**规则**：取文件名（去扩展名后）在第一个 `-` 或 `.` 之前的部分作为情绪标签，全部转小写。

| 文件名 | 解析标签 | 说明 |
|--------|----------|------|
| `joy.png` | `joy` | 基础 |
| `joy-1.png` | `joy` | 数字变体 |
| `joy.expressive.png` | `joy` | 点后描述 |
| `joy-alt-1.png` | `joy` | 仅第一段 |
| `Joy.png` | `joy` | 自动转小写 |
| `schooluniform_joy.png` | `schooluniform_joy` | 下划线不分割，整体是标签名 |

来源：`src/endpoints/sprites.js` | 适用版本：ST 1.12.x–1.15.x | **high** `[运行时源码]`

---

## 5 ZIP 批量上传规范

```
sprite_pack.zip
├── joy.png              ← 必须平铺在根目录（no subfolders）
├── joy-1.png
├── sadness.png
└── neutral.png
```

规则：
- ZIP 内所有图片必须平铺在根目录，含子文件夹则上传失败或部分文件丢失（见 18 节坑2）
- 服务端用 `mime-types` 校验，只接受 `image/*` 类型
- 会与已有文件对比去重后写入（同名文件覆盖）

来源：`src/endpoints/sprites.js` + 官方文档 | **high** `[运行时源码]` + `[文档·多源]`

---

## 6 多图像随机选择机制

```javascript
// 当 allowMultiple 开启且同一标签有多个文件时
let possibleFiles = sprite.files;
if (extension_settings.expressions.rerollIfSame) {
    possibleFiles = possibleFiles.filter(x =>
        !prevExpressionSrc || x.imageSrc !== prevExpressionSrc);
}
spriteFile = possibleFiles[Math.floor(Math.random() * possibleFiles.length)];
```

**关键配置**：
- `allowMultiple: true`（新安装默认，见 migrateSettings）→ 同标签多文件随机选；旧存档若迁移前已存在该字段则保留原值（见坑3）
- `allowMultiple: false` → 同标签多文件时只取第一个，不随机
- `rerollIfSame: true` → 随机时过滤掉上一次显示的图，避免重复

> ⚠️ 校准注记（2026-06-28）：草稿原写"allowMultiple: false（默认）"与源码不符，migrateSettings() 对 undefined 写入 true，已更正。

来源：`staging/public/scripts/extensions/expressions/index.js` | 适用版本：ST 1.12.x–1.15.x | **high** `[运行时源码]`

---

## 7 分类（Classify）系统

### 7.1 四种分类源对比

| `api` 值 | 模式名 | 技术实现 | 标签数 | 需要外部服务 |
|----------|--------|----------|--------|-------------|
| `0`（local） | Local | 本地 ONNX BERT 模型 | 28 | 否（首次下载约 100MB） |
| `1`（extras） | Extras | SillyTavern-Extras API | 6 或 28 | 是（已废弃，勿用） |
| `2`（llm） | Main API | 当前连接的 LLM | 自定义 | 是（已有 LLM 连接） |
| `3`（webllm） | WebLLM | 浏览器内 WebLLM | 自定义 | 否（需安装 WebLLM 扩展） |
| `99`（none） | None | 禁用分类 | — | — |

来源：`staging/public/scripts/extensions/expressions/index.js` `EXPRESSION_API` 枚举 | **high** `[运行时源码]`

### 7.2 本地模型配置（config.yaml）

```yaml
# 28 标签模型（默认，精度高）：
extensions:
  models:
    classification: Cohee/distilbert-base-uncased-go-emotions-onnx

# 6 标签模型（更快但精度低）：
extensions:
  models:
    classification: Cohee/bert-base-uncased-emotion-onnx
```

来源：ST 官方文档 | **high** `[文档·多源]`

### 7.3 流式输出中的分类频率变化

- 正常情况：moduleWorker 轮询间隔 **2000ms**
- 流式输出中：间隔降至 **10000ms**，表情切换变慢
- 这是预期行为，非 bug（见 18 节坑6）

来源：`staging/public/scripts/extensions/expressions/index.js` | **high** `[运行时源码]`

---

## 8 LLM 分类 Prompt 与 Pipeline

### 8.1 LLM 分类 Prompt 模板（原文）

```
Ignore previous instructions. Classify the emotion of the last message. 
Output just one word, e.g. "joy" or "anger". Choose only one of the 
following labels: {{labels}}
```

`{{labels}}` 在运行时替换为可用标签的逗号分隔列表（含自定义标签）。

**两种 Prompt 上下文模式**：
- `promptType: 'raw'`（默认）：仅最后一条消息 + 系统指令
- `promptType: 'full'`：完整聊天历史 + 角色卡（token 消耗显著增加）

来源：`staging/public/scripts/extensions/expressions/index.js` | **high** `[运行时源码]`

### 8.2 LLM 分类返回格式与容错

期望格式：`{"emotion": "label_string"}`

容错链路（按优先级）：
1. 直接 JSON 解析 → 取 `emotion` 字段（区分大小写后转小写）
2. JSON 解析失败 → 先统一去除 `<think>...</think>` 推理块（`removeReasoningFromString`），再：
   a. Fuse.js 模糊搜索
   b. 子串匹配（逐 label 查包含关系）
3. 全部失败 → 抛出错误，调用层回退到 `fallback_expression`

> ⚠️ 校准注记（2026-06-28）：草稿原写"步骤4：去除 think 块后再次匹配"为独立步骤，有误。实际源码（parseLlmResponse）是 JSON 失败后先去 think 块，再做 Fuse.js + 子串匹配，不是第4步。

来源：`staging/public/scripts/extensions/expressions/index.js` `parseLlmResponse()` | 适用版本：ST 1.14.0 | **high** `[运行时源码]`

### 8.3 文本预处理（sampleClassifyText）

分类前 ST 对文本进行以下预处理：
- 移除推理块（`<think>...</think>`）
- 替换 ST 宏（`{{char}}`、`{{user}}` 等）
- 去星号 / 引号
- 非 LLM 模式：文本 ≥500 字符 → 取首 250 + 尾 250 字符，截到句子边界
- LLM 模式：跳过长度截断

来源：`staging/public/scripts/extensions/expressions/index.js` | **high** `[运行时源码]`

---

## 9 extension_settings 配置字段完整参考

```javascript
extension_settings.expressions = {
    api: 0,                    // EXPRESSION_API 枚举值（0=Local，2=LLM，99=禁用）
    fallback_expression: 'joy',// 默认 fallback 为 'joy'（DEFAULT_FALLBACK_EXPRESSION）；null=不显示
    showDefault: true,         // 无对应 sprite 时显示角色默认头像（emoji）
    custom: [],                // 自定义情绪标签数组（追加到28个之后）
    translate: false,          // 分类前将文本翻译到英文（非英文卡可考虑开启）
    allowMultiple: true,       // ⚠️ 默认 true（migrateSettings 对未定义值写入 true）
    rerollIfSame: false,       // 随机选时禁止连续显示相同 sprite
    filterAvailable: false,    // 仅对 LLM/WebLLM 有效；local 模式下此字段不生效（见坑7）
    llmPrompt: DEFAULT_LLM_PROMPT,  // 可自定义 LLM 分类 prompt
    promptType: 'raw',         // 'raw'（仅末尾消息）| 'full'（完整历史）
};
```

> ⚠️ 校准注记（2026-06-28）：草稿原写 `allowMultiple: false` 与 `fallback_expression: null` 均与源码不符。`migrateSettings()` 对 `allowMultiple === undefined` 写入 `true`；`DEFAULT_FALLBACK_EXPRESSION = 'joy'`。`fallback_expression` 的实际初始值由 UI 初始化流程决定，新安装时 `joy` 为默认。

来源：`staging/public/scripts/extensions/expressions/index.js` migrateSettings() + DEFAULT_FALLBACK_EXPRESSION 常量 | 适用版本：ST 1.12.x–1.15.x | **high** `[运行时源码]`

---

## 10 STscript / Slash Command API

### 10.1 Expressions 扩展命令

```stscript
# 设置表情（情绪标签）；别名：/sprite /emote
/expression-set joy
/expression-set type=expression joy

# 从可用 sprite 文件列表中按文件名选择
/expression-set type=sprite joy-1.png

# ⚠️ /expression-fallback 命令不存在；fallback 只能通过扩展设置 UI 配置，无对应 STscript 命令

# 对文本分类并返回情绪标签；正式名 expression-classify，别名 classify
/expression-classify 她的笑容充满了阳光
/classify api=local filter=true 我感到非常愤怒

# 获取当前角色可用表情列表；正式名 expression-list，别名 expressions（无 get-expressions）
/expression-list
/expressions filter=true

# 获取当前角色最后一个显示的 sprite；正式名 expression-last，别名 lastsprite
/expression-last
/lastsprite CharacterName
```

> ⚠️ 校准注记（2026-06-28）：草稿中 `/expression-fallback` 命令经源码全文检索确认不存在；`/get-expressions` 命令不存在，实际命令为 `expression-list`（别名 `expressions`）；`/classify` 是 `expression-classify` 的别名（验证有效）。

来源：`staging/public/scripts/extensions/expressions/index.js` SlashCommandParser.addCommandObject 注册处 | 适用版本：ST 1.14.0 | **high** `[运行时源码]`

### 10.2 Live2D 扩展命令

```stscript
# 切换 Live2D 表情（expression 文件名，模型内定义）
/live2dexpression character="星月" expression="happy"

# 播放动作（motion 组名 + ID）
/live2dmotion character="星月" motion="Idle_01_1"
# 格式：motionGroup_motionId（如 Idle 组第1个：Idle_1）

# 随机播放某组动作
/live2dmotion character="星月" motion="Idle_random"

# 设置参数值（直接控制 Live2D 参数）
/live2dparameter character="星月" id="PARAM_MOUTH_OPEN_Y" value="0.8"

# 重置所有参数
/live2dresetparameters character="星月"
```

来源：`Extension-Live2d/index.js` | 适用版本：Extension-Live2d 当前版本 | **medium·单源孤证**（部分命令格式需真机验证）

### 10.3 VRM 扩展命令

```stscript
# 指定角色使用的 VRM 模型文件
/vrmmodel Seraphina.vrm
/vrmmodel character=星月 model=xingyue.vrm    # 群聊时指定角色

# 切换表情（BlendShape 预设名）
/vrmexpression happy
/vrmexpression character=星月 expression=angry

# 播放动作
/vrmmotion idle
/vrmmotion character=星月 motion=idle loop=true random=false

# 调整灯光
/vrmlightcolor white
/vrmlightcolor purple
/vrmlightintensity 80    # 0-100 百分比
```

来源：`docs.sillytavern.app/extensions/vrm/` | **high** `[文档·多源]`

---

## 11 Costume / 服装切换系统

服装切换是 Expressions 扩展内建的「覆盖 sprite 文件夹路径」机制，通过 `/costume`（或别名 `/spriteoverride`）命令实现。

### 11.1 三种路径模式

```stscript
# 模式1 - 绝对覆盖：使用 characters/ 下的独立文件夹
/costume winter_character
# → /data/<user>/characters/winter_character/joy.png

# 模式2 - 子文件夹：在当前角色文件夹内的子目录（注意反斜杠前缀）
/costume \winter
# → /data/<user>/characters/CharName/winter/joy.png

# 模式3 - 恢复默认
/costume
# 无参数 = 清除覆盖，回到角色默认路径
```

**极易混淆**：`/costume winter` 是全局覆盖（找 `characters/winter/`），`/costume \winter` 或 `/costume /winter`（前缀正斜杠或反斜杠均可，源码注释："If the name starts with a slash or a backslash"）才是子文件夹（找 `characters/CharName/winter/`）。见 18 节坑8。

命令别名：`/costume` = `/spriteoverride` = `/expression-folder-override`

来源：`staging/public/scripts/extensions/expressions/index.js` + 官方文档 | **high** `[运行时源码]` + `[文档·多源]`

### 11.2 子文件夹布局示例

```
characters/
├── 星月.png
└── 星月/
    ├── joy.png              ← 默认服装
    ├── joy-1.png            ← 默认服装变体2
    ├── 校服/               ← 服装1子文件夹
    │   ├── joy.png
    │   └── sadness.png
    └── 泳装/               ← 服装2子文件夹
        └── joy.png
```

STscript 切换：
```stscript
/costume \校服              # 切换到校服立绘
/costume                   # 恢复默认
```

子文件夹只需提供需要覆盖的标签，未覆盖的标签 **不会** 自动 fallback 到父文件夹，而是显示 `fallback_expression` 或无图。

来源：`staging/public/scripts/extensions/expressions/index.js` | **high** `[运行时源码]`

---

## 12 Live2D 扩展技术规格

### 12.1 安装路径与文件结构

```
/data/<user-handle>/assets/live2d/
└── ModelName/                          ← 模型文件夹
    ├── ModelName.model.json            ← Cubism 2/3 描述文件（必须在根目录）
    ├── ModelName.model3.json           ← Cubism 4/5 描述文件（必须在根目录）
    ├── ModelName.moc / ModelName.moc3  ← 网格数据
    ├── textures/                       ← 贴图
    ├── expressions/                    ← 表情文件（.exp.json / .exp3.json）
    └── motions/                        ← 动作文件（.motion.json / .motion3.json）

# 角色专属模型（优先级更高，覆盖全局路径）：
/data/<user-handle>/characters/CharacterName/live2d/
└── ModelName/
    └── ...（同上结构）
```

**关键**：ST 通过扫描根目录下的 `*.model.json` 或 `*.model3.json` 来识别模型，文件放错层级将无法被检测（见 18 节坑9）。

来源：`docs.sillytavern.app/extensions/live2d/` + `Extension-Live2d` GitHub README | **high** `[文档·多源]`

### 12.2 情绪-动作映射配置（extension_settings 结构）

配置存储在 `extension_settings.live2d.characterModelsSettings`：

```javascript
extension_settings.live2d.characterModelsSettings = {
    "CharacterName": {
        "/path/to/model.model3.json": {
            // 进入聊天时的启动动画
            "animation_starter": {
                "expression": "happy",    // 表情文件名（不含扩展名）
                "motion": "Start_1",      // 格式：MotionGroup_MotionId
                "delay": 1000             // 毫秒
            },
            // 角色发消息时的默认动画
            "animation_default": {
                "expression": "neutral",
                "motion": "Talk_random"   // random = 从该组随机选
            },
            // 用户点击模型时触发
            "animation_click": {
                "expression": "surprised",
                "motion": "Reaction_1",
                "message": "别这样！"    // 可选：自动发送消息到聊天
            },
            // 情绪分类映射（28个GoEmotions标签 → Live2D表情/动作）
            "classify_mapping": {
                "joy":       { "expression": "happy",    "motion": "Happy_1"    },
                "sadness":   { "expression": "sad",      "motion": "Sad_1"      },
                "anger":     { "expression": "angry",    "motion": "Angry_1"    },
                "neutral":   { "expression": "neutral",  "motion": "Idle_random" },
                // ... 其余 24 个标签按相似情绪归并
            },
            // 口型同步参数
            "param_mouth_open_y_id": "PARAM_MOUTH_OPEN_Y",
            "mouth_open_speed": 15,
            "mouth_time_per_character": 50    // ms/字符
        }
    }
}
```

来源：`Extension-Live2d/index.js` + `live2d.js` | **medium·单源孤证** `[运行时源码]`（Extension-Live2d 为独立扩展仓，本地无源码，未经本次回源验证）

### 12.3 口型同步实现原理

```javascript
// 基于正弦波驱动嘴部参数，100ms 刷新
while ((Date.now() - startTime) < duration) {
    mouth_y = Math.sin((Date.now() - startTime) / speed);
    model.internalModel.coreModel.addParameterValueById(
        param_mouth_open_y_id, mouth_y);
    await sleep(100);
}
```

- `duration` = 消息字符数 × `mouth_time_per_character`（ms）
- `speed` 控制正弦波频率（`mouth_open_speed`，值越小频率越高）

来源：`Extension-Live2d/live2d.js` | **medium·单源孤证** `[运行时源码]`（扩展仓源码，本地无副本，未经本次回源验证）

### 12.4 HitArea 优先级系统

点击模型时，ST 按以下顺序处理：

1. 遍历所有命中的 hitArea
2. 按 `index`（优先级数字，**越小越高**）排序
3. 执行优先级最高的 hitArea 对应的 expression + motion + message（可选）
4. 无 hitArea 命中时执行 `animation_click` 默认配置

来源：`Extension-Live2d/index.js` | **medium·单源孤证** `[运行时源码]`（扩展仓源码，本地无副本，未经本次回源验证）

---

## 13 VRM 扩展技术规格

### 13.1 文件结构

```
/data/<user-handle>/assets/vrm/
├── model/
│   └── character.vrm          ← VRM 1.0 / 0.x 格式均支持
└── animation/
    ├── idle1.bvh              ← 同基名+数字 = 自动归同一组
    ├── idle2.bvh              ← 与 idle1 同组，播放时随机选
    └── dance.fbx              ← Mixamo / XR Animator 重定向导出
```

来源：`docs.sillytavern.app/extensions/vrm/` | **high** `[文档·多源]`

### 13.2 情绪映射

VRM 使用与 Expressions 扩展相同的 28 个 GoEmotions 标签，自动映射到 VRM BlendShape 预设名（`Happy`、`Angry`、`Sad` 等 VRM 标准预设）。精确映射表未在文档中公开，见第 20 章悬案 U4。

来源：`docs.sillytavern.app/extensions/vrm/` | **medium·单源孤证** `[文档·单源]`（精确 BlendShape 名称映射表未验证）

### 13.3 支持格式

- 模型：`.vrm`（VRM 0.x / 1.0）
- 动画：`.fbx`、`.bvh`（需 Mixamo 或 XR Animator 针对 VRM 骨骼重定向，见 18 节坑10）
- 动画分组规则：同一基名 + 数字后缀的文件自动归同一组，播放时随机选

来源：`docs.sillytavern.app/extensions/vrm/` | **high** `[文档·多源]`

---

## 14 Visual Novel 模式下的行为

- **单角色**：sprite 居中显示（而非侧边）
- **Group Chat**：多角色 sprite 自动横向铺开，相互「让位」
- **位置持久化**：`power_user.movingUIState` 存储用户拖动后的位置（MovingUI 功能，仅桌面端）
- **Prome 扩展**：可添加 Letterbox 模式、传统 VN 模式（仅显示单条消息）、Focus 模式（非发言角色 sprite 变暗）

淡入淡出动画的具体持续时间参数，见第 20 章悬案 U3。

来源：`docs.sillytavern.app/usage/user-settings/visual-novel/` | **medium·单源孤证** `[文档·单源]`

---

## 15 服务端 API 端点参考

| Endpoint | Method | 用途 |
|----------|--------|------|
| `/api/sprites/get` | GET | 获取角色 sprite 列表（`?name=CharName&subfolder=...`） |
| `/api/sprites/upload` | POST | 上传单个 sprite 文件 |
| `/api/sprites/upload-zip` | POST | 批量上传 ZIP 包 |
| `/api/sprites/delete` | POST | 按标签删除 sprite |
| `/api/images/list` | POST | 列出图片资产 |
| `/api/images/upload` | POST | 上传通用图片资产 |

来源：`SillyTavern/SillyTavern:staging/src/endpoints/sprites.js` | 适用版本：ST 1.12.x–1.15.x | **high** `[运行时源码]`

---

## 16 expressions-plus 第三方扩展

GitHub：`https://github.com/Tyranomaster/expressions-plus`

要求：ST >= 1.15.0；使用前**必须禁用内置 Expressions 扩展**（见 18 节坑4）。

### 16.1 增强特性

- **Expression Rules（表情规则）**：基于情绪置信度阈值的自定义触发
  - Range Rule：当某情绪置信度在 X%–Y% 之间时触发指定 sprite
  - Combination Rule：当多个情绪同时出现、且置信度差 ≤Z% 时触发（如「苦甜参半」= joy + sadness 差 ≤25%）
- **Profiles（配置集）**：可命名、导入/导出、按角色分配的规则集合
- **Folder Profile**：在 sprite 文件夹内放 `expressions-plus-profile.json`，随 ZIP 包分发（JSON schema 见第 20 章悬案 U6）
- **实时 Insight Panel**：浮动面板，显示 Top 5 情绪置信度条形图 + 当前触发表情 + 是否自定义规则触发

### 16.2 分类器

使用 `distilbert-base-uncased-go-emotions`（~100MB），与官方 Local 模式相同模型族。

来源：GitHub README + WebFetch | **high** `[文档·多源]`

---

## 17 talkinghead（历史·已废弃）

> **废弃版本：ST 1.12.13（2024 年）**。下方内容仅作历史记录，**禁止在新建卡中使用**。

- **原理**：从单张静态图生成 Live2D 式面部动画 + TTS 口型同步
- **依赖**：SillyTavern-Extras（Python >= 3.8，PyTorch >= 1.11.0，`--enable-modules=classify,talkinghead`）+ SillyTavern-Extras 本身标注 `[OBSOLETE]`
- **集成方式**：在角色卡表情上传区上传 `talkinghead.png`，勾选 checkbox 后替换当前表情显示
- **API**：`YOUR_EXT_URL:PORT/api/talkinghead/result_feed`（结果流）
- **官方替代方案**：文档**未提供**替代方案；事实上的替代是 Live2D 或 VRM 扩展

来源：`docs.sillytavern.app/extensions/talkinghead/` | **high** `[文档·多源]` `[历史孤证:2024]`

---

## 18 高频避坑

| 编号 | 坑名 | 说明 | 置信度 | 来源 |
|------|------|------|--------|------|
| 坑1 | 文件夹名大小写敏感 | Linux 服务器区分大小写，sprite 文件夹名必须与角色卡名称完全一致；Windows 开发时不会暴露此问题 | **high** | `[文档·多源]` |
| 坑2 | ZIP 包不能含子文件夹 | ZIP 内所有图片必须平铺在根目录，有子文件夹则上传失败或部分文件丢失 | **high** | `[运行时源码]` |
| 坑3 | `allowMultiple` 行为与旧文档描述不符 | migrateSettings() 对未设置的实例写入 `true`，新安装默认多变体随机选。若历史存档已有该字段且值为 `false` 则旧行为（只取第一个）仍生效。升级后若发现随机失效，检查存档中该字段值。 | **medium·单源孤证** `[运行时源码]`（未真机验证新安装初始值） |
| 坑4 | expressions-plus 与原生扩展冲突 | 两个扩展同时启用会导致行为冲突；必须在 ST 扩展面板禁用内置 Expressions 扩展后再启用 expressions-plus | **high** | `[GitHub README]` |
| 坑5 | talkinghead 已完全废弃 | ST >= 1.12.13 不再支持，SillyTavern-Extras 也已标注 OBSOLETE；新卡勿用 | **high** | `[文档·多源]` |
| 坑6 | 流式输出中表情更新频率降低 | 流式生成时 moduleWorker 间隔从 2000ms 降到 10000ms，表情切换变慢；这是预期行为而非 bug | **high** | `[运行时源码]` |
| 坑7 | `filterAvailable` 仅对 LLM/WebLLM 有效 | 源码验证：`filterAvailable` 在 local 模式下完全不生效（仅打 debug log，分类器仍返回全部28个标签中最匹配的一个）；仅 LLM/WebLLM 模式下才会把可用标签列表传入 prompt 限制输出范围。若在 LLM 模式下开启，只有少数 sprite 时确实存在语义错位风险。 | **medium·推导未验证** `[运行时源码]` + `[推断]` | 已验证 local 无效，LLM 模式语义错位风险为推断 |
| 坑8 | costume 子文件夹前缀易混淆 | `/costume winter` 是全局覆盖（找 `characters/winter/`），`/costume \winter` 或 `/costume /winter`（正斜杠或反斜杠均可，源码注释明文说明）才是子文件夹（找 `characters/CharName/winter/`）；多/少一个前缀结果完全不同 | **high** `[运行时源码]` |
| 坑9 | Live2D model.json 必须在根目录 | ST 通过扫描根目录下 `*.model.json` / `*.model3.json` 识别模型；放错层级将无法被检测 | **high** | `[文档]` + `[GitHub]` |
| 坑10 | VRM 动画需针对 VRM 骨骼重定向 | 通用 FBX/BVH 动画不能直接用于 VRM，需经 Mixamo 或 XR Animator 针对 VRM 骨骼进行重定向处理 | **high** | `[文档·多源]` |

---

## 19 施工直用范式代码

### 范式1：最小可用 Sprites 包结构

```
角色名/                        ← 与角色卡文件名精确匹配（不含 .png 扩展名）
├── neutral.png               ← 必备（分类失败/fallback 时显示）
├── joy.png
├── sadness.png
├── anger.png
├── fear.png
├── surprise.png
└── disgust.png               ← 共 7 个覆盖基础情绪，按需补充到 28 个
```

未提供的标签会 fallback 到 `fallback_expression`（建议设为 `neutral`）。

### 范式2：多变体服装系统完整布局

```
characters/
├── 星月.png                   ← 角色头像
└── 星月/
    ├── joy.png               ← 默认服装
    ├── joy-1.png             ← 默认服装 joy 的变体2（需 allowMultiple=true 才随机选）
    ├── neutral.png
    ├── 校服/                 ← 服装1子文件夹
    │   ├── joy.png
    │   ├── neutral.png
    │   └── sadness.png
    └── 泳装/                 ← 服装2子文件夹
        └── joy.png
```

STscript 切换：
```stscript
/costume \校服              # 切换到校服立绘
/costume \泳装              # 切换到泳装立绘
/costume                   # 恢复默认（反斜杠为 Windows 路径分隔符）
```

### 范式3：Live2D 情绪映射配置（28 标签归并参考）

```javascript
// classify_mapping 配置参考——按情绪簇归并到常见 Live2D 表情
"classify_mapping": {
    // 正向情绪簇
    "joy":            { "expression": "happy",     "motion": "Happy_1"    },
    "excitement":     { "expression": "happy",     "motion": "Happy_2"    },
    "amusement":      { "expression": "smile",     "motion": "Idle_1"     },
    "love":           { "expression": "happy",     "motion": "Happy_1"    },
    "admiration":     { "expression": "smile",     "motion": "Idle_1"     },
    "approval":       { "expression": "smile",     "motion": "Idle_1"     },
    "gratitude":      { "expression": "happy",     "motion": "Happy_1"    },
    "pride":          { "expression": "smile",     "motion": "Idle_1"     },
    "optimism":       { "expression": "smile",     "motion": "Idle_1"     },
    "caring":         { "expression": "smile",     "motion": "Idle_1"     },
    "relief":         { "expression": "neutral",   "motion": "Idle_1"     },
    // 负向情绪簇
    "sadness":        { "expression": "sad",       "motion": "Sad_1"      },
    "grief":          { "expression": "sad",       "motion": "Sad_2"      },
    "disappointment": { "expression": "sad",       "motion": "Sad_1"      },
    "remorse":        { "expression": "sad",       "motion": "Sad_1"      },
    "anger":          { "expression": "angry",     "motion": "Angry_1"    },
    "annoyance":      { "expression": "annoyed",   "motion": "Angry_1"    },
    "disapproval":    { "expression": "annoyed",   "motion": "Angry_1"    },
    "disgust":        { "expression": "angry",     "motion": "Angry_1"    },
    // 紧张/恐惧簇
    "fear":           { "expression": "scared",    "motion": "Scared_1"   },
    "nervousness":    { "expression": "scared",    "motion": "Idle_1"     },
    // 认知/社交簇
    "surprise":       { "expression": "surprised", "motion": "React_1"    },
    "realization":    { "expression": "surprised", "motion": "React_1"    },
    "confusion":      { "expression": "confused",  "motion": "Idle_1"     },
    "curiosity":      { "expression": "curious",   "motion": "Idle_1"     },
    "desire":         { "expression": "happy",     "motion": "Idle_1"     },
    "embarrassment":  { "expression": "shy",       "motion": "Idle_1"     },
    // 中性
    "neutral":        { "expression": "neutral",   "motion": "Idle_random" }
}
```

### 范式4：STscript 手动情绪驱动立绘（特殊场景覆盖）

```stscript
{{#if (contains {{lastMessageContent}} "愤怒")}}
/expression-set anger
{{else if (contains {{lastMessageContent}} "开心")}}
/expression-set joy
{{else}}
/expression-set neutral
{{/if}}
```

注：通常直接依赖 classify 自动处理；手动覆盖仅用于剧情关键节点或需要精确控制的特殊场景。

### 范式5：ZIP 批量上传最小有效结构

```bash
# 构建有效 ZIP（平铺根目录，无子文件夹）
cd /path/to/sprites/角色名/
zip -j sprite_pack.zip *.png    # -j 参数 = junk paths（去除路径信息）
```

---

## 20 悬案（未决项 + 真机验证路径）

**U1 悬案 — `love` 是否在 GoEmotions 标准 28 集内**
本地 Seraphina 文件夹存在 `love.png`，源码 `DEFAULT_EXPRESSIONS` 数组计数为 28（含 love），与标准 GoEmotions 28 类标签集（含 love）一致。但部分社区文档（DeepWiki MOD 版本）的列表缺少 `love`。

验证路径：在 ST 源码执行 `grep -n "DEFAULT_EXPRESSIONS" staging/public/scripts/extensions/expressions/index.js` 并数出数组元素个数。

置信度：**medium·推导未验证** — 源码数组已经读到，但「是否完全与标准 GoEmotions 28 类一致」这一语义问题未精确核对完整数组。

---

**U2 悬案 — Live2D Cubism SDK 版本支持范围**
文档和 README 均未明确说明支持 Cubism 2/3/4/5 的哪些版本；扩展使用外部 `live2d-widget` 库，版本由该库决定。

验证路径：查看 `Extension-Live2d/package.json` 中的 `live2d-widget` 或类似依赖的版本号。

置信度：**low** — 无来源支撑，禁止据此施工。

---

**U3 悬案 — 淡入淡出动画的持续时间参数**
文档提到表情切换有「cross-fade animation」，但具体时长（ms）、是否可配置均未文档化。

验证路径：在 ST 源码中 `grep "fade"` 或 `grep "transition"` in `staging/public/scripts/extensions/expressions/index.js`。

置信度：**low** — 无来源支撑。

---

**U4 悬案 — VRM BlendShape 名称到 GoEmotions 标签的精确映射表**
文档说「支持 28 个分类自动映射」，但未给出 GoEmotions 标签 → VRM BlendShape 预设名的对照表（`Happy`、`Angry`、`Sad` 等实际名称是否与 VRM 规范一致未验证）。

验证路径：读取 `Extension-VRM` 源码中的映射配置对象。

置信度：**medium·推导未验证** `[文档·单源]`。

---

**U5 悬案 — 自定义标签（custom 数组）与 LLM 分类的 token 上限**
custom 标签理论上无数量上限，但 LLM 分类 prompt 把所有标签塞入时，过多标签可能超过 LLM 上下文窗口或导致指令遵循能力下降。

验证路径：在 ST 中添加 50+ 自定义标签后测试 LLM 分类是否正常工作、标签列表是否被截断。

置信度：**medium·推导未验证** `[推断]`。

---

**U6 悬案 — `expressions-plus-profile.json` 完整 JSON schema**
README 提到「Folder Profiles」可通过此文件随 sprite 包分发，但未公开完整 JSON schema。

验证路径：从已有的 expressions-plus 扩展导出功能获取 JSON 样本，或查看源码中的 schema 定义。

置信度：**low** — 无 schema 文档，禁止据此手写 profile 文件。

---

## 来源索引

| 来源 | 类型 | 适用章节 |
|------|------|---------|
| `https://docs.sillytavern.app/extensions/expression-images/` | `[文档·多源]` | 全部 |
| `https://docs.sillytavern.app/extensions/live2d/` | `[文档·多源]` | 第12章 |
| `https://docs.sillytavern.app/extensions/vrm/` | `[文档·多源]` | 第13章 |
| `https://docs.sillytavern.app/extensions/talkinghead/` | `[文档·多源]` | 第17章 |
| `https://docs.sillytavern.app/usage/user-settings/visual-novel/` | `[文档·单源]` | 第14章 |
| `SillyTavern/SillyTavern:staging/public/scripts/extensions/expressions/index.js` | `[运行时源码]` | 第1-10章 |
| `SillyTavern/SillyTavern:staging/src/endpoints/sprites.js` | `[运行时源码]` | 第4-5章，第15章 |
| `SillyTavern/Extension-Live2d:main/index.js` + `live2d.js` | `[运行时源码]` | 第12章 |
| `https://github.com/Tyranomaster/expressions-plus` | `[文档·多源]` | 第16章 |
| `https://deepwiki.com/zhaiiker/SillyTavernMOD/8.6-character-expressions` | `[文档·单源]`（MOD 版） | 第20章 U1 悬案 |
| `<local-user-path>/OneDrive\ST-\SillyTavern-1.14.0\data\default-user\characters\Seraphina\` | `[真机]` | 第2章，第3章 |
