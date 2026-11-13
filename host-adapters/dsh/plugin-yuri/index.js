/**
 * TavernWeave Yuri Workbench X DSH — DeepSeek Harness host plugin.
 *
 * Responsibilities:
 * 1. Register the four yuri card workflows of the yuri-dev branch
 *    (`yuri-card-creator`, `adapt-yuri-card`, `post-to-yuri-card`,
 *    `novel-excerpt-to-yuri-card`) as a DSH skill provider. Every workflow
 *    keeps its canonical directory as the resource base, so the relative
 *    references used by the workflow prose (`../../references/...`,
 *    `<skill>/scripts/...`, `../yuri-card-creator/assets/...`) resolve exactly
 *    as they do in the source tree. The workflow instructions and scripts are
 *    staged byte-identical; nothing here rewrites their chain of thought.
 * 2. Register the 23 unchanged TavernWeave dependency skills as a second
 *    provider. The workflows treat that tree as their pinned authoring base:
 *    the Python scripts hash `skills/tavern-card-builder/SKILL.md`,
 *    `skills/tavern-card-builder/references/authoring-workflow.md` and
 *    `skills/build-work-library/scripts/work_library.py` against upstream
 *    pins, and `--tavern-root` probes expect that directory shape.
 * 3. Inject one static system-prompt section stating the plugin's real paths
 *    (plugin root, yuri workbench root, pinned TavernWeave base root) so an
 *    agent can run the packaged Python scripts and the host probe without
 *    guessing locations.
 *
 * The companion `cordis.patch.yml` declares the selectable `tavernweave-yuri`
 * agent preset. Everything else (tools, shell, filesystem, ask-user, present,
 * skill loading) comes from official DeepSeek Harness plugins.
 */
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const name = "tavernweave-yuri-dsh";
export const inject = ["skills"];

const PLUGIN_ROOT = path.dirname(fileURLToPath(import.meta.url));
// `host-adapters/dsh/plugin-yuri` lives three levels below the repository root;
// this fallback only applies when the plugin runs from a linked source checkout
// instead of a packed npm artifact (development and source-level tests).
// realpathSync resolves directory installs that link the checkout into a
// profile node_modules, where a lexical `..` walk would leave the repository.
function sourceRepoRoot() {
  try {
    return path.resolve(realpathSync(PLUGIN_ROOT), "..", "..", "..");
  } catch {
    return path.resolve(PLUGIN_ROOT, "..", "..", "..");
  }
}
const SOURCE_REPO_ROOT = sourceRepoRoot();

const YURI_PROVIDER = "tavernweave-yuri";
const BASE_PROVIDER = "tavernweave-base";
// Canonical workflow directory names inside the yuri workbench root; the
// bundled catalog must contain exactly these four and nothing else.
const YURI_WORKFLOWS = Object.freeze([
  "adapt-yuri-card",
  "novel-excerpt-to-yuri-card",
  "post-to-yuri-card",
  "yuri-card-creator",
]);
// Mirrors BUNDLED_SKILL_RANK in @deepseek-ai/dsh-skill: packaged skill providers.
const SKILL_RANK = 600;
// Deployment persona prefix sits at 0, plan policy at 500. Plugin location
// facts are deployment guidance, so they land between them.
const LAYOUT_ORDER = 100;
const LAYOUT_SECTION = "tavernweave-yuri:locations";
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_INVOCATION = Object.freeze({ modelInvocable: true, userInvocable: true });

function resolveYuriRoot() {
  const packaged = path.join(PLUGIN_ROOT, "extensions", "yuri-creation");
  if (existsSync(path.join(packaged, "skills"))) return packaged;
  const source = path.join(SOURCE_REPO_ROOT, "extensions", "yuri-creation");
  if (existsSync(path.join(source, "skills"))) return source;
  throw new Error(`TavernWeave Yuri workbench is missing: expected ${packaged}`);
}

