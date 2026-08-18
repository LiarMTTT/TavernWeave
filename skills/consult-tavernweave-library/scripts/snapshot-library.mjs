#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, "..");
const referencesRoot = path.join(skillRoot, "references");
const assetsRoot = path.join(skillRoot, "assets", "picker");
const snapshotVersion = "2026-08-18";
const expectedCounts = {
  standingGuides: 1,
  formalGuides: 31,
  experimentalGuides: 1,
  designItems: 462,
  motionItems: 194,
  conceptItems: 86,
  linkedWiki: 86,
  ledgerItems: 1609,
  screenedRoutes: 243,
  readyRoutes: 88,
  wikiOnlyRoutes: 155,
  screenedDesignAdds: 362,
  screenedMotionAdds: 147,
};

const guides = [
  ["ST-A0", "A0_驾驭工程从零搭建检查单.md", "standing"],
  ["ST-A2", "A2_角色卡格式规范.md", "formal"], ["ST-A3", "A3_世界书优化.md", "formal"],
  ["ST-A4", "A4_提示词与预设.md", "formal"], ["ST-A5", "A5_渲染管线与宏.md", "formal"],
  ["ST-A6", "A6_正则机制.md", "formal"], ["ST-B1", "B1_变量更新规则.md", "formal"],
  ["ST-B2", "B2_STScript与QuickReplies.md", "formal"], ["ST-C1", "C1_前端基础-TavernHelper与iframe.md", "formal"],
  ["ST-C2", "C2_前端应用-状态栏与控制中心.md", "formal"], ["ST-C3", "C3_HTML美化与CSS.md", "formal"],
  ["ST-C4", "C4_数据库表格模板.md", "formal"], ["ST-C5", "C5_同层前端.md", "formal"],
  ["ST-C6", "C6_独立前端.md", "formal"], ["ST-C7", "C7_数据库二创前端.md", "formal"],
  ["ST-C8", "C8_数据库兼容同层前端-待验证.md", "experimental"], ["ST-C9", "C9_酒馆界面美化.md", "formal"],
  ["ST-C10", "C10_开局页与自定义开局.md", "formal"], ["ST-C11", "C11_悬浮球与功能入口.md", "formal"],
  ["ST-C12", "C12_抽屉式状态栏-移动端方案.md", "formal"], ["ST-C13", "C13_浮窗式状态栏.md", "formal"],
  ["ST-D1", "D1_git挂载与资源加载.md", "formal"], ["ST-D2", "D2_大卡性能优化.md", "formal"],
  ["ST-D3", "D3_多模型API适配差异.md", "formal"], ["ST-D4", "D4_ST数据目录与部署运维.md", "formal"],
  ["ST-D5", "D5_ST扩展开发完整指南.md", "formal"], ["ST-D6", "D6_角色卡安全与XSS防护.md", "formal"],
  ["ST-D7", "D7_移动端与响应式适配.md", "formal"], ["ST-E1", "E1_ST群聊与多角色机制.md", "formal"],
  ["ST-E2", "E2_消息操作与分支检查点.md", "formal"], ["ST-E3", "E3_音频媒体与多模态.md", "formal"],
  ["ST-E4", "E4_表情立绘与Live2D.md", "formal"], ["ST-E5", "E5_创意工坊与扩展生态.md", "formal"],
];

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : ""; }
function portableHash(buffer) {
  let bytes = buffer;
  try { bytes = Buffer.from(buffer.toString("utf8").replace(/\r\n?/g, "\n")); } catch {}
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function safeCopy(source, target) {
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error(`missing source: ${source}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const sourceBytes = fs.readFileSync(source);
  const sourceText = sourceBytes.toString("utf8");
  const privatePathPattern = /[A-Z]:\\Users\\[^\\\s]+\\/gi;
  const credentialPattern = /((?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*)["'][^"']{8,}["']/gi;
  const pathMatches = sourceText.match(privatePathPattern) || [];
  const credentialMatches = sourceText.match(credentialPattern) || [];
  const targetText = sourceText
    .replace(/\r\n?/g, "\n")
    .replace(privatePathPattern, "<local-user-path>/")
    .replace(credentialPattern, "$1<redacted-at-snapshot>");
  const targetBytes = Buffer.from(targetText, "utf8");
  fs.writeFileSync(target, targetBytes);
  return {
    sourceHash: portableHash(sourceBytes),
    targetHash: portableHash(targetBytes),
    bytes: targetBytes.length,
    redactions: pathMatches.length + credentialMatches.length,
    pathRedactions: pathMatches.length,
    credentialRedactions: credentialMatches.length,
  };
}
function rewritePortableWikiLinks(target, meta) {
  const original = fs.readFileSync(target, "utf8");
  const rewritten = original.replace(/\]\(库挑选器\/index\.html([^)]*)\)/gu, "](../../assets/picker/index.html$1)");
  if (rewritten !== original) fs.writeFileSync(target, rewritten, "utf8");
  const bytes = fs.readFileSync(target);
  return { ...meta, targetHash: portableHash(bytes), bytes: bytes.length };
}
function loadCatalog(file, key) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox, { filename: path.basename(file), timeout: 5000 });
  const catalog = sandbox.window.AFV_CATALOGS?.[key];
  if (!catalog || !Array.isArray(catalog.items)) throw new Error(`invalid ${key} catalog`);
  return JSON.parse(JSON.stringify(catalog));
}
function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walkFiles(path.join(root, entry.name)) : [path.join(root, entry.name)]);
}
function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}
function removeStaleFiles(root, expected, extensions) {
  if (!isInside(skillRoot, root)) throw new Error(`refusing unsafe snapshot cleanup: ${root}`);
  for (const file of walkFiles(root)) {
    if (extensions.includes(path.extname(file).toLowerCase()) && !expected.has(path.resolve(file))) fs.rmSync(file);
  }
}
function loadScreeningSummary(afvRoot, design, motion) {
  const candidateRoot = path.join(afvRoot, "10-收件箱", "写回候选");
  const files = fs.readdirSync(candidateRoot).filter((name) => /^实装-.*\.json$/u.test(name)).sort();
  if (files.length !== expectedCounts.screenedRoutes) throw new Error(`screened route count drift: ${files.length}`);
  const rows = files.map((name) => JSON.parse(fs.readFileSync(path.join(candidateRoot, name), "utf8")));
  const routes = new Set(rows.map((row) => row.route));
  if (routes.size !== files.length) throw new Error(`duplicate screened route: files=${files.length}, routes=${routes.size}`);
  const ready = rows.filter((row) => row.status === "ready").length;
  const wikiOnly = rows.filter((row) => row.status === "wiki-only").length;
  if (ready !== expectedCounts.readyRoutes || wikiOnly !== expectedCounts.wikiOnlyRoutes) throw new Error(`screening status drift: ready=${ready}, wiki-only=${wikiOnly}`);
  const additions = rows.flatMap((row) => (row.add || []).map((item) => ({ ...item, route: row.route })));
  const uniqueAdditions = new Map(additions.map((item) => [item.id, item]));
  if (uniqueAdditions.size !== additions.length) throw new Error("duplicate screened catalog item id");
  const catalogIds = new Set([...design.items, ...motion.items].map((item) => item.id));
  const missing = additions.filter((item) => !catalogIds.has(item.id));
  if (missing.length) throw new Error(`screened items missing from catalogs: ${missing.slice(0, 5).map((item) => item.id).join(", ")}`);
  const designAdds = additions.filter((item) => item.lib === "design").length;
  const motionAdds = additions.filter((item) => item.lib === "motion").length;
  if (designAdds !== expectedCounts.screenedDesignAdds || motionAdds !== expectedCounts.screenedMotionAdds) throw new Error(`screened addition drift: design=${designAdds}, motion=${motionAdds}`);
  return { routeCount: files.length, ready, wikiOnly, designAdds, motionAdds, candidateFilesDistributed: false };
}

const stdbRoot = path.resolve(arg("--stdb-root") || "");
const afvRoot = path.resolve(arg("--afv-root") || "");
if (!arg("--stdb-root") || !arg("--afv-root")) {
  console.error("Usage: node snapshot-library.mjs --stdb-root <ST开发指南DB> --afv-root <AFV root>");
  process.exit(2);
}
if (!fs.existsSync(path.join(stdbRoot, "A1_驾驶员同步检查.md"))) throw new Error("A1 exclusion sentinel is missing at source; refusing ambiguous source root");

const stOut = path.join(referencesRoot, "st-guides");
const wikiOut = path.join(referencesRoot, "design-wiki");
const previewOut = path.join(assetsRoot, "previews");
const documents = [];
for (const [id, filename, status] of guides) {
  const target = path.join(stOut, filename);
  const meta = safeCopy(path.join(stdbRoot, filename), target);
  documents.push({ id, type: "st-guide", status, standing: status === "standing", path: `references/st-guides/${filename}`, source: `STDB/${filename}`, license: "TavernWeave-PolyForm-NC-1.0.0", ...meta });
}

const conceptRoot = path.join(afvRoot, "concepts");
const afvPickerRoot = path.join(conceptRoot, "库挑选器");
const catalogSources = {
  design: path.join(conceptRoot, "前端设计库", "catalog.js"),
  motion: path.join(conceptRoot, "动画库", "catalog.js"),
  wiki: path.join(afvPickerRoot, "wiki-catalog.js"),
  ledger: path.join(afvPickerRoot, "ledger-catalog.js"),
};
const sourceCatalogs = Object.fromEntries(Object.entries(catalogSources).map(([key, file]) => [key, loadCatalog(file, key)]));
for (const [key, countKey] of [["design", "designItems"], ["motion", "motionItems"], ["wiki", "conceptItems"], ["ledger", "ledgerItems"]]) {
  if (sourceCatalogs[key].items.length !== expectedCounts[countKey]) throw new Error(`${key} catalog count drift: ${sourceCatalogs[key].items.length}`);
}
const screening = loadScreeningSummary(afvRoot, sourceCatalogs.design, sourceCatalogs.motion);

const wikiNames = [...new Set(Object.values(sourceCatalogs).flatMap((catalog) => catalog.items.map((item) => item.wiki && path.basename(item.wiki)).filter(Boolean)))].sort((a, b) => a.localeCompare(b, "zh-CN"));
if (wikiNames.length !== expectedCounts.linkedWiki) throw new Error(`linked Wiki count drift: ${wikiNames.length}`);
const expectedWikiTargets = new Set();
for (const [index, filename] of wikiNames.entries()) {
  const target = path.join(wikiOut, filename);
  expectedWikiTargets.add(path.resolve(target));
  const meta = rewritePortableWikiLinks(target, safeCopy(path.join(conceptRoot, filename), target));
  documents.push({ id: `AFV-WIKI-${String(index + 1).padStart(3, "0")}`, type: "design-wiki", status: "reference", standing: false, path: `references/design-wiki/${filename}`, source: `AFV/concepts/${filename}`, license: "MIT-AFV-2026-LiarMTTT", ...meta });
}
removeStaleFiles(wikiOut, expectedWikiTargets, [".md"]);

const previewRoots = {
  design: path.join(conceptRoot, "前端设计库", "preview"),
  motion: path.join(conceptRoot, "动画库", "preview"),
  common: path.join(afvPickerRoot, "preview"),
};
const expectedPreviewTargets = new Set();
function normalizePreview(domain, reference) {
  if (!reference) return "";
  if (/^(?:https?:|data:|\/)/i.test(reference) || path.isAbsolute(reference)) throw new Error(`non-portable preview reference: ${domain}:${reference}`);
  let source;
  if (reference.startsWith(".")) source = path.resolve(afvPickerRoot, reference);
  else if (domain === "design" || domain === "motion") source = path.resolve(previewRoots[domain], reference.replace(/^preview[\\/]/i, ""));
  else source = path.resolve(afvPickerRoot, reference.startsWith("preview/") ? reference : `preview/${reference}`);
  const bucket = Object.entries(previewRoots).find(([, root]) => isInside(root, source));
  if (!bucket || !fs.existsSync(source)) throw new Error(`missing or escaping preview: ${domain}:${reference}`);
  const relative = path.relative(bucket[1], source);
  const targetRelative = path.join(bucket[0], relative);
  const target = path.join(previewOut, targetRelative);
  expectedPreviewTargets.add(path.resolve(target));
  safeCopy(source, target);
  return targetRelative.replaceAll(path.sep, "/");
}
function normalizeCatalog(domain, catalog) {
  return {
    ...catalog,
    previewBase: "previews/",
    items: catalog.items.map((item) => ({
      ...item,
      ...(item.wiki ? { wiki: `references/design-wiki/${path.basename(item.wiki)}` } : {}),
      ...(item.preview ? { preview: normalizePreview(domain, item.preview) } : {}),
    })),
  };
}
const catalogs = Object.fromEntries(Object.entries(sourceCatalogs).map(([domain, catalog]) => [domain, normalizeCatalog(domain, catalog)]));
removeStaleFiles(previewOut, expectedPreviewTargets, [".html"]);

const sourceFiles = Object.fromEntries(Object.entries(catalogSources).map(([key, file]) => [key, { source: `AFV/${path.relative(afvRoot, file).replaceAll(path.sep, "/")}`, hash: portableHash(fs.readFileSync(file)), bytes: fs.statSync(file).size }])) ;
const catalogTarget = path.join(assetsRoot, "catalog.json");
fs.mkdirSync(path.dirname(catalogTarget), { recursive: true });
const catalogPayload = { schemaVersion: 2, snapshotVersion, screening, catalogs };
fs.writeFileSync(catalogTarget, `${JSON.stringify(catalogPayload, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(assetsRoot, "catalog-data.js"), `window.TW_LIBRARY_CATALOG = ${JSON.stringify(catalogPayload)};\n`, "utf8");

const pickerManifest = { schemaVersion: 2, snapshotVersion, expectedCounts, screening, sourceFiles, documents };
fs.writeFileSync(path.join(assetsRoot, "manifest-data.js"), `window.TW_LIBRARY_MANIFEST = ${JSON.stringify(pickerManifest)};\n`, "utf8");

const snapshotRoots = [stOut, wikiOut, assetsRoot];
const files = snapshotRoots.flatMap(walkFiles).sort((a, b) => a.localeCompare(b));
const allowedA1Tokens = ["A1_驾驶员同步检查", "A1 驾驶员同步检查"];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  if (allowedA1Tokens.some((token) => text.includes(token)) || path.basename(file).startsWith("A1_")) throw new Error(`A1 exclusion failed: ${path.relative(skillRoot, file)}`);
  if (/[A-Z]:\\Users\\[^\\\s]+\\/i.test(text)) throw new Error(`private path in snapshot: ${path.relative(skillRoot, file)}`);
}
const assets = files.filter((file) => !file.startsWith(stOut) && !file.startsWith(wikiOut)).map((file) => ({
  path: path.relative(skillRoot, file).replaceAll(path.sep, "/"),
  hash: portableHash(fs.readFileSync(file)),
  bytes: fs.statSync(file).size,
}));
const manifest = {
  schemaVersion: 2,
  snapshotVersion,
  sourcePolicy: "explicit-allowlist",
  expectedCounts,
  screening,
  sourceFiles,
  exclusions: ["STDB/A1_驾驶员同步检查.md", "STDB/B1_变量更新规则_命令式时代_归档.md", "STDB/本地证据/**", "AFV/10-收件箱/**", "AFV/raw/**", "AFV unrelated framework and knowledge domains"],
  documents,
  assets,
};
if ([...documents, ...assets].some((record) => /(?:^|\/)10-收件箱\/|(?:^|\/)写回候选\/|(?:^|\/)实装-[^/]+\.json$/u.test(record.path))) throw new Error("AFV candidate inbox path leaked into public snapshot");
fs.writeFileSync(path.join(referencesRoot, "library-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Library snapshot written: ${documents.length} documents, ${catalogs.design.items.length} design, ${catalogs.motion.items.length} motion, ${catalogs.wiki.items.length} concepts, ${catalogs.ledger.items.length} ledger items, ${expectedPreviewTargets.size} previews.`);
