#!/usr/bin/env python3
"""Build and verify the two native TavernWeave plugin ZIPs from one Git commit.

Only committed blobs are packaged. The output directory must be new and outside
the source checkout. This is an offline compatibility check, not host acceptance.
"""

import argparse
import hashlib
import json
import re
import subprocess
import tempfile
import unicodedata
import zipfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = "tavernweave-agent-skills/"
COMMON_FILES = {
    "tavernweave-install-manifest.json", "README.md", "CHANGELOG.md",
    "LICENSE", "THIRD_PARTY_NOTICES.md",
    "scripts/install-tavernweave.ps1", "scripts/verify-install.ps1",
    "scripts/manage-host-front-door.ps1", "scripts/sync-guidance.mjs",
}
MANIFESTS = {"Codex": ".codex-plugin/plugin.json", "Claude-ZCode": ".claude-plugin/plugin.json"}
CODEX_ONLY = "scripts/register-local.ps1"
RUNTIME_PATHS = {
    "docs/plugin-guide.md",
    "skills/consult-tavernweave-library/references/plugin-runtime.md",
}
DOCS = [
    "https://developers.openai.com/plugins/build/plugins",
    "https://developers.openai.com/plugins/deploy/submission-errors",
]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def git(repo, *args, input_bytes=None):
    command = ["git", f"--work-tree={repo}", *args]
    result = subprocess.run(command, cwd=repo, input=input_bytes, capture_output=True)
    if result.returncode:
        raise ValueError(f"git {args[0]} failed: {result.stderr.decode('utf-8', 'replace').strip()}")
    return result.stdout


def safe_member(name, seen):
    require(isinstance(name, str) and name and "\\" not in name and "\x00" not in name,
            f"unsafe archive path: {name!r}")
    parts = name.split("/")
    require(not name.startswith("/") and not re.match(r"^[A-Za-z]:", name), f"absolute archive path: {name}")
    require(len(parts) <= 20 and all(part not in ("", ".", "..") for part in parts),
            f"unsafe archive path segments: {name}")
    normalized = unicodedata.normalize("NFC", name).casefold()
    require(normalized not in seen, f"case/Unicode archive collision: {name}")
    seen.add(normalized)


def committed_files(repo, ref):
    commit = git(repo, "rev-parse", "--verify", f"{ref}^{{commit}}").decode().strip()
    raw = git(repo, "ls-tree", "-r", "-z", "--full-tree", commit)
    tracked = {}
    for entry in raw.split(b"\0"):
        if not entry:
            continue
        metadata, path = entry.split(b"\t", 1)
        mode, kind, oid = metadata.decode("ascii").split()
        tracked[path.decode("utf-8")] = (mode, kind, oid)
    selected = {
        name: value for name, value in tracked.items()
        if name in COMMON_FILES or name in MANIFESTS.values() or name == CODEX_ONLY
        or name.startswith(("skills/", "docs/", "host-adapters/"))
    }
    require(COMMON_FILES | set(MANIFESTS.values()) | {CODEX_ONLY} <= selected.keys(),
            "missing required package file in committed source")
    require(any(name.startswith("docs/") for name in selected), "docs/ is missing")
    require(any(name.startswith("host-adapters/") for name in selected), "host-adapters/ is missing")
    seen = set()
    for name, (mode, kind, _oid) in selected.items():
        safe_member(ROOT + name, seen)
        require(kind == "blob" and mode in ("100644", "100755"), f"non-regular source file: {name}")
    return commit, tracked, selected


def read_blobs(repo, selected):
    oids = sorted({oid for _mode, _kind, oid in selected.values()})
    raw = git(repo, "cat-file", "--batch", input_bytes=("\n".join(oids) + "\n").encode("ascii"))
    blobs = {}
    offset = 0
    for expected in oids:
        end = raw.index(b"\n", offset)
        oid, kind, length = raw[offset:end].decode("ascii").split()
        require((oid, kind) == (expected, "blob"), f"unexpected Git object: {expected}")
        start = end + 1
        offset = start + int(length)
        blobs[oid] = raw[start:offset]
        require(raw[offset:offset + 1] == b"\n", f"truncated Git blob: {oid}")
        offset += 1
    require(offset == len(raw), "unexpected trailing Git object data")
    return {name: blobs[oid] for name, (_mode, _kind, oid) in selected.items()}