function resolveBaseRoot() {
  const packaged = path.join(PLUGIN_ROOT, "skills");
  if (existsSync(packaged)) return packaged;
  const source = path.join(SOURCE_REPO_ROOT, "skills");
  if (existsSync(source)) return source;
  throw new Error(`TavernWeave dependency skill bundle is missing: expected ${packaged}`);
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      const inner = trimmed.slice(1, -1);
      return first === '"'
        ? inner.replace(/\\(["\\/bfnrt])/g, (_, char) => ({ '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" })[char] ?? char)
        : inner.replace(/''/g, "'");
    }
  }
  return trimmed;
}

function parseBooleanFlag(value) {
  const normalized = stripQuotes(value).toLowerCase();
  if (["true", "yes", "on", "1"].includes(normalized)) return true;
  if (["false", "no", "off", "0"].includes(normalized)) return false;
  return undefined;
}

function collectBlockScalar(lines, startIndex) {
  const body = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim().length === 0) {
      body.push("");
      index += 1;
      continue;
    }
    if (!/^\s/.test(line)) break;
    body.push(line);
    index += 1;
  }
  while (body.length > 0 && body[body.length - 1].trim().length === 0) body.pop();
  const indents = body.filter((line) => line.trim().length > 0).map((line) => line.match(/^\s*/)[0].length);
  const indent = indents.length > 0 ? Math.min(...indents) : 0;
  return {
    lines: body.map((line) => line.slice(Math.min(indent, line.length))),
    nextIndex: index,
  };
}

function joinFolded(lines) {
  const parts = [];
  for (const line of lines) {
    if (line.trim().length === 0) {
      parts.push("\n");
      continue;
    }
    parts.push(line.trim());
  }
  return parts
    .join(" ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseFrontMatter(sourceText, label) {
  const text = sourceText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  if (lines[0].trim() !== "---") throw new Error(`SKILL.md front matter must start at line 1: ${label}`);
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`SKILL.md front matter is not closed: ${label}`);

  const fields = Object.create(null);
  for (let index = 1; index < end; index += 1) {
    const match = /^([A-Za-z0-9_-]+):(?:[ \t]*(.*))?$/.exec(lines[index]);
    if (!match) continue;
    const key = match[1];
    const inline = (match[2] ?? "").trim();
    if (inline === ">" || inline === ">-" || inline === ">+" || inline === "|" || inline === "|-" || inline === "|+") {
      const block = collectBlockScalar(lines, index + 1);
      fields[key] = /^>/.test(inline) ? joinFolded(block.lines) : block.lines.join("\n").trim();
      index = block.nextIndex - 1;
      continue;
    }
    if (inline.length > 0) fields[key] = stripQuotes(inline);
  }

  const skillName = fields.name ?? "";
  const description = fields.description ?? "";
  if (!SKILL_NAME.test(skillName)) throw new Error(`SKILL.md has an invalid name "${skillName}": ${label}`);
  if (description.trim().length === 0) throw new Error(`SKILL.md is missing a description: ${label}`);

  const disableModel = parseBooleanFlag(fields["disable-model-invocation"] ?? "");
  const userInvocable = parseBooleanFlag(fields["user-invocable"] ?? "");
  const invocation = {
    modelInvocable: disableModel === true ? false : DEFAULT_INVOCATION.modelInvocable,
    userInvocable: userInvocable === false ? false : DEFAULT_INVOCATION.userInvocable,
  };
  const whenToUse = fields.whenToUse ?? fields.whentouse;
  return {
    meta: {
      name: skillName,
      description,
      ...whenToUse ? { whenToUse } : {},
      invocation,
    },
    content: lines.slice(end + 1).join("\n").replace(/^\n+/, "").trimEnd(),
  };
}

