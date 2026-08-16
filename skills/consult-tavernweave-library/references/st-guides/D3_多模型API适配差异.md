# 多模型 API 适配差异参考手册

> 文档版本：v1.0.0 ｜ 最后更新：2026-07-14

## SillyTavern 多后端接入 · 参数支持矩阵 · 避坑速查

> **适用对象**：在 SillyTavern 中对接 Anthropic / Google Gemini / OpenAI / Mistral 等云端 API 的卡作者与集成者。
>
> **置信度说明**：本手册采用「三级 + 依据类型」双轴标注，完整规则见下方〈0 置信度分级体系〉。

---

## 目录

0. [置信度分级体系（全手册适用）](#0-置信度分级体系全手册适用)
1. [两大范式：Chat Completion vs Text Completion](#1-两大范式chat-completion-vs-text-completion)
2. [ST 请求流架构与关键文件](#2-st-请求流架构与关键文件)
3. [Chat Completion 核心参数支持矩阵](#3-chat-completion-核心参数支持矩阵)
4. [Claude (Anthropic) 专有参数与行为](#4-claude-anthropic-专有参数与行为)
5. [Google Gemini 专有参数与行为](#5-google-gemini-专有参数与行为)
6. [OpenAI (GPT-4o / o 系列) 专有参数](#6-openai-gpt-4o--o-系列专有参数)
7. [Prompt Post-Processing 五种模式](#7-prompt-post-processing-五种模式)
8. [System Prompt 与 Prefill 处理差异](#8-system-prompt-与-prefill-处理差异)
9. [Claude 当前模型 ID 完整表](#9-claude-当前模型-id-完整表)
10. [Anthropic Prompt Caching 完整配置](#10-anthropic-prompt-caching-完整配置)
11. [高频避坑清单（TOP 10）](#11-高频避坑清单top-10)
12. [完整可用范式代码](#12-完整可用范式代码)
13. [悬而未决：需真机验证的问题](#13-悬而未决需真机验证的问题)

---

## 0 置信度分级体系（全手册适用）

> **收集日期统一声明**：本手册全部条目收集于 **2026-06-28**，交叉验证跨 8 个独立来源。源码级断言的回源核实基于 SillyTavern **v1.14.0**（`chat-completions.js`、`prompt-converters.js` 等）；Anthropic API 状态对齐至 **2026-06 最新**；本地成熟卡验证基于 **星月 2.5.0 / 交错 2.6.0**。

每条结论采用 **置信度等级 + 依据类型** 双轴标注。

### 0.1 置信度三级

| 级别 | 含义 | 判定标准 |
|---|---|---|
| **high** | 已坐实，可直接施工 | 有运行时证据（真机实测 / 读到运行时实现源码 / 生产卡验证）；结论是源码/文档的直接事实而非下游推导；不在悬案清单 |
| **medium** | 待验证，施工前须实测 | 强制二选一子标签：`medium·单源孤证`（单一来源、无第二源、无实测）/ `medium·推导未验证`（源码或逻辑推导成立但未跑通，须随附真机验证路径）|
| **low** | 孤证无源，禁止据此施工 | 零来源猜测 / 纯历史快照（须标年份 + 窄缩适用范围）|

### 0.2 依据类型标签（与置信度正交，强制标注）

`[运行时源码]`、`[真机]`、`[文档·多源]`、`[文档·单源]`、`[社区]`、`[推断]`、`[历史孤证:年份]`、`[无源·待考]`

### 0.3 两条铁规

1. **「从源码事实再推一步」的下游推导，即使源码本身已直读，该推导结论最高只能 `medium·推导未验证`**——除非已真机验证；源码内部事实仍标 `high [运行时源码]`。
2. **节级标注 = 节内条目下确界**——禁止整节标 high 却内含悬案条目；冲突即在节内局部降级。正文断言凡命中悬案章（本手册第13章 U 系列）的，置信度不得高于该悬案对应级别，并交叉引用。

---

## 1 两大范式：Chat Completion vs Text Completion

### 核心结论

ST 接入 AI 后端的两条根本路径，决定 prompt 构建、参数可用集、tokenizer 选择方式均不同。所有云 API（Anthropic、Google、OpenAI、Mistral）走 Chat Completion；本地后端（KoboldCpp、llama.cpp、Oobabooga、TabbyAPI）通常走 Text Completion。

来源：docs.sillytavern.app Advanced Formatting ｜ 适用版本：ST v1.12.x+ ｜ 置信度：high `[文档·多源]`

| 维度 | Chat Completion | Text Completion |
|---|---|---|
| 数据结构 | Role-based 消息数组 `[{role, content}, ...]` | 单一连续字符串 |
| Prompt 构建 | Prompt Manager（ST 界面拖拽） | Advanced Formatting + Context Template + Instruct Mode |
| Tokenizer | 自动匹配（由后端返回） | 需手动选择或自动派生（仅 llama.cpp/KoboldCpp 支持 hash 匹配） |
| 主要适用 | OpenAI / Claude / Gemini / Mistral 等云 API | KoboldCpp / Oobabooga / llama.cpp / TabbyAPI 等本地后端 |
| System Prompt | 由 provider 原生支持（Claude/Gemini），或合并进 user 消息 | 手动构建 story string + system sequence |
| Stop Strings | `stop_sequences`（Claude）/ `stop`（OAI）等 | 模板前缀序列自动充当 stop |

### 避坑

- Text Completion 的 Instruct Mode 模板与 Chat Completion 的 Prompt Manager **互斥**，切换后端时须确认激活了正确的 prompt 构建路径。
- 同一角色卡在两种模式下格式体验差异极大，勿混用。

---

## 2 ST 请求流架构与关键文件

### 核心结论

ST Chat Completion 请求的完整链路（高层概览）：

```
用户消息
  → public/scripts/openai.js           前端请求构建、参数收集
  → POST /api/backends/chat-completions
  → src/endpoints/backends/chat-completions.js   后端路由 + 各 provider 分发
  → src/prompt-converters.js           格式转换（Claude / Google / Cohere 等）
  → 各 provider API（Anthropic / Google / OpenAI 等）
```

来源：ST staging 源码 `chat-completions.js` ｜ 适用版本：ST 1.14.x–1.16.x ｜ 置信度：high `[运行时源码]`

### 关键函数速查

| 文件 | 函数 | 职责 |
|---|---|---|
| `chat-completions.js` | `sendClaudeRequest()` | Anthropic API 请求发送、参数组装 |
| `chat-completions.js` | `sendGoogleRequest()` | Gemini API 请求发送 |
| `prompt-converters.js` | `convertClaudeMessages()` | 消息数组 → Claude `system` + `messages` 格式 |
| `prompt-converters.js` | `convertGooglePrompt()` | 消息数组 → Gemini `contents` + `systemInstruction` 格式 |
| `prompt-converters.js` | `convertCohereMessages()` | 消息数组 → Cohere 格式 |

---

## 3 Chat Completion 核心参数支持矩阵

### 核心结论

各 provider 对 Chat Completion 通用参数的实际支持差异显著，不可假定参数可跨 provider 通用。

来源：ST v1.14.0 源码 + Anthropic/Google/OpenAI 文档 ｜ 适用版本：ST 1.14.x / API 2026-06 ｜ 置信度：`medium·单源孤证`（矩阵整体；各单元格独立标注见下）`[运行时源码 + 文档·多源]`

> **注意**：本矩阵基于 ST v1.14.0 源码验证；高版本（1.15/1.16）行为以 staging 源码为准。Claude Sonnet 4.6 的 temperature 状态详见第13章 U3（悬案）。

| 参数 | OpenAI (GPT-4o/o3) | Claude (Anthropic) | Gemini (Google) | Mistral |
|---|---|---|---|---|
| `temperature` | ✅ 0.0-2.0 | ⚠️ 0.0-1.0，Opus 4.7+ 禁用；Sonnet 4.6 详见第13章 U3 | ✅ 0.0-2.0 | ✅ |
| `top_p` | ✅ | ⚠️ 与 temperature 互斥，Opus 4.7+ 禁用；Sonnet 4.6 详见第13章 U3 | ✅（字段名 `topP`） | ✅ |
| `top_k` | ❌ | ⚠️ 支持（旧模型）但 Opus 4.7+ 禁用；Sonnet 4.6 支持情况详见第13章 U3 | ✅（字段名 `topK`，最大 500） | ❌ |
| `frequency_penalty` | ✅ | ❌ | ❌ | ✅ |
| `presence_penalty` | ✅ | ❌ | ❌ | ✅ |
| `max_tokens` | ✅（字段名 `max_completion_tokens`） | ✅（**必填**，无默认值） | ✅（字段名 `maxOutputTokens`） | ✅ |
| `stop` / `stop_sequences` | `stop`（数组） | `stop_sequences`（数组） | 无直接等价 | `stop` |
| `stream` | ✅ SSE | ✅ SSE | ✅ SSE | ✅ |
| `seed` | ✅（确定性输出） | ❌ | ✅ | ✅ |
| `logit_bias` | ✅ | ❌ | ❌ | ❌ |
| `safe_prompt` | ❌ | ❌ | `safetySettings`（独立字段） | ✅（Mistral 特有） |
| `systemInstruction` | ❌ | ❌（用独立 `system` 字段） | ✅ | ❌ |
| Thinking 控制 | `reasoning_effort`（o 系列） | `thinking` + `output_config.effort` | `thinkingBudget` / `thinkingLevel` | ❌ |

### 避坑

- Claude Opus 4.7+ 发送 `temperature`/`top_p`/`top_k` 将直接返回 **400 错误**（不是忽略，是拒绝）。置信度：high `[文档·多源]`
- `top_p` 与 `temperature` 在 Sonnet 4.5 / Haiku 4.5 上互斥，只能二选一发送（ST v1.14.0 源码 `isLimitedSampling` 正则覆盖这两款，逻辑已验证）。置信度：high `[运行时源码]`
- **Sonnet 4.6 的 sampling 状态**：官方迁移文档明确 Sonnet 4.6 可用 temperature 或 top_p（二选一），但 ST v1.14.0 的 `isLimitedSampling` 正则不覆盖 `sonnet-4-6`，意味着该 ST 版本会无条件向 Sonnet 4.6 发送全部参数——是否导致 400 需真机验证，详见第13章 U3。置信度：medium·推导未验证 `[运行时源码 + 文档·单源]`

---

## 4 Claude (Anthropic) 专有参数与行为

### 4.1 请求体标准结构

**核心结论**：Claude Messages API 请求体格式，`system` 是数组（非字符串），最后一条 `assistant` 消息充当 prefill。

来源：Anthropic 官方 API 文档 + ST `chat-completions.js` 源码 ｜ 适用版本：Anthropic API 2026-06 ｜ 置信度：high `[运行时源码 + 文档·多源]`

```json
{
  "model": "claude-opus-4-8",
  "max_tokens": 4096,
  "system": [
    {
      "type": "text",
      "text": "你是一个角色扮演助手...",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好！我是"}
  ],
  "stop_sequences": ["Human:", "\n\nHuman:"],
  "stream": true
}
```

**注意事项**：
- `system` 字段为**数组**（支持多个 text block），不是字符串——直接传字符串 API 能接受，但不支持 `cache_control`。
- 最后一条 `assistant` 消息作为 **prefill**（ST 的 `assistant_prefill` 功能），Claude 从该文本继续生成。
- `max_tokens` 是**必填字段**，无默认值，漏填直接报错。

---

### 4.2 Sampling 参数废弃时间线（重大坑）

**核心结论**：Anthropic 在 Opus 4.7 及以上型号彻底废弃 sampling 参数，发送非默认值即 400。

来源：Anthropic 迁移文档 + narracomm 报道 + ST GitHub issue #4929 ｜ 适用版本：Anthropic API 2026-Q2 ｜ 置信度：high `[文档·多源 + 社区]`

| 模型 | temperature | top_p | top_k | 处理方式 |
|---|---|---|---|---|
| Claude 3.x / Opus 4.5 及以前 | ✅ 0.0-1.0 | ✅ | ✅ | 正常发送 |
| Claude Sonnet 4.5 / Haiku 4.5 | ⚠️ | ⚠️ 与 temp 二选一 | ❌（top_k 单独无限制，但 isLimitedSampling 不删它） | 只能发 temp 或 top_p 其中一个 |
| Claude Sonnet 4.6 | ⚠️ temp 或 top_p 二选一 | ⚠️ 与 temp 二选一 | ❓（官方未明确，详见第13章 U3） | **置信度：medium·单源孤证 `[文档·单源]`**，需真机验证 |
| Claude Opus 4.7 / Opus 4.8 | ❌ | ❌ | ❌ | **发送即 400 错误** |
| Claude Fable 5 / Mythos 5 | ❌ | ❌ | ❌ | **发送即 400 错误** |

**ST 现状（v1.14.0 实测）**：`isLimitedSampling` 正则 `/^claude-(opus-4-1|sonnet-4-5|haiku-4-5)/` 只覆盖旧模型，Sonnet 4.6 / Opus 4.7+ 均不在此正则内，意味着 ST v1.14.0 对这些新模型会无条件发 temperature + top_p + top_k（仅 thinking 激活时才自动删除）。用 Opus 4.7+ 必须通过参数过滤代理中转或等待 ST 修复。置信度：high `[运行时源码]`

**Anthropic 官方替代控制方案**：
- 用 prompt engineering 控制风格（sampling 参数不再生效）
- 对推理深度使用 `output_config.effort`

---

### 4.3 Thinking / Adaptive Thinking 参数

**重要区分**：API 层面（Anthropic 官方）已迁移至 `adaptive` 模式；但 ST v1.14.0 服务端源码仍用旧 `budget_tokens` 格式。以下分两层说明。

来源：Anthropic Adaptive Thinking 文档（API 层）+ ST v1.14.0 `chat-completions.js` 源码（ST 行为层）｜ 适用版本：Anthropic API 2026-06 / ST v1.14.0 ｜

#### Anthropic API 官方现状（high `[文档·多源]`）

| 模型代 | 旧 API（状态） | 新 API |
|---|---|---|
| Opus 4.6 / Sonnet 4.6 | `thinking: {type:"enabled", budget_tokens: N}`（已弃用，仍可用） | `thinking: {type:"adaptive"}` 推荐 |
| Opus 4.7 / Opus 4.8 | `thinking: {type:"enabled", ...}` → **400 错误** | `thinking: {type:"adaptive"}` 唯一方式 |
| Fable 5 / Mythos 5 | 无法禁用 | always on，`{type:"disabled"}` 不支持 |

#### Effort 参数（控制思考深度，与 adaptive 配合使用）

```json
{
  "thinking": {"type": "adaptive", "display": "summarized"},
  "output_config": {"effort": "medium"}
}
```

| effort 值 | 行为 |
|---|---|
| `max` | 无约束深度思考，始终思考 |
| `xhigh` | 深度探索（仅 Fable 5 / Mythos 5 / Opus 4.8 / 4.7） |
| `high`（默认） | 几乎始终思考 |
| `medium` | 中等思考，简单问题可能跳过 |
| `low` | 最小化思考 |

#### ST v1.14.0 实际发送格式（medium·推导未验证 `[运行时源码]`）

**⚠️ 草稿原声明需要修正**：ST v1.14.0 源码（`chat-completions.js` 第256-259行）用的是旧 `budget_tokens` 格式：

```js
// ST v1.14.0 实际代码
requestBody.thinking = {
    type: 'enabled',
    budget_tokens: budgetTokens,
};
```

**ST v1.14.0 不发送** `reasoning_effort` 或 `include_reasoning` 至 Anthropic 端点（这些字段仅用于 OpenAI/OpenRouter 端点）。issue #5558 的 "ST 发 reasoning_effort 到 Claude" 报告适用于更高版本（若有此 issue），v1.14.0 源码中 Claude 路径未见此格式。建议在使用高版本 ST（1.15+）时自行抓包验证实际请求体。置信度：medium·推导未验证

**避坑**：若启用 thinking 且出现结构冲突（末尾 assistant prefill + thinking 块），ST 会触发 `fixThinkingPrefill` 逻辑将末尾 assistant 消息转为 user 消息，行为变化须注意。置信度：high `[运行时源码]`（v1.14.0 第267-269行可直读）

---

### 4.4 Prompt Caching 参数（ST 配置）

**核心结论**：ST 通过 `config.yaml` 控制 Anthropic Prompt Caching 行为，启用后对 `system` 数组末尾项追加 `cache_control`。

来源：ST 社区文档 + 源码 ｜ 适用版本：ST 1.14.x+ ｜ 置信度：high `[社区 + 运行时源码]`

ST `config.yaml` 相关键：
```yaml
claude:
  enableSystemPromptCache: true    # 系统提示启用 cache_control
  cachingAtDepth: 2                # 从倒数第 2 条消息开始缓存（偶数值，避免 0）
  enableChatHistoryCaching: true
```

当 `enableSystemPromptCache: true` 时，ST 对 `system` 数组最后一项追加 `"cache_control": {"type": "ephemeral"}`。

**避坑**：ST v1.14.0 源码（第141-145行）对 `cachingAtDepth` 的处理：若值为**负数或非整数**则禁用深度缓存（设为 -1）；**设为 0** 会触发 `cachingAtDepthForClaude` 对所有消息追加 cache_control（非"不缓存"，而是"全部缓存"）。避免设为 0 的原因是命中率极差而非无效。建议设为 2 或 4。置信度：high `[运行时源码]`

---

## 5 Google Gemini 专有参数与行为

### 5.1 请求体标准结构

**核心结论**：Gemini 的消息格式与 OpenAI 不同，角色名为 `user`/`model`，所有生成参数集中在 `generationConfig` 子对象内，系统提示走 `systemInstruction` 独立字段。

来源：ST v1.14.0 `chat-completions.js` `sendMakerSuiteRequest()` 函数（注：草稿原称 `sendGoogleRequest()`，v1.14.0 实际函数名为 `sendMakerSuiteRequest()`）｜ 适用版本：ST 1.14.x / Gemini API 2026-06 ｜ 置信度：high `[运行时源码]`（`thinkingBudget` 直读；`thinkingLevel` 为推断，详见第13章 U2）

```json
{
  "contents": [
    {"role": "user", "parts": [{"text": "你好"}]},
    {"role": "model", "parts": [{"text": "你好！"}]}
  ],
  "systemInstruction": {
    "parts": [{"text": "你是一个角色扮演助手"}]
  },
  "generationConfig": {
    "temperature": 1.5,
    "topP": 0.9,
    "topK": 500,
    "maxOutputTokens": 2048,
    "responseMimeType": "text/plain",
    "seed": 42
  },
  "safetySettings": [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "OFF"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "OFF"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "OFF"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "OFF"},
    {"category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE"}
  ],
  "thinkingConfig": {
    "thinkingBudget": 8192
  }
}
```

### 5.2 关键差异速查

| 差异点 | Gemini 特有行为 |
|---|---|
| 角色名 | `user` / `model`（不是 `assistant`） |
| 生成参数位置 | 均在 `generationConfig` 子对象内（camelCase） |
| 系统提示 | `systemInstruction.parts[].text`（独立字段） |
| Safety Settings | ST 默认全关（RP 场景特意配置） |
| Thinking（2.5 系列 + gemini-3-pro） | `thinkingConfig.thinkingBudget`（整数）置信度：high `[运行时源码]`（v1.14.0 直读） |
| Thinking（3.0/3.1 系列） | `thinkingConfig.thinkingLevel: "low"\|"high"` 置信度：medium·推导未验证 `[推断]`（v1.14.0 源码未覆盖此系列，详见第13章 U2） |

**避坑**：Gemini Safety Settings 默认全关是 ST 针对 RP 场景的特意配置，生产环境非 RP 场景需手动恢复安全过滤。

**悬案（→ 第13章 U2）**：Gemini `thinkingLevel` vs `thinkingBudget` 的精确适用模型边界（3.0/3.1 vs 2.5 系列）待官方文档确认。另：ST v1.14.0 源码使用 `thinkingBudget`（整数），覆盖正则为 `gemini-2.5-(flash|pro)` 和 `gemini-3-pro`，不覆盖 3.1 系列。

---

## 6 OpenAI (GPT-4o / o 系列) 专有参数

### 核心结论

OpenAI Chat Completion 格式是 ST 其他 provider 对齐的"基准格式"。o 系列推理模型新增 `reasoning_effort` 参数，移除 `temperature`。

来源：OpenAI 官方文档 + ST 源码 ｜ 适用版本：ST 1.16.x / OpenAI API 2026-06 ｜ 置信度：high `[文档·多源]`

#### 标准 GPT-4o 请求

```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "你是助手"},
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好！"}
  ],
  "temperature": 0.8,
  "top_p": 0.9,
  "frequency_penalty": 0.5,
  "presence_penalty": 0.3,
  "max_completion_tokens": 2048,
  "stop": ["Human:"],
  "seed": 42,
  "stream": true
}
```

#### o3 / o4-mini 推理模型请求

```json
{
  "model": "o3",
  "reasoning_effort": "high",
  "messages": [
    {"role": "user", "content": "..."}
  ],
  "max_completion_tokens": 4096
}
```

**避坑**：o 系列不接受 `temperature`；`max_tokens` 字段名已变更为 `max_completion_tokens`（旧字段 ST 可能仍发旧名，需验证）。

---

## 7 Prompt Post-Processing 五种模式

### 核心结论

ST Chat Completion 后端的 `postProcessPrompt()` 提供 5 种模式，控制消息数组在发送前如何整理格式。不同 provider 对消息格式有不同要求，选错模式会导致格式错误或内容丢失。

来源：ST API Connections 文档 + `prompt-converters.js` 源码 ｜ 适用版本：ST 1.14.x+ ｜ 置信度：high `[文档·多源 + 运行时源码]`

| 模式 | 行为 | 推荐场景 |
|---|---|---|
| **None** | 最小处理，消息按原样发送 | 所有 API 兼容时 |
| **Merge consecutive** | 合并连续同角色消息（同 role 相邻消息合为一条） | 通用推荐 |
| **Semi-strict** | 合并同角色 + 只允许一条 system 消息 | Claude / Gemini |
| **Strict** | 严格交替角色（user→assistant→user），用占位符填充 | 要求严格格式的 API |
| **Single user message** | 将全部历史压平为一条用户消息 | 极简场景 |

**重要**：Merge / Semi-strict / Strict 额外**移除 tool calls**（除非选 "with tools" 变体）。

### Claude 推荐配置组合

在 ST UI 中选择以下组合：

| 设置项 | 推荐值 |
|---|---|
| API Type | Chat Completion |
| Source | Claude (Anthropic) |
| Use system prompt | ✅（仅 Claude/Gemini 有效） |
| Squash system messages | ✅ |
| Prompt post-processing | Semi-strict 或 Strict |
| Assistant prefill | `{{char}}:` 前缀（仅 Claude 有真正 prefill 效果） |
| Enable system prompt cache | ✅（config.yaml 中设置，cachingAtDepth: 2） |

---

## 8 System Prompt 与 Prefill 处理差异

### 8.1 System Prompt 合并策略

**核心结论**：各 provider 的 system prompt 传递路径不同，不可假定 system 消息处理一致。

来源：ST 文档 + 源码 ｜ 适用版本：ST 1.14.x+ ｜ 置信度：high `[文档·多源 + 运行时源码]`

| API 类型 | system prompt 处理 |
|---|---|
| **Claude** | `claude_use_sysprompt: true` → 所有 system 消息（到第一条 user/assistant 前）合并为 `system` 数组字段独立发送 |
| **Gemini** | 合并为 `systemInstruction` 字段 |
| **OpenAI** | system 消息保留在 `messages` 数组中（`role: "system"`），随其他消息一起发送 |
| **Mistral** | 类似 OpenAI，支持 `safe_prompt` 布尔值 |

**`squash_system_messages` 设置**（ST 全局选项）：将 messages 数组中多个连续 system 消息合并为单条，减少格式错误。

---

### 8.2 Prefill（assistant_prefill）机制

#### Claude（原生支持）

**核心结论**：Claude 原生支持 prefill，ST 将 `assistant_prefill` 文本作为最后一条 `role: "assistant"` 消息注入，Claude 从该文本继续生成。

来源：Anthropic 文档 + ST 源码 ｜ 置信度：high `[文档·多源 + 运行时源码]`

- 效果：强制角色前缀、角色名、特定格式
- 注意：若启用 thinking 且出现结构冲突，ST 会将末尾 assistant 消息转为 user 消息（`fixThinkingPrefill` 逻辑）

#### OpenAI Chat Completion（不原生支持 prefill）

**结论**：OpenAI 不支持真正的 prefill，末尾 assistant 消息只是上下文历史，不是续写起点。

来源：ST GitHub issue #4429 + 社区实测 ｜ 置信度：medium·单源孤证 `[社区]`（单一 issue 来源，行为理解合理但无真机系统性验证，不符合 high 标准）

- ST 添加的末尾 assistant 消息会被 OpenAI 当作"已生成的上文"而非 prefill
- `add_generation_prompt: false` 方案已被 ST 标记为 not planned（issue #4429）
- **建议**：需要 prefill 效果必须用 Claude 直连或 Text Completion 模式，或通过 OpenRouter 中转 Claude 模型

**悬案（→ 第13章 U5）**：Prefill 在 Fable 5 / Mythos 5（always-on thinking）上的行为待真机验证。

---

## 9 Claude 当前模型 ID 完整表

### 9.1 当前推荐模型（2026-06-28）

**核心结论**：以下模型 ID 和参数限制来自 Anthropic 官方模型文档。

来源：platform.claude.com/docs/en/about-claude/models/overview ｜ 置信度：high `[文档·多源]`

| 模型 | API ID | 上下文 | 最大输出 | Temperature | Thinking |
|---|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | 1M token | 128k | ❌ | 强制自适应 |
| Claude Opus 4.8 | `claude-opus-4-8` | 1M token | 128k | ❌ | 自适应（唯一方式） |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 1M token | 128k | ⚠️ 可用但只能 temp 或 top_p 二选一（→ 第13章 U3） | 自适应/扩展 |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | 200k | 64k | ✅（0-1.0） | ❌ |

### 9.2 历史模型（仍可用）

| 模型 | API ID | temperature | 备注 |
|---|---|---|---|
| Claude Opus 4.7 | `claude-opus-4-7` | ❌ | 自适应 thinking 唯一方式；新 tokenizer（多产约 30% tokens） |
| Claude Opus 4.6 | `claude-opus-4-6` | ✅（谨慎） | extended thinking 仍支持但已废弃路径 |
| Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` | ⚠️ temp 或 top_p 二选一 | 200k 上下文 |
| Claude Opus 4.1 | `claude-opus-4-1-20250805` | ✅ | **2026-08-05 退役** |

**重要**：Opus 4.7+ 引入新 tokenizer，同量文本多产约 **30% tokens**，计费和 context 计算需同步更新。置信度：high `[文档·多源]`（Anthropic 官方模型总览和迁移文档均明确）

---

## 10 Anthropic Prompt Caching 完整配置

### 10.1 最小缓存 Token 门槛

**核心结论**：各模型的最小可缓存 token 数不同，低于门槛的内容无法写入缓存（不报错，直接不缓存）。

来源：Anthropic Prompt Caching 文档（2026-06-28 核实） ｜ 置信度：high `[文档·多源]`

| 模型 | 最小 token 数（Claude API） |
|---|---|
| Claude Fable 5 / Mythos 5 | 512（Bedrock 上为 1,024） |
| Claude Mythos Preview | 2,048 |
| Claude Opus 4.8 | 1,024 |
| Claude Opus 4.7 | 2,048 |
| Claude Opus 4.6 / 4.5 | 4,096 |
| Claude Sonnet 4.6 / 4.5 | 1,024 |
| Claude Haiku 4.5 | 4,096 |

### 10.2 计费倍率

| 类型 | 倍率（相对基础输入价） |
|---|---|
| 基础输入 | 1.0x |
| 5 分钟 cache write | 1.25x |
| 1 小时 cache write | 2.0x |
| cache read | **0.1x**（节省 90%） |

### 10.3 缓存失效场景

**避坑**：以下操作会使 Prompt Cache 失效：
- 在 `adaptive`、`enabled`、`disabled` 之间切换 thinking 模式：**消息缓存失效**；**system prompt 和 tools 缓存保留**（Anthropic 文档原文："System prompts and tools remain cached despite thinking parameter changes"）。置信度：high `[文档·多源]`
- 修改 system prompt 内容（任何字符变化）：system 缓存失效。置信度：high `[文档·多源]`
- 更改 `cachingAtDepth` 值：已缓存的消息深度位置改变，等效内容变化。置信度：medium·推导未验证 `[推断]`

---

## 11 高频避坑清单（TOP 10）

**置信度：各条目独立标注**

1. **Claude Opus 4.7+ 发 temperature/top_p/top_k → 400 错误**  
   ST 当前未修复（issue #4929 not planned）。用这些模型时需通过支持参数过滤的代理（如 LiteLLM）中转。  
   置信度：high `[文档·多源 + 社区]`

2. **ST Thinking 参数格式与 Anthropic 新 API 不匹配**  
   ST v1.14.0 向 Claude 发送旧格式 `thinking: {type:"enabled", budget_tokens: N}`，但 Opus 4.7/4.8 要求 `thinking: {type:"adaptive"}`，旧格式对这些模型会返回 **400 错误**。建议使用 ST 1.15+ 并自行抓包验证，或通过 OpenRouter 中转。  
   注：草稿原声称 ST 发 `reasoning_effort + include_reasoning` 到 Claude 端——v1.14.0 源码中 Claude 路径不使用此格式（该字段仅用于 OpenAI 系），原声明系版本混淆，已修正。  
   置信度：high `[运行时源码]`（v1.14.0 直读；issue #5558 记录的问题行为需核实具体 ST 版本）

3. **Prefill 在 OpenAI Chat Completion 下无效**  
   末尾 assistant 消息只是上下文，不是真正 prefill。需要 prefill 效果必须用 Claude 直连或 Text Completion 模式。  
   置信度：medium·单源孤证 `[社区]`（仅社区 issue 支撑，无真机实测数据；结论本身合理但支撑等级不足 high）

4. **Gemini 角色名是 `model` 不是 `assistant`**  
   ST 的 `convertGooglePrompt()` 负责转换，自行写代码时注意，直接发 `assistant` 会被 Gemini API 拒绝。  
   置信度：high `[运行时源码]`

5. **Gemini Safety Settings 默认全关（ST 特意配置）**  
   生产环境非 RP 场景需手动恢复安全过滤，否则可能产出有害内容。  
   置信度：high `[运行时源码]`

6. **Claude system 字段是数组不是字符串**  
   直接传字符串 API 会接受，但不支持 `cache_control`；需要 Prompt Caching 必须用数组格式。  
   置信度：high `[文档·多源]`

7. **squash_system_messages 在 OpenRouter + Claude 路由下不一定生效**  
   OpenRouter 可能将 system 消息独立传递，需结合 "Semi-strict" 后处理模式。  
   置信度：medium·推导未验证 `[社区]`  
   验证路径：用 OpenRouter 发请求 + 查看 OpenRouter dashboard 的实际 payload

8. **Opus 4.7+ 新 tokenizer 导致 token 数多出约 30%**  
   同样内容在 Opus 4.7+ 比旧模型消耗更多 token，需调低 `openai_max_context` 或提高预算。  
   置信度：high `[文档·多源]`

9. **Prompt Caching 与 thinking 模式切换会破坏消息缓存**  
   在 `adaptive` 和 `enabled`/`disabled` 之间切换会使**消息缓存**失效；**system prompt 和 tools 缓存保留**。（原草稿描述正确，置信度标注不变。）  
   置信度：high `[文档·多源]`

10. **`claude_max_temp = 1.0`（ST 前端内置上限）**  
    ST 前端 `openai.js`（第139行）硬编码 `claude_max_temp = 1.0`，UI slider 上限受此约束；Claude API 本身上限也是 1.0（Sonnet 4.5 及以前）；Opus 4.7+ 已完全废弃 temperature，此上限对新模型无实际意义。  
    置信度：high `[运行时源码]`（v1.14.0 `public/scripts/openai.js` 第139行直读）

---

## 12 完整可用范式代码

### 12.1 Claude Opus 4.8 直连（无 thinking，纯文本生成）

**注意**：不发 temperature/top_p/top_k，这些在 Opus 4.7+ 会 400。

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    system=[
        {
            "type": "text",
            "text": "你是星月私立高等学院的AI助手。",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[
        {"role": "user", "content": "请介绍一下学院"},
        # prefill：强制回复从特定文本开始
        {"role": "assistant", "content": "星月私立高等学院是"}
    ],
    stop_sequences=["Human:", "\n\nHuman:"],
    stream=False
)
print(response.content[0].text)
```

### 12.2 Claude Opus 4.8 + Adaptive Thinking

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "medium"},
    messages=[{"role": "user", "content": "分析这段剧情的逻辑漏洞..."}]
)
for block in response.content:
    if block.type == "thinking":
        print(f"思考过程：{block.thinking}")
    elif block.type == "text":
        print(f"回复：{block.text}")
```

### 12.3 Gemini 2.5 Pro（无安全过滤，适合 RP）

```python
import google.generativeai as genai

genai.configure(api_key=<redacted-at-snapshot>)
model = genai.GenerativeModel(
    model_name="gemini-2.5-pro",
    system_instruction="你是角色扮演助手",
    generation_config=genai.types.GenerationConfig(
        temperature=1.5,
        top_p=0.9,
        top_k=40,
        max_output_tokens=2048,
    ),
    safety_settings={
        "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
        "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
        "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
    }
)
response = model.generate_content("角色扮演开始")
print(response.text)
```

### 12.4 直接构建 Gemini API 请求（手动格式）

```python
import requests

payload = {
    "contents": [
        {"role": "user", "parts": [{"text": "你好"}]},
        {"role": "model", "parts": [{"text": "你好！"}]},
        {"role": "user", "parts": [{"text": "继续..."}]}
    ],
    "systemInstruction": {
        "parts": [{"text": "你是一个角色扮演助手"}]
    },
    "generationConfig": {
        "temperature": 1.5,
        "topP": 0.9,
        "topK": 40,
        "maxOutputTokens": 2048
    },
    "safetySettings": [
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "OFF"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "OFF"}
    ]
}
# 注意：角色名用 "model" 不是 "assistant"
```

---

## 13 悬而未决：需真机验证的问题

> 本章记录当前置信度不足以据此施工的开放问题。验证前不得将这些条目的结论用于生产。

| 编号 | 悬案 | 不确定度 | 验证路径 |
|---|---|---|---|
| **U1** | ST 1.15.x / 1.16.x 是否已修复 Opus 4.7/4.8 的 thinking 参数格式（v1.14.0 仍用旧 budget_tokens，高版本源码未直读） | medium | 读 ST staging 分支最新 chat-completions.js 的 sendClaudeRequest()；或抓 ST 1.15+ 发出的实际请求体 |
| **U2** | Gemini Thinking `thinkingLevel` vs `thinkingBudget` 适用模型边界（3.0/3.1 vs 2.5 系列）的精确划分 | medium | 参考 Google AI Studio 官方文档 + ST release notes 1.15-1.16 |
| **U3** | Claude Sonnet 4.6 的 temperature 在 ST 中的实际行为（官方文档确认 Sonnet 4.6 可用 temp 或 top_p 二选一；但 ST v1.14.0 的 isLimitedSampling 不覆盖 sonnet-4-6，会无条件发全部参数——是否导致 400 未经真机验证） | medium（API 规格已知，ST 行为待验） | 在 ST v1.14.0 对 Sonnet 4.6 发请求，观察是否因同时发送 temp+top_p 导致 400 |
| **U4** | ST `squash_system_messages` 在 OpenRouter + Claude 路由下实际行为（OpenRouter 是否透传 system 数组） | medium | 用 OpenRouter 发请求 + 查看 OpenRouter dashboard 的实际 payload |
| **U5** | Prefill 在 Fable 5 / Mythos 5 上的行为（always-on thinking 与旧 prefill 机制的冲突结果） | medium（原标 high 已降级：无真机证据，仅逻辑推断） | 真机测试：发末尾 assistant 消息，观察生成是否从 prefill 文本续写还是重新开始 |
| **U6** | Anthropic `cachingAtDepth` 与 adaptive thinking 共存的缓存命中率（两种机制叠加效果） | medium | 观察 API 响应的 `usage.cache_read_input_tokens` 字段，统计多轮对话的缓存命中情况 |

### 矛盾点记录（两派并列，不强统一）

**矛盾 A：Claude system 字段——字符串 vs 数组**

- 派别 1（Anthropic 官方示例）：`system` 应为数组格式 `[{type, text, cache_control?}]`，支持 `cache_control`
- 派别 2（社区简化实践）：直接传字符串也被 API 接受，简化代码
- 现状：两者均可用，但字符串格式**不支持 Prompt Caching**；建议统一用数组格式

**矛盾 B：ST Prompt Post-Processing 与 Claude 的最优模式**

- 派别 1（ST 文档）：推荐 Semi-strict（合并同角色 + 限单条 system）
- 派别 2（社区 RP 实践）：Strict 模式减少格式错误，尤其长对话时
- 现状：两者都能工作，差异在于对 tool calls 和长对话的处理；建议短对话 Semi-strict，长 RP 叙事 Strict

---

## 参考来源

| 来源 | 类型 | 可信度 |
|---|---|---|
| [ST API Connections 文档](https://docs.sillytavern.app/usage/api-connections/) | 文档·官方 | high |
| [ST Chat Completions 文档](https://docs.sillytavern.app/usage/api-connections/openai/) | 文档·官方 | high |
| [ST Reasoning 文档](https://docs.sillytavern.app/usage/prompts/reasoning/) | 文档·官方 | high |
| [ST Advanced Formatting 文档](https://docs.sillytavern.app/usage/core-concepts/advancedformatting/) | 文档·官方 | high |
| [ST GitHub chat-completions.js (staging)](https://github.com/SillyTavern/SillyTavern/blob/staging/src/endpoints/backends/chat-completions.js) | 运行时源码 | high |
| [ST DeepWiki AI Integration](https://deepwiki.com/SillyTavern/SillyTavern/3-ai-integration) | 文档·多源 | high |
| [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) | 文档·官方 | high |
| [Anthropic Adaptive Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) | 文档·官方 | high |
| [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | 文档·官方 | high |
| [ST Issue #4929 - temperature/top_p 互斥](https://github.com/SillyTavern/SillyTavern/issues/4929) | 社区 | medium（单一 issue，结论需与源码交叉印证） |
| [ST Issue #5558 - Claude Opus 4.7 reasoning 参数错误](https://github.com/SillyTavern/SillyTavern/issues/5558) | 社区 | medium（ST 版本未确认；v1.14.0 源码不能印证此 issue 描述的行为） |
| [Narracomm: Anthropic 废弃 sampling 参数](https://www.narracomm.com/anthropic-deprecates-temperature-top_p-and-top_k-on-newer-opus-models/) | 文档·单源 | medium（单源，需与 Anthropic 官方迁移文档交叉印证后方为 high） |
| [ST 1.16.0 release notes](https://github.com/SillyTavern/SillyTavern/discussions/5155) | 文档·官方 | high |
| [ST 1.15.0 release notes](https://github.com/SillyTavern/SillyTavern/discussions/4926) | 文档·官方 | high |
