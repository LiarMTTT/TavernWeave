import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './validate-extension-manifest.mjs';

const OWNERS = new Set(['sillytavern', 'tavern-helper', 'provider']);
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareVersion(left, right) {
  const normalize = value => value.split(/[+-]/, 1)[0].split('.').map(Number);
  const a = normalize(left);
  const b = normalize(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

export function checkCapabilities(contract, snapshot) {
  const errors = [];
  const warnings = [];
  if (!isObject(contract) || contract.schemaVersion !== 1) errors.push('contract must be a schemaVersion 1 object');
  if (!isObject(snapshot) || snapshot.schemaVersion !== 1) errors.push('snapshot must be a schemaVersion 1 object');
  if (!isObject(contract?.minimum)) errors.push('contract.minimum must be an object');
  if (!Array.isArray(contract?.requirements)) errors.push('contract.requirements must be an array');
  if (!isObject(snapshot?.versions)) errors.push('snapshot.versions must be an object');
  if (!Array.isArray(snapshot?.symbols) || snapshot.symbols.some(item => typeof item !== 'string')) errors.push('snapshot.symbols must be an array of strings');
  if (typeof snapshot?.capturedAt !== 'string' || Number.isNaN(Date.parse(snapshot.capturedAt))) errors.push('snapshot.capturedAt must be an ISO timestamp');

  const ids = new Set();
  for (const [index, requirement] of (contract?.requirements ?? []).entries()) {
    const prefix = `requirements[${index}]`;
    if (!isObject(requirement)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof requirement.id !== 'string' || requirement.id === '') errors.push(`${prefix}.id must be a non-empty string`);
    else if (ids.has(requirement.id)) errors.push(`duplicate requirement id: ${requirement.id}`);
    else ids.add(requirement.id);
    if (!OWNERS.has(requirement.owner)) errors.push(`${prefix}.owner is unsupported`);
    if (typeof requirement.symbol !== 'string' || requirement.symbol === '') errors.push(`${prefix}.symbol must be a non-empty string`);
    if (typeof requirement.required !== 'boolean') errors.push(`${prefix}.required must be boolean`);
    if (requirement.required === false && (typeof requirement.fallback !== 'string' || requirement.fallback.trim() === '')) {
      errors.push(`${prefix}.fallback is required for optional capabilities`);
    }
  }

  for (const [owner, minimum] of Object.entries(contract?.minimum ?? {})) {
    if (minimum === null) continue;
    if (typeof minimum !== 'string' || !SEMVER.test(minimum)) {
      errors.push(`minimum.${owner} must be semantic version or null`);
      continue;
    }
    const installed = snapshot?.versions?.[owner];
    if (typeof installed !== 'string' || !SEMVER.test(installed)) errors.push(`snapshot version missing or invalid: ${owner}`);
    else if (compareVersion(installed, minimum) < 0) errors.push(`${owner} ${installed} is below minimum ${minimum}`);
  }

  const observed = new Set(snapshot?.symbols ?? []);
  const missingRequired = [];
  const fallbacks = [];
  for (const requirement of contract?.requirements ?? []) {
    if (!isObject(requirement) || typeof requirement.symbol !== 'string' || observed.has(requirement.symbol)) continue;
    if (requirement.required === true) missingRequired.push({ id: requirement.id, owner: requirement.owner, symbol: requirement.symbol });
    else if (requirement.required === false) fallbacks.push({ id: requirement.id, fallback: requirement.fallback });
  }
  if (missingRequired.length) errors.push(`${missingRequired.length} required capabilities were not observed`);
  if (fallbacks.length) warnings.push(`${fallbacks.length} optional capability fallbacks are active`);
  return { schemaVersion: 1, pass: errors.length === 0, capturedAt: snapshot?.capturedAt ?? null, missingRequired, fallbacks, warnings, errors };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--contract' || arg === '--snapshot') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.contract || !options.snapshot) throw new Error('usage: --contract <file> --snapshot <file>');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
    const report = checkCapabilities(load(options.contract), load(options.snapshot));
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
