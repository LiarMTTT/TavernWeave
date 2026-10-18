import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildContext, extractFrontDoor, instructionCandidates } from "../hooks/session-start-front-door.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8").replace(/\r\n?/g, "\n");
const manifest = JSON.parse(read("tavernweave-install-manifest.json"));
const hostMap = JSON.parse(read("host-adapters/host-map.json"));
const hooks = JSON.parse(read("hooks/hooks.json"));
const agent = read("agents/tavernweave.md");
const template = extractFrontDoor(read("host-adapters/tavernweave-front-door.md"));
const hookScript = path.join(root, "hooks", "session-start-front-door.mjs");

function sandbox(t) {
  const base = fs.mkdtempSync(path.join(process.env.TW_TEST_ROOT ?? os.tmpdir(), "tw-claude-hook-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const configDir = path.join(base, "config");
  const project = path.join(base, "project", "nested");
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  return { base, configDir, project };
}

function managedBlock(version) {
  return `<!-- tavernweave-host-front-door:begin version=${version} -->\n## TavernWeave Host Front Door\n<!-- tavernweave-host-front-door:end -->\n`;
}

test("manifest, host map, hooks and agent agree on the Claude Code plugin components", () => {
  const plugin = manifest.claudePlugin;
  assert.ok(plugin, "installation manifest must declare claudePlugin");
  assert.equal(plugin.hooks, "hooks/hooks.json");
  assert.equal(plugin.frontDoorHook, "hooks/session-start-front-door.mjs");
  assert.equal(plugin.presetAgent, "agents/tavernweave.md");
  assert.equal(plugin.presetAgentId, `${manifest.package}:tavernweave`);
  assert.equal(plugin.frontDoorDedup, "instruction-file-block-wins");
  assert.notEqual(plugin.hostLoading, "verified", "file checks must not claim Claude Code host loading");
  assert.equal(hostMap.hosts.claude.support, "formal", "the CLAUDE.md adapter stays available");
  assert.equal(hostMap.hosts.claude.pluginFrontDoorMechanism, "plugin-session-start-hook");
  assert.equal(hostMap.hosts.claude.pluginFrontDoorDedup, plugin.frontDoorDedup);
  assert.equal(hostMap.hosts.claude.presetAgent, plugin.presetAgentId);
  assert.equal(template.version, manifest.version);

  const commands = hooks.hooks.SessionStart.flatMap((group) => group.hooks.map((hook) => hook.command));
  assert.deepEqual(commands, ['node "${CLAUDE_PLUGIN_ROOT}/hooks/session-start-front-door.mjs"']);
  assert.deepEqual(hooks.modules, ["./soul-switch.tsx"], "the Soul switch is the only function-hooks module");
  assert.equal(plugin.soulSwitch, "hooks/soul-switch.tsx");
  for (const relative of [plugin.soulSwitch, plugin.soulSwitchTypes, "hooks/soul-switch-data.ts"]) {
    assert.ok(fs.existsSync(path.join(root, relative)), `${relative} must exist`);
  }
  const claudeManifest = JSON.parse(read(".claude-plugin/plugin.json"));
  assert.equal(claudeManifest.types, `./${plugin.soulSwitchTypes}`);

  assert.match(agent, /^---\nname: tavernweave\n/u);
  assert.match(agent, /\ntools: [^\n]*\bSkill\b/u);
  assert.doesNotMatch(agent, /\ntools: [^\n]*\b(WebFetch|WebSearch|Agent)\b/u, "preset keeps the DSH lean tool set");
  assert.match(agent, /tavernweave-agent-skills:consult-tavernweave-library/u);
});

test("hook injects the Front Door when no loaded CLAUDE.md carries the block", (t) => {
  const { configDir, project } = sandbox(t);
  const context = buildContext({ pluginRoot: root, cwd: project, configDir });
  assert.ok(context.includes(template.body.trim()));
  assert.match(context, new RegExp(`Host Front Door ${template.version.replace(/\./g, "\\.")}`, "u"));
  assert.doesNotMatch(context, /tavernweave-host-front-door:begin/u, "injected text must not look like a file block");
});

test("a current CLAUDE.md block wins and silences the hook", (t) => {
  const { configDir, project } = sandbox(t);
  fs.writeFileSync(path.join(configDir, "CLAUDE.md"), `# mine\n\n${managedBlock(template.version)}`);
  assert.equal(buildContext({ pluginRoot: root, cwd: project, configDir }), null);
});

test("project-level CLAUDE.md files in ancestors are honoured", (t) => {
  const { configDir, project } = sandbox(t);
  const ancestor = path.dirname(project);
  fs.mkdirSync(path.join(ancestor, ".claude"));
  fs.writeFileSync(path.join(ancestor, ".claude", "CLAUDE.md"), managedBlock(template.version));
  assert.ok(instructionCandidates({ cwd: project, configDir }).includes(path.join(ancestor, ".claude", "CLAUDE.md")));
  assert.equal(buildContext({ pluginRoot: root, cwd: project, configDir }), null);
});

test("an outdated CLAUDE.md block is kept and only a notice is injected", (t) => {
  const { configDir, project } = sandbox(t);
  const file = path.join(configDir, "CLAUDE.md");
  fs.writeFileSync(file, managedBlock("0.0.1"));
  const context = buildContext({ pluginRoot: root, cwd: project, configDir });
  assert.match(context, /0\.0\.1/u);
  assert.ok(context.includes(file));
  assert.ok(!context.includes(template.body.trim()), "must not inject a second Front Door");
});

test("TAVERNWEAVE_FRONT_DOOR=off disables injection", (t) => {
  const { configDir, project } = sandbox(t);
  assert.equal(buildContext({ pluginRoot: root, cwd: project, configDir, env: { TAVERNWEAVE_FRONT_DOOR: "off" } }), null);
});

test("hook process emits ASCII-safe SessionStart JSON from stdin input", (t) => {
  const { configDir, project } = sandbox(t);
  const output = execFileSync(process.execPath, [hookScript], {
    input: JSON.stringify({ hook_event_name: "SessionStart", source: "startup", cwd: project }),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, CLAUDE_CONFIG_DIR: configDir, TAVERNWEAVE_FRONT_DOOR: "" },
  }).toString("utf8");
  assert.match(output, /^[\x00-\x7f]*$/u);
  const payload = JSON.parse(output);
  assert.equal(payload.hookSpecificOutput.hookEventName, "SessionStart");
  assert.ok(payload.hookSpecificOutput.additionalContext.includes(template.body.trim()));

  fs.writeFileSync(path.join(configDir, "CLAUDE.md"), managedBlock(template.version));
  const silent = execFileSync(process.execPath, [hookScript], {
    input: JSON.stringify({ cwd: project }),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, CLAUDE_CONFIG_DIR: configDir },
  }).toString("utf8");
  assert.equal(silent, "");
});

test("Soul switch phrases are Host Front Door commands and state is keyed by the plugin name", () => {
  const data = read("hooks/soul-switch-data.ts");
  const commands = [...data.matchAll(/command: '([^']+)'/gu)].map((match) => match[1]);
  assert.equal(commands.length, 5);
  const frontDoor = read("host-adapters/tavernweave-front-door.md");
  for (const command of commands) assert.ok(frontDoor.includes(command), `Front Door must define ${command}`);
  const module = read("hooks/soul-switch.tsx");
  const keys = [...module.matchAll(/atom\(\{ plugin: '([^']+)'/gu)].map((match) => match[1]);
  assert.ok(keys.length > 0 && keys.every((key) => key === manifest.package), "state refs must use the plugin name");
  assert.ok(read("hooks/soul-switch-types.d.ts").includes(`'${manifest.package}': {`), "the state contract must be keyed by the plugin name");
  assert.doesNotMatch(module, /prompt\.submit\(/u, "the switch fills the prompt and never sends on the person's behalf");
});
