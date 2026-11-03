import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { managePreference } from "../skills/consult-tavernweave-library/scripts/manage-guidance-preference.mjs";
import { managePolicy } from "../skills/rewrite-natural-prose/scripts/manage-rewrite-policy.mjs";

function fixture(t) {
  const parent = path.resolve(process.env.TW_TEST_ROOT || os.tmpdir());
  fs.mkdirSync(parent, { recursive: true });
  const base = fs.mkdtempSync(path.join(parent, "tw-agy-state-"));
  t.after(() => {
    assert.equal(path.dirname(base), parent);
    assert.ok(path.basename(base).startsWith("tw-agy-state-"));
    fs.rmSync(base, { recursive: true, force: true });
  });
  const scopeRoot = path.join(base, "client");
  fs.mkdirSync(scopeRoot);
  return { host: "antigravity", scope: "client", scopeRoot, target: path.join(scopeRoot, "AGENTS.md"), backupDir: path.join(base, "backups") };
}
function set(options, level = "入门") {
  const preview = managePreference({ ...options, action: "preview", level });
  return managePreference({ ...options, action: "set", level, approved: true, expectedToken: preview.previewToken });
}
function policy(options, operation = "enable") {
  const preview = managePolicy({ ...options, action: "preview", operation });
  return managePolicy({ ...options, action: operation, approved: true, expectedToken: preview.previewToken });
}

for (const name of ["AGENTS.md", "GEMINI.md", "config/AGENTS.md", "config/GEMINI.md"]) {
  test(`AGY cumulative global target ${name} preserves bytes, backups and authorization`, t => {
    const options = fixture(t);
    options.target = path.join(options.scopeRoot, name);
    fs.mkdirSync(path.dirname(options.target), { recursive: true });
    const original = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("我的规则\r\n")]);
    fs.writeFileSync(options.target, original);
    assert.equal(managePreference(options).level, null);
    assert.throws(() => managePreference({ ...options, action: "set", level: "入门" }), /明确许可/u);
    const result = set(options);
    assert.deepEqual(fs.readFileSync(result.backupPath), original);
    assert.deepEqual(fs.readFileSync(options.target).subarray(0, original.length), original);
    assert.equal(result.hostLoading, "not-verified");
    const beforePolicy = fs.readFileSync(options.target);
    assert.equal(policy(options).statusAfter, "current");
    assert.equal(managePreference(options).level, "入门");
    assert.equal(policy(options, "disable").statusAfter, "missing-block");
    assert.deepEqual(fs.readFileSync(options.target), beforePolicy);
    assert.equal(set(options).changed, false);
  });
}

test("AGY does not apply Codex shadowing, but rejects a second managed preference", t => {
  const options = fixture(t);
  const other = path.join(options.scopeRoot, "GEMINI.md");
  fs.writeFileSync(other, "Unrelated global rule\n");
  assert.equal(set(options).level, "入门");
  const bytes = fs.readFileSync(other);
  assert.throws(() => set({ ...options, target: other }, "老手"), /also loads a managed block/u);
  assert.deepEqual(fs.readFileSync(other), bytes);
});

test("a newly discovered cumulative source invalidates both preview tokens", t => {
  const options = fixture(t);
  const preference = managePreference({ ...options, action: "preview", level: "新人" });
  const rewrite = managePolicy({ ...options, action: "preview" });
  fs.mkdirSync(path.join(options.scopeRoot, "config", "rules"), { recursive: true });
  fs.writeFileSync(path.join(options.scopeRoot, "config", "rules", "custom.md"), "---\ntrigger: always_on\n---\nNew rule\n");
  assert.throws(() => managePreference({ ...options, action: "set", level: "新人", approved: true, expectedToken: preference.previewToken }), /过期/u);
  assert.throws(() => managePolicy({ ...options, action: "enable", approved: true, expectedToken: rewrite.previewToken }), /stale/u);
  assert.equal(fs.existsSync(options.target), false);
});

test("managed blocks in modular AGY rules cannot create competing saved state", t => {
  const options = fixture(t);
  set(options);
  const saved = fs.readFileSync(options.target);
  fs.writeFileSync(options.target, "unrelated\n");
  const rules = path.join(options.scopeRoot, "config", "rules");
  fs.mkdirSync(rules, { recursive: true });
  fs.writeFileSync(path.join(rules, "preference.md"), saved);
  assert.throws(() => managePreference(options), /also loads a managed block/u);
  assert.equal(fs.readFileSync(options.target, "utf8"), "unrelated\n");
});

test("workspace policy checks parents through the Git root without applying client shadowing", t => {
  const options = fixture(t);
  options.scope = "workspace";
  fs.mkdirSync(path.join(options.scopeRoot, ".git"));
  policy(options);
  const nested = path.join(options.scopeRoot, "src");
  fs.mkdirSync(nested);
  assert.throws(() => policy({ ...options, scopeRoot: nested, target: path.join(nested, "GEMINI.md") }), /also loads a managed block/u);
  assert.equal(fs.existsSync(path.join(nested, "GEMINI.md")), false);
  policy(options, "disable");
  const target = path.join(nested, ".agents", "GEMINI.md");
  assert.equal(policy({ ...options, scopeRoot: nested, target }).statusAfter, "current");
});

test("unsupported AGY discovery and linked files fail without writing", t => {
  const options = fixture(t);
  assert.throws(() => set({ ...options, target: path.join(options.scopeRoot, "other.md") }), /Unsupported/u);
  fs.mkdirSync(path.join(options.scopeRoot, "config"));
  const manifest = path.join(options.scopeRoot, "config", "rules.json");
  fs.writeFileSync(manifest, '{"entries":[]}');
  assert.throws(() => set(options), /manual discovery review/u);
  assert.throws(() => policy(options), /manual discovery review/u);
  fs.unlinkSync(manifest);
  fs.writeFileSync(options.target, "@[shared](../shared.md)\n");
  assert.throws(() => set(options), /includes need manual/u);
  assert.equal(fs.readFileSync(options.target, "utf8"), "@[shared](../shared.md)\n");
  fs.writeFileSync(options.target, "keep\n");
  const rules = path.join(options.scopeRoot, "config", "rules");
  fs.symlinkSync(options.scopeRoot, rules, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => policy(options), /linked Antigravity rules/u);
  assert.equal(fs.readFileSync(options.target, "utf8"), "keep\n");
});
