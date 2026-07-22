#!/usr/bin/env python3
"""Summarize patch scope, including untracked and unknown-line files."""

from __future__ import annotations

import argparse
import fnmatch
import re
import subprocess
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Change:
    path: str
    added: int | None
    deleted: int | None
    source: str = "tracked"
    unknown_reason: str | None = None

    @property
    def has_known_lines(self) -> bool:
        return self.added is not None and self.deleted is not None

    @property
    def line_churn(self) -> int | None:
        if not self.has_known_lines:
            return None
        return int(self.added) + int(self.deleted)


def parse_numstat(text: str, source: str = "tracked") -> list[Change]:
    """Parse regular `git diff --numstat` output without hiding binary rows."""

    changes: list[Change] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if not line.strip():
            continue
        parts = line.split("\t", 2)
        if len(parts) != 3:
            raise ValueError(f"invalid numstat row {line_number}: expected three tab-separated fields")
        added_text, deleted_text, path = parts
        if not path:
            raise ValueError(f"invalid numstat row {line_number}: path is empty")

        if added_text == "-" or deleted_text == "-":
            changes.append(
                Change(
                    path=path,
                    added=None,
                    deleted=None,
                    source=source,
                    unknown_reason="Git reports binary or unavailable line counts",
                )
            )
            continue

        try:
            added = int(added_text)
            deleted = int(deleted_text)
        except ValueError as error:
            raise ValueError(f"invalid numstat counts on row {line_number}") from error
        if added < 0 or deleted < 0:
            raise ValueError(f"negative numstat count on row {line_number}")
        changes.append(Change(path=path, added=added, deleted=deleted, source=source))
    return changes


def run_git(
    repo: Path, arguments: Sequence[str], *, binary: bool = False
) -> subprocess.CompletedProcess[Any]:
    result = subprocess.run(
        ["git", *arguments],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=not binary,
        encoding=None if binary else "utf-8",
        errors=None if binary else "replace",
        check=False,
    )
    if result.returncode != 0:
        stderr = (
            result.stderr.decode("utf-8", errors="replace")
            if isinstance(result.stderr, bytes)
            else result.stderr
        )
        raise RuntimeError(f"git {' '.join(arguments)} failed: {stderr.strip()}")
    return result


def resolve_git_root(repo: Path) -> Path:
    result = run_git(repo, ["rev-parse", "--show-toplevel"])
    return Path(str(result.stdout).strip()).resolve()


def git_has_head(repo: Path) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", "HEAD"],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if result.returncode in (0, 1):
        return result.returncode == 0
    raise RuntimeError(f"git rev-parse --verify --quiet HEAD failed: {result.stderr.strip()}")


def git_numstat(repo: Path, staged: bool, base: str | None = None) -> str:
    arguments = ["diff"]
    if staged:
        arguments.append("--staged")
    elif base:
        arguments.append(base)
    arguments.extend(["--numstat", "--no-ext-diff"])
    return str(run_git(repo, arguments).stdout)


def merge_changes(changes: Sequence[Change]) -> list[Change]:
    """Combine repeated paths while conservatively preserving total churn."""

    merged: dict[str, Change] = {}
    for change in changes:
        previous = merged.get(change.path)
        if previous is None:
            merged[change.path] = change
        elif previous.has_known_lines and change.has_known_lines:
            merged[change.path] = Change(
                path=change.path,
                added=int(previous.added) + int(change.added),
                deleted=int(previous.deleted) + int(change.deleted),
                source=change.source,
            )
        else:
            merged[change.path] = Change(
                path=change.path,
                added=None,
                deleted=None,
                source=change.source,
                unknown_reason="at least one combined diff has unavailable line counts",
            )
    return list(merged.values())


def git_untracked_paths(repo: Path) -> list[str]:
    result = run_git(
        repo,
        ["ls-files", "--others", "--exclude-standard", "-z"],
        binary=True,
    )
    raw = bytes(result.stdout)
    return sorted(
        item.decode("utf-8", errors="surrogateescape")
        for item in raw.split(b"\0")
        if item
    )


