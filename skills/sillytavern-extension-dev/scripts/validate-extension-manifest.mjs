import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_FIELDS = ['display_name', 'js', 'author', 'version'];
const KNOWN_FIELDS = new Set([
  ...REQUIRED_FIELDS,
  'loading_order', 'requires', 'optional', 'dependencies', 'css', 'homePage',
  'auto_update', 'minimum_client_version', 'i18n', 'hooks', 'generate_interceptor'
]);
const HOOKS = new Set(['install', 'update', 'delete', 'enable', 'disable', 'activate', 'clean']);
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeProjectFile(root, relative, field, errors, expectedExtension = null) {
  if (typeof relative !== 'string' || relative.trim() === '') {
    errors.push(`${field} must be a non-empty relative path`);
    return null;
  }
  if (path.isAbsolute(relative)) {
    errors.push(`${field} must be relative`);
    return null;
  }
  if (expectedExtension && path.extname(relative).toLowerCase() !== expectedExtension) {
    errors.push(`${field} must end in ${expectedExtension}`);
  }
  const resolved = path.resolve(root, relative);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) {
    errors.push(`${field} escapes the extension root`);
    return null;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    errors.push(`${field} does not name an existing file`);
  }
  return resolved;
}

function stringArray(value, field, errors) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.trim() === '')) {
    errors.push(`${field} must be an array of non-empty strings`);
  }
}

function exportsIdentifier(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${escaped}\\b`),
    new RegExp(`\\bexport\\s+(?:const|let|var|class)\\s+${escaped}\\b`),
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}`, 's')
  ];
  return patterns.some(pattern => pattern.test(source));
}

export function validateExtension(rootDirectory, manifestFile = 'manifest.json') {
  const root = path.resolve(rootDirectory);
  const errors = [];
  const warnings = [];
  const files = [];
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return { schemaVersion: 1, root, errors: ['root must be an existing directory'], warnings, files };
  }
  if (fs.lstatSync(root).isSymbolicLink()) {
    return { schemaVersion: 1, root, errors: ['root must not be a symbolic link'], warnings, files };
  }
  const manifestPath = safeProjectFile(root, manifestFile, 'manifest', errors, '.json');
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    return { schemaVersion: 1, root, errors, warnings, files };
  }
  files.push(path.relative(root, manifestPath).replaceAll('\\', '/'));
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    errors.push(`manifest JSON parse failed: ${error.message}`);
    return { schemaVersion: 1, root, errors, warnings, files };
  }
  if (!isObject(manifest)) {
    errors.push('manifest must be a JSON object');
    return { schemaVersion: 1, root, errors, warnings, files };
  }
  for (const field of REQUIRED_FIELDS) {
    if (typeof manifest[field] !== 'string' || manifest[field].trim() === '') errors.push(`${field} must be a non-empty string`);
  }
  if (typeof manifest.version === 'string' && !SEMVER.test(manifest.version)) errors.push('version must be a numeric semantic version');
  if (manifest.minimum_client_version !== undefined && (typeof manifest.minimum_client_version !== 'string' || !SEMVER.test(manifest.minimum_client_version))) {
    errors.push('minimum_client_version must be a numeric semantic version');
  }
  if (manifest.loading_order !== undefined && !Number.isInteger(manifest.loading_order)) errors.push('loading_order must be an integer');
  if (manifest.auto_update !== undefined && typeof manifest.auto_update !== 'boolean') errors.push('auto_update must be a boolean');
  if (manifest.homePage !== undefined) {
    try {
      const url = new URL(manifest.homePage);
      if (!['https:', 'http:'].includes(url.protocol)) errors.push('homePage must use HTTP or HTTPS');
    } catch {
      errors.push('homePage must be an absolute URL');
    }
  }
  stringArray(manifest.dependencies, 'dependencies', errors);
  stringArray(manifest.requires, 'requires', errors);
  stringArray(manifest.optional, 'optional', errors);
  if (manifest.requires !== undefined || manifest.optional !== undefined) warnings.push('requires and optional are deprecated Extras-module fields');

  let entryPath = null;
  if (typeof manifest.js === 'string') {
    const extension = path.extname(manifest.js).toLowerCase();
    if (!['.js', '.mjs'].includes(extension)) errors.push('js must end in .js or .mjs');
    entryPath = safeProjectFile(root, manifest.js, 'js', errors);
    if (entryPath && fs.existsSync(entryPath)) files.push(path.relative(root, entryPath).replaceAll('\\', '/'));
  }
  if (manifest.css !== undefined) {
    const cssPath = safeProjectFile(root, manifest.css, 'css', errors, '.css');
    if (cssPath && fs.existsSync(cssPath)) files.push(path.relative(root, cssPath).replaceAll('\\', '/'));
  }
  if (manifest.i18n !== undefined) {
    if (!isObject(manifest.i18n)) errors.push('i18n must be an object of locale paths');
    else {
      for (const [locale, localePath] of Object.entries(manifest.i18n)) {
        if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale)) errors.push(`i18n locale is invalid: ${locale}`);
        const resolved = safeProjectFile(root, localePath, `i18n.${locale}`, errors, '.json');
        if (resolved && fs.existsSync(resolved)) files.push(path.relative(root, resolved).replaceAll('\\', '/'));
      }
    }
  }

  const requestedExports = [];
  if (manifest.hooks !== undefined) {
    if (!isObject(manifest.hooks)) errors.push('hooks must be an object');
    else {
      for (const [hook, exported] of Object.entries(manifest.hooks)) {
        if (!HOOKS.has(hook)) errors.push(`unsupported hook: ${hook}`);
        if (typeof exported !== 'string' || !IDENTIFIER.test(exported)) errors.push(`hooks.${hook} must be a JavaScript identifier`);
        else requestedExports.push({ field: `hooks.${hook}`, name: exported });
      }
    }
  }
  if (manifest.generate_interceptor !== undefined && (typeof manifest.generate_interceptor !== 'string' || !IDENTIFIER.test(manifest.generate_interceptor))) {
    errors.push('generate_interceptor must be a JavaScript identifier');
  }
  if (entryPath && fs.existsSync(entryPath) && requestedExports.length) {
    const source = fs.readFileSync(entryPath, 'utf8');
    for (const requested of requestedExports) {
      if (!exportsIdentifier(source, requested.name)) errors.push(`${requested.field} export was not found in ${manifest.js}`);
    }
  }
  const unknownFields = Object.keys(manifest).filter(field => !KNOWN_FIELDS.has(field)).sort();
  if (unknownFields.length) warnings.push(`unknown manifest fields preserved: ${unknownFields.join(', ')}`);
  return {
    schemaVersion: 1,
    root,
    manifest: path.relative(root, manifestPath).replaceAll('\\', '/'),
    identity: {
      displayName: manifest.display_name ?? null,
      version: manifest.version ?? null,
      author: manifest.author ?? null
    },
    files: [...new Set(files)].sort(),
    unknownFields,
    warnings,
    errors,
    pass: errors.length === 0
  };
}

function parseArgs(argv) {
  const options = { manifest: 'manifest.json' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root' || arg === '--manifest') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.root) throw new Error('usage: --root <extension-directory> [--manifest manifest.json]');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = validateExtension(options.root, options.manifest);
    process.stdout.write(canonicalJson(report));
    if (!report.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
