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
  // Work-source research owns these specific wishes; generic database/catalog terms
  // must not pull in MVU or the bundled UI design catalog for a novel/fanwork task.
  if (!skill && routes.some((route) => route.id === "build-work-library")) routes = routes.filter((route) => route.id === "build-work-library");
  // A worldbook-only request can mention its containing card without asking for
  // a whole-card workflow. Keep the builder for an explicit whole-card outcome.
  const nonWorldbookTask = /非世界书(?:用途|任务|项目)|(?:不要|不做|不用|无需|不需要)(?:做成|制作|生成)?世界书(?:[，。、；\s]|$)/u.test(intent);
  if (!skill && nonWorldbookTask) routes = routes.filter((route) => route.id !== "worldbook-design-and-writing");
  const hasWorldbook = routes.some((route) => route.id === "worldbook-design-and-writing");
  const wholeCardOutcome = /整卡|制卡|(?:制作|新建|设计|规划|打包|导出).{0,12}(?:一张|整张)?(?:角色卡|酒馆卡|纯文字卡|MVU(?:\s*Zod)?\s*卡|hybrid\s*卡|rolecard|text\s*card)|(?:角色卡|酒馆卡|纯文字卡|MVU(?:\s*Zod)?\s*卡|hybrid\s*卡|rolecard|text\s*card).{0,8}(?:整体|完整交付|打包|导出)/iu.test(intent);
  if (!skill && hasWorldbook && !wholeCardOutcome) routes = routes.filter((route) => route.id !== "tavern-card-builder");
  const generalPromptSpec = /提示(?:词)?规格|提示词反推|样例反推|样例归纳|提示词模板/u.test(intent);
  const cardContext = /角色卡|酒馆卡|纯文字卡|hybrid\s*卡|rolecard|text\s*card|世界书|worldbook|lorebook|MVU|开场白|卡内|制卡/iu.test(intent);
  if (!skill && generalPromptSpec && !cardContext) routes = routes.filter((route) => route.id !== "tavern-card-builder");
  const sandboxWish = /前端沙盒|联合模拟|状态对照|滑条调试|封装前打磨/u.test(intent);
  const realHostFailure = /(?:真实酒馆|真实宿主|实机|sillytavern).*(?:故障|报错|不更新|白屏|验收)/iu.test(intent);
  if (!skill && sandboxWish && !realHostFailure && !routes.some((route) => route.id === "build-work-library")) routes = routes.filter((route) => route.id === "sillytavern-embedded-ui");
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
    candidates: routes.some((route) => route.id === "build-work-library") || (routes.length > 0 && !catalogDomains.length) ? [] : searchCatalog({ query: intent, domains: catalogDomains, limit: catalogLimit }),
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
