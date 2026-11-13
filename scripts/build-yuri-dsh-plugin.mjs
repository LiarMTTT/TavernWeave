#!/usr/bin/env node
/**
 * Build the TavernWeave Yuri Workbench DSH plugin bundle for DeepSeek Harness.
 *
 * The committed plugin directory contains integration files only; this script
 * stages a complete publishable package (the four yuri workflows and the 23
 * TavernWeave dependency skills are copied byte-identical from the source
 * tree), validates it, and (unless --check) creates the release tarball with
 * `npm pack`.
 *
 * Usage:
 *   node scripts/build-yuri-dsh-plugin.mjs --check
 *   node scripts/build-yuri-dsh-plugin.mjs [--out dist/yuri-dsh] [--zip] [--keep]
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
const pluginDir = path.join(repoRoot, "host-adapters", "dsh", "plugin-yuri");
const manifestPath = path.join(repoRoot, "tavernweave-install-manifest.json");
const contractPath = path.join(repoRoot, "host-adapters", "dsh", "yuri-plugin-contract.json");
const skillsSource = path.join(repoRoot, "skills");
const yuriSource = path.join(repoRoot, "extensions", "yuri-creation");

const EXPECTED_PACKAGE = "tavernweave-yuri-dsh";
const YURI_WORKFLOWS = Object.freeze([
  "adapt-yuri-card",
  "novel-excerpt-to-yuri-card",
  "post-to-yuri-card",
  "yuri-card-creator",
]);
// Same sensitive-content needles as the TavernWeave X DSH build gate; escaped
// literals keep the repository-level gate from matching this script's own text.
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
  const options = { check: false, zip: false, keep: false, out: path.join(repoRoot, "dist", "yuri-dsh") };
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
    "cordis.patch.yml",
    "locale/en.json",
    "locale/zh.json",
    "icon.svg",
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
  assert(patch.includes("id: preset-tavernweave-yuri"), "bundle patch is missing preset-tavernweave-yuri");
  assert(patch.includes("id: tavernweave-yuri"), "bundle patch is missing the tavernweave-yuri preset id");
  assert(patch.includes(`name: '${EXPECTED_PACKAGE}'`), "bundle patch must mount the yuri plugin row");
  const maxDescriptionMatch = /catalogDescriptionMaxLength:\s*(\d+)/.exec(patch);
  assert(maxDescriptionMatch, "bundle patch must raise catalogDescriptionMaxLength");
  const maxDescription = Number(maxDescriptionMatch[1]);

  const baseRoot = path.join(stage, "skills");
  const baseDirs = readdirSync(baseRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert(baseDirs.length === 23, `expected 23 base dependency skills, found ${baseDirs.length}`);
  for (const skillName of baseDirs) {
    const meta = parseSkillMeta(path.join(baseRoot, skillName, "SKILL.md"));
    assert(meta.name === skillName, `SKILL.md name mismatch for base skill ${skillName}`);
    assert(meta.description.length > 0, `SKILL.md description is missing for base skill ${skillName}`);
  }

  const yuriRoot = path.join(stage, "extensions", "yuri-creation");
  const yuriSkillRoot = path.join(yuriRoot, "skills");
  for (const workflow of YURI_WORKFLOWS) {
    const meta = parseSkillMeta(path.join(yuriSkillRoot, workflow, "SKILL.md"));
    assert(meta.name === workflow, `SKILL.md name mismatch for yuri workflow ${workflow}`);
    assert(meta.description.length > 0, `SKILL.md description is missing for ${workflow}`);
    assert(meta.description.length <= maxDescription, `${workflow} description (${meta.description.length}) exceeds catalogDescriptionMaxLength`);
  }
  for (const relative of [
    "hosts/native.json",
    "VERSION",
    "UPSTREAM.json",
    "references/name-review.md",
    "references/inherited-cards.md",
    "references/novel-inputs.md",
    "references/source-records.md",
    "shared/card_files.py",
    "shared/novels.py",
    "shared/provenance.py",
    "scripts/card_file.py",
    "scripts/novel_source.py",
    "scripts/source_card.py",
    "scripts/host_probe.py",
  ]) {
    assert(existsSync(path.join(yuriRoot, relative)), `yuri workbench file is missing: ${relative}`);
  }

  // The runtime pins must keep verifying from inside the package: the pinned
  // TavernWeave module paths are relative to the package root (the tavern root
  // that hosts `skills/`), exactly as the workflows pass it via --tavern-root.
  const upstream = JSON.parse(readText(path.join(yuriRoot, "UPSTREAM.json")));
  for (const module of upstream.tavernweave.modules ?? []) {
    assert(existsSync(path.join(stage, module.path)), `pinned authoring module missing from package: ${module.path}`);
  }
  assert(
    existsSync(path.join(stage, upstream.source_library.path)),
    `pinned source library missing from package: ${upstream.source_library.path}`,
  );

  assert(contract.package?.name === pkg.name, "contract package name does not match package.json");
  assert(contract.package?.version === version, "contract package version does not match package.json");
  assert(typeof contract.runtimeAccepted === "boolean", "contract runtimeAccepted must be a boolean");
  assert(contract.package?.presetId === "tavernweave-yuri", "contract preset id must be tavernweave-yuri");

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
    workflows: YURI_WORKFLOWS.length,
    baseSkills: baseDirs.length,
    counts: { canonical_yuri_workflows: YURI_WORKFLOWS.length, yuri_discovery_wrappers: 0,
      upstream_dependency_entries: baseDirs.length, packaged_discoverable_entries: baseDirs.length + YURI_WORKFLOWS.length },
    countingNote: "DSH providers register canonical workflows directly; implementation modules are not additional discoverable entries.",
    maxDescription,
    longestDescription: Math.max(...YURI_WORKFLOWS.map((name) => parseSkillMeta(path.join(yuriSkillRoot, name, "SKILL.md")).description.length)),
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
  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, ...args], spawnOptions)
    : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, { ...spawnOptions, shell: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`npm pack failed: ${result.stderr || result.stdout}`);
  const stdout = String(result.stdout ?? "").trim();
  let info;
  try {
    info = JSON.parse(stdout)[0];
  } catch {
    const start = stdout.indexOf("[");
    const end = stdout.lastIndexOf("]");
    if (start !== -1 && end > start) {
      try {
        info = JSON.parse(stdout.slice(start, end + 1))[0];
      } catch {
        info = undefined;
      }
    }
  }
  if (!info?.filename) {
    const packed = readdirSync(outDir).filter((name) => name.endsWith(".tgz")).sort().pop();
    if (packed) info = { filename: packed };
  }
  assert(info?.filename, "npm pack did not report a filename");
  const packed = path.join(outDir, info.filename);
  assert(existsSync(packed), `npm pack output is missing: ${packed}`);
  return packed;
}

function verifyTarball(tarball, version) {
  const result = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) return { verified: false, reason: "tar unavailable" };
  const entries = result.stdout.split(/\r?\n/).filter(Boolean);
  const yuriEntries = entries.filter((entry) => new RegExp("^package/extensions/yuri-creation/skills/(?:"
    + YURI_WORKFLOWS.join("|") + ")/SKILL\\.md$").test(entry));
  assert(yuriEntries.length === 4, `tarball must contain 4 yuri workflow SKILL.md files, found ${yuriEntries.length}`);
  const baseEntries = entries.filter((entry) => /^package\/skills\/[^/]+\/SKILL\.md$/.test(entry));
  assert(baseEntries.length === 23, `tarball must contain 23 base SKILL.md files, found ${baseEntries.length}`);
  assert(entries.includes("package/index.js"), "tarball is missing package/index.js");
  assert(entries.includes("package/cordis.patch.yml"), "tarball is missing package/cordis.patch.yml");
  assert(entries.includes("package/package.json"), "tarball is missing package/package.json");
  return { verified: true, entries: entries.length, version };
}

/**
 * Keep the committed package manifest in sync with the release version; the
 * committed file is what market submission gates and directory installs read.
 */
