#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");
if (process.argv.slice(2).some(arg => !["--write", "--check"].includes(arg))) throw new Error("Use --check (default) or --write");
const source = fs.readFileSync(path.join(root, "skills/consult-tavernweave-library/references/communication-and-guidance.md"), "utf8").replace(/\r\n?/gu, "\n");
const core = /<!-- tw-guidance-core:begin -->\n([\s\S]*?)\n<!-- tw-guidance-core:end -->/u.exec(source)?.[1];
if (!core) throw new Error("Shared guidance source markers are missing");
const targets = [{ file: "host-adapters/tavernweave-front-door.md", body: core, marker: "tw-guidance-generated" }];
const skills = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true }).filter(item => item.isDirectory());
for (const skill of skills) {
  const reference = skill.name === "consult-tavernweave-library" ? "references/communication-and-guidance.md" : "../consult-tavernweave-library/references/communication-and-guidance.md";
  targets.push({ file: `skills/${skill.name}/SKILL.md`, marker: "tw-guidance-entry", body: `## Shared communication\n\nApply [TW plain-language and guidance rules](${reference}) to user-facing work. Explain terms in context; preserve the user's chosen 新人/入门/熟练/老手 level without inferred changes. 新人 and 入门 receive detailed explanations; every level receives needed and bug explanations unless the user explicitly waives that scope. Soul and prose modes never disable this baseline. Load the shared reference for task entry, level management, or explanation decisions.` });
}
const drifted = [];
for (const { file, body, marker } of targets) {
  const target = path.join(root, file);
  const original = fs.readFileSync(target, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const text = original.replace(/\r\n?/gu, "\n");
  const begin = `<!-- ${marker}:begin -->`;
  const end = `<!-- ${marker}:end -->`;
  const block = `${begin}\n${body}\n${end}`;
  let next;
  if (text.includes(begin) || text.includes(end)) {
    if (text.split(begin).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(begin)) throw new Error(`Invalid generated markers: ${file}`);
    next = text.slice(0, text.indexOf(begin)) + block + text.slice(text.indexOf(end) + end.length);
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
  if (next !== text) {
    drifted.push(file);
    if (write) fs.writeFileSync(target, next.replace(/\n/gu, newline), "utf8");
  }
}
process.stdout.write(`${JSON.stringify({ mode: write ? "write" : "check", checked: targets.length, changedOrDrifted: drifted }, null, 2)}\n`);
if (!write && drifted.length) process.exitCode = 1;
