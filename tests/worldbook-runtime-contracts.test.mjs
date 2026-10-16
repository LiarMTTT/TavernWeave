import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateObservation } from '../skills/sillytavern-runtime-debug/scripts/validate-worldbook-observation.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixtureDirectory = path.join(root, 'skills/sillytavern-runtime-debug/tests/fixtures');
const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, 'worldbook-isolated-contract.json'), 'utf8'));
const pending = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, 'worldbook-runtime-observation.pending.json'), 'utf8'));

// Original bounded design examples only. These functions neither emulate nor call
// SillyTavern, EJS, MVU, a browser, external cards, or any remote dependency.
function inspectTargets(data) {
  return data.targets.map(target => {
    if (target.status === 'external-unverified') return { entityId: target.entityId, status: 'external-unverified' };
    const entries = data.entries.filter(entry => target.bookId === data.bookId && entry.uid === target.uid);
    if (entries.length !== 1) return { entityId: target.entityId, status: entries.length ? 'ambiguous' : 'missing' };
    const entry = entries[0];
    return { entityId: target.entityId, status: entry.kind !== target.kind ? 'category-mismatch'
      : entry.contentId !== target.contentId ? 'identity-mismatch' : 'local', enabled: entry.enabled };
  });
}

function resolveAlias(data, alias, kind) {
  const matches = data.targets.filter(target => target.kind === kind && target.aliases.includes(alias));
  return matches.length === 1 ? matches[0].entityId : matches.length ? 'ambiguous' : 'missing';
}

function conditionResult(input) {
  if (!input.entryReachable) return 'not-evaluated';
  if (!Object.hasOwn(input.state, 'water')) return 'missing';
  if (input.state.water === 'high') return 'include';
  if (input.state.water === 'normal') return 'omit';
  return 'invalid';
}

function stateSelection(state, mentionedEra) {
  if (state.ready !== true) return { status: 'uninitialized' };
  for (const key of ['era', 'period', 'chapter']) {
    if (!Object.hasOwn(state, key)) return { status: 'missing', key };
    if (['待初始化', '未开始'].includes(state[key])) return { status: 'sentinel', key };
  }
  const chapter = fixture.chapters.find(item => item.id === state.chapter);
  if (!chapter) return { status: 'missing-target' };
  if (chapter.era !== state.era || chapter.period !== state.period) return { status: 'inconsistent' };
  return { status: 'selected', chapter: chapter.id, era: state.era,
    ignoredMentionConflict: mentionedEra !== undefined && mentionedEra !== state.era };
}

function readOnlyProjection(state) {
  const view = {};
  for (const key of ['water', 'toll', 'permitRequired']) {
    if (Object.hasOwn(state, key)) view[key] = structuredClone(state[key]);
  }
  if (Object.hasOwn(state, 'archivedModule')) view.folded = ['archivedModule'];
  return view;
}

function assembleDesignCandidates(candidates, budget) {
  const byIdentity = new Map();
  for (const candidate of candidates) {
    const entry = fixture.entries.find(item => item.uid === candidate.uid);
    if (!entry || entry.contentId !== candidate.contentId) throw new Error('missing or inconsistent target');
    const previous = byIdentity.get(candidate.contentId);
    if (previous) {
      if (previous.owner !== candidate.owner || previous.revision !== candidate.revision
        || previous.text !== entry.text) throw new Error('conflicting authority');
      previous.routes.push(candidate.route);
      previous.required ||= candidate.required;
      previous.priority = Math.max(previous.priority, candidate.priority);
    } else byIdentity.set(candidate.contentId, { ...candidate, text: entry.text, routes: [candidate.route] });
  }
  const ordered = [...byIdentity.values()].sort((a, b) => Number(b.required) - Number(a.required) || b.priority - a.priority);
  const kept = [], omitted = [];
  for (const candidate of ordered) {
    const text = [...kept, candidate].map(item => item.text).join('\n');
    if (kept.length + 1 > budget.maxEntries || [...text].length > budget.maxCodePoints) {
      if (candidate.required) throw new Error('required content exceeds budget');
      omitted.push({ contentId: candidate.contentId, reason: 'optional-over-budget' });
    } else kept.push(candidate);
  }
  return { kept, omitted, text: kept.map(item => item.text).join('\n'), runtimeStatus: 'not-run', tokenCount: null };
}

