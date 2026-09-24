# 社区问答与混搭指南的维护

## 问答正文

直接编辑 `docs/community-qa.md` 和 `docs/tavern-cards-community-qa.md`。它们是正文来源；不要手改生成的 `community-qa-content.html` 或 `resources/` 下的 MD 副本。

```sh
python -m pip install -r requirements-dev.txt
python scripts/build-guide-qa.py
python scripts/build-guide-qa.py --check
node --test tests/newbie-guide-navigation.test.mjs
```

生成器保留正文、题号、作者待审说明、表格和示例，把相对仓库链接转成网页可用的 GitHub 链接。下载版 MD 同样转换链接，离开仓库后仍可查阅来源；原始 MD 不修改。问答数量变更时，应同步生成器中的数量、教程入口及侧栏文案。Pages 工作流发布前也会生成一次，确保网页跟随 MD。

## 混搭指南

两份收录版分别位于 `guides/tw-moyue.html` 和 `guides/tw-tavern-cards.html`。共同阅读样式和流程图加载器为 `guides/mix-guide.css`、`guides/mix-guide.js`。它们仍是独立完整页面，可以直接打开。

2026-09-24 从用户提供的两份 HTML 收录；保留作者的整体结构、步骤表、提示词和流程图。收录时依据当前仓库校正了 TW 的 22 个 Skill、审计工具的 Library 依赖、forge 默认的 `tavern-cards-state.json` 文件名，并补清 Soul 的宿主发现条件、完整规划示例的适用范围。墨月原包未在此次收录中复核，原稿中的授权判断改为历史记录与待作者确认。

Mermaid 流程图库来自指南原有的 CDN，并保留备用域；网络不可用时显示步骤表阅读提示与流程图文字。正文无需该库。库的加载和初始化方式可查 [Mermaid 使用文档](https://mermaid.js.org/config/usage.html)。Markdown 转换使用 [Python-Markdown](https://python-markdown.github.io/) 的表格、围栏代码和列表扩展。

## 本地查看

在仓库根运行 `python -m http.server 8765 --bind 127.0.0.1 --directory docs/newbie-guide`，再打开 `http://127.0.0.1:8765/#community-help`。主教程需要 HTTP 加载正文分片，双击 `index.html` 不适合作为完整预览。

修改后检查新旧目录、单题与全部展开、MD 下载、示例复制、两份指南的流程图、断网提示、桌面与手机宽度。教程正文与交互的检查不代表套件混搭已经在真实 Agent 或 SillyTavern 中通过验收。
