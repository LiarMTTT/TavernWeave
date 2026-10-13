import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkCapabilities } from '../scripts/check-extension-capabilities.mjs';
import { scaffold } from '../scripts/scaffold-extension.mjs';
import { validateExtension } from '../scripts/validate-extension-manifest.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = name => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'));

test('scaffold is dry-run first and writes a valid minimal extension', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-extension-'));
  try {
    const spec = fixture('extension-spec.json');
    const dryRun = scaffold(spec, directory, false);
    assert.equal(dryRun.pass, true);
    assert.equal(dryRun.written.length, 0);
    assert.equal(fs.existsSync(path.join(directory, 'manifest.json')), false);
    const built = scaffold(spec, directory, true);
    assert.equal(built.pass, true);
    assert.equal(built.written.length, 4);
    const validation = validateExtension(directory);
    assert.equal(validation.pass, true, validation.errors.join('\n'));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('capability snapshot activates optional fallback without hiding required gates', () => {
  const spec = fixture('extension-spec.json');
  const contract = {
    schemaVersion: 1,
    minimum: { sillytavern: spec.minimumClientVersion, tavernHelper: null },
    requirements: spec.requirements
  };
  const report = checkCapabilities(contract, fixture('snapshot.json'));
  assert.equal(report.pass, true, report.errors.join('\n'));
  assert.deepEqual(report.fallbacks, [{ id: 'helper-audio', fallback: 'Disable extension audio controls' }]);
  const missing = checkCapabilities(contract, { ...fixture('snapshot.json'), symbols: [] });
  assert.equal(missing.pass, false);
  assert.equal(missing.missingRequired[0].symbol, 'SillyTavern.getContext');
});

test('manifest validator rejects paths outside the extension root', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-extension-path-'));
  try {
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({
      display_name: 'Unsafe',
      js: '../outside.js',
      author: 'TW',
      version: '1.0.0'
    }), 'utf8');
    const report = validateExtension(directory);
    assert.equal(report.pass, false);
    assert.match(report.errors.join('\n'), /escapes the extension root/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function versionCheck(minimum, installed) {
  return checkCapabilities({ schemaVersion: 1, minimum: { sillytavern: minimum }, requirements: [] }, { schemaVersion: 1, capturedAt: '2026-10-13T00:00:00Z', versions: { sillytavern: installed }, symbols: [] });
}

test('version preflight orders prereleases and ignores build metadata', () => {
  assert.equal(versionCheck('1.18.0', '1.18.0-beta.1').pass, false);
  assert.equal(versionCheck('1.18.0-beta.1', '1.18.0').pass, true);
  const ordered = ['1.18.0-alpha', '1.18.0-alpha.1', '1.18.0-alpha.beta', '1.18.0-beta', '1.18.0-beta.2', '1.18.0-beta.11', '1.18.0-rc.1', '1.18.0'];
  for (let index = 1; index < ordered.length; index += 1) {
    assert.equal(versionCheck(ordered[index], ordered[index - 1]).pass, false, ordered[index]);
    assert.equal(versionCheck(ordered[index - 1], ordered[index]).pass, true, ordered[index]);
  }
  assert.equal(versionCheck('1.18.0+build.2', '1.18.0+other.1').pass, true);
  assert.equal(versionCheck('1.18.0-1+00', '1.18.0-1+01').pass, true);
  assert.equal(versionCheck('1.18.0-beta.9007199254740993', '1.18.0-beta.9007199254740992').pass, false);
  assert.equal(versionCheck('9007199254740993.0.0', '9007199254740992.0.0').pass, false);
});

test('version preflight rejects malformed versions on either side', () => {
  for (const invalid of ['01.18.0', '1.018.0', '1.18.00', '1.18', 'v1.18.0', '1.18.0-', '1.18.0-alpha..1', '1.18.0-01', '1.18.0-beta.01', '1.18.0+build..1', '1.18.0+']) {
    assert.equal(versionCheck(invalid, '1.18.0').pass, false, invalid);
    assert.equal(versionCheck('1.18.0', invalid).pass, false, invalid);
    assert.equal(versionCheck(null, invalid).pass, false, invalid);
  }
  assert.equal(versionCheck(null, null).pass, true);
});
