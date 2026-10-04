import { calculateProgress, formatPercent, validateBoard, validateFeedback, feedbackStates } from './progress-math.mjs';

const $ = (id) => document.getElementById(id);
const form = $('feedback-form');
const updateForm = $('update-form');
const gateNames = { automated: '自动检查', browser: '浏览器操作', 'real-host': '真实宿主', driver: '驾驶员验收' };
const gateStates = { pending: '待核对', passed: '已通过', failed: '未通过', 'not-applicable': '本轮不适用' };
const typeNames = { idea: '想法', bug: 'Bug', review: '审核' };
const stateNames = { new: '新记录', discussing: '讨论中', adopted: '已采纳', parked: '暂存', rejected: '不采纳', confirmed: '已确认', fixing: '修复中', retest: '待复测', closed: '已关闭', 'wont-fix': '本轮不修复', recorded: '已记录' };
let snapshot = null;
let draftBinding = null;
let updateBinding = null;
let activeFeedbackId = null;
let draftRestored = false;
function draftKey() { return 'tw-board-draft:' + snapshot.board.project.id; }
function rememberDraft() {
  if (!snapshot || !draftExists()) return;
  try { sessionStorage.setItem(draftKey(), JSON.stringify(addPayload())); }
  catch { message('save-message', '浏览器无法暂存草稿；当前输入仍保留，离开前可导出。', 'draft'); }
}
function forgetDraft() { try { sessionStorage.removeItem(draftKey()); } catch { /* Project file save is independent of browser draft storage. */ } }
function restoreDraft() {
  if (draftRestored || !snapshot) return;
  draftRestored = true;
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey()) || 'null');
    if (!draft || draftExists()) return;
    if (draft.itemId && ![...form.elements.itemId.options].some((o) => o.value === draft.itemId)) form.elements.itemId.add(new Option(draft.itemId + '（已不在当前范围）', draft.itemId));
    for (const name of ['type', 'priority', 'title', 'text', 'itemId']) if (typeof draft[name] === 'string') form.elements[name].value = draft[name];
    form.elements.blocking.checked = draft.blocking === true;
    $('blocking-label').hidden = draft.type !== 'bug';
    draftBinding = { expectedRevision: draft.expectedRevision, context: draft.context };
    message('save-message', '已恢复此标签页的待提交草稿；浏览器暂存不等于项目文件已保存。', 'draft');
  } catch { message('save-message', '浏览器暂存草稿无法恢复；请使用此前导出的草稿文件。', 'draft'); }
}
function node(tag, text, className = '') {
  const result = document.createElement(tag);
  if (text !== undefined && text !== null) result.textContent = text;
  if (className) result.className = className;
  return result;
}
function tag(text, type = '') { return node('span', text, 'tag ' + type); }
function message(id, text, type = '') { const target = $(id); target.textContent = text; target.className = type; }
function round(value) { return Number(value.toFixed(3)); }
function binding() { return { expectedRevision: snapshot.feedback.revision, context: structuredClone(snapshot.context) }; }
function draftExists() { return !!(form.elements.title.value.trim() || form.elements.text.value.trim()); }
function setMeter(target, rate) {
  target.firstElementChild.style.width = (rate === null ? 0 : Math.min(100, Math.max(0, rate * 100))) + '%';
  target.setAttribute('aria-valuemin', '0'); target.setAttribute('aria-valuemax', '100');
  target.setAttribute('aria-valuetext', formatPercent(rate));
  if (rate === null) target.removeAttribute('aria-valuenow');
  else target.setAttribute('aria-valuenow', String(Math.floor(rate * 1000) / 10));
}
function miniRow(label, rate, sand = false) {
  const row = node('div', null, 'mini-row'); row.append(node('span', label));
  const meter = node('div', null, 'meter' + (sand ? ' sand' : '')); meter.append(node('span'));
  setMeter(meter, rate); row.append(meter, node('b', formatPercent(rate))); return row;
}
function itemRate(result, kind) { return snapshot.board.baseline.confirmed && !snapshot.evidenceError && !snapshot.authorityError ? result[kind] : null; }
function fillOptions(select, entries, emptyText) {
  const old = select.value;
  select.replaceChildren(new Option(emptyText, ''));
  for (const [value, text] of entries) select.add(new Option(text, value));
  if (old && !entries.some(([value]) => value === old)) select.add(new Option(old + '（已不在当前范围）', old));
  select.value = old;
}
function render() {
  const { board, feedback, progress } = snapshot;
  document.title = board.project.title + ' · 项目进度画板';
  $('project-title').textContent = board.project.title;
  $('project-meta').textContent = board.project.version + ' · ' + board.baseline.label + ' · 画板 v' + board.revision + ' / 反馈 v' + feedback.revision;
  $('connection').textContent = snapshot.writable ? '本地文件 · 可保存' : '静态记录 · 只读';
  $('connection').className = 'pill' + (snapshot.writable && !snapshot.stale && !snapshot.evidenceError && !snapshot.authorityError ? ' good' : '');
  const warnings = [];
  if (snapshot.stale) warnings.push(snapshot.authorityError ? '来源文件已变化，请核对同步差异。' : '来源文件已变化。当前百分比是上次核对的记录，请审查改动后同步画板。');
  if (snapshot.evidenceError) warnings.push('证据文件检查失败，暂停显示有效百分比：' + snapshot.evidenceError);
  if (snapshot.authorityError) warnings.push('项目文档同步待处理，暂停显示有效百分比：' + snapshot.authorityError);
  if (!snapshot.writable) warnings.push('当前是静态记录，文件存在与哈希尚未由本地服务核对；下列为记录值。填写内容只作为草稿，导出不等于保存到项目。');
  $('source-warning').hidden = !warnings.length; $('source-warning').textContent = warnings.join(' ');
  $('handoff').hidden = !board.authority;
  if (board.authority) {
    const { handoff, designRevision, nextRevision } = board.authority;
    const suffix = snapshot.stale || snapshot.authorityError ? '（上次同步记录）' : '';
    $('current-step').textContent = '当前步骤：' + handoff.currentStep + suffix;
    $('next-gate').textContent = '下一道门：' + handoff.nextGate + suffix;
    $('open-risks').replaceChildren(...(handoff.openRisks.length ? handoff.openRisks.map((risk) => node('li', risk)) : [node('li', 'NEXT 未记录开放风险')]));
    $('feedback-refs').textContent = 'NEXT 已关联反馈：' + (handoff.feedbackRefs.map((id) => { const r = feedback.records.find((x) => x.id === id); return r ? r.title + '（' + stateNames[r.state] + '）' : id + '（记录缺失）'; }).join('；') || '无');
    $('authority-versions').textContent = '总设计案 v' + designRevision + ' · NEXT 状态 v' + nextRevision + ' · 修改项目文档后，由 Agent 核对同步差异并更新画板。';
  }
  $('implemented-value').textContent = formatPercent(progress.implemented);
  $('accepted-value').textContent = formatPercent(progress.accepted);
  setMeter($('implemented-bar'), progress.implemented); setMeter($('accepted-bar'), progress.accepted);
  const basis = board.baseline.confirmed ? (progress.count ? '本轮 ' + progress.count + ' 项 · 等值权重 ' : '暂无当前范围事项 · 等值权重 ') : '目标范围待确认 · 等值权重 ';
  $('implemented-detail').textContent = basis + round(progress.implementedWeight) + ' / ' + round(progress.denominator) + (snapshot.stale ? ' · 旧记录' : '');
  $('accepted-detail').textContent = '通过权重 ' + round(progress.acceptedWeight) + ' / ' + round(progress.denominator) + ' · ' + progress.blockers.length + ' 条已确认阻断 Bug' + (snapshot.stale ? ' · 旧记录' : '');
  renderCalculation();
  $('modules').replaceChildren();
  for (const module of progress.modules) {
    const card = node('article', null, 'module-card');
    const title = node('div', null, 'module-title'); title.append(node('span', module.name), node('span', module.count + ' 项', 'muted'));
    card.append(title, miniRow('实现', module.implemented), miniRow('验收', module.accepted, true)); $('modules').append(card);
  }
  if (!progress.modules.length) $('modules').append(node('p', '尚无已纳入范围的模块。', 'empty'));
  $('gates').replaceChildren();
  for (const gate of progress.gates) $('gates').append(tag(gateNames[gate.kind] + ' · ' + gate.passed + '/' + gate.total + (gate.failed ? ' · ' + gate.failed + ' 项未通过' : '') + (gate.total ? '' : '（未声明）'), gate.failed ? 'bad' : ''));
  $('gates').append(node('span', '门数为已记录结果；阻断 Bug 的复测缺口计入验收进度。', 'muted'));
  fillOptions($('module-filter'), [...new Set(board.items.map((i) => i.module))].map((name) => [name, name]), '全部模块');
  fillOptions($('related-item'), board.items.map((i) => [i.id, i.title + (i.scope === 'parked' ? '（暂存）' : '')]), '项目整体');
  $('feedback-meta').textContent = feedback.records.length + ' 条记录 · 保存位置 progress/feedback.json';
  $('write-mode').textContent = snapshot.writable ? '保存后会写入项目文件并回读。新想法不自动进入计划，审核记录不自动更改验收门。' : '只读预览：可填写并导出待提交草稿。启动项目的本地画板服务后才能落盘。';
  $('save-feedback').disabled = !snapshot.writable;
  $('update-save').disabled = !snapshot.writable;
  renderItems(); renderFeedback();
}
function renderCalculation() {
  const { board, progress } = snapshot;
  const body = $('calculation-body'); body.replaceChildren();
  body.append(node('p', '当前基线：' + board.baseline.id + ' · ' + (board.baseline.confirmed ? '已确认' : '待确认') + '；依据：' + (board.baseline.reference || '尚未提供')));
  body.append(node('p', '权重默认 1，用于描述工作量；P0/P1/P2 只决定处理顺序。暂存 ' + progress.parked + ' 项及未采纳想法不进入分母。'));
  body.append(node('p', '事项比例 = 已完成检查点权重 ÷ 该项全部检查点权重；总体比例 = Σ（事项权重 × 事项比例）÷ 本轮事项总权重。模块使用相同算法。', 'formula'));
  const list = node('ul');
  for (const item of snapshot.board.items.filter((i) => i.scope === 'current')) {
    const result = progress.items.find((r) => r.id === item.id);
    list.append(node('li', item.title + '：事项权重 ' + item.weight + '，实现检查点 ' + round(result.implementedWeight) + '/' + round(result.checkpointWeight) + '，验收检查点 ' + round(result.acceptedWeight) + '/' + round(result.checkpointWeight)));
  }
  body.append(list, node('p', '来源文件（最后核对：' + (board.updatedAt || '未记载') + '）'));
  for (const source of board.sources) {
    const stale = snapshot.staleSources?.find((s) => s.id === source.id);
    body.append(node('p', source.id + ' · ' + source.path + ' · SHA-256 ' + source.sha256 + (stale ? ' · 已变化' + (stale.error ? '：' + stale.error : '') : ''), 'source-path'));
  }
  body.append(node('p', '变更分母需要登记新基线并保留历史。100% 只描述这里列出的范围；没有声明的真实宿主或驾驶员门仍需按项目流程核对。'));
}
function itemColumn(item, result) {
  if (item.scope === 'parked') return 'parked';
  if (result.implemented === 1 && (snapshot.evidenceError || snapshot.authorityError || snapshot.stale || !snapshot.writable)) return 'verify';
  if (result.implemented === 1) return result.accepted === 1 ? 'implemented' : 'verify';
  return 'todo';
}
function renderItems() {
  if (!snapshot) return;
  const query = $('search').value.trim().toLocaleLowerCase(); const module = $('module-filter').value;
  const items = snapshot.board.items.filter((i) => (!module || i.module === module) && (!query || (i.title + i.summary + i.module).toLocaleLowerCase().includes(query)));
  const columns = $('columns'); columns.replaceChildren();
  for (const [key, name] of [['implemented', '已实现 · 门已通过'], ['verify', '已实现 · 待实测'], ['todo', '待完成'], ['parked', '暂存']]) {
    const values = items.filter((i) => itemColumn(i, snapshot.progress.items.find((r) => r.id === i.id)) === key);
    const column = node('div', null, 'column'); const header = node('div', null, 'column-heading'); header.append(node('span', name), node('span', values.length, 'column-count')); column.append(header);
    for (const item of values) {
      const result = snapshot.progress.items.find((r) => r.id === item.id);
      const card = node('button', null, 'item-card'); card.type = 'button'; card.dataset.itemId = item.id;
      const top = node('div', null, 'card-top'); top.append(tag(item.module));
      if (item.activity === 'doing' && result.implemented < 1) top.append(tag('进行中', 'good'));
      if (item.activity === 'blocked' || result.blockers.length) top.append(tag('有阻断', 'bad'));
      if (key === 'implemented') top.append(tag('门已通过', 'good'));
      card.append(top, node('h3', item.title), node('p', item.summary));
      card.append(miniRow('实现', itemRate(result, 'implemented')), miniRow('验收', itemRate(result, 'accepted'), true), node('div', '权重 ' + item.weight + ' · ' + item.checkpoints.length + ' 个检查点 · 查看详情', 'card-meta'));
      card.addEventListener('click', () => showItem(item, result)); column.append(card);
    }
    if (!values.length) column.append(node('p', '暂无事项', 'empty'));
    columns.append(column);
  }
}
function showItem(item, result) {
  $('item-dialog-title').textContent = item.title;
  const body = $('item-dialog-body'); body.replaceChildren(node('p', item.summary), node('p', '模块 ' + item.module + ' · 范围 ' + (item.scope === 'current' ? '本轮' : '暂存') + ' · 事项权重 ' + item.weight, 'muted'));
  if (result.blockers.length) body.append(node('p', '待复测的阻断 Bug：' + result.blockers.join('、'), 'error'));
  for (const point of item.checkpoints) {
    const section = node('article', null, 'checkpoint'); section.append(node('h3', point.title), tag(point.implemented ? '已实现' : '待实现', point.implemented ? 'good' : ''), tag('权重 ' + point.weight));
    section.append(node('p', '实现证据：' + (point.evidence.join('、') || '尚未提供'), 'source-path'));
    for (const gate of point.gates) {
      section.append(tag(gateNames[gate.kind] + ' · ' + gateStates[gate.status], gate.status === 'failed' ? 'bad' : gate.status === 'passed' ? 'good' : ''));
      if (gate.evidence.length) section.append(node('p', '对应证据：' + gate.evidence.join('、'), 'source-path'));
      if (gate.reason) section.append(node('p', '原因：' + gate.reason));
      if (gate.confirmationRef) section.append(node('p', '确认依据：' + gate.confirmationRef));
    }
    if (!point.gates.length) section.append(node('p', '本检查点未声明适用验收门；只有基线记载明确免除依据时才计入验收。'));
    body.append(section);
  }
  $('item-dialog').showModal();
}
function renderFeedback() {
  if (!snapshot) return;
  const filter = $('feedback-filter').value; const target = $('feedback-list'); target.replaceChildren();
  const records = snapshot.feedback.records.filter((r) => !filter || r.type === filter).toReversed();
  for (const record of records) {
    const isBlocker = snapshot.progress.blockers.some((r) => r.id === record.id);
    const card = node('article', null, 'feedback-card' + (isBlocker ? ' blocker' : ''));
    const top = node('div', null, 'card-top'); top.append(tag(typeNames[record.type]), tag(stateNames[record.state]), tag(record.priority));
    if (isBlocker) top.append(tag('阻断验收 · 待复测', 'bad'));
    else if (record.type === 'bug' && record.blocking && record.state === 'new') top.append(tag('建议阻断 · 待确认', 'warn'));
    const item = snapshot.board.items.find((i) => i.id === record.itemId);
    card.append(top, node('h3', record.title), node('p', record.text), node('div', '关联：' + (item?.title || record.itemId || '项目整体') + ' · ' + new Date(record.updatedAt).toLocaleString('zh-CN'), 'card-meta'));
    const button = node('button', '查看 / 处理', 'secondary'); button.type = 'button'; button.addEventListener('click', () => showFeedback(record)); card.append(button); target.append(card);
  }
  if (!records.length) target.append(node('p', '暂无记录。随手记下的想法会保留在这里，采纳后再纳入项目范围。', 'empty'));
}
function showFeedback(record) {
  activeFeedbackId = record.id; updateBinding = binding(); updateForm.reset();
  $('feedback-dialog-title').textContent = record.title;
  $('feedback-original').textContent = '当前记录：\n' + record.text + '\n\n提交时：画板 v' + record.context.boardRevision + ' · 基线 ' + record.context.baselineId;
  updateForm.elements.state.replaceChildren(...feedbackStates[record.type].map((state) => new Option(stateNames[state], state)));
  updateForm.elements.state.value = record.state;
  updateForm.elements.blocking.checked = record.blocking;
  updateForm.elements.resolution.value = record.resolution || '';
  updateForm.elements.verification.value = record.verification || '';
  updateForm.elements.verificationEvidence.value = (record.verificationEvidence || []).join('\n');
  $('update-blocking-label').hidden = record.type !== 'bug'; $('bug-resolution-fields').hidden = record.type !== 'bug';
  $('feedback-history').textContent = JSON.stringify(record.history, null, 2);
  message('update-message', '记录处理意见不会自动更新计划或验收门。'); $('rebase-update').hidden = true;
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey() + ':' + record.id) || 'null');
    if (draft) {
      updateForm.elements.state.value = draft.state;
      updateForm.elements.reason.value = draft.reason;
      for (const name of ['resolution', 'verification']) updateForm.elements[name].value = draft.patch?.[name] || '';
      updateForm.elements.blocking.checked = draft.patch?.blocking === true;
      updateForm.elements.verificationEvidence.value = (draft.patch?.verificationEvidence || []).join('\n');
      updateBinding = { expectedRevision: draft.expectedRevision, context: draft.context };
      $('rebase-update').hidden = JSON.stringify(updateBinding) === JSON.stringify(binding());
      message('update-message', '已恢复待提交的处理草稿；浏览器暂存尚未写入项目。版本有变化时，先比较当前记录再提交。', 'draft');
    }
  } catch { message('update-message', '处理草稿无法恢复；可使用此前导出的草稿。', 'draft'); }
  $('feedback-dialog').showModal();
}
async function readSnapshot() {
  let apiError = null;
  try {
    const response = await fetch('./api/board', { cache: 'no-store' });
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) return await response.json();
    if (response.headers.get('content-type')?.includes('application/json')) apiError = new Error((await response.json()).error || '本地服务无法核对画板');
  } catch { /* A static preview can still read exported files; it cannot claim file verification. */ }
  if (apiError) throw apiError;
  const [boardResponse, feedbackResponse] = await Promise.all([fetch('./progress.json', { cache: 'no-store' }), fetch('./feedback.json', { cache: 'no-store' })]);
  if (!boardResponse.ok || !feedbackResponse.ok) throw new Error('无法读取项目画板文件。');
  const board = await boardResponse.json(); const feedback = await feedbackResponse.json();
  const errors = [...validateBoard(board), ...validateFeedback(feedback)];
  if (errors.length) throw new Error(errors.join('；'));
  return { board, feedback, context: { boardRevision: board.revision, baselineId: board.baseline.id, sourceHashes: Object.fromEntries(board.sources.map((s) => [s.id, s.sha256])) }, progress: calculateProgress(board, feedback), stale: false, staleSources: [], evidenceError: null, writable: false };
}
async function load() {
  $('reload').disabled = true;
  try {
    snapshot = await readSnapshot(); render(); restoreDraft();
    if (draftExists() && draftBinding && JSON.stringify(draftBinding) !== JSON.stringify(binding())) {
      message('save-message', '草稿保留；当前为反馈 v' + snapshot.feedback.revision + ' / 画板 v' + snapshot.board.revision + '。请比较新记录与当前范围，再选择使用当前版本。', 'draft'); $('rebase-draft').hidden = false;
    }
    if (activeFeedbackId && $('feedback-dialog').open && updateBinding && JSON.stringify(updateBinding) !== JSON.stringify(binding())) {
      const current = snapshot.feedback.records.find((r) => r.id === activeFeedbackId);
      $('feedback-original').textContent = '重读后的当前记录：\n' + (current?.text || '记录已不在当前文件') + '\n状态：' + (stateNames[current?.state] || '未知');
      message('update-message', '处理草稿保留；请比较重读后的记录，再选择使用当前版本。', 'draft'); $('rebase-update').hidden = false;
    }
    message('load-message', '已读取 · ' + new Date().toLocaleTimeString('zh-CN') + (snapshot.stale ? ' · 来源待重新核对' : ''));
    return true;
  } catch (error) {
    snapshot = null;
    for (const id of ['implemented-value', 'accepted-value']) $(id).textContent = '—';
    setMeter($('implemented-bar'), null); setMeter($('accepted-bar'), null);
    for (const id of ['modules', 'gates', 'columns', 'feedback-list', 'calculation-body']) $(id).replaceChildren();
    $('save-feedback').disabled = true; $('update-save').disabled = true;
    $('connection').textContent = '读取失败'; $('connection').className = 'pill';
    message('load-message', error.message + '；请检查服务和文件。尚未提交的输入保留在当前页面。', 'error');
    return false;
  } finally { $('reload').disabled = false; }
}
function download(name, data, type = 'application/json') {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n'], { type });
  const url = URL.createObjectURL(blob); const anchor = node('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function addPayload() {
  if (!snapshot) throw new Error('尚未读取当前项目');
  draftBinding ||= binding();
  return { operation: 'add', ...draftBinding, type: form.elements.type.value, priority: form.elements.priority.value, title: form.elements.title.value.trim(), text: form.elements.text.value, itemId: form.elements.itemId.value || null, blocking: form.elements.type.value === 'bug' && form.elements.blocking.checked };
}
function updatePayload() {
  const record = snapshot?.feedback.records.find((r) => r.id === activeFeedbackId);
  if (!record || !updateBinding) throw new Error('请先读取需要处理的记录');
  const patch = record.type === 'bug' ? { blocking: updateForm.elements.blocking.checked, resolution: updateForm.elements.resolution.value, verification: updateForm.elements.verification.value, verificationEvidence: updateForm.elements.verificationEvidence.value.split(/\r?\n/u).map((s) => s.trim()).filter(Boolean) } : {};
  return { operation: 'update', ...updateBinding, id: activeFeedbackId, state: updateForm.elements.state.value, reason: updateForm.elements.reason.value, patch };
}
async function save(payload, messageId) {
  if (!snapshot?.writable) throw new Error('当前没有写入通道；请导出待提交草稿');
  const response = await fetch('./api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-TW-Board': 'feedback-v1' }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok || result.saved !== true) {
    if (response.status === 409) await load();
    throw new Error(result.error || '保存失败；草稿保留');
  }
  message(messageId, '已写入并回读 progress/feedback.json · 反馈 v' + result.revision + ' · ' + result.id, 'success');
  return result;
}
form.addEventListener('input', () => { if (snapshot && !draftBinding) draftBinding = binding(); rememberDraft(); });
form.addEventListener('change', rememberDraft);
form.elements.type.addEventListener('change', () => { $('blocking-label').hidden = form.elements.type.value !== 'bug'; });
form.addEventListener('submit', async (event) => {
  event.preventDefault(); $('save-feedback').disabled = true;
  try {
    const receipt = await save(addPayload(), 'save-message'); forgetDraft(); form.reset(); $('blocking-label').hidden = true; draftBinding = null; $('rebase-draft').hidden = true;
    const loaded = await load();
    if (!loaded) message('save-message', '反馈 v' + receipt.revision + ' 已写入并回读。随后刷新失败，请重新读取；无需重复提交这一条。', 'draft');
  }
  catch (error) { message('save-message', error.message + '；草稿保留。', 'error'); }
  finally { $('save-feedback').disabled = !snapshot?.writable; }
});
updateForm.addEventListener('submit', async (event) => {
  event.preventDefault(); $('update-save').disabled = true;
  try {
    const receipt = await save(updatePayload(), 'update-message');
    try { sessionStorage.removeItem(draftKey() + ':' + activeFeedbackId); } catch { /* Readback remains the authoritative save receipt. */ }
    updateBinding = null; activeFeedbackId = null;
    const loaded = await load();
    if (loaded) { $('feedback-dialog').close(); message('load-message', '处理记录已写入并回读 · 反馈 v' + receipt.revision + ' · ' + receipt.id, 'success'); }
    else message('update-message', '处理记录 v' + receipt.revision + ' 已写入并回读，但刷新失败。请重新读取；无需重复提交。', 'draft');
  }
  catch (error) { message('update-message', error.message + '；处理草稿保留。', 'error'); }
  finally { $('update-save').disabled = !snapshot?.writable; }
});
function rememberUpdateDraft() {
  if (!snapshot || !activeFeedbackId) return;
  try { sessionStorage.setItem(draftKey() + ':' + activeFeedbackId, JSON.stringify(updatePayload())); }
  catch { message('update-message', '浏览器无法暂存处理草稿；当前输入仍保留，离开前可导出。', 'draft'); }
}
updateForm.addEventListener('input', rememberUpdateDraft);
updateForm.addEventListener('change', rememberUpdateDraft);
$('rebase-draft').addEventListener('click', () => { if (snapshot) { draftBinding = binding(); rememberDraft(); $('rebase-draft').hidden = true; message('save-message', '草稿现绑定当前范围与反馈 v' + snapshot.feedback.revision + '，再次保存时仍会检查冲突。', 'draft'); } });
$('rebase-update').addEventListener('click', () => { if (snapshot) { updateBinding = binding(); rememberUpdateDraft(); $('rebase-update').hidden = true; message('update-message', '处理草稿现绑定当前版本，请保存以提交。', 'draft'); } });
$('export-draft').addEventListener('click', () => { try { download('feedback-draft.json', addPayload()); message('save-message', '已发起草稿下载，请核对浏览器下载文件；项目反馈文件没有因此改变。', 'draft'); } catch (error) { message('save-message', error.message, 'error'); } });
$('export-update-draft').addEventListener('click', () => { try { download('feedback-update-draft.json', updatePayload()); message('update-message', '已发起处理草稿下载，请核对浏览器下载文件；项目反馈文件没有因此改变。', 'draft'); } catch (error) { message('update-message', error.message, 'error'); } });
$('reload').addEventListener('click', load); $('search').addEventListener('input', renderItems); $('module-filter').addEventListener('change', renderItems); $('feedback-filter').addEventListener('change', renderFeedback);
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => $(button.dataset.close).close());
$('export-json').addEventListener('click', () => { if (snapshot) { download('project-board-record.json', snapshot); message('load-message', '已发起画板记录下载，请核对浏览器下载文件；未改变项目文件。'); } });
$('export-md').addEventListener('click', async () => {
  if (!snapshot) return;
  try {
    let content;
    if (snapshot.writable) {
      const response = await fetch('./api/export', { cache: 'no-store' }); if (!response.ok) throw new Error('导出服务失败'); content = await response.text();
    } else {
      content = '# ' + snapshot.board.project.title + ' · 静态画板记录\n\n文件存在与来源哈希未复核。\n\n实现 ' + formatPercent(snapshot.progress.implemented) + '；验收 ' + formatPercent(snapshot.progress.accepted) + '\n\n';
      for (const item of snapshot.board.items) content += '## ' + item.title + '\n\n' + item.summary + '\n\n' + item.checkpoints.map((p) => '- [' + (p.implemented ? 'x' : ' ') + '] ' + p.title + ' · ' + p.evidence.join('、') + ' · ' + p.gates.map((g) => gateNames[g.kind] + '：' + gateStates[g.status]).join('、')).join('\n') + '\n\n';
      for (const record of snapshot.feedback.records) content += '## ' + typeNames[record.type] + '：' + record.title + '\n\n' + record.text + '\n\n状态：' + stateNames[record.state] + '\n\n';
    }
    download('project-board.md', content, 'text/markdown'); message('load-message', '已发起 Markdown 下载，请核对浏览器下载文件；未改变项目文件。');
  } catch (error) { message('load-message', error.message, 'error'); }
});
await load();
