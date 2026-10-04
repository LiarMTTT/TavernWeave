export const BOARD_SCHEMA = 'tavernweave/progress-board/v1';
export const FEEDBACK_SCHEMA = 'tavernweave/progress-feedback/v1';
export const feedbackStates = {
  idea: ['new', 'discussing', 'adopted', 'parked', 'rejected'],
  bug: ['new', 'confirmed', 'fixing', 'retest', 'closed', 'wont-fix'],
  review: ['recorded'],
};
export const gateKinds = ['automated', 'browser', 'real-host', 'driver'];
const idPattern = /^[A-Za-z0-9._-]+$/u;
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const positive = (v) => Number.isFinite(v) && v > 0 && v <= 1000000;
export function relativePath(value) {
  return isText(value) && !/^[\\/]|^[A-Za-z]:|[\x00-\x1f]/u.test(value)
    && !value.split(/[\\/]/u).some((part) => part === '..' || part === '' || part === '.')
    && !value.includes(':');
}

export function validateBoard(data) {
  const errors = [];
  if (!data || data.schema !== BOARD_SCHEMA) return ['画板数据格式不匹配'];
  if (!Number.isSafeInteger(data.revision) || data.revision < 0) errors.push('画板版本必须是非负整数');
  if (!data.project || !idPattern.test(data.project.id || '') || !isText(data.project.title) || !isText(data.project.version)) errors.push('项目名称、ID或版本缺失');
  if (!data.baseline || !idPattern.test(data.baseline.id || '') || !isText(data.baseline.label) || typeof data.baseline.confirmed !== 'boolean') errors.push('目标范围信息缺失');
  if (data.baseline?.confirmed && !isText(data.baseline.reference)) errors.push('已确认范围须保留确认依据');
  if (data.authority !== undefined) {
    const a = data.authority;
    if (!a || a.mode !== 'design-next' || !Number.isSafeInteger(a.designRevision) || a.designRevision < 0 || !Number.isSafeInteger(a.nextRevision) || a.nextRevision < 0 || !isText(a.handoff?.currentStep) || !isText(a.handoff?.nextGate) || !Array.isArray(a.handoff?.openRisks) || a.handoff.openRisks.some((v) => !isText(v)) || !Array.isArray(a.handoff?.feedbackRefs) || a.handoff.feedbackRefs.some((v) => !isText(v))) errors.push('总设计案与 NEXT 的同步信息无效');
  }
  if (!Array.isArray(data.sources) || !data.sources.length) errors.push('须声明项目权威来源');
  const sourceIds = new Set();
  for (const source of Array.isArray(data.sources) ? data.sources : []) {
    if (!source || typeof source !== 'object') { errors.push('来源记录无效'); continue; }
    if (!idPattern.test(source.id || '') || sourceIds.has(source.id) || !relativePath(source.path) || !/^[a-f0-9]{64}$/u.test(source.sha256 || '')) errors.push('来源路径、哈希或ID无效');
    sourceIds.add(source.id);
  }
  if (!sourceIds.has('next')) errors.push('须声明当前续接来源 id: next，可指向旧项目已有入口');
  if (!Array.isArray(data.items) || data.items.length > 500) return [...errors, '事项须为数组，最多500项'];
  const ids = new Set();
  for (const item of data.items) {
    if (!item || typeof item !== 'object') { errors.push('事项记录无效'); continue; }
    if (!idPattern.test(item.id || '') || ids.has(item.id)) errors.push('事项ID缺失或重复');
    ids.add(item.id);
    if (!isText(item.title) || !isText(item.module) || !isText(item.summary) || !positive(item.weight)) errors.push('事项 ' + item.id + ' 的名称、模块、现状或权重无效');
    if (!['current', 'parked'].includes(item.scope) || !['todo', 'doing', 'blocked'].includes(item.activity)) errors.push('事项 ' + item.id + ' 的状态无效');
    if (!Array.isArray(item.checkpoints) || !item.checkpoints.length || item.checkpoints.length > 200) { errors.push('事项 ' + item.id + ' 须有明确检查点'); continue; }
    const checkIds = new Set();
    for (const point of item.checkpoints) {
      if (!point || typeof point !== 'object') { errors.push('检查点记录无效'); continue; }
      const label = item.id + '/' + point.id;
      if (!idPattern.test(point.id || '') || checkIds.has(point.id) || !isText(point.title) || !positive(point.weight) || typeof point.implemented !== 'boolean') errors.push('检查点 ' + label + ' 无效');
      checkIds.add(point.id);
      if (!Array.isArray(point.evidence) || point.evidence.some((v) => !relativePath(v))) errors.push('实现证据须为项目内相对路径：' + label);
      if (point.implemented && !point.evidence?.length) errors.push('已实现检查点缺少证据：' + label);
      if (!Array.isArray(point.gates)) { errors.push('检查点缺少验收门：' + label); continue; }
      const kinds = new Set();
      for (const gate of point.gates) {
        if (!gate || typeof gate !== 'object') { errors.push('验收门记录无效'); continue; }
        if (!gateKinds.includes(gate.kind) || kinds.has(gate.kind) || !['pending', 'passed', 'failed', 'not-applicable'].includes(gate.status)) errors.push('验收门重复或状态无效：' + label);
        kinds.add(gate.kind);
        if (!Array.isArray(gate.evidence) || gate.evidence.some((v) => !relativePath(v))) errors.push('验收证据路径无效：' + label);
        if (gate.status === 'passed' && !gate.evidence?.length) errors.push('通过验收须有证据：' + label);
        if (gate.status === 'passed' && !point.implemented) errors.push('未实现检查点不能已通过验收：' + label);
        if (gate.status === 'passed' && gate.kind === 'driver' && !isText(gate.confirmationRef)) errors.push('驾驶员验收须有明确确认依据：' + label);
        if (gate.status === 'not-applicable' && (!isText(gate.reason) || !isText(data.baseline?.exemptions?.[label + '/' + gate.kind]))) errors.push('不适用门须有范围依据和原因：' + label);
      }
    }
  }
  return errors;
}

