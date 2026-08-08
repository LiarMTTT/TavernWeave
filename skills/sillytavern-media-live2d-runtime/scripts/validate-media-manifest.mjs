import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const KINDS = new Set(['audio', 'image', 'video', 'multimodal', 'live2d-model', 'live2d-motion', 'live2d-expression']);
const PRELOAD = new Set(['eager', 'lazy', 'on-demand']);
const LIFETIMES = new Set(['card', 'chat', 'message']);
const MODES = new Set(['repeat_one', 'repeat_all', 'shuffle', 'play_one_and_stop']);
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/i;

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function localFile(root, relative, field, errors) {
  if (typeof relative !== 'string' || relative.trim() === '' || path.isAbsolute(relative)) {
    errors.push(`${field} must be a non-empty relative path`);
    return null;
  }
  const resolved = path.resolve(root, relative);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) {
    errors.push(`${field} escapes the media root`);
    return null;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) errors.push(`${field} does not name an existing file`);
  return resolved;
}

function validateAudioSettings(settings, field, errors) {
  if (!isObject(settings)) return errors.push(`${field} must be an object`);
  if (typeof settings.enabled !== 'boolean') errors.push(`${field}.enabled must be boolean`);
  if (!MODES.has(settings.mode)) errors.push(`${field}.mode is unsupported`);
  if (typeof settings.muted !== 'boolean') errors.push(`${field}.muted must be boolean`);
  if (typeof settings.volume !== 'number' || !Number.isFinite(settings.volume) || settings.volume < 0 || settings.volume > 100) errors.push(`${field}.volume must be between 0 and 100`);
}

