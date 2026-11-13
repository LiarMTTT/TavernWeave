"""Original MIT container/patch bridge. No inherited card passes through Markdown.

Use the unchanged Foreverse MIT chunk writer; preserve every unrelated PNG chunk
and JSON value. Semantic adaptation remains the agent's work.
"""
import base64
from collections import Counter
import copy
import json
import os
from pathlib import Path
import re
import struct
import tempfile
import zlib

import provenance as p

LIMIT = 64 * 1024 * 1024
PROSE = {"name", "description", "personality", "scenario", "first_mes", "mes_example",
         "system_prompt", "post_history_instructions", "creator_notes"}
GREETINGS = {"alternate_greetings", "group_only_greetings"}
CODE = re.compile(r"```[\s\S]*?```|<script\b[^>]*>[\s\S]*?</script\s*>|<style\b[^>]*>[\s\S]*?</style\s*>", re.I)


def loads(raw):
    # Reuse the bridge's strict duplicate-key/non-finite-number policy in memory.
    def unique(items):
        obj = {}
        for key, value in items:
            p.require(key not in obj, "Duplicate JSON key: " + key)
            obj[key] = value
        return obj
    return json.loads(raw.decode("utf-8-sig"), object_pairs_hook=unique,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError("Invalid number: " + x)))


def shape(doc):
    p.require(isinstance(doc, dict), "Card/book must be a JSON object")
    if "spec" in doc:
        p.require(doc["spec"] in ("chara_card_v2", "chara_card_v3") and isinstance(doc.get("data"), dict), "Unsupported card envelope; do not flatten it")
        return "card", "/data"
    if isinstance(doc.get("entries"), (dict, list)):
        return "worldbook", ""
    p.require(isinstance(doc.get("name"), str) and any(k in doc for k in ("first_mes", "description", "personality")), "Not a recognized legacy card or worldbook")
    return "card", ""


def inflate(raw, limit):
    decoder = zlib.decompressobj()
    data = decoder.decompress(raw, limit + 1)
    p.require(len(data) <= limit and decoder.eof and not decoder.unused_data and not decoder.unconsumed_tail, "Invalid or oversized compressed metadata")
    return data


def chunks(raw):
    _, _, creator = p.dependencies()
    p.require(raw.startswith(creator.serializer().PNG_SIG), "Not a PNG")
    pos, rows = 8, []
    while pos < len(raw):
        p.require(pos + 12 <= len(raw), "Truncated PNG chunk")
        size = struct.unpack(">I", raw[pos:pos + 4])[0]; end = pos + size + 12
        p.require(end <= len(raw), "Truncated PNG data")
        kind, body = raw[pos + 4:pos + 8], raw[pos + 8:end - 4]
        p.require(zlib.crc32(kind + body) & 0xffffffff == struct.unpack(">I", raw[end - 4:end])[0], "PNG CRC mismatch")
        rows.append((kind, body, raw[pos:end]))
        if kind == b"IEND":
            p.require(not size and end == len(raw), "Invalid PNG end")
            break
        pos = end
    p.require(rows and rows[0][0] == b"IHDR" and rows[-1][0] == b"IEND", "PNG requires IHDR and terminal IEND")
    return rows


def payload(kind, body, limit):
    if kind not in (b"tEXt", b"zTXt", b"iTXt"):
        return None
    key, sep, rest = body.partition(b"\0")
    if key not in (b"chara", b"ccv3"):
        return None
    p.require(sep, "Invalid PNG card keyword")
    if kind == b"zTXt":
        p.require(rest[:1] == b"\0", "Unsupported PNG text compression")
        rest = inflate(rest[1:], limit)
    elif kind == b"iTXt":
        p.require(len(rest) >= 2 and rest[0] in (0, 1) and rest[1] == 0, "Invalid PNG international text")
        compressed, rest = rest[0], rest[2:]
        for _ in range(2):
            _, sep, rest = rest.partition(b"\0")
            p.require(sep, "Truncated international text header")
        if compressed:
            rest = inflate(rest, limit)
    p.require(len(rest) <= limit, "Oversized card metadata")
    try:
        decoded = base64.b64decode(b"".join(rest.split()), validate=True)
    except ValueError as exc:
        raise ValueError("Card metadata is not valid base64") from exc
    p.require(len(decoded) <= limit, "Oversized decoded card")
    doc = loads(decoded); shape(doc)
    return key.decode(), doc


