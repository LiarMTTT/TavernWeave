import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateAuthority } from "../scripts/validate-creative-authority.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(here, "..", "references", "creative-authority-template.md"), "utf8");

test("template is structurally valid", () => {
  assert.deepEqual(validateAuthority(template), []);
});

test("a decision cannot occupy two authority states", () => {
  const duplicate = template.replace("## Proposed\n", "## Proposed\n\n- [DEC-001] duplicate promotion\n");
  assert.ok(validateAuthority(duplicate).some((error) => error.includes("appears in both")));
});

test("automation cannot declare driver acceptance", () => {
  const accepted = template.replace("status: candidate", "status: driver-accepted");
  assert.ok(validateAuthority(accepted, { automation: true }).some((error) => error.includes("automation cannot")));
});