def json_object(data, path):
    value = json.loads(data.decode("utf-8"))
    require(isinstance(value, dict), f"JSON root is not an object: {path}")
    return value


def text_field(value, limit, label, single_line=False):
    require(isinstance(value, str) and 0 < len(value) <= limit, f"{label} must be 1-{limit} characters")
    if single_line:
        require("\n" not in value and "\r" not in value, f"{label} must be one line")


def validate_source(contents, selected, tracked=None):
    install = json_object(contents["tavernweave-install-manifest.json"], "install manifest")
    manifests = {host: json_object(contents[path], path) for host, path in MANIFESTS.items()}
    version = install.get("version")
    require(isinstance(version, str) and re.fullmatch(r"\d+\.\d+\.\d+", version), "invalid package version")
    require(install.get("package") == ROOT.rstrip("/"), "installation package identity mismatch")
    require(install.get("hostFrontDoor", {}).get("version") == version, "host front door version mismatch")
    skills = sorted(name.split("/")[1] for name in selected if re.fullmatch(r"skills/[^/]+/SKILL\.md", name))
    require(len(skills) > 0 and len(set(skills)) == len(skills), "package must contain unique native Skills")
    require(install.get("skillCount") == len(skills) and install.get("skills") == skills,
            "declared Skills do not match committed SKILL.md files")
    declared = list(install.get("requiredPaths", [])) + list(install.get("hostFrontDoor", {}).get("requiredSourcePaths", []))
    require(RUNTIME_PATHS <= selected.keys(), "plugin guide or runtime reference missing from package")
    require("skills/consult-tavernweave-library/references/plugin-runtime.md" in install.get("requiredPaths", []),
            "runtime reference must be declared in requiredPaths for standalone Skill installation")
    for group, fields in (("hostFrontDoor", ("managedBlock", "hostMap", "manager")),
                          ("communication", ("reference", "preferenceManager"))):
        object_value = install.get(group, {})
        require(isinstance(object_value, dict), f"invalid {group}")
        declared.extend(object_value.get(field) for field in fields if field in object_value)
    for path in declared:
        require(isinstance(path, str) and path in selected, f"declared path missing from package: {path}")
    dsh_plugin = install.get("dshPlugin", {})
    if dsh_plugin:
        require(dsh_plugin.get("status") in ("preview-plugin-bundle", "plugin-bundle"),
                "invalid DSH plugin status")
        require(dsh_plugin.get("package") == "liarmttt-tavernweave-dsh", "invalid DSH plugin package")
        require(dsh_plugin.get("presetId") == "tavernweave", "invalid DSH plugin preset id")
        # The contract/plugin files ship in the host packages; the build script is repository tooling
        # and is validated against the committed tree instead of the ZIP payload.
        for field in ("contract", "entry", "patch", "packageManifest"):
            path = dsh_plugin.get(field)
            require(isinstance(path, str) and path in selected, f"declared DSH plugin path missing from package: {path}")
        build_script = dsh_plugin.get("buildScript")
        require(isinstance(build_script, str) and tracked is not None and build_script in tracked,
                f"declared DSH build script missing from committed source: {build_script}")
    for host, manifest in manifests.items():
        require(manifest.get("name") == install["package"] and manifest.get("version") == version,
                f"{host} manifest identity or version mismatch")
        text_field(manifest.get("description"), 1024, f"{host} description")
        author = manifest.get("author")
        require(isinstance(author, dict), f"{host} author missing")
        text_field(author.get("name"), 120, f"{host} author.name")
    codex = manifests["Codex"]
    require(codex.get("skills") == "./skills/", "Codex skills path must be ./skills/")
    onboarding = codex.get("extensions", {}).get("com.openai", {}).get("onboardingSkill")
    require(onboarding == "./skills/consult-tavernweave-library/SKILL.md",
            "Codex onboarding Skill must use the bundled consult Skill")
    require(onboarding[2:] in selected, "Codex onboarding Skill missing")
    ui = codex.get("interface")
    require(isinstance(ui, dict), "Codex interface missing")
    for key, limit, one_line in (("displayName", 30, True), ("shortDescription", 30, True),
                                 ("longDescription", 4000, False), ("developerName", 80, True)):
        text_field(ui.get(key), limit, f"interface.{key}", one_line)
    require(ui.get("category") in ("Productivity", "Creativity", "Developer Tools", "Business & Operations",
                                    "Data & Analytics", "Communication", "Education & Research", "Security",
                                    "Finance", "Healthcare", "Travel", "Entertainment", "Other"),
            "unsupported Codex category")
    capabilities = ui.get("capabilities", [])
    require(isinstance(capabilities, list) and len(capabilities) <= 20, "invalid capabilities")
    for item in capabilities:
        text_field(item, 120, "capability", True)
    prompts = ui.get("defaultPrompt", [])
    require(isinstance(prompts, list) and len(prompts) <= 3, "invalid starter prompts")
    normalized_prompts = set()
    for prompt in prompts:
        text_field(prompt, 128, "starter prompt", True)
        require("@" not in prompt, "starter prompt must not include an MCP mention")
        normalized = " ".join(unicodedata.normalize("NFC", prompt).split()).casefold()
        require(normalized not in normalized_prompts, "duplicate starter prompts")
        normalized_prompts.add(normalized)
    require(not any(key in codex for key in ("mcpServers", "apps", "hooks")), "unexpected runtime component")
    return version, skills


