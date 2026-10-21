import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { HOST_FILES } from "../skills/rewrite-natural-prose/scripts/manage-rewrite-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// This assertion needs repository packaging metadata; installed skill tests do not.
test("host filenames match the distribution mapping", () => {
  const mapping = JSON.parse(fs.readFileSync(path.join(root, "host-adapters/host-map.json"), "utf8"));
  for (const [host, name] of Object.entries(HOST_FILES)) {
    assert.equal(mapping.hosts[host].instructionFileName, name);
  }
});
