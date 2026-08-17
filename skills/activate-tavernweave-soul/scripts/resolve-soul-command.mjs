#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const exact = new Map([
  ["阿瞳助我", ["activate", "atong-portable"]],
  ["mttt.sir,拷打我", ["activate", "mttt-sir-portable"]],
  ["开启soul模式", ["activate", "atong-portable"]],
  ["/soul on", ["activate", "atong-portable"]],
  ["/soul on atong", ["activate", "atong-portable"]],
  ["/soul on mttt-sir", ["activate", "mttt-sir-portable"]],
  ["灵魂杀手", ["activate", "soul-killer-portable"]],
  ["开启灵魂杀手模式", ["activate", "soul-killer-portable"]],
  ["强尼·银手,接管", ["activate", "soul-killer-portable"]],
  ["强尼,骂醒我", ["activate", "soul-killer-portable"]],
  ["启动relic故障检测", ["activate", "soul-killer-portable"]],
  ["/soul on soul-killer", ["activate", "soul-killer-portable"]],
  ["脑暴模式,soul联席", ["activate", "soul-ensemble-portable"]],
  ["三人一起脑暴", ["activate", "soul-ensemble-portable"]],
  ["soul三席就位", ["activate", "soul-ensemble-portable"]],
  ["/soul on ensemble", ["activate", "soul-ensemble-portable"]],
  ["阿瞳接手", ["switch", "atong-portable"]],
  ["mttt.sir上课", ["switch", "mttt-sir-portable"]],
  ["/soul switch atong", ["switch", "atong-portable"]],
  ["/soul switch mttt-sir", ["switch", "mttt-sir-portable"]],
  ["灵魂杀手接手", ["switch", "soul-killer-portable"]],
  ["强尼接手", ["switch", "soul-killer-portable"]],
  ["/soul switch soul-killer", ["switch", "soul-killer-portable"]],
  ["三席接手", ["switch", "soul-ensemble-portable"]],
  ["/soul switch ensemble", ["switch", "soul-ensemble-portable"]],
  ["soul归位", ["deactivate", "inactive"]],
  ["阿瞳归位", ["deactivate", "inactive"]],
  ["mttt.sir下课", ["deactivate", "inactive"]],
  ["结束soul模式", ["deactivate", "inactive"]],
  ["强尼,下线", ["deactivate", "inactive"]],
  ["relic断开", ["deactivate", "inactive"]],
  ["/soul off", ["deactivate", "inactive"]],
]);

function normalize(input) {
  const normalized = input.normalize("NFKC").trim().replace(/[！!。.]$/u, "").replace(/[，、]/gu, ",").replace(/\s+/gu, " ").replace(/\s*,\s*/gu, ",").toLowerCase();
  return normalized.startsWith("/") ? normalized : normalized.replace(/\s+/gu, "");
}
export function resolveSoulCommand(input) {
  const normalized = normalize(String(input || ""));
  const hit = exact.get(normalized);
  return hit ? { schemaVersion: 1, matched: true, action: hit[0], mode: hit[1], persistence: "current-task-portable" }
    : { schemaVersion: 1, matched: false, action: "none", mode: null, persistence: "none" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(`${JSON.stringify(resolveSoulCommand(process.argv.slice(2).join(" ")), null, 2)}\n`);
}