export function validateMediaManifest(manifest, rootDirectory = null) {
  const errors = [];
  const warnings = [];
  const assets = [];
  const root = rootDirectory ? path.resolve(rootDirectory) : null;
  if (!isObject(manifest) || manifest.schemaVersion !== 1) errors.push('manifest must be a schemaVersion 1 object');
  if (typeof manifest?.cardId !== 'string' || !ID.test(manifest.cardId)) errors.push('cardId must be a stable ID');
  if (!Array.isArray(manifest?.assets) || manifest.assets.length === 0) errors.push('assets must be a non-empty array');
  if (root && (!fs.existsSync(root) || !fs.statSync(root).isDirectory())) errors.push('root must be an existing directory');
  const ids = new Set();
  const byId = new Map();
  for (const [index, asset] of (manifest?.assets ?? []).entries()) {
    const field = `assets[${index}]`;
    if (!isObject(asset)) {
      errors.push(`${field} must be an object`);
      continue;
    }
    if (typeof asset.id !== 'string' || !ID.test(asset.id)) errors.push(`${field}.id must be a stable ID`);
    else if (ids.has(asset.id)) errors.push(`duplicate asset id: ${asset.id}`);
    else { ids.add(asset.id); byId.set(asset.id, asset); }
    if (!KINDS.has(asset.kind)) errors.push(`${field}.kind is unsupported`);
    if (!PRELOAD.has(asset.preload)) errors.push(`${field}.preload is unsupported`);
    if (!LIFETIMES.has(asset.lifetime)) errors.push(`${field}.lifetime is unsupported`);
    if (asset.fallbackAssetId !== null && asset.fallbackAssetId !== undefined && (typeof asset.fallbackAssetId !== 'string' || !ID.test(asset.fallbackAssetId))) errors.push(`${field}.fallbackAssetId must be a stable ID or null`);
    if (asset.fallbackAssetId === asset.id) errors.push(`${field}.fallbackAssetId cannot refer to itself`);
    if (!isObject(asset.source) || !['local', 'remote'].includes(asset.source.type)) {
      errors.push(`${field}.source must be local or remote`);
      continue;
    }
    if (asset.bytes !== undefined && (!Number.isInteger(asset.bytes) || asset.bytes < 0)) errors.push(`${field}.bytes must be a non-negative integer`);
    if (asset.sha256 !== undefined && (typeof asset.sha256 !== 'string' || !SHA256.test(asset.sha256))) errors.push(`${field}.sha256 must be a SHA-256 hex digest`);
    let verified = false;
    let actualBytes = null;
    let actualSha256 = null;
    if (asset.source.type === 'local') {
      if (asset.bytes === undefined || asset.sha256 === undefined) errors.push(`${field} local assets require bytes and sha256`);
      if (root) {
        const resolved = localFile(root, asset.source.path, `${field}.source.path`, errors);
        if (resolved && fs.existsSync(resolved)) {
          const content = fs.readFileSync(resolved);
          actualBytes = content.length;
          actualSha256 = crypto.createHash('sha256').update(content).digest('hex');
          if (asset.bytes !== actualBytes) errors.push(`${field}.bytes does not match local file`);
          if (typeof asset.sha256 === 'string' && asset.sha256.toLowerCase() !== actualSha256) errors.push(`${field}.sha256 does not match local file`);
          verified = asset.bytes === actualBytes && typeof asset.sha256 === 'string' && asset.sha256.toLowerCase() === actualSha256;
        }
      } else warnings.push(`${asset.id ?? field} local bytes were not verified because no root was supplied`);
    } else {
      try {
        const url = new URL(asset.source.url);
        if (url.protocol !== 'https:') errors.push(`${field}.source.url must use HTTPS`);
      } catch { errors.push(`${field}.source.url must be an absolute HTTPS URL`); }
      warnings.push(`${asset.id ?? field} remote source was not contacted`);
    }
    assets.push({ id: asset.id ?? null, kind: asset.kind ?? null, sourceType: asset.source.type, preload: asset.preload ?? null, lifetime: asset.lifetime ?? null, declaredBytes: asset.bytes ?? null, actualBytes, actualSha256, verified });
  }
  for (const asset of manifest?.assets ?? []) {
    if (typeof asset?.fallbackAssetId === 'string' && !byId.has(asset.fallbackAssetId)) errors.push(`fallback asset not found: ${asset.fallbackAssetId}`);
  }

  if (manifest?.audio !== undefined) {
    if (!isObject(manifest.audio)) errors.push('audio must be an object');
    else {
      for (const channel of ['bgm', 'ambient']) {
        const list = manifest.audio[channel] ?? [];
        if (!Array.isArray(list) || list.some(id => typeof id !== 'string')) errors.push(`audio.${channel} must be an array of asset IDs`);
        else for (const id of list) if (byId.get(id)?.kind !== 'audio') errors.push(`audio.${channel} references a missing or non-audio asset: ${id}`);
      }
      if (manifest.audio.settings !== undefined) {
        if (!isObject(manifest.audio.settings)) errors.push('audio.settings must be an object');
        else for (const [channel, settings] of Object.entries(manifest.audio.settings)) {
          if (!['bgm', 'ambient'].includes(channel)) errors.push(`unsupported audio settings channel: ${channel}`);
          else validateAudioSettings(settings, `audio.settings.${channel}`, errors);
        }
      }
    }
  }

  const hasLive2D = [...byId.values()].some(asset => typeof asset.kind === 'string' && asset.kind.startsWith('live2d-'));
  if (hasLive2D || manifest?.live2d !== undefined) {
    if (!isObject(manifest?.live2d)) errors.push('live2d block is required for Live2D assets');
    else {
      for (const field of ['provider', 'runtimeGlobal', 'versionProbe']) if (typeof manifest.live2d[field] !== 'string' || manifest.live2d[field].trim() === '') errors.push(`live2d.${field} must be a non-empty string`);
      if (!Array.isArray(manifest.live2d.modelAssetIds) || manifest.live2d.modelAssetIds.length === 0) errors.push('live2d.modelAssetIds must be a non-empty array');
      else for (const id of manifest.live2d.modelAssetIds) if (byId.get(id)?.kind !== 'live2d-model') errors.push(`live2d model is missing or wrong kind: ${id}`);
      if (typeof manifest.live2d.fallbackAssetId !== 'string' || !['image', 'video'].includes(byId.get(manifest.live2d.fallbackAssetId)?.kind)) errors.push('live2d.fallbackAssetId must reference an image or video asset');
    }
  }
  return { schemaVersion: 1, cardId: manifest?.cardId ?? null, pass: errors.length === 0, assets, warnings, errors };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest' || arg === '--root') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.manifest) throw new Error('usage: --manifest <file> [--root media-root]');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const manifest = JSON.parse(fs.readFileSync(options.manifest, 'utf8'));
    const report = validateMediaManifest(manifest, options.root ?? null);
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
