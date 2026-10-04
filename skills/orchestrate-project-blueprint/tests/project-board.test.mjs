import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { calculateProgress, formatPercent, validateBoard, validateFeedback, relativePath, BOARD_SCHEMA } from '../assets/templates/progress/progress-math.mjs';
import { initializeBoard, readProjectBoard, syncBoard, recordFeedback, projectPath, exportMarkdown } from '../scripts/project-board-core.mjs';
import { createBoardServer } from '../scripts/project-board.mjs';

const testBase = path.resolve(process.env.TW_BOARD_TEST_ROOT || process.env.TEMP || 'E:/Test Area/TavernWeave/project-board-tests');
// The release validator sets TEMP to its external TestRoot. Standalone runs default to E:/Test Area.
const safeBase = process.env.TW_BOARD_TEST_ROOT ? testBase : process.env.TEMP?.replaceAll('\\', '/').toLowerCase().startsWith('e:/test area/') ? testBase : path.resolve('E:/Test Area/TavernWeave/project-board-tests');
function point(id, implemented, browserPassed) {
  return { id, title: id, weight: 1, implemented, evidence: implemented ? ['checks/implementation.md'] : [], gates: [
    { kind: 'automated', status: implemented ? 'passed' : 'pending', evidence: implemented ? ['checks/automated.md'] : [] },
    { kind: 'browser', status: browserPassed ? 'passed' : 'pending', evidence: browserPassed ? ['checks/browser.md'] : [] },
  ] };
}
function input() {
  return { project: { id: 'synthetic', title: '合成项目', version: 'test' }, baseline: { id: 'scope-1', label: '合成测试范围', confirmed: true, reference: 'NEXT.md 合成确认夹具' }, sources: [{ id: 'next', path: 'NEXT.md' }], items: [
    { id: 'hud', title: '界面', module: '前端', weight: 3, scope: 'current', activity: 'doing', summary: '两个检查点', checkpoints: [point('layout', true, true), point('interaction', true, false)] },
    { id: 'storage', title: '保存', module: '数据', weight: 1, scope: 'current', activity: 'todo', summary: '尚未实现', checkpoints: [point('save', false, false)] },
    { id: 'future', title: '暂存', module: '未来', weight: 100, scope: 'parked', activity: 'todo', summary: '不进分母', checkpoints: [point('later', false, false)] },
  ] };
}
async function fixture() {
  await fs.mkdir(safeBase, { recursive: true });
  const root = await fs.mkdtemp(path.join(safeBase, 'board-'));
  await fs.mkdir(path.join(root, 'checks'));
  await fs.writeFile(path.join(root, 'NEXT.md'), '# 合成夹具\n无实际项目验收声明。\n');
  for (const name of ['implementation', 'automated', 'browser', 'retest']) await fs.writeFile(path.join(root, 'checks', name + '.md'), '# 合成证据 ' + name);
  return root;
}
async function initialized() { const root = await fixture(); await initializeBoard(root, input()); return root; }
function payload(snapshot, extra = {}) { return { expectedRevision: snapshot.feedback.revision, context: snapshot.context, type: 'idea', title: '保留原话', text: '一条真实填写的测试原话。', priority: 'P1', ...extra }; }

