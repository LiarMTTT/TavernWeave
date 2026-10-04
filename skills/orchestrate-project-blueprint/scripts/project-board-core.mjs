import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BOARD_SCHEMA, FEEDBACK_SCHEMA, relativePath, validateBoard, validateFeedback, calculateProgress, formatPercent } from '../assets/templates/progress/progress-math.mjs';
import { PLAN_SCHEMA, readSourceProjection, projectionIdentity, syncDifferences } from './project-board-sources.mjs';

const templates = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/templates/progress');
export class BoardError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (value) => JSON.stringify(value, null, 2) + '\n';
function assertValid(errors) { if (errors.length) throw new BoardError(errors.join('\n')); }
export async function projectPath(root, relative, mustExist = true) {
  if (!relativePath(relative)) throw new BoardError('路径须位于所选项目内：' + relative);
  const realRoot = await fs.realpath(root);
  const target = path.resolve(realRoot, relative);
  if (!target.startsWith(realRoot + path.sep)) throw new BoardError('路径超出项目');
  let ancestor = target;
  while (true) {
    try {
      const real = await fs.realpath(ancestor);
      if (real !== realRoot && !real.startsWith(realRoot + path.sep)) throw new BoardError('符号链接指向项目外');
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (mustExist || ancestor === realRoot) throw new BoardError('文件不存在：' + relative, 404);
      ancestor = path.dirname(ancestor);
    }
  }
  return target;
}
async function readJSON(root, relative) { return JSON.parse(await fs.readFile(await projectPath(root, relative), 'utf8')); }
async function atomicJSON(target, value) {
  const temp = target + '.tmp-' + randomUUID();
  try {
    await fs.writeFile(temp, json(value), { flag: 'wx' });
    await fs.rename(temp, target);
    const readback = JSON.parse(await fs.readFile(target, 'utf8'));
    if (json(readback) !== json(value)) throw new BoardError('写后回读不一致；请检查文件实际状态', 500);
  } finally { await fs.unlink(temp).catch((e) => { if (e.code !== 'ENOENT') throw e; }); }
}
async function withLock(root, work) {
  const lock = await projectPath(root, 'progress/.write-lock', false);
  let handle;
  try { handle = await fs.open(lock, 'wx'); }
  catch (error) { if (error.code === 'EEXIST') throw new BoardError('另一项写入尚未结束，请重新读取后再提交', 409); throw error; }
  try { await handle.writeFile(json({ pid: process.pid, time: new Date().toISOString() })); return await work(); }
  finally { await handle.close(); await fs.unlink(lock); }
}
async function sourceHashes(root, sources) {
  return Promise.all(sources.map(async (s) => ({ ...s, sha256: digest(await fs.readFile(await projectPath(root, s.path))) })));
}
async function hasSourceBlocks(root, sources) {
  const paths = new Set([...sources.filter((s) => ['design', 'next'].includes(s.id)).map((s) => s.path), '总设计案.md', 'NEXT.md']);
  for (const relative of paths) {
    try {
      if (/<!-- tw-progress-(?:scope|state):(begin|end) -->/u.test(await fs.readFile(await projectPath(root, relative), 'utf8'))) return true;
    } catch (error) { if (error.status !== 404) throw error; }
  }
  return false;
}
async function evidenceHashes(root, board, feedback) {
  const paths = new Set(board.items.flatMap((i) => i.checkpoints.flatMap((p) => [...p.evidence, ...p.gates.flatMap((g) => g.evidence)])));
  for (const r of feedback.records) if (r.state === 'closed') for (const p of r.verificationEvidence || []) paths.add(p);
  return Object.fromEntries(await Promise.all([...paths].sort().map(async (p) => [p, digest(await fs.readFile(await projectPath(root, p)))])));
}
async function validateEvidence(root, board, feedback = { records: [] }) {
  const paths = new Set(board.items.flatMap((i) => i.checkpoints.flatMap((p) => [...p.evidence, ...p.gates.flatMap((g) => g.evidence)])));
  for (const record of feedback.records) if (record.state === 'closed') for (const evidence of record.verificationEvidence || []) paths.add(evidence);
  for (const relative of paths) { const stat = await fs.stat(await projectPath(root, relative)); if (!stat.isFile()) throw new BoardError('证据不是文件：' + relative); }
}
function normalizeWeights(input) {
  const data = structuredClone(input);
  if (Array.isArray(data.items)) for (const item of data.items) {
    if (!item) continue;
    item.weight ??= 1;
    if (Array.isArray(item.checkpoints)) for (const point of item.checkpoints) if (point) point.weight ??= 1;
  }
  return data;
}
function checkDriverConfirmation(board, previous, driverConfirmation) {
  for (const item of board.items) for (const point of item.checkpoints) for (const gate of point.gates) {
    if (gate.kind !== 'driver' || gate.status !== 'passed') continue;
    const oldGate = previous?.items.find((i) => i.id === item.id)?.checkpoints.find((p) => p.id === point.id)?.gates.find((g) => g.kind === 'driver');
    if (json(oldGate) !== json(gate) && (!driverConfirmation || gate.confirmationRef !== driverConfirmation)) throw new BoardError('新驾驶员验收须提供明确确认依据，自动同步不能代填');
  }
}
function sameContext(a, b) {
  if (!b || a.boardRevision !== b.boardRevision || a.baselineId !== b.baselineId || !b.sourceHashes) return false;
  const keys = Object.keys(a.sourceHashes).sort();
  return keys.join('|') === Object.keys(b.sourceHashes).sort().join('|') && keys.every((key) => a.sourceHashes[key] === b.sourceHashes[key]);
}
export async function readProjectBoard(root) {
  const board = await readJSON(root, 'progress/progress.json');
  const feedback = await readJSON(root, 'progress/feedback.json');
  assertValid(validateBoard(board)); assertValid(validateFeedback(feedback));
  const currentSources = await Promise.all(board.sources.map(async (s) => {
    try { return { ...s, sha256: digest(await fs.readFile(await projectPath(root, s.path))) }; }
    catch (error) { return { ...s, sha256: null, error: error.message }; }
  }));
  const staleSources = currentSources.filter((s) => board.sources.find((old) => old.id === s.id)?.sha256 !== s.sha256);
  let evidenceError = null;
  try { await validateEvidence(root, board, feedback); } catch (error) { evidenceError = error.message; }
  if (!evidenceError && board.evidenceHashes) {
    try {
      const currentEvidence = await evidenceHashes(root, board, feedback);
      const changed = Object.keys(board.evidenceHashes).filter((p) => currentEvidence[p] !== board.evidenceHashes[p]);
      if (changed.length) evidenceError = '证据内容与上次同步不一致：' + changed.join('、') + '；请重新核对';
    } catch (error) { evidenceError = error.message; }
  }
  const context = { boardRevision: board.revision, baselineId: board.baseline.id, sourceHashes: Object.fromEntries(currentSources.map((s) => [s.id, s.sha256])) };
  const progress = calculateProgress(board, feedback);
  let authorityError = null;
  if (board.authority?.mode === 'design-next' || await hasSourceBlocks(root, board.sources)) {
    try {
      const projected = await readSourceProjection(root, board.sources, projectPath);
      if (projectionIdentity(projected) !== projectionIdentity(board)) authorityError = '总设计案或 NEXT 的结构化事实与画板不一致，请预览差异并同步';
    } catch (error) { authorityError = error.message; }
  }
  // Missing files invalidate evidence; source drift keeps the last recorded figures explicitly stale.
  if (evidenceError || authorityError) {
    progress.implemented = null; progress.accepted = null;
    for (const module of progress.modules) { module.implemented = null; module.accepted = null; }
  }
  return { board, feedback, context, stale: staleSources.length > 0, staleSources, evidenceError, authorityError, progress, writable: true };
}
export async function initializeBoard(root, rawInput, { driverConfirmation = '' } = {}) {
  const input = normalizeWeights(rawInput);
  await fs.realpath(root);
  const existing = await projectPath(root, 'progress', false);
  try { await fs.lstat(existing); throw new BoardError('progress/ 已存在；初次建立拒绝覆盖', 409); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  let sources = input.sources;
  if (!sources?.length) {
    sources = [];
    for (const [id, relative] of [['design', '总设计案.md'], ['blueprint', '项目实现步骤蓝图.md'], ['next', 'NEXT.md']]) {
      try { await projectPath(root, relative); sources.push({ id, path: relative }); }
      catch (error) { if (error.status !== 404) throw error; }
    }
  }
  if (!sources.some((s) => s.id === 'next')) throw new BoardError('须将实际当前进度入口以 id: next 纳入 sources；默认使用 NEXT.md，可指向旧项目已有入口');
  if (sources.some((s) => !relativePath(s.path))) throw new BoardError('来源路径须位于所选项目内');
  const board = { schema: BOARD_SCHEMA, revision: 0, project: input.project, baseline: input.baseline || { id: 'scope-1', label: '本轮范围待确认', confirmed: false, reference: '' }, sources: await sourceHashes(root, sources), items: input.items || [], ...(input.authority ? { authority: input.authority } : {}), updatedAt: new Date().toISOString(), history: [] };
  if (input.authority || await hasSourceBlocks(root, sources)) {
    const projection = await readSourceProjection(root, sources, projectPath);
    if (projectionIdentity(board) !== projectionIdentity(projection)) throw new BoardError('已采用文档同步，须直接从总设计案和 NEXT 初始化，不能手填投影绕过');
    if (json(board.sources) !== json(projection.sources)) throw new BoardError('初始化期间来源变化，请重新读取', 409);
  }
  assertValid(validateBoard(board)); checkDriverConfirmation(board, null, driverConfirmation); await validateEvidence(root, board);
  board.evidenceHashes = await evidenceHashes(root, board, { records: [] });
  const staging = await projectPath(root, '.progress-init-' + randomUUID(), false);
  await fs.mkdir(staging);
  let created = false;
  try {
    for (const name of ['index.html', 'board.css', 'board.js', 'progress-math.mjs']) await fs.copyFile(path.join(templates, name), path.join(staging, name));
    await fs.writeFile(path.join(staging, 'progress.json'), json(board));
    await fs.writeFile(path.join(staging, 'feedback.json'), json({ schema: FEEDBACK_SCHEMA, revision: 0, records: [] }));
    if (json(await sourceHashes(root, sources)) !== json(board.sources)) throw new BoardError('初始化期间来源变化，未建立画板；请重新读取', 409);
    if (json(await evidenceHashes(root, board, { records: [] })) !== json(board.evidenceHashes)) throw new BoardError('初始化期间证据变化，未建立画板；请重新读取', 409);
    // A second initializer must never replace another process's completed board.
    await fs.mkdir(existing);
    created = true;
    for (const name of await fs.readdir(staging)) await fs.rename(path.join(staging, name), path.join(existing, name));
  } catch (error) {
    if (created) await fs.rm(await projectPath(root, 'progress'), { recursive: true, force: true });
    throw error;
  } finally { await fs.rm(staging, { recursive: true, force: true }); }
  return { created: 'progress/', revision: 0, project: board.project.id };
}
function scopeSignature(board) {
  return json({ confirmed: board.baseline.confirmed, exemptions: board.baseline.exemptions || {}, items: board.items.filter((i) => i.scope === 'current').map((i) => ({ id: i.id, module: i.module, weight: i.weight, checkpoints: i.checkpoints.map((p) => ({ id: p.id, weight: p.weight, gates: p.gates.map((g) => ({ kind: g.kind, applicable: g.status !== 'not-applicable' })) })) })) });
}
export async function syncBoard(root, input, expectedRevision, { reviewedSources = false, driverConfirmation = '' } = {}) {
  return withLock(root, () => syncBoardLocked(root, input, expectedRevision, { reviewedSources, driverConfirmation }));
}
async function syncBoardLocked(root, input, expectedRevision, { reviewedSources = false, driverConfirmation = '', expectedSources = null, fromSources = false, expectedEvidence = null } = {}) {
    const old = await readProjectBoard(root);
    if (old.board.revision !== expectedRevision) throw new BoardError('画板版本冲突：当前为 ' + old.board.revision, 409);
    if (old.stale && !reviewedSources) throw new BoardError('来源已变化，须核查事实并显式确认已复核来源', 409);
    const next = normalizeWeights(input);
    next.schema = BOARD_SCHEMA; next.revision = old.board.revision + 1;
    assertValid(validateBoard({ ...next, sources: next.sources || old.board.sources }));
    const sourceIdentity = (sources) => json(sources.map((s) => ({ id: s.id, path: s.path })));
    if (sourceIdentity(next.sources || old.board.sources) !== sourceIdentity(old.board.sources) && !reviewedSources) throw new BoardError('来源清单变化须先核查事实并显式确认已复核来源', 409);
    next.sources = await sourceHashes(root, next.sources || old.board.sources);
    if (expectedSources && json(next.sources) !== json(expectedSources)) throw new BoardError('同步预览后来源变化，请重新核对差异', 409);
    if (!next.sources.some((s) => s.id === 'next')) throw new BoardError('不能移除当前进度入口来源 id: next');
    next.updatedAt = new Date().toISOString();
    if (old.board.authority || next.authority || await hasSourceBlocks(root, next.sources)) {
      if (!fromSources) throw new BoardError('已采用文档同步，请使用 source-plan / sync-sources 核对后更新');
      const projected = await readSourceProjection(root, next.sources, projectPath);
      if (projectionIdentity(projected) !== projectionIdentity(next)) throw new BoardError('已采用文档同步，画板必须与总设计案和 NEXT 一致；请使用 source-plan / sync-sources');
      if (old.board.authority) {
        if (next.authority.designRevision < old.board.authority.designRevision || next.authority.nextRevision < old.board.authority.nextRevision) throw new BoardError('文档版本不能回退');
        const scopeFacts = (b) => json({ project: b.project, baseline: b.baseline, items: b.items.map((i) => ({ id: i.id, title: i.title, module: i.module, weight: i.weight, scope: i.scope, checkpoints: i.checkpoints.map((p) => ({ id: p.id, title: p.title, weight: p.weight, gateKinds: p.gates.map((g) => g.kind) })) })) });
        if (scopeFacts(old.board) !== scopeFacts(next) && next.authority.designRevision === old.board.authority.designRevision) throw new BoardError('设计事实改变须递增总设计案的设计版本');
        if (projectionIdentity(old.board) !== projectionIdentity(next) && next.authority.nextRevision === old.board.authority.nextRevision) throw new BoardError('当前事实改变须递增 NEXT 状态版本');
      }
    }
    if (scopeSignature(old.board) !== scopeSignature(next) && (next.baseline.id === old.board.baseline.id || !next.baseline.reference?.trim())) throw new BoardError('计算范围变化须登记新的 baseline.id 和确认依据');
    checkDriverConfirmation(next, old.board, driverConfirmation);
    assertValid(validateBoard(next)); await validateEvidence(root, next);
    next.evidenceHashes = await evidenceHashes(root, next, old.feedback);
    next.history = [...(old.board.history || []), { revision: old.board.revision, project: old.board.project, baseline: old.board.baseline, sources: old.board.sources, items: old.board.items, evidenceHashes: old.board.evidenceHashes || null, ...(old.board.authority ? { authority: old.board.authority } : {}), archivedAt: next.updatedAt }];
    if (json(await sourceHashes(root, next.sources)) !== json(next.sources)) throw new BoardError('写入前来源再次变化，未同步；请重新核对', 409);
    if (expectedEvidence && json(await evidenceHashes(root, next, old.feedback)) !== json(expectedEvidence)) throw new BoardError('写入前证据变化，未同步；请重新核对', 409);
    await atomicJSON(await projectPath(root, 'progress/progress.json'), next);
    if (json(await sourceHashes(root, next.sources)) !== json(next.sources)) throw new BoardError('画板文件已写入，但来源在写后变化；当前记录已过期，请重新核对并同步', 409);
    if (json(await evidenceHashes(root, next, old.feedback)) !== json(next.evidenceHashes)) throw new BoardError('画板文件已写入，但证据在写后变化；当前记录已过期，请重新核对并同步', 409);
    return { saved: true, revision: next.revision, baselineId: next.baseline.id };
}
function chooseSources(board, { design, next } = {}) {
  const sources = structuredClone(board?.sources || []);
  for (const [id, relative] of [['design', design], ['next', next]]) {
    if (relative) { const old = sources.find((s) => s.id === id); if (old) old.path = relative; else sources.push({ id, path: relative }); }
  }
  if (!sources.some((s) => s.id === 'design')) sources.push({ id: 'design', path: '总设计案.md' });
  if (!sources.some((s) => s.id === 'next')) sources.push({ id: 'next', path: 'NEXT.md' });
  return sources;
}
export async function initializeBoardFromSources(root, { design, next, driverConfirmation = '' } = {}) {
  const projected = await readSourceProjection(root, chooseSources(null, { design, next }), projectPath);
  if (projected.authority.handoff.feedbackRefs.length) throw new BoardError('首次建立画板尚无反馈，NEXT 的 feedbackRefs 须为空；已有画板请使用同步');
  return initializeBoard(root, projected, { driverConfirmation });
}
export async function planSourceSync(root, options = {}) {
  const current = await readProjectBoard(root);
  const projected = await readSourceProjection(root, chooseSources(current.board, options), projectPath);
  const proposed = { ...projected, schema: BOARD_SCHEMA, revision: current.board.revision + 1 };
  assertValid(validateBoard(proposed)); await validateEvidence(root, proposed, current.feedback);
  proposed.evidenceHashes = await evidenceHashes(root, proposed, current.feedback);
  for (const ref of proposed.authority.handoff.feedbackRefs) if (!current.feedback.records.some((r) => r.id === ref)) throw new BoardError('NEXT 引用了不存在的反馈：' + ref);
  return { schema: PLAN_SCHEMA, expectedRevision: current.board.revision, expectedFeedbackRevision: current.feedback.revision, sources: projected.sources, evidenceHashes: proposed.evidenceHashes, proposed, differences: syncDifferences(current.board, proposed), progress: calculateProgress(proposed, current.feedback), evidenceCheck: '文件存在与 SHA-256；内容真实性仍由项目审查核对' };
}
export async function applySourceSync(root, plan, { driverConfirmation = '' } = {}) {
  if (plan?.schema !== PLAN_SCHEMA || !Array.isArray(plan.sources)) throw new BoardError('同步预览格式无效');
  return withLock(root, async () => {
    const fresh = await planSourceSync(root, { design: plan.sources.find((s) => s.id === 'design')?.path, next: plan.sources.find((s) => s.id === 'next')?.path });
    if (json(fresh) !== json(plan)) throw new BoardError('同步预览已失效：来源、画板、反馈或证据变化，请重新生成并核对差异', 409);
    if (!fresh.differences.length) return { saved: false, unchanged: true, revision: fresh.expectedRevision };
    return syncBoardLocked(root, fresh.proposed, fresh.expectedRevision, { reviewedSources: true, driverConfirmation, expectedSources: fresh.sources, expectedEvidence: fresh.evidenceHashes, fromSources: true });
  });
}
export async function recordFeedback(root, operation, payload) {
  return withLock(root, async () => {
    const current = await readProjectBoard(root);
    if (current.feedback.revision !== payload.expectedRevision) throw new BoardError('反馈版本冲突：当前为 ' + current.feedback.revision + '。草稿未保存，请重读后比较提交。', 409);
    if (!sameContext(current.context, payload.context)) throw new BoardError('项目来源或画板版本已变化，请重读当前范围；草稿未保存', 409);
    const data = structuredClone(current.feedback);
    const now = new Date().toISOString();
    let record;
    if (operation === 'add') {
      const type = payload.type;
      record = { id: type + '-' + randomUUID(), type, title: payload.title, text: payload.text, itemId: payload.itemId || null, priority: payload.priority || 'P1', state: type === 'review' ? 'recorded' : 'new', blocking: payload.blocking === true && type === 'bug', createdAt: now, updatedAt: now, context: current.context, history: [{ time: now, operation: 'add', source: payload.source || 'cli', title: payload.title, text: payload.text, state: type === 'review' ? 'recorded' : 'new', context: current.context }] };
      data.records.push(record);
    } else if (operation === 'update') {
      record = data.records.find((r) => r.id === payload.id);
      if (!record) throw new BoardError('反馈条目不存在', 404);
      if (record.type === 'bug' && payload.state === 'closed' && record.state !== 'retest') throw new BoardError('Bug须先进入待复测，再凭复测结果关闭');
      const patch = payload.patch || {};
      const oldState = record.state;
      for (const key of ['title', 'text', 'priority', 'itemId', 'blocking', 'resolution', 'verification', 'verificationEvidence']) if (Object.hasOwn(patch, key)) record[key] = patch[key];
      if (payload.state) record.state = payload.state;
      if (!payload.reason?.trim()) throw new BoardError('修改反馈状态或内容须写明理由');
      record.updatedAt = now;
      record.history.push({ time: now, operation: 'update', source: payload.source || 'cli', oldState, state: record.state, reason: payload.reason, patch, context: current.context });
    } else throw new BoardError('未知反馈操作');
    if (record.itemId && !current.board.items.some((i) => i.id === record.itemId)) throw new BoardError('关联事项不存在');
    assertValid(validateFeedback(data));
    if (record.state === 'closed') for (const evidence of record.verificationEvidence) {
      if (!(await fs.stat(await projectPath(root, evidence))).isFile()) throw new BoardError('复测证据须为文件：' + evidence);
    }
    data.revision += 1;
    await atomicJSON(await projectPath(root, 'progress/feedback.json'), data);
    return { saved: true, revision: data.revision, id: record.id, state: record.state };
  });
}
export function exportMarkdown(snapshot) {
  const { board, feedback, progress } = snapshot;
  const percentage = (v) => v === null ? '暂无可核对百分比' : formatPercent(v);
  const lines = ['# ' + board.project.title + ' · 项目画板', '', '- 项目版本：' + board.project.version, '- 范围：' + board.baseline.label + '（' + board.baseline.id + '）', '- 画板版本：' + board.revision + '；反馈版本：' + feedback.revision, '- 来源状态：' + (snapshot.stale ? '已变化，须重新核对；下列为旧记录' : '与记录一致'), '- 实现进度：' + percentage(progress.implemented), '- 验收进度：' + percentage(progress.accepted), '', '## 事项与证据', ''];
  for (const item of board.items) {
    lines.push('### ' + item.title, '', '- 模块：' + item.module + '；范围：' + item.scope + '；权重：' + item.weight, '- 现状：' + item.summary);
    for (const p of item.checkpoints) lines.push('- [' + (p.implemented ? 'x' : ' ') + '] ' + p.title + '；证据：' + (p.evidence.join('、') || '待补') + '；验收：' + p.gates.map((g) => g.kind + '=' + g.status).join('、'));
    lines.push('');
  }
  if (snapshot.evidenceError) lines.push('证据文件检查失败：' + snapshot.evidenceError, '');
  if (snapshot.authorityError) lines.push('项目文档同步待处理：' + snapshot.authorityError, '');
  if (board.authority) lines.push('## 当前续接', '', '- 当前步骤：' + board.authority.handoff.currentStep, '- 下一道门：' + board.authority.handoff.nextGate, '- 开放风险：' + (board.authority.handoff.openRisks.join('；') || '未记录开放风险'), '- 已关联反馈：' + (board.authority.handoff.feedbackRefs.join('、') || '无'), '');
  lines.push('百分比只描述已确认范围的记录，不自动代替真实宿主、驾驶员、提交、封装或发布门。', '');
  lines.push('## 反馈与审核记录', '');
  for (const r of feedback.records) { lines.push('### ' + r.title, '', '- ID：' + r.id + '；类型：' + r.type + '；状态：' + r.state, '- 关联：' + (r.itemId || '项目整体'), '- 原文：' + r.text, '- 原始版本：' + r.context.boardRevision, '- 历史：' + JSON.stringify(r.history), ''); }
  return lines.join('\n') + '\n';
}
