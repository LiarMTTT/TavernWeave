import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build-importable-component.mjs';
import { canonicalJson, loadJson, planSpec, sha256, validateComponentValue } from '../scripts/plan-component-update.mjs';
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

test('regex export preserves empty or whitespace replacement and both destination flags', () => {
  for (const replacement of ['', ' \t\n']) {
    const output = tempDirectory();
    const spec = structuredClone(fixture);
    spec.items[0].value.replaceString = replacement;
    spec.items[0].value.promptOnly = true;
    spec.items[0].value.vendorField = { preserved: true };
    try {
      assert.deepEqual(build(spec, output, true).errors, []);
      const actual = loadJson(path.join(output, 'status-bar.regex.json'));
      assert.equal(actual.replaceString, replacement);
      assert.equal(actual.markdownOnly, true);
      assert.equal(actual.promptOnly, true);
      assert.deepEqual(actual.vendorField, { preserved: true });
      assert.deepEqual(validateTarget(output).errors, []);
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  }
});

function fullCardSpec() {
  return { ...structuredClone(fixture), deliveryMode: 'full-card', assembly: {
    targetCard: 'staging/card.json', componentId: 'regex-status-bar', expectedUntouchedHash: 'a'.repeat(64)
  } };
}

test('every existing artifact, manifest or handoff blocks the whole batch before writes', () => {
  const spec = fullCardSpec();
  for (const existing of ['status-bar.regex.json', 'component-update-manifest.json', 'assembly-handoff.json']) {
    const output = tempDirectory();
    try {
      fs.writeFileSync(path.join(output, existing), 'previous delivery', 'utf8');
      assert.match(planSpec(spec, output).errors.join('\n'), /output already exists/);
      const result = build(spec, output, true);
      assert.match(result.errors.join('\n'), /output already exists/);
      assert.deepEqual(result.written, []);
      assert.deepEqual(fs.readdirSync(output), [existing]);
      assert.equal(fs.readFileSync(path.join(output, existing), 'utf8'), 'previous delivery');
    } finally {
      fs.rmSync(output, { recursive: true, force: true });
    }
  }
});

test('a target appearing after preflight is preserved and this batch reservations roll back', t => {
  const output = tempDirectory();
  const spec = fullCardSpec();
  const originalOpen = fs.openSync;
  const racedTarget = path.join(output, 'assembly-handoff.json');
  t.mock.method(fs, 'openSync', function (target, flags, ...rest) {
    if (target === racedTarget && flags === 'wx') fs.writeFileSync(target, 'concurrent delivery', 'utf8');
    return originalOpen.call(fs, target, flags, ...rest);
  });
  try {
    const result = build(spec, output, true);
    assert.match(result.errors.join('\n'), /component batch write failed/);
    assert.deepEqual(result.written, []);
    assert.deepEqual(fs.readdirSync(output), ['assembly-handoff.json']);
    assert.equal(fs.readFileSync(racedTarget, 'utf8'), 'concurrent delivery');
  } finally {
    t.mock.restoreAll();
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('a partial write failure removes this batch outputs and keeps unrelated files', t => {
  const output = tempDirectory();
  fs.writeFileSync(path.join(output, 'keep.txt'), 'retained', 'utf8');
  const originalWrite = fs.writeFileSync;
  let batchWrites = 0;
  t.mock.method(fs, 'writeFileSync', function (target, content, ...rest) {
    if (typeof target === 'number' && ++batchWrites === 2) {
      originalWrite.call(fs, target, content.slice(0, 8), ...rest);
      throw Object.assign(new Error('injected disk write failure'), { code: 'EIO' });
    }
    return originalWrite.call(fs, target, content, ...rest);
  });
  try {
    const result = build(fullCardSpec(), output, true);
    assert.match(result.errors.join('\n'), /injected disk write failure/);
    assert.deepEqual(result.written, []);
    assert.deepEqual(fs.readdirSync(output), ['keep.txt']);
    assert.equal(fs.readFileSync(path.join(output, 'keep.txt'), 'utf8'), 'retained');
  } finally {
    t.mock.restoreAll();
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('rollback preserves an externally replaced reservation and reports its path', t => {
  const output = tempDirectory();
  const owned = path.join(output, 'status-bar.regex.json');
  const raced = path.join(output, 'assembly-handoff.json');
  const originalOpen = fs.openSync;
  t.mock.method(fs, 'openSync', function (target, flags, ...rest) {
    if (target === raced && flags === 'wx') {
      fs.unlinkSync(owned);
      fs.writeFileSync(owned, 'external replacement', 'utf8');
      fs.writeFileSync(raced, 'concurrent delivery', 'utf8');
    }
    return originalOpen.call(fs, target, flags, ...rest);
  });
  try {
    const result = build(fullCardSpec(), output, true);
    assert.match(result.errors.join('\n'), /externally replaced/);
    assert.deepEqual(result.written, [owned]);
    assert.deepEqual(fs.readdirSync(output), ['assembly-handoff.json', 'status-bar.regex.json']);
    assert.equal(fs.readFileSync(owned, 'utf8'), 'external replacement');
    assert.equal(fs.readFileSync(raced, 'utf8'), 'concurrent delivery');
  } finally {
    t.mock.restoreAll();
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('an unknown identity leaves the newly reserved output visible in the failure result', t => {
  const output = tempDirectory();
  const owned = path.join(output, 'status-bar.regex.json');
  const originalFstat = fs.fstatSync;
  let calls = 0;
  t.mock.method(fs, 'fstatSync', function (fd, ...rest) {
    if (++calls === 1) throw Object.assign(new Error('injected identity failure'), { code: 'EIO' });
    return originalFstat.call(fs, fd, ...rest);
  });
  try {
    const result = build(fullCardSpec(), output, true);
    assert.match(result.errors.join('\n'), /injected identity failure/);
    assert.match(result.errors.join('\n'), /identity is unverified/);
    assert.deepEqual(result.written, [owned]);
    assert.deepEqual(fs.readdirSync(output), ['status-bar.regex.json']);
  } finally {
    t.mock.restoreAll();
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('an unlink failure reports the output it could not remove', t => {
  const output = tempDirectory();
  const owned = path.join(output, 'component-update-manifest.json');
  const raced = path.join(output, 'assembly-handoff.json');
  const originalOpen = fs.openSync;
  const originalUnlink = fs.unlinkSync;
  t.mock.method(fs, 'openSync', function (target, flags, ...rest) {
    if (target === raced && flags === 'wx') fs.writeFileSync(target, 'concurrent delivery', 'utf8');
    return originalOpen.call(fs, target, flags, ...rest);
  });
  t.mock.method(fs, 'unlinkSync', function (target, ...rest) {
    if (target === owned) throw Object.assign(new Error('injected unlink failure'), { code: 'EACCES' });
    return originalUnlink.call(fs, target, ...rest);
  });
  try {
    const result = build(fullCardSpec(), output, true);
    assert.match(result.errors.join('\n'), /injected unlink failure/);
    assert.deepEqual(result.written, [owned]);
    assert.deepEqual(fs.readdirSync(output), ['assembly-handoff.json', 'component-update-manifest.json']);
    assert.equal(fs.readFileSync(raced, 'utf8'), 'concurrent delivery');
  } finally {
    t.mock.restoreAll();
    fs.rmSync(output, { recursive: true, force: true });
  }
});

function script(id) {
  return { type: 'script', enabled: true, name: id, id, content: 'void 0;', info: '', button: { enabled: false, buttons: [] }, data: {}, export_with: { data: false, button: false } };
}

function folder(id, childId) {
  return { type: 'folder', enabled: true, name: id, id, icon: '', color: '', scripts: [script(childId)] };
}

function folderSpec() {
  return { schemaVersion: 1, deliveryMode: 'component', kind: 'helper-folder', items: [
    { artifactName: 'first', value: folder('folder-a', 'script-a') },
    { artifactName: 'second', value: folder('folder-b', 'script-b') }
  ] };
}

test('folder and child script IDs are unique across the whole batch', () => {
  assert.match(validateComponentValue('helper-folder', folder('same', 'same')).join('\n'), /duplicate component id/);
  for (const id of ['script-a', 'folder-a']) {
    const spec = folderSpec();
    spec.items[1].value.scripts[0].id = id;
    assert.match(planSpec(spec, 'new-isolated-staging').errors.join('\n'), /duplicate component id/);
  }
  const folderCollision = folderSpec();
  folderCollision.items[1].value.id = 'script-a';
  assert.match(planSpec(folderCollision, 'new-isolated-staging').errors.join('\n'), /duplicate component id/);
});

test('directory validation detects duplicate child IDs even with valid per-file hashes', () => {
  const output = tempDirectory();
  const spec = folderSpec();
  try {
    assert.deepEqual(build(spec, output, true).errors, []);
    assert.deepEqual(validateTarget(output).errors, []);
    const second = loadJson(path.join(output, 'second.folder.json'));
    second.scripts[0].id = 'script-a';
    const content = canonicalJson(second);
    fs.writeFileSync(path.join(output, 'second.folder.json'), content, 'utf8');
    const manifest = loadJson(path.join(output, 'component-update-manifest.json'));
    manifest.artifacts[1].sha256 = sha256(content);
    fs.writeFileSync(path.join(output, 'component-update-manifest.json'), canonicalJson(manifest), 'utf8');
    const result = validateTarget(output);
    assert.match(result.errors.join('\n'), /duplicate component id: script-a/);
    assert.doesNotMatch(result.errors.join('\n'), /hash mismatch/);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
