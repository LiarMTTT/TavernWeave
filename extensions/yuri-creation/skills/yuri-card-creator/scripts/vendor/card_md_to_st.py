#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""card.md → SillyTavern-importable character card (chara_card_v2 JSON + v3 PNG embed).

把本仓库的 card.md 中间格式（见 docs/card-md-format.md）转换成：
  <slug>.v2.json   chara_card_v2 对象（SillyTavern「导入角色」直接可用；含内嵌世界书）
  <slug>.png       封面 PNG 嵌卡（同时写入 v2 `chara` 与 v3 `ccv3` 两个 tEXt 块，
                   旧版/新版前端都能读；需 --avatar 提供底图，无底图只出 JSON）

Converts this repo's card.md intermediate format into a chara_card_v2 JSON and a
v3-style PNG-embedded card (both `chara` and `ccv3` tEXt chunks are written for
maximum frontend compatibility). Zero third-party dependencies.

用法（仓库根目录）：
    python3 tools/card_md_to_st.py cards/zh/songzhixia/card.md \
        --avatar cards/zh/songzhixia/cover.png --outdir cards/zh/songzhixia/
    python3 tools/card_md_to_st.py card-foo.md            # 只出 JSON 到 out/
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import struct
import zlib
from pathlib import Path

# ---------------- card.md 解析（语义见 docs/card-md-format.md） ----------------


def parse_front(text: str) -> tuple[dict, str]:
    front: dict[str, str] = {}
    body = text
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end > 0:
            raw = text[3:end].strip()
            body = text[end + 4:]
            key = None
            for line in raw.splitlines():
                if line.lstrip().startswith("#"):
                    continue
                if re.match(r"^\s", line) and key:
                    front[key] += "\n" + line.strip()
                    continue
                if ":" not in line:
                    continue
                key, val = line.split(":", 1)
                key = key.strip()
                front[key] = val.strip().strip("'\"")
    return front, body


def sections(body: str) -> dict[str, str]:
    out: dict[str, str] = {}
    heads = list(re.finditer(r"^##\s+(.+?)\s*$", body, re.M))
    for m, nxt in zip(heads, heads[1:] + [None]):
        out[m.group(1).strip()] = body[m.end():(nxt.start() if nxt else len(body))].strip()
    return out


def parse_lorebook(text: str) -> list[dict]:
    entries = []
    heads = list(re.finditer(r"^###\s+(.+?)\s*$", text, re.M))
    for i, (m, nxt) in enumerate(zip(heads, heads[1:] + [None])):
        header = m.group(1).strip()
        content = text[m.end():(nxt.start() if nxt else len(text))].strip()
        parts = [p.strip() for p in header.split("|")]
        name = parts[0]
        keys: list[str] = []
        secondary: list[str] = []
        constant = False
        order = 100
        position = "before_char"
        depth = None
        prob = None
        extensions: dict = {}
        for p in parts[1:]:
            if p.startswith("keys:"):
                keys = [k.strip() for k in p[len("keys:"):].split(",") if k.strip()]
            elif p == "constant":
                constant = True
            elif p.startswith("order:"):
                order = int(p.split(":", 1)[1].strip())
            elif p.startswith("position:"):
                position = "after_char" if "after" in p else "before_char"
            elif p.startswith("depth:"):
                depth = int(p.split(":", 1)[1].strip())
            elif p.startswith("role:"):
                # at_depth 条的消息轨（SillyTavern extensions.role 数字枚举：0=system 1=user 2=assistant）。
                # 显式写 `| role: user` 的每轮格式合同条（m164/m178 轨道结论）绝不能被静默丢轨。
                role_map = {"system": 0, "user": 1, "assistant": 2}
                extensions["role"] = role_map.get(p.split(":", 1)[1].strip().lower(), 0)
            elif p.startswith("secondary:"):
                secondary = [k.strip() for k in p[len("secondary:"):].split(",") if k.strip()]
            elif p.startswith("logic:"):
                # SillyTavern selectiveLogic 是数字枚举：0=AND_ANY 1=NOT_ALL 2=NOT_ANY 3=AND_ALL
                logic_map = {"and_any": 0, "not_all": 1, "not_any": 2, "and_all": 3}
                extensions["selectiveLogic"] = logic_map.get(p.split(":", 1)[1].strip().lower(), 0)
            elif p.startswith("prob:"):
                prob = int(p.split(":", 1)[1].strip())
            elif p.startswith("sticky:"):
                extensions["sticky"] = int(p.split(":", 1)[1].strip())
            elif p.startswith("cooldown:"):
                extensions["cooldown"] = int(p.split(":", 1)[1].strip())
            elif p.startswith("recursion:"):
                mode = p.split(":", 1)[1].strip()
                if mode == "exclude":
                    extensions["exclude_recursion"] = True
                elif mode == "prevent":
                    extensions["prevent_recursion"] = True
            elif p.startswith("group:"):
                extensions["group"] = p.split(":", 1)[1].strip()
            elif p.startswith("weight:"):
                extensions["group_weight"] = int(p.split(":", 1)[1].strip())
        if not keys and not constant:
            # 文档语义（docs/card-md-format.md §4）：keys 缺省 = 常开。
            # 无 keys 的非 constant 条目在 SillyTavern 里永不触发（死条目），这里按文档自动升为 constant。
            constant = True
        entry = {
            "id": i,
            "keys": keys,
            "secondary_keys": secondary,
            "comment": name,
            "content": content,
            "constant": constant,
            "selective": bool(secondary),
            "insertion_order": order,
            "enabled": True,
            "position": position,
            "extensions": extensions,
        }
        if prob is not None:
            entry["extensions"]["useProbability"] = True
            entry["extensions"]["probability"] = prob
        if depth is not None:
            entry["extensions"]["depth"] = depth
            entry["extensions"]["position"] = 4  # at_depth
        entries.append(entry)
    return entries


