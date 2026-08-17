import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initializeProjectAuthority } from "../scripts/init-project-authority.mjs";
import { resolveBrainstormCommand } from "../scripts/resolve-brainstorm-command.mjs";
import { validateProjectAuthority, validateProjectAuthorityFile } from "../scripts/validate-project-authority.mjs";

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tavernweave-blueprint-"));
}

function loadManifest(root) {
  return JSON.parse(fs.readFileSync(path.join(root, ".tavernweave", "project-orchestration.json"), "utf8"));
}

test("direct brainstorm commands resolve without matching quoted fixtures", () => {
  assert.equal(resolveBrainstormCommand("脑暴模式！").mode, "neutral");
  assert.equal(resolveBrainstormCommand("脑暴模式，Soul 联席").mode, "soul-ensemble");
  assert.equal(resolveBrainstormCommand("三人一起脑暴").action, "activate");
  assert.equal(resolveBrainstormCommand("按蓝图开跑第一版").action, "execute");
  assert.equal(resolveBrainstormCommand("请分析‘脑暴模式’这句话").matched, false);
  assert.equal(resolveBrainstormCommand("测试夹具：按蓝图开跑第一版").matched, false);
});

test("initializer creates the minimal authority chain and refuses overwrite", () => {
  const root = tempProject();
  try {
    const dry = initializeProjectAuthority({ root, profile: "blueprint-set", projectId: "demo", title: "演示", dryRun: true, date: "2026-08-17" });
    assert.equal(dry.created.length, 0);
    assert.deepEqual(dry.planned, [".tavernweave/project-orchestration.json", "总设计案.md", "蓝图集/BLUEPRINT_INDEX.md", "NEXT.md"]);
    const created = initializeProjectAuthority({ root, profile: "blueprint-set", projectId: "demo", title: "演示", date: "2026-08-17" });
    assert.equal(created.created.length, 4);
    assert.deepEqual(validateProjectAuthorityFile(path.join(root, ".tavernweave", "project-orchestration.json"), { automation: true }), []);
    assert.throws(() => initializeProjectAuthority({ root, profile: "blueprint-set", projectId: "demo", title: "演示" }), /refusing to overwrite/u);
    assert.equal(fs.existsSync(path.join(root, "蓝图集", "BP-01.md")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("validator rejects blueprint fractalization and discussion overruns", () => {
  const root = tempProject();
  try {
    initializeProjectAuthority({ root, profile: "single-blueprint", projectId: "demo", title: "演示", date: "2026-08-17" });
    const data = loadManifest(root);
    data.blueprintPolicy.blueprints.push({ id: "BP-01", path: "BP-01.md", parentId: "BP-ROOT", depth: 2, status: "candidate" });
    data.discussionDirections.push({ id: "DIR-01", topic: "界面", level: "standard", roundLimit: 2, roundsUsed: 3, status: "active" });
    const errors = validateProjectAuthority(data, { root, automation: true });
    assert.ok(errors.some((error) => error.includes("exceeds maxDepth")));
    assert.ok(errors.some((error) => error.includes("exceeds its discussion budget")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("extra discussion rounds require driver approval and blueprint totals stay bounded", () => {
  const root = tempProject();
  try {
    initializeProjectAuthority({ root, profile: "blueprint-set", projectId: "demo", title: "演示", date: "2026-08-17" });
    const data = loadManifest(root);
    data.discussionDirections.push({ id: "DIR-01", topic: "核心循环", level: "core", roundLimit: 4, roundsUsed: 3, status: "active" });
    for (let index = 1; index <= 6; index += 1) data.blueprintPolicy.blueprints.push({ id: `BP-0${index}`, path: `蓝图集/BP-0${index}.md`, parentId: "BP-ROOT", depth: 2, status: "candidate" });
    const errors = validateProjectAuthority(data, { root });
    assert.ok(errors.includes("direction DIR-01 extra round requires driver approval"));
    assert.ok(errors.includes("blueprint set exceeds total child budget 5"));
    data.discussionDirections[0].extensionApprovedBy = "driver";
    assert.equal(validateProjectAuthority(data, { root }).some((error) => error.includes("extra round")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an observed problem may open one temporary refinement and must return to its parent", () => {
  const root = tempProject();
  try {
    initializeProjectAuthority({ root, profile: "single-blueprint", projectId: "demo", title: "演示", date: "2026-08-17" });
    const data = loadManifest(root);
    data.runtimeRefinements.push({
      id: "REF-001",
      kind: "temporary-problem-refinement",
      parentStep: "P4",
      problem: "390px 下提交按钮被软键盘遮挡",
      triggerEvidence: "真实窄屏复现记录",
      persistent: false,
      expandsProductScope: false,
      status: "resolved",
      resultEvidence: "390px 复验通过",
      returnTo: "P4"
    });
    assert.deepEqual(validateProjectAuthority(data, { root }), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("temporary refinements cannot be speculative, recursive, scope-expanding, or detached from the parent", () => {
  const root = tempProject();
  try {
    initializeProjectAuthority({ root, profile: "single-blueprint", projectId: "demo", title: "演示", date: "2026-08-17" });
    const data = loadManifest(root);
    data.runtimeRefinementPolicy.maxDepth = 2;
    data.runtimeRefinements.push({ id: "REF-001", kind: "temporary-problem-refinement", parentStep: "P1", problem: "可能以后会复杂", triggerEvidence: "", persistent: true, expandsProductScope: true, status: "active", returnTo: "P2" });
    data.runtimeRefinements.push({ id: "REF-002", kind: "temporary-problem-refinement", parentStep: "P1", problem: "另一个并行问题", triggerEvidence: "可观察失败", persistent: false, expandsProductScope: false, status: "active", returnTo: "P1" });
    const errors = validateProjectAuthority(data, { root });
    assert.ok(errors.includes("runtime refinement maxDepth must remain 1"));
    assert.ok(errors.includes("runtime refinement REF-001 triggerEvidence is required"));
    assert.ok(errors.includes("runtime refinement REF-001 must remain non-persistent"));
    assert.ok(errors.includes("runtime refinement REF-001 may not expand product scope"));
    assert.ok(errors.includes("runtime refinement REF-001 must return to its parent step"));
    assert.ok(errors.includes("only one runtime problem refinement may be active at a time"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("frontend override preserves prototype and real-host gates", () => {
  const root = tempProject();
  try {
    initializeProjectAuthority({ root, profile: "single-blueprint", projectId: "demo", title: "演示", date: "2026-08-17" });
    const data = loadManifest(root);
    data.frontendDecision = { recommended: "text-first", fit: "not-recommended", reason: "no interaction value", fallback: "text-first", reopenWhen: "a real interaction appears", driverOverride: true, prototypeGateRequired: false, realHostGateRequired: true };
    assert.ok(validateProjectAuthority(data, { root }).includes("frontend override requires prototype and real-host gates"));
    data.frontendDecision.prototypeGateRequired = true;
    assert.equal(validateProjectAuthority(data, { root }).some((error) => error.includes("frontend override")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("automation cannot grant driver acceptance", () => {
  const root = tempProject();
  try {
    initializeProjectAuthority({ root, profile: "single-blueprint", projectId: "demo", title: "演示", date: "2026-08-17" });
    const data = loadManifest(root);
    data.state = "driver-accepted";
    data.acceptance.driver.status = "accepted";
    const errors = validateProjectAuthority(data, { root, automation: true });
    assert.ok(errors.includes("automation cannot set state: driver-accepted"));
    assert.ok(errors.includes("automation cannot mark driver acceptance"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
