import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './validate-media-manifest.mjs';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function planPreload(manifest, budget) {
  const errors = [];
  const warnings = [];
  if (!isObject(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) errors.push('manifest must be a schemaVersion 1 media manifest');
  if (!isObject(budget) || budget.schemaVersion !== 1 || !isObject(budget.limits)) errors.push('budget must be a schemaVersion 1 object with limits');
  const expectedLimits = ['eagerBytes', 'lazyBytes', 'eagerAssets'];
  for (const limit of expectedLimits) if (!Number.isInteger(budget?.limits?.[limit]) || budget.limits[limit] < 0) errors.push(`limits.${limit} must be a non-negative integer`);
  const totals = { eagerBytes: 0, lazyBytes: 0, onDemandBytes: 0, eagerAssets: 0, lazyAssets: 0, onDemandAssets: 0, unknownBytes: 0 };
  const plan = { eager: [], lazy: [], onDemand: [] };
  for (const asset of manifest?.assets ?? []) {
    const tier = asset.preload === 'on-demand' ? 'onDemand' : asset.preload;
    if (!['eager', 'lazy', 'onDemand'].includes(tier)) { errors.push(`unsupported preload tier for ${asset.id}`); continue; }
    plan[tier].push({ id: asset.id, kind: asset.kind, sourceType: asset.source?.type ?? null, bytes: asset.bytes ?? null });
    totals[`${tier}Assets`] += 1;
    if (Number.isInteger(asset.bytes)) totals[`${tier}Bytes`] += asset.bytes;
    else {
      totals.unknownBytes += 1;
      if (tier === 'eager') errors.push(`eager asset has unknown bytes: ${asset.id}`);
      else warnings.push(`${asset.id} has unknown bytes and remains unverified`);
    }
  }
  for (const tier of Object.values(plan)) tier.sort((a, b) => a.id.localeCompare(b.id));
  if (errors.length === 0) {
    if (totals.eagerBytes > budget.limits.eagerBytes) errors.push(`eagerBytes ${totals.eagerBytes} exceeds ${budget.limits.eagerBytes}`);
    if (totals.lazyBytes > budget.limits.lazyBytes) errors.push(`lazyBytes ${totals.lazyBytes} exceeds ${budget.limits.lazyBytes}`);
    if (totals.eagerAssets > budget.limits.eagerAssets) errors.push(`eagerAssets ${totals.eagerAssets} exceeds ${budget.limits.eagerAssets}`);
  }
  return { schemaVersion: 1, cardId: manifest?.cardId ?? null, pass: errors.length === 0, totals, plan, warnings, errors, networkRequests: 0 };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest' || arg === '--budget') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.manifest || !options.budget) throw new Error('usage: --manifest <file> --budget <file>');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
    const report = planPreload(load(options.manifest), load(options.budget));
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
