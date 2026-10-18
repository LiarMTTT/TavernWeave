#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");
if (process.argv.slice(2).some(arg => !["--write", "--check"].includes(arg))) throw new Error("Use --check (default) or --write");

const readSource = file => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n?/gu, "\n");
const readCore = (file, marker) => {
  const core = new RegExp(`<!-- ${marker}:begin -->\\n([\\s\\S]*?)\\n<!-- ${marker}:end -->`, "u").exec(readSource(file))?.[1];
  if (!core) throw new Error(`Shared source markers are missing: ${file} (${marker})`);
  return core;
};

// The long guidance core feeds the Host Front Door; the compact English entry is injected per skill.
const guidanceCore = readCore("skills/consult-tavernweave-library/references/communication-and-guidance.md", "tw-guidance-core");
const pluginCore = readCore("skills/consult-tavernweave-library/references/plugin-runtime.md", "tw-plugin-runtime-core");
const pluginSourceLink = "](plugin-runtime.md)";
if (!pluginCore.includes(pluginSourceLink)) throw new Error("Plugin runtime core must link to plugin-runtime.md so per-skill references can be resolved");

const references = skillName => {
  const consult = skillName === "consult-tavernweave-library";
  return {
    guidance: consult ? "references/communication-and-guidance.md" : "../consult-tavernweave-library/references/communication-and-guidance.md",
    plugin: consult ? "references/plugin-runtime.md" : "../consult-tavernweave-library/references/plugin-runtime.md",
  };
};

const guidanceBody = skillName => `## Shared communication\n\nApply [TW plain-language and guidance rules](${references(skillName).guidance}): explain terms on first use, keep the user-selected 新人/入门/熟练/老手 level, and still explain needed changes and bugs at every level. Soul and prose modes never disable this baseline.`;
const pluginBody = skillName => pluginCore.replace(pluginSourceLink, `](${references(skillName).plugin})`);

const targetsByFile = new Map();
const addTarget = (file, marker, body) => {
  if (!targetsByFile.has(file)) targetsByFile.set(file, []);
  targetsByFile.get(file).push({ marker, body });
};

// Existing behavior: the Host Front Door keeps the long shared guidance core.
addTarget("host-adapters/tavernweave-front-door.md", "tw-guidance-generated", guidanceCore);
const skills = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter(item => item.isDirectory())
  .map(item => item.name)
  .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
for (const skillName of skills) {
  addTarget(`skills/${skillName}/SKILL.md`, "tw-guidance-entry", guidanceBody(skillName));
  addTarget(`skills/${skillName}/SKILL.md`, "tw-plugin-runtime-entry", pluginBody(skillName));
}

const drifted = [];
let checkedBlocks = 0;
for (const [file, blocks] of targetsByFile) {
  const target = path.join(root, file);
  const original = fs.readFileSync(target, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  let text = original.replace(/\r\n?/gu, "\n");
  let changed = false;
  let cursor = null; // insertion point directly after the previous generated block
  for (const { marker, body } of blocks) {
    checkedBlocks += 1;
    const begin = `<!-- ${marker}:begin -->`;
    const end = `<!-- ${marker}:end -->`;
    const block = `${begin}\n${body}\n${end}`;
    const beginIndex = text.indexOf(begin);
    const endIndex = text.indexOf(end);
    if ((beginIndex === -1) !== (endIndex === -1)) throw new Error(`Invalid generated markers: ${file} (${marker})`);
    if (beginIndex !== -1) {
      if (text.split(begin).length !== 2 || text.split(end).length !== 2 || endIndex < beginIndex) throw new Error(`Invalid generated markers: ${file} (${marker})`);
      const next = text.slice(0, beginIndex) + block + text.slice(endIndex + end.length);
      if (next !== text) {
        text = next;
        changed = true;
      }
      cursor = beginIndex + block.length;
      continue;
    }
    let next;
    if (cursor !== null) {
      next = text.slice(0, cursor) + `\n\n${block}` + text.slice(cursor);
    } else if (file.startsWith("host-adapters/")) {
      const heading = "## TavernWeave Host Front Door\n";
      if (!text.includes(heading)) throw new Error("Front Door insertion point missing");
      next = text.replace(heading, `${heading}\n${block}\n`);
    } else {
      const frontmatterEnd = text.indexOf("\n---\n", 4);
      const heading = /^# .+$/mu.exec(text.slice(frontmatterEnd + 5));
      if (frontmatterEnd < 0 || !heading) throw new Error(`Skill heading missing: ${file}`);
      const index = frontmatterEnd + 5 + heading.index + heading[0].length;
      next = text.slice(0, index) + `\n\n${block}` + text.slice(index);
    }
    changed = changed || next !== text;
    text = next;
    cursor = next.indexOf(block) + block.length;
  }
  if (!changed) continue;
  drifted.push(file);
  if (write) fs.writeFileSync(target, text.replace(/\n/gu, newline), "utf8");
}
process.stdout.write(`${JSON.stringify({ mode: write ? "write" : "check", checkedFiles: targetsByFile.size, checkedBlocks, changedOrDrifted: drifted }, null, 2)}\n`);
if (!write && drifted.length) process.exitCode = 1;
