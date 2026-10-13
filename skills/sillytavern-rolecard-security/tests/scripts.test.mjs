import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditTarget } from '../scripts/audit-rolecard-security.mjs';
import { compareReports } from '../scripts/check-security-baseline.mjs';

function tempDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tw-security-audit-'));
}

test('audit reports sinks without returning source excerpts', () => {
  const directory = tempDirectory();
  try {
    fs.writeFileSync(path.join(directory, 'risky.js'), 'target.innerHTML = input;\neval(input);\n', 'utf8');
    const report = auditTarget(directory);
    assert.equal(report.summary.byRule['TWSEC-DOM-001'], 1);
    assert.equal(report.summary.byRule['TWSEC-EXEC-001'], 1);
    assert.equal(JSON.stringify(report).includes('eval(input)'), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('credential-sensitive filenames are skipped without reading them', () => {
  const directory = tempDirectory();
  try {
    fs.writeFileSync(path.join(directory, 'rolecard-workshop-secrets.secret.json'), 'not-json-on-purpose', 'utf8');
    const report = auditTarget(directory);
    assert.equal(report.filesScanned, 0);
    assert.equal(report.skipped[0].reason, 'credential-sensitive filename');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('baseline comparison blocks newly added rule counts', () => {
  const baseline = { summary: { byRule: { 'TWSEC-DOM-001': 1 } } };
  const current = { summary: { byRule: { 'TWSEC-DOM-001': 2 } } };
  assert.equal(compareReports(current, baseline).pass, false);
});

test('JSON strings are decoded and retain paths and exact original positions', () => {
  const directory = tempDirectory();
  try {
    const content = JSON.stringify({ data: { scripts: ['first line\npostMessage("synthetic", "*");', 'globalThis.twAuditExecuted = true;'] } }, null, 2)
      .replace('postMessage', '\\u0070ostMessage');
    fs.writeFileSync(path.join(directory, 'card.json'), content, 'utf8');
    const report = auditTarget(directory);
    const matches = report.findings.filter(item => item.ruleId === 'TWSEC-MSG-001');
    assert.equal(matches.length, 1);
    assert.equal(matches[0].jsonPath, '$["data"]["scripts"][0]');
    const before = content.slice(0, content.indexOf('\\u0070ostMessage')).split('\n');
    assert.equal(matches[0].line, before.length);
    assert.equal(matches[0].column, before.at(-1).length + 1);
    assert.equal(globalThis.twAuditExecuted, undefined);
    assert.doesNotMatch(JSON.stringify(report), /synthetic|first line|twAuditExecuted/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('sensitive JSON keys are inspected without disclosing values or parser excerpts', () => {
  const directory = tempDirectory();
  try {
    const marker = 'SYNTHETIC_ONLY_NOT_A_SECRET_012345';
    fs.writeFileSync(path.join(directory, 'card.json'), JSON.stringify({ data: [{ api_key: marker }, { password: 'short' }, { api_key: '' }] }), 'utf8');
    fs.writeFileSync(path.join(directory, 'malformed.json'), `{"value": ${marker}`, 'utf8');
    const report = auditTarget(directory);
    assert.equal(report.summary.byRule['TWSEC-SECRET-001'], 2);
    assert.equal(report.summary.byRule['TWSEC-PARSE-002'], 1);
    assert.ok(report.findings.some(item => item.jsonPath === '$["data"][0]["api_key"]'));
    assert.equal(JSON.stringify(report).includes(marker), false);
    assert.equal(JSON.stringify(report).includes('short'), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('inert JSON with primitive and empty-container values adds no findings', () => {
  const directory = tempDirectory();
  try {
    fs.writeFileSync(path.join(directory, 'card.json'), JSON.stringify({ name: 'ordinary', empty: {}, list: [null, false, 1, [], {}] }), 'utf8');
    assert.deepEqual(auditTarget(directory).findings, []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
