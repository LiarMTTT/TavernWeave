import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { build, inspectSource } from "../scripts/build-antigravity-plugin.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
function temporary(t) {
  const parent = path.resolve(process.env.TW_TEST_ROOT || os.tmpdir());
  fs.mkdirSync(parent, { recursive: true });
  const directory = fs.mkdtempSync(path.join(parent, "tw-agy-package-"));
  t.after(() => {
    assert.equal(path.dirname(directory), parent);
    assert.ok(path.basename(directory).startsWith("tw-agy-package-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}
function files(directory, relative = "") {
  return fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).flatMap(entry => {
    if (entry.name === "__pycache__" || entry.name.endsWith(".pyc")) return [];
    const name = path.join(relative, entry.name);
    return entry.isDirectory() ? files(directory, name) : [name];
  }).sort();
}

test("AGY package preserves every shared skill byte and isolates host components", t => {
  const base = temporary(t);
  const output = path.join(base, "plugin");
  const receipt = build(output);
  const install = readJson("tavernweave-install-manifest.json");
  assert.deepEqual(receipt.skills, install.skills);
  assert.equal(receipt.hostLoading, "not-verified");
  const expected = files(path.join(root, "skills")).filter(name => install.skills.includes(name.split(path.sep)[0]));
  assert.deepEqual(files(path.join(output, "skills")), expected);
  for (const name of expected) assert.deepEqual(fs.readFileSync(path.join(output, "skills", name)), fs.readFileSync(path.join(root, "skills", name)), name);
  const manifest = JSON.parse(fs.readFileSync(path.join(output, ".antigravity-plugin", "plugin.json")));
  assert.equal(manifest.version, install.version);
  assert.equal(manifest.name, install.package);
  assert.deepEqual(fs.readdirSync(path.join(output, "agents")), ["tavernweave.md"]);
  assert.deepEqual(fs.readdirSync(path.join(output, "rules")), ["AGENTS.md"]);
  for (const excluded of ["hooks", "hooks.json", ".claude-plugin", ".codex-plugin", "host-adapters/dsh"]) assert.equal(fs.existsSync(path.join(output, excluded)), false, excluded);
  const rule = fs.readFileSync(path.join(output, "rules", "AGENTS.md"), "utf8");
  assert.ok(rule.includes(fs.readFileSync(path.join(root, install.hostFrontDoor.managedBlock), "utf8").replace(/\r\n?/gu, "\n").trimEnd()));
  assert.ok(Buffer.byteLength(rule) <= 24000);
  assert.doesNotMatch(rule, /tavernweave-guidance-preference:begin|tavernweave-rewrite-policy:begin/u);
  const agent = fs.readFileSync(path.join(output, "agents", "tavernweave.md"), "utf8");
  assert.match(agent, /\n  - view_file\n/u);
  assert.doesNotMatch(agent, /\n  - (Read|Bash|Skill|AskUserQuestion)\n/u);
  const host = readJson("host-adapters/host-map.json").hosts.antigravity;
  assert.equal(host.pluginPackage, manifest.name);
  assert.equal(host.frontDoorMechanism, "plugin-always-on-rule");

  // Installed copies must resolve the AGY-only shared helper without the repo.
  const scopeRoot = path.join(base, "client");
  const target = path.join(scopeRoot, "config", "GEMINI.md");
  const preference = JSON.parse(execFileSync(process.execPath, [path.join(output, "skills/consult-tavernweave-library/scripts/manage-guidance-preference.mjs"), "--host", "antigravity", "--scope-root", scopeRoot, "--target", target], { encoding: "utf8" }));
  assert.equal(preference.statusAfter, "unset");
  assert.equal(fs.existsSync(scopeRoot), false);
  fs.mkdirSync(scopeRoot);
  const policy = JSON.parse(execFileSync(process.execPath, [path.join(output, "skills/rewrite-natural-prose/scripts/manage-rewrite-policy.mjs"), "--host", "antigravity", "--scope", "client", "--scope-root", scopeRoot, "--target", target], { encoding: "utf8" }));
  assert.equal(policy.statusAfter, "missing-file");
  assert.equal(fs.existsSync(target), false);
});

test("building never replaces an existing package or follows linked output", t => {
  const base = temporary(t);
  const existing = path.join(base, "existing");
  fs.mkdirSync(existing);
  fs.writeFileSync(path.join(existing, "mine"), "keep");
  assert.throws(() => build(existing), /already exists/u);
  assert.equal(fs.readFileSync(path.join(existing, "mine"), "utf8"), "keep");
  const linked = path.join(base, "linked");
  fs.symlinkSync(existing, linked, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => build(path.join(linked, "new")), /linked output/u);
  assert.throws(() => build(path.join(root, "skills", "not-an-output")), /outside the source/u);
  assert.equal(inspectSource().install.antigravityPlugin.status, "plugin-bundle");
});
