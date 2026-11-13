import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const ext = 'extensions/yuri-creation';
const config = JSON.parse(read(`${ext}/hosts/native.json`));

test('main is a complete Gemini extension with four usable Yuri entries', () => {
  const manifest = JSON.parse(read('gemini-extension.json'));
  assert.equal(manifest.name, config.name);
  assert.equal(manifest.version, read(`${ext}/VERSION`).trim());
  assert.equal(manifest.contextFileName, 'GEMINI.md');
  assert.equal(read('gemini-extension.json'), read(`${ext}/hosts/gemini/gemini-extension.json`));
  assert.equal(read('GEMINI.md'), read(`${ext}/hosts/gemini/GEMINI.md`));

  for (const name of Object.keys(config.entry_points)) {
    const wrapper = read(`skills/${name}/SKILL.md`);
    assert.ok(wrapper.startsWith(`---\nname: ${name}\n`), name);
    const target = /\[maintained [^\]]+ workflow\]\(([^)]+)\)/u.exec(wrapper)?.[1];
    assert.ok(target, `${name}: canonical target missing`);
    assert.equal(path.resolve(root, 'skills', name, target), path.join(root, ext, 'skills', name, 'SKILL.md'));
    const canonical = read(`${ext}/skills/${name}/SKILL.md`);
    assert.equal(wrapper.split('---')[1], canonical.split('---')[1], `${name}: stale entry metadata`);
    assert.equal(read(`skills/${name}/LICENSE`), read(`${ext}/LICENSE`));
    assert.ok(fs.existsSync(path.join(root, `skills/${name}/agents/openai.yaml`)));
  }
  assert.ok(fs.existsSync(path.join(root, `${ext}/scripts/host_probe.py`)));
  assert.ok(fs.existsSync(path.join(root, `${ext}/shared/provenance.py`)));
});

test('native entries supplement the legacy dependency inventory without replacing source tooling', () => {
  const base = JSON.parse(read('tavernweave-install-manifest.json'));
  const actual = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  assert.equal(base.skillCount, 23);
  assert.equal(Object.keys(config.entry_points).length, 4);
  assert.deepEqual(actual, [...base.skills, ...Object.keys(config.entry_points)].sort());
  for (const name of ['scripts/build-plugin-packages.py', '.github/workflows/validate.yml', 'tests/test_plugin_packages.py']) {
    assert.ok(fs.existsSync(path.join(root, name)), name);
  }
});
