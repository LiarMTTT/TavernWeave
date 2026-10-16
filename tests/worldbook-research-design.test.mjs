import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'skills/worldbook-design-and-writing');
const read = (file) => fs.readFileSync(path.join(base, file), 'utf8');
const plan = JSON.parse(read('assets/examples/behavioral-validation-cases.json'));
const comparison = read('references/behavioral-validation.md');
const sources = read('references/research-sources.md');

// These tests inspect a self-authored design. They never call a model, emulate the
// host, produce model scores or establish empirical semantic equivalence.
test('fixture cannot be confused with actual model or runtime evidence', () => {
  assert.equal(plan.kind, 'synthetic-behavioral-validation-plan');
  assert.equal(plan.status, 'not-run');
  assert.equal(plan.runtimeVerified, false);
  assert.equal(plan.modelCallsMade, 0);
  assert.deepEqual(plan.actualResults, []);
  assert.equal(plan.position.measuredTokenCounts, null);
  assert.equal(plan.position.measuredTokenOffsets, null);
  assert.equal(plan.position.longContextMeasured, false);
  assert.match(plan.note, /not a SillyTavern export/);
  assert.match(comparison, /no model output/);
  assert.match(comparison, /Passing its offline tests establishes only/);
});

test('thirteen external rationales map to bounded local uses', () => {
  for (const url of [
    'https://developers.google.com/tech-writing/one/documents',
    'https://alistairmavin.com/ears/',
    'https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/',
    'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
    'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
    'https://dita-lang.org/1.3/dita/archspec/base/topicdefined',
    'https://www.nngroup.com/articles/taxonomy-101/',
    'https://diataxis.fr/reference/',
    'https://www.w3.org/TR/skos-primer/',
    'https://aclanthology.org/2020.tacl-1.28/',
    'https://arxiv.org/abs/2310.06117',
    'https://arxiv.org/abs/2307.03172',
    'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
  ]) assert.ok(sources.includes(url), url);
  for (const text of ['Concrete use in this repository', 'What it does not establish',
    'not adopted as a ban on useful negation', 'did not make them new research results',
    "not the paper's model-generated two-step procedure", 'do not prove that all models have a U-shaped curve']) {
    assert.ok(sources.includes(text), text);
  }
});

test('wording plan preserves boundary and unknown cases in its authored oracle', () => {
  assert.equal(plan.wording.changedFactor, 'rule-wording');
  for (const variant of plan.wording.variants) assert.ok(comparison.includes(variant.body), variant.id);
  assert.deepEqual(plan.wording.cases.map(({ visibilitySteps, expectedJudgment }) => [visibilitySteps, expectedJudgment]), [
    [6, 'ringing'], [10, 'silent'], [14, 'silent'], [null, 'unknown'],
  ]);
  assert.equal(plan.wording.brokenReviewerControl.equivalentCandidate, false);
  assert.equal(plan.wording.brokenReviewerControl.missingInvariant, 'visibility-equals-ten');
  assert.ok(plan.wording.confounders.includes('token-length-difference'));
  assert.match(comparison, /revise a non-equivalent pair/);
});

test('definition plan separates missing information from label and framing changes', () => {
  for (const variant of plan.definition.variants) assert.ok(comparison.includes(variant.body), variant.id);
  const diagnostic = plan.definition.variants.find(({ id }) => id === 'B0');
  assert.equal(diagnostic.diagnosticOnly, true);
  assert.equal(diagnostic.factsComplete, false);
  for (const variant of plan.definition.variants.filter(({ id }) => id !== 'B0')) {
    assert.equal(variant.factsComplete, true);
    assert.ok(variant.body.includes('首次使用不收费'));
    assert.ok(variant.body.includes('私人谈话不收费'));
  }
  assert.deepEqual(plan.definition.comparisons.map(({ equalInformation }) => equalInformation), [false, true, true]);
  assert.equal(plan.definition.notImplemented, 'model-generated-step-back-procedure');
  assert.match(comparison, /deliberately adds information/);
  assert.match(comparison, /extra length and changed order/);
  assert.match(comparison, /approximately\s+length-matched controls/);
});

test('position fixture changes only packet placement in a compact permutation design', () => {
  const position = plan.position;
  const distractors = Object.keys(position.blocks);
  const expectedSet = [...distractors, position.packetId].sort();
  assert.equal(position.packetBody, `${plan.wording.variants[0].body}\n${plan.wording.policy}`);
  assert.deepEqual(position.variants.map(({ blockOrder }) => blockOrder.indexOf(position.packetId)), [0, 2, 4]);
  for (const { id, blockOrder } of position.variants) {
    assert.deepEqual([...blockOrder].sort(), expectedSet, id);
    assert.deepEqual(blockOrder.filter((block) => block !== position.packetId), distractors, id);
    assert.equal(blockOrder.filter((block) => block === position.packetId).length, 1, id);
  }
  assert.match(position.lengthComparison, /compact fixture is only a permutation check/);
  assert.match(comparison, /keeping all other blocks in the\s+same relative order/);
  assert.match(comparison, /a numeric host `order`/);
  assert.match(comparison, /Changing length also changes distractor exposure/);
});

test('same-name prose distinguishes identity and definition without claiming native selection', () => {
  const writing = read('references/writing-contracts.md');
  const examples = read('references/examples.md');
  assert.equal(new Set(plan.homonym.entries.map(({ id }) => id)).size, 2);
  for (const entry of plan.homonym.entries) {
    for (const value of [entry.id, entry.label, entry.body]) assert.ok(examples.includes(value), value);
  }
  assert.equal(plan.homonym.cases[2].expectedReferent, 'unresolved-without-context');
  assert.equal(plan.homonym.nativeSelectionVerified, false);
  assert.match(writing, /A \*\*label\*\*/);
  assert.match(writing, /a \*\*local definition\*\*/);
  assert.match(writing, /no RDF tooling is required/);
  assert.match(examples, /A bare native key 白塔\s+can still select both entries/);
  assert.match(examples, /do not themselves implement that path/);
});

test('appendix keeps optional use, authorization, setup and outcome boundaries', () => {
  const entry = read('SKILL.md');
  for (const name of ['research-sources.md', 'behavioral-validation.md']) assert.ok(entry.includes(name));
  assert.match(entry, /not compulsory entry-level tests/);
  assert.match(comparison, /no model call, paid evaluation or host import\s+is authorized/);
  assert.match(comparison, /discovery examples separate from later/);
  assert.match(comparison, /randomize or counterbalance/);
  assert.match(comparison, /retain every\s+trial, including failures/);
  assert.match(comparison, /delivery defect, not evidence against the prose/);
  assert.match(comparison, /counts and denominators separately/);
  assert.match(comparison, /not a reliability\s+estimate/);
  for (const label of ['plan only', 'static consistency checked', 'delivery observed', 'model trials observed', 'author accepted']) {
    assert.ok(comparison.includes(label), label);
  }
});
