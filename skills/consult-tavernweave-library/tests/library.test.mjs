import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { queryLibrary, searchCatalog } from "../scripts/query-library.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "assets", "picker", "catalog.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "references", "library-manifest.json"), "utf8"));

test("write routes always include standing A0", () => {
  const receipt = queryLibrary({ skill: "tavern-card-builder", intent: "设计 MVU 卡", write: true });
  assert.deepEqual(receipt.standing, ["ST-A0"]);
  assert.ok(receipt.documents.some((doc) => doc.id === "ST-A0"));
});

test("database experimental route is opt-in", () => {
  const stable = queryLibrary({ skill: "sillytavern-database-rolecards", write: true });
  const experimental = queryLibrary({ skill: "sillytavern-database-rolecards", write: true, includeExperimental: true });
  assert.equal(stable.documents.some((doc) => doc.id === "ST-C8"), false);
  assert.equal(experimental.documents.some((doc) => doc.id === "ST-C8"), true);
});

test("embedded UI route returns design and motion domains", () => {
  const receipt = queryLibrary({ skill: "sillytavern-embedded-ui", intent: "移动端抽屉", write: true });
  assert.deepEqual(receipt.domains.sort(), ["design", "motion"]);
  assert.ok(receipt.documents.some((doc) => doc.id === "ST-C12"));
});

test("full AFV screened catalogs and aggregate receipt are bundled", () => {
  assert.equal(catalog.catalogs.design.items.length, 462);
  assert.equal(catalog.catalogs.motion.items.length, 194);
  assert.equal(catalog.catalogs.wiki.items.length, 86);
  assert.equal(catalog.catalogs.ledger.items.length, 1609);
  assert.deepEqual(catalog.screening, {
    routeCount: 243,
    ready: 88,
    wikiOnly: 155,
    designAdds: 362,
    motionAdds: 147,
    candidateFilesDistributed: false,
  });
  assert.equal(manifest.documents.filter((doc) => doc.type === "design-wiki").length, 86);
});

test("catalog search returns a bounded proposed receipt without loading the full database", () => {
  const results = searchCatalog({ query: "玻璃 token", domains: ["design", "ledger"], limit: 5 });
  assert.ok(results.length > 0 && results.length <= 5);
  assert.ok(results.every((item) => item.state === "proposed"));
  assert.ok(results.some((item) => item.tags.includes("玻璃") || item.tags.includes("token")));
});

test("direct Library route searches all complete catalog domains", () => {
  const receipt = queryLibrary({ skill: "consult-tavernweave-library", intent: "时间轴 动效", catalogLimit: 4 });
  assert.deepEqual(receipt.domains, ["design", "motion", "wiki", "ledger"]);
  assert.deepEqual(receipt.catalogSummary, { design: 462, motion: 194, wiki: 86, ledger: 1609 });
  assert.ok(receipt.candidates.length > 0 && receipt.candidates.length <= 4);
});

test("every portable Wiki and preview reference resolves inside the Skill", () => {
  for (const domain of Object.values(catalog.catalogs)) {
    for (const item of domain.items) {
      if (item.wiki) assert.ok(fs.existsSync(path.join(root, item.wiki)), item.wiki);
      if (item.preview) assert.ok(fs.existsSync(path.join(root, "assets", "picker", "previews", item.preview)), item.preview);
    }
  }
});
