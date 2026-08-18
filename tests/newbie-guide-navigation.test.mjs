import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const guideRoot = path.join(root, "docs", "newbie-guide");

async function readGuideFile(name) {
  return readFile(path.join(guideRoot, name), "utf8");
}

test("guide navigation targets follow the rendered document order", async () => {
  const index = await readGuideFile("index.html");
  const content = (await Promise.all(
    Array.from({ length: 10 }, (_, index) => readGuideFile(`content-${index}.html`)),
  )).join("\n");
  const navIds = [...index.matchAll(/<a class="nav-link[^"]*" href="#([^"]+)"/g)]
    .map(match => match[1]);

  assert.ok(navIds.length >= 60, "The guide should expose the capability map, lessons, and release history.");
  assert.equal(new Set(navIds).size, navIds.length, "Navigation anchors must be unique.");

  const positions = navIds.map(id => {
    const position = content.indexOf(`id="${id}"`);
    assert.notEqual(position, -1, `Missing rendered target for #${id}`);
    return position;
  });

  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    "Navigation order must match the concatenated content order.",
  );
  assert.ok(
    positions.every((position, index) => index === 0 || position > positions[index - 1]),
    "Every navigation target must occur after the preceding target.",
  );
});

test("TavernWeave subsections stay between chapter 05 and chapter 06", async () => {
  const content1 = await readGuideFile("content-1.html");
  const content3 = await readGuideFile("content-3.html");
  const orderedIds = ["tw", "tw-v1", "soul-mode", "library-mode", "install-gate", "brainstorm-blueprint", "db"];
  const positions = orderedIds.map(id => content3.indexOf(`id="${id}"`));

  assert.ok(!content1.includes('id="tw-v1"'), "Chapter 05.1 must not render before chapter 00.");
  assert.ok(positions.every(position => position >= 0), "Chapter 05 subsection targets must exist.");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test("radar recommendations are explicit and current-state honest", async () => {
  const index = await readGuideFile("index.html");
  const content2 = await readGuideFile("content-2.html");

  assert.match(index, /href="#agent-radar"><span>03\.3<\/span><span>Codex \/ Claude 雷达<\/span>/);
  assert.match(index, /href="#model-readiness-check"><span>03\.4<\/span><span>开工前模型体检<\/span>/);
  assert.match(content2, /id="agent-radar"/);
  assert.match(content2, /https:\/\/codexradar\.com\//);
  assert.match(content2, /https:\/\/claudecoderadar\.com\/\?lang=zh/);
  assert.match(content2, /Claude Code Radar 当前明确公告暂时关闭/);
  assert.match(content2, /https:\/\/electricitybench\.com\//);
});

test("navigation state is derived from the live document", async () => {
  const index = await readGuideFile("index.html");
  const app = await readGuideFile("app.js");

  assert.match(index, /id="tocProgress">TW \/ …<\/span>/);
  assert.doesNotMatch(index, /\/ 49/);
  assert.match(app, /const navTotal = navAnchors\.length;/);
  assert.match(app, /compareDocumentPosition/);
  assert.match(app, /function getActiveEntryAt\(scrollTop, pageScrollHeight = document\.documentElement\.scrollHeight\)/);
  assert.match(app, /entry\.target\.getBoundingClientRect\(\)\.top \+ scrollTop/);
  assert.match(app, /navScrollHeight = document\.documentElement\.scrollHeight/);
  assert.match(app, /keepActiveLinkVisible/);
  assert.match(app, /requestActiveNavUpdate/);
  assert.match(app, /event\.preventDefault\(\)/);
  assert.match(app, /target\.scrollIntoView\(\{ block: 'start', behavior:/);
  assert.match(app, /if \(body\.classList\.contains\('nav-open'\)\)/);
  assert.doesNotMatch(app, /\/ 49/);
  assert.match(index, /style\.css\?v=34/);
  assert.match(index, /layout-v6\.css\?v=34/);
  assert.match(index, /app\.js\?v=34/);
  assert.match(app, /content-0\.html\?v=34/);
  assert.match(app, /content-8\.html\?v=34/);
  assert.match(app, /content-9\.html\?v=34/);
  assert.match(app, /target\.querySelector\('\.release-entry'\)/);
});

test("opening capability map explains TavernWeave by system and marks v1.2 and v1.3 additions", async () => {
  const index = await readGuideFile("index.html");
  const content0 = await readGuideFile("content-0.html");
  const content1 = await readGuideFile("content-1.html");
  const ids = [
    "tw-capabilities",
    "tw-system-plan",
    "tw-system-card",
    "tw-system-frontend",
    "tw-system-quality",
    "tw-system-library",
  ];

  ids.forEach(id => {
    assert.match(index, new RegExp(`href="#${id}"`));
    assert.match(content0, new RegExp(`id="${id}"`));
  });
  assert.match(content0, /NEW · V1\.2\.0/);
  assert.match(content0, /NEW · V1\.3\.0/);
  assert.match(index, /class="nav-new">NEW<\/strong>/);
  assert.match(content0, /20 个专职 Skill/);
  assert.match(content0, /1,609 条蒸馏账本/);
  assert.match(content0, /项目规划与脑暴/);
  assert.match(content0, /角色卡与变量系统/);
  assert.match(content0, /前端、交互与美术/);
  assert.match(content0, /调试、审计与优化/);
  assert.match(content0, /资料库、安装与发布/);
  assert.match(content0, /id="hero-title"/);
  assert.doesNotMatch(content1, /id="hero-title"/);
});

test("ending release chapter contains user-facing major-version logs only", async () => {
  const index = await readGuideFile("index.html");
  const content8 = await readGuideFile("content-8.html");
  const content9 = await readGuideFile("content-9.html");
  const ids = ["release-history", "release-v1-3-0", "release-v1-2-0", "release-v1-1-0", "release-v1-0-0"];

  ids.forEach(id => {
    assert.match(index, new RegExp(`href="#${id}"`));
    assert.match(content9, new RegExp(`id="${id}"`));
  });
  const positions = ids.map(id => content9.indexOf(`id="${id}"`));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(content9, /id="release-v1-3-0"[\s\S]*?<details class="release-entry" open>/);
  assert.match(content9, /id="release-v1-2-0"[\s\S]*?<details class="release-entry">/);
  assert.match(content9, /id="release-v1-1-0"[\s\S]*?<details class="release-entry">/);
  assert.match(content9, /id="release-v1-0-0"[\s\S]*?<details class="release-entry">/);
  assert.doesNotMatch(content9, /兼容性说明|验证结果|待验证/);
  assert.doesNotMatch(content8, /<footer class="footer">/);
  assert.match(content9, /TavernWeave 奶人教程 · v1\.3\.0/);
  assert.match(content9, /462 个设计、194 个动效、86 个概念、1,609 条蒸馏账本/);
  assert.match(index, /<span class="nav-chapter-no">更<\/span><span>更新日志<\/span>/);
  assert.match(index, /href="#release-history"><span>日志<\/span>/);
  assert.doesNotMatch(index, /第五章 · 大版本更新/);
  assert.doesNotMatch(content9, /<strong>第五章<\/strong>|<div class="section-no">Ⅴ<\/div>|46\.[123]/);
});

test("brainstorm blueprint tutorial exposes v1.2 contracts", async () => {
  const index = await readGuideFile("index.html");
  const content3 = await readGuideFile("content-3.html");

  assert.match(index, /href="#brainstorm-blueprint"><span>05\.5<\/span><span>脑暴与防膨胀蓝图<\/span>/);
  assert.match(content3, /脑暴模式，Soul 联席/);
  assert.match(content3, /Core Spine、First Playable、Growth Tracks、Parking Lot/);
  assert.match(content3, /执行期持久权威蓝图预算固定为 0/);
  assert.match(content3, /只有出现可观察错误、失败证据、未满足的退出条件或实际阻塞时/);
  assert.match(content3, /关闭支线，回到父步骤/);
  assert.match(content3, /driverOverride/);
  assert.match(content3, /按蓝图开跑第一版/);
});
