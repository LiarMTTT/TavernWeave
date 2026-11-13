# TavernWeave Yuri Workbench X DSH（DeepSeek Harness 插件包）

这是 `yuri-dev` 分支的 **DeepSeek Harness 第三方插件入口**：一个可安装的 DSH bundle，内含

- **四个百合卡工作流**（`extensions/yuri-creation` 的标准内容，逐字节打包，不改动任何工作流步骤与 CoT 架构）：
  - `yuri-card-creator` — 从对话原创百合角色卡
  - `adapt-yuri-card` — 继承 JSON/PNG 卡改造
  - `post-to-yuri-card` — 帖文转来源链接百合卡
  - `novel-excerpt-to-yuri-card` — 小说 TXT/EPUB 摘录转卡
- **23 个未改动的 TavernWeave 依赖技能**（工作流引用的 pinned 作者库：`tavern-card-builder`、`consult-tavernweave-library`、`build-work-library` 等，Python 脚本按上游 blob 校验）；
- 一个 **`tavernweave-yuri` Agent 预设**（Skill 加载、文件工具、平台终端、提问与交付），以及一个说明插件真实路径的 system-prompt 段落。

## 组成

| 文件 | 作用 |
|---|---|
| [`index.js`](index.js) | Host 插件：注册 `tavernweave-yuri`（四个工作流）与 `tavernweave-base`（23 个依赖技能）两个 skill provider，注入位置说明段落 |
| [`cordis.patch.yml`](cordis.patch.yml) | Bundle patch：插入 `tavernweave-yuri-dsh` 插件行与 `tavernweave-yuri` preset |
| [`package.json`](package.json) | 包元数据与 `dsh.bundle.patch` 声明（`engines.dsh` 锁定当前 DSH 0.2.x） |
| [`locale/`](locale/)、[`icon.svg`](icon.svg) | 插件页展示元信息与图标 |
| [`../yuri-plugin-contract.json`](../yuri-plugin-contract.json) | 机器合同：版本、组成、安装/卸载、运行时门禁 |
| [`../../../scripts/build-yuri-dsh-plugin.mjs`](../../../scripts/build-yuri-dsh-plugin.mjs) | 生成 `.tgz` 发行资产并做包内校验（技能与扩展树按字节复制，不改写） |

## 安装

### 桌面版（DSH Desktop）

1. 取得已发布的 `TavernWeave-Yuri-DSH-v1.0.0.tgz`，或在源码树运行
   `node scripts/build-yuri-dsh-plugin.mjs` 重新生成同名本地包；
2. 侧栏 **插件 → 添加插件 → 安装第三方插件**；
3. 填入本地路径（本目录或 `.tgz`），完成安装并启用 bundle；
4. 新建任务 → Agent preset 选择 **TavernWeave Yuri Workbench**。

### CLI / Web profile

```sh
dsh plugin --profile <profile> add <本地路径|tarball|git 地址|包名>
```

## 与仓库其余部分的关系

- 不改动 `extensions/yuri-creation/`、`skills/` 的任何文件；打包脚本按字节复制它们。
- 与 `host-adapters/dsh/plugin`（TavernWeave X DSH，23 技能 + Front Door）互相独立；本包自带同一批依赖技能（provider 为 `tavernweave-base`），可单独安装使用。
- ChatGPT / Codex / Claude 的分发方式见 `extensions/yuri-creation/docs/NATIVE_HOSTS.md`，保持不变。

## 验收

实机验收记录与未验证项见 [`../yuri-plugin-contract.json`](../yuri-plugin-contract.json) 的 `evidence`。安装成功不代表账号内已启用或新任务已发现；以新任务中 skill 目录实际出现四个 `tavernweave-yuri` 工作流为准。