test('self-written fixture is inert data and cannot declare runtime/model success', () => {
  assert.equal(fixture.purpose, 'original-static-design-fixture');
  assert.equal(fixture.nativeRecursion, false);
  assert.equal(fixture.runtimeStatus, 'not-run');
  assert.equal(fixture.modelStatus, 'not-run');
  assert.equal(fixture.budget.tokenCount, null);
  assert.equal(fixture.budget.tokenizer, null);
  assert.doesNotMatch(JSON.stringify(fixture), /https?:|<%|import\s|eval\(/);
  assert.ok(fixture.runtimeOnlyCases.every(item => item.runtimeStatus === 'not-run'));
  const ids = fixture.runtimeOnlyCases.map(item => item.id);
  for (const id of ['native-hit', 'native-miss', 'read-existing', 'read-disabled', 'read-missing',
    'write-failed', 'valid-patch', 'invalid-patch', 'regenerate', 'swipe', 'edit', 'rollback']) assert.ok(ids.includes(id), id);
});

test('typed aliases retain stable identities across display-name changes', () => {
  assert.equal(resolveAlias(fixture, '旧桥', 'location'), 'bridge-east');
  assert.equal(resolveAlias(fixture, '石桥', 'location'), 'bridge-east');
  assert.equal(resolveAlias(fixture, '旧桥', 'faction'), 'missing');
  const renamed = structuredClone(fixture);
  renamed.entries[0].name = '东岸桥梁';
  assert.deepEqual(inspectTargets(renamed), inspectTargets(fixture));
  renamed.targets.push({ ...renamed.targets[0], entityId: 'different-bridge' });
  assert.equal(resolveAlias(renamed, '旧桥', 'location'), 'ambiguous');
});

test('missing, wrong type, external-unverified and disabled are distinct facts', () => {
  const original = inspectTargets(fixture);
  assert.equal(original[2].status, 'local');
  assert.equal(original[2].enabled, false); // Existence is not proof of disabled-read support.
  assert.equal(original[3].status, 'external-unverified');
  const broken = structuredClone(fixture);
  broken.targets[0].kind = 'rule';
  broken.targets[1].uid = 999;
  broken.targets[2].contentId = 'wrong-content';
  assert.deepEqual(inspectTargets(broken).map(item => item.status),
    ['category-mismatch', 'missing', 'identity-mismatch', 'external-unverified']);
});

for (const scenario of fixture.conditionCases) {
  test(`static condition specification: ${scenario.id}`, () => {
    assert.equal(conditionResult(scenario), scenario.expected);
  });
}

test('invalid water does not become the ordinary false-condition branch', () => {
  for (const water of [null, false, 0, 'unknown']) {
    assert.equal(conditionResult({ entryReachable: true, state: { water } }), 'invalid');
  }
});

test('state authority wins a mention conflict without writing or inventing a chapter', () => {
  const before = structuredClone(fixture.state);
  assert.deepEqual(stateSelection(fixture.state, 'past'), {
    status: 'selected', chapter: 'crossing', era: 'current', ignoredMentionConflict: true,
  });
  assert.deepEqual(fixture.state, before);
  assert.equal(stateSelection({ ...before, ready: false }).status, 'uninitialized');
  assert.equal(stateSelection({ ...before, chapter: '未开始' }).status, 'sentinel');
  assert.equal(stateSelection({ ...before, era: '待初始化' }).status, 'sentinel');
  assert.equal(stateSelection({ ...before, period: 'late' }).status, 'inconsistent');
  assert.equal(stateSelection({ ...before, chapter: 'invented' }).status, 'missing-target');
  const missing = { ...before }; delete missing.chapter;
  assert.equal(stateSelection(missing).status, 'missing');
});

test('write failure blocks the dependent action in the declared design, with no state change', () => {
  const before = structuredClone(fixture.state);
  const proposed = { ...before, period: 'late', chapter: 'return' };
  const completeDesignWrite = (committed) => committed
    ? { state: proposed, mayGenerate: true } : { state: before, mayGenerate: false };
  const result = completeDesignWrite(false);
  assert.equal(result.mayGenerate, false);
  assert.deepEqual(result.state, fixture.state);
  // No actual MVU API write has been attempted by this design test.
});

test('global design arbitration deduplicates native and two template controllers', () => {
  const result = assembleDesignCandidates(fixture.candidates, fixture.budget);
  assert.equal(result.kept.length, 2);
  assert.equal(result.kept[0].contentId, 'bridge-east.rule');
  assert.deepEqual(result.kept[0].routes, ['native', 'template-a', 'template-b']);
  assert.equal(result.text.split('桥正常开放；涨水时关闭。').length - 1, 1);
  assert.deepEqual(result.omitted, [{ contentId: 'bridge-east.material', reason: 'optional-over-budget' }]);
  assert.ok([...result.text].length <= fixture.budget.maxCodePoints);
  assert.equal(result.runtimeStatus, 'not-run');
  assert.equal(result.tokenCount, null);
});

test('budget cannot silently drop required content or resolve competing authorities', () => {
  assert.throws(() => assembleDesignCandidates(fixture.candidates, { maxEntries: 0, maxCodePoints: 0 }), /required/);
  const conflict = structuredClone(fixture.candidates);
  conflict[1].owner = 'another-authority';
  assert.throws(() => assembleDesignCandidates(conflict, fixture.budget), /conflicting authority/);
  const absent = [{ ...fixture.candidates[0], uid: 999 }];
  assert.throws(() => assembleDesignCandidates(absent, fixture.budget), /missing/);
});

test('read-only projection distinguishes valid zero/false from missing and preserves folded notice', () => {
  const state = { ...fixture.state, archivedModule: { count: 0, completed: false } };
  const before = structuredClone(state);
  const view = readOnlyProjection(state);
  assert.equal(view.toll, 0);
  assert.equal(view.permitRequired, false);
  assert.deepEqual(view.folded, ['archivedModule']);
  assert.deepEqual(state, before);
  assert.deepEqual(readOnlyProjection({ water: 'high' }), { water: 'high' });
  view.toll = 99;
  assert.deepEqual(state, before);
});

test('pending observation is structurally valid while all host evidence remains unobserved', () => {
  assert.deepEqual(validateObservation(pending), { valid: true, errors: [] });
  assert.equal(pending.runtimeStatus, 'not-run');
  assert.ok(Object.values(pending.observed).every(value => value === null));
});

test('changing a label or copying expected values cannot manufacture runtime/model evidence', () => {
  const falsePass = { ...pending, runtimeStatus: 'pass' };
  assert.equal(validateObservation(falsePass).valid, false);
  const smuggled = structuredClone(pending);
  smuggled.observed.condition = { result: true };
  assert.equal(validateObservation(smuggled).valid, false);
  assert.equal(validateObservation({ ...pending, modelStatus: 'pass', modelEvidenceRef: 'unverified' }).valid, false);
  assert.equal(validateObservation(null).valid, false);
});

// Synthetic receipt to exercise structural validation only. These strings are
// deliberately not evidence of a real host run and are never saved as such.
function syntheticReceipt() {
  const record = structuredClone(pending);
  Object.assign(record, { runtimeStatus: 'pass', runtimeBlockers: [], modelBlockers: [] });
  record.environment = { sillytavern: 'synthetic-test-version', extensions: {}, browser: 'synthetic-test', configurationRef: 'synthetic:test-only' };
  record.authorization = { environmentRef: 'synthetic:test-only', operations: ['capture-test-shape'] };
  Object.assign(record.observed, {
    entry: { reached: true, evidenceRef: 'synthetic:entry' },
    condition: { result: true, evidenceRef: 'synthetic:condition' },
    output: { codePoints: 0, evidenceRef: 'synthetic:output' },
    finalRequest: { captured: true, recipient: 'synthetic:plot', evidenceRef: 'synthetic:request', tokenCount: null },
  });
  return record;
}

test('receipt validation checks required boundaries, not truth of evidence contents', () => {
  assert.equal(validateObservation(syntheticReceipt()).valid, true);
  const noRequest = syntheticReceipt(); noRequest.observed.finalRequest.captured = false;
  assert.equal(validateObservation(noRequest).valid, false);
  const unreachable = syntheticReceipt(); unreachable.observed.entry.reached = false;
  assert.equal(validateObservation(unreachable).valid, false);
  unreachable.observed.condition.result = 'not-evaluated';
  assert.equal(validateObservation(unreachable).valid, true);
  const unversioned = syntheticReceipt(); unversioned.environment.extensions.template = '';
  assert.equal(validateObservation(unversioned).valid, false);
});

test('runtime pass and blocked model call retain independent, scoped evidence gates', () => {
  const record = syntheticReceipt();
  record.modelStatus = 'blocked';
  record.modelBlockers = ['等待模型调用授权'];
  assert.deepEqual(validateObservation(record), { valid: true, errors: [] });
  assert.equal(record.modelEvidenceRef, null);

  const erasedModelReason = structuredClone(record);
  erasedModelReason.modelBlockers = [];
  assert.equal(validateObservation(erasedModelReason).valid, false);

  const mixedRuntimeReason = structuredClone(record);
  mixedRuntimeReason.runtimeBlockers = ['等待模型调用授权'];
  assert.equal(validateObservation(mixedRuntimeReason).valid, false);

  const oldUnscopedReason = structuredClone(record);
  oldUnscopedReason.blockers = oldUnscopedReason.modelBlockers;
  delete oldUnscopedReason.modelBlockers;
  assert.equal(validateObservation(oldUnscopedReason).valid, false);
});

test('each failed or passed layer checks its own reasons without hiding the other layer', () => {
  const modelFailed = syntheticReceipt();
  Object.assign(modelFailed, { modelStatus: 'fail', modelEvidenceRef: 'synthetic:model-behavior', modelBlockers: ['Observed rule violation in the synthetic shape.'] });
  assert.equal(validateObservation(modelFailed).valid, true);
  modelFailed.modelBlockers = [];
  assert.equal(validateObservation(modelFailed).valid, false);
  modelFailed.modelStatus = 'pass';
  assert.equal(validateObservation(modelFailed).valid, true);
  modelFailed.modelBlockers = ['Unresolved model behavior.'];
  assert.equal(validateObservation(modelFailed).valid, false);

  const runtimeBlocked = structuredClone(pending);
  runtimeBlocked.runtimeStatus = 'blocked';
  assert.equal(validateObservation(runtimeBlocked).valid, true);
  runtimeBlocked.runtimeBlockers = [];
  assert.equal(validateObservation(runtimeBlocked).valid, false);
});

test('an unexecuted runtime can report a model authorization blocker but no fabricated observations', () => {
  const record = structuredClone(pending);
  record.modelStatus = 'blocked';
  record.modelBlockers = ['等待模型调用授权'];
  assert.equal(validateObservation(record).valid, true);
  assert.ok(Object.values(record.observed).every(value => value === null));
  record.observed.condition = { result: true, evidenceRef: 'synthetic:unexecuted' };
  assert.equal(validateObservation(record).valid, false);
});

test('even a zero token count requires tokenizer and measurement scope', () => {
  const record = syntheticReceipt(); record.observed.finalRequest.tokenCount = 0;
  assert.equal(validateObservation(record).valid, false);
  Object.assign(record.observed.finalRequest, { tokenizer: 'synthetic-test-only', measurementScope: 'final-request' });
  assert.equal(validateObservation(record).valid, true);
  record.observed.finalRequest.tokenCount = -1;
  assert.equal(validateObservation(record).valid, false);
});

test('CLI labels its result as structure-only and preserves not-run status', () => {
  const run = spawnSync(process.execPath, [
    path.join(root, 'skills/sillytavern-runtime-debug/scripts/validate-worldbook-observation.mjs'),
    path.join(fixtureDirectory, 'worldbook-runtime-observation.pending.json'),
  ], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.validation, 'receipt-structure-only');
  assert.equal(result.runtimeStatus, 'not-run');
  assert.equal(result.evidenceContentsVerified, false);
});

test('all new owner references resolve local links and retain explicit runtime boundaries', () => {
  const files = [
    'skills/consult-tavernweave-library/references/sillytavern-runtime-foundations.md',
    'skills/sillytavern-api-reference/references/worldbook-version-verification.md',
    'skills/sillytavern-database-rolecards/references/worldbook-target-state-contract.md',
    'skills/sillytavern-rolecard-performance/references/worldbook-output-budget.md',
    'skills/sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md',
  ];
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:|^#/.test(link)) continue;
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), link.split('#')[0])), `${file}: ${link}`);
    }
  }
  const version = fs.readFileSync(path.join(root, files[1]), 'utf8');
  assert.match(version, /环境均未核验/);
  assert.match(version, /ada54bb22e3dab0a07e473d383b4c2fe40bc6573/);
  assert.match(version, /本例选择的 `getChatMessages\(-1, 'user'\)`/);
  assert.match(version, /先按角色过滤，再各自 `slice\(-1\)`/);
  assert.match(version, /本例尚未经目标宿主实测/);
  const runtime = fs.readFileSync(path.join(root, files[4]), 'utf8');
  assert.match(runtime, /不是 runtime pass/);
  assert.match(runtime, /只运行获准的自写隔离材料/);
});

