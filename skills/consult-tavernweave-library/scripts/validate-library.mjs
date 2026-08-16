#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "references", "library-manifest.json"), "utf8"));
const routeMap = JSON.parse(fs.readFileSync(path.join(root, "references", "route-map.json"), "utf8"));
const errors = [];
const hash = (bytes) => crypto.createHash("sha256").update(Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"))).digest("hex");
const allRecords = [...manifest.documents.map((r) => ({ path: r.path, expected: r.targetHash })), ...manifest.assets.map((r) => ({ path: r.path, expected: r.hash }))];
for (const record of allRecords) {
  const file = path.resolve(root, record.path);
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file)) errors.push(`missing or escaping snapshot file: ${record.path}`);
  else if (hash(fs.readFileSync(file)) !== record.expected) errors.push(`hash mismatch: ${record.path}`);
}
const ids = new Set(manifest.documents.map((record) => record.id));
if (!ids.has("ST-A0")) errors.push("standing A0 record missing");
if (manifest.documents.filter((r) => r.type === "st-guide").length !== 33) errors.push("ST guide count is not 33");
for (const route of routeMap.routes) for (const id of [...(route.guides || []), ...(route.experimentalGuides || [])]) if (!ids.has(id)) errors.push(`route ${route.id} references unknown ${id}`);
const publicText = allRecords.map((record) => fs.readFileSync(path.resolve(root, record.path), "utf8")).join("\n");
if (/A1[_ ·]驾驶员同步检查|A1_驾驶员同步检查/.test(publicText)) errors.push("A1 content or path leaked into snapshot");
if (/B1_变量更新规则_命令式时代_归档/.test(publicText)) errors.push("archived B1 leaked into snapshot");
if (/[A-Z]:\\Users\\[^\\\s]+\\/i.test(publicText)) errors.push("private absolute path leaked into snapshot");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "assets", "picker", "catalog.json"), "utf8"));
if (catalog.catalogs.design.items.length !== 82) errors.push("design item count is not 82");
if (catalog.catalogs.motion.items.length !== 38) errors.push("motion item count is not 38");
const wikiPaths = new Set(manifest.documents.filter((r) => r.type === "design-wiki").map((r) => path.basename(r.path)));
for (const item of [...catalog.catalogs.design.items, ...catalog.catalogs.motion.items]) if (item.wiki && !wikiPaths.has(path.basename(item.wiki))) errors.push(`linked Wiki missing for ${item.id}`);
if (errors.length) { for (const error of errors) console.error(`ERROR: ${error}`); process.exit(1); }
console.log(`Library valid: ${manifest.documents.length} documents, ${catalog.catalogs.design.items.length} design, ${catalog.catalogs.motion.items.length} motion.`);
