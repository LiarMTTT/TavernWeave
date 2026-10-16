import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(root, 'skills/worldbook-design-and-writing');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const doc = (name) => fs.readFileSync(path.join(skill, name), 'utf8');
const fixture = JSON.parse(doc('assets/examples/design-cases.json'));

// This pure design oracle does not simulate host selection, EJS, reads or model behavior.
// It checks consistency of the self-authored expectations before an E07 runtime probe.
function bridgeDecision(sample) {
  if (!sample.reachable) return 'unreachable';
  if (sample.state.flooded === true) return 'closed';
  if (sample.state.flooded === false) return 'open';
  return 'unknown';
}

function selectEraContract(sample) {
  if (!fixture.era.validEras.includes(sample.currentEra)) return ['state.unknown'];
  const selected = [`current.${sample.currentEra}`];
  if (sample.comparisonAuthorized === true) {
    for (const era of sample.crossEraReferences ?? []) {
      if (fixture.era.validEras.includes(era) && era !== sample.currentEra) {
        selected.push(`reference.${era}`);
      }
    }
  }
  for (const alias of sample.entityAliases ?? []) {
    const resolved = Object.entries(fixture.era.entities).find(([, entry]) => entry.aliases.includes(alias));
    if (!resolved) continue;
    const [entityId, entry] = resolved;
    if (sample.presenceRequired && sample.presence?.[entityId] !== true) continue;
    selected.push(entry.contentId);
  }
  return [...new Set(selected)];
}

test('synthetic contract explicitly excludes runtime verification and import schemas', () => {
  assert.equal(fixture.kind, 'synthetic-design-contract');
  assert.equal(fixture.runtimeVerified, false);
  assert.match(fixture.note, /not a SillyTavern export/);
  assert.deepEqual(fixture.nativePolicy, {
    effectiveKeywordScanDepth: 2,
    activatedByRecursiveText: false,
    activatesFurtherEntries: false,
  });
});

test('E02 covers true, false, missing, invalid and unreachable without mutating state', () => {
  const examples = doc('references/examples.md');
  for (const sample of fixture.bridge.cases) {
    const before = structuredClone(sample);
    const decision = bridgeDecision(sample);
    assert.equal(decision, sample.expected, sample.id);
    if (decision === 'unreachable') {
      assert.equal(fixture.bridge.branches[decision], undefined);
    } else {
      // Conditional and controller candidates have the same selected body.
      const selected = fixture.bridge.branches[decision];
      assert.ok(selected.contentId && selected.body, sample.id);
      assert.ok(examples.includes(selected.contentId), selected.contentId);
      assert.ok(examples.includes(selected.body), selected.body);
      // Native sends its complete compact rule, so does not satisfy strict branch-only input.
      assert.ok(examples.includes(fixture.bridge.nativeBody));
      assert.notEqual(fixture.bridge.nativeBody, selected.body);
    }
    assert.deepEqual(sample, before, `${sample.id}: reader must not write state`);
  }
  assert.match(examples, /native candidate is insufficient/);
  assert.match(examples, /true, entry unreachable/);
  assert.match(examples, /false is a valid value/);
});

test('E04 honors committed state, scoped comparisons and entity identity/presence', () => {
  const planning = doc('references/planning-and-loading.md');
  for (const sample of fixture.era.cases) {
    const before = structuredClone(sample);
    assert.deepEqual(selectEraContract(sample), sample.expected, sample.id);
    assert.deepEqual(sample, before, `${sample.id}: routing must remain read-only`);
  }
  for (let i = 1; i <= 8; i += 1) assert.ok(planning.includes(`| R${i} |`));
  assert.match(planning, /authorized writer and\s+validated state update/);
  assert.match(planning, /negation does not prove presence/);
  assert.match(planning, /pending\/failed/);
});

test('semantic examples preserve negation, strength, uncertain knowledge and scope', () => {
  const writing = doc('references/writing-contracts.md');
  function checkBody(body, sample) {
    for (const required of sample.mustRetain) assert.ok(body.includes(required), `${sample.id}: ${required}`);
    for (const forbidden of sample.forbiddenAdditions) assert.ok(!body.includes(forbidden), `${sample.id}: ${forbidden}`);
  }
  for (const sample of fixture.semanticCases) {
    assert.ok(writing.includes(sample.body), sample.id);
    checkBody(sample.body, sample);
    // These mutations check this authored fixture, not arbitrary prose or model output.
    for (const required of sample.mustRetain) {
      assert.throws(() => checkBody(sample.body.replaceAll(required, ''), sample), `${sample.id}: lost ${required}`);
    }
    for (const forbidden of sample.forbiddenAdditions) {
      assert.throws(() => checkBody(`${sample.body}${forbidden}`, sample), `${sample.id}: added ${forbidden}`);
    }
  }
  assert.match(writing, /Undecided item/);
  assert.match(writing, /Free space/);
  assert.match(writing, /New core setting, gameplay goals and major plot changes are proposals/);
  assert.match(writing, /not universal\s+formats, minimum section counts or word-count quotas/);
});

