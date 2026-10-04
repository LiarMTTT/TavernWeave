import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { initializeBoardFromSources, readProjectBoard, planSourceSync, applySourceSync, syncBoard, recordFeedback } from '../scripts/project-board-core.mjs';
import { parseSourceBlock, projectFromSources, SCOPE_SCHEMA, STATE_SCHEMA } from '../scripts/project-board-sources.mjs';

const base = path.resolve(process.env.TW_BOARD_TEST_ROOT || 'E:/Test Area/TavernWeave/1.8.0/board-source-tests');
const block = (name, value) => '<!-- ' + name + ':begin -->\n```json\n' + JSON.stringify(value, null, 2) + '\n```\n<!-- ' + name + ':end -->\n';
function data() {
  return {
    scope: { schema: SCOPE_SCHEMA, revision: 0, project: { id: 'source-test', title: '合成同步项目', version: 'fixture' }, baseline: { id: 'scope-1', label: '合成范围', confirmed: true, reference: '总设计案内合成确认记录，不代表真实验收' }, items: [{ id: 'storage', title: '保存', module: '数据', scope: 'current', weight: 1, checkpoints: [{ id: 'write', title: '落盘', weight: 1, gateKinds: ['automated', 'driver'] }] }] },
    state: { schema: STATE_SCHEMA, revision: 0, projectId: 'source-test', designRevision: 0, baselineId: 'scope-1', handoff: { currentStep: '检查保存', nextGate: '驾驶员亲手检查', openRisks: ['真实宿主未验'], feedbackRefs: [] }, items: [{ id: 'storage', activity: 'doing', summary: '实现已有证据，驾驶员待验', checkpoints: [{ id: 'write', implemented: true, evidence: ['checks/implementation.md'], gates: [{ kind: 'automated', status: 'passed', evidence: ['checks/automated.md'] }, { kind: 'driver', status: 'pending', evidence: [] }] }] }] },
  };
}
async function write(root, d, { design = '总设计案.md', next = 'NEXT.md' } = {}) {
  await fs.writeFile(path.join(root, design), '# 合成设计\n' + block('tw-progress-scope', d.scope));
  await fs.writeFile(path.join(root, next), '# 合成续接\n' + block('tw-progress-state', d.state));
}
async function fixture(options = {}) {
  await fs.mkdir(base, { recursive: true }); const root = await fs.mkdtemp(path.join(base, 'sources-'));
  await fs.mkdir(path.join(root, 'checks'));
  for (const p of ['implementation', 'automated', 'driver']) await fs.writeFile(path.join(root, 'checks', p + '.md'), '# 合成证据，仅用于同步测试');
  const d = data(); await write(root, d, options); await initializeBoardFromSources(root, options); return { root, d };
}
test('source initialization projects exact design scope and NEXT facts, leaves authority files untouched', async () => {
  const { root } = await fixture({ design: '既有设计.md', next: '继续项目.md' });
  const before = await fs.readFile(path.join(root, '继续项目.md'));
  const s = await readProjectBoard(root);
  assert.equal(s.progress.implemented, 1); assert.equal(s.progress.accepted, 0);
  assert.equal(s.board.authority.handoff.nextGate, '驾驶员亲手检查'); assert.equal(s.stale, false); assert.equal(s.authorityError, null);
  assert.deepEqual(await fs.readFile(path.join(root, '继续项目.md')), before);
  await assert.rejects(() => initializeBoardFromSources(root), /不存在|覆盖/u);
});
test('strict blocks reject duplicate or broken markers, mismatched versions, missing rows and extra gates', () => {
  const d = data(); const rendered = block('tw-progress-scope', d.scope);
  assert.deepEqual(parseSourceBlock(rendered, 'tw-progress-scope'), d.scope);
  for (const content of [rendered + rendered, rendered.replace('```json', '```'), rendered.replace('"revision": 0', '"revision":'), rendered.replace(':end -->', ':begin -->')]) assert.throws(() => parseSourceBlock(content, 'tw-progress-scope'));
  for (const change of [(x) => { x.state.designRevision++; }, (x) => { x.state.items = []; }, (x) => { x.state.items.push(x.state.items[0]); }, (x) => { x.state.items[0].checkpoints[0].gates.pop(); }, (x) => { x.scope.items[0].implemented = true; }]) {
    const x = structuredClone(d); change(x); assert.throws(() => projectFromSources(x.scope, x.state));
  }
});
test('source preview is read-only, applying updates handoff and preserves scope and feedback history', async () => {
  const { root, d } = await fixture(); const before = await fs.readFile(path.join(root, 'progress/progress.json'));
  d.state.revision++; d.state.handoff.currentStep = '核对下一阶段'; await write(root, d);
  const stale = await readProjectBoard(root); assert.ok(stale.stale); assert.ok(stale.authorityError); assert.equal(stale.progress.implemented, null);
  const plan = await planSourceSync(root); assert.ok(plan.differences.length);
  assert.deepEqual(await fs.readFile(path.join(root, 'progress/progress.json')), before);
  assert.equal((await applySourceSync(root, plan)).saved, true);
  const after = await readProjectBoard(root); assert.equal(after.authorityError, null); assert.equal(after.board.authority.nextRevision, 1); assert.equal(after.board.history[0].authority.nextRevision, 0);
  assert.equal(after.feedback.revision, 0); assert.equal(after.progress.implemented, 1);
  assert.equal((await applySourceSync(root, await planSourceSync(root))).unchanged, true);
});
test('source, evidence, feedback and board changes invalidate a previously reviewed preview', async (t) => {
  for (const kind of ['source', 'evidence', 'feedback', 'board']) await t.test(kind, async () => {
    const { root, d } = await fixture(); d.state.revision++; d.state.handoff.currentStep = '新步骤'; await write(root, d);
    const plan = await planSourceSync(root);
    if (kind === 'source') await fs.appendFile(path.join(root, 'NEXT.md'), '\n另一次编辑');
    if (kind === 'evidence') {
      await fs.appendFile(path.join(root, 'checks/automated.md'), '\n内容改变');
      const stale = await readProjectBoard(root); assert.match(stale.evidenceError, /证据内容/u); assert.equal(stale.progress.accepted, null);
    }
    if (kind === 'feedback') { const s = await readProjectBoard(root); await recordFeedback(root, 'add', { expectedRevision: s.feedback.revision, context: s.context, type: 'bug', title: '并发回报', text: '合成反馈变化', priority: 'P1' }); }
    if (kind === 'board') await applySourceSync(root, await planSourceSync(root));
    const before = await fs.readFile(path.join(root, 'progress/progress.json'));
    await assert.rejects(() => applySourceSync(root, plan), /预览已失效/u);
    assert.deepEqual(await fs.readFile(path.join(root, 'progress/progress.json')), before);
  });
});
test('adopting source mode blocks manual sync and malformed markers never fall back to manual JSON', async () => {
  const { root } = await fixture(); const s = await readProjectBoard(root);
  await assert.rejects(() => syncBoard(root, s.board, s.board.revision, { reviewedSources: true }), /source-plan/u);
  await fs.writeFile(path.join(root, 'NEXT.md'), '<!-- tw-progress-state:begin -->\n损坏块');
  assert.ok((await readProjectBoard(root)).authorityError);
  await assert.rejects(() => planSourceSync(root), /标记块/u);
  await assert.rejects(() => syncBoard(root, s.board, 0, { reviewedSources: true }), /source-plan/u);
});
test('scope change requires a new confirmed baseline and design/NEXT revisions; history keeps old denominator', async () => {
  const { root, d } = await fixture();
  d.scope.items[0].weight = 3; d.scope.revision++; d.state.designRevision++; d.state.revision++; await write(root, d);
  await assert.rejects(async () => applySourceSync(root, await planSourceSync(root)), /范围变化/u);
  d.scope.baseline = { ...d.scope.baseline, id: 'scope-2', reference: '合成范围调整确认' }; d.state.baselineId = 'scope-2'; await write(root, d);
  await applySourceSync(root, await planSourceSync(root));
  const after = await readProjectBoard(root); assert.equal(after.progress.denominator, 3); assert.equal(after.board.history[0].items[0].weight, 1);
});
test('changed facts need revision increments and new driver passes need explicit human reference', async () => {
  const { root, d } = await fixture(); d.state.handoff.currentStep = '未递增'; await write(root, d);
  await assert.rejects(async () => applySourceSync(root, await planSourceSync(root)), /递增 NEXT/u);
  d.state.revision++; const g = d.state.items[0].checkpoints[0].gates[1]; g.status = 'passed'; g.evidence = ['checks/driver.md']; g.confirmationRef = 'fixture-driver-confirmation'; await write(root, d);
  const plan = await planSourceSync(root);
  await assert.rejects(() => applySourceSync(root, plan), /明确确认依据/u);
  await applySourceSync(root, plan, { driverConfirmation: g.confirmationRef });
  assert.equal((await readProjectBoard(root)).progress.accepted, 1);
});
test('NEXT can link existing feedback without adopting its scope; nonexistent references are rejected', async () => {
  const { root, d } = await fixture(); const s = await readProjectBoard(root);
  const result = await recordFeedback(root, 'add', { expectedRevision: s.feedback.revision, context: s.context, type: 'idea', title: '以后增加皮肤', text: '仅记录', priority: 'P2' });
  d.state.revision++; d.state.handoff.feedbackRefs = ['missing-id']; await write(root, d);
  await assert.rejects(() => planSourceSync(root), /不存在的反馈/u);
  d.state.handoff.feedbackRefs = [result.id]; await write(root, d); await applySourceSync(root, await planSourceSync(root));
  const after = await readProjectBoard(root); assert.equal(after.progress.denominator, 1); assert.equal(after.feedback.records[0].state, 'new'); assert.equal(after.feedback.revision, 1);
});