test('runtime learning surfaces contain neutral examples without delivery-source metadata', () => {
  const files = [
    'skills/consult-tavernweave-library/references/sillytavern-runtime-foundations.md',
    'skills/sillytavern-api-reference/SKILL.md',
    'skills/sillytavern-api-reference/references/worldbook-version-verification.md',
    'skills/sillytavern-database-rolecards/SKILL.md',
    'skills/sillytavern-database-rolecards/references/worldbook-target-state-contract.md',
    'skills/sillytavern-rolecard-performance/SKILL.md',
    'skills/sillytavern-rolecard-performance/references/worldbook-output-budget.md',
    'skills/sillytavern-runtime-debug/SKILL.md',
    'skills/sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md',
    'skills/sillytavern-runtime-debug/scripts/validate-worldbook-observation.mjs',
    'skills/sillytavern-runtime-debug/tests/fixtures/worldbook-isolated-contract.json',
    'skills/sillytavern-runtime-debug/tests/fixtures/worldbook-runtime-observation.pending.json',
    'skills/tavern-card-builder/references/card-types-and-runtime-dependencies.md',
    'skills/tavern-card-builder/references/variable-systems.md',
  ];
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /珠[玑矶]|斗罗|斗[一二三]|魂核|星斗|原卡|来源卡|真实卡/, file);
    assert.doesNotMatch(content, /\bP\d{3}\b|\b(?:232196|237405|692109|762363|796517|862183)\b/, file);
    assert.doesNotMatch(content, /worldbook-runtime-source-notes|f7c3a88836bda71f35353d2193d0db0ec0430d1af275d1e9957bdf6930936e4a|d2de21bc259711f984a4163a1f71812ea52460ea1e81e95398dc271ae4f8986d/, file);
  }
});

test('delivery-only notes preserve source identity and evidence limits outside skills', () => {
  const file = 'docs/worldbook-runtime-source-notes.md';
  const notes = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(notes, /不是 Skill 日常加载资料/);
  assert.match(notes, /未获得预设作者许可/);
  assert.match(notes, /f7c3a88836bda71f35353d2193d0db0ec0430d1af275d1e9957bdf6930936e4a/);
  assert.match(notes, /d2de21bc259711f984a4163a1f71812ea52460ea1e81e95398dc271ae4f8986d/);
  assert.match(notes, /399 \/ ID 762363/);
  assert.match(notes, /P060.*a0c7da7d-d719-4ab3-973a-36b0b07b2579/);
  assert.match(notes, /运行与模型行为仍为 `not-run`/);
  assert.match(notes, /`runtimeBlockers` 与 `modelBlockers` 保持独立/);
  for (const [, link] of notes.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:|^#/.test(link)) continue;
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), link.split('#')[0])), `${file}: ${link}`);
  }
});
