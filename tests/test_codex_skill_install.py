"""Portable installation contracts; all writes stay inside temporary fixtures."""

import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/install-codex-skills.py"
SPEC = importlib.util.spec_from_file_location("codex_skill_install", SCRIPT)
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)


class InstallTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="tw-codex-install-", dir=os.environ.get("TW_TEST_ROOT"))
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / "source"
        self.target = self.root / "project with spaces" / ".agents" / "skills"
        self.names = ["one", "two"]
        for name in self.names:
            folder = self.source / "skills" / name
            (folder / "references").mkdir(parents=True)
            (folder / "SKILL.md").write_text(f"---\nname: {name}\ndescription: Test {name}\n---\n", encoding="utf-8")
            (folder / "references" / "sample.txt").write_text(f"resource {name}\n", encoding="utf-8")
        self.manifest = {
            "version": "2.3.0", "skills": self.names, "skillCount": 2,
            "requiredPaths": ["skills/one/references/sample.txt"],
        }
        self.save_manifest()

    def save_manifest(self):
        (self.source / "tavernweave-install-manifest.json").write_text(json.dumps(self.manifest), encoding="utf-8")

    def install(self, **options):
        return installer.operate(self.source, self.target, **options)

    def test_preview_and_missing_verify_write_nothing(self):
        before = sorted(str(p.relative_to(self.root)) for p in self.root.rglob("*"))
        self.assertEqual(self.install()["status"], "preview")
        self.assertEqual(self.install(verify=True)["status"], "verification-failed")
        self.assertEqual(before, sorted(str(p.relative_to(self.root)) for p in self.root.rglob("*")))

    def test_complete_install_verify_and_idempotency(self):
        result = self.install(apply=True)
        self.assertEqual(result["matchedSkills"], 2)
        self.assertIsNone(result["backup"])
        self.assertEqual(result["hostDiscovery"], "not-verified")
        self.assertEqual(self.install(verify=True)["status"], "verified")
        original_mtime = (self.target / "one/SKILL.md").stat().st_mtime_ns
        self.assertEqual(self.install(apply=True)["status"], "unchanged")
        self.assertEqual((self.target / "one/SKILL.md").stat().st_mtime_ns, original_mtime)
        self.assertEqual(sorted(p.name for p in self.target.parent.iterdir()), ["skills"])

    def test_changed_skills_require_replace_and_backup_is_outside_scan(self):
        self.install(apply=True)
        user_file = self.target / "one/references/sample.txt"
        user_file.write_text("local edits", encoding="utf-8")
        unrelated = self.target / "my-private-skill"
        unrelated.mkdir()
        (unrelated / "SKILL.md").write_text("leave me", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "--replace"):
            self.install(apply=True)
        self.assertEqual(user_file.read_text(), "local edits")
        result = self.install(apply=True, replace=True)
        backup = Path(result["backup"])
        self.assertNotIn(self.target, backup.parents)
        self.assertEqual((backup / "one/references/sample.txt").read_text(), "local edits")
        self.assertEqual((unrelated / "SKILL.md").read_text(), "leave me")
        self.assertEqual(self.install(verify=True)["status"], "verified")

    def test_restore_existing_tree_after_partial_swap_failure(self):
        self.install(apply=True)
        for name in self.names:
            (self.target / name / "SKILL.md").write_text(f"old {name}", encoding="utf-8")
        rename = Path.rename

        def fail_second_stage(path, target):
            if path.parent.name == "stage" and path.name == "two":
                raise OSError("simulated rename failure")
            return rename(path, target)

        with mock.patch.object(Path, "rename", fail_second_stage):
            with self.assertRaisesRegex(OSError, "simulated"):
                self.install(apply=True, replace=True)
        for name in self.names:
            self.assertEqual((self.target / name / "SKILL.md").read_text(), f"old {name}")
        self.assertEqual(sorted(p.name for p in self.target.parent.iterdir()), ["skills"])

    def test_concurrent_changed_content_is_not_replaced(self):
        self.install(apply=True)
        user_file = self.target / "one/SKILL.md"
        user_file.write_text("old edit", encoding="utf-8")
        copytree = shutil.copytree

        def edit_during_stage(*args, **kwargs):
            result = copytree(*args, **kwargs)
            user_file.write_text("new concurrent edit", encoding="utf-8")
            return result

        with mock.patch.object(installer.shutil, "copytree", edit_during_stage):
            with self.assertRaisesRegex(ValueError, "changed while staging"):
                self.install(apply=True, replace=True)
        self.assertEqual(user_file.read_text(), "new concurrent edit")

    def test_cleanup_failure_reports_installed_state_and_retained_backup(self):
        self.install(apply=True)
        (self.target / "one/SKILL.md").write_text("old one", encoding="utf-8")
        rmtree = shutil.rmtree

        def fail_stage_cleanup(path, *args, **kwargs):
            if Path(path).name == "stage":
                raise OSError("simulated cleanup failure")
            return rmtree(path, *args, **kwargs)

        with mock.patch.object(installer.shutil, "rmtree", fail_stage_cleanup):
            result = self.install(apply=True, replace=True)
        self.assertEqual(result["status"], "installed-with-cleanup-warning")
        self.assertTrue(Path(result["retainedWorkDirectory"]).is_dir())
        self.assertEqual((Path(result["backup"]) / "one/SKILL.md").read_text(), "old one")
        self.assertEqual(self.install(verify=True)["status"], "verified")

    def test_reject_source_target_wrong_name_and_non_directory_collision(self):
        for target in (self.source / "skills", self.source / "nested/skills", self.root, self.root / "not-skills"):
            with self.subTest(target=target), self.assertRaises(ValueError):
                installer.operate(self.source, target, apply=True)
        self.target.mkdir(parents=True)
        (self.target / "one").write_text("not a directory")
        with self.assertRaisesRegex(ValueError, "not a directory"):
            self.install(apply=True, replace=True)

    def test_reject_manifest_traversal_count_and_required_resource_drift(self):
        cases = [
            {"skills": ["../escape", "two"]},
            {"skillCount": 3},
            {"requiredPaths": ["skills/../outside"]},
            {"requiredPaths": ["skills/one/missing.txt"]},
        ]
        initial = self.manifest.copy()
        for change in cases:
            self.manifest = {**initial, **change}
            self.save_manifest()
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.install(apply=True)
            self.assertFalse(self.target.exists())

    def test_reject_symlinked_parent_and_skill(self):
        real = self.root / "real"
        real.mkdir()
        link = self.root / "linked"
        try:
            link.symlink_to(real, target_is_directory=True)
        except (OSError, NotImplementedError):
            self.skipTest("This platform cannot create symlinks in the fixture")
        with self.assertRaisesRegex(ValueError, "Linked path"):
            installer.operate(self.source, link / "skills", apply=True)
        self.target.mkdir(parents=True)
        (self.target / "one").symlink_to(self.source / "skills/one", target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "Linked path"):
            self.install(apply=True, replace=True)

    def test_cli_verify_exit_status(self):
        command = [sys.executable, str(SCRIPT), "--plugin-root", str(self.source), "--target", str(self.target), "--verify"]
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 1)
        self.install(apply=True)
        result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["status"], "verified")


