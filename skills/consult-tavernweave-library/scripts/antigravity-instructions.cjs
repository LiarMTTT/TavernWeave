// Shared only by the AGY branches; existing single-file Codex/Claude managers
// remain usable without this module. Discovery follows the documented defaults.
const fs = require("node:fs");
const path = require("node:path");
const samePath = (a, b) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
const folders = [".agents", ".agent", "_agents", "_agent"];
const names = ["AGENTS.md", "GEMINI.md"];

exports.resolveInstructions = function ({ root, target, scope, read, marker }) {
  const localNames = scope === "client"
    ? [...names, ...names.map(name => `config/${name}`)]
    : [...names, ...folders.flatMap(folder => names.map(name => `${folder}/${name}`))];
  const allowed = localNames.map(name => path.join(root, name));
  if (!allowed.some(file => samePath(file, target))) throw new Error("Unsupported Antigravity instruction target for this scope");
  const levels = [root];
  if (scope === "workspace") {
    let repositoryRoot;
    for (let current = root; ; current = path.dirname(current)) {
      if (fs.existsSync(path.join(current, ".git"))) { repositoryRoot = current; break; }
      if (path.dirname(current) === current) break;
    }
    if (repositoryRoot) {
      for (let current = path.dirname(root); root !== repositoryRoot; current = path.dirname(current)) {
        levels.push(current);
        if (current === repositoryRoot) break;
      }
    }
  }
  const candidates = new Set(allowed);
  const customizations = scope === "client" ? [path.join(root, "config")]
    : levels.flatMap(level => folders.map(folder => path.join(level, folder)));
  for (const level of levels) for (const name of localNames) candidates.add(path.join(level, name));
  for (const directory of customizations) {
    const manifest = path.join(directory, "rules.json");
    if (read(manifest).exists) throw new Error(`Antigravity rules.json needs manual discovery review; no write: ${manifest}`);
    const ruleDirectory = path.join(directory, "rules");
    if (fs.existsSync(ruleDirectory)) {
      if (fs.lstatSync(ruleDirectory).isSymbolicLink()) throw new Error(`Refusing linked Antigravity rules: ${ruleDirectory}`);
      for (const name of fs.readdirSync(ruleDirectory).sort()) {
        if (name.endsWith(".md")) candidates.add(path.join(ruleDirectory, name));
      }
    }
  }
  const states = [...candidates].map(file => ({ file, state: read(file) }));
  for (const { file, state } of states) {
    if (!samePath(file, target) && state.text.includes(marker)) throw new Error(`Antigravity also loads a managed block in ${file}; review that existing target, no write`);
    if (/@\[[^\]\r\n]*\]\(/u.test(state.text)) throw new Error(`Antigravity rule includes need manual discovery review; no write: ${file}`);
  }
  return { root, target, discovery: states.map(({ file, state }) => ({ path: file, digest: state.digest })) };
};
