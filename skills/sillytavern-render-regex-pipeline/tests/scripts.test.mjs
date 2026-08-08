import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCases } from '../scripts/run-regex-fixtures.mjs';
import { validateRules } from '../scripts/validate-tavern-regex.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rules = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'card-regex.json'), 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'cases.json'), 'utf8'));

test('card regex validates and all declared fixtures pass', () => {
  assert.deepEqual(validateRules(rules).errors, []);
  const report = runCases(rules, fixtures);
  assert.deepEqual(report.errors, []);
  assert.equal(report.failed, 0);
  assert.equal(report.passed, 3);
});

test('contradictory destination flags are rejected', () => {
  const invalid = structuredClone(rules);
  invalid[0].promptOnly = true;
  assert.match(validateRules(invalid).errors.join('\n'), /cannot set markdownOnly and promptOnly/);
});

test('unknown placement is skipped rather than guessed', () => {
  const one = structuredClone(fixtures);
  one.cases = [{ ...one.cases[0], id: 'unmapped', placement: 99, expected: '<status>ready</status>' }];
  assert.equal(runCases(rules, one).failed, 0);
});
