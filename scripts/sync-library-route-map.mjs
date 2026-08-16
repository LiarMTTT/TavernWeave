#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "skills", "consult-tavernweave-library", "references", "route-map.json");
const target = path.join(root, "docs", "newbie-guide", "tavernweave-route-map.json");
JSON.parse(fs.readFileSync(source, "utf8"));
fs.copyFileSync(source, target);
console.log(path.relative(root, target).replaceAll(path.sep, "/"));
