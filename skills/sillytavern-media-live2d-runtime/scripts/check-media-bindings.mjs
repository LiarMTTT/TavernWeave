import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './validate-media-manifest.mjs';

const EVENTS = new Set(['APP_READY', 'CHAT_CHANGED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'MESSAGE_EDITED', 'MESSAGE_UPDATED', 'MESSAGE_SWIPED', 'CHARACTER_MESSAGE_RENDERED', 'USER_MESSAGE_RENDERED', 'GENERATION_STARTED', 'GENERATION_ENDED', 'PAGEHIDE']);
const ACTIONS = new Set(['preload', 'play-audio', 'pause-audio', 'load-live2d', 'dispose-live2d', 'set-live2d-motion', 'set-live2d-expression', 'show-fallback']);
const TEARDOWN = new Set(['CHAT_CHANGED', 'PAGEHIDE']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function checkBindings(manifest, bindings) {
  const errors = [];
  const warnings = [];
  if (!isObject(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) errors.push('manifest must be a schemaVersion 1 media manifest');
  if (!isObject(bindings) || bindings.schemaVersion !== 1 || !Array.isArray(bindings.bindings)) errors.push('bindings must be a schemaVersion 1 object with bindings');
  if (bindings?.cardId !== manifest?.cardId) errors.push('bindings.cardId must match manifest.cardId');
  if (!Array.isArray(bindings?.requiredCapabilities) || bindings.requiredCapabilities.some(item => typeof item !== 'string')) errors.push('requiredCapabilities must be an array of strings');
  const assets = new Map((manifest?.assets ?? []).map(asset => [asset.id, asset]));
  const byId = new Map();
  for (const [index, binding] of (bindings?.bindings ?? []).entries()) {
    const field = `bindings[${index}]`;
    if (!isObject(binding)) { errors.push(`${field} must be an object`); continue; }
    if (typeof binding.id !== 'string' || binding.id === '') errors.push(`${field}.id must be a non-empty string`);
    else if (byId.has(binding.id)) errors.push(`duplicate binding id: ${binding.id}`);
    else byId.set(binding.id, binding);
    if (!EVENTS.has(binding.event)) errors.push(`${field}.event is unsupported`);
    if (!ACTIONS.has(binding.action)) errors.push(`${field}.action is unsupported`);
    if (['preload', 'play-audio', 'load-live2d', 'set-live2d-motion', 'set-live2d-expression', 'show-fallback'].includes(binding.action) && typeof binding.assetId !== 'string') errors.push(`${field}.assetId is required`);
    const asset = assets.get(binding.assetId);
    if (typeof binding.assetId === 'string' && !asset) errors.push(`${field}.assetId does not exist: ${binding.assetId}`);
    if (binding.action === 'play-audio' && asset?.kind !== 'audio') errors.push(`${field} play-audio must target audio`);
    if (binding.action === 'load-live2d' && asset?.kind !== 'live2d-model') errors.push(`${field} load-live2d must target live2d-model`);
    if (binding.action === 'set-live2d-motion' && asset?.kind !== 'live2d-motion') errors.push(`${field} motion binding must target live2d-motion`);
    if (binding.action === 'set-live2d-expression' && asset?.kind !== 'live2d-expression') errors.push(`${field} expression binding must target live2d-expression`);
    if (['play-audio', 'load-live2d'].includes(binding.action) && (typeof binding.cleanupBindingId !== 'string' || binding.cleanupBindingId === '')) errors.push(`${field}.cleanupBindingId is required`);
  }
  for (const binding of bindings?.bindings ?? []) {
    if (!isObject(binding) || typeof binding.cleanupBindingId !== 'string') continue;
    const cleanup = byId.get(binding.cleanupBindingId);
    if (!cleanup) { errors.push(`cleanup binding not found: ${binding.cleanupBindingId}`); continue; }
    const expected = binding.action === 'play-audio' ? 'pause-audio' : binding.action === 'load-live2d' ? 'dispose-live2d' : null;
    if (expected && cleanup.action !== expected) errors.push(`${binding.id} cleanup must use ${expected}`);
    if (expected && !TEARDOWN.has(cleanup.event)) errors.push(`${binding.id} cleanup must run on CHAT_CHANGED or PAGEHIDE`);
  }
  const capabilities = new Set(bindings?.requiredCapabilities ?? []);
  const usesAudio = (bindings?.bindings ?? []).some(binding => ['play-audio', 'pause-audio'].includes(binding?.action));
  if (usesAudio) for (const symbol of ['TavernHelper.playAudio', 'TavernHelper.pauseAudio']) if (!capabilities.has(symbol)) errors.push(`missing required capability: ${symbol}`);
  const usesLive2D = (bindings?.bindings ?? []).some(binding => typeof binding?.action === 'string' && binding.action.includes('live2d'));
  if (usesLive2D) {
    const runtimeGlobal = manifest?.live2d?.runtimeGlobal;
    if (typeof runtimeGlobal !== 'string' || !capabilities.has(runtimeGlobal)) errors.push('Live2D bindings must require the manifest runtimeGlobal');
    warnings.push('Live2D API calls remain provider-specific and require a real-host probe');
  }
  return { schemaVersion: 1, cardId: manifest?.cardId ?? null, pass: errors.length === 0, bindingCount: bindings?.bindings?.length ?? 0, warnings, errors };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest' || arg === '--bindings') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.manifest || !options.bindings) throw new Error('usage: --manifest <file> --bindings <file>');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
    const report = checkBindings(load(options.manifest), load(options.bindings));
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
