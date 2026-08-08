import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkBudget } from '../scripts/check-performance-budget.mjs';
import { measureCard } from '../scripts/measure-rolecard-performance.mjs';
import { validateRuntimeSample } from '../scripts/validate-runtime-sample.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const loadText = name => fs.readFileSync(path.join(here, 'fixtures', name), 'utf8');
const load = name => JSON.parse(loadText(name));

test('rolecard measurement counts heavy surfaces without echoing content', () => {
  const raw = loadText('rolecard.json');
  const report = measureCard(JSON.parse(raw), raw, { file: 'fixture.json' });
  assert.equal(report.metrics.worldbookEntries, 2);
  assert.equal(report.metrics.regexCount, 1);
  assert.equal(report.metrics.helperScriptCount, 1);
  assert.equal(report.metrics.embeddedDataBytes, 5);
  assert.equal(report.metrics.remoteUrlCount, 1);
  const rendered = JSON.stringify(report);
  assert.doesNotMatch(rendered, /private prompt text|do not report this|example\.invalid/);
});

test('budget blocks growth even when absolute limits still pass', () => {
  const raw = loadText('rolecard.json');
  const baseline = measureCard(JSON.parse(raw), raw, { file: 'baseline.json' });
  const candidateValue = JSON.parse(raw);
  candidateValue.data.description += ' expanded';
  const candidateRaw = `${JSON.stringify(candidateValue, null, 2)}\n`;
  const candidate = measureCard(candidateValue, candidateRaw, { file: 'candidate.json' });
  const report = checkBudget(candidate, load('budget.json'), baseline);
  assert.equal(report.pass, false);
  assert.ok(report.violations.some(item => item.type === 'growth' && item.metric === 'promptBytes'));
});

test('captured runtime percentiles remain a separate gate', () => {
  const sample = load('runtime-sample.json');
  const passing = validateRuntimeSample(sample);
  assert.equal(passing.pass, true, passing.errors.join('\n'));
  const failing = structuredClone(sample);
  failing.scenarios[0].budgetP95Ms = 120;
  const report = validateRuntimeSample(failing);
  assert.equal(report.pass, false);
  assert.equal(report.scenarios[0].p95Ms, 140);
});
