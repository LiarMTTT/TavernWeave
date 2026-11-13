"""Original MIT TXT/EPUB front end to the existing shared provenance bridge.

Only selected EPUB spine text is read. No archive member is extracted to disk,
artwork copied, network resource fetched, or generic extraction engine duplicated.
"""
from html.parser import HTMLParser
import posixpath
from pathlib import Path
import re
import tempfile
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
import zipfile

import provenance as p

LIMIT = 256 * 1024 * 1024


def xml(raw):
    p.require(not re.search(br"<!\s*ENTITY\b", raw, re.I), "Entity declarations are not supported")
    # Common NCX files declare an external DTD. Drop that declaration rather than
    # resolve it; reject internal subsets instead of expanding custom entities.
    raw = re.sub(br"<!DOCTYPE\s+[^\[>]*>", b"", raw, flags=re.I)
    p.require(not re.search(br"<!\s*DOCTYPE\b", raw, re.I), "Internal DTD subsets are not supported")
    return ET.fromstring(raw)


def member_path(base, href):
    url = urlsplit(href)
    p.require(not url.scheme and not url.netloc, "Remote EPUB content is not fetched")
    path = posixpath.normpath(posixpath.join(posixpath.dirname(base), unquote(url.path)))
    p.require(not path.startswith(("/", "../")) and path != ".." and "\\" not in path, "Unsafe EPUB member path")
    return path


def member(book, name, limit):
    info = book.getinfo(name)
    p.require(not info.flag_bits & 1 and info.file_size <= limit, "Encrypted or oversized EPUB member")
    with book.open(info) as stream:
        raw = stream.read(limit + 1)
    p.require(len(raw) <= limit and len(raw) == info.file_size, "EPUB member exceeds byte budget")
    return raw


def decode_text(raw, encoding=None):
    codec = encoding or ("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig")
    return raw.decode(codec).replace("\r\n", "\n").replace("\r", "\n")


class HTMLText(HTMLParser):
    BLOCK = {"p", "div", "section", "article", "h1", "h2", "h3", "h4", "li", "br", "hr", "blockquote", "tr"}
    SKIP = {"script", "style", "head", "nav", "rt", "rp"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skipping = [], []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skipping.append(tag)
        if not self.skipping and tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if self.skipping:
            if tag == self.skipping[-1]: self.skipping.pop()
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, text):
        if not self.skipping: self.parts.append(text)


class NavLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.active, self.parts = [], None, []

    def handle_starttag(self, tag, attrs):
        if tag == "a": self.active, self.parts = dict(attrs).get("href"), []

    def handle_data(self, text):
        if self.active is not None: self.parts.append(text)

    def handle_endtag(self, tag):
        if tag == "a" and self.active is not None:
            self.links.append((self.active, "".join(self.parts).strip())); self.active = None


def epub_index(book, limit):
    names = book.namelist()
    p.require(len(names) == len(set(names)), "Duplicate EPUB member names")
    container = xml(member(book, "META-INF/container.xml", min(limit, 1024 * 1024)))
    roots = container.findall(".//{*}rootfile")
    p.require(roots, "EPUB package not found")
    package = member_path("", roots[0].get("full-path", ""))
    root = xml(member(book, package, min(limit, 4 * 1024 * 1024)))
    items = root.findall("./{*}manifest/{*}item")
    p.require(items and len({i.get('id') for i in items}) == len(items), "Invalid EPUB manifest IDs")
    manifest = {i.get("id"): i for i in items}
    labels = {}
    for item in items:
        if "nav" in item.get("properties", "").split():
            nav_path = member_path(package, item.get("href", ""))
            parser = NavLinks(); parser.feed(decode_text(member(book, nav_path, min(limit, 4 * 1024 * 1024))))
            for href, label in parser.links:
                if label: labels.setdefault(member_path(nav_path, href), label)
        elif item.get("media-type") == "application/x-dtbncx+xml":
            ncx_path = member_path(package, item.get("href", ""))
            ncx = xml(member(book, ncx_path, min(limit, 4 * 1024 * 1024)))
            for point in ncx.findall(".//{*}navPoint"):
                content, label = point.find("./{*}content"), point.find("./{*}navLabel/{*}text")
                if content is not None and label is not None and label.text:
                    labels.setdefault(member_path(ncx_path, content.get("src", "")), label.text.strip())
    rows = []
    for ref in root.findall("./{*}spine/{*}itemref"):
        item = manifest.get(ref.get("idref")); p.require(item is not None, "Unknown EPUB spine item")
        if item.get("media-type") not in ("application/xhtml+xml", "text/html"):
            continue
        path = member_path(package, item.get("href", ""))
        p.require(path in names, "Missing EPUB chapter")
        rows.append({"id": f"c{len(rows) + 1:06}", "title": labels.get(path, posixpath.basename(path)),
                     "member": path, "linear": ref.get("linear", "yes") != "no"})
    p.require(rows, "EPUB has no readable spine text")
    return rows


