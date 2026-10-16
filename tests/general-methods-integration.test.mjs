import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const promptPath = 'skills/orchestrate-project-blueprint/references/prompt-spec-contract.md';
const mechanicsPath = 'skills/tavern-card-builder/references/world-mechanics-and-scenarios.md';
const communicationPath = 'skills/consult-tavernweave-library/references/communication-and-guidance.md';

function fixture(relative, marker) {
  const body = read(relative).split(`<!-- ${marker}:begin -->`)[1]?.split(`<!-- ${marker}:end -->`)[0];
  assert.ok(body, `Missing bounded fixture: ${marker}`);
  const json = body.match(/```json\s*\n([\s\S]*?)\n```/);
  assert.ok(json, `Missing JSON data: ${marker}`);
  return JSON.parse(json[1]);
}

const prompt = fixture(promptPath, 'tw-prompt-contract-fixture');
const world = fixture(mechanicsPath, 'tw-world-mechanics-fixture');

// Test-only oracles for the original teaching data. No preset, template or card
// script is evaluated; these do not implement a production runtime or test an LLM.
function validatePromptResult(input, output) {
  assert.ok(Array.isArray(input));
  assert.equal(new Set(input.map(row => row.id)).size, input.length);
  for (const row of input) {
    assert.equal(typeof row.id, 'string');
    assert.ok(row.id.length > 0);
    assert.ok(['open', 'closed', 'unknown'].includes(row.status));
    assert.ok(row.minutes === null || (Number.isFinite(row.minutes) && row.minutes >= 0));
  }
  assert.deepEqual(Object.keys(output).sort(), ['choice', 'routes']);
  assert.equal(output.choice, null);
  assert.ok(Array.isArray(output.routes));
  assert.equal(output.routes.length, input.length);
  for (let i = 0; i < input.length; i += 1) {
    assert.deepEqual(Object.keys(output.routes[i]).sort(), ['id', 'minutes', 'status']);
    for (const key of ['id', 'status', 'minutes']) assert.equal(output.routes[i][key], input[i][key]);
  }
}

function validateWorld(data) {
  const all = [...data.locations, ...data.edges, ...data.events];
  assert.equal(new Set(all.map(row => row.id)).size, all.length);
  assert.ok(all.every(row => /^(loc|edge|event)-[a-z-]+$/.test(row.id)));
  const locations = new Set(data.locations.map(row => row.id));
  const events = new Set(data.events.map(row => row.id));
  for (const edge of data.edges) {
    assert.ok(locations.has(edge.from) && locations.has(edge.to));
    assert.ok([null, 'low', 'high'].includes(edge.tide));
    assert.ok(Number.isFinite(edge.minutes) && edge.minutes >= 0);
    assert.ok(Number.isInteger(edge.tickets) && edge.tickets >= 0);
  }
  for (const event of data.events) {
    assert.ok(event.location === null || locations.has(event.location));
    assert.ok(event.successors.every(id => events.has(id)));
    assert.ok(typeof event.trigger === 'string' && event.trigger.length > 0);
  }
  assert.ok(locations.has(data.initial.location));
}

function settleEdge(before, edgeId, data = world) {
  const state = structuredClone(before);
  const edge = data.edges.find(row => row.id === edgeId);
  if (!edge) return { status: 'invalid', state };
  if (!Number.isInteger(state.tickets) || state.tickets < 0 || !Number.isFinite(state.minutes)
    || state.minutes < 0 || !Array.isArray(state.blocked) || ![null, 'low', 'high'].includes(state.tide)) {
    return { status: 'invalid', state };
  }
  if (edge.from !== state.location || state.blocked.includes(edge.id)) return { status: 'blocked', state };
  if (edge.tide !== null && state.tide === null) return { status: 'unknown', state };
  if ((edge.tide !== null && edge.tide !== state.tide) || state.tickets < edge.tickets) {
    return { status: 'blocked', state };
  }
  return {
    status: 'ok',
    state: { ...state, location: edge.to, minutes: state.minutes + edge.minutes, tickets: state.tickets - edge.tickets },
  };
}

