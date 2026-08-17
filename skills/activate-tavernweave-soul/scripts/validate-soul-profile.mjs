#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const allowedTop = new Set(["schemaVersion", "profileId", "version", "scope", "confirmedAt", "privacy", "preferences", "sources"]);
const allowedPreferences = new Set(["language", "conclusionFirst", "technicalAltitude", "decisionBatchSize", "creativeOpenness", "acceptanceStyle", "frontendCritiqueDirectness", "designPriorities", "motionPreference"]);
const sensitive = /(?:credential|password|token|secret|private[_-]?key|chat[_-]?export|raw[_-]?conversation|a1[_ ·_]?驾驶员同步检查)/i;

export function validateSoulProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return ["profile must be an object"];
  for (const key of Object.keys(profile)) if (!allowedTop.has(key)) errors.push(`unknown top-level field: ${key}`);
  for (const key of allowedTop) if (!(key in profile)) errors.push(`missing field: ${key}`);
  if (profile.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (profile.privacy !== "private-adapter") errors.push("privacy must be private-adapter");
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(profile.profileId || "")) errors.push("invalid profileId");
  if (!/^\d+\.\d+\.\d+$/.test(profile.version || "")) errors.push("invalid version");
  if (!["user", "project"].includes(profile.scope)) errors.push("invalid scope");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.confirmedAt || "")) errors.push("invalid confirmedAt");
  if (!profile.preferences || typeof profile.preferences !== "object" || Array.isArray(profile.preferences)) errors.push("preferences must be an object");
  else {
    for (const key of Object.keys(profile.preferences)) if (!allowedPreferences.has(key)) errors.push(`unknown preference: ${key}`);
    if (profile.preferences.decisionBatchSize != null && (!Number.isInteger(profile.preferences.decisionBatchSize) || profile.preferences.decisionBatchSize < 1 || profile.preferences.decisionBatchSize > 4)) errors.push("decisionBatchSize must be 1-4");
    if (profile.preferences.frontendCritiqueDirectness != null && !["measured", "blunt", "relic"].includes(profile.preferences.frontendCritiqueDirectness)) errors.push("frontendCritiqueDirectness is invalid");
    if (profile.preferences.motionPreference != null && !["reduced", "purposeful", "expressive", "adaptive"].includes(profile.preferences.motionPreference)) errors.push("motionPreference is invalid");
    if (profile.preferences.designPriorities != null) {
      const priorities = profile.preferences.designPriorities;
      if (!Array.isArray(priorities) || priorities.length > 8 || new Set(priorities).size !== priorities.length || priorities.some((item) => typeof item !== "string" || item.length < 1 || item.length > 48)) errors.push("designPriorities must contain at most 8 unique short strings");
    }
  }
  if (!Array.isArray(profile.sources) || profile.sources.length > 12) errors.push("sources must be an array of at most 12 records");
  const serialized = JSON.stringify(profile);
  if (sensitive.test(serialized)) errors.push("profile contains a forbidden sensitive field or content class");
  if (/[A-Z]:\\Users\\[^\\\s]+\\/i.test(serialized)) errors.push("profile contains a private absolute path");
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node validate-soul-profile.mjs <profile.json>"); process.exit(2); }
  const errors = validateSoulProfile(JSON.parse(fs.readFileSync(file, "utf8")));
  if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
  console.log(`Soul profile valid: ${file}`);
}