test('guard review covers compliance, permission and civil authority without a scripted gesture', () => {
  const writing = doc('references/writing-contracts.md');
  assert.equal(fixture.guardReview.kind, 'authored-semantic-expectations');
  assert.equal(fixture.guardReview.modelRun, false);
  for (const sample of fixture.guardReview.cases) assert.ok(writing.includes(sample.scene), sample.id);
  assert.deepEqual(fixture.guardReview.cases.map(({ expected }) => expected), [
    { detentionRequiredByThisRule: false },
    { immediateInterventionPermitted: true, immediateInterventionRequired: false },
    { receiptGrantsArrestAuthority: false, debtDecisionOwner: 'city-court' },
  ]);
  const guard = fixture.semanticCases.find(({ id }) => id === 'guard-strength');
  assert.ok(!guard.mustRetain.includes('随现场变化'), 'Do not protect a redundant prose footer as rule meaning');
  assert.match(writing, /authored review expectations, not captured model responses/);
});

test('port comparison retains the ordinary allowance, closure exception and knowledge boundary', () => {
  for (const sample of fixture.port.cases) {
    let eligibility = 'unknown';
    if (sample.closed === true) {
      eligibility = sample.cargo === 'relief' ? 'category-eligible-other-rules-unresolved' : 'ineligible';
    } else if (sample.closed === false && sample.cargo === 'ordinary') {
      if (sample.permitValid === true) eligibility = 'eligible';
      if (sample.permitValid === false) eligibility = 'ineligible';
    }
    assert.equal(eligibility, sample.expectedEligibility, sample.id);
    assert.equal(fixture.port.knowledge[sample.askedPerson], sample.expectedLocationKnowledge, sample.id);
  }
  const examples = doc('references/examples.md');
  assert.ok(examples.includes(fixture.port.passageBody));
  assert.ok(examples.includes(fixture.port.warehouseBody));
  assert.match(examples, /this brief has not decided them/);
  assert.match(examples, /prose prohibition is\s+not a confidentiality guarantee/);
});

test('E01 includes short, long, shared and mixed needs with explicit cost and exit reasons', () => {
  const planning = doc('references/planning-and-loading.md');
  for (const need of ['Short independent knowledge', 'Short shared rule', 'A few branches', 'Long mutually exclusive material', 'Several entries need the same dependency', 'Only some scenes need complex state']) {
    assert.ok(planning.includes(need), need);
  }
  assert.match(planning, /Upgrade or exit reason/);
  assert.match(planning, /controller is an organization choice; explicit loading is an action/);
  assert.match(planning, /mixed loading does not require every entry to support both mechanisms/);
  assert.match(planning, /native-only project does\s+not need template installation/);
});

test('required cases and technical owners are reachable without executable copied templates', () => {
  const examples = doc('references/examples.md');
  for (const heading of ['Port rules and a secret', 'True condition, unreachable entry', 'A partially mixed book', 'Neutral routing example']) {
    assert.ok(examples.includes(heading), heading);
  }
  assert.match(examples, /Static design checks and expected outcomes/);
  assert.match(examples, /Candidate design/);
  assert.match(examples, /rule\.relief-cargo/);
  assert.match(examples, /Runtime still unverified/);
  assert.match(examples, /does not establish deletion of persistent storage/);
  assert.ok(!examples.includes('<%'), 'do not turn unverified source templates into executable examples');
  const entry = doc('SKILL.md');
  for (const name of ['worldbook-version-verification.md', 'worldbook-target-state-contract.md', 'worldbook-output-budget.md', 'worldbook-isolated-runtime-checks.md']) {
    assert.ok(entry.includes(name), name);
  }
});

