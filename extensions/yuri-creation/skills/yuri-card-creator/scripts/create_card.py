#!/usr/bin/env python3
"""Original creation records and thin export; prose is authored by the host agent.

SPDX-License-Identifier: MIT
The unchanged Foreverse serializer retains its own license in vendor/.
"""
import argparse
import hashlib
import importlib.util
import json
import os
import struct
import zlib
from pathlib import Path
import tempfile
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))
import profiles

HERE = Path(__file__).resolve().parent
VERSION = "0.1.0"
PACKAGE_VERSION = "1.0.0"


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def write(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def blob(raw):
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()


def profile(path=None):
    return profiles.load(path)


def probe(root):
    upstream = read(HERE.parent / "assets/upstream.json")["tavernweave"]
    if root is None:
        return {"mode": "standalone", "tavernweave_loaded": False, "host_integration": "not_run"}
    verified = []
    for module in upstream["modules"]:
        path = Path(root) / module["path"]
        if not path.is_file() or blob(path.read_bytes()) != module["blob"]:
            raise ValueError("TavernWeave authoring file missing or differs from pin: " + module["path"])
        verified.append(module["path"])
    return {"mode": "pinned_authoring_files", "commit": upstream["commit"],
            "verified_files": verified, "host_integration": "not_run",
            "limitation": "File hashes do not prove the agent read them or that a native plugin is installed."}


def initialize(project, locale="zh-CN", profile_path=None):
    project = Path(project)
    if locale not in ("en", "zh-CN"):
        raise ValueError("supported interaction locales: en, zh-CN")
    preferences = profile(profile_path)
    if project.exists() and (not project.is_dir() or any(project.iterdir())):
        raise ValueError("choose an empty creation directory")
    project.mkdir(parents=True, exist_ok=True)
    write(project / "preferences.json", preferences)
    contract = {"schema_version": VERSION, "mode": "original",
          "external_creative_sources": [], "interaction_locale": locale,
          "cast": [], "creative_choices": [],
          "player_agency": "current actions, thoughts, dialogue and consent remain with the player",
          "agent_review": {"completed": False, "notes": []}}
    if not profiles.is_default(preferences):
        contract["policy_review"] = profiles.review_template(project / "preferences.json")
    write(project / "creation.json", contract)
    return {"project": str(project), "mode": "original", "next": "agent authors card.md and completes creation.json"}


def validate_contract(contract):
    if contract.get("schema_version") != VERSION or contract.get("mode") != "original":
        raise ValueError("this entry point is for original creation")
    if contract.get("external_creative_sources") != []:
        raise ValueError("reference-based adaptations belong in a source workflow, not fabricated original provenance")
    cast = contract.get("cast", [])
    if not isinstance(cast, list) or not cast or len({x["id"] for x in cast}) != len(cast):
        raise ValueError("record a nonempty cast with unique IDs")
    main = [x for x in cast if x.get("role") == "main"]
    if not main:
        raise ValueError("record the main cast")
    if not contract.get("creative_choices") or not all(isinstance(x, str) and x.strip() for x in contract["creative_choices"]):
        raise ValueError("record the agent's creative choices")
    review = contract.get("agent_review", {})
    if review.get("completed") is not True or not isinstance(review.get("notes"), list) or not review["notes"]:
        raise ValueError("agent narrative and agency review is still pending")


def serializer():
    exporter = HERE / "vendor/card_md_to_st.py"
    pin = read(HERE.parent / "assets/upstream.json")["foreverse"]["git_blob"]
    if blob(exporter.read_bytes()) != pin:
        raise ValueError("vendored exporter differs from the licensed pin")
    spec = importlib.util.spec_from_file_location("yuri_foreverse_exporter", exporter)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


def capabilities(tavern_root=None):
    return {"package_version": PACKAGE_VERSION, "contract_version": VERSION,
            "authoring_dependency": probe(tavern_root), "host_registration": "not_verified",
            "commands": {"init": "new creation directory", "build": "new JSON result directory",
                         "validate-profile": "validate supported saved policies without changing a project",
                         "pack-image": "existing v2 JSON + PNG avatar to new card PNG"},
            "research": "optional_host_search_and_page_tools_not_probed",
            "image_inspection_editing_generation": "optional_host_tools_not_probed",
            "source_adaptation": "post and novel entry points share scripts/source_card.py; pinned work library required",
            "entry_points": {"original": "yuri-card-creator", "inherited": "adapt-yuri-card via scripts/card_file.py",
                             "post": "post-to-yuri-card", "novel": "novel-excerpt-to-yuri-card via scripts/novel_source.py"},
            "custom_profiles": "shared supported policy validation; non-default exports require bound policy_review; prose semantics remain agent-reviewed",
            "sillytavern_import": "not_run"}


def pack_image(card_path, avatar_path, output):
    card_path, avatar_path, output = map(Path, (card_path, avatar_path, output))
    if output.exists():
        raise ValueError("output exists; choose a new PNG path")
    if output.resolve() in (card_path.resolve(), avatar_path.resolve()):
        raise ValueError("output aliases an input")
    card = read(card_path)
    if card.get("spec") != "chara_card_v2" or not isinstance(card.get("data"), dict):
        raise ValueError("pack-image requires a wrapped v2 JSON card")
    if avatar_path.stat().st_size > 64 * 1024 * 1024:
        raise ValueError("PNG exceeds the 64 MiB adapter limit")
    raw = avatar_path.read_bytes(); module = serializer()
    if not raw.startswith(module.PNG_SIG):
        raise ValueError("not a PNG file")
    pos, ended = 8, False
    while pos < len(raw):
        if pos + 12 > len(raw):
            raise ValueError("truncated PNG chunk")
        size = struct.unpack(">I", raw[pos:pos+4])[0]
        end = pos + size + 12
        if end > len(raw):
            raise ValueError("truncated PNG chunk")
        kind, body = raw[pos+4:pos+8], raw[pos+8:end-4]
        if zlib.crc32(kind + body) & 0xffffffff != struct.unpack(">I", raw[end-4:end])[0]:
            raise ValueError("PNG CRC mismatch")
        if kind in (b"zTXt", b"iTXt") and body.split(b"\0", 1)[0] in (b"chara", b"ccv3"):
            raise ValueError("compressed card metadata requires a separate decoder")
        pos = end
        if kind == b"IEND":
            if size or pos != len(raw):
                raise ValueError("invalid PNG end")
            ended = True; break
    if not ended:
        raise ValueError("PNG is missing IEND")
    v3 = module.to_v3(card)
    # The serializer's own project URL is not this generated card's provenance.
    v3["data"]["source"] = card["data"].get("source", [])
    packed = module.embed_card_in_png(raw, card, v3)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("xb") as stream:
        stream.write(packed)
    return {"output": str(output), "card_sha256": sha(card_path.read_bytes()),
            "avatar_sha256": sha(raw), "output_sha256": sha(packed),
            "image_pixels": "preserved_encoded_chunks", "visual_alignment": "not_reviewed",
            "host_import": "not_run"}


def export(project, output, tavern_root=None):
    project, output = Path(project), Path(output)
    if output.exists():
        raise ValueError("output exists; choose a new result directory")
    contract = read(project / "creation.json")
    validate_contract(contract)
    preferences = profile(project / "preferences.json")
    profiles.validate_original(preferences, contract, project / "preferences.json")
    dependency = probe(tavern_root)
    module = serializer()
    draft = project / "card.md"
    card, _ = module.build_v2(draft)
    front, _ = module.parse_front(draft.read_text(encoding="utf-8"))
    if not front.get("creator"):
        card["data"]["creator"] = "Yuri Card Workbench contributors"
    if not front.get("name") or not card["data"]["first_mes"].strip():
        raise ValueError("author a named card and a playable opening")
    if "{{user}}" not in card["data"]["first_mes"]:
        raise ValueError("opening must address the player using {{user}}")
    book = card["data"].get("character_book", {})
    if not book.get("entries") or not all(x.get("content", "").strip() for x in book["entries"]):
        raise ValueError("provide a usable worldbook")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".yuri-create-", dir=output.parent) as temporary:
        stage = Path(temporary) / "result"; stage.mkdir()
        write(stage / "yuri-card.v2.json", card)
        write(stage / "worldbook.json", book)
        write(stage / "creation-record.json", {"version": VERSION, "mode": "original",
              "creation": contract, "preferences": preferences, "dependency": dependency,
              "draft_sha256": sha(draft.read_bytes()),
              "preferences_sha256": sha((project / "preferences.json").read_bytes()),
              "creation_sha256": sha((project / "creation.json").read_bytes()),
              "card_sha256": sha((stage / "yuri-card.v2.json").read_bytes()),
              "semantic_quality": "agent_review_not_automatically_proven",
              "host_import": "not_run", "live_roleplay": "not_run"})
        os.rename(stage, output)
    return {"output": str(output), "card": "yuri-card.v2.json", "mode": "original", "host_import": "not_run"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("init"); p.add_argument("--project", type=Path, required=True)
    p.add_argument("--locale", default="zh-CN", choices=["en", "zh-CN"]); p.add_argument("--profile", type=Path)
    p = sub.add_parser("build"); p.add_argument("--project", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True); p.add_argument("--tavern-root", type=Path)
    p = sub.add_parser("probe-base"); p.add_argument("--tavern-root", type=Path)
    p = sub.add_parser("capabilities"); p.add_argument("--tavern-root", type=Path)
    p = sub.add_parser("validate-profile"); p.add_argument("--profile", type=Path, required=True)
    p = sub.add_parser("pack-image"); p.add_argument("--card", type=Path, required=True)
    p.add_argument("--avatar", type=Path, required=True); p.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        if args.command == "init": result = initialize(args.project, args.locale, args.profile)
        elif args.command == "build": result = export(args.project, args.output, args.tavern_root)
        elif args.command == "pack-image": result = pack_image(args.card, args.avatar, args.output)
        elif args.command == "capabilities": result = capabilities(args.tavern_root)
        elif args.command == "validate-profile": result = {"preferences": profile(args.profile), "status": "supported", "prose_review": "not_run"}
        else: result = probe(args.tavern_root)
        print(json.dumps(result, ensure_ascii=False, indent=2)); return 0
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        parser.exit(1, "ERROR: " + str(exc) + "\n")


if __name__ == "__main__":
    raise SystemExit(main())
