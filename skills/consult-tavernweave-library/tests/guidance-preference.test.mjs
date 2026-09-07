import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { managePreference, inspectPreference, LEVELS } from "../scripts/manage-guidance-preference.mjs";

function fixture(t, host = "codex") {
  const base = path.resolve(process.env.TW_TEST_ROOT || os.tmpdir());
  fs.mkdirSync(base, { recursive: true });
  const root = fs.mkdtempSync(path.join(base, "tw-guidance-"));
  t.after(() => {
    const relative = path.relative(base, root);
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const scopeRoot = path.join(root, "client");
  const target = path.join(scopeRoot, host === "codex" ? "AGENTS.md" : "CLAUDE.md");
  return { root, host, scopeRoot, target, backupDir: path.join(root, "backups") };
}
function set(options, level) {
  const preview = managePreference({ ...options, action: "preview", level });
  return managePreference({ ...options, action: "set", level, approved: true, expectedToken: preview.previewToken });
}

test("check and preview do not create missing client directories or select a default", t => {
  const options = fixture(t);
  assert.equal(managePreference(options).statusAfter, "unset");
  assert.equal(managePreference(options).level, null);
  const preview = managePreference({ ...options, action: "preview", level: "入门" });
  assert.equal(preview.proposedLevel, "入门");
  assert.equal(preview.level, null);
  assert.equal(fs.existsSync(options.scopeRoot), false);
});

for (const level of LEVELS) test(`explicit ${level} selection persists and repeated selection does not write`, t => {
  const options = fixture(t);
  const first = set(options, level);
  assert.equal(first.changed, true);
  assert.equal(first.level, level);
  assert.equal(first.hostLoading, "not-verified");
  const bytes = fs.readFileSync(options.target);
  assert.equal(set(options, level).changed, false);
  assert.equal(managePreference(options).level, level);
  assert.deepEqual(fs.readFileSync(options.target), bytes);
});

test("changing level requires authorization and a token bound to the same level", t => {
  const options = fixture(t);
  set(options, "熟练");
  const preview = managePreference({ ...options, action: "preview", level: "入门" });
  const before = fs.readFileSync(options.target);
  assert.throws(() => managePreference({ ...options, action: "set", level: "入门", expectedToken: preview.previewToken }), /明确许可/u);
  assert.throws(() => managePreference({ ...options, action: "set", level: "老手", approved: true, expectedToken: preview.previewToken }), /过期/u);
  assert.deepEqual(fs.readFileSync(options.target), before);
  assert.equal(set(options, "入门").level, "入门");
});

for (const [name, text, bom] of [["unterminated UTF-8", "保留用户内容", false], ["CRLF and BOM", "保留\r\n另一行\r\n", true], ["CR-only", "保留\r另一行\r", false]]) {
  test(`preserves unrelated bytes and backup: ${name}`, t => {
    const options = fixture(t);
    fs.mkdirSync(options.scopeRoot);
    const original = Buffer.concat([bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text)]);
    fs.writeFileSync(options.target, original);
    const first = set(options, "新人");
    assert.deepEqual(fs.readFileSync(first.backupPath), original);
    assert.deepEqual(fs.readFileSync(options.target).subarray(0, original.length), original);
    const current = fs.readFileSync(options.target);
    const second = set(options, "老手");
    assert.deepEqual(fs.readFileSync(second.backupPath), current);
    assert.deepEqual(fs.readFileSync(options.target).subarray(0, original.length), original);
  });
}

test("a stale file or changed effective target cannot be overwritten", t => {
  const options = fixture(t);
  set(options, "老手");
  const preview = managePreference({ ...options, action: "preview", level: "入门" });
  fs.appendFileSync(options.target, "新的用户说明\n");
  const changed = fs.readFileSync(options.target);
  assert.throws(() => managePreference({ ...options, action: "set", level: "入门", approved: true, expectedToken: preview.previewToken }), /过期/u);
  assert.deepEqual(fs.readFileSync(options.target), changed);
  const fresh = managePreference({ ...options, action: "preview", level: "入门" });
  fs.writeFileSync(path.join(options.scopeRoot, "AGENTS.override.md"), "优先规则\n");
  assert.throws(() => managePreference({ ...options, action: "set", level: "入门", approved: true, expectedToken: fresh.previewToken }), /遮蔽/u);
  assert.deepEqual(fs.readFileSync(options.target), changed);
});

test("invalid, duplicate, quoted and nested preferences are not silently adopted or repaired", t => {
  const options = fixture(t);
  set(options, "入门");
  const good = fs.readFileSync(options.target, "utf8");
  for (const bad of [good + good, good.replace("schema=1", "schema=9"), good.replace("TW_GUIDANCE_LEVEL=入门", "TW_GUIDANCE_LEVEL=自动"), "```md\n" + good + "```\n", "<!-- tavernweave-host-front-door:begin version=1.4.0 -->\n" + good + "<!-- tavernweave-host-front-door:end -->\n", good.replace("用户明确选择", "模型推断选择")]) {
    fs.writeFileSync(options.target, bad);
    assert.equal(managePreference(options).level, null);
    assert.throws(() => managePreference({ ...options, action: "preview", level: "老手" }), /损坏/u);
    assert.equal(fs.readFileSync(options.target, "utf8"), bad);
  }
});

test("preview contains only owned content and preserves neighboring rewrite and front-door blocks", t => {
  const options = fixture(t);
  fs.mkdirSync(options.scopeRoot);
  const neighbor = "PRIVATE_USER_NOTE\n<!-- tavernweave-rewrite-policy:begin version=1.4.0 scope=client separator=0 -->\nexisting rewrite policy\n<!-- tavernweave-rewrite-policy:end -->\n<!-- tavernweave-host-front-door:begin version=1.4.0 -->\nexisting front door\n<!-- tavernweave-host-front-door:end -->\n";
  fs.writeFileSync(options.target, neighbor);
  const preview = managePreference({ ...options, action: "preview", level: "新人" });
  assert.equal(JSON.stringify(preview).includes("PRIVATE_USER_NOTE"), false);
  set(options, "新人");
  set(options, "熟练");
  assert.ok(fs.readFileSync(options.target, "utf8").startsWith(neighbor));
});

test("client overrides, Claude, invalid input and unsupported hosts are handled explicitly", t => {
  const options = fixture(t);
  fs.mkdirSync(options.scopeRoot);
  const override = path.join(options.scopeRoot, "AGENTS.override.md");
  fs.writeFileSync(override, "有效全局规则\n");
  assert.throws(() => set(options, "入门"), /遮蔽/u);
  assert.equal(set({ ...options, target: override }, "入门").level, "入门");
  const claude = fixture(t, "claude");
  assert.equal(set(claude, "老手").level, "老手");
  assert.throws(() => managePreference({ ...options, host: "dsh" }), /DSH/u);
  assert.throws(() => managePreference({ ...options, level: "自动" }), /只能/u);
  assert.throws(() => managePreference({ ...options, scopeRoot: "." }), /绝对路径/u);
});

test("invalid encoding, linked paths and a busy writer fail without replacing the file", t => {
  const options = fixture(t);
  fs.mkdirSync(options.scopeRoot);
  const bytes = Buffer.from([0xff, 0xfe, 0x61]);
  fs.writeFileSync(options.target, bytes);
  assert.throws(() => set(options, "新人"), /UTF-8/u);
  assert.deepEqual(fs.readFileSync(options.target), bytes);
  fs.writeFileSync(options.target, "保留\n");
  const linked = path.join(options.root, "linked");
  fs.symlinkSync(options.scopeRoot, linked, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => managePreference({ ...options, scopeRoot: linked, target: path.join(linked, "AGENTS.md") }), /链接/u);
  fs.writeFileSync(options.target + ".tw-guidance.lock", "busy");
  assert.throws(() => set(options, "新人"), /EEXIST/u);
  assert.equal(fs.readFileSync(options.target, "utf8"), "保留\n");
});

test("a copied skill manager works without the repository and reports no host-loading claim", t => {
  const options = fixture(t);
  const copied = path.join(options.root, "manage-guidance-preference.mjs");
  fs.copyFileSync(fileURLToPath(new URL("../scripts/manage-guidance-preference.mjs", import.meta.url)), copied);
  const receipt = JSON.parse(execFileSync(process.execPath, [copied, "--host", "codex", "--scope-root", options.scopeRoot, "--target", options.target], { encoding: "utf8" }));
  assert.equal(receipt.statusAfter, "unset");
  assert.equal(receipt.hostLoading, "not-verified");
  assert.equal(inspectPreference("引用：以后用老手档\n").level, null);
});

test("CLI receipts survive legacy console decoding without losing Unicode paths, levels or errors", t => {
  const options = fixture(t);
  const scopeRoot = path.join(options.root, "中文客户端-🧵");
  const target = path.join(scopeRoot, "AGENTS.md");
  const manager = fileURLToPath(new URL("../scripts/manage-guidance-preference.mjs", import.meta.url));
  const args = [manager, "--host", "codex", "--scope-root", scopeRoot, "--target", target, "--action", "preview"];
  const bytes = execFileSync(process.execPath, [...args, "--level", "入门"]);
  assert.ok(bytes.every(byte => byte < 128), "CLI JSON must survive legacy ASCII-compatible code pages");
  const receipt = JSON.parse(new TextDecoder("gb18030").decode(bytes));
  assert.equal(receipt.proposedLevel, "入门");
  assert.ok(JSON.stringify(receipt).includes("中文客户端-🧵"));
  assert.ok(receipt.diff.after.includes("TW_GUIDANCE_LEVEL=入门"));
  const failure = spawnSync(process.execPath, [...args, "--level", "不存在"]);
  assert.equal(failure.status, 1);
  assert.ok(failure.stderr.every(byte => byte < 128));
  assert.match(JSON.parse(new TextDecoder("gb18030").decode(failure.stderr)).error, /只能/u);
  assert.equal(fs.existsSync(scopeRoot), false);
});

test("an atomic replacement failure preserves the original, backup and a usable retry", t => {
  const options = fixture(t);
  fs.mkdirSync(options.scopeRoot);
  const original = Buffer.from("保留原有规则\r\n", "utf8");
  fs.writeFileSync(options.target, original);
  const replacement = t.mock.method(fs, "renameSync", () => {
    const error = new Error("simulated replacement denied");
    error.code = "EACCES";
    throw error;
  });
  assert.throws(() => set(options, "熟练"), /replacement denied/u);
  assert.deepEqual(fs.readFileSync(options.target), original);
  const backups = fs.readdirSync(options.backupDir);
  assert.equal(backups.length, 1);
  assert.deepEqual(fs.readFileSync(path.join(options.backupDir, backups[0])), original);
  assert.deepEqual(fs.readdirSync(options.scopeRoot), ["AGENTS.md"]);
  replacement.mock.restore();
  assert.equal(set(options, "熟练").level, "熟练");
});
