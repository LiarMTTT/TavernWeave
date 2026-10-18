#!/usr/bin/env node
/**
 * TavernWeave Host Front Door — Claude Code plugin SessionStart hook.
 *
 * Claude Code counterpart of the DSH plugin's system-prompt section: when the
 * plugin is installed, inject the managed Front Door as session context so
 * users no longer need to write it into CLAUDE.md.
 *
 * De-duplication: the managed CLAUDE.md block (installed by
 * scripts/manage-host-front-door.ps1) wins. If any instruction file Claude Code
 * loads for this session already carries the block, the hook stays silent; when
 * that block is a different version it only adds a one-line notice. Set
 * TAVERNWEAVE_FRONT_DOOR=off to disable injection entirely.
 */
import { existsSync, lstatSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONT_DOOR_BEGIN = "<!-- tavernweave-host-front-door:begin";
const FRONT_DOOR_END = "<!-- tavernweave-host-front-door:end -->";
const VERSION_PATTERN = /^<!-- tavernweave-host-front-door:begin version=(\S+) -->$/u;
const PROJECT_FILES = ["CLAUDE.md", path.join(".claude", "CLAUDE.md"), "CLAUDE.local.md"];
const DISABLED_VALUES = new Set(["off", "0", "false", "no", "disabled"]);

function normalize(text) {
  return text.replace(/^﻿/u, "").replace(/\r\n?/gu, "\n");
}

export function extractFrontDoor(text, label = "front door template") {
  const lines = normalize(text).split("\n");
  const begin = lines.findIndex((line) => line.startsWith(FRONT_DOOR_BEGIN));
  const end = lines.findIndex((line) => line.trim() === FRONT_DOOR_END);
  if (begin < 0 || end <= begin) {
    throw new Error(`TavernWeave Host Front Door markers are missing or out of order: ${label}`);
  }
  const version = VERSION_PATTERN.exec(lines[begin].trim())?.[1];
  if (!version) throw new Error(`TavernWeave Host Front Door version marker is invalid: ${label}`);
  return { version, body: `${lines.slice(begin + 1, end).join("\n").trim()}\n` };
}

export function instructionCandidates({ cwd, configDir }) {
  const candidates = [path.join(configDir, "CLAUDE.md")];
  if (cwd) {
    let current = path.resolve(cwd);
    for (;;) {
      for (const name of PROJECT_FILES) candidates.push(path.join(current, name));
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return [...new Set(candidates)];
}

export function findInstalledBlock(candidates) {
  for (const file of candidates) {
    let text;
    try {
      if (!existsSync(file) || !lstatSync(file).isFile()) continue;
      text = normalize(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    const marker = text.split("\n").find((line) => line.startsWith(FRONT_DOOR_BEGIN));
    if (marker === undefined) continue;
    return { file, version: VERSION_PATTERN.exec(marker.trim())?.[1] ?? null };
  }
  return null;
}

export function buildContext({ pluginRoot, cwd, configDir, env = {} }) {
  if (DISABLED_VALUES.has(String(env.TAVERNWEAVE_FRONT_DOOR ?? "").trim().toLowerCase())) return null;
  const templatePath = path.join(pluginRoot, "host-adapters", "tavernweave-front-door.md");
  const frontDoor = extractFrontDoor(readFileSync(templatePath, "utf8"), templatePath);
  const installed = findInstalledBlock(instructionCandidates({ cwd, configDir }));
  if (installed) {
    if (installed.version === frontDoor.version) return null;
    return `TavernWeave 插件提示：${installed.file} 已有 Host Front Door 受控区块（版本 ${installed.version ?? "无法识别"}），插件自带版本为 ${frontDoor.version}。本会话沿用该文件区块，插件不重复注入。用户问到前门状态时如实说明：可用 manage-host-front-door.ps1 -AgentHost Claude -Action Remove 移除文件区块改由插件注入，或用 -Action Install 更新文件区块；未经用户确认不要改写该文件。\n`;
  }
  return `<!-- TavernWeave Host Front Door ${frontDoor.version}：由 tavernweave-agent-skills 插件的 SessionStart hook 注入；与 CLAUDE.md 受控区块等价，二者只保留一处。 -->\n${frontDoor.body}`;
}

function readHookInput() {
  if (process.stdin.isTTY) return {};
  try {
    const raw = readFileSync(0, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Escape non-ASCII so the payload survives any console code page on Windows.
function asciiJson(value) {
  return JSON.stringify(value).replace(/[\u007f-￿]/gu, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function main() {
  const input = readHookInput();
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(SCRIPT_DIR, "..");
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  const cwd = typeof input.cwd === "string" && input.cwd ? input.cwd : process.cwd();
  const context = buildContext({ pluginRoot, cwd, configDir, env: process.env });
  if (context === null) return;
  process.stdout.write(`${asciiJson({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
  })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`TavernWeave Front Door hook skipped: ${error.message}\n`);
    process.exitCode = 1;
  }
}
