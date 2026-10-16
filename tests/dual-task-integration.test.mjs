import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryLibrary } from '../skills/consult-tavernweave-library/scripts/query-library.mjs';
import { correctGuide } from '../skills/consult-tavernweave-library/scripts/guide-corrections.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const lib = 'skills/consult-tavernweave-library/';

for (const [intent, expected] of [
  ['规划世界书的原生与模板混合触发', ['worldbook-design-and-writing']],
  ['审阅角色卡的世界书正文', ['worldbook-design-and-writing']],
  ['只拆分世界书条目并保留既有ID', ['worldbook-design-and-writing']],
  ['制作一张角色卡并规划世界书', ['tavern-card-builder', 'worldbook-design-and-writing']],
  ['从样例归纳提示词规格，验证新输入', ['orchestrate-project-blueprint']],
  ['写研究摘要的提示词模板', ['orchestrate-project-blueprint']],
  ['给纯文字卡写提示词模板', ['tavern-card-builder', 'orchestrate-project-blueprint']],
  ['规划一张纯文字卡和世界书', ['tavern-card-builder', 'worldbook-design-and-writing']],
  ['设计非世界书用途的玩法设计与事件图', ['orchestrate-project-blueprint']],
  ['作品资料库中的世界书来源核对', ['build-work-library']],
]) {
  test(`bounded route: ${intent}`, () => {
    const result = queryLibrary({ intent, write: true, catalogLimit: 0 });
    assert.deepEqual(result.routeIds, expected);
    assert.deepEqual(result.standing, ['ST-A0']);
    assert.deepEqual(result.candidates, []);
  });
}

test('explicit technical owner wins over a worldbook keyword', () => {
  for (const skill of ['sillytavern-api-reference', 'sillytavern-runtime-debug', 'sillytavern-rolecard-performance']) {
    assert.deepEqual(queryLibrary({ skill, intent: '世界书 getwi 参数、最终请求和预算' }).routeIds, [skill]);
  }
});

test('new worldbook skill and mirrors match the source inventory', () => {
  const manifest = JSON.parse(read('tavernweave-install-manifest.json'));
  const actual = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort();
  assert.deepEqual(manifest.skills, actual);
  assert.equal(manifest.skillCount, 23);
  for (const file of manifest.requiredPaths) assert.ok(fs.existsSync(path.join(root, file)), file);
  assert.equal(read(`${lib}references/route-map.json`), read('docs/newbie-guide/tavernweave-route-map.json'));
  assert.ok(read('README.md').includes('worldbook-design-and-writing'));
});

test('reviewed source corrections are replayable and reject upstream drift', () => {
  const corrections = JSON.parse(read(`${lib}references/guide-corrections.json`)).guides;
  for (const [name, changes] of Object.entries(corrections)) {
    const current = read(`${lib}references/st-guides/${name}`).replace(/\r\n?/gu, '\n');
    let original = current;
    for (const { before, after } of [...changes].reverse()) {
      assert.ok(original.includes(after), `${name}: corrected segment missing`);
      original = original.replace(after, before);
    }
    assert.equal(correctGuide(name, original), current, name);
    assert.equal(correctGuide(name, current), current, name);
    assert.throws(() => correctGuide(name, original.replace(changes[0].before, 'upstream changed')), /source drift/u);
  }
  const a0 = read(`${lib}references/st-guides/A0_驾驭工程从零搭建检查单.md`);
  assert.doesNotMatch(a0, /用三句话回读|你逐句确认|对上了才开工|复述现状.*对了再继续/u);
  assert.match(a0, /上下文|已有上下文/u);
  assert.match(a0, /关键缺项或冲突/u);
  const frontDoor = read('host-adapters/tavernweave-front-door.md');
  assert.doesNotMatch(frontDoor, /begin with one or two necessary questions/u);
  assert.match(frontDoor, /proceed when the context is clear/u);
});


test('content-only routes do not search UI catalogs by default', () => {
  assert.deepEqual(queryLibrary({ intent: '精修世界书里的玻璃桥条目正文' }).candidates, []);
  assert.deepEqual(queryLibrary({ intent: '从样例归纳玻璃制造研究摘要的提示词规格' }).candidates, []);
});


test('all source records have bounded, traceable adoption dispositions', () => {
  const audit = JSON.parse(read('docs/dual-task-adoption.json'));
  assert.equal(audit.baseline.commit, '9a8274f9b0a714256195845cab4e4f6ad73e2997');
  assert.equal(audit.records.length, 151);
  assert.equal(new Set(audit.records.map(x => x.identifier)).size, 151);
  assert.deepEqual(audit.records.map(x => x.index), Array.from({ length: 151 }, (_, i) => i));
  for (const record of audit.records) {
    assert.equal(record.sourceRef, `P${String(record.index).padStart(3, '0')}`);
    assert.ok(record.identifier && record.name.trim());
    if (['excluded', 'unresolved'].includes(record.disposition)) {
      assert.equal(record.adoptedMethod, null);
      assert.deepEqual(record.methodGroups, []);
    } else {
      assert.ok(record.methodGroups.length > 0);
      for (const id of record.methodGroups) assert.ok(audit.methodGroups[id], id);
    }
  }
  for (const index of [49, 50, 51, 52]) assert.equal(audit.records[index].disposition, 'excluded');
  assert.equal(audit.records[73].disposition, 'unresolved');
  assert.equal(audit.records[53].actualDecision, '已有足够好，复用');
  for (const group of Object.values(audit.methodGroups)) {
    for (const target of [...group.baselineComparison, ...group.targets]) {
      assert.ok(fs.existsSync(path.join(root, target.path)), target.path);
      assert.ok(target.section);
    }
    for (const file of group.verification) assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});


test('runtime foundations and specialist worldbook entry are reachable from direct blueprint tasks', () => {
  const blueprint = read('skills/orchestrate-project-blueprint/SKILL.md');
  assert.match(blueprint, /sillytavern-runtime-foundations\.md/u);
  assert.match(blueprint, /已有完整上下文不重复读/u);
  assert.match(blueprint, /worldbook-design-and-writing/u);
});