function syncSourceManifest(version) {
  const sourcePath = path.join(pluginDir, "package.json");
  assert(existsSync(sourcePath), "the committed plugin package.json is missing");
  const pkg = JSON.parse(readText(sourcePath));
  assert(pkg.name === EXPECTED_PACKAGE, `committed plugin package.json must be named ${EXPECTED_PACKAGE}`);
  assert(pkg.dsh?.bundle?.patch === "./cordis.patch.yml", "committed plugin package.json must declare dsh.bundle.patch");
  if (pkg.version !== version) {
    pkg.version = version;
    writeFileSync(sourcePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
    console.error(`build-yuri-dsh-plugin: synced committed package.json to ${version}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(readText(manifestPath));
  const contract = JSON.parse(readText(contractPath));
  const yuriManifest = manifest.yuriDshPlugin;
  assert(yuriManifest && typeof yuriManifest.version === "string", "installation manifest must declare yuriDshPlugin.version");
  const version = yuriManifest.version;
  syncSourceManifest(version);
  assert(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version), `invalid yuri plugin version: ${version}`);
  assert(yuriManifest.package === EXPECTED_PACKAGE, "manifest yuriDshPlugin.package must match the package name");
  assert([...yuriManifest.workflows].sort().join(",") === [...YURI_WORKFLOWS].sort().join(","), "manifest yuriDshPlugin.workflows must name the four workflows");

  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "tw-yuri-dsh-plugin-"));
  const stage = path.join(tempRoot, "package");
  mkdirSync(stage, { recursive: true });
  let summary;
  try {
    for (const relative of ["index.js", "cordis.patch.yml", "icon.svg", "README.md"]) {
      cpSync(path.join(pluginDir, relative), path.join(stage, relative));
    }
    cpSync(path.join(pluginDir, "locale"), path.join(stage, "locale"), { recursive: true });
    cpSync(path.join(pluginDir, "LICENSE"), path.join(stage, "LICENSE"));
    cpSync(path.join(pluginDir, "package.json"), path.join(stage, "package.json"));
    for (const skillName of manifest.skills) {
      const source = path.join(skillsSource, skillName);
      assert(statSync(source).isDirectory(), `skill directory is missing: ${skillName}`);
      cpSync(source, path.join(stage, "skills", skillName), {
        recursive: true,
        filter: (sourcePath) => !sourcePath.includes(`${path.sep}__pycache__`) && !sourcePath.endsWith(".pyc"),
      });
    }
    assert(readdirSync(path.join(stage, "skills")).length === manifest.skillCount, "staged skill count differs from the manifest");
    cpSync(yuriSource, path.join(stage, "extensions", "yuri-creation"), {
      recursive: true,
      filter: (sourcePath) => !sourcePath.includes(`${path.sep}__pycache__`) && !sourcePath.endsWith(".pyc"),
    });

    // Byte-identity gate: the staged workflow and dependency trees must be
    // verbatim copies of the source checkout; no workflow step, reference or
    // script may change on the way into the package.
    const stagedYuri = path.join(stage, "extensions", "yuri-creation");
    for (const file of walk(stagedYuri)) {
      const relative = path.relative(stagedYuri, file);
      const sourceFile = path.join(yuriSource, relative);
      assert(existsSync(sourceFile), `staged yuri file has no source: ${relative}`);
      assert(readFileSync(file).equals(readFileSync(sourceFile)), `staged yuri file differs from source: ${relative}`);
    }
    const stagedSkills = path.join(stage, "skills");
    for (const file of walk(stagedSkills)) {
      const relative = path.relative(stagedSkills, file);
      const sourceFile = path.join(skillsSource, relative);
      assert(existsSync(sourceFile), `staged base skill file has no source: ${relative}`);
      assert(readFileSync(file).equals(readFileSync(sourceFile)), `staged base skill file differs from source: ${relative}`);
    }

    summary = validateStagedPackage(stage, version, contract);
    summary.mode = options.check ? "check" : "build";

    if (!options.check) {
      const tarball = runNpmPack(stage, options.out);
      const finalTarball = path.join(options.out, `TavernWeave-Yuri-DSH-v${version}.tgz`);
      if (tarball !== finalTarball) renameSync(tarball, finalTarball);
      summary.tarball = finalTarball;
      summary.tarballBytes = statSync(finalTarball).size;
      summary.tarballCheck = verifyTarball(finalTarball, version);
      if (options.zip) {
        const zipPath = path.join(options.out, `TavernWeave-Yuri-DSH-v${version}.zip`);
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
  console.error(`build-yuri-dsh-plugin: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