def chapter_text(book, row, limit):
    raw = member(book, row["member"], limit)
    encoding = re.search(br"<\?xml[^>]*encoding=[\"']([^\"']+)[\"']", raw[:256], re.I)
    parser = HTMLText(); parser.feed(decode_text(raw, encoding[1].decode("ascii") if encoding else None)); parser.close()
    text = "\n".join(line.strip() for line in "".join(parser.parts).splitlines())
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def index(path, encoding=None, limit=LIMIT, tavern_root=None):
    path = Path(path); p.require(path.stat().st_size <= limit, "Novel exceeds --max-mib; no text was truncated")
    raw = path.read_bytes()
    if path.suffix.lower() == ".epub":
        with zipfile.ZipFile(path) as book: rows = epub_index(book, limit)
        fmt = "epub"
    else:
        p.require(path.suffix.lower() in (".txt", ".md"), "Use TXT, Markdown or EPUB")
        _, tw, _ = p.dependencies(tavern_root)
        text = decode_text(raw, encoding); p.require(text.strip(), "Empty novel")
        rows = []
        for unit in tw.split_text(text, 6000):
            if rows and rows[-1]["entry"] == unit["entry"]:
                rows[-1]["end"] = unit["end"]
            else:
                rows.append({"id": f"c{len(rows) + 1:06}", "title": unit["title"], "entry": unit["entry"], "start": unit["start"], "end": unit["end"]})
        fmt = "text"
    return {"schema": "yuri/novel-index/v1", "format": fmt, "source_sha256": p.sha(raw), "chapters": rows,
            "coverage": "catalog only; no claim that chapter prose was reviewed"}


def register(path, project, selected, title="Supplied novel excerpt", encoding=None, limit=LIMIT, tavern_root=None, start=None, end=None, profile_path=None):
    p.profiles.load(profile_path)  # Reject unsupported preferences before reading selected prose.
    path = Path(path); listing = index(path, encoding, limit, tavern_root)
    p.require(selected and len(set(selected)) == len(selected), "Select chapter IDs or explicitly request all chapters")
    p.require(set(selected) <= {c['id'] for c in listing['chapters']}, "Unknown chapter ID")
    rows = [c for c in listing["chapters"] if c["id"] in selected]
    parts, mappings, offset, selected_bytes = [], [], 0, 0
    if listing["format"] == "epub":
        with zipfile.ZipFile(path) as book:
            for row in rows:
                text = chapter_text(book, row, limit)
                p.require(text.strip(), "Selected spine item has no prose; choose a text chapter: " + row["id"])
                selected_bytes += len(text.encode()) + (2 if parts else 0)
                p.require(selected_bytes <= limit, "Selected chapters exceed byte budget; select fewer chapters or raise --max-mib")
                parts.append(text)
    else:
        text = decode_text(path.read_bytes(), encoding)
        parts = [text[row['start']:row['end']] for row in rows]
    if start is not None or end is not None:
        p.require(len(rows) == 1 and type(start) is int and type(end) is int and 0 <= start < end <= len(parts[0]), "An explicit start/end range requires one chapter and valid Unicode offsets")
        rows[0] = dict(rows[0], chapter_character_start=start, chapter_character_end=end)
        parts[0] = parts[0][start:end]
    for row, text in zip(rows, parts):
        mappings.append(dict(row, extracted_start=offset, extracted_end=offset + len(text), text_sha256=p.sha(text.encode())))
        offset += len(text) + 2
    combined = "\n\n".join(parts)
    p.require(len(combined.encode()) <= limit, "Selected text exceeds byte budget; select fewer chapters or raise --max-mib")
    p.require(p.sha(path.read_bytes()) == listing["source_sha256"], "Novel changed during extraction")
    origin = {"file_name": path.name, "format": listing["format"], "source_sha256": listing["source_sha256"],
              "total_chapters": len(listing["chapters"]), "selected_chapters": mappings,
              "normalization": "LF text; EPUB excludes markup, scripts, styles, navigation, ruby pronunciation and artwork; no OCR or remote fetch"}
    with tempfile.TemporaryDirectory(prefix="yuri-selected-novel-") as temp:
        source = Path(temp) / "selected.txt"; source.write_text(combined, encoding="utf-8")
        return p.register(source, project, title, tavern_root=tavern_root, source_kind="novel", origin=origin, profile_path=profile_path)
