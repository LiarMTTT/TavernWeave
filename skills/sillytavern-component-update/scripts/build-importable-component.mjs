import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalJson, loadJson, planSpec, sha256 } from './plan-component-update.mjs';

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

function suffix(kind) {
  return { regex: 'regex', 'helper-script': 'script', 'helper-folder': 'folder' }[kind];
}

export function build(spec, outDirectory, write = false) {
  const planned = planSpec(spec, outDirectory);
  if (planned.errors.length) return { ...planned, written: [] };

  const artifacts = spec.items.map(item => {
    const relativePath = `${item.artifactName}.${suffix(spec.kind)}.json`;
    const content = canonicalJson(item.value);
    return {
      artifactName: item.artifactName,
      id: item.value.id,
      kind: spec.kind,
      relativePath,
      sha256: sha256(content),
      content
    };
  });
  const manifest = {
    schemaVersion: 1,
    deliveryMode: spec.deliveryMode,
    kind: spec.kind,
    artifacts: artifacts.map(({ content, ...artifact }) => artifact)
  };
  const outputs = artifacts.map(artifact => [artifact.relativePath, artifact.content]);
  outputs.push(['component-update-manifest.json', canonicalJson(manifest)]);
  if (spec.deliveryMode === 'full-card') {
    outputs.push(['assembly-handoff.json', canonicalJson({
      schemaVersion: 1,
      deliveryMode: 'full-card',
      ...spec.assembly,
      componentManifest: 'component-update-manifest.json',
      artifacts: manifest.artifacts.map(artifact => artifact.relativePath),
      pipelineOwner: 'sillytavern-card-pipeline'
    })]);
  }

  const written = [];
  if (write) {
    const outRoot = path.resolve(outDirectory);
    fs.mkdirSync(outRoot, { recursive: true });
    for (const [relative, content] of outputs) {
      const target = path.resolve(outRoot, relative);
      if (!target.startsWith(`${outRoot}${path.sep}`)) throw new Error(`output escapes staging root: ${relative}`);
      fs.writeFileSync(target, content, 'utf8');
      written.push(target);
    }
  }
  return {
    errors: [],
    plan: planned.plan,
    write,
    artifacts: manifest.artifacts,
    written
  };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = build(loadJson(options.spec), options.out, options.write);
    process.stdout.write(canonicalJson(result));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
