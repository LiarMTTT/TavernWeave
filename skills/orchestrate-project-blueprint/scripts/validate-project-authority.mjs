#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const profileLimits = {
  "single-blueprint": { maxDepth: 1, maxChildren: 0 },
  "blueprint-set": { maxDepth: 2, maxChildren: 5 },
  "program-blueprint-set": { maxDepth: 3, maxChildren: 9 },
};
const states = new Set(["brainstorm-candidate", "driver-approved-design", "implementation-candidate", "automated-evidence", "real-host-evidence", "driver-accepted"]);
const directionLevels = new Map([["peripheral", 1], ["standard", 2], ["core", 3], ["foundational", 4]]);
const directionStatuses = new Set(["active", "frozen", "parked", "closed"]);
const blueprintStatuses = new Set(["candidate", "driver-approved", "active", "completed", "blocked", "retired"]);
const recommendations = new Set(["undecided", "text-first", "lightweight-display", "same-floor", "independent-ui", "hybrid"]);
const fits = new Set(["suitable", "conditional", "not-recommended"]);
const refinementStatuses = new Set(["active", "resolved", "blocked"]);

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function safeTarget(root, relative, label, errors) {
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative) || relative.split(/[\\/]/u).includes("..")) {
    errors.push(`${label} must be a safe relative path`);
    return null;
  }
  const target = path.resolve(root, relative);
  const prefix = `${path.resolve(root)}${path.sep}`.toLowerCase();
  if (target.toLowerCase() !== path.resolve(root).toLowerCase() && !target.toLowerCase().startsWith(prefix)) {
    errors.push(`${label} escapes project root`);
    return null;
  }
  return target;
}

function requireHeadings(file, headings, label, errors) {
  if (!fs.existsSync(file)) {
    errors.push(`missing ${label}: ${file}`);
    return;
  }
  const text = fs.readFileSync(file, "utf8");
  for (const heading of headings) if (!text.includes(`## ${heading}`)) errors.push(`${label} missing heading: ${heading}`);
}

