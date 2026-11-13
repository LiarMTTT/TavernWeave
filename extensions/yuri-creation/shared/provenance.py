"""Original MIT bridge to the pinned external TavernWeave work library.

No upstream implementation is copied. Source freezing, quote validation,
record rendering, indexing, locking and transactions execute upstream.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlparse
import profiles

ROOT = Path(__file__).resolve().parents[1]
LIBRARY_PATH = "skills/build-work-library/scripts/work_library.py"
RUNTIME = ("name", "description", "personality", "scenario", "first_mes", "mes_example",
           "alternate_greetings", "system_prompt", "post_history_instructions", "character_book")


def require(value, message):
    if not value:
        raise ValueError(message)


def read(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, "Duplicate JSON key: " + key)
            result[key] = value
        return result
    return json.loads(Path(path).read_text(encoding="utf-8-sig"), object_pairs_hook=unique,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError("Invalid number: " + x)))


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_new(path, value):
    with Path(path).open("x", encoding="utf-8") as stream:
        stream.write(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n")


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def dependencies(tavern_root=None):
    repo = Path(tavern_root).resolve() if tavern_root else ROOT.parents[1]
    pin = read(ROOT / "UPSTREAM.json")["source_library"]
    path = repo / LIBRARY_PATH
    require(path.is_file(), "Pinned TavernWeave source library is unavailable")
    raw = path.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    require(blob == pin["git_blob"], "Source library differs from its declared pin")
    creator = load_module("yuri_creator_bridge", ROOT / "skills/yuri-card-creator/scripts/create_card.py")
    return repo, load_module("tw_source_bridge", path), creator


def register(input_path, project, title="Supplied post", url=None, tavern_root=None, *, source_kind="post", origin=None, profile_path=None):
    repo, tw, creator = dependencies(tavern_root)
    project, input_path = Path(project).resolve(), Path(input_path)
    require(source_kind in ("post", "novel"), "Unsupported source kind")
    preferences = creator.profile(profile_path)
    require(not project.exists(), "Project target exists; use a fresh directory")
    require(not project.is_relative_to(repo), "Private source projects must be outside the repository")
    require(input_path.suffix.lower() in (".txt", ".md"), "This route accepts a supplied UTF-8 TXT/Markdown post")
    raw = input_path.read_bytes()
    text = raw.decode("utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    require(text.strip(), "Empty post")
    project.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".yuri-post-", dir=project.parent) as temp:
        stage = Path(temp) / "project"
        stage.mkdir()
        library = stage / "library"
        tw.init(library, title)
        sid = "post-001" if source_kind == "post" else "novel-001"
        descriptor = {"id": sid, "kind": "local-text",
                      "title": title, "realm": "reference", "continuity": "supplied-" + source_kind,
                      "edition": "submitted", "provenance": "User-supplied text snapshot; not independently verified",
                      "rights": "User-supplied for this task; redistribution not inferred", "phase": None}
        if source_kind == "novel":
            require(isinstance(origin, dict) and origin.get("selected_chapters") and origin.get("source_sha256"), "Novel registration requires an explicit source selection")
            descriptor["origin"] = origin
        if url:
            parsed = urlparse(url)
            require(parsed.scheme in ("http", "https") and parsed.hostname and not parsed.username and not parsed.password, "Origin URL must be public HTTP(S) without credentials")
            descriptor.update(origin_url=url, retrieval_status="Supplied snapshot; this command did not retrieve the page")
        tw.add_source(library, descriptor, input_path)
        src = tw.source(library, sid)
        require(src["_text"] == text, "Source changed during registration")
        write_new(stage / "source.json", {"schema": "yuri/source-project/v1", "kind": source_kind,
                  "source_id": sid, "original_sha256": origin["source_sha256"] if origin else sha(raw),
                  "text_sha256": src["text_sha256"], "descriptor_sha256": src["_descriptor_sha256"],
                  "coverage": "entire supplied post; no claim about omitted comments or original webpage" if source_kind == "post" else "only explicitly selected novel chapters; no claim about unread chapters",
                  "library_blob": read(ROOT / "UPSTREAM.json")["source_library"]["git_blob"]})
        write_new(stage / "preferences.json", preferences)
        os.rename(stage, project)
    return {"project": str(project), "source_units": len(src["units"]), "mode": "source_yuri"}


def context(project, tavern_root=None):
    _, tw, creator = dependencies(tavern_root)
    require(not Path(project).is_symlink(), "Linked project roots are unsupported")
    project = Path(project).resolve()
    meta = read(project / "source.json")
    require(meta.get("schema") == "yuri/source-project/v1" and meta.get("kind") in ("post", "novel"), "Unsupported source project")
    library = project / "library"
    require(not project.is_symlink() and not library.is_symlink(), "Linked project roots are unsupported")
    sources = tw.catalog(library)
    require(len(sources) == 1 and sources[0]["id"] == meta["source_id"], "Source set changed")
    src = sources[0]
    require(src["text_sha256"] == meta["text_sha256"] and src["_descriptor_sha256"] == meta["descriptor_sha256"], "Frozen source binding changed")
    require(meta["library_blob"] == read(ROOT / "UPSTREAM.json")["source_library"]["git_blob"], "Source project dependency pin changed")
    creator.profile(project / "preferences.json")
    return project, library, tw, creator, src


def units(project, unit_id=None, tavern_root=None):
    _, _, _, _, src = context(project, tavern_root)
    result = {"source_id": src["id"], "source_sha256": src["_descriptor_sha256"],
              "text_sha256": src["text_sha256"], "units": src["units"]}
    if unit_id:
        unit = next((u for u in src["units"] if u["id"] == unit_id), None)
        require(unit is not None, "Unknown unit")
        result["text"] = src["_text"][unit["start"]:unit["end"]]
    return result


def evidence(project, quote, start=None, tavern_root=None):
    _, _, _, _, src = context(project, tavern_root)
    text = src["_text"]
    require(isinstance(quote, str) and quote, "Nonempty quote required")
    if start is None:
        require(text.count(quote) == 1, "Quote must be unique or have an explicit start offset")
        start = text.index(quote)
    require(type(start) is int and start >= 0 and text[start:start + len(quote)] == quote, "Quote/start differs from frozen text")
    stop = start + len(quote)
    segments = []
    for u in src["units"]:
        a, b = max(start, u["start"]), min(stop, u["end"])
        if a < b:
            segments.append({"unit_id": src["id"] + "/" + u["id"],
                             "source_sha256": src["_descriptor_sha256"], "start": a, "quote": text[a:b]})
    require("".join(x["quote"] for x in segments) == quote, "Quote coverage differs")
    return segments


def fact_hash(records):
    return sha(canonical([{k: v for k, v in r.items() if k not in ("source_path", "markdown_sha256", "base_sha256")}
                          for r in sorted(records, key=lambda r: r["id"])]))


def claim_record(library, tw, row):
    """Keep claim links in upstream records; derive the dossier's searchable view.

    Quote validity is delegated to upstream. Entailment and atomicity still need
    prose review; this check cannot decide whether a quotation supports a claim.
    """
    require(isinstance(row, dict), "Source record must be an object")
    claims = row.get("claims")
    require(isinstance(claims, list) and claims, "Every source record needs individually cited claims")
    identifiers, texts, citations = set(), [], []
    for claim in claims:
        require(isinstance(claim, dict), "Claim must be an object")
        cid, text = claim.get("id"), claim.get("text")
        require(isinstance(cid, str) and re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,95}", cid)
                and cid not in identifiers, "Unique local claim IDs required")
        require(isinstance(text, str) and text.strip() == text and text, "Nonempty trimmed claim text required")
        identifiers.add(cid); texts.append(text)
        # Validate each claim's own evidence, never just a pooled dossier quote.
        tw.validate_record(library, dict(row, body=text, evidence=claim.get("evidence")))
        for ev in claim["evidence"]:
            if ev not in citations:
                citations.append(ev)
    body = "\n".join(texts)
    require("body" not in row or row["body"] == body, "Record body must be derived from cited claims; move invented details to adaptation decisions")
    require("evidence" not in row or row["evidence"] == citations, "Record evidence must be derived from claim citations")
    return dict(row, body=body, evidence=citations)


def promote(project, candidate_path, tavern_root=None):
    project, library, tw, _, src = context(project, tavern_root)
    candidate = read(candidate_path)
    require(candidate.get("schema") == "yuri/extraction/v2", "New extractions require yuri/extraction/v2 with individually cited claims; existing promoted v1 projects remain readable")
    require(candidate.get("source_sha256") == src["_descriptor_sha256"], "Extraction source binding differs")
    review = candidate.get("review", {})
    require(review.get("completed") is True and review.get("notes"), "Agent extraction review required")
    selected = candidate.get("reviewed_unit_ids", [])
    require(len(selected) == len(set(selected)) and set(selected) == {u["id"] for u in src["units"]}, "Review all registered units using local IDs such as u000001, not source-qualified IDs")
    rows = candidate.get("records", [])
    require(isinstance(rows, list) and rows, "Nonempty source records required")
    rows = [claim_record(library, tw, row) for row in rows]
    require(len({r["id"] for r in rows}) == len(rows), "Unique source records required")
    for row in rows:
        tw.validate_record(library, row)
        if row["kind"] == "character":
            role = row.get("yuri", {})
            require(role.get("role") in ("main", "player", "background"), "Record character scope")
            require(role.get("source_gender") in ("woman", "man", "unknown"), "Record source gender without inference")
            require(role.get("age_status") in ("adult", "minor", "unknown"), "Record source age status")
    player_count = sum(r["kind"] == "character" and r["yuri"]["role"] == "player" for r in rows)
    is_novel = read(project / "source.json")["kind"] == "novel"
    require(player_count <= 1 if is_novel else player_count == 1, "Bind at most one source player; a post requires exactly one poster")
    with tw.locked(library):
        require(not tw.records(library) and not (library / ".state/yuri-extraction.json").exists(), "Extraction already promoted; preserve existing records")
        overlay = {"records/" + r["id"] + ".md": tw.render(r) for r in rows}
        promoted, writes = tw.reindex_writes(library, overlay)
        for path, text in overlay.items():
            writes[path] = (text, None)
        receipt = {"schema": "yuri/extraction-receipt/v2", "extraction_schema": candidate["schema"],
                   "source_sha256": src["_descriptor_sha256"],
                   "candidate_sha256": sha(Path(candidate_path).read_bytes()), "records_sha256": fact_hash(promoted),
                   "reviewed_unit_ids": selected, "review": review,
                   "claim_count": sum(len(r["claims"]) for r in rows),
                   "limitation": "Individual claim quotes and review acknowledgments do not prove entailment, atomicity or semantic extraction completeness"}
        writes[".state/yuri-extraction.json"] = (tw.dump(receipt), None)
        tw.transaction(library, writes, "yuri-selected-source-extraction")
    return {"records": len(promoted), "records_sha256": receipt["records_sha256"]}


def reviewed(project, tavern_root=None):
    project, library, tw, creator, src = context(project, tavern_root)
    receipt = read(library / ".state/yuri-extraction.json")
    rows = tw.records(library)
    require(receipt["source_sha256"] == src["_descriptor_sha256"] and receipt["records_sha256"] == fact_hash(rows), "Source facts changed after extraction review")
    return project, tw, creator, src, rows, receipt


def bindings(project, draft, tavern_root=None):
    project, _, _, src, rows, _ = reviewed(project, tavern_root)
    return {"project_sha256": sha((project / "source.json").read_bytes()),
            "source_sha256": src["_descriptor_sha256"], "records_sha256": fact_hash(rows),
            "draft_sha256": sha(Path(draft).read_bytes()),
            "profile_sha256": sha((project / "preferences.json").read_bytes())}


def prepare(project, draft, output, tavern_root=None):
    value = {"schema": "yuri/adaptation/v1", "mode": "source_yuri", "bindings": bindings(project, draft, tavern_root),
             "targets": [], "player_binding": {"record_id": "", "runtime_aliases": []}, "decisions": [],
             "field_sources": [], "agent_review": {"completed": False, "notes": []}}
    if not profiles.is_default(profiles.load(Path(project) / "preferences.json")):
        value["policy_review"] = profiles.review_template(Path(project) / "preferences.json")
    write_new(output, value)
    return {"plan": str(output), "next": "Agent records genre choices, causal decisions and field provenance"}


def strings(value, pointer):
    if isinstance(value, str) and value.strip():
        yield pointer, value
    elif isinstance(value, dict):
        for k, v in value.items():
            yield from strings(v, pointer + "/" + str(k).replace("~", "~0").replace("/", "~1"))
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from strings(v, pointer + "/" + str(i))


def build(project, draft, plan_path, output, tavern_root=None):
    output = Path(output)
    require(not output.exists(), "Output exists; use a new result directory")
    _, _, creator, _, rows, receipt = reviewed(project, tavern_root)
    plan = read(plan_path)
    require(plan.get("schema") == "yuri/adaptation/v1" and plan.get("mode") == "source_yuri", "Use the source-yuri plan, not original mode")
    require(plan.get("bindings") == bindings(project, draft, tavern_root), "Stale source/draft/profile bindings")
    review = plan.get("agent_review", {})
    require(review.get("completed") is True and review.get("notes"), "Review actual adapted prose first")
    records = {r["id"]: r for r in rows}
    preferences = creator.profile(Path(project) / "preferences.json")
    profiles.review(preferences, plan, Path(project) / "preferences.json")
    cast = [dict(id=r["id"], **r["yuri"]) for r in rows if r["kind"] == "character"]
    targets = plan.get("targets", [])
    profiles.validate_targets(preferences, targets, cast)
    player = plan.get("player_binding", {})
    player_record = records.get(player.get("record_id"), {})
    invented_player = player.get("mode") == "invented"
    if invented_player:
        require(read(Path(project) / "source.json")["kind"] == "novel" and not player.get("record_id")
                and not any(r.get("yuri", {}).get("role") == "player" for r in rows)
                and player.get("result_woman") is True and player.get("result_adult") is True
                and player.get("reason", "").strip(), "An invented adult female player is a novel-only creative choice, not a source fact")
    else:
        require(player_record.get("yuri", {}).get("role") == "player", "Source player binding must identify the source player")
    decisions = plan.get("decisions", [])
    require(decisions and len({d["id"] for d in decisions}) == len(decisions), "Unique adaptation decisions required")
    decision_ids = {d["id"] for d in decisions}
    profiles.relationships(preferences, decisions, {c["id"] for c in cast})
    for d in decisions:
        require(d.get("kind") in ("identity", "relationship", "setting", "invention", "preserved") and d.get("summary", "").strip(), "Describe each adaptation decision")
        require(set(d.get("record_ids", [])) <= records.keys(), "Decision cites unknown facts")
        if d["kind"] == "relationship":
            causes = d.get("causal_record_ids", [])
            require(causes and set(causes) <= records.keys() and d.get("changed_circumstance", "").strip(), "Relationship changes need source anchors and a specific changed circumstance")
    if invented_player:
        require(any(d["id"] == player.get("decision_id") and d["kind"] == "invention" for d in decisions), "Link the invented player to an explicit invention decision")
        profiles.identity(preferences, player)
    card, _ = creator.serializer().build_v2(Path(draft))
    front, _ = creator.serializer().parse_front(Path(draft).read_text(encoding="utf-8"))
    if not front.get("creator"):
        card["data"]["creator"] = "Yuri Card Workbench contributors"
    require(front.get("name") and "{{user}}" in card["data"]["first_mes"], "Named NPC card and playable {{user}} opening required")
    require(card["data"]["name"] != "{{user}}", "Card name must identify the NPC")
    book = card["data"].get("character_book", {})
    require(book.get("entries") and all(e.get("content", "").strip() for e in book["entries"]), "Usable worldbook required")
    runtime = list(strings({k: card["data"][k] for k in RUNTIME if k in card["data"] and k != "character_book"}, "/data"))
    for i, entry in enumerate(book["entries"]):
        runtime.extend(strings({k: entry[k] for k in ("content", "comment", "keys", "secondary_keys") if k in entry}, f"/data/character_book/entries/{i}"))
    text = "\n".join(v for _, v in runtime)
    require(not re.search(r"(?<!\{)\{user\}(?!\})", text), "Use exact {{user}} macros")
    require(any("{{user}}" in e["content"] for e in book["entries"]), "Worldbook must keep player binding consistent")
    aliases = player.get("runtime_aliases", [])
    require(isinstance(aliases, list) and all(isinstance(a, str) and len(a.strip()) >= 2 for a in aliases), "Player aliases must be specific names/labels, not pronouns")
    for alias in ["发帖者", "poster", "narrator", *aliases]:
        pattern = r"\b" + re.escape(alias) + r"\b" if alias.isascii() else re.escape(alias)
        require(not re.search(pattern, text, re.I), "Unresolved player label in runtime: " + alias)
    mapping = plan.get("field_sources", [])
    require(mapping and len({m["pointer"] for m in mapping}) == len(mapping), "Unique field provenance required")
    allowed = {p for p, _ in runtime} | {"/data/" + k for k in RUNTIME if k != "character_book"}
    allowed.update(f"/data/character_book/entries/{i}" for i in range(len(book["entries"])))
    used = set()
    for m in mapping:
        require(m["pointer"] in allowed, "Map individual fields or entries, not a blanket card/book pointer")
        require(any(p == m["pointer"] or p.startswith(m["pointer"] + "/") for p, _ in runtime), "Provenance points outside populated runtime")
        require(set(m.get("record_ids", [])) <= records.keys() and set(m.get("decision_ids", [])) <= decision_ids, "Unknown field provenance reference")
        require(m.get("record_ids") or m.get("decision_ids"), "Field needs facts or a declared creative decision")
        used.update(m.get("decision_ids", []))
    require(all(any(p == m["pointer"] or p.startswith(m["pointer"] + "/") for m in mapping) for p, _ in runtime), "Unmapped runtime field")
    require(used == decision_ids, "Each adaptation decision needs an output field")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".yuri-source-", dir=output.parent) as temp:
        stage = Path(temp) / "result"; stage.mkdir()
        write_new(stage / "yuri-card.v2.json", card)
        write_new(stage / "worldbook.json", book)
        write_new(stage / "adaptation-record.json", {"schema": "yuri/adaptation-record/v1", "mode": "source_yuri",
                  "bindings": plan["bindings"], "plan": plan, "extraction_review": receipt,
                  "preferences": preferences,
                  "card_sha256": sha((stage / "yuri-card.v2.json").read_bytes()),
                  "source_library_blob": read(ROOT / "UPSTREAM.json")["source_library"]["git_blob"],
                  "semantic_quality": "agent_review_not_automatically_proven", "host_import": "not_run", "live_roleplay": "not_run"})
        os.rename(stage, output)
    return {"output": str(output), "mode": "source_yuri", "host_import": "not_run"}
