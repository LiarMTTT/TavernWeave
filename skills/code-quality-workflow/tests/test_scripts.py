from __future__ import annotations

import contextlib
import importlib.util
import io
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType


SKILL_ROOT = Path(__file__).resolve().parents[1]


def load_script(module_name: str, filename: str) -> ModuleType:
    path = SKILL_ROOT / "scripts" / filename
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


merge = load_script("code_quality_merge_audit_reports", "merge_audit_reports.py")
scope = load_script("code_quality_check_patch_scope", "check_patch_scope.py")


def run_git(repo: Path, *arguments: str) -> None:
    subprocess.run(
        ["git", *arguments],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )


def initialize_committed_repo(repo: Path) -> Path:
    run_git(repo, "init", "-q")
    target = repo / "example.txt"
    target.write_text("base\n", encoding="utf-8")
    run_git(repo, "add", "example.txt")
    run_git(
        repo,
        "-c",
        "user.name=Scope Test",
        "-c",
        "user.email=scope@example.invalid",
        "commit",
        "-qm",
        "baseline",
    )
    return target


class MergeAuditReportsTests(unittest.TestCase):
    def test_finding_key_and_highest_severity_are_consistent(self) -> None:
        reports = [
            {
                "target": "src/parser.py",
                "mode": "full-scan",
                "findings": [
                    {
                        "severity": "P2",
                        "file": ".\\src\\parser.py",
                        "line": "042",
                        "title": "  Lost   update ",
                        "behavior": "Concurrent Save",
                        "recommendation": "Use the existing state owner",
                    },
                    {
                        "severity": "P2",
                        "file": "src/parser.py",
                        "line": 42,
                        "title": "Lost update",
                        "behavior": "Single-user overwrite",
                    },
                ],
            },
            {
                "target": "src/parser.py",
                "mode": "full-scan",
                "findings": [
                    {
                        "severity": "P1",
                        "file": "src/parser.py",
                        "line": 42,
                        "title": "lost update",
                        "behavior": "concurrent save",
                        "evidence": "The later writer replaces the earlier result",
                    }
                ],
            },
        ]

        summary = merge.merge_reports(reports)

        self.assertEqual(summary["report_count"], 2)
        self.assertEqual(summary["targets"], ["src/parser.py"])
        self.assertEqual(len(summary["findings"]), 2)
        winner = summary["findings"][0]
        self.assertEqual(winner["severity"], "P1")
        self.assertEqual(winner["evidence"], "The later writer replaces the earlier result")
        self.assertEqual(winner["recommendation"], "Use the existing state owner")
        self.assertEqual(
            merge.finding_key(reports[0]["findings"][0]),
            merge.finding_key(reports[1]["findings"][0]),
        )
        self.assertNotEqual(
            merge.finding_key(reports[0]["findings"][1]),
            merge.finding_key(reports[1]["findings"][0]),
        )

    def test_auxiliary_records_are_deduplicated(self) -> None:
        report = {
            "verification_gates": [
                {"check": "npm test", "scope": "Parser"},
                {"check": " NPM   TEST ", "scope": "parser", "note": "focused"},
            ]
        }
        summary = merge.merge_reports([report])
        self.assertEqual(len(summary["verification_gates"]), 1)
        self.assertEqual(summary["verification_gates"][0]["note"], "focused")

    def test_explicit_null_collection_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "findings.*must be an array"):
            merge.merge_reports([{"findings": None}])


class CheckPatchScopeTests(unittest.TestCase):
    def test_binary_numstat_is_unknown_and_can_fail_on_warning(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            snapshot = Path(temporary_directory) / "scope.numstat"
            snapshot.write_text(
                "2\t1\tsrc/example.py\n-\t-\tassets/logo.png\n",
                encoding="utf-8",
            )
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                result = scope.main(
                    [
                        "--numstat-file",
                        str(snapshot),
                        "--preset",
                        "local-fix",
                        "--fail-on-warning",
                    ]
                )

        rendered = output.getvalue()
        self.assertEqual(result, 2)
        self.assertIn("Known lines changed: 3 (+2/-1)", rendered)
        self.assertIn("Unknown-line files: 1", rendered)
        self.assertIn("assets/logo.png (unknown line churn", rendered)
        self.assertNotIn("assets/logo.png (+0/-0)", rendered)

    @unittest.skipUnless(shutil.which("git"), "Git is required for the integration check")
    def test_default_live_mode_includes_staged_only_changes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo = Path(temporary_directory)
            target = initialize_committed_repo(repo)
            target.write_text("base\nstaged\n", encoding="utf-8")
            run_git(repo, "add", "example.txt")

            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                result = scope.main(["--repo", str(repo)])

        rendered = output.getvalue()
        self.assertEqual(result, 0)
        self.assertIn("example.txt (+1/-0) [tracked]", rendered)
        self.assertIn("tracked changes against HEAD (staged and unstaged combined)", rendered)

    @unittest.skipUnless(shutil.which("git"), "Git is required for the integration check")
    def test_default_combines_mixed_changes_while_staged_remains_index_only(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo = Path(temporary_directory)
            target = initialize_committed_repo(repo)
            target.write_text("base\nstaged\n", encoding="utf-8")
            run_git(repo, "add", "example.txt")
            target.write_text("base\nstaged\nunstaged\n", encoding="utf-8")

            default_output = io.StringIO()
            with contextlib.redirect_stdout(default_output):
                default_result = scope.main(["--repo", str(repo)])
            staged_output = io.StringIO()
            with contextlib.redirect_stdout(staged_output):
                staged_result = scope.main(["--repo", str(repo), "--staged"])

        self.assertEqual(default_result, 0)
        self.assertEqual(staged_result, 0)
        self.assertIn("example.txt (+2/-0) [tracked]", default_output.getvalue())
        self.assertIn("example.txt (+1/-0) [staged]", staged_output.getvalue())
        self.assertIn("staged index only", staged_output.getvalue())

    @unittest.skipUnless(shutil.which("git"), "Git is required for the integration check")
    def test_working_tree_discovers_text_and_binary_untracked_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo = Path(temporary_directory)
            subprocess.run(
                ["git", "init", "-q"],
                cwd=repo,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            (repo / "notes.txt").write_text("one\ntwo\nthree", encoding="utf-8")
            (repo / "image.bin").write_bytes(b"\x89PNG\r\n\x1a\n\x00binary")
            (repo / "staged.txt").write_text("indexed\n", encoding="utf-8")
            run_git(repo, "add", "staged.txt")

            changes = {change.path: change for change in scope.collect_untracked(repo)}
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                result = scope.main(
                    ["--repo", str(repo), "--preset", "local-fix", "--fail-on-warning"]
                )

        self.assertEqual(set(changes), {"image.bin", "notes.txt"})
        self.assertEqual(changes["notes.txt"].source, "untracked")
        self.assertEqual(changes["notes.txt"].added, 3)
        self.assertTrue(changes["notes.txt"].has_known_lines)
        self.assertIsNone(changes["image.bin"].added)
        self.assertFalse(changes["image.bin"].has_known_lines)
        self.assertIn("binary", changes["image.bin"].unknown_reason or "")
        self.assertEqual(result, 2)
        self.assertIn("Untracked files included: 2", output.getvalue())
        self.assertIn("staged.txt (+1/-0) [tracked]", output.getvalue())
        self.assertIn("unborn HEAD fallback", output.getvalue())


if __name__ == "__main__":
    unittest.main()
