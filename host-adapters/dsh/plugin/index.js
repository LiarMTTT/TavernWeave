/**
 * TavernWeave X DSH — DeepSeek Harness host plugin.
 *
 * Responsibilities:
 * 1. Register the packaged TavernWeave skill bundle (`./skills`) as a DSH skill
 *    provider. Every skill keeps its directory as the resource base so relative
 *    references and `<skill-root>/scripts/...` commands resolve correctly.
 * 2. Inject the TavernWeave Host Front Door as one static system-prompt section.
 *    The identical managed block is still installed into AGENTS.md/CLAUDE.md for
 *    Codex/Claude Code; DSH users should rely on this plugin instead and must not
 *    install the global file block twice.
 *
 * The companion `cordis.patch.yml` declares the selectable `tavernweave` agent
 * preset. Everything else (tools, shell, filesystem, ask-user, present, skill
 * loading) comes from official DeepSeek Harness plugins.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const name = "tavernweave-dsh";
export const inject = ["skills"];

const PLUGIN_ROOT = path.dirname(fileURLToPath(import.meta.url));
// `host-adapters/dsh/plugin` lives three levels below the repository root; this
// fallback only applies when the plugin runs from a source checkout instead of
// a packed npm artifact (development and source-level tests).
const SOURCE_REPO_ROOT = path.resolve(PLUGIN_ROOT, "..", "..", "..");
const PROVIDER_NAME = "tavernweave";
// Mirrors BUNDLED_SKILL_RANK in @deepseek-ai/dsh-skill: packaged skill providers.
const SKILL_RANK = 600;
// Deployment persona prefix sits at 0, plan policy at 500. The front door is
// deployment guidance, so it lands between them.
const FRONT_DOOR_ORDER = 100;
const FRONT_DOOR_SECTION = "tavernweave:host-front-door";
const FRONT_DOOR_BEGIN = "<!-- tavernweave-host-front-door:begin";
const FRONT_DOOR_END = "<!-- tavernweave-host-front-door:end -->";
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_INVOCATION = Object.freeze({ modelInvocable: true, userInvocable: true });

function resolveSkillsRoot() {
  const packaged = path.join(PLUGIN_ROOT, "skills");
  if (existsSync(packaged)) return packaged;
  const source = path.join(SOURCE_REPO_ROOT, "skills");
  if (existsSync(source)) return source;
  throw new Error(`TavernWeave skill bundle is missing: expected ${packaged}`);
}

function resolveFrontDoorText() {
  const packaged = path.join(PLUGIN_ROOT, "assets", "front-door.md");
  if (existsSync(packaged)) return readFileSync(packaged, "utf8");
  const source = path.join(SOURCE_REPO_ROOT, "host-adapters", "tavernweave-front-door.md");
  if (!existsSync(source)) return "";
  return extractManagedBlock(readFileSync(source, "utf8"), source);
}

function extractManagedBlock(text, label) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const begin = lines.findIndex((line) => line.startsWith(FRONT_DOOR_BEGIN));
  const end = lines.findIndex((line) => line.trim() === FRONT_DOOR_END);
  if (begin < 0 || end <= begin) {
    throw new Error(`TavernWeave Host Front Door markers are missing or out of order: ${label}`);
  }
  return `${lines.slice(begin + 1, end).join("\n").trim()}\n`;
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

function loadSkillCatalog(skillsRoot) {
  const entries = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
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
    if (seen.has(parsed.meta.name)) throw new Error(`duplicate TavernWeave skill name: ${parsed.meta.name}`);
    seen.add(parsed.meta.name);
    catalog.push({
      ...parsed.meta,
      source: "bundled",
      rank: SKILL_RANK,
      provider: PROVIDER_NAME,
      path: skillFile,
      locator: { index: catalog.length },
      resourceBase: { kind: "directory", path: directory },
      content: parsed.content,
    });
  }
  if (catalog.length === 0) throw new Error(`TavernWeave skill bundle is empty: ${skillsRoot}`);
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

function createProvider(catalog) {
  return {
    name: PROVIDER_NAME,
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

export function apply(ctx, config = {}) {
  const skillsRoot = config.skillsRoot ?? resolveSkillsRoot();
  const catalog = loadSkillCatalog(skillsRoot);
  ctx.skills.registerProvider(() => createProvider(catalog));
  if (config.frontDoor !== false) {
    const frontDoor = resolveFrontDoorText();
    if (frontDoor.trim().length > 0) {
      ctx.inject(["systemPrompt"], (promptCtx) => {
        promptCtx.effect(
          () => promptCtx.systemPrompt.section({
            name: FRONT_DOOR_SECTION,
            order: FRONT_DOOR_ORDER,
            interpolate: false,
            text: frontDoor,
          }),
          "tavernweave.frontDoor()",
        );
      });
    }
  }
  ctx.logger?.info?.(`TavernWeave X DSH: registered ${catalog.length} skills from ${skillsRoot}`);
}