export function validateFeedback(data) {
  if (!data || data.schema !== FEEDBACK_SCHEMA || !Number.isSafeInteger(data.revision) || data.revision < 0 || !Array.isArray(data.records)) return ['反馈数据格式或版本无效'];
  const errors = [];
  const ids = new Set();
  for (const record of data.records) {
    if (!record || typeof record !== 'object') { errors.push('反馈记录无效'); continue; }
    if (!idPattern.test(record.id || '') || ids.has(record.id) || !feedbackStates[record.type]?.includes(record.state)) errors.push('反馈ID或状态无效');
    ids.add(record.id);
    if (!isText(record.title) || !isText(record.text) || !['P0', 'P1', 'P2'].includes(record.priority) || !Array.isArray(record.history) || !record.context) errors.push('反馈内容不完整：' + record.id);
    if (record.type === 'bug' && ['closed', 'wont-fix'].includes(record.state) && !isText(record.resolution)) errors.push('关闭或不修复Bug须有依据：' + record.id);
    if (record.type === 'bug' && record.state === 'closed' && !isText(record.verification)) errors.push('关闭Bug须保留复测结果：' + record.id);
    if (record.type === 'bug' && record.state === 'closed' && (!Array.isArray(record.verificationEvidence) || !record.verificationEvidence.length || record.verificationEvidence.some((v) => !relativePath(v)))) errors.push('关闭Bug须保留项目内复测证据路径：' + record.id);
    if (typeof record.blocking !== 'boolean' || !Number.isSafeInteger(record.context?.boardRevision) || !isText(record.context?.baselineId) || !record.context?.sourceHashes) errors.push('反馈上下文或阻断标记无效：' + record.id);
  }
  return errors;
}

export function calculateProgress(board, feedback = { records: [] }) {
  const confirmedStates = ['confirmed', 'fixing', 'retest'];
  const blockers = (feedback.records || []).filter((r) => r.type === 'bug' && r.blocking === true && r.state !== 'closed'
    && (confirmedStates.includes(r.state) || (r.history || []).some((h) => confirmedStates.includes(h.state) || confirmedStates.includes(h.oldState))));
  const results = board.items.map((item) => {
    const applicable = blockers.filter((r) => !r.itemId || r.itemId === item.id);
    const denominator = item.checkpoints.reduce((n, p) => n + p.weight, 0);
    const implemented = item.checkpoints.reduce((n, p) => n + (p.implemented && p.evidence.length ? p.weight : 0), 0);
    const accepted = item.checkpoints.reduce((n, p) => {
      const gates = p.gates.filter((g) => g.status !== 'not-applicable');
      const exempt = board.baseline?.exemptions?.[item.id + '/' + p.id];
      const passed = gates.length ? gates.every((g) => g.status === 'passed' && g.evidence.length) : isText(exempt);
      return n + (p.implemented && p.evidence.length && passed && !applicable.length ? p.weight : 0);
    }, 0);
    return { id: item.id, module: item.module, weight: item.weight, scope: item.scope, implemented: implemented / denominator, accepted: accepted / denominator, checkpointWeight: denominator, implementedWeight: implemented, acceptedWeight: accepted, blockers: applicable.map((r) => r.id) };
  });
  function aggregate(items) {
    const denominator = items.reduce((n, x) => n + x.weight, 0);
    const implemented = items.reduce((n, x) => n + x.weight * x.implemented, 0);
    const accepted = items.reduce((n, x) => n + x.weight * x.accepted, 0);
    const ready = board.baseline.confirmed && denominator > 0;
    return { denominator, implementedWeight: implemented, acceptedWeight: accepted, implemented: ready ? implemented / denominator : null, accepted: ready ? accepted / denominator : null, count: items.length };
  }
  const current = results.filter((x) => x.scope === 'current');
  const modules = [...new Set(current.map((x) => x.module))].map((name) => ({ name, ...aggregate(current.filter((x) => x.module === name)) }));
  const gates = gateKinds.map((kind) => {
    const entries = board.items.filter((i) => i.scope === 'current').flatMap((i) => i.checkpoints.flatMap((p) => p.gates.filter((g) => g.kind === kind && g.status !== 'not-applicable')));
    return { kind, total: entries.length, passed: entries.filter((g) => g.status === 'passed').length, failed: entries.filter((g) => g.status === 'failed').length };
  });
  return { ...aggregate(current), modules, items: results, gates, blockers, parked: results.length - current.length };
}

export function formatPercent(rate) {
  if (rate === null || !Number.isFinite(rate)) return '—';
  const value = rate >= 1 ? 100 : Math.floor(Math.max(0, rate) * 1000 + 1e-9) / 10;
  return String(value) + '%';
}
