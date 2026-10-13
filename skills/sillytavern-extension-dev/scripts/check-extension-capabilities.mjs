import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './validate-extension-manifest.mjs';

const OWNERS = new Set(['sillytavern', 'tavern-helper', 'provider']);
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseVersion(value) {
  const match = typeof value === 'string' ? SEMVER.exec(value) : null;
  if (!match) return null;
  const prerelease = match[4]?.split('.') ?? [];
  if (prerelease.some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) return null;
  return { core: match.slice(1, 4), prerelease };
}

function compareNumeric(left, right) {
  return left.length !== right.length ? left.length - right.length : left < right ? -1 : left > right ? 1 : 0;
}

function compareVersion(a, b) {
  for (let index = 0; index < 3; index += 1) {
    const difference = compareNumeric(a.core[index], b.core[index]);
    if (difference) return difference;
  }
  if (!a.prerelease.length || !b.prerelease.length) return Number(!a.prerelease.length) - Number(!b.prerelease.length);
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index += 1) {
    if (a.prerelease[index] === undefined) return -1;
    if (b.prerelease[index] === undefined) return 1;
    const left = a.prerelease[index];
    const right = b.prerelease[index];
    if (left === right) continue;
    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric) return compareNumeric(left, right);
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return left < right ? -1 : 1;
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

  for (const [owner, version] of Object.entries(snapshot?.versions ?? {})) {
    if (version !== null && !parseVersion(version)) errors.push(`snapshot version missing or invalid: ${owner}`);
  }
  for (const [owner, minimum] of Object.entries(contract?.minimum ?? {})) {
    if (minimum === null) continue;
    const minimumVersion = parseVersion(minimum);
    if (!minimumVersion) {
      errors.push(`minimum.${owner} must be semantic version or null`);
      continue;
    }
    const installed = snapshot?.versions?.[owner];
    const installedVersion = parseVersion(installed);
    if (!installedVersion) {
      const message = `snapshot version missing or invalid: ${owner}`;
      if (!errors.includes(message)) errors.push(message);
    } else if (compareVersion(installedVersion, minimumVersion) < 0) errors.push(`${owner} ${installed} is below minimum ${minimum}`);
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
