import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { canonicalJson, loadJson } from './validate-rolecard-schema.mjs';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseArgs(argv) {
  const options = { write: false, allowDataLoss: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (['--migration', '--input', '--expected', '--out'].includes(arg)) options[arg.slice(2)] = argv[++index];
    else if (arg === '--write') options.write = true;
    else if (arg === '--allow-data-loss') options.allowDataLoss = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.migration || !options.input) throw new Error('usage: --migration <file> --input <file> [--expected file] [--out file --write] [--allow-data-loss]');
  if (options.write && !options.out) throw new Error('--write requires --out');
  return options;
}

function validateMigration(migration) {
  const errors = [];
  if (!isObject(migration) || migration.schemaVersion !== 1) errors.push('migration must be a schemaVersion 1 object');
  for (const field of ['modelId', 'fromVersion', 'toVersion']) if (typeof migration?.[field] !== 'string' || migration[field] === '') errors.push(`${field} must be a non-empty string`);
  if (typeof migration?.allowDataLoss !== 'boolean') errors.push('allowDataLoss must be boolean');
  if (!Array.isArray(migration?.operations) || migration.operations.length === 0) errors.push('operations must be a non-empty array');
  for (const [index, operation] of (migration?.operations ?? []).entries()) {
    const prefix = `operations[${index}]`;
    if (!isObject(operation) || !['add-field', 'rename-field', 'delete-field'].includes(operation.op)) {
      errors.push(`${prefix}.op is unsupported`);
      continue;
    }
    if (typeof operation.table !== 'string' || operation.table === '') errors.push(`${prefix}.table must be a non-empty string`);
    if (operation.op === 'add-field') {
      if (typeof operation.field !== 'string' || operation.field === '') errors.push(`${prefix}.field must be a non-empty string`);
      if (!Object.hasOwn(operation, 'default')) errors.push(`${prefix}.default is required`);
    } else if (operation.op === 'rename-field') {
      for (const field of ['from', 'to']) if (typeof operation[field] !== 'string' || operation[field] === '') errors.push(`${prefix}.${field} must be a non-empty string`);
      if (operation.from === operation.to) errors.push(`${prefix}.from and to must differ`);
    } else if (typeof operation.field !== 'string' || operation.field === '') {
      errors.push(`${prefix}.field must be a non-empty string`);
    }
  }
  return errors;
}

function applyOperations(data, migration, allowDataLoss) {
  const result = structuredClone(data);
  const errors = [];
  for (const operation of migration.operations) {
    const records = result.tables?.[operation.table];
    if (!Array.isArray(records)) {
      errors.push(`table ${operation.table} must be an array in the data fixture`);
      continue;
    }
    if (operation.op === 'delete-field' && !(migration.allowDataLoss && allowDataLoss)) {
      errors.push(`delete-field ${operation.table}.${operation.field} requires declared and CLI data-loss approval`);
      continue;
    }
    for (const [index, record] of records.entries()) {
      if (!isObject(record)) {
        errors.push(`table ${operation.table} record ${index} must be an object`);
        continue;
      }
      if (operation.op === 'add-field') {
        if (!Object.hasOwn(record, operation.field)) record[operation.field] = structuredClone(operation.default);
      } else if (operation.op === 'rename-field') {
        if (Object.hasOwn(record, operation.from) && Object.hasOwn(record, operation.to)) {
          errors.push(`rename conflict in ${operation.table}[${index}]: both ${operation.from} and ${operation.to} exist`);
        } else if (Object.hasOwn(record, operation.from)) {
          record[operation.to] = record[operation.from];
          delete record[operation.from];
        }
      } else if (operation.op === 'delete-field') {
        delete record[operation.field];
      }
    }
  }
  result.modelVersion = migration.toVersion;
  return { result, errors };
}

export function runMigration(migration, input, options = {}) {
  const errors = validateMigration(migration);
  if (!isObject(input) || input.schemaVersion !== 1) errors.push('input must be a schemaVersion 1 object');
  if (input?.modelId !== migration?.modelId) errors.push('input modelId does not match migration');
  if (![migration?.fromVersion, migration?.toVersion].includes(input?.modelVersion)) errors.push('input modelVersion is not migration fromVersion or toVersion');
  if (!isObject(input?.tables)) errors.push('input tables must be an object');
  if (errors.length) return { schemaVersion: 1, errors, pass: false, idempotent: false, output: null };
  const first = applyOperations(input, migration, options.allowDataLoss === true);
  errors.push(...first.errors);
  const second = applyOperations(first.result, migration, options.allowDataLoss === true);
  errors.push(...second.errors);
  const idempotent = isDeepStrictEqual(first.result, second.result);
  if (!idempotent) errors.push('migration is not idempotent');
  const expectedPass = options.expected === undefined ? null : isDeepStrictEqual(first.result, options.expected);
  if (expectedPass === false) errors.push('migration output does not match expected fixture');
  return { schemaVersion: 1, errors, pass: errors.length === 0, idempotent, expectedPass, output: first.result };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = runMigration(loadJson(options.migration), loadJson(options.input), {
      allowDataLoss: options.allowDataLoss,
      expected: options.expected ? loadJson(options.expected) : undefined
    });
    if (options.write && report.pass) {
      const out = path.resolve(options.out);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, canonicalJson(report.output), 'utf8');
    }
    process.stdout.write(canonicalJson({ ...report, wrote: options.write && report.pass ? path.resolve(options.out) : null }));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
