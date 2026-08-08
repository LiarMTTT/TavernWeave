import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './measure-rolecard-performance.mjs';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateMetricMap(map, name, report, errors) {
  if (!isObject(map)) {
    errors.push(`${name} must be an object`);
    return;
  }
  for (const [metric, threshold] of Object.entries(map)) {
    if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0) errors.push(`${name}.${metric} must be a finite non-negative number`);
    if (typeof report?.metrics?.[metric] !== 'number') errors.push(`${name}.${metric} is not emitted by the report`);
  }
}

export function checkBudget(report, budget, baseline = null) {
  const errors = [];
  if (!isObject(report) || report.schemaVersion !== 1 || !isObject(report.metrics)) errors.push('report must contain schemaVersion 1 metrics');
  if (!isObject(budget) || budget.schemaVersion !== 1) errors.push('budget must be a schemaVersion 1 object');
  validateMetricMap(budget?.limits, 'limits', report, errors);
  validateMetricMap(budget?.maxGrowth, 'maxGrowth', report, errors);
  if (Object.keys(budget?.maxGrowth ?? {}).length && (!isObject(baseline) || baseline.schemaVersion !== 1 || !isObject(baseline.metrics))) {
    errors.push('baseline report is required when maxGrowth is declared');
  }
  const violations = [];
  if (errors.length === 0) {
    for (const [metric, limit] of Object.entries(budget.limits)) {
      const actual = report.metrics[metric];
      if (actual > limit) violations.push({ type: 'limit', metric, actual, allowed: limit, delta: actual - limit });
    }
    for (const [metric, allowed] of Object.entries(budget.maxGrowth)) {
      const actual = report.metrics[metric];
      const previous = baseline.metrics[metric];
      if (typeof previous !== 'number') errors.push(`baseline metric missing: ${metric}`);
      else if (actual - previous > allowed) violations.push({ type: 'growth', metric, actual, baseline: previous, allowed, delta: actual - previous });
    }
  }
  return {
    schemaVersion: 1,
    pass: errors.length === 0 && violations.length === 0,
    candidateSha256: report?.identity?.sha256 ?? null,
    baselineSha256: baseline?.identity?.sha256 ?? null,
    violations,
    errors
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (['--report', '--budget', '--baseline'].includes(arg)) options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.report || !options.budget) throw new Error('usage: --report <file> --budget <file> [--baseline file]');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
    const report = checkBudget(load(options.report), load(options.budget), options.baseline ? load(options.baseline) : null);
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
