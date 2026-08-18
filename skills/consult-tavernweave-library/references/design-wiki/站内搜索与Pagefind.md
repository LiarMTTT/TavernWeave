---
title: 站内搜索与Pagefind
created: 2026-08-14
updated: 2026-08-15
type: concept
status: active
tags:
  - wiki
  - concept
  - research
  - tooling
knowledge_class: factual
sources:
  - https://pagefind.app/docs/
  - https://pagefind.app/docs/running-pagefind/
  - https://pagefind.app/docs/indexing/
  - https://pagefind.app/docs/hosting/
  - https://pagefind.app/docs/multilingual/
  - https://typesense.org/docs/
  - https://typesense.org/docs/overview/what-is-typesense.html
  - https://typesense.org/docs/overview/comparison-with-alternatives.html
  - https://www.meilisearch.com/docs/learn/getting_started/what_is_meilisearch
  - https://www.meilisearch.com/docs/resources/self_hosting/overview
  - https://www.meilisearch.com/docs/learn/resources/faq
  - https://github.com/meilisearch/meilisearch/blob/main/README.md
  - https://docsearch.algolia.com/docs/what-is-docsearch
  - https://docsearch.algolia.com/docs/who-can-apply/
  - https://docsearch.algolia.com/docs/docsearch-program
  - https://lucaong.github.io/minisearch/
  - queries/第二批蒸馏目标.md
  - queries/第三批蒸馏目标.md
  - concepts/前端架构名词与取舍.md
---

# 站内搜索与Pagefind

本页不是已采用技术，也不改工坊或角色卡栈。检索日 2026-08-14。账本枢纽是 [[queries/第二批蒸馏目标]] **B2-Search**（约 12 条采集，本页收 14 条入口）。文档站生成器见 B2-Docs / [[10-收件箱/写回候选/第四批-B4-Docs]]；分面交互见 [[queries/第三批蒸馏目标]] B3-Facet。SSG 产物是 Pagefind 的输入，见 B3-SSG。

## 一句话定义

站内搜索是站点自己的检索面：用户在本站查本站内容，不是公网爬虫。五条常见路是 **构建后静态索引**（Pagefind）、**自建/托管搜索引擎**（Typesense、Meilisearch）、**文档站托管爬虫**（Algolia DocSearch）、**进程内内存索引**（MiniSearch）。

## 为什么重要

文档站和知识库没有检索就只能靠目录。行业常把五条路并成「装一个搜索框」，但合同不同：谁在何时建索引、查询跑在浏览器还是远端、有没有配额和徽标义务。静态站可以零服务器搜上万页；动态目录、多租户过滤、语义/对话检索通常要推文档进一台搜索引擎。选错合同的典型后果是：预览环境搜不到、上线后索引停在旧构建、或把 DocSearch 免费档当成任意站点的无限配额。

## 权威入口

检索 2026-08-14。14 条，不是教程，也不镜像全文。B2 采集约 12 条，本表按官方枢纽加厚，未收报价页、旧爬虫逐步命令或自建集群菜谱。

