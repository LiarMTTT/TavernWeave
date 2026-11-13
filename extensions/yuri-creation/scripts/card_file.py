#!/usr/bin/env python3
"""MIT inherited JSON/PNG/worldbook adapter; agent prepares protected edits."""
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "shared"))
import card_files as c


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    cmd = sub.add_parser("inventory"); cmd.add_argument("--folder", type=Path, required=True)
    cmd = sub.add_parser("open"); cmd.add_argument("--input", type=Path, required=True)
    cmd.add_argument("--project", type=Path, required=True); cmd.add_argument("--max-mib", type=int, default=64)
    cmd.add_argument("--profile", type=Path, help="Saved ready preferences")
    cmd = sub.add_parser("apply"); cmd.add_argument("--project", type=Path, required=True)
    cmd.add_argument("--plan", type=Path, required=True); cmd.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "inventory": result = c.inventory(args.folder)
        elif args.command == "open":
            c.p.require(args.max_mib > 0, "Positive byte budget required")
            result = c.open_project(args.input, args.project, args.max_mib * 1024 * 1024, args.profile)
        else: result = c.apply(args.project, args.plan, args.output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
