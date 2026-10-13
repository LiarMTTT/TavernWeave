import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateAuthority } from "../scripts/validate-creative-authority.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(here, "..", "references", "creative-authority-template.md"), "utf8");
const validator = path.join(here, "..", "scripts", "validate-creative-authority.mjs");

function authorityWithType(type) {
  return template.replace("target_card_type: unknown", `target_card_type: ${type}`);
}

test("template is structurally valid", () => {
  assert.deepEqual(validateAuthority(template), []);
});

for (const type of ["text", "mvu_zod", "hybrid"]) {
  test(`current target type ${type} is structurally valid without claiming runtime proof`, () => {
    const warnings = [];
    assert.deepEqual(validateAuthority(authorityWithType(type), { warnings }), []);
    assert.deepEqual(warnings, []);
  });
}

test("card-type scalar accepts plain, quoted, and separated inline-comment forms", () => {
  for (const type of ["text", "mvu_zod", "hybrid"]) {
    for (const scalar of [type, `"${type}"`, `'${type}'`, `${type} # selected`, `"${type}" # selected`, `'${type}'\t# selected`]) {
      const warnings = [];
      assert.deepEqual(validateAuthority(authorityWithType(scalar), { warnings }), [], scalar);
      assert.deepEqual(warnings, [], scalar);
    }
  }
});

test("card-type scalar does not truncate unknown values, quoted content, or trailing tokens", () => {
  for (const scalar of [
    "text#suffix", "text extra # comment", '"text"extra',
    '"text # embedded"', "'text # embedded'", '"text" hybrid', "'text' trailing",
    '"text', "'text", "'te''xt'", '"text\\n"', '"text\\q"', '""', "''", "# comment",
  ]) {
    assert.ok(validateAuthority(authorityWithType(scalar), { allowLegacyMvu: true })
      .some((error) => error.includes("invalid target_card_type")), scalar);
  }
});

test("unknown is a valid planning state with an explicit unresolved notice", () => {
  for (const scalar of ["unknown", '"unknown" # undecided', "'unknown'"]) {
    const warnings = [];
    assert.deepEqual(validateAuthority(authorityWithType(scalar), { warnings }), []);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /classification remains unresolved/);
  }
});

test("legacy mvu is rejected by default and allowed only through explicit read compatibility", () => {
  for (const scalar of ["mvu", '"mvu" # inherited', "'mvu'"]) {
    const legacy = authorityWithType(scalar);
    assert.ok(validateAuthority(legacy).some((error) => error.includes("legacy target_card_type")));
    const warnings = [];
    assert.deepEqual(validateAuthority(legacy, { allowLegacyMvu: true, warnings }), []);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Zod remains unverified/);
    assert.match(warnings[0], /no authority, card, or save migration/);
  }
});

test("legacy compatibility does not allow arbitrary or missing type values", () => {
  for (const type of ["MVU_ZOD", "mvu-zod", "retrofit", "text | mvu_zod"]) {
    assert.ok(validateAuthority(authorityWithType(type), { allowLegacyMvu: true })
      .some((error) => error.includes("invalid target_card_type")), type);
  }
  assert.ok(validateAuthority(authorityWithType(""), { allowLegacyMvu: true })
    .some((error) => error.includes("missing front matter field: target_card_type")));
});

test("a decision cannot occupy two authority states", () => {
  const duplicate = template.replace("## Proposed\n", "## Proposed\n\n- [DEC-001] duplicate promotion\n");
  assert.ok(validateAuthority(duplicate).some((error) => error.includes("appears in both")));
});

test("automation cannot declare driver acceptance", () => {
  const accepted = template.replace("status: candidate", "status: driver-accepted");
  assert.ok(validateAuthority(accepted, { automation: true }).some((error) => error.includes("automation cannot")));
});

test("legacy compatibility cannot bypass either driver-only status", () => {
  for (const status of ["driver-approved-design", "driver-accepted"]) {
    const legacy = authorityWithType("mvu").replace("status: candidate", `status: ${status}`);
    assert.ok(validateAuthority(legacy, { automation: true, allowLegacyMvu: true })
      .some((error) => error.includes("automation cannot")), status);
  }
});

test("CLI requires the legacy option, reports its limits, and preserves authority bytes", (t) => {
  const directory = fs.mkdtempSync(path.join(here, ".authority-cli-"));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(here));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const file = path.join(directory, "legacy.md");
  fs.writeFileSync(file, authorityWithType('"mvu" # inherited declaration'));
  const before = fs.readFileSync(file);

  const rejected = spawnSync(process.execPath, [validator, file], { encoding: "utf8" });
  assert.equal(rejected.status, 1, rejected.stderr);
  assert.match(rejected.stderr, /ERROR: legacy target_card_type/);
  assert.deepEqual(fs.readFileSync(file), before);

  const accepted = spawnSync(process.execPath, [validator, file, "--allow-legacy-mvu"], { encoding: "utf8" });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stderr, /WARNING:.*read compatibility only/);
  assert.match(accepted.stderr, /Zod remains unverified/);
  assert.match(accepted.stderr, /no authority, card, or save migration/);
  assert.match(accepted.stdout, /structure valid/);
  assert.deepEqual(fs.readFileSync(file), before);

  const typo = spawnSync(process.execPath, [validator, file, "--allow-legacy"], { encoding: "utf8" });
  assert.equal(typo.status, 2, typo.stderr);
  assert.match(typo.stderr, /unknown option/);
  assert.deepEqual(fs.readFileSync(file), before);
});

test("CLI legacy compatibility still rejects automation promotion", (t) => {
  const directory = fs.mkdtempSync(path.join(here, ".authority-cli-"));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(here));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const file = path.join(directory, "legacy.md");
  fs.writeFileSync(file, authorityWithType("mvu").replace("status: candidate", "status: driver-accepted"));
  const before = fs.readFileSync(file);
  const result = spawnSync(process.execPath, [validator, file, "--allow-legacy-mvu", "--automation"], { encoding: "utf8" });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /WARNING:.*read compatibility only/);
  assert.match(result.stderr, /ERROR: automation cannot set status: driver-accepted/);
  assert.deepEqual(fs.readFileSync(file), before);
});
