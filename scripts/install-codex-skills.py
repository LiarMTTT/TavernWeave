#!/usr/bin/env python3
"""Preview, install, or verify the complete TavernWeave skills-only layout.

Python 3.9+; standard library only. No network, plugin registration, global
instruction edits, or host-discovery claims. Existing changed skills require
--replace and are retained in a backup outside the scanned skills directory.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import tempfile
from pathlib import Path


def require(condition, message):
    if not condition:
        raise ValueError(message)


def no_links(path):
    """Refuse symlinks/junctions instead of following an installation target."""
    for part in (path, *path.parents):
        require(not part.is_symlink() and not getattr(part, "is_junction", lambda: False)(),
                f"Linked path is not an installation target: {part}")
        try:
            attributes = getattr(part.lstat(), "st_file_attributes", 0)
        except FileNotFoundError:
            continue
        require(not attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400),
                f"Reparse point is not an installation target: {part}")


def tree_hash(directory):
    require(directory.is_dir(), f"Skill directory is missing: {directory}")
    no_links(directory)
    rows = []
    for path in sorted(directory.rglob("*")):
        no_links(path)
        require(path.is_dir() or path.is_file(), f"Non-regular skill resource: {path}")
        relative = path.relative_to(directory)
        if "__pycache__" in relative.parts or path.suffix == ".pyc":
            continue
        if path.is_file():
            rows.append(f"{relative.as_posix()}\t{hashlib.sha256(path.read_bytes()).hexdigest()}")
    return hashlib.sha256(("\n".join(rows) + "\n").encode("utf-8")).hexdigest()


def source_inventory(plugin_root):
    plugin_root = Path(plugin_root).resolve(strict=True)
    manifest = json.loads((plugin_root / "tavernweave-install-manifest.json").read_text(encoding="utf-8-sig"))
    names = manifest.get("skills")
    require(isinstance(names, list) and names and all(
        isinstance(name, str) and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name)
        for name in names), "Manifest skills must be safe, nonempty skill names")
    require(names == sorted(set(names)) and manifest.get("skillCount") == len(names),
            "Manifest skills must be sorted, unique, and match skillCount")
    source = plugin_root / "skills"
    actual = sorted(path.name for path in source.iterdir() if path.is_dir())
    require(actual == names, "Manifest does not match the complete source skills inventory")
    hashes = {}
    for name in names:
        require((source / name / "SKILL.md").is_file(), f"Missing SKILL.md: {name}")
        hashes[name] = tree_hash(source / name)
    for relative in manifest.get("requiredPaths", []):
        require(isinstance(relative, str) and "\\" not in relative,
                f"Invalid required path: {relative!r}")
        parts = relative.split("/")
        require(parts[0] == "skills" and all(part not in ("", ".", "..") for part in parts),
                f"Required path is not part of the skills-only layout: {relative}")
        require((plugin_root / relative).is_file(), f"Missing required source resource: {relative}")
    return plugin_root, manifest, hashes


def target_path(value, plugin_root):
    target = Path(os.path.abspath(Path(value).expanduser()))
    require(target.name == "skills", "Target must be an explicit directory named skills")
    no_links(target)
    require(target != plugin_root and plugin_root not in target.parents and target not in plugin_root.parents,
            "Target must be separate from the TavernWeave source checkout")
    # Path strings alone do not catch different casing on case-insensitive volumes.
    for ancestor in (target, *target.parents):
        require(not ancestor.exists() or not ancestor.samefile(plugin_root),
                "Target must be separate from the TavernWeave source checkout")
    if target.exists():
        require(not any(target.samefile(ancestor) for ancestor in plugin_root.parents),
                "Target must not contain the TavernWeave source checkout")
    require(not target.exists() or target.is_dir(), f"Target is not a directory: {target}")
    return target


def compare(target, hashes):
    missing, changed, matched = [], [], []
    for name, expected in hashes.items():
        destination = target / name
        no_links(destination)
        if not destination.exists():
            missing.append(name)
        else:
            require(destination.is_dir(), f"Existing skill is not a directory: {destination}")
            (matched if tree_hash(destination) == expected else changed).append(name)
    unrelated = sorted(path.name for path in target.iterdir() if path.name not in hashes) if target.exists() else []
    return missing, changed, matched, unrelated


def operate(plugin_root, target, *, apply=False, replace=False, verify=False):
    require(not (apply and verify), "--apply and --verify are mutually exclusive")
    plugin_root, manifest, hashes = source_inventory(plugin_root)
    target = target_path(target, plugin_root)
    missing, changed, matched, unrelated = compare(target, hashes)
    receipt = {
        "status": "verified" if verify and not (missing or changed) else "preview",
        "version": manifest["version"], "layout": "skills", "target": str(target),
        "expectedSkills": len(hashes), "matchedSkills": len(matched),
        "newSkills": missing, "changedSkills": changed, "unrelatedEntries": unrelated,
        "backup": None, "hostDiscovery": "not-verified",
        "globalInstructions": "not-modified", "pluginRegistration": "not-modified",
    }
    if verify:
        receipt["status"] = "verification-failed" if missing or changed else "verified"
        return receipt
    if not apply:
        receipt["replacementApprovalRequired"] = bool(changed) and not replace
        return receipt
    require(not changed or replace,
            "Changed skills already exist. Review the preview and use --replace to retain and replace them: "
            + ", ".join(changed))
    if not missing and not changed:
        receipt["status"] = "unchanged"
        return receipt

    old_hashes = {name: tree_hash(target / name) for name in changed}
    # Stage beside skills, never inside it: backups must not become duplicate skills.
    target.parent.mkdir(parents=True, exist_ok=True)
    transaction = Path(tempfile.mkdtemp(prefix=".tavernweave-install-", dir=target.parent))
    staged, backup = transaction / "stage", transaction / "backup"
    installed, saved = [], []
    target_created = False
    try:
        staged.mkdir()
        backup.mkdir()
        for name in missing + changed:
            shutil.copytree(plugin_root / "skills" / name, staged / name,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            require(tree_hash(staged / name) == hashes[name], f"Staged skill differs from source: {name}")
        # Detect changes during preview/staging rather than clobbering concurrent edits.
        require(compare(target, hashes)[:3] == (missing, changed, matched),
                "Target inventory changed while staging; review it again")
        require(all(tree_hash(target / name) == digest for name, digest in old_hashes.items()),
                "Target contents changed while staging; review them again")
        if not target.exists():
            target.mkdir()
            target_created = True
        for name in missing + changed:
            destination = target / name
            no_links(destination)
            if name in changed:
                require(tree_hash(destination) == old_hashes[name], f"Target changed before replacement: {name}")
                destination.rename(backup / name)
                saved.append(name)
            else:
                require(not destination.exists(), f"Target appeared during installation: {name}")
            (staged / name).rename(destination)
            installed.append(name)
        require(compare(target, hashes)[:2] == ([], []), "Installed tree failed verification")
    except BaseException as error:
        failures = []
        for name in reversed(installed):
            try:
                # Do not delete a skill changed by another writer during rollback.
                require(tree_hash(target / name) == hashes[name],
                        f"Concurrent edit prevents rollback: {target / name}")
                shutil.rmtree(target / name)
            except (OSError, ValueError) as rollback_error:
                failures.append(str(rollback_error))
        for name in reversed(saved):
            try:
                require(not (target / name).exists(), f"Rollback target is occupied: {target / name}")
                (backup / name).rename(target / name)
            except (OSError, ValueError) as rollback_error:
                failures.append(str(rollback_error))
        if failures:
            raise RuntimeError(f"Rollback incomplete; preserve {transaction}: {'; '.join(failures)}") from error
        shutil.rmtree(transaction)
        if target_created and target.exists() and not any(target.iterdir()):
            target.rmdir()
        raise
    receipt.update(status="installed", matchedSkills=len(hashes))
    receipt["backup"] = str(backup) if saved else None
    try:
        if saved:
            shutil.rmtree(staged)
            (transaction / "receipt.json").write_text(
                json.dumps({"target": str(target), "replacedSkills": saved}, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8")
        else:
            shutil.rmtree(transaction)
    except OSError as error:
        receipt.update(status="installed-with-cleanup-warning", cleanupWarning=str(error),
                       retainedWorkDirectory=str(transaction))
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plugin-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--target", type=Path, required=True, help="e.g. ~/.agents/skills or <project>/.agents/skills")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true", help="write the previewed installation")
    mode.add_argument("--verify", action="store_true", help="read-only comparison of the installed tree")
    parser.add_argument("--replace", action="store_true", help="allow replacing changed skills; retain originals in backup")
    args = parser.parse_args()
    try:
        receipt = operate(args.plugin_root, args.target, apply=args.apply, replace=args.replace, verify=args.verify)
    except (OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f"Codex skills installation failed: {error}\n")
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 1 if receipt["status"] == "verification-failed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
