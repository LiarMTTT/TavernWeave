#!/usr/bin/env python3
"""MIT packaged-file/capability probe; never installs or claims host discovery."""
import argparse
import json
from pathlib import Path
import shutil
import sys

EXT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(EXT / "shared"))
import provenance as p


def probe():
    root = EXT.parents[1]
    config = p.read(EXT / "hosts/native.json")
    entries = {}
    for name in config["entry_points"]:
        entry = root / "skills" / name / "SKILL.md"
        canonical = EXT / "skills" / name / "SKILL.md"
        entries[name] = {"native_entry": entry.is_file(), "canonical_entry": canonical.is_file(),
                         "ui_metadata": (entry.parent / "agents/openai.yaml").is_file()}
    p.dependencies(root)  # Verifies and loads the pinned source implementation.
    creator = p.load_module("yuri_host_creator", EXT / "skills/yuri-card-creator/scripts/create_card.py")
    authoring = creator.probe(root)
    receipt = p.read(root / "NATIVE_PLUGIN.json") if (root / "NATIVE_PLUGIN.json").is_file() else None
    packaged = bool(receipt) and all(all(row.values()) for row in entries.values())
    return {"schema": "yuri/host-probe/v1", "layout": "native_plugin" if packaged else "development_source",
            "version": (EXT / "VERSION").read_text().strip(), "entry_points": entries,
            "packaged_skill_count": receipt["skill_count"] if receipt else None,
            "entry_counts": receipt.get("counts") if receipt else None,
            "package_source_commit": receipt.get("source_commit") if receipt else None,
            "revision_note": "Package source revision and pinned authoring dependency are separate; neither proves host discovery",
            "python": sys.version.split()[0], "node_available": shutil.which("node") is not None,
            "authoring_dependency": authoring, "source_library": "pin_verified",
            "host_discovery": "not_observed", "account_installation": "not_performed",
            "search_and_images": "host_tools_not_probed", "sillytavern_import": "not_run"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__); parser.parse_args()
    try: print(json.dumps(probe(), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error: parser.exit(1, str(error) + "\n")
