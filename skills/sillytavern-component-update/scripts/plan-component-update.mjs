import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const KINDS = new Set(['regex', 'helper-script', 'helper-folder']);
const MODES = new Set(['component', 'full-card']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, field, errors) {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`${field} must be a non-empty string`);
}

function requireBoolean(value, field, errors) {
  if (typeof value !== 'boolean') errors.push(`${field} must be a boolean`);
}

function validateDepth(value, field, errors) {
  if (value !== null && value !== undefined && !Number.isInteger(value)) {
    errors.push(`${field} must be an integer or null`);
  }
}

export function parseRegex(value) {
  if (typeof value !== 'string') throw new TypeError('regex source must be a string');
  if (!value.startsWith('/')) return new RegExp(value);
  let end = -1;
  for (let index = value.length - 1; index > 0; index -= 1) {
    if (value[index] !== '/') continue;
    let slashes = 0;
    for (let before = index - 1; before >= 0 && value[before] === '\\'; before -= 1) slashes += 1;
    if (slashes % 2 === 0) {
      end = index;
      break;
    }
  }
  if (end < 1) throw new SyntaxError('invalid regex literal');
  return new RegExp(value.slice(1, end), value.slice(end + 1));
}

function validateRegex(value, errors, prefix) {
  if (!isObject(value)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ['id', 'scriptName', 'findRegex', 'replaceString']) requireString(value[field], `${prefix}.${field}`, errors);
  if (!Array.isArray(value.trimStrings) || value.trimStrings.some(item => typeof item !== 'string')) {
    errors.push(`${prefix}.trimStrings must be an array of strings`);
  }
  if (!Array.isArray(value.placement) || value.placement.some(item => !Number.isInteger(item))) {
    errors.push(`${prefix}.placement must be an array of integers`);
  }
  for (const field of ['disabled', 'markdownOnly', 'promptOnly', 'runOnEdit']) {
    requireBoolean(value[field], `${prefix}.${field}`, errors);
  }
  if (!Number.isInteger(value.substituteRegex)) errors.push(`${prefix}.substituteRegex must be an integer`);
  validateDepth(value.minDepth, `${prefix}.minDepth`, errors);
  validateDepth(value.maxDepth, `${prefix}.maxDepth`, errors);
  if (Number.isInteger(value.minDepth) && Number.isInteger(value.maxDepth) && value.minDepth > value.maxDepth) {
    errors.push(`${prefix}.minDepth must not exceed maxDepth`);
  }
  if (value.markdownOnly === true && value.promptOnly === true) {
    errors.push(`${prefix}.markdownOnly and promptOnly cannot both be true`);
  }
  try {
    parseRegex(value.findRegex);
  } catch (error) {
    errors.push(`${prefix}.findRegex does not compile: ${error.message}`);
  }
}

