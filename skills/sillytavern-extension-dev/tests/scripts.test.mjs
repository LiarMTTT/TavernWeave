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
