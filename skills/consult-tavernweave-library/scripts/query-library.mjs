#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, "..");
const references = path.join(skillRoot, "references");
const routeMap = JSON.parse(fs.readFileSync(path.join(references, "route-map.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(references, "library-manifest.json"), "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.join(skillRoot, "assets", "picker", "catalog.json"), "utf8"));

function normalizeTerms(query, items) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const terms = new Set(normalized.split(/[\s,，、/|]+/u).filter((value) => value.length > 1));
  for (const item of items) {
    for (const value of [item.name, item.routeLabel, ...(item.tags || [])].filter(Boolean)) {
      const candidate = String(value).toLowerCase();
      if (candidate.length > 1 && normalized.includes(candidate)) terms.add(candidate);
    }
  }
  if (!terms.size) terms.add(normalized);
  return [...terms];
}

export function searchCatalog({ query = "", domains = [], limit = 6 } = {}) {
  const selectedDomains = domains.length ? domains : ["design", "motion", "wiki", "ledger"];
  const pool = selectedDomains.flatMap((domain) => (catalog.catalogs[domain]?.items || []).map((item) => ({ ...item, domain })));
  const terms = normalizeTerms(query, pool);
  if (!terms.length || limit <= 0) return [];
  return pool.map((item) => {
    const name = String(item.name || "").toLowerCase();
    const tags = (item.tags || []).map((value) => String(value).toLowerCase());
    const route = `${item.route || ""} ${item.routeLabel || ""}`.toLowerCase();
    const note = String(item.note || "").toLowerCase();
    const source = `${item.url || ""} ${item.wiki || ""}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (name.includes(term)) score += 12;
      if (tags.some((tag) => tag === term)) score += 10;
      else if (tags.some((tag) => tag.includes(term))) score += 6;
      if (route.includes(term)) score += 5;
      if (note.includes(term)) score += 3;
      if (source.includes(term)) score += 1;
    }
    return { item, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "zh-CN"))
    .slice(0, Math.min(Math.max(Number(limit) || 6, 1), 30))
    .map(({ item, score }) => ({
      id: `${item.domain}:${item.id}`,
      domain: item.domain,
      name: item.name,
      grade: item.grade,
      tags: item.tags || [],
      route: item.route || "",
      wiki: item.wiki || "",
      url: item.url || "",
      preview: item.preview || "",
      score,
      state: "proposed",
    }));
}

export function queryLibrary({ skill = "", intent = "", write = false, includeExperimental = false, domains: requestedDomains = [], catalogLimit = 6 } = {}) {
  const normalized = `${skill} ${intent}`.toLowerCase();
  let routes = routeMap.routes.filter((route) => route.id === skill);
  if (!routes.length) routes = routeMap.routes.filter((route) => route.terms.some((term) => normalized.includes(term.toLowerCase())));
  const guideIds = new Set();
  const routedDomains = new Set();
  if (write) guideIds.add(routeMap.standingGuide);
  for (const route of routes) {
    for (const id of route.guides || []) guideIds.add(id);
    if (includeExperimental) for (const id of route.experimentalGuides || []) guideIds.add(id);
    for (const domain of route.domains || []) routedDomains.add(domain);
  }
  const byId = new Map(manifest.documents.map((record) => [record.id, record]));
  const documents = [...guideIds].map((id) => byId.get(id)).filter(Boolean);
  const catalogDomains = (requestedDomains.length
    ? requestedDomains.filter((domain) => !routedDomains.size || routedDomains.has(domain))
    : [...routedDomains]).filter((domain) => catalog.catalogs[domain]);
  return {
    schemaVersion: 2,
    snapshotVersion: manifest.snapshotVersion,
    routeIds: routes.map((route) => route.id),
    standing: write ? [routeMap.standingGuide] : [],
    documents: documents.map(({ id, path: documentPath, status }) => ({ id, path: documentPath, status })),
    domains: catalogDomains,
    catalogSummary: Object.fromEntries(Object.entries(catalog.catalogs).map(([domain, value]) => [domain, value.items.length])),
    candidates: searchCatalog({ query: intent, domains: catalogDomains, limit: catalogLimit }),
    experimentalIncluded: includeExperimental,
    selectionState: "proposed",
    unresolved: routes.length || requestedDomains.length ? [] : ["no matching route; choose a primary TavernWeave skill"],
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
    domains: value("--domain").split(",").map((item) => item.trim()).filter(Boolean),
    catalogLimit: Number(value("--limit") || 6),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