function validateScript(value, errors, prefix) {
  if (!isObject(value)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (value.type !== 'script') errors.push(`${prefix}.type must be "script"`);
  requireBoolean(value.enabled, `${prefix}.enabled`, errors);
  for (const field of ['name', 'id', 'content', 'info']) {
    if (field === 'info') {
      if (typeof value[field] !== 'string') errors.push(`${prefix}.${field} must be a string`);
    } else {
      requireString(value[field], `${prefix}.${field}`, errors);
    }
  }
  if (!isObject(value.button)) {
    errors.push(`${prefix}.button must be an object`);
  } else {
    requireBoolean(value.button.enabled, `${prefix}.button.enabled`, errors);
    if (!Array.isArray(value.button.buttons)) {
      errors.push(`${prefix}.button.buttons must be an array`);
    } else {
      value.button.buttons.forEach((button, index) => {
        if (!isObject(button)) return errors.push(`${prefix}.button.buttons[${index}] must be an object`);
        requireString(button.name, `${prefix}.button.buttons[${index}].name`, errors);
        requireBoolean(button.visible, `${prefix}.button.buttons[${index}].visible`, errors);
      });
    }
  }
  if (!isObject(value.data)) errors.push(`${prefix}.data must be an object`);
  if (!isObject(value.export_with)) {
    errors.push(`${prefix}.export_with must be an object`);
  } else {
    requireBoolean(value.export_with.data, `${prefix}.export_with.data`, errors);
    requireBoolean(value.export_with.button, `${prefix}.export_with.button`, errors);
  }
}

function validateFolder(value, errors, prefix) {
  if (!isObject(value)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (value.type !== 'folder') errors.push(`${prefix}.type must be "folder"`);
  requireBoolean(value.enabled, `${prefix}.enabled`, errors);
  for (const field of ['name', 'id']) requireString(value[field], `${prefix}.${field}`, errors);
  for (const field of ['icon', 'color']) {
    if (typeof value[field] !== 'string') errors.push(`${prefix}.${field} must be a string`);
  }
  if (!Array.isArray(value.scripts) || value.scripts.length === 0) {
    errors.push(`${prefix}.scripts must be a non-empty array`);
    return;
  }
  const ids = new Set();
  value.scripts.forEach((script, index) => {
    validateScript(script, errors, `${prefix}.scripts[${index}]`);
    if (isObject(script) && typeof script.id === 'string') {
      if (ids.has(script.id)) errors.push(`${prefix}.scripts contains duplicate id ${script.id}`);
      ids.add(script.id);
    }
  });
}

export function validateComponentValue(kind, value, prefix = 'value') {
  const errors = [];
  if (kind === 'regex') validateRegex(value, errors, prefix);
  else if (kind === 'helper-script') validateScript(value, errors, prefix);
  else if (kind === 'helper-folder') validateFolder(value, errors, prefix);
  else errors.push(`unsupported kind: ${kind}`);
  return errors;
}

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function artifactSuffix(kind) {
  return { regex: 'regex', 'helper-script': 'script', 'helper-folder': 'folder' }[kind];
}

export function planSpec(spec, outDirectory) {
  const errors = [];
  if (!isObject(spec)) return { errors: ['spec must be a JSON object'], plan: null };
  if (spec.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!MODES.has(spec.deliveryMode)) errors.push('deliveryMode must be component or full-card');
  if (!KINDS.has(spec.kind)) errors.push('kind must be regex, helper-script, or helper-folder');
  if (!Array.isArray(spec.items) || spec.items.length === 0) errors.push('items must be a non-empty array');

  const names = new Set();
  const ids = new Set();
  const files = [];
  if (Array.isArray(spec.items) && KINDS.has(spec.kind)) {
    spec.items.forEach((item, index) => {
      const prefix = `items[${index}]`;
      if (!isObject(item)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (typeof item.artifactName !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.artifactName)) {
        errors.push(`${prefix}.artifactName must be a lowercase portable filename stem`);
      } else if (names.has(item.artifactName)) {
        errors.push(`duplicate artifactName: ${item.artifactName}`);
      } else {
        names.add(item.artifactName);
        files.push(`${item.artifactName}.${artifactSuffix(spec.kind)}.json`);
      }
      errors.push(...validateComponentValue(spec.kind, item.value, `${prefix}.value`));
      const id = isObject(item.value) ? item.value.id : undefined;
      if (typeof id === 'string') {
        if (ids.has(id)) errors.push(`duplicate component id: ${id}`);
        ids.add(id);
      }
    });
  }

  if (spec.deliveryMode === 'full-card') {
    if (!isObject(spec.assembly)) errors.push('full-card mode requires assembly');
    else {
      for (const field of ['targetCard', 'componentId', 'expectedUntouchedHash']) {
        requireString(spec.assembly[field], `assembly.${field}`, errors);
      }
      if (typeof spec.assembly.expectedUntouchedHash === 'string' && !/^[a-f0-9]{64}$/i.test(spec.assembly.expectedUntouchedHash)) {
        errors.push('assembly.expectedUntouchedHash must be a SHA-256 hex digest');
      }
    }
  } else if (spec.assembly !== undefined) {
    errors.push('component mode must not include assembly');
  }

  const outRoot = path.resolve(outDirectory);
  const planned = [...files, 'component-update-manifest.json'];
  if (spec.deliveryMode === 'full-card') planned.push('assembly-handoff.json');
  for (const relative of planned) {
    const resolved = path.resolve(outRoot, relative);
    if (resolved !== outRoot && !resolved.startsWith(`${outRoot}${path.sep}`)) errors.push(`output escapes staging root: ${relative}`);
    if (/\.(?:png|card\.json)$/i.test(relative)) errors.push(`forbidden direct card output: ${relative}`);
  }

  return {
    errors,
    plan: errors.length ? null : {
      schemaVersion: 1,
      deliveryMode: spec.deliveryMode,
      kind: spec.kind,
      outRoot,
      files: planned,
      requiresPipeline: spec.deliveryMode === 'full-card'
    }
  };
}

export function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--spec' || arg === '--out') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.spec || !options.out) throw new Error('usage: --spec <file> --out <directory>');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const spec = loadJson(options.spec);
    const result = planSpec(spec, options.out);
    process.stdout.write(canonicalJson(result));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
