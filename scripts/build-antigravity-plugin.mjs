#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (root, name) => fs.readFileSync(path.join(root, name), "utf8").replace(/^\uFEFF/u, "");
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };

export function inspectSource(root = repository) {
  const install = JSON.parse(read(root, "tavernweave-install-manifest.json"));
  const adapter = install.antigravityPlugin;
  requireValue(adapter?.status === "plugin-bundle", "Antigravity adapter is not declared");
  const template = JSON.parse(read(root, adapter.packageManifest));
  requireValue(template.name === install.package, "Antigravity package identity mismatch");
  requireValue(/^\d+\.\d+\.\d+$/u.test(install.version), "Invalid package version");
  const yuriConfig = path.join(root, "extensions/yuri-creation/hosts/native.json");
  const extensionSkills = fs.existsSync(yuriConfig) ? Object.keys(JSON.parse(fs.readFileSync(yuriConfig, "utf8")).entry_points) : [];
  const skills = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !extensionSkills.includes(entry.name)).map(entry => entry.name).sort();
  requireValue(install.skillCount === skills.length && JSON.stringify(install.skills) === JSON.stringify(skills), "Skill inventory mismatch");
  for (const skill of skills) {
    requireValue(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(skill), "Unsafe skill directory name");
    requireValue(fs.existsSync(path.join(root, "skills", skill, "SKILL.md")), `Missing skill: ${skill}`);
  }
  const frontDoor = read(root, install.hostFrontDoor.managedBlock).replace(/\r\n?/gu, "\n");
  requireValue(frontDoor.startsWith(`<!-- tavernweave-host-front-door:begin version=${install.version} -->`), "Front Door version mismatch");
  const rules = `<!-- Generated from ${install.hostFrontDoor.managedBlock}; edit the maintained source. -->\n${frontDoor.trimEnd()}\n\n## Antigravity adapter\n\nRead skills through their actual installed catalog paths. A dollar-prefixed skill name is a readable skill reference, not a tool or terminal command.\nFor saved guidance and rewriting, use the bundled managers with --host antigravity. Client --scope-root is the resolved .gemini directory; inspect its AGENTS.md, GEMINI.md and config/ equivalents cumulatively. Keep existing user settings outside this generated plugin rule.\n`;
  requireValue(Buffer.byteLength(rules, "utf8") <= 24000, "Generated AGY rule exceeds 24,000 bytes");
  return { install, adapter, skills, rules, manifest: { ...template, version: install.version } };
}

function copy(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
    filter(file) {
      requireValue(!fs.lstatSync(file).isSymbolicLink(), `Refusing linked package source: ${file}`);
      return path.basename(file) !== "__pycache__" && !file.endsWith(".pyc");
    },
  });
}

export function build(output, root = repository) {
  root = path.resolve(root);
  const source = inspectSource(root);
  const target = path.resolve(output || path.join(root, "dist", `TavernWeave-Antigravity-v${source.install.version}`));
  const relative = path.relative(root, target);
  requireValue(relative && (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || relative.startsWith(`dist${path.sep}`)), "Output must be outside the source or in dist/");
  requireValue(!fs.existsSync(target), "Output already exists; choose a new output directory");
  const parent = path.dirname(target);
  // Do not stage or publish through directory links, including a linked dist/.
  for (let current = parent; ; current = path.dirname(current)) {
    requireValue(!fs.existsSync(current) || !fs.lstatSync(current).isSymbolicLink(), `Refusing linked output: ${current}`);
    if (path.dirname(current) === current) break;
  }
  fs.mkdirSync(parent, { recursive: true });
  const stage = fs.mkdtempSync(path.join(parent, ".tw-agy-build-"));
  try {
    for (const skill of source.skills) copy(path.join(root, "skills", skill), path.join(stage, "skills", skill));
    for (const name of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) copy(path.join(root, name), path.join(stage, name));
    copy(path.join(root, source.adapter.guide), path.join(stage, "README.md"));
    fs.mkdirSync(path.join(stage, ".antigravity-plugin"));
    fs.writeFileSync(path.join(stage, ".antigravity-plugin", "plugin.json"), `${JSON.stringify(source.manifest, null, 2)}\n`);
    fs.mkdirSync(path.join(stage, "rules"));
    fs.writeFileSync(path.join(stage, "rules", "AGENTS.md"), source.rules);
    fs.mkdirSync(path.join(stage, "agents"));
    copy(path.join(root, source.adapter.presetAgent), path.join(stage, "agents", "tavernweave.md"));
    const receipt = {
      schemaVersion: 1, host: "antigravity", package: source.manifest.name, version: source.install.version,
      skillCount: source.skills.length, skills: source.skills, frontDoor: "rules/AGENTS.md",
      agent: "agents/tavernweave.md", hooks: [], source: "current working tree",
      nativeValidation: "not-run", hostLoading: "not-verified", humanAcceptance: "not-verified",
    };
    fs.writeFileSync(path.join(stage, "build-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
    requireValue(!fs.existsSync(target), "Output appeared during build; refusing replacement");
    fs.renameSync(stage, target);
    return { ...receipt, output: target };
  } finally {
    requireValue(path.dirname(stage) === parent && path.basename(stage).startsWith(".tw-agy-build-"), "Unsafe staging cleanup");
    if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    requireValue(args.length === 0 || (args.length === 1 && args[0] === "--check") || (args.length === 2 && args[0] === "--output-dir"), "Usage: build-antigravity-plugin.mjs [--check | --output-dir <new-directory>]");
    const result = args[0] === "--check" ? { status: "source-checked", skillCount: inspectSource().skills.length, hostLoading: "not-verified" } : build(args[1]);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