test('source samples and unseen inputs satisfy the stated output contract', () => {
  assert.ok(prompt.samples.length && prompt.unseen.length);
  const sampleIds = new Set(prompt.samples.flatMap(row => row.input.map(item => item.id)));
  for (const entry of [...prompt.samples, ...prompt.unseen]) validatePromptResult(entry.input, entry.expected);
  for (const entry of prompt.unseen) {
    assert.ok(entry.input.every(item => !sampleIds.has(item.id)), 'Unseen inputs must not copy example route IDs');
  }
  const unseen = prompt.unseen.find(row => row.id === 'unseen-unknown-zero');
  assert.equal(unseen.expected.routes[0].status, 'unknown');
  assert.equal(unseen.expected.routes[0].minutes, null);
  assert.equal(unseen.expected.routes[1].minutes, 0);
  assert.deepEqual(prompt.unseen.find(row => row.id === 'unseen-empty').expected.routes, []);
});

test('output mutations expose changed facts, null/zero loss, scope and format failures', () => {
  const entry = prompt.unseen.find(row => row.id === 'unseen-unknown-zero');
  for (const mutate of [
    output => { output.routes[0].status = 'open'; },
    output => { output.routes[0].minutes = 0; },
    output => { output.routes[1].minutes = null; },
    output => { output.routes.pop(); },
    output => { output.routes[0].id = 'route-bridge'; },
    output => { output.choice = 'route-canal'; },
    output => { output.analysis = 'extra output'; },
    output => { output.routes[0].minutes = 'null'; },
  ]) {
    const bad = structuredClone(entry.expected);
    mutate(bad);
    assert.throws(() => validatePromptResult(entry.input, bad));
  }
  const wrongInput = structuredClone(entry.input);
  wrongInput[0].status = 'probably';
  assert.throws(() => validatePromptResult(wrongInput, entry.expected));
});

test('world fixture has stable unique IDs, valid directed references and nonnegative costs', () => {
  validateWorld(world);
  for (const mutate of [
    data => { data.locations[1].id = data.locations[0].id; },
    data => { data.edges[0].to = 'loc-missing'; },
    data => { data.events[0].successors.push('event-missing'); },
    data => { data.edges[0].minutes = -1; },
    data => { data.edges[0].tickets = -1; },
  ]) {
    const bad = structuredClone(world);
    mutate(bad);
    assert.throws(() => validateWorld(bad));
  }
});

test('high water closes the bridge; ferry consumes one ticket and cannot imply a return route', () => {
  const before = structuredClone(world.initial);
  assert.equal(settleEdge(before, 'edge-bridge-out').status, 'blocked');
  const crossed = settleEdge(before, 'edge-ferry-out');
  assert.equal(crossed.status, 'ok');
  assert.deepEqual(crossed.state, { ...before, location: 'loc-north', tickets: 0, minutes: 10 });
  assert.equal(settleEdge(crossed.state, 'edge-ferry-out').status, 'blocked');
  assert.equal(settleEdge(crossed.state, 'edge-ferry-back').status, 'invalid');
  assert.deepEqual(before, world.initial, 'Observation and reference settlement do not mutate their input');
});

test('no-ticket and unknown-water cases preserve state and permit independent alternatives', () => {
  const noTicket = { ...world.initial, tickets: 0 };
  assert.deepEqual(settleEdge(noTicket, 'edge-ferry-out'), { status: 'blocked', state: noTicket });
  assert.equal(settleEdge(noTicket, 'edge-ridge-up').status, 'ok');
  const unknown = { ...world.initial, tide: null };
  assert.deepEqual(settleEdge(unknown, 'edge-bridge-out'), { status: 'unknown', state: unknown });
  assert.equal(settleEdge(unknown, 'edge-ridge-up').status, 'ok');
  assert.deepEqual(settleEdge(unknown, 'edge-missing'), { status: 'invalid', state: unknown });
});

