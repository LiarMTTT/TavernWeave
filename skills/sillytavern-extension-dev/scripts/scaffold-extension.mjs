import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './validate-extension-manifest.mjs';

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateSpec(spec) {
  const errors = [];
  if (!isObject(spec) || spec.schemaVersion !== 1) errors.push('spec must be a schemaVersion 1 object');
  if (typeof spec?.id !== 'string' || !ID_PATTERN.test(spec.id)) errors.push('id must be a stable lowercase extension identifier');
  for (const field of ['displayName', 'author']) if (typeof spec?.[field] !== 'string' || spec[field].trim() === '') errors.push(`${field} must be a non-empty string`);
  if (typeof spec?.version !== 'string' || !SEMVER.test(spec.version)) errors.push('version must be semantic version');
  if (spec?.minimumClientVersion !== undefined && (typeof spec.minimumClientVersion !== 'string' || !SEMVER.test(spec.minimumClientVersion))) errors.push('minimumClientVersion must be semantic version');
  if (spec?.loadingOrder !== undefined && !Number.isInteger(spec.loadingOrder)) errors.push('loadingOrder must be an integer');
  if (spec?.withCss !== undefined && typeof spec.withCss !== 'boolean') errors.push('withCss must be boolean');
  if (spec?.autoUpdate !== undefined && typeof spec.autoUpdate !== 'boolean') errors.push('autoUpdate must be boolean');
  if (spec?.homePage !== undefined) {
    try { new URL(spec.homePage); } catch { errors.push('homePage must be an absolute URL'); }
  }
  if (spec?.requirements !== undefined && !Array.isArray(spec.requirements)) errors.push('requirements must be an array');
  return errors;
}

function entrySource(id) {
  return `const MODULE_ID = ${JSON.stringify(id)};\nconst DEFAULT_SETTINGS = Object.freeze({ enabled: true });\n\nfunction getContext() {\n  const context = globalThis.SillyTavern?.getContext?.();\n  if (!context) throw new Error(\`[\${MODULE_ID}] SillyTavern context is unavailable\`);\n  return context;\n}\n\nfunction initializeSettings() {\n  const context = getContext();\n  const current = context.extensionSettings[MODULE_ID] ?? {};\n  context.extensionSettings[MODULE_ID] = { ...DEFAULT_SETTINGS, ...current };\n  context.saveSettingsDebounced?.();\n}\n\nexport function onActivate() {\n  initializeSettings();\n}\n`;
}

export function scaffold(spec, outDirectory, write = false) {
  const errors = validateSpec(spec);
  const outRoot = path.resolve(outDirectory);
  const manifest = {
    display_name: spec?.displayName,
    loading_order: spec?.loadingOrder ?? 10,
    dependencies: [],
    js: 'index.js',
    author: spec?.author,
    version: spec?.version,
    auto_update: spec?.autoUpdate ?? false,
    hooks: { activate: 'onActivate' }
  };
  if (spec?.withCss === true) manifest.css = 'style.css';
  if (spec?.homePage !== undefined) manifest.homePage = spec.homePage;
  if (spec?.minimumClientVersion !== undefined) manifest.minimum_client_version = spec.minimumClientVersion;
  const requirements = Array.isArray(spec?.requirements) && spec.requirements.length
    ? spec.requirements
    : [{ id: 'host-context', owner: 'sillytavern', symbol: 'SillyTavern.getContext', required: true, fallback: null }];
  const capabilityContract = {
    schemaVersion: 1,
    minimum: { sillytavern: spec?.minimumClientVersion ?? null, tavernHelper: null },
    requirements
  };
  const outputs = [
    ['manifest.json', canonicalJson(manifest)],
    ['index.js', entrySource(spec?.id ?? 'invalid-extension')],
    ['capability-contract.json', canonicalJson(capabilityContract)]
  ];
  if (spec?.withCss === true) outputs.push(['style.css', `[data-extension-id="${spec.id}"] {\n  contain: content;\n}\n`]);
  for (const [relative] of outputs) {
    const resolved = path.resolve(outRoot, relative);
    if (!resolved.startsWith(`${outRoot}${path.sep}`)) errors.push(`output escapes root: ${relative}`);
    if (write && fs.existsSync(resolved)) errors.push(`refusing to overwrite existing file: ${relative}`);
  }
  const written = [];
  if (write && errors.length === 0) {
    fs.mkdirSync(outRoot, { recursive: true });
    for (const [relative, content] of outputs) {
      const target = path.resolve(outRoot, relative);
      fs.writeFileSync(target, content, 'utf8');
      written.push(target);
    }
  }
  return {
    schemaVersion: 1,
    pass: errors.length === 0,
    write,
    outRoot,
    files: outputs.map(([relative]) => relative),
    written,
    errors
  };
}

function parseArgs(argv) {
  const options = { write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--spec' || arg === '--out') options[arg.slice(2)] = argv[++index];
    else if (arg === '--write') options.write = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.spec || !options.out) throw new Error('usage: --spec <file> --out <directory> [--write]');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const spec = JSON.parse(fs.readFileSync(options.spec, 'utf8'));
    const report = scaffold(spec, options.out, options.write);
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
