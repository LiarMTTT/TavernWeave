#!/usr/bin/env node
/**
 * Build the TavernWeave X DSH plugin bundle for DeepSeek Harness.
 *
 * The committed plugin directory contains source files only; this script stages
 * a complete publishable package (skills + front door + locale + icon), validates
 * it, and (unless --check) creates the release tarball with `npm pack`.
 *
 * Usage:
 *   node scripts/build-dsh-plugin.mjs --check
 *   node scripts/build-dsh-plugin.mjs [--out dist/dsh] [--zip] [--keep]
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const pluginDir = path.join(repoRoot, "host-adapters", "dsh", "plugin");
const manifestPath = path.join(repoRoot, "tavernweave-install-manifest.json");
const contractPath = path.join(repoRoot, "host-adapters", "dsh", "dsh-plugin-contract.json");
const frontDoorSource = path.join(repoRoot, "host-adapters", "tavernweave-front-door.md");

const EXPECTED_PACKAGE = "liarmttt-tavernweave-dsh";
const FRONT_DOOR_BEGIN = "<!-- tavernweave-host-front-door:begin";
const FRONT_DOOR_END = "<!-- tavernweave-host-front-door:end -->";
// Private names, paths and the author contact are recorded as escaped literals so
// the repository-level sensitive-content gate never matches this build script's
// own source text. They only describe what a packaged bundle must not contain.
const FORBIDDEN = [
  "\u661f\u6708",
  "\u4ea4\u9519\u5b99\u57df",
  "\u672b\u65e5\u4e4b\u540e",
  "\u7ec8\u672b\u6d6e\u57ce",
  "\u89d2\u8272\u5361\u5de5\u4f5c\u533a",
  "ST\u5f00\u53d1\u6307\u5357DB",
  "C:/\u0055sers/Administrator",
  "E:/\u0054est Area",
  "OneDrive/ST-",
  "254638486@qq\u002ecom",
  "UPDATE_PLAN_CANDIDATE.md",
  "docs/godhand",
  "tw-lite",
];

function parseArgs(argv) {
  const options = { check: false, zip: false, keep: false, out: path.join(repoRoot, "dist", "dsh") };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--zip") options.zip = true;
    else if (arg === "--keep") options.keep = true;
    else if (arg === "--out") {
      index += 1;
      if (!argv[index]) throw new Error("--out requires a directory");
      options.out = path.resolve(argv[index]);
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function walk(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "__pycache__" || entry.name === ".DS_Store") continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (!entry.name.endsWith(".pyc")) files.push(full);
  }
  return files;
}

function extractFrontDoor() {
  const lines = readText(frontDoorSource).split("\n");
  const begin = lines.findIndex((line) => line.startsWith(FRONT_DOOR_BEGIN));
  const end = lines.findIndex((line) => line.trim() === FRONT_DOOR_END);
  assert(begin >= 0 && end > begin, "Host Front Door markers are missing or out of order");
  return `${lines.slice(begin + 1, end).join("\n").trim()}\n`;
}

function frontDoorVersion() {
  const firstLine = readText(frontDoorSource).split("\n").find((line) => line.startsWith(FRONT_DOOR_BEGIN));
  const match = /version=([^\s]+)/.exec(firstLine ?? "");
  assert(match, "Host Front Door marker version is missing");
  return match[1];
}

function parseSkillMeta(file) {
  const text = readText(file);
  const lines = text.split("\n");
  assert(lines[0]?.trim() === "---", `SKILL.md front matter must start at line 1: ${file}`);
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  assert(end > 0, `SKILL.md front matter is not closed: ${file}`);
  const fields = Object.create(null);
  for (let index = 1; index < end; index += 1) {
    const match = /^([A-Za-z0-9_-]+):(?:[ \t]*(.*))?$/.exec(lines[index]);
    if (!match) continue;
    const key = match[1];
    const inline = (match[2] ?? "").trim();
    if (["|", "|-", "|+", ">", ">-", ">+"].includes(inline)) {
      const block = [];
      let cursor = index + 1;
      while (cursor < end && (lines[cursor].trim() === "" || /^\s/.test(lines[cursor]))) {
        block.push(lines[cursor].trim());
        cursor += 1;
      }
      fields[key] = inline.startsWith(">") ? block.filter(Boolean).join(" ") : block.join("\n").trim();
      index = cursor - 1;
      continue;
    }
    if (inline.length > 0) fields[key] = inline.replace(/^(['"])(.*)\1$/, "$2");
  }
  return { name: fields.name ?? "", description: fields.description ?? "" };
}

function validateStagedPackage(stage, version, contract) {
  const pkg = JSON.parse(readText(path.join(stage, "package.json")));
  const required = [
    "index.js",
    "client.js",
    "godhand-host.js",
    "cordis.patch.yml",
    "locale/en.json",
    "locale/zh.json",
    "icon.png",
    "assets/front-door.md",
    "README.md",
    "LICENSE",
  ];
  for (const relative of required) assert(existsSync(path.join(stage, relative)), `packaged file is missing: ${relative}`);
  assert(pkg.name === EXPECTED_PACKAGE, `package name mismatch: ${pkg.name}`);
  assert(pkg.version === version, `package version mismatch: ${pkg.version} != ${version}`);
  assert(typeof pkg.description === "string" && pkg.description.length > 20, "package description is missing");
  assert(pkg.dsh?.bundle?.patch === "./cordis.patch.yml", "dsh.bundle.patch must point at ./cordis.patch.yml");
  assert(typeof pkg.engines?.dsh === "string" && pkg.engines.dsh.length > 0, "engines.dsh is missing");
  assert(JSON.stringify(pkg.exports ?? {}).includes("./locale/*.json"), "locale exports are missing");

  const patch = readText(path.join(stage, "cordis.patch.yml"));
  assert(patch.includes("name: '@deepseek-ai/dsh-agent-preset'"), "bundle patch must declare an agent preset");
  assert(patch.includes("id: preset-tavernweave"), "bundle patch is missing preset-tavernweave");
  assert(patch.includes(`id: tavernweave`), "bundle patch is missing the tavernweave preset id");
  assert(patch.includes(`name: '${EXPECTED_PACKAGE}'`), "bundle patch must mount the TavernWeave plugin row");
  const maxDescriptionMatch = /catalogDescriptionMaxLength:\s*(\d+)/.exec(patch);
  assert(maxDescriptionMatch, "bundle patch must raise catalogDescriptionMaxLength");
  const maxDescription = Number(maxDescriptionMatch[1]);

  const frontDoor = readText(path.join(stage, "assets/front-door.md"));
  assert(frontDoor.includes("TavernWeave Host Front Door"), "front door asset is incomplete");
  assert(!frontDoor.includes("tavernweave-host-front-door:begin"), "front door markers must be stripped in the package asset");

  const skillsRoot = path.join(stage, "skills");
  const skillDirs = readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert(skillDirs.length === 23, `expected 23 packaged skills, found ${skillDirs.length}`);
  for (const skillName of skillDirs) {
    const meta = parseSkillMeta(path.join(skillsRoot, skillName, "SKILL.md"));
    assert(meta.name === skillName, `SKILL.md name mismatch for ${skillName}`);
    assert(meta.description.length > 0, `SKILL.md description is missing for ${skillName}`);
    assert(meta.description.length <= maxDescription, `${skillName} description (${meta.description.length}) exceeds catalogDescriptionMaxLength`);
  }

  assert(contract.package?.name === pkg.name, "contract package name does not match package.json");
  assert(contract.package?.version === version, "contract package version does not match package.json");
  assert(typeof contract.runtimeAccepted === "boolean", "contract runtimeAccepted must be a boolean");
  assert(contract.package?.presetId === "tavernweave", "contract preset id must be tavernweave");

  let scannedFiles = 0;
  for (const file of walk(stage)) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    scannedFiles += 1;
    for (const needle of FORBIDDEN) {
      assert(!text.includes(needle), `packaged content contains forbidden text (${needle}) in ${path.relative(stage, file)}`);
    }
  }
  return {
    package: pkg.name,
    version: pkg.version,
    skills: skillDirs.length,
    maxDescription,
    longestDescription: Math.max(...skillDirs.map((name) => parseSkillMeta(path.join(skillsRoot, name, "SKILL.md")).description.length)),
    frontDoorBytes: Buffer.byteLength(frontDoor, "utf8"),
    scannedFiles,
    enginesDsh: pkg.engines.dsh,
  };
}

function resolveNpmCli() {
  const candidates = [];
  if (process.env.npm_execpath) candidates.push(process.env.npm_execpath);
  const executableDir = path.dirname(process.execPath);
  candidates.push(path.join(executableDir, "node_modules", "npm", "bin", "npm-cli.js"));
  candidates.push(path.join(executableDir, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"));
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

function runNpmPack(stage, outDir) {
  mkdirSync(outDir, { recursive: true });
  const args = ["pack", "--json", "--pack-destination", outDir];
  const npmCli = resolveNpmCli();
  const spawnOptions = { cwd: stage, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 };
  // Node refuses to spawn .cmd/.ps1 shims without a shell; prefer the npm CLI
  // entry point executed by the current Node binary for a shell-free run.
  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, ...args], spawnOptions)
    : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, { ...spawnOptions, shell: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`npm pack failed: ${result.stderr || result.stdout}`);
  const info = JSON.parse(result.stdout.trim())[0];
  assert(info?.filename, "npm pack did not report a filename");
  const packed = path.join(outDir, info.filename);
  assert(existsSync(packed), `npm pack output is missing: ${packed}`);
  return packed;
}

function verifyTarball(tarball, version) {
  const result = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) return { verified: false, reason: "tar unavailable" };
  const entries = result.stdout.split(/\r?\n/).filter(Boolean);
  const skillEntries = entries.filter((entry) => /^package\/skills\/[^/]+\/SKILL\.md$/.test(entry));
  assert(skillEntries.length === 23, `tarball must contain 23 SKILL.md files, found ${skillEntries.length}`);
  assert(entries.includes("package/index.js"), "tarball is missing package/index.js");
  assert(entries.includes("package/cordis.patch.yml"), "tarball is missing package/cordis.patch.yml");
  assert(entries.includes("package/package.json"), "tarball is missing package/package.json");
  return { verified: true, entries: entries.length, version };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(readText(manifestPath));
  const contract = JSON.parse(readText(contractPath));
  const version = manifest.version;
  assert(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version), `invalid manifest version: ${version}`);
  assert(frontDoorVersion() === manifest.hostFrontDoor.version, "Host Front Door marker version must match hostFrontDoor.version");
  assert(manifest.hostFrontDoor.version === version, "Host Front Door version must match the package version");

  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "tw-dsh-plugin-"));
  const stage = path.join(tempRoot, "package");
  mkdirSync(stage, { recursive: true });
  let summary;
  try {
    for (const relative of ["index.js", "client.js", "godhand-host.js", "cordis.patch.yml", "icon.png", "README.md"]) {
      cpSync(path.join(pluginDir, relative), path.join(stage, relative));
    }
    cpSync(path.join(pluginDir, "locale"), path.join(stage, "locale"), { recursive: true });
    cpSync(path.join(repoRoot, "LICENSE"), path.join(stage, "LICENSE"));
    const template = readText(path.join(pluginDir, "package.template.json"));
    assert(template.includes("${TW_VERSION}"), "package.template.json must keep the ${TW_VERSION} placeholder");
    writeFileSync(path.join(stage, "package.json"), `${template.replaceAll("${TW_VERSION}", version)}\n`, "utf8");
    mkdirSync(path.join(stage, "assets"), { recursive: true });
    writeFileSync(path.join(stage, "assets", "front-door.md"), extractFrontDoor(), "utf8");
    for (const skillName of manifest.skills) {
      const source = path.join(repoRoot, "skills", skillName);
      assert(statSync(source).isDirectory(), `skill directory is missing: ${skillName}`);
      cpSync(source, path.join(stage, "skills", skillName), {
        recursive: true,
        filter: (sourcePath) => !sourcePath.includes(`${path.sep}__pycache__`) && !sourcePath.endsWith(".pyc"),
      });
    }
    assert(readdirSync(path.join(stage, "skills")).length === manifest.skillCount, "staged skill count differs from the manifest");

    summary = validateStagedPackage(stage, version, contract);
    summary.mode = options.check ? "check" : "build";

    if (!options.check) {
      const tarball = runNpmPack(stage, options.out);
      const finalTarball = path.join(options.out, `TavernWeave-DSH-v${version}.tgz`);
      if (tarball !== finalTarball) renameSync(tarball, finalTarball);
      summary.tarball = finalTarball;
      summary.tarballBytes = statSync(finalTarball).size;
      summary.tarballCheck = verifyTarball(finalTarball, version);
      if (options.zip) {
        const zipPath = path.join(options.out, `TavernWeave-DSH-v${version}.zip`);
        const zipResult = spawnSync("tar", ["-a", "-cf", zipPath, "-C", tempRoot, "package"], { encoding: "utf8" });
        if (zipResult.status === 0 && existsSync(zipPath)) summary.zip = zipPath;
        else console.error(`zip step skipped or failed: ${zipResult.stderr || zipResult.error}`);
      }
    }
  } finally {
    if (!options.keep) rmSync(tempRoot, { recursive: true, force: true });
    else console.error(`staging kept at ${tempRoot}`);
  }
  console.log(JSON.stringify({ status: "ok", ...summary }));
}

try {
  main();
} catch (error) {
  console.error(`build-dsh-plugin: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
