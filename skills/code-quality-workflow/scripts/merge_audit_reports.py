#!/usr/bin/env python3
"""Merge structured code-quality audit reports into deterministic JSON or Markdown."""

from __future__ import annotations

import argparse
import json
import re
from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import Any


SEVERITY_RANK = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def normalize_text(value: Any) -> str:
    """Collapse whitespace and case-fold text used in non-path keys."""

    return " ".join(str(value or "").split()).casefold()


def normalize_file(value: Any) -> str:
    """Normalize report path spelling without changing path case."""

    normalized = str(value or "").strip().replace("\\", "/")
    normalized = re.sub(r"/{2,}", "/", normalized)
    while normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def normalize_line(value: Any) -> str:
    """Canonicalize numeric lines while retaining non-numeric locations."""

    text = " ".join(str(value or "").split())
    if re.fullmatch(r"[+-]?\d+", text):
        return str(int(text))
    return text


def finding_key(finding: dict[str, Any]) -> tuple[str, str, str, str]:
    """Return the documented (file, line, title, behavior) deduplication key."""

    return (
        normalize_file(finding.get("file")),
        normalize_line(finding.get("line")),
        normalize_text(finding.get("title")),
        normalize_text(finding.get("behavior")),
    )


def severity_rank(finding: dict[str, Any]) -> int:
    return SEVERITY_RANK.get(str(finding.get("severity", "")).upper(), 99)