test('a temporary second-leg block retains the first leg and allows an independently valid return', () => {
  const first = settleEdge(world.initial, 'edge-ridge-up').state;
  const blocked = { ...first, blocked: ['edge-ridge-down'] };
  assert.deepEqual(settleEdge(blocked, 'edge-ridge-down'), { status: 'blocked', state: blocked });
  assert.equal(blocked.location, 'loc-ridge');
  assert.equal(blocked.minutes, 15);
  const back = settleEdge(blocked, 'edge-ridge-home');
  assert.equal(back.status, 'ok');
  assert.equal(back.state.location, 'loc-south');
  assert.equal(back.state.minutes, 30);
});

test('view coordinates, names and order do not change route or event identity', () => {
  const changed = structuredClone(world);
  changed.locations.reverse();
  for (const location of changed.locations) { location.name += '（新显示名）'; location.view = [99, 42]; }
  changed.events.reverse();
  changed.edges.reverse();
  validateWorld(changed);
  assert.deepEqual(settleEdge(world.initial, 'edge-ferry-out', changed), settleEdge(world.initial, 'edge-ferry-out'));
  assert.deepEqual(changed.events.find(row => row.id === 'event-route-choice'), world.events.find(row => row.id === 'event-route-choice'));
});

test('reading an optional event only yields a candidate and cannot settle movement', () => {
  const before = structuredClone(world.initial);
  const candidates = world.events.filter(row => row.location === before.location && row.trigger === 'inspect-routes');
  assert.deepEqual(candidates.map(row => row.id), ['event-route-choice']);
  assert.ok(!candidates.some(row => row.id === 'event-arrival'));
  assert.deepEqual(before, world.initial);
  assert.equal(settleEdge(before, 'edge-ferry-out').state.location, 'loc-north', 'Direct crossing does not require the optional ridge event');
});

test('approved CoT corrections retain noncombat checks and distinguish narrative from hidden reasoning', () => {
  const body = read('skills/tavern-card-builder/references/cot-design-and-authoring.md');
  assert.ok(body.includes('作者无法直接查看的模型内部推理'));
  assert.ok(body.includes('没有战斗就跳过战斗判断，交易、资源消耗等其他系统判断按实际需要保留'));
  assert.ok(body.includes('角色心理可按既定视角写入正文'));
  assert.ok(body.includes('按输出约定展示结算结果或简短依据'));
  assert.ok(body.includes('无论文风如何，都不展示模型的完整内部推理'));
  assert.ok(!body.includes('没有战斗就删除系统判断'));
  assert.ok(!body.includes('除非正文风格明确需要，不展示系统判断过程'));
});

