import assert from "node:assert/strict";
import test from "node:test";
import { queryLibrary } from "../scripts/query-library.mjs";

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
