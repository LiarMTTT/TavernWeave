#!/usr/bin/env python3
"""MIT read-only upstream review and integrated-pin verification.

Fetch upstream explicitly before review. This helper never fetches, imports,
updates pins, copies a tree, or runs candidate code.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

EXT = "extensions/yuri-creation"


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    if result.returncode:
        raise ValueError(result.stderr.decode("utf-8", "replace").strip() or "Git operation failed")
    return result.stdout


def resolve(repo, ref):
    return git(repo, "rev-parse", "--verify", "--end-of-options", ref + "^{commit}").decode().strip()


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def oid(repo, ref, path):
    return git(repo, "rev-parse", ref + ":" + path).decode().strip()


def blob(raw):
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()


def verify(repo):
    repo = Path(repo).resolve()
    pins = read(repo / EXT / "UPSTREAM.json")
    mirror = read(repo / EXT / "skills/yuri-card-creator/assets/upstream.json")
    errors = []
    if pins != mirror:
        errors.append("Authoring asset and UPSTREAM.json differ; update the complete lock pair together")
    base = resolve(repo, pins["tavernweave"]["commit"])
    modules = list(pins["tavernweave"]["modules"])
    for key in ("source_library", "host_packager"):
        pin = pins[key]
        if pin["commit"] != base:
            errors.append(key + " commit differs from integrated TavernWeave baseline")
        modules.append({"path": pin["path"], "blob": pin["git_blob"]})
    for module in modules:
        path = module["path"]
        if oid(repo, base, path) != module["blob"]:
            errors.append("Pinned blob does not belong to baseline: " + path)
        local = repo / path
        if not local.is_file() or blob(local.read_bytes()) != module["blob"]:
            errors.append("Integrated file differs from pin: " + path)
    skills = git(repo, "ls-tree", "--name-only", base + ":skills").decode().splitlines()
    # Inspect the working tree, including uncommitted changes, without executing it.
    protected = ["LICENSE", "THIRD_PARTY_NOTICES.md", *["skills/" + name for name in skills]]
    changed = git(repo, "diff", "--name-only", base, "--", *protected).decode().splitlines()
    errors.extend("Reviewed base resource changed: " + path for path in changed)
    untracked = git(repo, "ls-files", "--others", "--exclude-standard", "--", *protected).decode().splitlines()
    errors.extend("Unreviewed base resource added: " + path for path in untracked)
    for path in protected:
        if not (repo / path).exists():
            errors.append("Missing base resource: " + path)
    vendor = repo / EXT / "skills/yuri-card-creator/scripts/vendor/card_md_to_st.py"
    if not vendor.is_file() or blob(vendor.read_bytes()) != pins["foreverse"]["git_blob"]:
        errors.append("Vendored Foreverse exporter differs from its independent pin")
    entries = sorted(read(repo / EXT / "hosts/native.json")["entry_points"])
    manifest = read(repo / "tavernweave-install-manifest.json")
    baseline_manifest = json.loads(git(repo, "show", base + ":tavernweave-install-manifest.json"))
    baseline_version = baseline_manifest.get("version")
    if baseline_version and (pins["tavernweave"].get("version") != baseline_version or manifest.get("version") != baseline_version):
        errors.append("Upstream version metadata differs from the pinned baseline; keep product version separate")
    if sorted(manifest["skills"]) != sorted(skills) or manifest["skillCount"] != len(skills):
        errors.append("Declared upstream skill inventory differs from baseline")
    if set(skills) & set(entries):
        errors.append("Yuri discovery names collide with upstream dependencies")
    for name in entries:
        for path in (repo / EXT / "skills" / name / "SKILL.md", repo / "skills" / name / "SKILL.md"):
            if not path.is_file():
                errors.append("Missing canonical workflow or discovery wrapper: " + str(path.relative_to(repo)))
    return {"schema": "yuri/upstream-verification/v1", "integrated_commit": base,
            "upstream_version": pins["tavernweave"].get("version"),
            "counts": {"canonical_yuri_workflows": len(entries), "yuri_discovery_wrappers": len(entries),
                       "upstream_dependency_entries": len(skills), "packaged_discoverable_entries": len(skills) + len(entries)},
            "pins_valid": not errors, "errors": errors,
            "limit": "File and declared-pin verification; not semantic or live-host acceptance"}


def category(path):
    if path in ("LICENSE", "THIRD_PARTY_NOTICES.md") or "LICENSE" in path:
        return "licensing"
    if path.startswith("skills/"):
        return "shared_skills"
    if path.startswith("scripts/"):
        return "shared_scripts"
    if path.startswith(("host-adapters/", ".github/", ".codex", ".claude", "agents/", "hooks/", "rules/")) or path in ("tavernweave-install-manifest.json", "package.json", "gemini-extension.json"):
        return "host_infrastructure"
    return "documentation_and_other"


def check_source_channel(repo, old, source, branch):
    """Allow normal ancestry or an unchanged prior source-sync receipt only."""
    common = git(repo, "merge-base", old, source).decode().strip()
    if common == old:
        return "ancestor"
    parents = git(repo, "show", "-s", "--format=%P", old).decode().split()
    subject = git(repo, "show", "-s", "--format=%s", old).decode().strip()
    if len(parents) != 2 or not subject.startswith("Publish Yuri ") or not subject.endswith(" to " + branch + " [skip ci]"):
        raise ValueError("Review unique source-channel history: " + branch)
    baseline = parents[-1]
    if git(repo, "rev-parse", old + "^{tree}") != git(repo, "rev-parse", baseline + "^{tree}"):
        raise ValueError("Preserve unique source-channel changes: " + branch)
    if git(repo, "merge-base", baseline, source).decode().strip() != baseline:
        raise ValueError("Prior source-channel baseline is outside the release ancestry: " + branch)
    return "unchanged_source_sync"


def review(repo, candidate):
    repo = Path(repo).resolve()
    verification = verify(repo)
    base, target = verification["integrated_commit"], resolve(repo, candidate)
    # A missing or unrelated history is a blocker rather than a fabricated diff.
    common = git(repo, "merge-base", base, target).decode().strip()
    candidate_version = json.loads(git(repo, "show", target + ":tavernweave-install-manifest.json")).get("version")
    relation = "same" if base == target else "ahead" if common == base else "behind" if common == target else "diverged"
    rows = git(repo, "diff", "--no-renames", "--name-status", "-z", base, target).decode().split("\0")
    changes = [{"status": rows[i], "path": rows[i + 1], "category": category(rows[i + 1])}
               for i in range(0, len(rows) - 1, 2)]
    return {"schema": "yuri/upstream-review/v1", "integrated_commit": base,
            "candidate_commit": target, "candidate_upstream_version": candidate_version, "history_relation": relation,
            "decision": "repair_integrated_pins_before_sync" if not verification["pins_valid"] else "retain_current_pin_no_changes" if relation == "same" else "manual_compatibility_review_required",
            "verification": verification, "changes": changes,
            "candidate_code_executed": False, "pins_updated": False,
            "next": "Record review and targeted checks; adopt only reviewed changes and update all pin consumers together"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("verify", "review"))
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument("--candidate", help="Explicit fetched ref or immutable commit; required for review")
    parser.add_argument("--output", type=Path, help="New report path; existing files are never overwritten")
    args = parser.parse_args()
    try:
        if args.command == "review" and not args.candidate:
            raise ValueError("review requires --candidate; no automatic moving upstream selection")
        result = review(args.repo, args.candidate) if args.command == "review" else verify(args.repo)
        rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
        if args.output:
            with args.output.open("x", encoding="utf-8") as stream:
                stream.write(rendered)
        print(rendered, end="")
        valid = result.get("verification", result)["pins_valid"]
        return 0 if valid else 1
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, "ERROR: " + str(error) + "\n")


if __name__ == "__main__":
    raise SystemExit(main())
