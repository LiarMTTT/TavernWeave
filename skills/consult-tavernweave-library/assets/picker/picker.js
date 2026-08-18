(() => {
  "use strict";
  const catalog = window.TW_LIBRARY_CATALOG;
  const manifest = window.TW_LIBRARY_MANIFEST;
  if (!catalog || !manifest) {
    document.body.textContent = "TavernWeave Library 数据未载入。请重新生成公开快照。";
    return;
  }

  const storageKey = "tavernweave-library-proposed-ids-v1";
  const tabs = [
    ["guides", "ST 指南"], ["design", "设计"], ["motion", "动效"],
    ["wiki", "概念"], ["ledger", "蒸馏账本"], ["sources", "外部源站"], ["selected", "已选"],
  ];
  const state = { tab: location.hash.slice(1) || "guides", query: "", filter: "", current: "" };
  if (!tabs.some(([id]) => id === state.tab)) state.tab = "guides";
  let selected;
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    selected = new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string" && id.length < 160) : []);
  } catch { selected = new Set(); }

  const el = (selector) => document.querySelector(selector);
  const tabBox = el("[data-tabs]");
  const filterBox = el("[data-filters]");
  const grid = el("[data-grid]");
  const inspector = el("[data-inspector]");
  const search = el("[data-search]");
  const count = el("[data-count]");
  el("[data-snapshot]").textContent = manifest.snapshotVersion;
  const expected = manifest.expectedCounts || {};
  el("[data-library-summary]").textContent = `${expected.designItems || 0} 设计 · ${expected.motionItems || 0} 动效 · ${expected.conceptItems || 0} 概念 · ${expected.ledgerItems || 0} 账本条 · ${manifest.screening?.routeCount || 0}/${expected.screenedRoutes || 0} 路筛选`;

  const guideItems = manifest.documents.filter((item) => item.type === "st-guide").map((item) => ({
    id: `guide:${item.id}`, domain: "guides", name: item.path.split("/").pop().replace(/\.md$/, ""),
    grade: item.status, tags: [item.standing ? "常驻" : item.status === "experimental" ? "待验证" : "正式"],
    note: item.standing ? "写入型任务的常驻驾驭检查。" : item.status === "experimental" ? "实验路线；只在显式评估时读取。" : "ST 开发指南公开快照。",
    local: `../../${item.path.replace(/^references\//, "references/")}`,
  }));
  const normalizeCatalog = (domain) => catalog.catalogs[domain].items.map((item) => ({ ...item, id: `${domain}:${item.id}`, domain }));
  const designItems = normalizeCatalog("design");
  const motionItems = normalizeCatalog("motion");
  const wikiItems = normalizeCatalog("wiki");
  const ledgerItems = normalizeCatalog("ledger");
  const sourceMap = new Map();
  for (const item of [...designItems, ...motionItems, ...wikiItems, ...ledgerItems]) {
    if (item.url && !sourceMap.has(item.url)) sourceMap.set(item.url, { ...item, id: `source:${item.id}`, domain: "sources", sourceKey: item.id });
  }
  const sourceItems = [...sourceMap.values()];
  const all = [...guideItems, ...designItems, ...motionItems, ...wikiItems, ...ledgerItems, ...sourceItems];

  function currentPool() {
    const pool = state.tab === "selected" ? all.filter((item) => selected.has(selectionKey(item))) : all.filter((item) => item.domain === state.tab);
    const q = state.query.trim().toLowerCase();
    return pool.filter((item) => {
      if (state.filter && !(item.tags || []).includes(state.filter) && item.grade !== state.filter) return false;
      return !q || [item.name, item.note, item.grade, item.url, item.wiki, item.route, item.routeLabel, ...(item.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }
  function selectionKey(item) { return item.domain === "sources" ? item.sourceKey : item.id; }
  function saveSelection() { localStorage.setItem(storageKey, JSON.stringify([...selected].sort())); paintSelection(); }
  function selectionPayload() {
    return { schemaVersion: 1, kind: "tavernweave-library-selection", state: "proposed", snapshotVersion: manifest.snapshotVersion, items: [...selected].sort() };
  }
  function button(label, attrs = {}) {
    const node = document.createElement("button"); node.type = "button"; node.textContent = label;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function paintTabs() {
    tabBox.replaceChildren();
    tabs.forEach(([id, label]) => {
      const node = button(label, { role: "tab", "aria-selected": String(state.tab === id) });
      node.addEventListener("click", () => { state.tab = id; state.filter = ""; location.hash = id; render(); });
      tabBox.appendChild(node);
    });
  }
  function paintFilters(pool) {
    const values = [...new Set(pool.flatMap((item) => [item.grade, ...(item.tags || [])]).filter(Boolean))].slice(0, 30);
    filterBox.replaceChildren();
    const allButton = button("全部", { "aria-pressed": String(!state.filter) });
    allButton.addEventListener("click", () => { state.filter = ""; paintGrid(); });
    filterBox.appendChild(allButton);
    values.forEach((value) => {
      const node = button(value, { "aria-pressed": String(state.filter === value) });
      node.addEventListener("click", () => { state.filter = state.filter === value ? "" : value; paintGrid(); });
      filterBox.appendChild(node);
    });
  }
  function card(item) {
    const node = button(""); node.className = "card"; node.dataset.id = item.id; node.setAttribute("aria-current", String(state.current === item.id));
    const top = document.createElement("div"); top.className = "card-top";
    const domain = document.createElement("span"); domain.className = "domain"; domain.textContent = item.domain;
    const grade = document.createElement("span"); grade.className = "state"; grade.textContent = item.grade || "参考";
    top.append(domain, grade);
    const title = document.createElement("h2"); title.textContent = item.name;
    const note = document.createElement("p"); note.textContent = item.note || "查看来源与边界。";
    const tags = document.createElement("div"); tags.className = "tags";
    (item.tags || []).slice(0, 4).forEach((value) => { const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = value; tags.appendChild(tag); });
    node.append(top, title, note, tags);
    node.addEventListener("click", () => { state.current = item.id; paintGrid(); paintInspector(item); });
    return node;
  }
  function paintGrid() {
    const base = state.tab === "selected" ? all.filter((item) => selected.has(selectionKey(item))) : all.filter((item) => item.domain === state.tab);
    paintFilters(base);
    const items = currentPool(); grid.replaceChildren();
    if (!items.length) { const empty = document.createElement("p"); empty.className = "empty"; empty.textContent = "没有匹配资料。候选可能还没加入，或筛选过窄。"; grid.appendChild(empty); }
    else items.forEach((item) => grid.appendChild(card(item)));
    count.textContent = `${items.length} / ${base.length} 条 · 当前选择 ${selected.size} 条候选`;
  }
  function addMeta(list, label, value) {
    if (!value) return; const dt = document.createElement("dt"); dt.textContent = label; const dd = document.createElement("dd"); dd.textContent = value; list.append(dt, dd);
  }
  function paintInspector(item) {
    inspector.replaceChildren(); const body = document.createElement("div"); body.className = "inspector-body";
    const domain = document.createElement("p"); domain.className = "domain"; domain.textContent = item.domain;
    const title = document.createElement("h2"); title.textContent = item.name;
    const note = document.createElement("p"); note.className = "inspector-note"; note.textContent = item.note || "无附加说明。";
    const meta = document.createElement("dl"); meta.className = "meta-list";
    addMeta(meta, "级别", item.grade); addMeta(meta, "标签", (item.tags || []).join(" · ")); addMeta(meta, "分路", [item.route, item.routeLabel].filter(Boolean).join(" · ")); addMeta(meta, "来源", item.url || item.local || item.wiki); addMeta(meta, "状态", "proposed / 未采用");
    const boundary = document.createElement("p"); boundary.className = "boundary"; boundary.textContent = "候选条目不等于已采用设计、已安装依赖、已通过许可复核或已完成真实 SillyTavern 验收。";
    const actions = document.createElement("div"); actions.className = "actions";
    const key = selectionKey(item); const pick = button(selected.has(key) ? "移出候选" : "加入候选", { class: "action primary" });
    pick.addEventListener("click", () => { selected.has(key) ? selected.delete(key) : selected.add(key); saveSelection(); paintGrid(); paintInspector(item); }); actions.appendChild(pick);
    const localPath = item.local || (item.wiki ? `../../${item.wiki}` : "");
    if (localPath) { const link = document.createElement("a"); link.className = "action"; link.href = localPath; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = "打开本地正文"; actions.appendChild(link); }
    if (item.url) { const link = document.createElement("a"); link.className = "action"; link.href = item.url; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = "打开来源站"; actions.appendChild(link); }
    body.append(domain, title, note, meta, boundary, actions);
    if (item.preview) { const frame = document.createElement("iframe"); frame.className = "preview"; frame.title = `${item.name} 本地沙盘`; frame.loading = "lazy"; frame.referrerPolicy = "no-referrer"; frame.src = `previews/${item.preview}`; body.appendChild(frame); }
    inspector.appendChild(body);
  }
  function paintSelection() { el("[data-selection-summary]").textContent = selected.size ? `已选择 ${selected.size} 条；状态仍为 proposed。` : "尚未选择资料"; }
  function render() { paintTabs(); paintGrid(); paintSelection(); }

  search.addEventListener("input", () => { state.query = search.value; paintGrid(); });
  document.addEventListener("keydown", (event) => { if (event.key === "/" && document.activeElement !== search) { event.preventDefault(); search.focus(); } });
  el("[data-clear]").addEventListener("click", () => { selected.clear(); saveSelection(); if (state.tab === "selected") paintGrid(); });
  el("[data-copy]").addEventListener("click", async () => {
    const text = JSON.stringify(selectionPayload(), null, 2);
    try { await navigator.clipboard.writeText(text); el("[data-copy]").textContent = "已复制"; }
    catch { window.prompt("复制选择单", text); }
  });
  el("[data-download]").addEventListener("click", () => {
    const blob = new Blob([`${JSON.stringify(selectionPayload(), null, 2)}\n`], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = ".tw-library-selection.json"; link.click(); URL.revokeObjectURL(link.href);
  });
  window.addEventListener("hashchange", () => { const next = location.hash.slice(1); if (tabs.some(([id]) => id === next)) { state.tab = next; state.filter = ""; render(); } });
  render();
})();