def looks_binary(sample: bytes) -> bool:
    """Conservatively identify likely binary data without loading whole files."""

    if not sample:
        return False
    if b"\0" in sample:
        return True
    try:
        sample.decode("utf-8")
    except UnicodeDecodeError:
        return True
    allowed_controls = {8, 9, 10, 12, 13}
    suspicious = sum(byte < 32 and byte not in allowed_controls for byte in sample)
    return suspicious / len(sample) > 0.10


def inspect_untracked_file(repo: Path, relative_path: str) -> Change:
    filesystem_path = repo.joinpath(*relative_path.split("/"))
    if filesystem_path.is_symlink():
        return Change(
            path=relative_path,
            added=None,
            deleted=None,
            source="untracked",
            unknown_reason="symbolic link line counts are not inspected",
        )

    try:
        sample = bytearray()
        size = 0
        newline_count = 0
        last_byte: int | None = None
        with filesystem_path.open("rb") as stream:
            while chunk := stream.read(64 * 1024):
                if len(sample) < 8192:
                    sample.extend(chunk[: 8192 - len(sample)])
                size += len(chunk)
                newline_count += chunk.count(b"\n")
                last_byte = chunk[-1]
    except (OSError, ValueError) as error:
        return Change(
            path=relative_path,
            added=None,
            deleted=None,
            source="untracked",
            unknown_reason=f"file could not be read ({type(error).__name__})",
        )

    if looks_binary(bytes(sample)):
        return Change(
            path=relative_path,
            added=None,
            deleted=None,
            source="untracked",
            unknown_reason="untracked file appears binary or non-UTF-8",
        )

    line_count = 0 if size == 0 else newline_count + (0 if last_byte == 10 else 1)
    return Change(
        path=relative_path,
        added=line_count,
        deleted=0,
        source="untracked",
    )


def collect_untracked(repo: Path) -> list[Change]:
    return [inspect_untracked_file(repo, path) for path in git_untracked_paths(repo)]


def normalize_match_path(path: str) -> str:
    return re.sub(r"/{2,}", "/", path.replace("\\", "/"))


def matches_any(path: str, patterns: Sequence[str]) -> bool:
    normalized_path = normalize_match_path(path)
    return any(
        fnmatch.fnmatch(normalized_path, normalize_match_path(pattern))
        for pattern in patterns
    )


def evaluate_scope(
    changes: Sequence[Change], max_files: int, max_lines: int, forbidden_patterns: Sequence[str]
) -> tuple[int, int, int, list[Change], list[str], list[str]]:
    known_changes = [change for change in changes if change.has_known_lines]
    unknown_changes = [change for change in changes if not change.has_known_lines]
    total_added = sum(int(change.added) for change in known_changes)
    total_deleted = sum(int(change.deleted) for change in known_changes)
    total_known_lines = total_added + total_deleted
    forbidden = [change.path for change in changes if matches_any(change.path, forbidden_patterns)]

    warnings: list[str] = []
    if len(changes) > max_files:
        warnings.append(f"files changed exceeds max-files={max_files}")
    if total_known_lines > max_lines:
        warnings.append(f"known line churn exceeds max-lines={max_lines}")
    if unknown_changes:
        warnings.append(
            "line churn is unknown for: " + ", ".join(change.path for change in unknown_changes)
        )
    if forbidden:
        warnings.append("forbidden paths touched: " + ", ".join(forbidden))

    return total_added, total_deleted, total_known_lines, unknown_changes, forbidden, warnings


