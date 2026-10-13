import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalJson, loadJson, validateModel } from './validate-rolecard-schema.mjs';

const SURFACES = new Set(['status-bar', 'control-center', 'script', 'prompt']);
const ACCESS = new Set(['read', 'write', 'read-write']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--schema' || arg === '--bindings') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.schema || !options.bindings) throw new Error('usage: --schema <model.json> --bindings <bindings.json>');
  return options;
}

export function validateBindings(model, document) {
  const modelReport = validateModel(model);
  const errors = [...modelReport.errors.map(error => `model: ${error}`)];
  const warnings = [...modelReport.warnings.map(warning => `model: ${warning}`)];
  if (!isObject(document) || document.schemaVersion !== 1) errors.push('bindings must be a schemaVersion 1 object');
  if (document?.modelId !== model?.modelId) errors.push('bindings modelId does not match schema');
  if (!Array.isArray(document?.bindings) || document.bindings.length === 0) errors.push('bindings must be a non-empty array');
  const bindings = Array.isArray(document?.bindings) ? document.bindings : [];
  const ids = new Set();
  const writers = new Map();
  for (const [index, binding] of bindings.entries()) {
    const prefix = `bindings[${index}]`;
    if (!isObject(binding)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof binding.id !== 'string' || binding.id === '') errors.push(`${prefix}.id must be a non-empty string`);
    else if (ids.has(binding.id)) errors.push(`duplicate binding id: ${binding.id}`);
    else ids.add(binding.id);
    if (!SURFACES.has(binding.surface)) errors.push(`${prefix}.surface is unsupported`);
    if (!ACCESS.has(binding.access)) errors.push(`${prefix}.access is unsupported`);
    if (typeof binding.owner !== 'string' || !binding.owner.trim() || binding.owner !== binding.owner.trim()) errors.push(`${prefix}.owner must be a non-empty string without surrounding whitespace`);
    if (!Array.isArray(binding.refreshEvents) || binding.refreshEvents.length === 0 || binding.refreshEvents.some(value => typeof value !== 'string' || value === '')) errors.push(`${prefix}.refreshEvents must be a non-empty array of strings`);
    const table = model?.tables?.[binding.table];
    if (!table) errors.push(`${prefix}.table does not exist: ${binding.table}`);
    else if (!table.fields?.[binding.field]) errors.push(`${prefix}.field does not exist: ${binding.table}.${binding.field}`);
    const phase = binding.writePhase === undefined ? 'runtime' : binding.writePhase;
    if (!['runtime', 'initialization', 'migration'].includes(phase)) errors.push(`${prefix}.writePhase is unsupported`);
    if (binding.access === 'write' || binding.access === 'read-write') {
      if (phase !== 'runtime' && (typeof binding.writeCondition !== 'string' || !binding.writeCondition.trim())) errors.push(`${prefix}.writeCondition must describe the initialization/migration boundary`);
      if (table?.fields?.[binding.field] && typeof binding.owner === 'string' && binding.owner.trim()) {
        const key = JSON.stringify([binding.table, binding.field, phase]);
        const prior = writers.get(key);
        if (prior !== undefined && prior !== binding.owner) errors.push(`${prefix}: competing ${phase} writers for ${binding.table}.${binding.field}: ${prior} and ${binding.owner}`);
        else writers.set(key, binding.owner);
      }
    } else if (binding.writePhase !== undefined || binding.writeCondition !== undefined) errors.push(`${prefix}: read-only binding cannot declare a write phase or condition`);
    for (const key of Object.keys(binding)) if (!['id', 'surface', 'table', 'field', 'access', 'owner', 'refreshEvents', 'writePhase', 'writeCondition'].includes(key)) warnings.push(`${prefix} preserves unknown property ${key}`);
  }
  return { schemaVersion: 1, modelId: model?.modelId ?? null, bindingCount: bindings.length, errors, warnings };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = validateBindings(loadJson(options.schema), JSON.parse(fs.readFileSync(options.bindings, 'utf8')));
    process.stdout.write(canonicalJson({ schema: path.resolve(options.schema), bindings: path.resolve(options.bindings), ...report }));
    if (report.errors.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
