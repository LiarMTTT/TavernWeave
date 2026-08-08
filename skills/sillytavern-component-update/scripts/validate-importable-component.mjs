import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { canonicalJson, validateComponentValue } from './plan-component-update.mjs';

function fileHash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function detectKind(value) {
  if (value?.type === 'script') return 'helper-script';
  if (value?.type === 'folder') return 'helper-folder';
  if (value && typeof value === 'object' && 'findRegex' in value && 'placement' in value) return 'regex';
  return null;
}

export function validateFile(file, expectedKind) {
  const errors = [];
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return { file, kind: expectedKind ?? null, errors: [`invalid UTF-8 JSON: ${error.message}`] };
  }
  const kind = expectedKind ?? detectKind(value);
  if (!kind) errors.push('unable to detect component kind');
  else errors.push(...validateComponentValue(kind, value, path.basename(file)));
  return { file, kind, errors };
}

export function validateTarget(target) {
  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) return { schemaVersion: 1, target: resolved, errors: ['target does not exist'], files: [] };
  if (fs.statSync(resolved).isFile()) {
    const result = validateFile(resolved);
    return { schemaVersion: 1, target: resolved, errors: [...result.errors], files: [result] };
  }

  const manifestPath = path.join(resolved, 'component-update-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { schemaVersion: 1, target: resolved, errors: ['missing component-update-manifest.json'], files: [] };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { schemaVersion: 1, target: resolved, errors: [`invalid manifest JSON: ${error.message}`], files: [] };
  }
  const errors = [];
  const files = [];
  if (manifest.schemaVersion !== 1) errors.push('manifest schemaVersion must be 1');
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) errors.push('manifest artifacts must be non-empty');
  const seenIds = new Set();
  for (const artifact of manifest.artifacts ?? []) {
    const file = path.resolve(resolved, artifact.relativePath ?? '');
    if (!file.startsWith(`${resolved}${path.sep}`)) {
      errors.push(`artifact escapes target: ${artifact.relativePath}`);
      continue;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      errors.push(`missing artifact: ${artifact.relativePath}`);
      continue;
    }
    if (fileHash(file) !== artifact.sha256) errors.push(`hash mismatch: ${artifact.relativePath}`);
    if (seenIds.has(artifact.id)) errors.push(`duplicate manifest id: ${artifact.id}`);
    seenIds.add(artifact.id);
    const result = validateFile(file, artifact.kind);
    files.push(result);
    errors.push(...result.errors.map(error => `${artifact.relativePath}: ${error}`));
  }
  if (manifest.deliveryMode === 'component' && fs.existsSync(path.join(resolved, 'assembly-handoff.json'))) {
    errors.push('component mode must not include assembly-handoff.json');
  }
  if (manifest.deliveryMode === 'full-card' && !fs.existsSync(path.join(resolved, 'assembly-handoff.json'))) {
    errors.push('full-card mode requires assembly-handoff.json');
  }
  const forbidden = fs.readdirSync(resolved).filter(name => /\.png$/i.test(name) || /(?:^|\.)card\.json$/i.test(name));
  if (manifest.deliveryMode === 'component' && forbidden.length) errors.push(`component mode contains forbidden card artifacts: ${forbidden.join(', ')}`);
  return { schemaVersion: 1, target: resolved, deliveryMode: manifest.deliveryMode, errors, files };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    process.stderr.write('usage: validate-importable-component.mjs <file-or-directory>\n');
    process.exitCode = 1;
    return;
  }
  const report = validateTarget(target);
  process.stdout.write(canonicalJson(report));
  if (report.errors.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
