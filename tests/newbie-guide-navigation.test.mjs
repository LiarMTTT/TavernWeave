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
    Array.from({ length: 8 }, (_, index) => readGuideFile(`content-${index + 1}.html`)),
  )).join("\n");
  const navIds = [...index.matchAll(/<a class="nav-link[^"]*" href="#([^"]+)"/g)]
    .map(match => match[1]);

  assert.ok(navIds.length >= 50, "The guide should expose the complete multi-chapter navigation.");
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
  const orderedIds = ["tw", "tw-v1", "soul-mode", "library-mode", "install-gate", "db"];
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

  assert.match(index, /id="tocProgress">00 \/ …<\/span>/);
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
  assert.match(index, /app\.js\?v=31/);
  assert.match(app, /content-8\.html\?v=31/);
});
