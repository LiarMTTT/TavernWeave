"""Focused standard-library tests for upstream sync verification and review."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "upstream_sync.py"
spec = importlib.util.spec_from_file_location("upstream_sync", SCRIPT)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


def git(repo, *args, input=None):
    return subprocess.run(["git", "-C", str(repo), *args], check=True,
                          capture_output=True, text=True, input=input).stdout.strip()


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def make_review_repo(root):
    write(root / "skills/shared/SKILL.md", "Shared workflow\n")
    write(root / "LICENSE", "base license\n")
    write(root / "THIRD_PARTY_NOTICES.md", "upstream notices\n")
    ext = root / "extensions/yuri-creation"
    write(ext / "hosts/native.json", json.dumps({"entry_points": {"yuri-card-creator": {}, "adapt-yuri-card": {}}}))
    for name in ("yuri-card-creator", "adapt-yuri-card"):
        write(ext / "skills" / name / "SKILL.md", "canonical\n")
    foreverse = b"# pinned exporter\n"
    vendor = ext / "skills/yuri-card-creator/scripts/vendor/card_md_to_st.py"
    vendor.parent.mkdir(parents=True)
    vendor.write_bytes(foreverse)
    upstream_names = ["shared", "tavern-card-builder", "build-work-library"]
    write(root / "tavernweave-install-manifest.json", json.dumps({"skills": upstream_names, "skillCount": len(upstream_names), "version": "2.4.0"}))
    write(root / "skills/tavern-card-builder/SKILL.md", "upstream skill\n")
    write(root / "skills/tavern-card-builder/references/authoring-workflow.md", "guide\n")
    write(root / "skills/build-work-library/scripts/work_library.py", "pass\n")
    write(root / "scripts/build-plugin-packages.py", "pass\n")
    git(root, "init", "-q")
    git(root, "config", "user.email", "test@example.invalid")
    git(root, "config", "user.name", "Test")
    git(root, "add", ".")
    git(root, "commit", "-qm", "origin")
    write(root / "skills/tavern-card-builder/SKILL.md", "upstream baseline skill\n")
    git(root, "add", "skills/tavern-card-builder/SKILL.md")
    git(root, "commit", "-qm", "baseline")
    base = git(root, "rev-parse", "HEAD")
    modules = [{"path": path, "blob": git(root, "rev-parse", f"HEAD:{path}")}
               for path in ("skills/tavern-card-builder/SKILL.md", "skills/tavern-card-builder/references/authoring-workflow.md")]

    def pin(path):
        return {"repository": "local", "commit": base, "path": path,
                "git_blob": git(root, "rev-parse", f"HEAD:{path}"), "license": "test"}

    pins = {
        "tavernweave": {"repository": "local", "commit": base, "modules": modules, "version": "2.4.0"},
        "source_library": pin("skills/build-work-library/scripts/work_library.py"),
        "host_packager": pin("scripts/build-plugin-packages.py"),
        "foreverse": {"repository": "local", "path": "tools/card_md_to_st.py", "git_blob": sync.blob(foreverse)},
    }
    rendered = json.dumps(pins, sort_keys=True)
    write(ext / "UPSTREAM.json", rendered)
    write(ext / "skills/yuri-card-creator/assets/upstream.json", rendered)
    # These wrappers are a local addition and are intentionally outside the pinned baseline.
    for name in ("yuri-card-creator", "adapt-yuri-card"):
        write(root / "skills" / name / "SKILL.md", "wrapper\n")
    return base


class UpstreamSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        self.base = make_review_repo(self.root)

    def tearDown(self):
        self.temp.cleanup()

    def candidate(self, relation):
        base = self.base
        if relation == "same":
            return base
        git(self.root, "checkout", "-qb", "candidate", base)
        write(self.root / "candidate-doc.md", "candidate\n")
        git(self.root, "add", "candidate-doc.md")
        git(self.root, "commit", "-qm", "candidate doc")
        if relation == "ahead":
            return git(self.root, "rev-parse", "HEAD")
        git(self.root, "checkout", "-qb", "other", base + "^")
        write(self.root / "other-doc.md", "other\n")
        git(self.root, "add", "other-doc.md")
        git(self.root, "commit", "-qm", "other commit")
        return git(self.root, "rev-parse", "HEAD") if relation == "diverged" else git(self.root, "rev-parse", base + "^")

    def test_verify_checks_mirror_blobs_subtree_and_counts(self):
        result = sync.verify(self.root)
        self.assertTrue(result["pins_valid"], result["errors"])
        self.assertEqual(result["integrated_commit"], self.base)
        self.assertEqual(result["counts"], {
            "canonical_yuri_workflows": 2, "yuri_discovery_wrappers": 2,
            "upstream_dependency_entries": 3, "packaged_discoverable_entries": 5,
        })

    def test_integrated_drift_blocks_review(self):
        ext = self.root / "extensions/yuri-creation"
        for drift in ("mirror", "subtree", "vendor", "version"):
            with self.subTest(drift=drift):
                if drift == "mirror":
                    write(ext / "skills/yuri-card-creator/assets/upstream.json", "{}")
                elif drift == "subtree":
                    write(self.root / "skills/shared/SKILL.md", "changed\n")
                elif drift == "vendor":
                    write(ext / "skills/yuri-card-creator/scripts/vendor/card_md_to_st.py", "changed\n")
                else:
                    pins_path = ext / "UPSTREAM.json"
                    pins = json.loads(pins_path.read_text())
                    pins["tavernweave"]["version"] = "9.9.9"
                    rendered = json.dumps(pins, sort_keys=True)
                    write(pins_path, rendered)
                    write(ext / "skills/yuri-card-creator/assets/upstream.json", rendered)
                result = sync.review(self.root, "HEAD")
                self.assertFalse(result["verification"]["pins_valid"])
                self.assertEqual(result["decision"], "repair_integrated_pins_before_sync")
                self.assertFalse(result["pins_updated"])
                # Restore each mutation so each subcase exercises one fault only.
                self.tearDown()
                self.setUp()
                ext = self.root / "extensions/yuri-creation"

    def test_review_history_and_read_only_behavior(self):
        for relation in ("same", "ahead", "behind", "diverged"):
            with self.subTest(relation=relation):
                target = self.candidate(relation)
                before = (self.root / "extensions/yuri-creation/UPSTREAM.json").read_bytes()
                result = sync.review(self.root, target)
                self.assertEqual(result["history_relation"], relation)
                self.assertEqual(result["candidate_upstream_version"], "2.4.0")
                self.assertFalse(result["candidate_code_executed"])
                self.assertFalse(result["pins_updated"])
                self.assertEqual((self.root / "extensions/yuri-creation/UPSTREAM.json").read_bytes(), before)
                self.tearDown()
                self.setUp()

    def test_review_classifies_scripts_shared_skills_and_host_infrastructure(self):
        git(self.root, "checkout", "-qb", "candidate")
        for path in ("scripts/new.py", "skills/shared/NEW.md", "host-adapters/new.md"):
            write(self.root / path, "candidate change\n")
        git(self.root, "add", ".")
        git(self.root, "commit", "-qm", "classified changes")
        result = sync.review(self.root, "HEAD")
        self.assertEqual(result["history_relation"], "ahead")
        self.assertGreaterEqual({row["category"] for row in result["changes"]},
                                {"shared_scripts", "shared_skills", "host_infrastructure"})


class SourceChannelTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        git(self.root, "init", "-q")
        git(self.root, "config", "user.email", "test@example.invalid")
        git(self.root, "config", "user.name", "Test")
        write(self.root / "source.txt", "baseline\n")
        git(self.root, "add", ".")
        git(self.root, "commit", "-qm", "source baseline")
        self.baseline = git(self.root, "rev-parse", "HEAD")
        write(self.root / "source.txt", "release source\n")
        git(self.root, "commit", "-qam", "release source")
        self.source = git(self.root, "rev-parse", "HEAD")

    def tearDown(self):
        self.temp.cleanup()

    def receipt(self, subject="Publish Yuri v1.0.0 to yuri-dev [skip ci]", changed=False, second_parent=None):
        # Make a distinct first parent with the same baseline tree, then create
        # the exact two-parent source publication receipt under review.
        tree = git(self.root, "rev-parse", self.baseline + "^{tree}")
        first_parent = git(self.root, "commit-tree", tree, "-p", self.baseline, input="dev channel history\n")
        receipt_tree = tree
        if changed:
            write(self.root / "changed.txt", "unreviewed\n")
            git(self.root, "add", ".")
            git(self.root, "commit", "-qm", "unique channel change")
            receipt_tree = git(self.root, "rev-parse", "HEAD^{tree}")
        return git(self.root, "commit-tree", receipt_tree, "-p", first_parent, "-p", second_parent or self.baseline,
                   input=subject + "\n\n")

    def test_source_channel_accepts_ancestor_or_unchanged_receipt(self):
        self.assertEqual(sync.check_source_channel(self.root, self.baseline, self.source, "yuri-dev"), "ancestor")
        old = self.receipt()
        self.assertEqual(sync.check_source_channel(self.root, old, self.source, "yuri-dev"), "unchanged_source_sync")

    def test_source_channel_rejects_unique_changed_wrong_branch_and_foreign_baseline(self):
        invalid = [
            (self.receipt(changed=True), "yuri-dev"),
            (self.receipt("ordinary unique development commit"), "yuri-dev"),
            (self.receipt("Publish Yuri v1.0.0 to other-branch [skip ci]"), "yuri-dev"),
        ]
        foreign = git(self.root, "commit-tree", git(self.root, "rev-parse", self.baseline + "^{tree}"),
                      "-p", self.baseline, input="foreign baseline\n")
        invalid.append((self.receipt(second_parent=foreign), "yuri-dev"))
        for old, branch in invalid:
            with self.subTest(old=old, branch=branch), self.assertRaises(ValueError):
                sync.check_source_channel(self.root, old, self.source, branch)


if __name__ == "__main__":
    unittest.main()
