#!/usr/bin/env python3
"""Original MIT CLI; calls the shared provenance bridge and pinned upstream tools."""
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "shared"))
import provenance as p


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tavern-root", type=Path, help="Default: this checkout's repository root")
    sub = parser.add_subparsers(dest="command", required=True)
    c = sub.add_parser("init"); c.add_argument("--input", type=Path, required=True)
    c.add_argument("--project", type=Path, required=True); c.add_argument("--title", default="Supplied post"); c.add_argument("--url")
    c.add_argument("--profile", type=Path, help="Saved ready preferences; omitted uses the default")
    c = sub.add_parser("read"); c.add_argument("--project", type=Path, required=True); c.add_argument("--unit")
    c = sub.add_parser("evidence"); c.add_argument("--project", type=Path, required=True)
    c.add_argument("--quote", required=True); c.add_argument("--start", type=int)
    c = sub.add_parser("extract"); c.add_argument("--project", type=Path, required=True); c.add_argument("--candidate", type=Path, required=True)
    c = sub.add_parser("prepare"); c.add_argument("--project", type=Path, required=True)
    c.add_argument("--draft", type=Path, required=True); c.add_argument("--plan", type=Path, required=True)
    c = sub.add_parser("build"); c.add_argument("--project", type=Path, required=True)
    c.add_argument("--draft", type=Path, required=True); c.add_argument("--plan", type=Path, required=True); c.add_argument("--output", type=Path, required=True)
    a = parser.parse_args()
    try:
        if a.command == "init": result = p.register(a.input, a.project, a.title, a.url, a.tavern_root, profile_path=a.profile)
        elif a.command == "read": result = p.units(a.project, a.unit, a.tavern_root)
        elif a.command == "evidence": result = p.evidence(a.project, a.quote, a.start, a.tavern_root)
        elif a.command == "extract": result = p.promote(a.project, a.candidate, a.tavern_root)
        elif a.command == "prepare": result = p.prepare(a.project, a.draft, a.plan, a.tavern_root)
        else: result = p.build(a.project, a.draft, a.plan, a.output, a.tavern_root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
