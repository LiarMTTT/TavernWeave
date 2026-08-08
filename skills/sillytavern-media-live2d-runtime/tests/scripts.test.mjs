import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkBindings } from '../scripts/check-media-bindings.mjs';
import { planPreload } from '../scripts/plan-media-preload.mjs';
import { validateMediaManifest } from '../scripts/validate-media-manifest.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, 'fixtures');
const load = name => JSON.parse(fs.readFileSync(path.join(fixtures, name), 'utf8'));

test('media manifest verifies local hashes and never contacts remote assets', () => {
  const report = validateMediaManifest(load('media-manifest.json'), fixtures);
  assert.equal(report.pass, true, report.errors.join('\n'));
  assert.equal(report.assets.filter(asset => asset.verified).length, 5);
  assert.match(report.warnings.join('\n'), /remote source was not contacted/);
  assert.doesNotMatch(JSON.stringify(report), /example\.invalid/);
});

test('audio and Live2D bindings require deterministic teardown', () => {
  const manifest = load('media-manifest.json');
  const bindings = load('media-bindings.json');
  const passing = checkBindings(manifest, bindings);
  assert.equal(passing.pass, true, passing.errors.join('\n'));
  const broken = structuredClone(bindings);
  broken.bindings.find(binding => binding.id === 'live2d-load').cleanupBindingId = 'missing-cleanup';
  const report = checkBindings(manifest, broken);
  assert.equal(report.pass, false);
  assert.match(report.errors.join('\n'), /cleanup binding not found/);
});

test('preload plan enforces byte budgets without network requests', () => {
  const manifest = load('media-manifest.json');
  const budget = load('preload-budget.json');
  const report = planPreload(manifest, budget);
  assert.equal(report.pass, true, report.errors.join('\n'));
  assert.equal(report.totals.eagerBytes, 22);
  assert.equal(report.totals.lazyBytes, 67);
  assert.equal(report.networkRequests, 0);
  const blocked = structuredClone(budget);
  blocked.limits.eagerBytes = 10;
  assert.equal(planPreload(manifest, blocked).pass, false);
});
