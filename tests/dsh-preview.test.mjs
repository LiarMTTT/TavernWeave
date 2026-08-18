import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dshRoot = path.join(root, "host-adapters", "dsh");
const contract = JSON.parse(fs.readFileSync(path.join(dshRoot, "tw-lite-contract.json"), "utf8"));
const full = fs.readFileSync(path.join(dshRoot, "tw-lite-full", "agent.cordis.yml"), "utf8");
const entry = fs.readFileSync(path.join(dshRoot, "tw-lite-entry", "agent.cordis.yml"), "utf8");

test("DSH preview contract stays explicitly unaccepted", () => {
  assert.equal(contract.upstream.auditedRootVersion, "0.1.0-rc.5");
  assert.equal(contract.status, "offline-candidate");
  assert.equal(contract.runtimeAccepted, false);
  assert.equal(contract.modelQualityClaim, "not-evaluated");
  assert.equal(contract.officialPresets.minimal.skillTool, false);
  assert.ok(contract.forbiddenClaimsBeforeRuntimeAcceptance.includes("tw-lite-maximizes-v4-intelligence"));
});

test("TW Lite candidates add Skills without broad tool surfaces", () => {
  for (const preset of [full, entry]) {
    for (const packageName of ["@deepseek-ai/dsh-skill-filesystem", "@deepseek-ai/dsh-tool-skill", "@deepseek-ai/dsh-tool-fs", "@deepseek-ai/dsh-tool-ask-user"]) assert.match(preset, new RegExp(packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    for (const forbidden of ["dsh-tool-web", "dsh-tool-subagent", "dsh-tool-workflow", "dsh-tool-ralph", "dsh-tool-todo", "dsh-tool-goal"]) assert.doesNotMatch(preset, new RegExp(forbidden));
    assert.match(preset, /灵魂杀手/u);
    assert.match(preset, /Soul 归位/u);
    assert.match(preset, /orchestrate-project-blueprint/u);
    assert.match(preset, /runtimePersistentBlueprintBudget at zero/u);
    assert.match(preset, /return to the parent step/u);
  }
});

test("Full catalog tracks 20 Skills while Entry remains a degraded four-Skill experiment", () => {
  assert.equal(contract.twLite.variants.full.skillCatalogCount, 20);
  assert.match(full, /reflect-on-vibe-code-growth/u);
  assert.doesNotMatch(entry, /reflect-on-vibe-code-growth/u);
  assert.deepEqual(contract.twLite.variants.entry.skillNames, ["activate-tavernweave-soul", "consult-tavernweave-library", "orchestrate-project-blueprint", "tavern-card-builder"]);
  assert.equal(contract.twLite.variants.entry.requiresDedicatedSkillRoot, true);
  assert.equal(contract.twLite.variants.entry.degradedSecondaryRouting, true);
});