test('migration preserves old anchors and builder character/CoT responsibility', () => {
  const world = read('skills/tavern-card-builder/references/worldbuilding-design.md');
  const lorebook = read('skills/tavern-card-builder/references/lorebook-and-prompts.md');
  for (const heading of ['## 4. Facts, knowledge, and degrees of awareness', '## 5. Structured prose and author rules', '### 5.1 Standalone author rules', '## 6. Work by the selected size']) {
    assert.ok(world.includes(heading), heading);
  }
  assert.ok(world.includes('../../worldbook-design-and-writing/references/writing-contracts.md'));
  assert.ok(!world.includes('For a fact where information differences matter, identify:'));
  assert.ok(!lorebook.includes('world outline 1, background 2-3, character overview 4'));
  assert.match(lorebook, /One core character/);
  assert.match(lorebook, /Multiple core characters/);
  assert.match(lorebook, /Conditional CoT modules and preset stitching/);
  assert.match(lorebook, /### Model-facing body and processed source/);
  const planning = doc('references/planning-and-loading.md');
  assert.match(planning, /Retain the host's `order` field/);
  assert.match(planning, /stable IDs/);
  assert.match(planning, /unknown\s+fields/);
});

test('source receipt carries exact index/identifier and six nonexclusive destinations', () => {
  const source = read('docs/worldbook-source-migration-notes.md');
  for (const [index, identifier] of [
    ['P058', '3ceb57f1-8fc2-4620-a767-4f5dec313343'],
    ['P061', '64a559d6-1422-4297-9d9b-a17dbe2e8b49'],
    ['P063', '81c4a3bf-980d-4517-b4af-06e13f12e5fd'],
    ['P082', '07688972-a290-4b22-a210-3f9df7ef0781'],
    ['P099', '4b26ee27-58af-458d-a698-7f88f2a40e5e'],
    ['P143', '9f0c7363-3af8-4da6-9b12-693157b5a0e8'],
  ]) assert.ok(source.includes(`${index} / \`${identifier}\``), index);
  for (let i = 1; i <= 6; i += 1) assert.ok(source.includes(`| ${i}.`));
  assert.match(source, /P049\/P050\/P051 are excluded as a complete group/);
  assert.match(source, /Existing independently sourced natural-prose, character and\s+other TW abilities remain intact/);
  assert.match(source, /not an exclusive menu/);
});

test('skill files omit private creative-material attribution while official research may remain', () => {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else files.push(file);
    }
  }
  visit(skill);
  for (const file of files) {
    const body = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(body, /珠[玑矶]|斗罗大陆|斗一|斗二|斗三|魂核凝聚|\bP\d{3}\b/,
      path.relative(root, file));
    assert.doesNotMatch(body, /762363|232196|796517|692109|546597|862183|237405|856449|f7c3a88836bda71f35353d2193d0db0ec0430d1af275d1e9957bdf6930936e4a|d2de21bc259711f984a4163a1f71812ea52460ea1e81e95398dc271ae4f8986d/,
      path.relative(root, file));
    assert.doesNotMatch(body, /source-notes\.md|worldbook-source-migration-notes\.md/,
      'daily loading must not pull in the source report');
  }
  assert.ok(!fs.existsSync(path.join(skill, 'references/source-notes.md')));
  const report = read('docs/worldbook-source-migration-notes.md');
  assert.match(report, /Original source-card static record/);
  assert.match(report, /526 entries, 26 enabled/);
  for (const id of ['762363', '232196', '796517', '692109', '546597', '862183', '237405', '856449']) {
    assert.ok(report.includes(id), id);
  }
});

test('six neutral method scenarios stay available without source-template labels', () => {
  const planning = doc('references/planning-and-loading.md');
  for (const scenario of ['One value selects a rule', 'A special state takes precedence', 'A rule needs conditional supporting detail', 'Template-generated keywords', 'Date selects an event', 'Render state to the player']) {
    assert.ok(planning.includes(scenario), scenario);
  }
  assert.match(planning, /not an exclusive menu/);
  assert.match(planning, /Exclude any path dependent on native recursive scanning/);
  assert.match(planning, /valid\/invalid\/missing values/);
  assert.match(planning, /sillytavern-embedded-ui\/SKILL\.md/);
  assert.doesNotMatch(planning, /source EJS templates|source template|six source/);
});

test('new skill and migrated references have existing relative Markdown targets', () => {
  const files = [
    ...['SKILL.md', 'references/planning-and-loading.md', 'references/writing-contracts.md', 'references/examples.md', 'references/research-sources.md', 'references/behavioral-validation.md'].map((file) => path.join(skill, file)),
    ...['SKILL.md', 'references/worldbuilding-design.md', 'references/lorebook-and-prompts.md', 'references/authoring-workflow.md', 'references/validation.md'].map((file) => path.join(root, 'skills/tavern-card-builder', file)),
  ];
  files.push(path.join(root, 'docs/worldbook-source-migration-notes.md'));
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target);
      assert.ok(fs.existsSync(resolved), `${path.relative(root, file)} -> ${target}`);
      const fragment = match[1].split('#')[1];
      if (fragment && resolved.endsWith('.md')) {
        const headings = [...fs.readFileSync(resolved, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)];
        const slugs = headings.map(([, heading]) => heading.toLowerCase()
          .replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s/g, '-'));
        assert.ok(slugs.includes(fragment), `${path.relative(root, file)} -> ${target}#${fragment}`);
      }
    }
  }
});
