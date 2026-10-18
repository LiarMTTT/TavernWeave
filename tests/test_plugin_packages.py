"""Focused offline tests for the committed-source plugin packager."""

import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build-plugin-packages.py"
SPEC = importlib.util.spec_from_file_location("build_plugin_packages", SCRIPT)
packager = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(packager)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value), encoding="utf-8")


def git(repo, *args):
    return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True).stdout.decode().strip()


class PackageTests(unittest.TestCase):
    def setUp(self):
        external = os.environ.get("TW_TEST_ROOT")
        if external:
            Path(external).mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix="tw-plugin-test-", dir=external)
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.repo = self.base / "source"
        self.repo.mkdir()
        self.output = self.base / "result"
        skills = ["consult-tavernweave-library"] + [f"skill-{index:02}" for index in range(21)]
        for skill in skills:
            path = self.repo / "skills" / skill / "SKILL.md"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"# {skill}\n", encoding="utf-8")
        runtime = self.repo / "skills/consult-tavernweave-library/references/plugin-runtime.md"
        runtime.parent.mkdir(parents=True, exist_ok=True)
        runtime.write_text("Plugin runtime reference\n", encoding="utf-8")
        for name in packager.COMMON_FILES | {packager.CODEX_ONLY, "docs/plugin-guide.md", "host-adapters/map.json"}:
            path = self.repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"fixture {name}\n", encoding="utf-8")
        self.install = {
            "package": "tavernweave-agent-skills", "version": "1.9.1", "skillCount": 22,
            "skills": sorted(skills),
            "requiredPaths": ["docs/plugin-guide.md", "skills/consult-tavernweave-library/references/plugin-runtime.md"],
            "hostFrontDoor": {"version": "1.9.1", "requiredSourcePaths": ["host-adapters/map.json"]},
        }
        self.codex = {
            "name": "tavernweave-agent-skills", "version": "1.9.1", "description": "Fixture plugin",
            "author": {"name": "Fixture"}, "skills": "./skills/",
            "extensions": {"com.openai": {"onboardingSkill": "./skills/consult-tavernweave-library/SKILL.md"}},
            "interface": {"displayName": "TavernWeave", "shortDescription": "22 Skills",
                          "longDescription": "Fixture package", "developerName": "Fixture",
                          "category": "Developer Tools", "capabilities": ["Write"]},
        }
        self.claude = {"name": "tavernweave-agent-skills", "version": "1.9.1",
                       "description": "Fixture plugin", "author": {"name": "Fixture"}}
        self.save_manifests()
        git(self.repo, "init", "-q")
        self.commit()

    def save_manifests(self):
        write_json(self.repo / "tavernweave-install-manifest.json", self.install)
        write_json(self.repo / ".codex-plugin/plugin.json", self.codex)
        write_json(self.repo / ".claude-plugin/plugin.json", self.claude)

    def commit(self):
        git(self.repo, "add", "-A")
        git(self.repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "-qm", "fixture")
        return git(self.repo, "rev-parse", "HEAD")

    def test_build_uses_committed_bytes_and_separate_manifests(self):
        commit = git(self.repo, "rev-parse", "HEAD")
        (self.repo / "README.md").write_text("uncommitted replacement\n", encoding="utf-8")
        receipt = packager.build(self.repo, commit, self.output)
        self.assertEqual(receipt["sourceCommit"], commit)
        codex_zip = self.output / "TavernWeave-Codex-v1.9.1.zip"
        claude_zip = self.output / "TavernWeave-Claude-ZCode-v1.9.1.zip"
        with zipfile.ZipFile(codex_zip) as codex, zipfile.ZipFile(claude_zip) as claude:
            common = packager.ROOT + "README.md"
            self.assertEqual(codex.read(common), b"fixture README.md\n")
            self.assertEqual(claude.read(common), codex.read(common))
            self.assertIn(packager.ROOT + packager.CODEX_ONLY, codex.namelist())
            self.assertNotIn(packager.ROOT + packager.CODEX_ONLY, claude.namelist())
            self.assertIn(packager.ROOT + packager.MANIFESTS["Codex"], codex.namelist())
            self.assertNotIn(packager.ROOT + packager.MANIFESTS["Claude-ZCode"], codex.namelist())
            self.assertIn(packager.ROOT + packager.MANIFESTS["Claude-ZCode"], claude.namelist())
        marketplace = json.loads((self.output / "TavernWeave-ZCode-marketplace-v1.9.1.json").read_text(encoding="utf-8"))
        self.assertEqual(marketplace["plugins"][0]["source"]["sha256"],
                         receipt["archives"]["Claude-ZCode"]["sha256"])
        self.assertIn("/v1.9.1/", marketplace["plugins"][0]["source"]["url"])
        self.assertEqual(len((self.output / "SHA256SUMS.txt").read_text().splitlines()), 3)
        with self.assertRaisesRegex(ValueError, "already exists"):
            packager.build(self.repo, commit, self.output)

    def test_claude_plugin_components_ship_only_in_claude_zip(self):
        for name in ("hooks/hooks.json", "hooks/session-start-front-door.mjs", "agents/tavernweave.md"):
            path = self.repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"fixture {name}\n", encoding="utf-8")
        self.install["claudePlugin"] = {
            "hooks": "hooks/hooks.json", "frontDoorHook": "hooks/session-start-front-door.mjs",
            "presetAgent": "agents/tavernweave.md", "presetAgentId": "tavernweave-agent-skills:tavernweave",
        }
        self.save_manifests()
        commit = self.commit()
        packager.build(self.repo, commit, self.output)
        with zipfile.ZipFile(self.output / "TavernWeave-Codex-v1.9.1.zip") as codex, \
                zipfile.ZipFile(self.output / "TavernWeave-Claude-ZCode-v1.9.1.zip") as claude:
            for name in ("hooks/hooks.json", "agents/tavernweave.md"):
                self.assertIn(packager.ROOT + name, claude.namelist())
                self.assertNotIn(packager.ROOT + name, codex.namelist())
        self.install["claudePlugin"]["presetAgentId"] = "tavernweave-agent-skills:other"
        self.save_manifests()
        commit = self.commit()
        with self.assertRaisesRegex(ValueError, "preset agent id"):
            packager.build(self.repo, commit, self.base / "agent-id-drift")

    def test_skill_inventory_scales_and_rejects_manifest_drift(self):
        added = "worldbook-design-and-writing"
        target = self.repo / "skills" / added / "SKILL.md"
        target.parent.mkdir(parents=True)
        target.write_text("# Worldbook design and writing\n", encoding="utf-8")
        self.install["skills"] = sorted(self.install["skills"] + [added])
        self.install["skillCount"] = len(self.install["skills"])
        self.save_manifests()
        commit = self.commit()
        receipt = packager.build(self.repo, commit, self.output)
        self.assertEqual(receipt["skillCount"], 23)
        self.assertIn("23 native Skills", receipt["checks"])
        self.install["skillCount"] = 22
        self.save_manifests()
        commit = self.commit()
        with self.assertRaisesRegex(ValueError, "declared Skills do not match"):
            packager.build(self.repo, commit, self.base / "drift-result")

    def test_rejects_unsafe_and_colliding_paths(self):
        for name in ("/absolute", "C:/absolute", "a//b", "a/../b", "a\\b", "a/./b", "/".join(["p"] * 21)):
            with self.subTest(name=name), self.assertRaises(ValueError):
                packager.safe_member(name, set())
        seen = set()
        packager.safe_member("Root/É.txt", seen)
        with self.assertRaisesRegex(ValueError, "collision"):
            packager.safe_member("root/e\u0301.TXT", seen)

    def test_rejects_missing_declared_dependency(self):
        self.install["requiredPaths"].append("docs/forgotten.md")
        self.save_manifests()
        commit = self.commit()
        with self.assertRaisesRegex(ValueError, "declared path missing"):
            packager.build(self.repo, commit, self.output)
        self.assertFalse(self.output.exists())

    def test_rejects_manifest_version_or_identity_drift(self):
        self.claude["version"] = "1.9.0"
        self.save_manifests()
        commit = self.commit()
        with self.assertRaisesRegex(ValueError, "identity or version mismatch"):
            packager.build(self.repo, commit, self.output)

    def test_rejects_output_inside_source(self):
        with self.assertRaisesRegex(ValueError, "outside source checkout"):
            packager.build(self.repo, "HEAD", self.repo / "build" / "plugin")
        self.assertFalse((self.repo / "build").exists())

    def test_detects_archive_byte_mismatch(self):
        commit = git(self.repo, "rev-parse", "HEAD")
        _commit, _tracked, selected = packager.committed_files(self.repo, commit)
        contents = packager.read_blobs(self.repo, selected)
        names = set(selected) - {packager.MANIFESTS["Claude-ZCode"]}
        broken = self.base / "broken.zip"
        stamp = (2026, 10, 13, 0, 0, 0)
        packager.write_zip(broken, names, contents, selected, stamp)
        replacement = self.base / "replacement.zip"
        with zipfile.ZipFile(broken) as original, zipfile.ZipFile(replacement, "w") as target:
            for info in original.infolist():
                data = original.read(info)
                if info.filename == packager.ROOT + "README.md":
                    data = b"tampered\n"
                target.writestr(info, data)
        with self.assertRaisesRegex(ValueError, "byte mismatch"):
            packager.verify_zip(replacement, names, contents, selected)


if __name__ == "__main__":
    unittest.main()