export function validateProjectAuthority(data, { root, automation = false } = {}) {
  const errors = [];
  if (!isRecord(data)) return ["authority must be a JSON object"];
  if (data.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (data.authoritySchema !== "tavernweave/project-orchestration/v1") errors.push("unsupported authoritySchema");
  if (!data.projectId) errors.push("projectId is required");
  if (!data.title) errors.push("title is required");
  const limits = profileLimits[data.profile];
  if (!limits) errors.push(`unsupported profile: ${data.profile}`);
  if (!states.has(data.state)) errors.push(`invalid state: ${data.state}`);
  if (automation && data.state === "driver-accepted") errors.push("automation cannot set state: driver-accepted");

  const policy = data.blueprintPolicy;
  if (!isRecord(policy)) errors.push("blueprintPolicy is required");
  else if (limits) {
    if (policy.maxDepth !== limits.maxDepth) errors.push(`maxDepth for ${data.profile} must be ${limits.maxDepth}`);
    if (policy.maxChildren !== limits.maxChildren) errors.push(`maxChildren for ${data.profile} must be ${limits.maxChildren}`);
    if (policy.runtimePersistentBlueprintBudget !== 0) errors.push("runtimePersistentBlueprintBudget must remain 0");
    if (!Array.isArray(policy.blueprints) || policy.blueprints.length === 0) errors.push("at least one blueprint must be declared");
    else {
      const ids = new Set();
      const children = new Map();
      for (const item of policy.blueprints) {
        if (!isRecord(item) || !item.id) { errors.push("blueprint id is required"); continue; }
        if (ids.has(item.id)) errors.push(`duplicate blueprint id: ${item.id}`);
        ids.add(item.id);
        if (!Number.isInteger(item.depth) || item.depth < 1 || item.depth > limits.maxDepth) errors.push(`blueprint ${item.id} exceeds maxDepth ${limits.maxDepth}`);
        if (!blueprintStatuses.has(item.status)) errors.push(`invalid blueprint status for ${item.id}: ${item.status}`);
        if (item.parentId !== null) children.set(item.parentId, (children.get(item.parentId) || 0) + 1);
      }
      const declaredChildren = policy.blueprints.filter((item) => item.parentId !== null).length;
      if (declaredChildren > limits.maxChildren) errors.push(`blueprint set exceeds total child budget ${limits.maxChildren}`);
      for (const item of policy.blueprints) {
        if (item.parentId !== null && !ids.has(item.parentId)) errors.push(`blueprint ${item.id} has missing parent ${item.parentId}`);
      }
      for (const [parentId, count] of children) if (count > limits.maxChildren) errors.push(`blueprint ${parentId} exceeds maxChildren ${limits.maxChildren}`);
      const roots = policy.blueprints.filter((item) => item.parentId === null);
      if (roots.length !== 1 || roots[0]?.id !== "BP-ROOT") errors.push("exactly one BP-ROOT blueprint must be the root");
    }
  }

  const refinementPolicy = data.runtimeRefinementPolicy;
  if (!isRecord(refinementPolicy)) errors.push("runtimeRefinementPolicy is required");
  else {
    if (refinementPolicy.trigger !== "observed-problem-or-failed-exit-condition") errors.push("runtime refinements require an observed problem or failed exit condition");
    if (refinementPolicy.maxDepth !== 1) errors.push("runtime refinement maxDepth must remain 1");
    if (refinementPolicy.maxOpenBranches !== 1) errors.push("runtime refinement maxOpenBranches must remain 1");
    if (refinementPolicy.persistent !== false) errors.push("runtime refinements must remain non-persistent");
    if (refinementPolicy.mayExpandProductScope !== false) errors.push("runtime refinements may not expand product scope");
    if (refinementPolicy.mustReturnToParent !== true) errors.push("runtime refinements must return to the parent step");
  }

  if (!Array.isArray(data.runtimeRefinements)) errors.push("runtimeRefinements must be an array");
  else {
    const refinementIds = new Set();
    let activeRefinements = 0;
    for (const refinement of data.runtimeRefinements) {
      if (!isRecord(refinement) || !refinement.id) { errors.push("runtime refinement id is required"); continue; }
      if (refinementIds.has(refinement.id)) errors.push(`duplicate runtime refinement id: ${refinement.id}`);
      refinementIds.add(refinement.id);
      if (refinement.kind !== "temporary-problem-refinement") errors.push(`runtime refinement ${refinement.id} has invalid kind`);
      if (!refinement.parentStep) errors.push(`runtime refinement ${refinement.id} parentStep is required`);
      if (!refinement.problem) errors.push(`runtime refinement ${refinement.id} problem is required`);
      if (!refinement.triggerEvidence) errors.push(`runtime refinement ${refinement.id} triggerEvidence is required`);
      if (refinement.persistent !== false) errors.push(`runtime refinement ${refinement.id} must remain non-persistent`);
      if (refinement.expandsProductScope !== false) errors.push(`runtime refinement ${refinement.id} may not expand product scope`);
      if (!refinementStatuses.has(refinement.status)) errors.push(`runtime refinement ${refinement.id} has invalid status: ${refinement.status}`);
      if (refinement.status === "active") activeRefinements += 1;
      if (refinement.status === "resolved" && !refinement.resultEvidence) errors.push(`resolved runtime refinement ${refinement.id} requires resultEvidence`);
      if (refinement.status === "blocked" && !refinement.nextGate) errors.push(`blocked runtime refinement ${refinement.id} requires nextGate`);
      if (refinement.returnTo !== refinement.parentStep) errors.push(`runtime refinement ${refinement.id} must return to its parent step`);
    }
    if (activeRefinements > 1) errors.push("only one runtime problem refinement may be active at a time");
  }

  if (!Array.isArray(data.discussionDirections)) errors.push("discussionDirections must be an array");
  else {
    const directionIds = new Set();
    for (const direction of data.discussionDirections) {
      if (!isRecord(direction) || !direction.id) { errors.push("discussion direction id is required"); continue; }
      if (directionIds.has(direction.id)) errors.push(`duplicate discussion direction id: ${direction.id}`);
      directionIds.add(direction.id);
      const defaultLimit = directionLevels.get(direction.level);
      if (!defaultLimit) errors.push(`invalid direction level for ${direction.id}: ${direction.level}`);
      if (!Number.isInteger(direction.roundLimit) || direction.roundLimit < 1 || direction.roundLimit > 5) errors.push(`direction ${direction.id} roundLimit must be 1..5`);
      if (defaultLimit && direction.roundLimit < defaultLimit) errors.push(`direction ${direction.id} roundLimit is below ${direction.level} default ${defaultLimit}`);
      if (defaultLimit && direction.roundLimit > defaultLimit && direction.extensionApprovedBy !== "driver") errors.push(`direction ${direction.id} extra round requires driver approval`);
      if (!Number.isInteger(direction.roundsUsed) || direction.roundsUsed < 0 || direction.roundsUsed > direction.roundLimit) errors.push(`direction ${direction.id} exceeds its discussion budget`);
      if (!directionStatuses.has(direction.status)) errors.push(`invalid direction status for ${direction.id}: ${direction.status}`);
    }
  }

  const frontend = data.frontendDecision;
  if (!isRecord(frontend)) errors.push("frontendDecision is required");
  else {
    if (!recommendations.has(frontend.recommended)) errors.push(`invalid frontend recommendation: ${frontend.recommended}`);
    if (!fits.has(frontend.fit)) errors.push(`invalid frontend fit: ${frontend.fit}`);
    for (const field of ["reason", "fallback", "reopenWhen"]) if (!frontend[field]) errors.push(`frontendDecision.${field} is required`);
    if (frontend.fit === "not-recommended" && frontend.driverOverride === true && (!frontend.prototypeGateRequired || !frontend.realHostGateRequired)) {
      errors.push("frontend override requires prototype and real-host gates");
    }
  }

  const acceptance = data.acceptance;
  if (!isRecord(acceptance) || !isRecord(acceptance.driver)) errors.push("acceptance.driver is required");
  else {
    if (!new Set(["not-run", "passed", "failed"]).has(acceptance.automated)) errors.push(`invalid automated acceptance: ${acceptance.automated}`);
    if (!new Set(["not-run", "passed", "failed"]).has(acceptance.staticPreview)) errors.push(`invalid staticPreview acceptance: ${acceptance.staticPreview}`);
    if (!new Set(["pending", "passed", "failed", "not-applicable"]).has(acceptance.realHost)) errors.push(`invalid realHost acceptance: ${acceptance.realHost}`);
    if (!new Set(["pending", "accepted", "rejected"]).has(acceptance.driver.status)) errors.push(`invalid driver acceptance: ${acceptance.driver.status}`);
    if (acceptance.driver.status === "accepted" && acceptance.driver.source !== "driver") errors.push("driver acceptance source must be driver");
    if (automation && acceptance.driver.status === "accepted") errors.push("automation cannot mark driver acceptance");
  }

  if (root) {
    const authority = safeTarget(root, data.authorityFile, "authorityFile", errors);
    const next = safeTarget(root, data.nextFile, "nextFile", errors);
    if (authority) requireHeadings(authority, ["目标与非目标", "项目类型与承载面", "四态决策账本", "Core Spine", "First Playable / First Usable", "Growth Tracks", "Parking Lot", "前端适配结论", "验收账本", "下一道门"], "authority file", errors);
    if (next) requireHeadings(next, ["当前权威", "已确认事实", "最近证据", "开放风险", "下一道门", "一句续接"], "NEXT file", errors);
    for (const blueprint of policy?.blueprints || []) {
      const target = safeTarget(root, blueprint.path, `blueprint ${blueprint.id} path`, errors);
      if (target) requireHeadings(target, ["停止条件", "下一道门"], `blueprint ${blueprint.id}`, errors);
    }
  }
  return errors;
}

export function validateProjectAuthorityFile(file, { automation = false } = {}) {
  const resolved = path.resolve(file);
  const data = JSON.parse(fs.readFileSync(resolved, "utf8"));
  const root = path.resolve(path.dirname(resolved), "..");
  return validateProjectAuthority(data, { root, automation });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const automation = args.includes("--automation");
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!file) {
    console.error("Usage: node validate-project-authority.mjs <project-orchestration.json> [--automation]");
    process.exit(2);
  }
  try {
    const errors = validateProjectAuthorityFile(file, { automation });
    if (errors.length) {
      for (const error of errors) console.error(`ERROR: ${error}`);
      process.exit(1);
    }
    console.log(`Project authority valid: ${file}`);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
