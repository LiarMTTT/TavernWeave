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
    const created = [];
    try {
      fs.mkdirSync(outRoot, { recursive: true });
      // Reserve every output exclusively before writing any bytes. A concurrent
      // creator after the plan cannot be overwritten by this batch.
      for (const [relative, content] of outputs) {
        const target = path.resolve(outRoot, relative);
        if (!target.startsWith(`${outRoot}${path.sep}`)) throw new Error(`output escapes staging root: ${relative}`);
        const fd = fs.openSync(target, 'wx');
        const entry = { target, fd, content, identity: null };
        created.push(entry);
        entry.identity = fs.fstatSync(fd, { bigint: true });
      }
      for (const entry of created) fs.writeFileSync(entry.fd, entry.content, 'utf8');
      for (const entry of created) {
        fs.closeSync(entry.fd);
        entry.fd = null;
      }
      written.push(...created.map(entry => entry.target));
    } catch (error) {
      const errors = [`component batch write failed: ${error.message}`];
      const remaining = [];
      for (const entry of created.reverse()) {
        let currentFd = null;
        try {
          if (!fs.lstatSync(entry.target).isFile() || !entry.identity) {
            throw new Error('output identity is unverified or no longer a regular file');
          }
          // Compare handle stats on both sides: Windows Node 22 can return dev=0
          // for path stats even when fstat reports the real device identifier.
          currentFd = fs.openSync(entry.target, 'r');
          const current = fs.fstatSync(currentFd, { bigint: true });
          if (entry.identity.dev === 0n || entry.identity.ino === 0n || !current.isFile() ||
              current.dev !== entry.identity.dev || current.ino !== entry.identity.ino) {
            throw new Error('output was externally replaced or its identity is unverified');
          }
          fs.closeSync(currentFd);
          currentFd = null;
          if (entry.fd !== null) { fs.closeSync(entry.fd); entry.fd = null; }
          fs.unlinkSync(entry.target);
        } catch (rollbackError) {
          if (rollbackError.code !== 'ENOENT') {
            errors.push(`unable to roll back ${entry.target}: ${rollbackError.message}`);
            remaining.push(entry.target);
          }
        } finally {
          for (const fd of [currentFd, entry.fd]) {
            if (fd !== null) {
              try { fs.closeSync(fd); } catch (closeError) { errors.push(`unable to close ${entry.target}: ${closeError.message}`); }
            }
          }
          entry.fd = null;
        }
      }
      return { errors, plan: planned.plan, write, artifacts: manifest.artifacts, written: remaining };
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