test('shared clarification stays authoritative and blueprint uses its original decision states', () => {
  const shared = read(communicationPath);
  const blueprint = read('skills/orchestrate-project-blueprint/SKILL.md');
  const protocol = read('skills/orchestrate-project-blueprint/references/brainstorm-protocol.md');
  assert.equal((shared.match(/^## 主动厘清需求$/gm) || []).length, 1);
  assert.ok(blueprint.includes('communication-and-guidance.md#主动厘清需求'));
  assert.ok(protocol.includes('communication-and-guidance.md#主动厘清需求'));
  for (const state of ['confirmed', 'proposed', 'pending', 'rejected']) {
    assert.ok(protocol.includes(`\`${state}\``));
  }
  for (const distinction of ['目标', '限制', '手段', '低风险', '重大不确定', '沉默不构成许可']) assert.ok(shared.includes(distinction));
});

test('method links resolve locally and semantic/release examples remain present', () => {
  const files = [
    promptPath, mechanicsPath, communicationPath,
    'skills/orchestrate-project-blueprint/SKILL.md',
    'skills/orchestrate-project-blueprint/references/brainstorm-protocol.md',
    'skills/build-work-library/SKILL.md',
    'skills/build-work-library/references/data-and-commands.md',
    'skills/rewrite-natural-prose/references/editing-guide.md',
    'skills/tavern-card-builder/references/opening-strategies.md',
    'skills/tavern-card-builder/references/card-writing.md',
  ];
  for (const file of files) {
    for (const match of read(file).matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:\/\//i.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), target)), `${file}: broken link ${target}`);
    }
  }
  const prose = read('skills/rewrite-natural-prose/references/editing-guide.md');
  assert.ok(prose.includes('青岑吊桥通常在低水位开放；未核实水位前不得通行。'));
  assert.ok(prose.includes('Unsafe: “低水位即可过桥。”'));
  const release = read('skills/tavern-card-builder/references/card-writing.md');
  assert.ok(release.includes('Accurate titles and release descriptions'));
  assert.ok(release.includes('design preview instead of a playable release'));
  assert.ok(read(promptPath).includes('不声称模型已经通过'));
  assert.ok(read(mechanicsPath).includes('不是生产运行时'));
});

// Written conversation contracts for blueprint v3.4 §7, reviewed against the one
// shared clarification authority. These are authored candidate replies and plans,
// not captured model runs. Literal checks keep these particular reviewed examples
// intact; they do not assess arbitrary prose, prove LLM compliance or grant approval.
const clarificationCases = [
  {
    id: 'preserve-canon-while-shortening',
    history: ['用户：不改正典。原文：青岑吊桥通常在低水位开放；涨水时关闭，但持当日许可的救援队可以通过。'],
    user: '精简一下。',
    reply: '按不改正典来精简：青岑吊桥通常低水位开放；涨水时关闭，持当日许可的救援队除外。',
    plan: {
      goal: 'shorten-prose', hardConstraints: ['preserve-canon'], mode: 'continue', questions: [],
      next: ['return-reversible-prose-draft'], deferred: [],
      decisions: [{ id: 'canon', state: 'confirmed', origin: 'prior-user' }], authority: 'existing',
    },
    expected: {
      goal: 'shorten-prose', hardConstraints: ['preserve-canon'], mode: 'continue', questionPurposes: [],
      next: ['return-reversible-prose-draft'], deferred: [], decisions: { canon: 'confirmed' },
      replyFragments: ['通常', '涨水时关闭', '持当日许可的救援队除外'],
    },
    review: '沿用上文正典约束；改写同时保留通常、关闭条件和许可例外，无需重复采访。',
    negatives: [
      { reason: '删掉关键例外', mutate: c => { c.reply = '青岑吊桥通常低水位开放；涨水时关闭。'; } },
      { reason: '无必要长问卷阻塞可逆草稿', mutate: c => { c.plan.mode = 'wait'; c.plan.next = []; } },
    ],
  },
  {
    id: 'clarify-ambiguous-usefulness',
    history: ['用户：这是现有世界书，暂未说明加载或维护问题。'],
    user: '让世界书更好用。',
    reply: '你更想减少每轮无关加载，还是方便单独维护？也可以说其他目标。我先检查现有条目的职责与重复内容。',
    plan: {
      goal: 'unresolved', hardConstraints: [], mode: 'ask-and-continue',
      questions: [{ purpose: 'choose-primary-goal', options: ['reduce-unrelated-loading', 'improve-maintenance', 'other'] }],
      next: ['inspect-entry-responsibilities'], deferred: ['choose-split-merge-plan'],
      decisions: [{ id: 'primary-goal', state: 'pending', origin: 'unknown' }], authority: 'existing',
    },
    expected: {
      goal: 'unresolved', hardConstraints: [], mode: 'ask-and-continue', questionPurposes: ['choose-primary-goal'],
      next: ['inspect-entry-responsibilities'], deferred: ['choose-split-merge-plan'], decisions: { 'primary-goal': 'pending' },
      replyFragments: ['减少每轮无关加载', '方便单独维护', '其他目标', '先检查'],
    },
    review: '两种目标会改变拆合边界，因此先问；职责检查不依赖答案，可立即继续。',
    negatives: [
      { reason: '擅自认定更短就是更好', mutate: c => { c.plan.goal = 'minimize-tokens'; c.plan.questions = []; } },
      { reason: '空泛追问没有降低回答成本', mutate: c => { c.reply = '请详细说明需求。'; } },
    ],
  },
  {
    id: 'distinguish-template-means-from-goal',
    history: ['用户：希望减少规则漏载。目标环境及扩展版本尚未提供。'],
    user: '最好全部换成模板。',
    reply: '全部模板是硬要求，还是以减少漏载为准、实现方式可以比较？我先检查现有入口，并核验目标环境支持的模板能力，再给机制方案。',
    plan: {
      goal: 'reduce-missing-rules', hardConstraints: [], mode: 'ask-and-continue',
      questions: [{ purpose: 'is-template-a-hard-requirement', options: ['template-required', 'compare-methods'] }],
      next: ['inspect-existing-entrypoints', 'verify-runtime-capabilities'], deferred: ['choose-loading-mechanism'],
      decisions: [
        { id: 'goal', state: 'confirmed', origin: 'prior-user' },
        { id: 'all-template', state: 'pending', origin: 'unknown' },
      ], authority: 'existing',
    },
    expected: {
      goal: 'reduce-missing-rules', hardConstraints: [], mode: 'ask-and-continue', questionPurposes: ['is-template-a-hard-requirement'],
      next: ['inspect-existing-entrypoints', 'verify-runtime-capabilities'], deferred: ['choose-loading-mechanism'],
      decisions: { goal: 'confirmed', 'all-template': 'pending' },
      replyFragments: ['硬要求', '实现方式可以比较', '现有入口', '核验目标环境'],
    },
    review: '保留减少漏载目标；“最好”尚不足以判定强制手段，环境事实交核验，不请用户投票确认API。',
    negatives: [
      { reason: '直接安装扩展越过权限门', mutate: c => { c.plan.next.push('install-extension'); } },
      { reason: '把候选模板当作用户已批准', mutate: c => { c.plan.decisions[1] = { id: 'all-template', state: 'confirmed', origin: 'agent-assumption' }; } },
      { reason: '擅改纯原生目标方案', mutate: c => { c.plan.hardConstraints.push('native-only'); } },
    ],
  },
  {
    id: 'surface-native-template-conflict',
    history: ['用户：已确认只用原生。', '检查记录：当前新增方案使用模板读取状态；原生替代还未查清。'],
    user: '继续安排这个按状态选择资料的方案。',
    reply: '当前方案依赖模板，与你确认的只用原生冲突。继续保留原生并检查替代入口，还是另行允许评估模板方案？依赖模板的部分等你选择；现有原生入口我先继续核对。',
    plan: {
      goal: 'state-aware-loading', hardConstraints: ['native-only'], mode: 'ask-and-continue',
      questions: [{ purpose: 'resolve-mechanism-conflict', options: ['keep-native', 'authorize-template-evaluation'] }],
      next: ['inspect-native-alternatives'], deferred: ['adopt-template-dependent-plan'],
      decisions: [
        { id: 'native-only', state: 'confirmed', origin: 'prior-user' },
        { id: 'template-option', state: 'proposed', origin: 'agent' },
      ], authority: 'existing',
    },
    expected: {
      goal: 'state-aware-loading', hardConstraints: ['native-only'], mode: 'ask-and-continue', questionPurposes: ['resolve-mechanism-conflict'],
      next: ['inspect-native-alternatives'], deferred: ['adopt-template-dependent-plan'],
      decisions: { 'native-only': 'confirmed', 'template-option': 'proposed' },
      replyFragments: ['只用原生冲突', '继续保留原生', '另行允许评估模板', '等你选择'],
    },
    review: '冲突说明针对真实已有约束；提案不覆盖旧决定，等待的仅是依赖该选择的部分。',
    negatives: [
      { reason: '静默取消原生硬限制', mutate: c => { c.plan.hardConstraints = []; } },
      { reason: '默认假设代替授权', mutate: c => { c.plan.next.push('adopt-template-dependent-plan'); c.plan.deferred = []; } },
    ],
  },
  {
    id: 'respect-explicit-split-requirement',
    history: ['用户：主要为了让各项能单独维护。当前还没有证据说明拆分不可行。'],
    user: '所有条目都拆开是硬要求。',
    reply: '按全部拆开规划。需要共同判断的规则会标出依赖与加载入口，说明拆开增加的维护成本；如果核验发现依赖无法可靠到达，再把具体冲突交给你取舍。',
    plan: {
      goal: 'improve-maintenance', hardConstraints: ['split-all-entries'], mode: 'continue', questions: [],
      next: ['plan-separate-entry-responsibilities', 'map-required-dependencies'], deferred: [],
      decisions: [{ id: 'split-all', state: 'confirmed', origin: 'user' }], authority: 'existing',
    },
    expected: {
      goal: 'improve-maintenance', hardConstraints: ['split-all-entries'], mode: 'continue', questionPurposes: [],
      next: ['plan-separate-entry-responsibilities', 'map-required-dependencies'], deferred: [], decisions: { 'split-all': 'confirmed' },
      replyFragments: ['全部拆开', '依赖与加载入口', '维护成本', '具体冲突'],
    },
    review: '明确手段作为硬限制保留；尚无实际冲突时无需反复追问，先完成依赖规划。',
    negatives: [
      { reason: '用模型自认的真实目标否定用户手段', mutate: c => { c.plan.next = ['merge-tightly-coupled-entries']; } },
      { reason: '把硬要求降格为建议', mutate: c => { c.plan.decisions[0].state = 'proposed'; } },
    ],
  },
  {
    id: 'blueprint-only-does-not-authorize-writes',
    history: ['候选方案涉及删除旧条目、覆盖加载配置，并可能发布新版。'],
    user: '现在只要蓝图，不要执行。',
    reply: '先交付蓝图，列出拟删条目、配置差异和恢复办法。删除可能影响旧引用，覆盖会替换现有配置，发布会公开本版内容；实际操作前分别确认具体对象与范围。',
    plan: {
      goal: 'deliver-blueprint', hardConstraints: ['planning-only'], mode: 'continue', questions: [],
      next: ['draft-blueprint-in-chat'], deferred: ['delete-entries', 'overwrite-config', 'publish'],
      decisions: [{ id: 'execution-scope', state: 'confirmed', origin: 'user' }], authority: 'existing',
    },
    expected: {
      goal: 'deliver-blueprint', hardConstraints: ['planning-only'], mode: 'continue', questionPurposes: [],
      next: ['draft-blueprint-in-chat'], deferred: ['delete-entries', 'overwrite-config', 'publish'],
      decisions: { 'execution-scope': 'confirmed' },
      replyFragments: ['先交付蓝图', '旧引用', '替换现有配置', '公开本版内容', '实际操作前分别确认'],
    },
    review: '规划请求足以继续交付蓝图；没有写入权限，删除/覆盖/发布不能先做，也不把将来授权门当作当前阻塞。',
    negatives: [
      { reason: '主动执行删除', mutate: c => { c.plan.next.push('delete-entries'); } },
      { reason: '把沉默记作批准', mutate: c => { c.plan.decisions.push({ id: 'publish', state: 'confirmed', origin: 'silence' }); } },
    ],
  },
  {
    id: 'update-corrected-maintenance-goal',
    history: ['用户：正典和稳定ID都要保留。', '助手此前把减少token记为未确认提案，已检查过条目依赖。'],
    user: '我关心维护，不是减少 token。',
    reply: '目标改为方便维护。我会按职责清晰、修改时少牵连来调整拆合建议，沿用已查清的依赖、正典和稳定ID；原来的省token提案从当前目标移除。',
    plan: {
      goal: 'improve-maintenance', hardConstraints: ['preserve-canon', 'preserve-stable-ids'], mode: 'continue', questions: [],
      next: ['revise-maintenance-proposal', 'reuse-verified-dependencies'], deferred: [],
      decisions: [
        { id: 'primary-goal', state: 'confirmed', origin: 'user' },
        { id: 'minimize-tokens', state: 'rejected', origin: 'user' },
      ], authority: 'existing',
    },
    expected: {
      goal: 'improve-maintenance', hardConstraints: ['preserve-canon', 'preserve-stable-ids'], mode: 'continue', questionPurposes: [],
      next: ['revise-maintenance-proposal', 'reuse-verified-dependencies'], deferred: [],
      decisions: { 'primary-goal': 'confirmed', 'minimize-tokens': 'rejected' },
      replyFragments: ['方便维护', '调整拆合建议', '沿用已查清的依赖', '省token提案从当前目标移除'],
    },
    review: '用户纠正更新原决定和受影响方案；保留仍有效证据，不新建账本或要求重填全部问题。',
    negatives: [
      { reason: '坚持原目标', mutate: c => { c.plan.goal = 'minimize-tokens'; } },
      { reason: '另立平行需求账本', mutate: c => { c.plan.authority = 'new-parallel-ledger'; } },
    ],
  },
  {
    id: 'continue-with-reversible-format-default',
    history: ['任务仅在对话中整理文字，无机器解析或文件格式要求。'],
    user: '整理这两项加载风险：入口没命中，规则和例外被分开。',
    reply: '先用短列表整理，格式可以调整：\n- 入口没命中：检查实际扫描输入与入口条件。\n- 规则和例外被分开：检查判断时两者能否同时到达。',
    plan: {
      goal: 'summarize-loading-risks', hardConstraints: [], mode: 'continue', questions: [],
      next: ['return-short-list-draft'], deferred: [],
      decisions: [{ id: 'output-format', state: 'proposed', origin: 'agent-assumption' }], authority: 'existing',
    },
    expected: {
      goal: 'summarize-loading-risks', hardConstraints: [], mode: 'continue', questionPurposes: [],
      next: ['return-short-list-draft'], deferred: [], decisions: { 'output-format': 'proposed' },
      replyFragments: ['短列表', '格式可以调整', '入口没命中', '规则和例外被分开'],
    },
    review: '输出形式是可逆小缺口，直接提供可用草稿；默认格式保持暂定，不能冒称已获确认。',
    negatives: [
      { reason: '把无关格式选择变成阻塞', mutate: c => { c.plan.mode = 'wait'; c.plan.next = []; } },
      { reason: '把假设升格为用户决定', mutate: c => { c.plan.decisions[0].state = 'confirmed'; } },
    ],
  },
];

function validateClarificationCandidate(candidate, expected) {
  const { reply, plan } = candidate;
  assert.equal(typeof reply, 'string');
  for (const fragment of expected.replyFragments) assert.ok(reply.includes(fragment), `Missing reviewed distinction: ${fragment}`);
  for (const prohibited of ['<thinking>', '<!-- consider:', '有缺陷的表达者']) assert.ok(!reply.includes(prohibited));
  assert.equal(plan.goal, expected.goal);
  assert.equal(plan.mode, expected.mode);
  assert.equal(plan.authority, 'existing');
  assert.deepEqual([...plan.hardConstraints].sort(), [...expected.hardConstraints].sort());
  // Counts here belong to these concrete authored scenes, never to a universal questionnaire.
  assert.deepEqual(plan.questions.map(question => question.purpose), expected.questionPurposes);
  for (const question of plan.questions) assert.ok(question.options.length >= 2 && question.purpose.length > 0);
  assert.deepEqual([...plan.next].sort(), [...expected.next].sort());
  assert.deepEqual([...plan.deferred].sort(), [...expected.deferred].sort());
  assert.ok(plan.next.every(action => !plan.deferred.includes(action)));
  assert.deepEqual(Object.fromEntries(plan.decisions.map(decision => [decision.id, decision.state])), expected.decisions);
  assert.equal(new Set(plan.decisions.map(decision => decision.id)).size, plan.decisions.length);
  for (const decision of plan.decisions) {
    assert.ok(['confirmed', 'proposed', 'pending', 'rejected'].includes(decision.state));
    if (decision.state === 'confirmed') assert.ok(['user', 'prior-user'].includes(decision.origin));
  }
}

for (const scene of clarificationCases) {
  test(`written clarification contract: ${scene.id}`, () => {
    assert.ok(scene.history.length && scene.user && scene.review, 'Each case needs context, current request and a readable review');
    const candidate = { reply: scene.reply, plan: scene.plan };
    validateClarificationCandidate(candidate, scene.expected);
    for (const negative of scene.negatives) {
      const changed = structuredClone(candidate);
      negative.mutate(changed);
      assert.throws(() => validateClarificationCandidate(changed, scene.expected), negative.reason);
    }
    for (const prefix of ['<thinking>隐藏分析</thinking>', '用户是有缺陷的表达者。']) {
      const changed = structuredClone(candidate);
      changed.reply = prefix + changed.reply;
      assert.throws(() => validateClarificationCandidate(changed, scene.expected));
    }
  });
}