function loadSkillCatalog(skillsRoot, options) {
  const allowed = options.only;
  const entries = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((directoryName) => allowed === undefined || allowed.includes(directoryName))
    .filter((directoryName) => !options.exclude?.includes(directoryName))
    .sort();
  const catalog = [];
  const seen = new Set();
  for (const directoryName of entries) {
    const directory = path.join(skillsRoot, directoryName);
    const skillFile = path.join(directory, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const parsed = parseFrontMatter(readFileSync(skillFile, "utf8"), skillFile);
    if (parsed.meta.name !== directoryName) {
      throw new Error(`SKILL.md name "${parsed.meta.name}" does not match its directory "${directoryName}"`);
    }
    if (seen.has(parsed.meta.name)) throw new Error(`duplicate skill name in ${options.provider}: ${parsed.meta.name}`);
    seen.add(parsed.meta.name);
    catalog.push({
      ...parsed.meta,
      source: "bundled",
      rank: SKILL_RANK,
      provider: options.provider,
      path: skillFile,
      locator: { index: catalog.length },
      resourceBase: { kind: "directory", path: directory },
      content: parsed.content,
    });
  }
  if (catalog.length === 0) throw new Error(`skill catalog is empty: ${skillsRoot}`);
  return catalog;
}

function toCandidate(record) {
  return {
    name: record.name,
    description: record.description,
    ...record.whenToUse ? { whenToUse: record.whenToUse } : {},
    invocation: record.invocation,
    source: record.source,
    rank: record.rank,
    provider: record.provider,
    path: record.path,
    locator: record.locator,
    resourceBase: record.resourceBase,
  };
}

function toDefinition(record) {
  return {
    ...toCandidate(record),
    content: record.content,
  };
}

function createProvider(providerName, catalog) {
  return {
    name: providerName,
    async list() {
      return catalog.map(toCandidate);
    },
    async get(candidate) {
      const index = candidate?.locator?.index;
      if (typeof index !== "number") return undefined;
      const record = catalog[index];
      return record === undefined ? undefined : toDefinition(record);
    },
  };
}

function locationsText(yuriRoot, baseRoot) {
  return [
    "TavernWeave Yuri Workbench locations (installed plugin):",
    `- plugin root (the tavern root; pass this as --tavern-root to pinned-base probes): ${PLUGIN_ROOT}`,
    `- yuri workbench root (workflow skills, references, scripts, shared runtime): ${yuriRoot}`,
    `- pinned TavernWeave base (23 dependency skills): ${baseRoot}`,
    "The four tavernweave-yuri workflows are: yuri-card-creator, adapt-yuri-card, post-to-yuri-card, novel-excerpt-to-yuri-card.",
    `Python scripts live under ${yuriRoot}/scripts; run \`python ${yuriRoot}/scripts/host_probe.py\` to verify packaged files and runtime availability before exporting.`,
    `Pass \`--tavern-root ${PLUGIN_ROOT}\` to commands that probe the pinned authoring base.`,
    "",
  ].join("\n");
}

export function apply(ctx, config = {}) {
  const yuriRoot = config.yuriRoot ?? resolveYuriRoot();
  const baseRoot = config.baseRoot ?? resolveBaseRoot();
  const yuriSkillsRoot = path.join(yuriRoot, "skills");
  if (!existsSync(yuriSkillsRoot)) throw new Error(`yuri workbench skills are missing: ${yuriSkillsRoot}`);
  const yuriCatalog = loadSkillCatalog(yuriSkillsRoot, { provider: YURI_PROVIDER, only: [...YURI_WORKFLOWS] });
  if (yuriCatalog.length !== YURI_WORKFLOWS.length) {
    throw new Error(`expected ${YURI_WORKFLOWS.length} yuri workflows, found ${yuriCatalog.length} in ${yuriRoot}`);
  }
  const baseCatalog = loadSkillCatalog(baseRoot, { provider: BASE_PROVIDER, exclude: [...YURI_WORKFLOWS] });
  ctx.skills.registerProvider(() => createProvider(YURI_PROVIDER, yuriCatalog));
  ctx.skills.registerProvider(() => createProvider(BASE_PROVIDER, baseCatalog));
  if (config.locations !== false) {
    ctx.inject(["systemPrompt"], (promptCtx) => {
      promptCtx.effect(
        () => promptCtx.systemPrompt.section({
          name: LAYOUT_SECTION,
          order: LAYOUT_ORDER,
          interpolate: false,
          text: locationsText(yuriRoot, baseRoot),
        }),
        "tavernweaveYuri.locations()",
      );
    });
  }
  ctx.logger?.info?.(`TavernWeave Yuri Workbench: registered ${yuriCatalog.length} yuri workflows and ${baseCatalog.length} TavernWeave dependency skills`);
}