def missing(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def merge_missing(primary: dict[str, Any], secondary: dict[str, Any]) -> dict[str, Any]:
    """Keep primary values and fill only absent or empty fields from secondary."""

    merged = dict(primary)
    for key, value in secondary.items():
        if key not in merged or missing(merged[key]):
            merged[key] = value
    return merged


def better_finding(current: dict[str, Any], candidate: dict[str, Any]) -> dict[str, Any]:
    """Keep the higher-severity duplicate, preserving useful missing fields."""

    if severity_rank(candidate) < severity_rank(current):
        return merge_missing(candidate, current)
    return merge_missing(current, candidate)


def require_object_collection(report: dict[str, Any], field: str) -> list[dict[str, Any]]:
    if field not in report:
        return []
    raw = report[field]
    if not isinstance(raw, list):
        raise ValueError(f"report field {field!r} must be an array")

    result: list[dict[str, Any]] = []
    for index, item in enumerate(raw):
        if not isinstance(item, dict):
            raise ValueError(f"report field {field!r}[{index}] must be an object")
        result.append(dict(item))
    return result


def iter_report_paths(paths: Iterable[Path]) -> Iterable[Path]:
    seen: set[Path] = set()
    for path in paths:
        candidates = sorted(path.glob("*.json")) if path.is_dir() else [path]
        for candidate in candidates:
            resolved = candidate.resolve()
            if resolved not in seen:
                seen.add(resolved)
                yield candidate


def load_reports(paths: Iterable[Path]) -> list[dict[str, Any]]:
    reports: list[dict[str, Any]] = []
    for path in iter_report_paths(paths):
        try:
            value = json.loads(path.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as error:
            raise ValueError(f"invalid JSON in {path}: {error}") from error
        if not isinstance(value, dict):
            raise ValueError(f"report {path} must contain a JSON object")
        reports.append(value)
    return reports


def auxiliary_key(record: dict[str, Any], fields: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(normalize_text(record.get(field)) for field in fields)


def deduplicate_records(
    records: Iterable[dict[str, Any]], fields: tuple[str, ...]
) -> list[dict[str, Any]]:
    """Deduplicate auxiliary records in first-occurrence order."""

    result: list[dict[str, Any]] = []
    positions: dict[tuple[str, ...], int] = {}
    for record in records:
        key = auxiliary_key(record, fields)
        if key in positions:
            index = positions[key]
            result[index] = merge_missing(result[index], record)
        else:
            positions[key] = len(result)
            result.append(dict(record))
    return result


def append_unique_path(values: list[str], seen: set[str], value: Any) -> None:
    rendered = str(value or "").strip()
    if not rendered:
        return
    key = normalize_file(rendered)
    if key not in seen:
        seen.add(key)
        values.append(rendered)


def finding_sort_key(finding: dict[str, Any]) -> tuple[Any, ...]:
    normalized = finding_key(finding)
    line = normalized[1]
    try:
        line_key: tuple[int, Any] = (0, int(line))
    except ValueError:
        line_key = (1, line)
    return (
        severity_rank(finding),
        normalized[0],
        line_key,
        normalized[2],
        normalized[3],
    )


def merge_reports(reports: Iterable[dict[str, Any]]) -> dict[str, Any]:
    report_list = list(reports)
    findings_by_key: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    refactor_signals: list[dict[str, Any]] = []
    slimming_themes: list[dict[str, Any]] = []
    verification_gates: list[dict[str, Any]] = []
    optimization_handoffs: list[dict[str, Any]] = []
    targets: list[str] = []
    target_keys: set[str] = set()
    modes: set[str] = set()

    for report in report_list:
        target = report.get("target")
        if target is not None:
            append_unique_path(targets, target_keys, target)

        mode = str(report.get("mode", "")).strip()
        if mode:
            modes.add(mode)

        for finding in require_object_collection(report, "findings"):
            key = finding_key(finding)
            if key in findings_by_key:
                findings_by_key[key] = better_finding(findings_by_key[key], finding)
            else:
                findings_by_key[key] = finding

        refactor_signals.extend(require_object_collection(report, "refactor_signals"))
        slimming_themes.extend(require_object_collection(report, "slimming_themes"))
        verification_gates.extend(require_object_collection(report, "verification_gates"))
        optimization_handoffs.extend(require_object_collection(report, "optimization_handoffs"))

    return {
        "report_count": len(report_list),
        "modes": sorted(modes),
        "targets": targets,
        "findings": sorted(findings_by_key.values(), key=finding_sort_key),
        "refactor_signals": deduplicate_records(
            refactor_signals, ("module", "threshold", "evidence")
        ),
        "slimming_themes": deduplicate_records(
            slimming_themes, ("pattern", "occurrences", "suggested_handling")
        ),
        "verification_gates": deduplicate_records(
            verification_gates, ("check", "scope")
        ),
        "optimization_handoffs": deduplicate_records(
            optimization_handoffs,
            ("module", "evidence", "threshold", "suggested_gate_mode"),
        ),
    }


def to_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Audit Sweep Summary",
        "",
        f"- Reports: {summary['report_count']}",
        f"- Modes: {', '.join(summary['modes']) or 'unknown'}",
        f"- Targets: {len(summary['targets'])}",
        "",
        "## Top Findings",
    ]

    if not summary["findings"]:
        lines.append("- No findings reported.")
    for finding in summary["findings"]:
        location = str(finding.get("file", ""))
        line = finding.get("line")
        if line not in (None, ""):
            location = f"{location}:{line}"
        lines.append(
            f"- [{finding.get('severity', 'P3')}] {location} "
            f"{finding.get('title', '')}".rstrip()
        )
        for label, field in (
            ("Behavior", "behavior"),
            ("Evidence", "evidence"),
            ("Risk", "risk"),
            ("Recommendation", "recommendation"),
            ("Verification", "verification"),
        ):
            if finding.get(field):
                lines.append(f"  {label}: {finding[field]}")

    lines.extend(["", "## Refactor Gate Candidates"])
    if not summary["refactor_signals"]:
        lines.append("- No refactor signals reported.")
    for signal in summary["refactor_signals"]:
        lines.append(
            f"- {signal.get('module', 'unknown module')}: "
            f"{signal.get('threshold', 'threshold not stated')}"
        )
        if signal.get("evidence"):
            lines.append(f"  Evidence: {signal['evidence']}")

    lines.extend(["", "## Slimming Themes"])
    if not summary["slimming_themes"]:
        lines.append("- No slimming themes reported.")
    for theme in summary["slimming_themes"]:
        lines.append(
            f"- {theme.get('pattern', 'unknown pattern')}: "
            f"{theme.get('occurrences', 'unknown')} occurrence(s)"
        )
        if theme.get("suggested_handling"):
            lines.append(f"  Suggested handling: {theme['suggested_handling']}")

    lines.extend(["", "## Verification Gates"])
    if not summary["verification_gates"]:
        lines.append("- No verification gates reported.")
    for gate in summary["verification_gates"]:
        lines.append(
            f"- {gate.get('check', 'check not stated')}: "
            f"{gate.get('scope', 'scope not stated')}"
        )

    lines.extend(["", "## Optimization Handoffs"])
    if not summary["optimization_handoffs"]:
        lines.append("- No optimization handoffs reported.")
    for handoff in summary["optimization_handoffs"]:
        lines.append(
            f"- {handoff.get('module', 'unknown module')}: "
            f"{handoff.get('suggested_gate_mode', 'gate mode not stated')}"
        )
        for label, field in (
            ("Evidence", "evidence"),
            ("Behavior contract", "behavior_contract_hints"),
            ("Patch budget", "patch_budget"),
            ("Pre-change baseline", "pre_change_baseline"),
            ("Verification", "verification_gate"),
            ("Deletion safety", "deletion_safety"),
            ("Forbidden scope", "forbidden_scope"),
        ):
            if handoff.get(field):
                lines.append(f"  {label}: {handoff[field]}")

    return "\n".join(lines) + "\n"


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reports", nargs="+", type=Path, help="JSON report files or directories")
    parser.add_argument("--format", choices=["json", "markdown"], default="markdown")
    args = parser.parse_args(argv)

    try:
        summary = merge_reports(load_reports(args.reports))
    except (OSError, ValueError) as error:
        parser.error(str(error))

    if args.format == "json":
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(to_markdown(summary), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
