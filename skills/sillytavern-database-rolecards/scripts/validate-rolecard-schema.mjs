import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FIELD_TYPES = new Set(['string', 'number', 'boolean', 'object', 'array']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function defaultMatches(type, value) {
  if (value === undefined) return true;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isObject(value);
  return typeof value === type;
}

export function validateModel(model) {
  const errors = [];
  const warnings = [];
  if (!isObject(model)) return { schemaVersion: 1, errors: ['model must be an object'], warnings, tableCount: 0, fieldCount: 0 };
  if (model.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (typeof model.modelId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(model.modelId)) errors.push('modelId must be a lowercase portable ID');
  if (typeof model.modelVersion !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(model.modelVersion)) errors.push('modelVersion must be semantic version text');
  if (!isObject(model.storage)) errors.push('storage must be an object');
  else {
    if (model.storage.scope !== 'message') errors.push('storage.scope must be message for first-batch support');
    if (typeof model.storage.root !== 'string' || !model.storage.root.startsWith('stat_data.')) errors.push('storage.root must begin with stat_data.');
    if (model.storage.strategy !== 'multi-floor') {
      if (model.storage.strategy === 'same-floor') errors.push('DBR-C8-UNVERIFIED: same-floor storage is not supported');
      else errors.push('storage.strategy must be multi-floor');
    }
  }
  if (!isObject(model.tables) || Object.keys(model.tables).length === 0) errors.push('tables must be a non-empty object');
  let fieldCount = 0;
  for (const [tableName, table] of Object.entries(model.tables ?? {})) {
    const prefix = `tables.${tableName}`;
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(tableName)) errors.push(`${prefix} has an invalid table name`);
    if (!isObject(table)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof table.primaryKey !== 'string' || table.primaryKey === '') errors.push(`${prefix}.primaryKey must be a non-empty string`);
    if (!isObject(table.fields) || Object.keys(table.fields).length === 0) {
      errors.push(`${prefix}.fields must be a non-empty object`);
      continue;
    }
    fieldCount += Object.keys(table.fields).length;
    for (const [fieldName, field] of Object.entries(table.fields)) {
      const fieldPrefix = `${prefix}.fields.${fieldName}`;
      if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(fieldName)) errors.push(`${fieldPrefix} has an invalid field name`);
      if (!isObject(field)) {
        errors.push(`${fieldPrefix} must be an object`);
        continue;
      }
      if (!FIELD_TYPES.has(field.type)) errors.push(`${fieldPrefix}.type is unsupported`);
      if (field.required !== undefined && typeof field.required !== 'boolean') errors.push(`${fieldPrefix}.required must be boolean when present`);
      if (FIELD_TYPES.has(field.type) && !defaultMatches(field.type, field.default)) errors.push(`${fieldPrefix}.default does not match ${field.type}`);
      for (const key of Object.keys(field)) if (!['type', 'required', 'default', 'description'].includes(key)) warnings.push(`${fieldPrefix} preserves unknown property ${key}`);
    }
    const primary = table.fields[table.primaryKey];
    if (!primary) errors.push(`${prefix}.primaryKey does not reference a declared field`);
    else {
      if (primary.required !== true) errors.push(`${prefix} primary key must be required`);
      if (!['string', 'number'].includes(primary.type)) errors.push(`${prefix} primary key must use string or number`);
    }
  }
  return { schemaVersion: 1, modelId: model.modelId ?? null, modelVersion: model.modelVersion ?? null, tableCount: Object.keys(model.tables ?? {}).length, fieldCount, errors, warnings };
}

export function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    process.stderr.write('usage: validate-rolecard-schema.mjs <model.json>\n');
    process.exitCode = 1;
    return;
  }
  try {
    const report = validateModel(loadJson(file));
    process.stdout.write(canonicalJson({ file: path.resolve(file), ...report }));
    if (report.errors.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
