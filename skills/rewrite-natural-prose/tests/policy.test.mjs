import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { managePolicy, HOST_FILES } from "../scripts/manage-rewrite-policy.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function fixture(t, host = "codex", scope = "workspace") {
  const temporaryRoot = path.resolve(process.env.TW_TEST_ROOT || os.tmpdir());
  const root = fs.mkdtempSync(path.join(temporaryRoot, "tw-rewrite-"));
  t.after(() => {
    const relative = path.relative(temporaryRoot, root);
    assert.ok(relative.startsWith("tw-rewrite-") && !relative.includes(path.sep));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { host, scope, scopeRoot: root, target: path.join(root, HOST_FILES[host]), fallbackNames: [], backupDir: path.join(root, "backups") };
}
function apply(options, operation = "enable") {
  const preview = managePolicy({ ...options, action: "preview", operation });
  return managePolicy({ ...options, action: operation, expectedToken: preview.previewToken, approved: true });
}

test("host filenames match the distribution mapping", () => {
  const mapping = JSON.parse(fs.readFileSync(path.join(skillRoot, "../../host-adapters/host-map.json"), "utf8"));
  for (const [host, name] of Object.entries(HOST_FILES)) assert.equal(mapping.hosts[host].instructionFileName, name);
});

test("check/preview are read-only and preview does not disclose unrelated rules", t => {
  const options = fixture(t);
  assert.equal(managePolicy(options).statusAfter, "missing-file");
  const before = fs.readdirSync(options.scopeRoot);
  assert.equal(managePolicy({ ...options, action: "preview" }).statusAfter, "missing-file");
  assert.deepEqual(fs.readdirSync(options.scopeRoot), before);
  fs.writeFileSync(options.target, "PRIVATE_DRIVER_NOTE 保留\n");
  const preview = managePolicy({ ...options, action: "preview" });
  assert.equal(preview.diff.before, "");
  assert.ok(!JSON.stringify(preview).includes("PRIVATE_DRIVER_NOTE"));
});

test("enable requires both concrete approval and a current preview token", t => {
  const options = fixture(t);
  const preview = managePolicy({ ...options, action: "preview" });
  assert.throws(() => managePolicy({ ...options, action: "enable", expectedToken: preview.previewToken }), /approval/u);
  assert.throws(() => managePolicy({ ...options, action: "enable", approved: true }), /token/u);
  assert.ok(!fs.existsSync(options.target));
});

test("first enable, repeated enable, disable and repeated disable are bounded", t => {
  const options = fixture(t);
  const enabled = apply(options);
  assert.equal(enabled.statusAfter, "current");
  assert.equal(enabled.hostLoading, "not-verified");
  const bytes = fs.readFileSync(options.target);
  const mtime = fs.statSync(options.target).mtimeMs;
  assert.equal(apply(options).changed, false);
  assert.deepEqual(fs.readFileSync(options.target), bytes);
  assert.equal(fs.statSync(options.target).mtimeMs, mtime);
  assert.equal(apply(options, "disable").statusAfter, "missing-block");
  assert.equal(apply(options, "disable").changed, false);
  assert.equal(fs.readFileSync(options.target, "utf8"), "");
});

for (const [name, original] of [
  ["UTF-8 without final newline", Buffer.from("# 驾驶员\n保留这段原文")],
  ["UTF-8 CRLF with BOM", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("# 驾驶员\r\n规则保留\r\n")])],
  ["UTF-8 CR-only", Buffer.from("# 驾驶员\r规则保留\r")],
]) {
  test(`enable/disable preserves original bytes: ${name}`, t => {
    const options = fixture(t);
    fs.writeFileSync(options.target, original);
    const enabled = apply(options);
    assert.deepEqual(fs.readFileSync(enabled.backupPath), original);
    apply(options, "disable");
    assert.deepEqual(fs.readFileSync(options.target), original);
    fs.copyFileSync(enabled.backupPath, options.target);
    assert.deepEqual(fs.readFileSync(options.target), original);
  });
}

test("removal preserves user text appended after the block", t => {
  const options = fixture(t);
  fs.writeFileSync(options.target, "before\n");
  apply(options);
  fs.appendFileSync(options.target, "after\n");
  apply(options, "disable");
  assert.equal(fs.readFileSync(options.target, "utf8"), "before\nafter\n");
});

test("removal does not join user lines when an originally unterminated file gained a suffix", t => {
  const options = fixture(t);
  fs.writeFileSync(options.target, "before");
  apply(options);
  fs.appendFileSync(options.target, "after\n");
  apply(options, "disable");
  assert.equal(fs.readFileSync(options.target, "utf8"), "before\nafter\n");
});

test("workspace and client policies are independent", t => {
  const workspace = fixture(t);
  const client = fixture(t, "codex", "client");
  apply(workspace); apply(client);
  const clientBytes = fs.readFileSync(client.target);
  apply(workspace, "disable");
  assert.deepEqual(fs.readFileSync(client.target), clientBytes);
  assert.equal(managePolicy(client).statusAfter, "current");
});

