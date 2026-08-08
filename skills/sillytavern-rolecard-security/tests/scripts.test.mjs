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
