import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadJson, validateModel } from '../scripts/validate-rolecard-schema.mjs';
import { runMigration } from '../scripts/run-database-migrations.mjs';
import { validateBindings } from '../scripts/check-field-bindings.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const model = loadJson(path.join(fixtures, 'model.json'));

test('multi-floor model and bindings validate', () => {
  assert.deepEqual(validateModel(model).errors, []);
  assert.deepEqual(validateBindings(model, loadJson(path.join(fixtures, 'bindings.json'))).errors, []);
});

test('migration is deterministic, idempotent, and preserves unknown fields', () => {
  const report = runMigration(
    loadJson(path.join(fixtures, 'migration.json')),
    loadJson(path.join(fixtures, 'before.json')),
    { expected: loadJson(path.join(fixtures, 'after.json')) }
  );
  assert.equal(report.pass, true);
  assert.equal(report.idempotent, true);
  assert.equal(report.output.tables.quests[0].custom, 'preserve me');
});

test('same-floor strategy remains explicitly blocked', () => {
  const sameFloor = structuredClone(model);
  sameFloor.storage.strategy = 'same-floor';
  assert.match(validateModel(sameFloor).errors.join('\n'), /DBR-C8-UNVERIFIED/);
});

function modelWith(field) {
  const value = structuredClone(model);
  value.tables.quests.fields.inventory = field;
  return value;
}

test('empty collections require complete future element and child shapes', () => {
  for (const field of [{ type: 'array', default: [] }, { type: 'object', default: {} }]) {
    const report = validateModel(modelWith(field));
    assert.equal(report.structureComplete, false);
    assert.match(report.errors.join('\n'), /complete collection structure is not verified/);
    const legacy = validateModel(modelWith(field), { allowShallow: true });
    assert.deepEqual(legacy.errors, []);
    assert.equal(legacy.structureComplete, false);
    assert.equal(legacy.incompleteStructures.length, 1);
    assert.ok(legacy.warnings.length);
  }
});

test('recursive array, fixed object and dynamic record shapes validate defaults', () => {
  const field = { type: 'array', items: { type: 'object', properties: {
    id: { type: 'string', required: true },
    amounts: { type: 'object', additionalProperties: { type: 'number' } }
  } }, default: [{ id: 'item-1', amounts: { gold: 2 } }] };
  assert.equal(validateModel(modelWith(field)).structureComplete, true);
  for (const invalid of [
    [{ amounts: {} }],
    [{ id: 'item-1', amounts: { gold: 'two' } }],
    [{ id: 'item-1', surprise: true }],
    [42]
  ]) assert.ok(validateModel(modelWith({ ...field, default: invalid })).errors.length);
  assert.equal(validateModel(modelWith({ type: 'object', properties: {}, default: {} })).structureComplete, true);
  assert.equal(validateModel(modelWith({ type: 'array', items: { type: 'object' }, default: [] })).structureComplete, false);
  for (const invalid of [
    { type: 'array', items: true },
    { type: 'object', additionalProperties: true },
    { type: 'object', properties: [] },
    { type: 'string', items: { type: 'string' } }
  ]) assert.ok(validateModel(modelWith(invalid)).errors.length);
});

test('field ownership rejects competing writers and accepts shared-owner entry points', () => {
  const binding = { id: 'writer-a', surface: 'script', table: 'quests', field: 'state', access: 'write', owner: 'quest-engine', refreshEvents: ['UPDATE'] };
  const document = { schemaVersion: 1, modelId: model.modelId, bindings: [binding, { ...binding, id: 'writer-b', access: 'read-write', owner: 'other-engine' }] };
  assert.match(validateBindings(model, document).errors.join('\n'), /competing runtime writers/);
  document.bindings[1].owner = 'quest-engine';
  assert.deepEqual(validateBindings(model, document).errors, []);
  document.bindings[1] = { ...binding, id: 'reader', owner: 'hud', access: 'read' };
  assert.deepEqual(validateBindings(model, document).errors, []);
});

