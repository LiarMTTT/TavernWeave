import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build-importable-component.mjs';
import { loadJson, planSpec } from '../scripts/plan-component-update.mjs';
import { validateTarget } from '../scripts/validate-importable-component.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = loadJson(path.join(here, 'fixtures', 'component-spec.json'));

function tempDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tw-component-update-'));
}

test('component mode emits only importable component artifacts', () => {
  const output = tempDirectory();
  try {
    const result = build(fixture, output, true);
    assert.deepEqual(result.errors, []);
    assert.equal(fs.existsSync(path.join(output, 'status-bar.regex.json')), true);
    assert.equal(fs.existsSync(path.join(output, 'assembly-handoff.json')), false);
    assert.equal(fs.readdirSync(output).some(name => name.endsWith('.png') || name.endsWith('.card.json')), false);
    assert.deepEqual(validateTarget(output).errors, []);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('full-card mode emits a pipeline handoff but no card', () => {
  const output = tempDirectory();
  const spec = structuredClone(fixture);
  spec.deliveryMode = 'full-card';
  spec.assembly = {
    targetCard: 'staging/card.json',
    componentId: 'regex-status-bar',
    expectedUntouchedHash: 'a'.repeat(64)
  };
  try {
    const result = build(spec, output, true);
    assert.deepEqual(result.errors, []);
    const handoff = loadJson(path.join(output, 'assembly-handoff.json'));
    assert.equal(handoff.pipelineOwner, 'sillytavern-card-pipeline');
    assert.equal(fs.readdirSync(output).some(name => name.endsWith('.card.json') || name.endsWith('.png')), false);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('component mode rejects an assembly block', () => {
  const spec = structuredClone(fixture);
  spec.assembly = { targetCard: 'x', componentId: 'y', expectedUntouchedHash: 'a'.repeat(64) };
  assert.match(planSpec(spec, 'staging').errors.join('\n'), /must not include assembly/);
});