test('weighted progress has independent implementation and acceptance denominators; parked ideas do not count', async () => {
  const root = await initialized(); const snapshot = await readProjectBoard(root); const progress = snapshot.progress;
  assert.equal(progress.implemented, .75); assert.equal(progress.accepted, .375); assert.equal(progress.denominator, 4); assert.equal(progress.parked, 1);
  assert.equal(progress.modules.find((m) => m.name === '前端').accepted, .5);
  const added = await recordFeedback(root, 'add', payload(snapshot));
  assert.equal(added.saved, true); assert.equal((await readProjectBoard(root)).progress.denominator, 4);
  assert.match(exportMarkdown(snapshot), /75%/u);
});
test('unconfirmed or empty scope shows no numeric percentage; unfinished work never rounds to 100%', () => {
  const board = { ...input(), schema: BOARD_SCHEMA, revision: 0, sources: [{ id: 'next', path: 'NEXT.md', sha256: '0'.repeat(64) }] };
  board.baseline.confirmed = false;
  assert.equal(calculateProgress(board).implemented, null);
  board.baseline.confirmed = true; board.items = [];
  assert.equal(calculateProgress(board).accepted, null);
  assert.equal(formatPercent(.99999999), '99.9%'); assert.equal(formatPercent(1), '100%');
});
test('malformed records, missing evidence and unjustified exemptions are rejected', () => {
  const board = { ...input(), schema: BOARD_SCHEMA, revision: 0, sources: [{ id: 'next', path: 'NEXT.md', sha256: '0'.repeat(64) }] };
  const broken = structuredClone(board); broken.items[0].checkpoints[0].evidence = [];
  assert.ok(validateBoard(broken).some((e) => e.includes('缺少证据')));
  broken.items[0].checkpoints[0].gates[0] = { kind: 'automated', status: 'not-applicable', evidence: [], reason: '不测' };
  assert.ok(validateBoard(broken).some((e) => e.includes('范围依据')));
  assert.doesNotThrow(() => validateBoard({ ...board, sources: [null], items: [null] }));
  assert.ok(validateFeedback({ schema: 'tavernweave/progress-feedback/v1', revision: 0, records: [null] }).length);
  board.items[0].checkpoints[0].gates = [];
  assert.equal(calculateProgress(board).accepted, 0);
  board.baseline.exemptions = { 'hud/layout': '确认该检查点无需额外验收门的合成夹具' };
  assert.equal(calculateProgress(board).accepted, .375);
});
test('initialization refuses overwrite, accepts a legacy current pointer and defaults weights to one', async () => {
  const root = await fixture(); const initial = input(); initial.sources = [{ id: 'next', path: '当前进度.md' }];
  await fs.rename(path.join(root, 'NEXT.md'), path.join(root, '当前进度.md'));
  delete initial.items[0].weight; delete initial.items[0].checkpoints[0].weight;
  await initializeBoard(root, initial);
  const before = await fs.readFile(path.join(root, 'progress/progress.json'));
  await assert.rejects(() => initializeBoard(root, initial), /拒绝覆盖/u);
  assert.deepEqual(await fs.readFile(path.join(root, 'progress/progress.json')), before);
  assert.equal((await readProjectBoard(root)).board.items[0].weight, 1);
  assert.equal(await fs.readFile(path.join(root, '当前进度.md'), 'utf8'), '# 合成夹具\n无实际项目验收声明。\n');
});
test('scope changes require a new baseline and preserve the previous denominator and evidence', async () => {
  const root = await initialized(); const snapshot = await readProjectBoard(root); const next = structuredClone(snapshot.board);
  next.items[0].weight = 1;
  await assert.rejects(() => syncBoard(root, next, 0), /范围变化/u);
  next.baseline = { ...next.baseline, id: 'scope-2', reference: '合成范围调整确认' };
  await syncBoard(root, next, 0);
  const updated = await readProjectBoard(root);
  assert.equal(updated.board.history[0].items[0].weight, 3); assert.equal(updated.board.revision, 1);
  await assert.rejects(() => syncBoard(root, next, 0), /版本冲突/u);
  const exemptions = structuredClone(updated.board); exemptions.baseline.exemptions = { 'hud/layout': '新免除' };
  await assert.rejects(() => syncBoard(root, exemptions, 1), /范围变化/u);
});
test('source drift invalidates old draft context; missing sources and evidence remain visible', async () => {
  const root = await initialized(); const old = await readProjectBoard(root);
  await fs.appendFile(path.join(root, 'NEXT.md'), '新的续接事实\n');
  const stale = await readProjectBoard(root); assert.equal(stale.stale, true);
  await assert.rejects(() => recordFeedback(root, 'add', payload(old)), /来源或画板版本/u);
  await assert.rejects(() => syncBoard(root, old.board, 0), /复核来源/u);
  await syncBoard(root, old.board, 0, { reviewedSources: true });
  assert.equal((await readProjectBoard(root)).stale, false);
  await fs.unlink(path.join(root, 'checks/browser.md'));
  const broken = await readProjectBoard(root); assert.ok(broken.evidenceError); assert.equal(broken.progress.accepted, null);
  await fs.unlink(path.join(root, 'NEXT.md'));
  assert.equal((await readProjectBoard(root)).stale, true);
});
test('two writers cannot overwrite feedback, write-lock failure reports unsaved and original history persists', async () => {
  const root = await initialized(); const old = await readProjectBoard(root);
  const first = await recordFeedback(root, 'add', payload(old));
  await assert.rejects(() => recordFeedback(root, 'add', payload(old, { title: '第二标签页' })), /版本冲突/u);
  const saved = await readProjectBoard(root);
  await fs.writeFile(path.join(root, 'progress/.write-lock'), '合成锁');
  await assert.rejects(() => recordFeedback(root, 'add', payload(saved)), /另一项写入/u);
  await fs.unlink(path.join(root, 'progress/.write-lock'));
  await recordFeedback(root, 'update', payload(saved, { id: first.id, state: 'discussing', reason: '合成讨论', patch: { text: '修改后的文字' } }));
  const reopened = await readProjectBoard(root); const record = reopened.feedback.records[0];
  assert.equal(record.text, '修改后的文字'); assert.equal(record.history[0].text, '一条真实填写的测试原话。'); assert.equal(record.history.length, 2);
  assert.equal(reopened.feedback.revision, 2); assert.equal(reopened.board.revision, 0);
});
test('confirmed blocking bugs create retest gaps; closure requires retest, resolution and real evidence file', async () => {
  const root = await initialized(); let current = await readProjectBoard(root);
  const bug = await recordFeedback(root, 'add', payload(current, { type: 'bug', title: '测试缺口', blocking: true, itemId: 'hud' }));
  current = await readProjectBoard(root); assert.equal(current.progress.accepted, .375);
  await recordFeedback(root, 'update', payload(current, { id: bug.id, state: 'confirmed', reason: '复现并确认阻断' }));
  current = await readProjectBoard(root); assert.equal(current.progress.accepted, 0); assert.equal(current.progress.implemented, .75);
  await recordFeedback(root, 'update', payload(current, { id: bug.id, state: 'wont-fix', reason: '暂时不修仍保留阻断', patch: { resolution: '本轮暂存' } }));
  current = await readProjectBoard(root); assert.equal(current.progress.accepted, 0);
  await assert.rejects(() => recordFeedback(root, 'update', payload(current, { id: bug.id, state: 'closed', reason: '代码改了' })), /先进入待复测/u);
  await recordFeedback(root, 'update', payload(current, { id: bug.id, state: 'retest', reason: '修复后待复测' }));
  current = await readProjectBoard(root);
  await assert.rejects(() => recordFeedback(root, 'update', payload(current, { id: bug.id, state: 'closed', reason: '已测', patch: { resolution: '合成修复', verification: '合成复测通过', verificationEvidence: ['checks/not-there.md'] } })), /不存在/u);
  await recordFeedback(root, 'update', payload(current, { id: bug.id, state: 'closed', reason: '合成复测依据已核对', patch: { resolution: '合成修复', verification: '合成复测通过', verificationEvidence: ['checks/retest.md'] } }));
  current = await readProjectBoard(root); assert.equal(current.progress.accepted, .375); assert.equal(current.board.revision, 0);
});
test('automation cannot introduce driver acceptance through init, sync or feedback', async () => {
  const root = await fixture(); const first = input();
  first.items[0].checkpoints[0].gates.push({ kind: 'driver', status: 'passed', evidence: ['checks/browser.md'], confirmationRef: '合成的人类确认引用' });
  await assert.rejects(() => initializeBoard(root, first), /自动同步不能代填/u);
  await initializeBoard(root, input()); const current = await readProjectBoard(root); const next = structuredClone(current.board);
  next.items[0].checkpoints[0].gates.push({ kind: 'driver', status: 'passed', evidence: ['checks/browser.md'], confirmationRef: '合成的人类确认引用' });
  next.baseline = { ...next.baseline, id: 'scope-2', reference: '新增适用门的合成依据' };
  await assert.rejects(() => syncBoard(root, next, 0), /自动同步不能代填/u);
  await recordFeedback(root, 'add', payload(current, { type: 'review', text: '验收了，这是一条合成反馈原文。' }));
  assert.equal((await readProjectBoard(root)).board.items[0].checkpoints[0].gates.some((g) => g.kind === 'driver'), false);
});
test('relative paths and escaped symlinks cannot read or write outside the chosen project', async () => {
  const root = await initialized();
  for (const relative of ['../NEXT.md', 'E:/secret', '/tmp/file', 'progress/../../outside', 'progress//file']) assert.equal(relativePath(relative), false);
  await assert.rejects(() => projectPath(root, '../outside'), /路径须位于/u);
  const outside = await fixture();
  await fs.symlink(outside, path.join(root, 'external'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(() => projectPath(root, 'external/NEXT.md'), /项目外/u);
});
test('loopback server saves and reads back; stale, foreign, oversized and arbitrary-path requests are rejected', async () => {
  const root = await initialized(); const server = await createBoardServer(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    const current = await (await fetch(origin + '/api/board')).json();
    const headers = { 'Content-Type': 'application/json', Origin: origin, 'X-TW-Board': 'feedback-v1' };
    const data = { operation: 'add', ...payload(current) };
    const saved = await fetch(origin + '/api/feedback', { method: 'POST', headers, body: JSON.stringify(data) });
    assert.equal(saved.status, 200); assert.equal((await saved.json()).saved, true);
    assert.equal((await (await fetch(origin + '/feedback.json')).json()).records.length, 1);
    assert.equal((await fetch(origin + '/api/feedback', { method: 'POST', headers, body: JSON.stringify(data) })).status, 409);
    assert.equal((await fetch(origin + '/api/feedback', { method: 'POST', headers: { ...headers, Origin: 'http://foreign.example' }, body: JSON.stringify(data) })).status, 403);
    assert.equal((await fetch(origin + '/api/feedback', { method: 'POST', headers, body: JSON.stringify({ text: 'x'.repeat(66000) }) })).status, 413);
    assert.equal((await fetch(origin + '/NEXT.md')).status, 404);
    assert.equal((await fetch(origin + '/api/feedback', { method: 'POST', headers, body: '{}' })).status, 409);
    assert.match(await (await fetch(origin + '/api/export')).text(), /保留原话/u);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