def render_summary(
    changes: Sequence[Change],
    preset: str,
    max_files: int,
    max_lines: int,
    coverage: str,
    forbidden_patterns: Sequence[str],
) -> list[str]:
    total_added, total_deleted, total_known_lines, unknown_changes, _, warnings = evaluate_scope(
        changes, max_files, max_lines, forbidden_patterns
    )
    untracked_count = sum(change.source == "untracked" for change in changes)

    lines = [
        "Patch Scope Summary",
        f"- Budget preset: {preset}",
        f"- Budget: max {max_files} file(s), max {max_lines} known changed line(s)",
        f"- Files changed: {len(changes)}",
        f"- Known lines changed: {total_known_lines} (+{total_added}/-{total_deleted})",
        f"- Unknown-line files: {len(unknown_changes)}",
        f"- Untracked files included: {untracked_count}",
        f"- Coverage: {coverage}",
    ]

    if changes:
        lines.append("Paths")
        for change in changes:
            source = f" [{change.source}]"
            if change.has_known_lines:
                lines.append(f"- {change.path} (+{change.added}/-{change.deleted}){source}")
            else:
                reason = change.unknown_reason or "line counts unavailable"
                lines.append(f"- {change.path} (unknown line churn: {reason}){source}")

    lines.append("Warnings")
    if warnings:
        lines.extend(f"- {warning}" for warning in warnings)
    else:
        lines.append("- none")
    return lines


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--numstat-file",
        type=Path,
        help="Read a numstat snapshot instead of querying a Git working tree",
    )
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="Repository to inspect")
    parser.add_argument("--staged", action="store_true", help="Inspect only staged changes")
    parser.add_argument(
        "--no-untracked",
        action="store_true",
        help="Exclude untracked files from a default live inspection",
    )
    parser.add_argument(
        "--preset",
        choices=["local-fix", "staged-refactor", "custom"],
        default="custom",
        help="Apply a review budget unless explicit maximums are supplied",
    )
    parser.add_argument("--max-files", type=int)
    parser.add_argument("--max-lines", type=int)
    parser.add_argument("--forbid", action="append", default=[], help="Forbidden glob; repeatable")
    parser.add_argument(
        "--fail-on-warning",
        action="store_true",
        help="Return status 2 when any budget, unknown-line, or forbidden-path warning exists",
    )
    args = parser.parse_args(argv)

    if args.numstat_file and args.staged:
        parser.error("--staged cannot be combined with --numstat-file")
    if args.numstat_file and args.no_untracked:
        parser.error("--no-untracked cannot be combined with --numstat-file")

    preset_defaults = {
        "local-fix": (2, 80),
        "staged-refactor": (5, 200),
        "custom": (5, 200),
    }
    default_files, default_lines = preset_defaults[args.preset]
    max_files = args.max_files if args.max_files is not None else default_files
    max_lines = args.max_lines if args.max_lines is not None else default_lines
    if max_files < 0 or max_lines < 0:
        parser.error("--max-files and --max-lines must be non-negative")

    try:
        if args.numstat_file:
            changes = parse_numstat(
                args.numstat_file.read_text(encoding="utf-8-sig"), source="snapshot"
            )
            coverage = "supplied numstat snapshot only; tracked status and omitted files are unknowable"
        else:
            repo = resolve_git_root(args.repo)
            if args.staged:
                changes = parse_numstat(git_numstat(repo, staged=True), source="staged")
                coverage = "staged index only; unstaged and untracked files are outside this view"
            elif git_has_head(repo):
                changes = parse_numstat(
                    git_numstat(repo, staged=False, base="HEAD"), source="tracked"
                )
                coverage = "tracked changes against HEAD (staged and unstaged combined)"
            else:
                changes = merge_changes(
                    [
                        *parse_numstat(git_numstat(repo, staged=True), source="tracked"),
                        *parse_numstat(git_numstat(repo, staged=False), source="tracked"),
                    ]
                )
                coverage = "unborn HEAD fallback: staged and unstaged tracked churn combined"

            if not args.staged and args.no_untracked:
                coverage += "; untracked files are outside this view"
            elif not args.staged:
                changes.extend(collect_untracked(repo))
                coverage += " plus untracked files"
    except (OSError, RuntimeError, ValueError) as error:
        parser.error(str(error))

    _, _, _, _, _, warnings = evaluate_scope(changes, max_files, max_lines, args.forbid)
    print(
        "\n".join(
            render_summary(
                changes,
                args.preset,
                max_files,
                max_lines,
                coverage,
                args.forbid,
            )
        )
    )
    return 2 if args.fail_on_warning and warnings else 0


if __name__ == "__main__":
    raise SystemExit(main())
