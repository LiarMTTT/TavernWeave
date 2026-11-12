#!/usr/bin/env python3
"""Build a small, original synthetic fixture; not an automatic text extractor.

SPDX-License-Identifier: MIT
The assertions/draft below are hand-authored test content, not user casework.
"""
import argparse
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "shared"))
import provenance as p


def setup(parent):
    parent = Path(parent); parent.mkdir(parents=True, exist_ok=True)
    project, candidate, plan = parent / "project", parent / "extraction.json", parent / "plan.json"
    p.register(HERE / "post.txt", project, "Synthetic bookshop post")
    info = p.units(project)
    definitions = [
        ("player", "character", "原帖作者", "30岁，负责书店排班；原文没有明确性别。", "我今年30岁，在旧书店做排班。", {"role": "player", "source_gender": "unknown", "age_status": "adult"}),
        ("lin", "character", "林澈", "32岁的女性修复师，希望修完社区借阅登记册。", "林澈32岁，是来修书的女师傅。", {"role": "main", "source_gender": "woman", "age_status": "adult"}),
        ("closing", "event", "提前关门", "店主要求提前关门，修复尚未结束。", "店主要提前关门，她却想先修完那本社区借阅登记册。", None),
        ("lamp", "relationship", "留灯约定", "原帖作者答应留灯，是否等候尚未决定；不据此断言恋爱。", "我答应留一盏灯，但还没决定下班后是否等她。", None),
        ("owner", "character", "店主", "店主要求提前关门，年龄和性别未说明。", "店主要提前关门", {"role": "background", "source_gender": "unknown", "age_status": "unknown"})]
    records = []
    for rid, kind, name, body, quote, role in definitions:
        row = {"id": rid, "kind": kind, "name": name, "body": body, "status": "confirmed", "realm": "reference",
               "continuity": "supplied-post", "known_from": None, "evidence": p.evidence(project, quote)}
        if role: row["yuri"] = role
        records.append(row)
    p.write_new(candidate, {"schema": "yuri/extraction/v1", "source_sha256": info["source_sha256"],
                           "reviewed_unit_ids": [u["id"] for u in info["units"]],
                           "review": {"completed": True, "notes": ["Read entire synthetic post; poster gender remains unknown."]}, "records": records})
    p.promote(project, candidate)
    draft = parent / "card.md"; draft.write_bytes((HERE / "card.md").read_bytes())
    p.prepare(project, draft, plan)
    value = p.read(plan)
    value.update(targets=[{"record_id": rid, "result_woman": True, "result_adult": True,
                           "reason": "Fictional female player choice; source gender remains unknown." if rid == "player" else "Preserve the sourced adult woman."} for rid in ("player", "lin")],
                 player_binding={"record_id": "player", "runtime_aliases": ["原帖作者"]},
                 decisions=[{"id": "identity", "kind": "identity", "record_ids": ["player", "lin"], "summary": "Adapt the unknown-gender poster to an adult woman without rewriting source facts."},
                            {"id": "bond", "kind": "relationship", "record_ids": ["lamp"], "causal_record_ids": ["closing", "lamp"],
                             "changed_circumstance": "Closing pressure makes cooperative repair and competing schedules salient; trust can develop through choices rather than automatic attraction.", "summary": "Possible slow-burn yuri relationship, not a source fact."},
                            {"id": "scene", "kind": "invention", "record_ids": [], "summary": "Invent dialogue, lamp placement and the next-day commission as playable scene details."}],
                 field_sources=[{"pointer": pointer, "record_ids": ["player", "lin", "closing", "lamp"], "decision_ids": ["identity", "bond", "scene"]}
                                for pointer in ("/data/name", "/data/first_mes", "/data/character_book/entries/0", "/data/character_book/entries/1")],
                 agent_review={"completed": True, "notes": ["Checked the actual short draft: distinct work goals; no assumed player response; yuri change labeled as adaptation."]})
    plan.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    return project, draft, plan


if __name__ == "__main__":
    a = argparse.ArgumentParser(description=__doc__); a.add_argument("--output-root", type=Path, required=True)
    args = a.parse_args(); project, draft, plan = setup(args.output_root)
    print(json.dumps(p.build(project, draft, plan, args.output_root / "result"), ensure_ascii=False, indent=2))
