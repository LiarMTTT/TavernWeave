#!/usr/bin/env python3
"""MIT novel front end; shared source_card.py handles subsequent extraction/build."""
import argparse
import json
from pathlib import Path
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "shared"))
import novels as n


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tavern-root", type=Path)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("index", "init"):
        cmd = sub.add_parser(name); cmd.add_argument("--input", type=Path, required=True)
        cmd.add_argument("--encoding", help="Explicit TXT encoding; UTF-8/BOM is the default")
        cmd.add_argument("--max-mib", type=int, default=256)
        if name == "init":
            cmd.add_argument("--profile", type=Path, help="Saved ready preferences")
            cmd.add_argument("--project", type=Path, required=True); cmd.add_argument("--title", default="Supplied novel excerpt")
            selection = cmd.add_mutually_exclusive_group(required=True)
            selection.add_argument("--chapter", action="append", help="Catalog chapter ID; repeat for several chapters")
            selection.add_argument("--all", action="store_true", help="Explicit full-text registration; does not claim full model review")
            cmd.add_argument("--start", type=int, help="Optional explicit excerpt start within one selected chapter")
            cmd.add_argument("--end", type=int, help="Optional explicit excerpt end; never an implicit truncation")
    args = parser.parse_args()
    try:
        n.p.require(args.max_mib > 0, "Positive byte budget required")
        budget = args.max_mib * 1024 * 1024
        if args.command == "index": result = n.index(args.input, args.encoding, budget, args.tavern_root)
        else:
            selected = [c['id'] for c in n.index(args.input, args.encoding, budget, args.tavern_root)['chapters']] if args.all else args.chapter
            result = n.register(args.input, args.project, selected, args.title, args.encoding, budget, args.tavern_root, args.start, args.end, args.profile)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError, LookupError, zipfile.BadZipFile, ET.ParseError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