test("changed file rejects stale preview without overwriting it", t => {
  const options = fixture(t);
  fs.writeFileSync(options.target, "original");
  const preview = managePolicy({ ...options, action: "preview" });
  fs.writeFileSync(options.target, "driver edited this");
  assert.throws(() => managePolicy({ ...options, action: "enable", approved: true, expectedToken: preview.previewToken }), /stale/u);
  assert.equal(fs.readFileSync(options.target, "utf8"), "driver edited this");
  assert.ok(!fs.existsSync(options.backupDir));
});

test("Codex override and configured fallback are honored without shadow files", t => {
  const options = fixture(t);
  const fallback = path.join(options.scopeRoot, "TEAM.md");
  fs.writeFileSync(fallback, "active fallback");
  const withFallback = { ...options, fallbackNames: ["TEAM.md"] };
  assert.throws(() => managePolicy(withFallback), /shadowed/u);
  apply({ ...withFallback, target: fallback });
  assert.ok(!fs.existsSync(options.target));
  const override = path.join(options.scopeRoot, "AGENTS.override.md");
  fs.writeFileSync(override, "active override");
  assert.throws(() => managePolicy({ ...withFallback, target: fallback }), /shadowed/u);
  apply({ ...withFallback, target: override });
  assert.equal(managePolicy({ ...withFallback, target: override }).statusAfter, "current");
});

test("missing discovery data and changed discovery cannot silently enable", t => {
  const options = fixture(t);
  assert.throws(() => managePolicy({ ...options, fallbackNames: undefined }), /fallback/u);
  assert.throws(() => managePolicy({ ...options, fallbackNames: ["../OUTSIDE.md"] }), /filenames/u);
  const preview = managePolicy({ ...options, action: "preview" });
  fs.writeFileSync(path.join(options.scopeRoot, "AGENTS.override.md"), "new effective rule");
  assert.throws(() => managePolicy({ ...options, action: "enable", approved: true, expectedToken: preview.previewToken }), /shadowed/u);
  assert.ok(!fs.existsSync(options.target));
});

test("outdated and edited owned blocks require reviewed replacement", t => {
  const options = fixture(t);
  fs.writeFileSync(options.target, "untouched\n");
  apply(options);
  fs.writeFileSync(options.target, fs.readFileSync(options.target, "utf8").replace("version=1.4.0", "version=1.3.0"));
  assert.equal(managePolicy(options).statusAfter, "outdated");
  apply(options);
  fs.writeFileSync(options.target, fs.readFileSync(options.target, "utf8").replace("轻度文本精修", "自定义文本精修"));
  assert.equal(managePolicy(options).statusAfter, "drifted");
  apply(options);
  assert.equal(managePolicy(options).statusAfter, "current");
  assert.ok(fs.readFileSync(options.target, "utf8").startsWith("untouched\n"));
});

test("duplicate, malformed and wrong-scope markers never get overwritten", t => {
  const options = fixture(t);
  apply(options);
  const valid = fs.readFileSync(options.target, "utf8");
  for (const invalid of [valid + valid, valid.replace("scope=workspace", "scope=client"), valid.replace("tavernweave-rewrite-policy:end", "BROKEN-END")]) {
    fs.writeFileSync(options.target, invalid);
    assert.equal(managePolicy(options).statusAfter, "invalid-markers");
    assert.throws(() => managePolicy({ ...options, action: "preview" }), /markers/u);
    assert.equal(fs.readFileSync(options.target, "utf8"), invalid);
  }
});

test("unsupported hosts, wrong targets and invalid encoding are refused", t => {
  const options = fixture(t);
  assert.throws(() => managePolicy({ ...options, host: "dsh" }), /unavailable/u);
  assert.throws(() => managePolicy({ ...options, target: path.join(options.scopeRoot, "agent.md") }), /unsupported/u);
  fs.writeFileSync(options.target, Buffer.from([0xff, 0xfe, 0x61]));
  assert.throws(() => managePolicy(options), /UTF-8/u);
});

test("linked scope directories are refused", t => {
  const options = fixture(t);
  const linked = path.join(options.scopeRoot, "linked");
  const actual = path.join(options.scopeRoot, "actual");
  fs.mkdirSync(actual);
  fs.symlinkSync(actual, linked, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => managePolicy({ ...options, scopeRoot: linked, target: path.join(linked, "AGENTS.md") }), /linked/u);
});

test("Claude workspace and client use explicit supported instruction files", t => {
  for (const scope of ["workspace", "client"]) {
    const options = fixture(t, "claude", scope);
    fs.writeFileSync(options.target, "Keep Claude conventions.\n");
    apply(options); apply(options, "disable");
    assert.equal(fs.readFileSync(options.target, "utf8"), "Keep Claude conventions.\n");
  }
});

test("skills-only copied manager runs without repository resources", t => {
  const options = fixture(t);
  const installed = path.join(options.scopeRoot, "installed-skill");
  fs.cpSync(skillRoot, installed, { recursive: true });
  const invocation = spawnSync(process.execPath, [path.join(installed, "scripts/manage-rewrite-policy.mjs"), "--host", options.host, "--scope", options.scope, "--scope-root", options.scopeRoot, "--target", options.target, "--fallback-names", "[]"], { encoding: "utf8" });
  assert.equal(invocation.status, 0, invocation.stderr);
  assert.equal(JSON.parse(invocation.stdout).statusAfter, "missing-file");
  assert.ok(!fs.existsSync(options.target));
});
