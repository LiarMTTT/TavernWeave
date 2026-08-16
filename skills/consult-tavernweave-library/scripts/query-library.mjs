#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const references = path.join(here, "..", "references");
const routeMap = JSON.parse(fs.readFileSync(path.join(references, "route-map.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(references, "library-manifest.json"), "utf8"));

export function queryLibrary({ skill = "", intent = "", write = false, includeExperimental = false } = {}) {
  const normalized = `${skill} ${intent}`.toLowerCase();
  let routes = routeMap.routes.filter((route) => route.id === skill);
  if (!routes.length) routes = routeMap.routes.filter((route) => route.terms.some((term) => normalized.includes(term.toLowerCase())));
  const guideIds = new Set();
  const domains = new Set();
  if (write) guideIds.add(routeMap.standingGuide);
  for (const route of routes) {
    for (const id of route.guides || []) guideIds.add(id);
    if (includeExperimental) for (const id of route.experimentalGuides || []) guideIds.add(id);
    for (const domain of route.domains || []) domains.add(domain);
  }
  const byId = new Map(manifest.documents.map((record) => [record.id, record]));
  const documents = [...guideIds].map((id) => byId.get(id)).filter(Boolean);
  return {
    schemaVersion: 1,
    snapshotVersion: manifest.snapshotVersion,
    routeIds: routes.map((route) => route.id),
    standing: write ? [routeMap.standingGuide] : [],
    documents: documents.map(({ id, path: documentPath, status }) => ({ id, path: documentPath, status })),
    domains: [...domains],
    experimentalIncluded: includeExperimental,
    selectionState: "proposed",
    unresolved: routes.length ? [] : ["no matching route; choose a primary TavernWeave skill"],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] || "" : ""; };
  const result = queryLibrary({
    skill: value("--skill"),
    intent: value("--intent"),
    write: args.includes("--write"),
    includeExperimental: args.includes("--include-experimental"),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