| # | 入口 | 管什么 |
|---|---|---|
| 1 | [Pagefind 入门](https://pagefind.app/docs/) | B2-Search 枢纽；构建后索引；无服务端；`--serve` 只是预览 |
| 2 | [Running Pagefind](https://pagefind.app/docs/running-pagefind/) | `--site` 指向静态 HTML 输出；写出 `pagefind/` 包 |
| 3 | [Configuring the index](https://pagefind.app/docs/indexing/) | `data-pagefind-body` / `ignore`；出现 body 标记则无标记页不进索引 |
| 4 | [Hosting](https://pagefind.app/docs/hosting/) | 静态包无需托管配置；CSP 与 Web Worker |
| 5 | [Multilingual](https://pagefind.app/docs/multilingual/) | 按 `lang` 分索引；zh/ja/ko 分词在 extended |
| 6 | [Typesense 文档](https://typesense.org/docs/) | 总览 / Guide / 按版本 API |
| 7 | [What is Typesense](https://typesense.org/docs/overview/what-is-typesense.html) | 容错即时搜；推数据，不爬公网 |
| 8 | [Typesense 对照](https://typesense.org/docs/overview/comparison-with-alternatives.html) | 厂商对照 ES / Algolia / Meilisearch，作主张读 |
| 9 | [What is Meilisearch](https://www.meilisearch.com/docs/learn/getting_started/what_is_meilisearch) | 推文档；全文 / 语义 / 对话同一 API |
| 10 | [Self-hosting Meilisearch](https://www.meilisearch.com/docs/resources/self_hosting/overview) | 单二进制；Cloud 推荐；自托管要 master key |
| 11 | [What is DocSearch](https://docsearch.algolia.com/docs/what-is-docsearch) | 爬虫与 v5 前端两段；保留徽标 |
| 12 | [Who can apply](https://docsearch.algolia.com/docs/who-can-apply/) | 公开技术文档 / 技术博客；非技术或未上线常拒 |
| 13 | [DocSearch program](https://docsearch.algolia.com/docs/docsearch-program) | 计划免费；自建账号免费档约 1 万条记录 |
| 14 | [MiniSearch](https://lucaong.github.io/minisearch/) | 内存倒排；数据须能进进程 |

刻意未收：Elasticsearch 专页（B2 名单外）、Algolia 商业报价、DocSearch Legacy 自建爬虫逐步命令、Typesense/Meilisearch 密钥与集群操作、成品皮肤。

## 如何运作

**Pagefind** 在静态生成器**之后**读已构建 HTML，写出静态搜索包（默认 `public/pagefind`）。浏览器按需加载分块索引；官方称约 1 万页全文本检索总载荷可低于 300 kB，多数站更接近 100 kB。Pagefind **没有服务端**；`--serve` 只是索引完后用任意静态服务器预览。1.5.0 起 Component UI（`pagefind-component-ui.js` + `<pagefind-modal>`）取代 Default UI（`pagefind-ui.js` / `PagefindUI`）。`data-pagefind-body` 一旦在站内出现，没有该属性的页面不再进索引。多语言看 `<html lang>`；中日韩分词在 extended 发行（`npx pagefind` 默认）。托管页写：包已自压缩，不必服务器 gzip；严格 CSP 常要 `script-src 'wasm-unsafe-eval'`。

**Typesense / Meilisearch** 是常驻搜索引擎：你把已有文档 **推入** 索引，再经 REST 做即时、容错检索。Typesense 写明：它不像 Google 去爬公网，也不等于公网搜索引擎。两者都提供 Cloud 与自托管；Meilisearch 文档称单二进制、无外部依赖，Cloud 为推荐路径，自托管要反代 HTTPS、进程管理器和 master key。Meilisearch 现网还谈语义、混合检索与对话/RAG；那是引擎能力，不是「文档站必须上」。

**DocSearch** 拆成两段：Algolia Crawler 抽文档进 Algolia 索引；DocSearch v5 前端查该索引。爬虫配置与前端包版本独立。免费计划面向**公开**技术文档与技术博客，条件是结果旁保留 “Search by Algolia”。

**MiniSearch** 是浏览器/Node 内存全文引擎：前缀、模糊、字段加权、自动建议；数据必须能放进进程内存。适合客户端即搜，不适合当全站服务器。

### 静态索引 vs 托管搜索

一边是构建产物里的静态包或内存倒排，查询不经过你的搜索进程（Pagefind、MiniSearch）。另一边是运行中的引擎或 Algolia，查询打远端（Typesense、Meilisearch、DocSearch）。两边都留；不要并成一种「站内搜索」。

## 必须保留的冲突

- **静态索引 vs 托管搜索。** Pagefind / MiniSearch：查询在浏览器（或本进程），无搜索服务器。Typesense / Meilisearch / DocSearch：查询打运行中的引擎或 Algolia。带宽、新鲜度、过滤、配额合同不同；不能并成一种方案。
- **DocSearch 与 Algolia 配额不是同一合同。** 计划页写：DocSearch program **免费**，交换条件是保留徽标。不能展示徽标、或要索引非文档页时，自建 Algolia 应用；「Depending on the size of your documentation, you might need a paid plan. Free plans can hold up to 10,000 records。」不要把计划免费读成自建账号无限量，也不要把 1 万条记录帽套回已入选的 DocSearch 应用（计划页未把该数字写进 program 本身）。
- **Pagefind 默认是构建时索引。** 入门页：先出静态 HTML，再索引输出目录；开发服务器未索引则没有搜索。生产必须在每次构建之后、部署之前再跑一遍。Node API 可索引非静态内容，是例外入口，不覆盖 CLI 默认。
- **Meilisearch 高可用说法分叉。** Typesense 对照：CE 单节点，复制要 Cloud 或 EE，且写节点无自动选举。Meilisearch 自托管/FAQ：自托管是 MIT CE、Cloud 为推荐，未在这两页复述 Raft。两边都留；不以厂商对照覆盖对方文档。
- **许可双轨。** Meilisearch 仓库 SPDX 写 `MIT AND BUSL-1.1`；README 把 CE 标 MIT、EE 标 BUSL/商业协议。不要写成「整个 Meilisearch 都是 MIT」。
- **映射 ≠ 采用。** 文档站可以谈搜索岛，不等于本仓或角色卡已上搜索。

## 例子

- 正例：SSG 文档站在 CI 里 `build` 之后跑 `pagefind --site <out>`，把 `pagefind/` 一并发布。
- 正例：商品/多租户目录把记录推入 Typesense 或 Meilisearch，过滤和排序在查询时改。
- 正例：公开技术文档申请 DocSearch，结果旁留 Algolia 徽标。
- 正例：开局页或控制中心里的小清单用 MiniSearch 在客户端滤，不另开搜索服务。
- 反例：只跑 `hugo serve` / 开发预览，不索引输出目录，就写「Pagefind 坏了」。
- 反例：把 DocSearch 免费计划套到登录墙后的整站电商，或去掉徽标仍当免费档。
- 反例：因本页出现某引擎就写进 recipe / 发卡依赖。

## 边界与易混概念

- 不包括：接入逐步实现、密钥轮换、爬虫绕过登录墙、攻击检索接口、盗版语料、成品搜索皮肤。
- 站内搜索 ≠ 公网搜索引擎。Typesense 原文就把这两者拆开。
- Pagefind ≠ 实时索引。默认合同是**构建后**读 HTML；Node/Python API 可索引非 HTML，那是另一条入口，不是 `npx pagefind --site` 的默认。
- DocSearch ≠ 「Algolia 任意站点免费」。计划只爬公开技术文档/博客；去徽标或扩到非文档页要自建应用，用量另计。
- MiniSearch ≠ 静态站搜索包。它不扫 `public/`，你自己 `addAll`。
- 分面（B3-Facet）是筛选交互；本页是索引与查询落在哪。
- 文档站生成器（B2-Docs）出 HTML；搜索引擎另选，不互相替代。

## 映射到本仓库

映射放最后，不当过滤器。行业句对独立文档站 / 工坊站仍成立。

[[concepts/前端架构名词与取舍]] 正例写过「文档站 SSG + 搜索岛」。那是行业拼法，**不是**本仓已装 Pagefind。卡 iframe、状态栏、blob 真身没有「构建输出目录」这层合同，见 [[concepts/酒馆宿主与iframe分层]]、[[concepts/git挂载与远程真身]]。

因此：

1. **卡 iframe 不是文档站。** 不要把 Pagefind 构建后索引或 DocSearch 爬虫写成状态栏 / 控制中心的运行时依赖。
2. 独立工坊站或项目文档**可以**谈这五条路；那是顶层站点合同，不是「本仓已上搜索」。
3. 小清单客户端滤可以用 MiniSearch 这类内存引擎做概念对照，仍不等于已采用。
4. 分面、SSG、文档写法框架不在本页重蒸。

本页不写「已采用 Pagefind / Typesense / Meilisearch / DocSearch / MiniSearch」。

## 来源与证据

- Pagefind 无服务端、构建后索引、`hugo serve` 看不到结果：入门页与 Running 页 2026-08-14 直读。1.5.0 Component UI 取代 Default UI：各文档页顶栏。
- Typesense 推数据、不爬公网：What is Typesense。对照页是厂商主张，不作第三方审计。
- Meilisearch 单二进制 / Cloud 推荐：自托管总览与 FAQ。CE MIT、EE 含分片等且生产要用商业协议：其 GitHub README / LICENSE；Typesense 对照另称 CE 单节点、高可用走 Cloud/EE，两边都留。
- DocSearch 两段架构、资格、徽标、自建账号「Free plans can hold up to 10,000 records」：What is / Who can apply / program 三页。
- MiniSearch 内存与离线：官方站 Use case。
- 账本：[[queries/第二批蒸馏目标]] B2-Search；重叠 [[queries/第二批蒸馏目标]] B2-Docs、[[queries/第三批蒸馏目标]] B3-SSG、B3-Facet；文档站加厚见 [[10-收件箱/写回候选/第四批-B4-Docs]]。

已知冲突见上节，不静默覆盖。

## 完成标准

- [x] 定义能被非专业读者理解
- [x] 有例子和边界
- [x] 摘要与来源原文可区分
- [x] 冲突没有被静默覆盖
- [x] `tags` 只使用 SCHEMA 已有词
- [x] 已发布到正式区（本波不改 `index.md` / `log.md`）

## 相关内容

- [[concepts/前端架构名词与取舍]]
- [[concepts/酒馆宿主与iframe分层]]
- [[concepts/git挂载与远程真身]]
- [[concepts/开局页路径]]
- [[concepts/控制中心与状态栏]]
- [[queries/第二批蒸馏目标]]
- [[queries/第三批蒸馏目标]]
- [[10-收件箱/写回候选/第四批-B4-Docs]]
