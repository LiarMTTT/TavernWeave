import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CARD_FIELDS = new Set(['id', 'scriptName', 'findRegex', 'replaceString', 'trimStrings', 'placement', 'disabled', 'markdownOnly', 'promptOnly', 'runOnEdit', 'substituteRegex', 'minDepth', 'maxDepth']);
const HELPER_FIELDS = new Set(['id', 'script_name', 'enabled', 'find_regex', 'replace_string', 'trim_strings', 'source', 'destination', 'run_on_edit', 'min_depth', 'max_depth', 'scope']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
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

export function detectDialect(rule) {
  if (isObject(rule) && ('scriptName' in rule || 'findRegex' in rule)) return 'card';
  if (isObject(rule) && ('script_name' in rule || 'find_regex' in rule)) return 'helper';
  return null;
}

function validateDepth(minimum, maximum, prefix, errors) {
  for (const [name, value] of [['minimum', minimum], ['maximum', maximum]]) {
    if (value !== undefined && value !== null && !Number.isInteger(value)) errors.push(`${prefix} ${name} depth must be an integer or null`);
  }
  if (Number.isInteger(minimum) && Number.isInteger(maximum) && minimum > maximum) errors.push(`${prefix} minimum depth exceeds maximum depth`);
}

function validateCard(rule, prefix, errors, warnings) {
  for (const field of ['id', 'scriptName', 'findRegex', 'replaceString']) {
    if (typeof rule[field] !== 'string' || rule[field].trim() === '') errors.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!Array.isArray(rule.trimStrings) || rule.trimStrings.some(value => typeof value !== 'string')) errors.push(`${prefix}.trimStrings must be an array of strings`);
  if (!Array.isArray(rule.placement) || rule.placement.some(value => !Number.isInteger(value))) errors.push(`${prefix}.placement must be an array of integers`);
  for (const field of ['disabled', 'markdownOnly', 'promptOnly', 'runOnEdit']) {
    if (rule[field] !== undefined && typeof rule[field] !== 'boolean') errors.push(`${prefix}.${field} must be boolean when present`);
  }
  if (rule.markdownOnly === true && rule.promptOnly === true) errors.push(`${prefix} cannot set markdownOnly and promptOnly true together`);
  if (rule.substituteRegex !== undefined && !Number.isInteger(rule.substituteRegex)) errors.push(`${prefix}.substituteRegex must be an integer`);
  validateDepth(rule.minDepth, rule.maxDepth, prefix, errors);
  for (const field of Object.keys(rule)) if (!CARD_FIELDS.has(field)) warnings.push(`${prefix} preserves unknown field ${field}`);
  try { parseRegex(rule.findRegex); } catch (error) { errors.push(`${prefix}.findRegex does not compile: ${error.message}`); }
}

function validateHelper(rule, prefix, errors, warnings) {
  for (const field of ['id', 'script_name', 'find_regex', 'replace_string']) {
    if (typeof rule[field] !== 'string' || rule[field].trim() === '') errors.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (typeof rule.enabled !== 'boolean') errors.push(`${prefix}.enabled must be boolean`);
  if (!Array.isArray(rule.trim_strings) || rule.trim_strings.some(value => typeof value !== 'string')) errors.push(`${prefix}.trim_strings must be an array of strings`);
  const sourceFields = ['user_input', 'ai_output', 'slash_command', 'world_info'];
  if (!isObject(rule.source)) errors.push(`${prefix}.source must be an object`);
  else for (const field of sourceFields) if (typeof rule.source[field] !== 'boolean') errors.push(`${prefix}.source.${field} must be boolean`);
  if (!isObject(rule.destination)) errors.push(`${prefix}.destination must be an object`);
  else for (const field of ['display', 'prompt']) if (typeof rule.destination[field] !== 'boolean') errors.push(`${prefix}.destination.${field} must be boolean`);
  if (typeof rule.run_on_edit !== 'boolean') errors.push(`${prefix}.run_on_edit must be boolean`);
  validateDepth(rule.min_depth, rule.max_depth, prefix, errors);
  for (const field of Object.keys(rule)) if (!HELPER_FIELDS.has(field)) warnings.push(`${prefix} preserves unknown field ${field}`);
  try { parseRegex(rule.find_regex); } catch (error) { errors.push(`${prefix}.find_regex does not compile: ${error.message}`); }
}

export function validateRules(value) {
  const rules = Array.isArray(value) ? value : [value];
  const errors = [];
  const warnings = [];
  const ids = new Set();
  if (rules.length === 0) errors.push('regex input must contain at least one rule');
  rules.forEach((rule, index) => {
    const prefix = `rules[${index}]`;
    const dialect = detectDialect(rule);
    if (!dialect) {
      errors.push(`${prefix} has no recognized regex dialect`);
      return;
    }
    if (dialect === 'card') validateCard(rule, prefix, errors, warnings);
    else validateHelper(rule, prefix, errors, warnings);
    if (typeof rule.id === 'string') {
      if (ids.has(rule.id)) errors.push(`duplicate regex id: ${rule.id}`);
      ids.add(rule.id);
    }
  });
  return { schemaVersion: 1, ruleCount: rules.length, errors, warnings, rules };
}

export function loadRules(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    process.stderr.write('usage: validate-tavern-regex.mjs <regex.json>\n');
    process.exitCode = 1;
    return;
  }
  try {
    const report = validateRules(loadRules(file));
    const { rules, ...printable } = report;
    process.stdout.write(canonicalJson({ file: path.resolve(file), ...printable }));
    if (report.errors.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
