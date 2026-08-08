import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './measure-rolecard-performance.mjs';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function percentile(values, probability) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(probability * sorted.length) - 1)];
}

export function validateRuntimeSample(sample) {
  const errors = [];
  if (!isObject(sample) || sample.schemaVersion !== 1) errors.push('sample must be a schemaVersion 1 object');
  if (!isObject(sample?.environment)) errors.push('environment must be an object');
  else for (const field of ['sillytavern', 'browser', 'device', 'cardHash']) if (typeof sample.environment[field] !== 'string' || sample.environment[field].trim() === '') errors.push(`environment.${field} must be a non-empty string`);
  if (!Array.isArray(sample?.scenarios) || sample.scenarios.length === 0) errors.push('scenarios must be a non-empty array');
  const ids = new Set();
  const scenarios = [];
  for (const [index, scenario] of (sample?.scenarios ?? []).entries()) {
    const prefix = `scenarios[${index}]`;
    if (!isObject(scenario)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof scenario.id !== 'string' || scenario.id === '') errors.push(`${prefix}.id must be a non-empty string`);
    else if (ids.has(scenario.id)) errors.push(`duplicate scenario id: ${scenario.id}`);
    else ids.add(scenario.id);
    if (!Array.isArray(scenario.samplesMs) || scenario.samplesMs.length < 5 || scenario.samplesMs.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
      errors.push(`${prefix}.samplesMs must contain at least five finite non-negative numbers`);
      continue;
    }
    if (typeof scenario.budgetP95Ms !== 'number' || !Number.isFinite(scenario.budgetP95Ms) || scenario.budgetP95Ms < 0) {
      errors.push(`${prefix}.budgetP95Ms must be a finite non-negative number`);
      continue;
    }
    const p50Ms = percentile(scenario.samplesMs, 0.5);
    const p95Ms = percentile(scenario.samplesMs, 0.95);
    scenarios.push({ id: scenario.id, sampleCount: scenario.samplesMs.length, p50Ms, p95Ms, maxMs: Math.max(...scenario.samplesMs), budgetP95Ms: scenario.budgetP95Ms, pass: p95Ms <= scenario.budgetP95Ms });
  }
  return { schemaVersion: 1, pass: errors.length === 0 && scenarios.every(scenario => scenario.pass), environment: sample?.environment ?? null, scenarios, errors };
}

function main() {
  try {
    const file = process.argv[2];
    if (!file || process.argv.length !== 3) throw new Error('usage: validate-runtime-sample.mjs <sample.json>');
    const report = validateRuntimeSample(JSON.parse(fs.readFileSync(file, 'utf8')));
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
