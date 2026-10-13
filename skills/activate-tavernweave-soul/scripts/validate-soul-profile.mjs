#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const schema = JSON.parse(fs.readFileSync(new URL("../references/profile-schema.json", import.meta.url), "utf8"));
const sensitive = /(?:credential|password|token|secret|private[_-]?key|chat[_-]?export|raw[_-]?conversation|a1[_ ·_]?驾驶员同步检查)/i;

// Implements the keywords used by the bundled profile schema, including nested sources.
function check(value, rule, errors, pointer = "profile") {
  const object = value !== null && typeof value === "object" && !Array.isArray(value);
  const matches = { object, array: Array.isArray(value), string: typeof value === "string", boolean: typeof value === "boolean", integer: Number.isInteger(value) };
  if (rule.type && !matches[rule.type]) { errors.push(`${pointer} must be ${rule.type}`); return; }
  if ("const" in rule && value !== rule.const) errors.push(`${pointer} must be ${rule.const}`);
  if (rule.enum && !rule.enum.includes(value)) errors.push(`${pointer} is outside the allowed values`);
  if (typeof value === "string") {
    const length = [...value].length;
    if (rule.minLength !== undefined && length < rule.minLength) errors.push(`${pointer} is too short`);
    if (rule.maxLength !== undefined && length > rule.maxLength) errors.push(`${pointer} is too long`);
    if (rule.pattern && !new RegExp(rule.pattern, "u").test(value)) errors.push(`${pointer} has an invalid format`);
    if (rule.format === "date" && (!/^\d{4}-\d{2}-\d{2}$/u.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) errors.push(`${pointer} must be a real calendar date`);
  }
  if (typeof value === "number" && ((rule.minimum !== undefined && value < rule.minimum) || (rule.maximum !== undefined && value > rule.maximum))) errors.push(`${pointer} is outside the allowed range`);
  if (Array.isArray(value)) {
    if (rule.maxItems !== undefined && value.length > rule.maxItems) errors.push(`${pointer} has too many items`);
    if (rule.uniqueItems && new Set(value).size !== value.length) errors.push(`${pointer} must contain unique items`);
    if (rule.items) value.forEach((item, index) => check(item, rule.items, errors, `${pointer}[${index}]`));
  }
  if (object) {
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${pointer} is missing ${key}`);
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(rule.properties ?? {}, key)) check(child, rule.properties[key], errors, `${pointer}.${key}`);
      else if (rule.additionalProperties === false) errors.push(`unknown field: ${pointer}.${key}`);
    }
  }
}

function scanPrivatePaths(value, errors, pointer = "profile") {
  if (typeof value === "string" && /(?:[A-Z]:[\\/]|\\\\[^\\/\s]+[\\/])Users[\\/][^\\/\s]+(?:[\\/]|$)/iu.test(value)) errors.push(`${pointer} contains a private absolute path`);
  else if (Array.isArray(value)) value.forEach((item, index) => scanPrivatePaths(item, errors, `${pointer}[${index}]`));
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) scanPrivatePaths(child, errors, `${pointer}.${key}`);
}

export function validateSoulProfile(profile) {
  const errors = [];
  check(profile, schema, errors);
  if (sensitive.test(JSON.stringify(profile))) errors.push("profile contains a forbidden sensitive field or content class");
  scanPrivatePaths(profile, errors);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-soul-profile.mjs <profile.json>"); process.exit(2); }
  const errors = validateSoulProfile(JSON.parse(fs.readFileSync(file, "utf8")));
  if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
  console.log(`Soul profile valid: ${file}`);
}
