#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const allowedStatuses = new Set([
  "candidate",
  "driver-approved-design",
  "implementation-candidate",
  "automated-evidence",
  "real-host-evidence",
  "driver-accepted",
]);
const allowedCardTypes = new Set(["text", "mvu_zod", "hybrid", "unknown"]);
const legacyMvuWarning = "legacy target_card_type mvu accepted for read compatibility only; Zod remains unverified and no authority, card, or save migration has been performed";
const unresolvedTypeWarning = "target_card_type is unknown; classification remains unresolved and structural validity is not card readiness";
const decisionSections = ["Confirmed", "Proposed", "Open decisions", "Rejected"];
const requiredSections = [
  "Goal and exclusions",
  ...decisionSections,
  "Material index",
  "Entry and component map",
  "Runtime dependency ledger",
  "Acceptance ledger",
  "Next gate",
];

// Only the one-line card-type scalar needs normalization; this is not a YAML parser.
function parseCardTypeScalar(raw) {
  if (raw.startsWith('"')) {
    const quoted = raw.match(/^("(?:[^"\\]|\\.)*")(?:[ \t]+#.*)?$/);
    if (!quoted) return null;
    try {
      return JSON.parse(quoted[1]);
    } catch {
      return null;
    }
  }
  if (raw.startsWith("'")) {
    const quoted = raw.match(/^'((?:[^']|'')*)'(?:[ \t]+#.*)?$/);
    return quoted ? quoted[1].replace(/''/g, "'") : null;
  }
  return raw.replace(/[ \t]+#.*$/, "").trim();
}

export function validateAuthority(text, { automation = false, allowLegacyMvu = false, warnings = [] } = {}) {
  const errors = [];
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fm) return ["missing YAML front matter"];
  const fields = Object.fromEntries(
    fm[1].split(/\r?\n/).map((line) => line.match(/^([a-z_]+):\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]])
  );
  const requiredFields = ["authority_schema", "project_id", "title", "status", "target_card_type", "target_host", "updated", "next_gate"];
  for (const key of requiredFields) if (!fields[key]) errors.push(`missing front matter field: ${key}`);
  if (fields.authority_schema && fields.authority_schema !== "tavernweave/creative-authority/v1") errors.push("unsupported authority_schema");
  if (fields.status && !allowedStatuses.has(fields.status)) errors.push(`invalid status: ${fields.status}`);
  if (automation && ["driver-approved-design", "driver-accepted"].includes(fields.status)) errors.push(`automation cannot set status: ${fields.status}`);
  const cardType = fields.target_card_type ? parseCardTypeScalar(fields.target_card_type) : undefined;
  if (cardType === "mvu") {
    if (allowLegacyMvu) warnings.push(legacyMvuWarning);
    else errors.push("legacy target_card_type: mvu; new records use text, mvu_zod, or hybrid; explicitly enable allowLegacyMvu / --allow-legacy-mvu only to read a legacy record without migration");
  } else if (fields.target_card_type && !allowedCardTypes.has(cardType)) {
    errors.push(`invalid target_card_type: ${fields.target_card_type}; expected text, mvu_zod, hybrid, or unresolved unknown`);
  } else if (cardType === "unknown") {
    warnings.push(unresolvedTypeWarning);
  }

  const sections = new Map();
  const headings = [...text.matchAll(/^## (.+?)\s*$/gm)];
  headings.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : text.length;
    sections.set(match[1], text.slice(start, end));
  });
  for (const name of requiredSections) if (!sections.has(name)) errors.push(`missing section: ${name}`);

  const ids = new Map();
  for (const name of decisionSections) {
    const body = sections.get(name) || "";
    for (const match of body.matchAll(/^- \[(DEC-[A-Z0-9-]+)\]\s+(.+)$/gm)) {
      if (ids.has(match[1])) errors.push(`decision ${match[1]} appears in both ${ids.get(match[1])} and ${name}`);
      else ids.set(match[1], name);
    }
  }

  for (const block of ["twa-materials", "twa-entries", "twa-acceptance"]) {
    const match = text.match(new RegExp("```" + block + "\\r?\\n([\\s\\S]*?)\\r?\\n```"));
    if (!match) errors.push(`missing structured block: ${block}`);
    else {
      try {
        const data = JSON.parse(match[1]);
        if (data.schemaVersion !== 1) errors.push(`invalid schemaVersion in ${block}`);
      } catch (error) {
        errors.push(`invalid JSON in ${block}: ${error.message}`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const automation = args.includes("--automation");
  const allowLegacyMvu = args.includes("--allow-legacy-mvu");
  const files = args.filter((arg) => !arg.startsWith("--"));
  const unknownFlags = args.filter((arg) => arg.startsWith("--") && !["--automation", "--allow-legacy-mvu"].includes(arg));
  if (files.length !== 1 || unknownFlags.length) {
    if (unknownFlags.length) console.error(`ERROR: unknown option(s): ${unknownFlags.join(", ")}`);
    console.error("Usage: node validate-creative-authority.mjs <authority.md> [--automation] [--allow-legacy-mvu]");
    process.exit(2);
  }
  const file = files[0];
  const warnings = [];
  const errors = validateAuthority(fs.readFileSync(file, "utf8"), { automation, allowLegacyMvu, warnings });
  for (const warning of warnings) console.error(`WARNING: ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exit(1);
  }
  console.log(`Creative authority structure valid: ${file}`);
}
