#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "references", "library-manifest.json"), "utf8"));
const routeMap = JSON.parse(fs.readFileSync(path.join(root, "references", "route-map.json"), "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.join(root, "assets", "picker", "catalog.json"), "utf8"));
const errors = [];
const hash = (bytes) => crypto.createHash("sha256").update(Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"))).digest("hex");
const allRecords = [...manifest.documents.map((record) => ({ path: record.path, expected: record.targetHash })), ...manifest.assets.map((record) => ({ path: record.path, expected: record.hash }))];

for (const record of allRecords) {
  const file = path.resolve(root, record.path);
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file)) errors.push(`missing or escaping snapshot file: ${record.path}`);
  else if (hash(fs.readFileSync(file)) !== record.expected) errors.push(`hash mismatch: ${record.path}`);
}

const ids = new Set(manifest.documents.map((record) => record.id));
if (!ids.has("ST-A0")) errors.push("standing A0 record missing");
if (manifest.documents.filter((record) => record.type === "st-guide").length !== 33) errors.push("ST guide count is not 33");
for (const route of routeMap.routes) {
  for (const id of [...(route.guides || []), ...(route.experimentalGuides || [])]) if (!ids.has(id)) errors.push(`route ${route.id} references unknown ${id}`);
}

const expected = manifest.expectedCounts || {};
const countChecks = {
  designItems: catalog.catalogs.design?.items?.length,
  motionItems: catalog.catalogs.motion?.items?.length,
  conceptItems: catalog.catalogs.wiki?.items?.length,
  ledgerItems: catalog.catalogs.ledger?.items?.length,
  linkedWiki: manifest.documents.filter((record) => record.type === "design-wiki").length,
};
for (const [key, actual] of Object.entries(countChecks)) if (actual !== expected[key]) errors.push(`${key} count mismatch: expected ${expected[key]}, got ${actual}`);
if (catalog.snapshotVersion !== manifest.snapshotVersion) errors.push("catalog and manifest snapshot versions differ");
if (catalog.screening?.routeCount !== expected.screenedRoutes) errors.push("screened route count mismatch");
if (catalog.screening?.ready !== expected.readyRoutes || catalog.screening?.wikiOnly !== expected.wikiOnlyRoutes) errors.push("screening status count mismatch");
if (catalog.screening?.candidateFilesDistributed !== false) errors.push("candidate inbox files must not be distributed");

const wikiPaths = new Set(manifest.documents.filter((record) => record.type === "design-wiki").map((record) => record.path));
for (const [domain, domainCatalog] of Object.entries(catalog.catalogs)) {
  const seen = new Set();
  for (const item of domainCatalog.items || []) {
    if (!item.id || seen.has(item.id)) errors.push(`duplicate or missing ${domain} id: ${item.id || "<empty>"}`);
    seen.add(item.id);
    if (item.wiki && !wikiPaths.has(item.wiki)) errors.push(`linked Wiki missing for ${domain}:${item.id}`);
    if (item.preview) {
      const preview = path.resolve(root, "assets", "picker", "previews", item.preview);
      const previewRoot = path.resolve(root, "assets", "picker", "previews");
      if (!preview.startsWith(`${previewRoot}${path.sep}`) || !fs.existsSync(preview)) errors.push(`preview missing or escaping for ${domain}:${item.id}`);
    }
    if (item.url && !/^https?:\/\//i.test(item.url)) errors.push(`non-http source URL for ${domain}:${item.id}`);
  }
}

const publicText = allRecords.map((record) => fs.readFileSync(path.resolve(root, record.path), "utf8")).join("\n");
if (/A1[_ ·]驾驶员同步检查|A1_驾驶员同步检查/.test(publicText)) errors.push("A1 content or path leaked into snapshot");
if (allRecords.some((record) => /(?:^|\/)B1_变量更新规则_命令式时代_归档\.md$/u.test(record.path))) errors.push("archived B1 file leaked into snapshot");
if (/[A-Z]:\\Users\\[^\\\s]+\\/i.test(publicText)) errors.push("private absolute path leaked into snapshot");
if (allRecords.some((record) => /(?:^|\/)10-收件箱\/|(?:^|\/)写回候选\/|(?:^|\/)实装-[^/]+\.json$/u.test(record.path))) errors.push("AFV candidate inbox path leaked into public snapshot");

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`Library valid: ${manifest.documents.length} documents, ${countChecks.designItems} design, ${countChecks.motionItems} motion, ${countChecks.conceptItems} concepts, ${countChecks.ledgerItems} ledger items.`);
