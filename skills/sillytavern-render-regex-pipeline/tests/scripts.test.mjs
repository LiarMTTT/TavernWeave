import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
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

test('card destination flags follow the host OR condition across all four combinations', () => {
  for (const [markdownOnly, promptOnly, stages] of [
    [false, false, ['raw']], [true, false, ['display']],
    [false, true, ['prompt']], [true, true, ['display', 'prompt']]
  ]) {
      const value = [{ ...rules[0], markdownOnly, promptOnly }];
      assert.deepEqual(validateRules(value).errors, []);
      for (const destination of ['display', 'prompt', 'raw']) {
        const report = runCases(value, { schemaVersion: 1, cases: [{ ...fixtures.cases[0], destination, expected: stages.includes(destination) ? 'ready' : '<status>ready</status>' }] });
        assert.equal(report.passed, 1, JSON.stringify({ markdownOnly, promptOnly, destination }));
      }
  }
});

test('missing card flags remain absent and behave as false at the declared stage', () => {
  const value = structuredClone(rules);
  delete value[0].markdownOnly;
  delete value[0].promptOnly;
  const before = JSON.stringify(value);
  const report = runCases(value, { schemaVersion: 1, cases: [
    { ...fixtures.cases[0], id: 'raw', destination: 'raw', expected: 'ready' },
    { ...fixtures.cases[0], id: 'display', expected: '<status>ready</status>' }
  ] });
  assert.equal(report.passed, 2);
  assert.equal(JSON.stringify(value), before);
});

test('unknown placement is skipped rather than guessed', () => {
  const one = structuredClone(fixtures);
  one.cases = [{ ...one.cases[0], id: 'unmapped', placement: 99, expected: '<status>ready</status>' }];
  assert.equal(runCases(rules, one).failed, 0);
});

const helper = {
  id: 'helper-status', script_name: 'Status unwrap', enabled: true,
  find_regex: rules[0].findRegex, replace_string: '$1', trim_strings: [],
  source: { user_input: false, ai_output: true, slash_command: false, world_info: false },
  destination: { display: true, prompt: true }, run_on_edit: true,
  min_depth: null, max_depth: null
};

test('both dialects allow empty and intentional whitespace replacements without trimming', () => {
  for (const replacement of ['', ' \t\n']) {
    for (const rule of [{ ...rules[0], replaceString: replacement }, { ...helper, replace_string: replacement }]) {
      const report = runCases(rule, { schemaVersion: 1, cases: [{ ...fixtures.cases[0], expected: replacement }] });
      assert.deepEqual(report.errors, []);
      assert.equal(report.passed, 1);
      assert.equal(report.results[0].output, replacement);
    }
  }
  assert.match(validateRules({ ...rules[0], replaceString: null }).errors.join('\n'), /replaceString must be a string/);
  assert.match(validateRules({ ...helper, replace_string: 0 }).errors.join('\n'), /replace_string must be a string/);
});

test('card fixtures require numeric placement even if unchanged input matches expected', () => {
  const missing = { ...fixtures.cases[0], expected: fixtures.cases[0].input };
  delete missing.placement;
  for (const fixture of [missing, { ...missing, placement: '2' }]) {
    const report = runCases(rules, { schemaVersion: 1, cases: [fixture] });
    assert.match(report.errors.join('\n'), /placement must be an integer/);
    assert.equal(report.passed, 0);
    assert.equal(report.failed, 1);
    assert.deepEqual(report.results[0].trace, []);
  }
});

test('helper fixtures require a source and mixed dialect fixtures require both selectors', () => {
  const missing = { ...fixtures.cases[0] };
  delete missing.source;
  assert.match(runCases(helper, { schemaVersion: 1, cases: [missing] }).errors.join('\n'), /source must be a non-empty string/);
  const mixed = [rules[0], helper];
  assert.match(runCases(mixed, { schemaVersion: 1, cases: [missing] }).errors.join('\n'), /source must be a non-empty string/);
  const noPlacement = { ...fixtures.cases[0] };
  delete noPlacement.placement;
  assert.match(runCases(mixed, { schemaVersion: 1, cases: [noPlacement] }).errors.join('\n'), /placement must be an integer/);
  assert.match(runCases(helper, { schemaVersion: 1, cases: [{ ...fixtures.cases[0], destination: 'raw' }] }).errors.join('\n'), /destination must be display, prompt/);
});

test('expected values must be strings and trace-only cases never count as passed assertions', () => {
  for (const expected of [123, null, false, {}]) {
    const report = runCases(rules, { schemaVersion: 1, cases: [{ ...fixtures.cases[0], expected }] });
    assert.match(report.errors.join('\n'), /expected must be a string/);
    assert.equal(report.passed, 0);
    assert.equal(report.failed, 1);
  }
  const traceOnly = { ...fixtures.cases[0] };
  delete traceOnly.expected;
  const report = runCases(rules, { schemaVersion: 1, cases: [traceOnly] });
  assert.deepEqual(report.errors, []);
  assert.equal(report.passed, 0);
  assert.equal(report.failed, 0);
  assert.equal(report.traceOnly, 1);
  assert.equal(report.results[0].pass, null);
  assert.equal(report.results[0].status, 'trace-only');
  assert.equal(report.results[0].output, 'ready');
});

test('malformed fixtures and invalid rules report errors without running replacements', () => {
  for (const value of [{ schemaVersion: 1, cases: {} }, { schemaVersion: 1, cases: [null] }, { schemaVersion: 1, cases: [{ ...fixtures.cases[0], input: null }] }]) {
    const report = runCases(rules, value);
    assert.ok(report.errors.length);
    assert.equal(report.passed, 0);
  }
  const report = runCases({ ...rules[0], findRegex: '[' }, fixtures);
  assert.ok(report.errors.length);
  assert.equal(report.passed, 0);
  assert.ok(report.results.every(result => result.trace.length === 0));
});

test('trace CLI preserves assertion failures and identifies trace-only output', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-regex-trace-'));
  const casePath = path.join(directory, 'cases.json');
  const scriptPath = path.resolve(here, '../scripts/trace-render-pipeline.mjs');
  try {
    fs.writeFileSync(casePath, JSON.stringify({ schemaVersion: 1, cases: [{ ...fixtures.cases[0], expected: 'wrong' }] }), 'utf8');
    const failed = spawnSync(process.execPath, [scriptPath, '--regex', path.join(here, 'fixtures/card-regex.json'), '--fixtures', casePath], { encoding: 'utf8' });
    assert.equal(failed.status, 1, failed.stderr);
    assert.equal(JSON.parse(failed.stdout).cases[0].status, 'failed');
    const traceOnly = { ...fixtures.cases[0] };
    delete traceOnly.expected;
    fs.writeFileSync(casePath, JSON.stringify({ schemaVersion: 1, cases: [traceOnly] }), 'utf8');
    const traced = spawnSync(process.execPath, [scriptPath, '--regex', path.join(here, 'fixtures/card-regex.json'), '--fixtures', casePath], { encoding: 'utf8' });
    assert.equal(traced.status, 0, traced.stderr);
    assert.equal(JSON.parse(traced.stdout).cases[0].status, 'trace-only');
    assert.equal(JSON.parse(traced.stdout).cases[0].pass, null);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