def split_tags(raw: str) -> list[str]:
    raw = raw.strip()
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    return [x.strip().strip("'\"") for x in re.split(r"[,，、|/]", raw) if x.strip()]


def build_v2(md_path: Path) -> tuple[dict, str]:
    text = md_path.read_text("utf-8")
    front, body = parse_front(text)
    sec = sections(body)
    name = front.get("name") or md_path.stem
    alt_greetings = [v for k, v in sec.items() if k.lower().startswith("alternate greeting")]
    lorebook_entries = parse_lorebook(sec.get("Lorebook", ""))
    data = {
        "name": name,
        "description": sec.get("Description", ""),
        "personality": sec.get("Personality", ""),
        "scenario": front.get("scenario") or sec.get("Scenario", ""),
        "first_mes": sec.get("First Message", ""),
        "mes_example": sec.get("Example Dialogue", ""),
        "creator_notes": sec.get("Creator Notes", ""),
        "system_prompt": front.get("system_prompt", ""),
        "post_history_instructions": "",
        "alternate_greetings": alt_greetings,
        "tags": split_tags(front.get("tags", "")),
        "creator": front.get("creator", "Foreverse Team (foreverse.app)"),
        "character_version": front.get("character_version", "1.0"),
        "extensions": {},
    }
    if lorebook_entries:
        data["character_book"] = {
            "name": f"{name} lorebook",
            "entries": lorebook_entries,
            "extensions": {},
        }
    return {"spec": "chara_card_v2", "spec_version": "2.0", "data": data}, name


def to_v3(v2: dict) -> dict:
    data = dict(v2["data"])
    data.setdefault("group_only_greetings", [])
    data.setdefault("source", ["https://github.com/foreverse-app/character-card-skills"])
    return {"spec": "chara_card_v3", "spec_version": "3.0", "data": data}


# ---------------- PNG tEXt 嵌入（纯标准库） ----------------

PNG_SIG = b"\x89PNG\r\n\x1a\n"


def _iter_chunks(blob: bytes):
    pos = 8
    while pos < len(blob):
        (length,) = struct.unpack(">I", blob[pos:pos + 4])
        ctype = blob[pos + 4:pos + 8]
        data = blob[pos + 8:pos + 8 + length]
        yield ctype, data
        pos += 12 + length


def _chunk(ctype: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + ctype + data + struct.pack(">I", zlib.crc32(ctype + data) & 0xFFFFFFFF)


def embed_card_in_png(png_bytes: bytes, v2: dict, v3: dict) -> bytes:
    if not png_bytes.startswith(PNG_SIG):
        raise ValueError("not a PNG file")
    payload_v2 = base64.b64encode(json.dumps(v2, ensure_ascii=False).encode("utf-8"))
    payload_v3 = base64.b64encode(json.dumps(v3, ensure_ascii=False).encode("utf-8"))
    out = [PNG_SIG]
    for ctype, data in _iter_chunks(png_bytes):
        if ctype == b"tEXt" and (data.startswith(b"chara\x00") or data.startswith(b"ccv3\x00")):
            continue  # 覆盖旧嵌卡
        if ctype == b"IEND":
            out.append(_chunk(b"tEXt", b"chara\x00" + payload_v2))
            out.append(_chunk(b"tEXt", b"ccv3\x00" + payload_v3))
        out.append(_chunk(ctype, data))
    return b"".join(out)


def slugify(name: str, fallback: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or fallback


def main() -> int:
    ap = argparse.ArgumentParser(description="card.md → chara_card_v2 JSON + v3 PNG embed")
    ap.add_argument("card_md")
    ap.add_argument("--avatar", default="", help="封面 PNG 路径；提供则输出嵌卡 PNG")
    ap.add_argument("--outdir", default="out")
    ap.add_argument("--slug", default="", help="输出文件名主体（默认取自 md 文件名）")
    args = ap.parse_args()

    md_path = Path(args.card_md)
    v2, name = build_v2(md_path)
    v3 = to_v3(v2)
    slug = args.slug or slugify(md_path.stem.removeprefix("card-"), md_path.stem)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    json_path = outdir / f"{slug}.v2.json"
    json_path.write_text(json.dumps(v2, ensure_ascii=False, indent=2), "utf-8")
    n_lore = len(v2["data"].get("character_book", {}).get("entries", []))
    print(f"{name}: {json_path}  (lorebook={n_lore}, altgreet={len(v2['data']['alternate_greetings'])})")

    if args.avatar:
        avatar = Path(args.avatar)
        png = embed_card_in_png(avatar.read_bytes(), v2, v3)
        png_path = outdir / f"{slug}.png"
        png_path.write_bytes(png)
        print(f"{name}: {png_path}  (v2 `chara` + v3 `ccv3` embedded)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