test('initialization and migration declare distinct bounded responsibilities', () => {
  const binding = { id: 'runtime', surface: 'script', table: 'quests', field: 'state', access: 'write', owner: 'quest-engine', refreshEvents: ['UPDATE'] };
  const document = { schemaVersion: 1, modelId: model.modelId, bindings: [binding,
    { ...binding, id: 'init', owner: 'initializer', writePhase: 'initialization', writeCondition: 'New chat only; stop before runtime writes' },
    { ...binding, id: 'migrate', owner: 'migrator', writePhase: 'migration', writeCondition: 'Version 1 to 2 before runtime resumes' }
  ] };
  assert.deepEqual(validateBindings(model, document).errors, []);
  delete document.bindings[1].writeCondition;
  assert.match(validateBindings(model, document).errors.join('\n'), /writeCondition/);
  document.bindings[1].writeCondition = 'New chat only';
  document.bindings.push({ ...document.bindings[1], id: 'other-init', owner: 'other-initializer' });
  assert.match(validateBindings(model, document).errors.join('\n'), /competing initialization writers/);
});

test('binding function and CLI report invalid input without mutation or TypeError', () => {
  const valid = loadJson(path.join(fixtures, 'bindings.json'));
  const writer = { id: 'writer-a', surface: 'script', table: 'quests', field: 'state', access: 'write', owner: 'quest-engine', refreshEvents: ['UPDATE'] };
  const cases = [
    ...[{}, 'abc', 2, false, null, undefined, []].map((bindings, index) => ({
      label: `invalid-collection-${index}`, document: { schemaVersion: 1, modelId: model.modelId, ...(bindings === undefined ? {} : { bindings }) },
      count: 0, errors: ['bindings must be a non-empty array']
    })),
    { label: 'invalid-items', document: { ...valid, bindings: [null, 2, 'a', []] }, count: 4,
      errors: [0, 1, 2, 3].map(index => `bindings[${index}] must be an object`) },
    { label: 'valid', document: valid, count: valid.bindings.length, errors: [] },
    { label: 'competing-writers', document: { ...valid, bindings: [writer, { ...writer, id: 'writer-b', owner: 'other-engine' }] }, count: 2,
      errors: ['bindings[1]: competing runtime writers for quests.state: quest-engine and other-engine'] }
  ];
  const temporaryRoot = path.resolve(process.env.TW_TEST_ROOT || os.tmpdir());
  fs.mkdirSync(temporaryRoot, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(temporaryRoot, 'tw-bindings-'));
  const cli = fileURLToPath(new URL('../scripts/check-field-bindings.mjs', import.meta.url));
  try {
    for (const { label, document, count, errors } of cases) {
      const before = structuredClone(document);
      const modelBefore = structuredClone(model);
      const report = validateBindings(model, document);
      assert.deepEqual(report.errors, errors, label);
      assert.deepEqual(report.warnings, [], label);
      assert.equal(report.bindingCount, count, label);
      assert.deepEqual(document, before, label);
      assert.deepEqual(model, modelBefore, label);
      const input = path.join(temporary, `${label}.json`);
      const inputText = JSON.stringify(document);
      fs.writeFileSync(input, inputText);
      const result = spawnSync(process.execPath, [cli, '--schema', path.join(fixtures, 'model.json'), '--bindings', input], { encoding: 'utf8' });
      assert.ifError(result.error);
      assert.equal(result.status, errors.length ? 1 : 0, label);
      assert.equal(result.stderr, '', label);
      const { schema, bindings, ...cliReport } = JSON.parse(result.stdout);
      assert.equal(schema, path.resolve(fixtures, 'model.json'));
      assert.equal(bindings, input);
      assert.deepEqual(cliReport, report, label);
      assert.equal(fs.readFileSync(input, 'utf8'), inputText, label);
    }
    const invalidJson = path.join(temporary, 'invalid-json.json');
    fs.writeFileSync(invalidJson, '{');
    const result = spawnSync(process.execPath, [cli, '--schema', path.join(fixtures, 'model.json'), '--bindings', invalidJson], { encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim());
  } finally {
    assert.equal(path.dirname(temporary), temporaryRoot);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
