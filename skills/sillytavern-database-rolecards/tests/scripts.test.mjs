import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
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