def decode(raw, limit=LIMIT):
    p.require(len(raw) <= limit, "Input exceeds byte budget; raise --max-mib explicitly if needed")
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        documents = {}
        for kind, body, _ in chunks(raw):
            item = payload(kind, body, limit)
            if item:
                key, doc = item
                p.require(key not in documents or p.canonical(documents[key]) == p.canonical(doc), "Conflicting duplicate PNG payload: " + key)
                documents[key] = doc
        p.require(documents, "PNG contains no character-card metadata; treat it as reference art")
        return "png", documents
    doc = loads(raw); shape(doc)
    return "json", {"json": doc}


def pointer(path):
    p.require(isinstance(path, str) and path.startswith("/") and not re.search(r"~(?![01])", path), "Use an exact JSON pointer")
    return [part.replace("~1", "/").replace("~0", "~") for part in path[1:].split("/")]


def get(doc, parts):
    for part in parts:
        if isinstance(doc, list):
            p.require(re.fullmatch(r"0|[1-9][0-9]*", part), "Invalid array index")
            doc = doc[int(part)]
        else:
            doc = doc[part]
    return doc


def editable(doc, parts):
    kind, root = shape(doc)
    relative = parts[1:] if root and parts[:1] == ["data"] else parts
    if kind == "card" and relative and (not root or parts[:1] == ["data"] or relative[0] in PROSE | GREETINGS):
        if len(relative) == 1 and relative[0] in PROSE | GREETINGS:
            return True
        if len(relative) == 2 and relative[0] in GREETINGS:
            return True
    if kind == "card":
        if root and parts[:1] != ["data"]:
            return False
        if not relative or relative[0] != "character_book":
            return False
        relative = relative[1:]
    return (len(relative) == 3 and relative[0] == "entries"
            and relative[2] in ("content", "comment", "name", "keys", "key", "secondary_keys", "keysecondary"))


def protect_code(before, after):
    old = before if isinstance(before, str) else "\n".join(before)
    new = after if isinstance(after, str) else "\n".join(after)
    p.require(Counter(m[0] for m in CODE.finditer(old)) == Counter(m[0] for m in CODE.finditer(new)),
              "Preserve fenced code, scripts and styles; use a separate scoped engineering edit")


def open_project(input_path, project, limit=LIMIT, profile_path=None):
    project, source = Path(project).resolve(), Path(input_path).resolve()
    preferences = p.profiles.load(profile_path)
    p.require(not project.exists() and not project.is_relative_to(p.ROOT.parents[1]), "Use a new private project outside the repository")
    p.require(source.stat().st_size <= limit, "Input exceeds --max-mib")
    raw = source.read_bytes(); fmt, docs = decode(raw, limit)
    project.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".yuri-card-open-", dir=project.parent) as temp:
        stage = Path(temp) / "project"; stage.mkdir()
        (stage / "source.bin").write_bytes(raw)
        p.write_new(stage / "documents.json", docs)
        p.write_new(stage / "preferences.json", preferences)
        profile_hash = p.sha((stage / "preferences.json").read_bytes())
        p.write_new(stage / "session.json", {"schema": "yuri/card-session/v2", "source_name": source.name,
                    "source_sha256": p.sha(raw), "format": fmt, "documents_sha256": p.sha(p.canonical(docs)),
                    "profile_sha256": profile_hash, "byte_budget": limit})
        plan = {"schema": "yuri/card-edit/v1", "source_sha256": p.sha(raw), "profile_sha256": profile_hash,
                    "documents_sha256": p.sha(p.canonical(docs)), "changes": [], "decisions": [],
                    "agent_review": {"completed": False, "notes": []}}
        if not p.profiles.is_default(preferences):
            plan.update(cast=[], targets=[], policy_review=p.profiles.review_template(stage / "preferences.json"))
        p.write_new(stage / "edit-plan.json", plan)
        os.rename(stage, project)
    return {"project": str(project), "format": fmt, "documents": {k: {"kind": shape(d)[0], "data_pointer": shape(d)[1]} for k, d in docs.items()},
            "next": "Read documents.json; agent prepares exact before/after prose edits in edit-plan.json"}


