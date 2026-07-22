#!/usr/bin/env python3
"""Generate a small React Tailwind config with guarded write semantics."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


NAME_RE = re.compile(r"^[A-Za-z0-9_-]+$")
FORMAT_EXTENSIONS = {
    "typescript": "ts",
    "esm": "js",
    "commonjs": "cjs",
}


def parse_pairs(values: list[str] | None, label: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in values or []:
        if ":" not in item:
            raise ValueError(f"Invalid {label} value {item!r}; expected NAME:VALUE")
        name, value = item.split(":", 1)
        if not NAME_RE.fullmatch(name) or not value.strip() or "\n" in value:
            raise ValueError(f"Invalid {label} value {item!r}")
        result[name] = value.strip()
    return result


def parse_fonts(values: list[str] | None) -> dict[str, list[str]]:
    fonts: dict[str, list[str]] = {}
    for name, value in parse_pairs(values, "font").items():
        families = [part.strip().strip("'\"") for part in value.split(",")]
        if not families or any(not family for family in families):
            raise ValueError(f"Invalid font family list for {name!r}")
        fonts[name] = families
    return fonts


def build_config(args: argparse.Namespace) -> dict[str, object]:
    content = {
        "react": ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
        "nextjs": [
            "./app/**/*.{js,jsx,ts,tsx,mdx}",
            "./pages/**/*.{js,jsx,ts,tsx,mdx}",
            "./components/**/*.{js,jsx,ts,tsx,mdx}",
            "./src/**/*.{js,jsx,ts,tsx,mdx}",
        ],
    }[args.framework]

    extend: dict[str, object] = {}
    colors = parse_pairs(args.colors, "color")
    spacing = parse_pairs(args.spacing, "spacing")
    screens = parse_pairs(args.breakpoints, "breakpoint")
    fonts = parse_fonts(args.fonts)
    if colors:
        extend["colors"] = colors
    if spacing:
        extend["spacing"] = spacing
    if screens:
        extend["screens"] = screens
    if fonts:
        extend["fontFamily"] = fonts

    return {
        "darkMode": ["class"],
        "content": content,
        "theme": {"extend": extend},
        "plugins": [],
    }


def render_config(config: dict[str, object], output_format: str) -> str:
    payload = json.dumps(config, indent=2, ensure_ascii=False)
    if output_format == "commonjs":
        return f"/** @type {{import('tailwindcss').Config}} */\nmodule.exports = {payload}\n"
    if output_format == "esm":
        return f"/** @type {{import('tailwindcss').Config}} */\nexport default {payload}\n"
    if output_format == "typescript":
        return (
            'import type { Config } from "tailwindcss"\n\n'
            f"export default {payload} satisfies Config\n"
        )
    raise ValueError(f"Unsupported output format: {output_format}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Generate a React Tailwind config. The default is a dry run; "
            "--write creates a missing file and --force is the only overwrite path."
        )
    )
    parser.add_argument("--framework", choices=("react", "nextjs"), default="react")
    parser.add_argument(
        "--format",
        choices=tuple(FORMAT_EXTENSIONS),
        default="typescript",
        help="Output format: TypeScript (default), ESM JavaScript, or CommonJS",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Target path; defaults to tailwind.config.ts, .js, or .cjs for the selected format",
    )
    parser.add_argument("--colors", nargs="*", metavar="NAME:VALUE")
    parser.add_argument("--fonts", nargs="*", metavar="NAME:FAMILY[,FAMILY]")
    parser.add_argument("--spacing", nargs="*", metavar="NAME:VALUE")
    parser.add_argument("--breakpoints", nargs="*", metavar="NAME:VALUE")
    write_group = parser.add_mutually_exclusive_group()
    write_group.add_argument("--write", action="store_true", help="Create the file if it does not exist")
    write_group.add_argument("--force", action="store_true", help="Write and explicitly allow replacement")
    args = parser.parse_args()

    output = args.output or Path.cwd() / f"tailwind.config.{FORMAT_EXTENSIONS[args.format]}"
    output = output.resolve()

    try:
        rendered = render_config(build_config(args), args.format)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if not args.write and not args.force:
        action = "replace" if output.exists() else "create"
        print(f"DRY RUN: would {action} {output}")
        print(rendered, end="")
        return 0

    if output.exists() and not args.force:
        print(f"error: target already exists: {output}", file=sys.stderr)
        print("Use --force only after reviewing and accepting replacement.", file=sys.stderr)
        return 2

    if not output.parent.is_dir():
        print(f"error: target directory does not exist: {output.parent}", file=sys.stderr)
        return 2

    output.write_text(rendered, encoding="utf-8")
    print(f"wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
