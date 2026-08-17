#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../assets/templates");
const profiles = {
  "single-blueprint": { maxDepth: 1, maxChildren: 0, masterFile: "项目实现步骤蓝图.md", template: "implementation-blueprint.md" },
  "blueprint-set": { maxDepth: 2, maxChildren: 5, masterFile: "蓝图集/BLUEPRINT_INDEX.md", template: "blueprint-index.md" },
  "program-blueprint-set": { maxDepth: 3, maxChildren: 9, masterFile: "蓝图集/BLUEPRINT_INDEX.md", template: "blueprint-index.md" },
};

function render(templateName, fields) {
  let text = fs.readFileSync(path.join(templateRoot, templateName), "utf8");
  for (const [key, value] of Object.entries(fields)) text = text.replaceAll(`{{${key}}}`, String(value));
  return text;
}

function relativeSafe(value, label) {
  if (!value || path.isAbsolute(value) || value.split(/[\\/]/u).includes("..")) throw new Error(`${label} must be a safe relative path`);
  return value.replaceAll("\\", "/");
}

export function planProjectAuthority({ root, profile, projectId, title, date = new Date().toISOString().slice(0, 10) }) {
  if (!root) throw new Error("root is required");
  if (!profiles[profile]) throw new Error(`unsupported profile: ${profile}`);
  if (!/^[A-Za-z0-9._-]+$/u.test(projectId || "")) throw new Error("projectId must use ASCII letters, digits, dot, underscore, or hyphen");
  if (!String(title || "").trim()) throw new Error("title is required");

  const projectRoot = path.resolve(root);
  const authorityFile = "总设计案.md";
  const nextFile = "NEXT.md";
  const policy = profiles[profile];
  const manifestFile = ".tavernweave/project-orchestration.json";
  const fields = {
    PROJECT_ID: projectId,
    TITLE: String(title).trim(),
    DATE: date,
    AUTHORITY_FILE: authorityFile,
    MASTER_FILE: policy.masterFile,
  };
  const manifest = {
    schemaVersion: 1,
    authoritySchema: "tavernweave/project-orchestration/v1",
    projectId,
    title: fields.TITLE,
    profile,
    state: "brainstorm-candidate",
    authorityFile,
    nextFile,
    blueprintPolicy: {
      masterFile: policy.masterFile,
      maxDepth: policy.maxDepth,
      maxChildren: policy.maxChildren,
      runtimePersistentBlueprintBudget: 0,
      blueprints: [{ id: "BP-ROOT", path: policy.masterFile, parentId: null, depth: 1, status: "candidate" }],
    },
    runtimeRefinementPolicy: {
      trigger: "observed-problem-or-failed-exit-condition",
      maxDepth: 1,
      maxOpenBranches: 1,
      persistent: false,
      mayExpandProductScope: false,
      mustReturnToParent: true
    },
    runtimeRefinements: [],
    discussionDirections: [],
    frontendDecision: {
      recommended: "undecided",
      fit: "conditional",
      reason: "pending brainstorm",
      fallback: "text-first",
      reopenWhen: "project type and host constraints are confirmed",
      driverOverride: false,
      prototypeGateRequired: false,
      realHostGateRequired: false
    },
    acceptance: {
      automated: "not-run",
      staticPreview: "not-run",
      realHost: "pending",
      driver: { status: "pending", source: "driver" }
    }
  };

  return {
    projectRoot,
    files: [
      { relative: relativeSafe(manifestFile, "manifestFile"), content: `${JSON.stringify(manifest, null, 2)}\n` },
      { relative: authorityFile, content: render("total-design.md", fields) },
      { relative: policy.masterFile, content: render(policy.template, fields) },
      { relative: nextFile, content: render("next.md", fields) },
    ]
  };
}

export function initializeProjectAuthority(options) {
  const plan = planProjectAuthority(options);
  const collisions = plan.files.filter((item) => fs.existsSync(path.join(plan.projectRoot, item.relative))).map((item) => item.relative);
  if (collisions.length) throw new Error(`refusing to overwrite existing authority files: ${collisions.join(", ")}`);
  if (options.dryRun) return { dryRun: true, created: [], planned: plan.files.map((item) => item.relative) };
  for (const item of plan.files) {
    const target = path.join(plan.projectRoot, item.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, item.content, { encoding: "utf8", flag: "wx" });
  }
  return { dryRun: false, created: plan.files.map((item) => item.relative), planned: plan.files.map((item) => item.relative) };
}

function parseArgs(args) {
  const parsed = { dryRun: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (["--root", "--profile", "--project-id", "--title"].includes(arg)) {
      const value = args[index + 1];
      if (!value) throw new Error(`missing value for ${arg}`);
      parsed[{ "--root": "root", "--profile": "profile", "--project-id": "projectId", "--title": "title" }[arg]] = value;
      index += 1;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return parsed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const result = initializeProjectAuthority(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