def apply(project, plan_path, output):
    project, output = Path(project), Path(output)
    p.require(not output.exists(), "Output exists; use a new result directory")
    session, plan = p.read(project / "session.json"), p.read(plan_path)
    p.require(session.get("schema") in ("yuri/card-session/v1", "yuri/card-session/v2") and plan.get("schema") == "yuri/card-edit/v1", "Unsupported session/plan")
    if session["schema"] == "yuri/card-session/v2":
        preferences = p.profiles.load(project / "preferences.json")
        p.require(p.sha((project / "preferences.json").read_bytes()) == session.get("profile_sha256") == plan.get("profile_sha256"), "Stale inherited profile binding; open a fresh session for changed preferences")
    else:
        p.require(not (project / "preferences.json").exists() and "profile_sha256" not in plan and "policy_review" not in plan,
                  "Legacy sessions have default policy only; reopen to use a saved profile")
        preferences = p.profiles.load()
    p.profiles.review(preferences, plan, project / "preferences.json")
    raw = (project / "source.bin").read_bytes(); fmt, docs = decode(raw, session["byte_budget"])
    baseline = p.sha(p.canonical(docs))
    p.require(p.sha(raw) == session["source_sha256"] == plan["source_sha256"] and fmt == session["format"], "Stale source binding")
    p.require(baseline == session["documents_sha256"] == plan["documents_sha256"] == p.sha(p.canonical(p.read(project / "documents.json"))), "Source documents changed; use the edit plan")
    review = plan.get("agent_review", {})
    p.require(review.get("completed") is True and review.get("notes"), "Agent prose/scope review required")
    changes = plan.get("changes"); p.require(isinstance(changes, list), "Changes must be an array")
    decisions = plan.get("decisions", [])
    p.require(isinstance(decisions, list) and (not changes or decisions), "Describe inherited adaptation decisions")
    for decision in decisions:
        p.require(isinstance(decision, dict) and decision.get("kind") in ("identity", "relationship", "name", "invention", "preserved")
                  and isinstance(decision.get("summary"), str) and decision["summary"].strip(), "Describe adaptation decisions with kind and summary")
    if not p.profiles.is_default(preferences):
        cast = plan.get("cast", [])
        p.require(all(isinstance(c, dict) and c.get("source_gender") in ("woman", "man", "unknown")
                      and c.get("age_status") in ("adult", "minor", "unknown") for c in cast), "Record inherited source gender/age without inference")
        selected = p.profiles.validate_targets(preferences, plan.get("targets"), cast)
        p.profiles.relationships(preferences, decisions, {c["id"] for c in cast})
        for change in changes:
            mentioned = p.profiles.identifiers(change.get("character_ids"), "Change character_ids")
            p.require(mentioned <= selected, "Prose edits must stay within saved character scope; use [] for setting-only prose")
    result, touched = copy.deepcopy(docs), set()
    for change in changes:
        key, path = change["document"], change["path"]; parts = pointer(path)
        p.require(key in docs and (key, path) not in touched and change.get("reason", "").strip(), "Unique document/path and reason required")
        p.require(not any(k == key and (path.startswith(q + "/") or q.startswith(path + "/")) for k, q in touched), "Overlapping edits")
        before = get(docs[key], parts); after = change["after"]
        p.require(p.canonical(before) == p.canonical(change["before"]), "Stale before value: " + path)
        p.require(editable(docs[key], parts), "Protected field: " + path)
        p.require((isinstance(before, str) and isinstance(after, str)) or
                  (isinstance(before, list) and isinstance(after, list) and all(isinstance(s, str) for s in before + after)), "Only prose or string-list replacements are allowed")
        protect_code(before, after)
        parent = get(result[key], parts[:-1]); parent[int(parts[-1]) if isinstance(parent, list) else parts[-1]] = after
        touched.add((key, path))
    # Do not leave another existing PNG payload (or a legacy mirror) with stale
    # prose. Every affected counterpart needs its own explicit before/after edit.
    for key, path in touched:
        _, root = shape(docs[key]); parts = pointer(path)
        relative = parts[1:] if root and parts[0] == "data" else parts
        for other, original in docs.items():
            if other == key:
                continue
            _, other_root = shape(original)
            other_path = (["data"] if other_root else []) + relative
            try:
                old = get(original, other_path); new = get(result[other], other_path)
            except (KeyError, IndexError, TypeError):
                if relative[:1] == ["group_only_greetings"]:
                    continue  # v3-only prose has no v2 counterpart to synchronize.
                p.require(False, "PNG counterparts have different structures; resolve them in a separately scoped edit")
            p.require(p.canonical(new) == p.canonical(get(result[key], parts)), "Edit the affected field in every PNG payload explicitly")
        if root and len(relative) == 1 and relative[0] in docs[key] and relative[0] in docs[key]["data"]:
            field = relative[0]
            if p.canonical(docs[key][field]) == p.canonical(docs[key]["data"][field]):
                p.require(p.canonical(result[key][field]) == p.canonical(result[key]["data"][field]), "Update the existing top-level/data mirror explicitly: " + field)
    packed = raw
    if changes and fmt == "png":
        _, _, creator = p.dependencies(); writer = creator.serializer()
        packed_rows = [writer.PNG_SIG]
        for kind, body, original in chunks(raw):
            item = payload(kind, body, session["byte_budget"])
            if item and p.canonical(docs[item[0]]) != p.canonical(result[item[0]]):
                key = item[0]
                encoded = json.dumps(result[key], ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()
                data = key.encode() + b"\0" + base64.b64encode(encoded)
                packed_rows.append(writer._chunk(b"tEXt", data))
            else:
                packed_rows.append(original)
        packed = b"".join(packed_rows)
    elif changes:
        packed = json.dumps(result["json"], ensure_ascii=False, indent=2, allow_nan=False).encode() + b"\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".yuri-card-edit-", dir=output.parent) as temp:
        stage = Path(temp) / "result"; stage.mkdir()
        name = "character.png" if fmt == "png" else "character.json"
        (stage / name).write_bytes(packed)
        for key, doc in result.items():
            p.write_new(stage / (key + ".json"), doc)
            kind, root = shape(doc); data = doc["data"] if root else doc
            if kind == "worldbook" or isinstance(data.get("character_book"), dict):
                p.write_new(stage / (key + ".worldbook.json"), doc if kind == "worldbook" else data["character_book"])
        p.write_new(stage / "adaptation-record.json", {"schema": "yuri/inherited-record/v1",
                    "mode": "inherited_yuri" if changes else "container_copy", "source_sha256": p.sha(raw),
                    "output_sha256": p.sha(packed), "plan_sha256": p.sha(Path(plan_path).read_bytes()), "plan": plan,
                    "preferences": preferences,
                    "unlisted_json_values": "preserved", "unrelated_png_chunks": "preserved_byte_for_byte",
                    "host_import": "not_run", "live_roleplay": "not_run"})
        os.rename(stage, output)
    return {"output": str(output / name), "changes": len(changes), "host_import": "not_run"}


def inventory(folder):
    """Classify without guessing card ownership, version order or relationships."""
    root = Path(folder).resolve(); rows = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.is_symlink():
            continue
        ext = path.suffix.lower()
        kind = ("card_candidate" if ext in (".png", ".json") else "reference_image" if ext in (".jpg", ".jpeg", ".webp")
                else "source_or_component" if ext in (".txt", ".md", ".docx", ".doc", ".html", ".js", ".css")
                else "novel" if ext == ".epub" else "other")
        rows.append({"path": path.relative_to(root).as_posix(), "kind": kind, "bytes": path.stat().st_size})
    return {"schema": "yuri/folder-inventory/v1", "files": rows, "grouping": "agent must distinguish cards, components and versions; never merge by folder alone"}