def package_names(version):
    return {host: f"TavernWeave-{host}-v{version}.zip" for host in MANIFESTS}


def write_zip(path, names, contents, selected, stamp):
    require(len(names) <= 5000, "archive has too many entries")
    require(sum(len(contents[name]) for name in names) <= 512 * 1024 * 1024, "archive expands past 512 MiB")
    with zipfile.ZipFile(path, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in sorted(names):
            require(len(contents[name]) <= 100 * 1024 * 1024, f"archive member too large: {name}")
            info = zipfile.ZipInfo(ROOT + name, stamp)
            info.create_system = 3
            info.external_attr = int(selected[name][0], 8) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, contents[name], compresslevel=9)
    require(path.stat().st_size <= 100_000_000, "compressed ZIP exceeds 100 MB")


def verify_zip(path, names, contents, selected):
    inventory = []
    seen = set()
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        require(len(entries) == len(names) <= 5000, f"archive entry count mismatch: {path.name}")
        require(sum(entry.file_size for entry in entries) <= 512 * 1024 * 1024,
                f"archive expands past 512 MiB: {path.name}")
        require({entry.filename for entry in entries} == {ROOT + name for name in names},
                f"archive files differ from selection: {path.name}")
        require(archive.testzip() is None, f"archive CRC failed: {path.name}")
        for entry in entries:
            safe_member(entry.filename, seen)
            require(entry.filename.startswith(ROOT) and not entry.is_dir(), "archive root or file type mismatch")
            require(not entry.flag_bits & 1, f"encrypted member: {entry.filename}")
            require(entry.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED),
                    f"unsupported compression: {entry.filename}")
            mode = (entry.external_attr >> 16) & 0o170000
            require(mode in (0, 0o100000), f"non-regular archive member: {entry.filename}")
            require(entry.file_size <= 100 * 1024 * 1024, f"oversize archive member: {entry.filename}")
            name = entry.filename[len(ROOT):]
            data = archive.read(entry)
            require(data == contents[name], f"archive byte mismatch with Git blob: {name}")
            inventory.append({"path": name, "gitBlob": selected[name][2], "bytes": len(data),
                              "sha256": hashlib.sha256(data).hexdigest()})
    require(path.stat().st_size <= 100_000_000, f"compressed ZIP exceeds 100 MB: {path.name}")
    return inventory


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def build(repo, ref, output_dir):
    repo = Path(repo).resolve(strict=True)
    output_dir = Path(output_dir).resolve()
    require(repo.is_dir() and (repo / ".git").exists(), "--repo must be a Git checkout")
    require(output_dir != repo and repo not in output_dir.parents, "output directory must be outside source checkout")
    require(not output_dir.exists(), "output directory already exists; refusing to overwrite results")
    commit, tracked, selected = committed_files(repo, ref)
    contents = read_blobs(repo, selected)
    version, skills = validate_source(contents, selected, tracked)
    timestamp = int(git(repo, "show", "-s", "--format=%ct", commit))
    stamp = datetime.fromtimestamp(max(timestamp, 315532800), timezone.utc).timetuple()[:6]
    names = package_names(version)
    output_dir.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".tw-plugin-build-", dir=output_dir.parent) as temp_name:
        temp = Path(temp_name)
        inventories = {}
        artifacts = {}
        for host, manifest_path in MANIFESTS.items():
            chosen = set(selected) - (set(MANIFESTS.values()) - {manifest_path})
            if host != "Codex":
                chosen.remove(CODEX_ONLY)
            target = temp / names[host]
            write_zip(target, chosen, contents, selected, stamp)
            inventories[host] = verify_zip(target, chosen, contents, selected)
            artifacts[host] = {"file": target.name, "bytes": target.stat().st_size,
                               "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                               "fileCount": len(chosen)}
        marketplace_name = f"TavernWeave-ZCode-marketplace-v{version}.json"
        marketplace = {
            "name": "tavernweave-zcode", "description": f"TavernWeaveX {version} skills for ZCode and compatible plugin hosts.",
            "owner": {"name": "LiarMTTT", "url": "https://github.com/LiarMTTT"},
            "plugins": [{"name": ROOT.rstrip("/"), "version": version,
                         "description": f"{len(skills)} skills for rolecards, software workflows, research and quality checks.",
                         "description_i18n": {"zh-CN": f"TavernWeaveX无限月读 {version}：完整 {len(skills)} 个 Skills，支持角色卡、软件开发、作品资料库与质量检查。"},
                         "source": {"source": "url", "type": "zip",
                                    "url": f"https://github.com/LiarMTTT/TavernWeave/releases/download/v{version}/{names['Claude-ZCode']}",
                                    "sha256": artifacts["Claude-ZCode"]["sha256"], "path": ROOT.rstrip("/")}}],
        }
        write_json(temp / marketplace_name, marketplace)
        sums = [(artifacts[host]["sha256"], names[host]) for host in MANIFESTS]
        sums.append((hashlib.sha256((temp / marketplace_name).read_bytes()).hexdigest(), marketplace_name))
        (temp / "SHA256SUMS.txt").write_text("".join(f"{sha}  {name}\n" for sha, name in sums),
                                             encoding="utf-8", newline="\n")
        receipt = {
            "status": "offline-package-verified-host-not-run", "sourceCommit": commit,
            "sourceRef": ref, "version": version, "archiveRoot": ROOT, "skillCount": len(skills),
            "source": "committed Git blobs only", "archives": artifacts,
            "marketplace": marketplace_name, "signatureStatus": "unsigned; SHA-256 checksums supplied",
            "dotVerification": "not-run", "officialSchemaCertification": "not-run",
            "checks": ["single plugin root", "manifest identity, version and declared paths",
                       f"{len(skills)} native Skills", "documented ZIP limits", "CRC and every archive byte equals its Git blob"],
            "excludedTrackedFiles": sorted(set(tracked) - set(selected)), "documentation": DOCS,
            "limits": ["Offline schema compatibility checks are not official OpenAI certification",
                       "No client install, dot verification, host rediscovery, or real SillyTavern run"],
        }
        write_json(temp / "archive-inventory.json", inventories)
        write_json(temp / "package-receipt.json", receipt)
        temp.rename(output_dir)
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--ref", required=True, help="committed Git ref, tag, or SHA")
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    try:
        receipt = build(args.repo, args.ref, args.output_dir)
    except (ValueError, OSError, subprocess.SubprocessError, zipfile.BadZipFile) as error:
        parser.exit(1, f"plugin package build failed: {error}\n")
    print(json.dumps(receipt, ensure_ascii=False))


if __name__ == "__main__":
    main()
