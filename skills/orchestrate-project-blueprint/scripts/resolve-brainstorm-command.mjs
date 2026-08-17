#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const exact = new Map([
  ["脑暴模式", ["activate", "neutral"]],
  ["开始脑暴", ["activate", "neutral"]],
  ["/brainstorm on", ["activate", "neutral"]],
  ["脑暴模式,soul联席", ["activate", "soul-ensemble"]],
  ["三人一起脑暴", ["activate", "soul-ensemble"]],
  ["soul三席就位", ["activate", "soul-ensemble"]],
  ["/brainstorm on ensemble", ["activate", "soul-ensemble"]],
  ["按蓝图开跑第一版", ["execute", "first-version"]],
  ["/blueprint run first", ["execute", "first-version"]],
  ["暂停脑暴", ["pause", "inactive"]],
  ["结束脑暴模式", ["deactivate", "inactive"]],
  ["/brainstorm off", ["deactivate", "inactive"]],
]);

function normalize(input) {
  const normalized = input.normalize("NFKC").trim()
    .replace(/[！!。.]$/u, "")
    .replace(/[，、]/gu, ",")
    .replace(/\s+/gu, " ")
    .replace(/\s*,\s*/gu, ",")
    .toLowerCase();
  return normalized.startsWith("/") ? normalized : normalized.replace(/\s+/gu, "");
}

export function resolveBrainstormCommand(input) {
  const hit = exact.get(normalize(String(input || "")));
  return hit
    ? { schemaVersion: 1, matched: true, action: hit[0], mode: hit[1], persistence: "current-task-portable" }
    : { schemaVersion: 1, matched: false, action: "none", mode: null, persistence: "none" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(`${JSON.stringify(resolveBrainstormCommand(process.argv.slice(2).join(" ")), null, 2)}\n`);
}