class RepositoryContracts(unittest.TestCase):
    def test_all_entrypoint_resources_resolve_inside_the_installed_skills_tree(self):
        source, manifest, hashes = installer.source_inventory(ROOT)
        self.assertEqual(len(hashes), manifest["skillCount"])
        skills = source / "skills"
        for name in hashes:
            entry = skills / name / "SKILL.md"
            text = entry.read_text(encoding="utf-8")
            self.assertRegex(text, rf"\A---\nname: {re.escape(name)}\n")
            ui = (skills / name / "agents/openai.yaml").read_text(encoding="utf-8")
            self.assertIn(f"${name}", ui)
            for link in re.findall(r"\]\(([^)\s]+)(?:\s+[^)]*)?\)", text):
                parsed = urlsplit(link)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                target = (entry.parent / unquote(parsed.path)).resolve()
                self.assertIn(skills, target.parents, f"{entry}: escapes skills-only installation: {link}")
                self.assertTrue(target.exists(), f"{entry}: missing resource: {link}")

    def test_skill_only_install_retains_sibling_resources_and_runs_router(self):
        with tempfile.TemporaryDirectory(prefix="tw-codex-full-", dir=os.environ.get("TW_TEST_ROOT")) as temp:
            base = Path(temp).resolve()
            target = base / ".agents/skills"
            result = installer.operate(ROOT, target, apply=True)
            self.assertEqual(result["matchedSkills"], 23)
            if shutil.which("node"):
                query = subprocess.run([
                    "node", str(target / "consult-tavernweave-library/scripts/query-library.mjs"),
                    "--skill", "tavern-card-builder", "--intent", "rolecard", "--limit", "1",
                ], cwd=base, capture_output=True, text=True, encoding="utf-8")
                self.assertEqual(query.returncode, 0, query.stderr)
                self.assertIn("tavern-card-builder", query.stdout)
                policy = subprocess.run([
                    "node", "--test", str(target / "rewrite-natural-prose/tests/policy.test.mjs"),
                ], cwd=base, capture_output=True, text=True, encoding="utf-8")
                self.assertEqual(policy.returncode, 0, policy.stdout + policy.stderr)


if __name__ == "__main__":
    unittest.main()
