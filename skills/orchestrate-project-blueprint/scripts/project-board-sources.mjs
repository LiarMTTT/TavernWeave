import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const SCOPE_SCHEMA = 'tavernweave/progress-scope/v1';
export const STATE_SCHEMA = 'tavernweave/progress-state/v1';
export const PLAN_SCHEMA = 'tavernweave/progress-sync-plan/v1';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const record = (v) => v && typeof v === 'object' && !Array.isArray(v);
const text = (v) => typeof v === 'string' && v.trim().length > 0;
function fail(message) { throw new Error('项目文档同步：' + message); }
function keys(value, allowed, label) {
  if (!record(value)) fail(label + ' 须为对象');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(label + ' 包含不属于此来源的字段：' + key);
}
function revision(value, label) { if (!Number.isSafeInteger(value) || value < 0) fail(label + ' 须为非负整数'); }
function unique(rows, label) {
  if (!Array.isArray(rows)) fail(label + ' 须为数组');
  const result = new Map();
  for (const row of rows) {
    if (!record(row) || !text(row.id) || result.has(row.id)) fail(label + ' ID缺失或重复');
    result.set(row.id, row);
  }
  return result;
}
function sameIDs(left, right, label) {
  if (left.size !== right.size || [...left.keys()].some((id) => !right.has(id))) fail(label + ' 在总设计案与 NEXT 中不一致，须逐项补齐或登记范围调整');
}
export function parseSourceBlock(markdown, name) {
  const begin = '<!-- ' + name + ':begin -->';
  const end = '<!-- ' + name + ':end -->';
  if (markdown.split(begin).length !== 2 || markdown.split(end).length !== 2) fail(name + ' 须有且仅有一个完整标记块');
  const start = markdown.indexOf(begin) + begin.length;
  const finish = markdown.indexOf(end);
  if (finish < start) fail(name + ' 标记顺序错误');
  const body = markdown.slice(start, finish).trim();
  const match = /^```json\r?\n([\s\S]*?)\r?\n```$/u.exec(body);
  if (!match) fail(name + ' 须使用完整的 json 代码块');
  let data;
  try { data = JSON.parse(match[1]); } catch { fail(name + ' JSON 无效'); }
  return data;
}
export function projectFromSources(scope, state) {
  keys(scope, ['schema', 'revision', 'project', 'baseline', 'items'], '总设计范围');
  keys(state, ['schema', 'revision', 'projectId', 'designRevision', 'baselineId', 'handoff', 'items'], 'NEXT 状态');
  if (scope.schema !== SCOPE_SCHEMA || state.schema !== STATE_SCHEMA) fail('来源 schema 不匹配');
  revision(scope.revision, '设计版本'); revision(state.revision, 'NEXT 状态版本');
  if (state.projectId !== scope.project?.id || state.designRevision !== scope.revision || state.baselineId !== scope.baseline?.id) fail('项目、设计版本或范围基线不一致；先对齐总设计案与 NEXT');
  keys(state.handoff, ['currentStep', 'nextGate', 'openRisks', 'feedbackRefs'], 'NEXT 续接');
  if (!text(state.handoff.currentStep) || !text(state.handoff.nextGate) || !Array.isArray(state.handoff.openRisks) || state.handoff.openRisks.some((x) => !text(x)) || !Array.isArray(state.handoff.feedbackRefs) || state.handoff.feedbackRefs.some((x) => !text(x))) fail('NEXT 须声明当前步骤、下一道门、开放风险和反馈引用');
  const definitions = unique(scope.items, '设计事项');
  const statuses = unique(state.items, 'NEXT 事项');
  sameIDs(definitions, statuses, '事项');
  const items = [...definitions.values()].map((item) => {
    keys(item, ['id', 'title', 'module', 'weight', 'scope', 'checkpoints'], '设计事项 ' + item.id);
    const status = statuses.get(item.id);
    keys(status, ['id', 'activity', 'summary', 'checkpoints'], 'NEXT 事项 ' + item.id);
    const checks = unique(item.checkpoints, '设计检查点 ' + item.id);
    const results = unique(status.checkpoints, 'NEXT 检查点 ' + item.id);
    sameIDs(checks, results, '检查点 ' + item.id);
    const checkpoints = [...checks.values()].map((point) => {
      keys(point, ['id', 'title', 'weight', 'gateKinds'], '设计检查点 ' + point.id);
      const result = results.get(point.id);
      keys(result, ['id', 'implemented', 'evidence', 'gates'], 'NEXT 检查点 ' + point.id);
      if (!Array.isArray(point.gateKinds) || new Set(point.gateKinds).size !== point.gateKinds.length || point.gateKinds.some((x) => !['automated', 'browser', 'real-host', 'driver'].includes(x))) fail('设计验收门无效或重复：' + item.id + '/' + point.id);
      if (!Array.isArray(result.gates) || result.gates.length !== point.gateKinds.length || new Set(result.gates.map((g) => g?.kind)).size !== result.gates.length || result.gates.some((g) => !point.gateKinds.includes(g?.kind))) fail('NEXT 验收门与总设计案不一致：' + item.id + '/' + point.id);
      return { id: point.id, title: point.title, weight: point.weight ?? 1, implemented: result.implemented, evidence: result.evidence, gates: result.gates };
    });
    return { id: item.id, title: item.title, module: item.module, scope: item.scope, weight: item.weight ?? 1, activity: status.activity, summary: status.summary, checkpoints };
  });
  return { project: scope.project, baseline: scope.baseline, items, authority: { mode: 'design-next', designRevision: scope.revision, nextRevision: state.revision, handoff: state.handoff } };
}
export async function readSourceProjection(root, sources, resolvePath) {
  if (sources.some((s) => ['progress/progress.json', 'progress/feedback.json'].includes(s.path?.replaceAll('\\', '/').toLowerCase()))) fail('画板和反馈不能作为项目权威来源，避免引用循环');
  const design = sources.find((s) => s.id === 'design');
  const next = sources.find((s) => s.id === 'next');
  if (!design || !next || design.path === next.path) fail('须声明两个不同文件：id: design 总设计案、id: next 当前续接');
  const sourceBytes = await Promise.all(sources.map(async (s) => ({ ...s, bytes: await fs.readFile(await resolvePath(root, s.path)) })));
  const scope = parseSourceBlock(sourceBytes.find((s) => s.id === 'design').bytes.toString('utf8'), 'tw-progress-scope');
  const state = parseSourceBlock(sourceBytes.find((s) => s.id === 'next').bytes.toString('utf8'), 'tw-progress-state');
  return { ...projectFromSources(scope, state), sources: sourceBytes.map(({ id, path, bytes }) => ({ id, path, sha256: hash(bytes) })) };
}
export function projectionIdentity(board) {
  return JSON.stringify({ project: board.project, baseline: board.baseline, items: board.items, authority: board.authority });
}
export function syncDifferences(old, next) {
  const differences = [];
  for (const field of ['project', 'baseline', 'authority', 'evidenceHashes']) if (JSON.stringify(old[field]) !== JSON.stringify(next[field])) differences.push({ field, before: old[field] ?? null, after: next[field] });
  const before = new Map(old.items.map((x) => [x.id, x]));
  const after = new Map(next.items.map((x) => [x.id, x]));
  for (const id of new Set([...before.keys(), ...after.keys()])) if (JSON.stringify(before.get(id)) !== JSON.stringify(after.get(id))) differences.push({ field: 'items/' + id, before: before.get(id) ?? null, after: after.get(id) ?? null });
  for (const source of next.sources) if (old.sources.find((s) => s.id === source.id)?.sha256 !== source.sha256) differences.push({ field: 'sources/' + source.id, path: source.path, before: old.sources.find((s) => s.id === source.id)?.sha256 ?? null, after: source.sha256 });
  return differences;
}
