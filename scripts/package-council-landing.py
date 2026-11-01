#!/usr/bin/env python3
"""Package a standalone Council-subdomain static bundle from the Hugo output."""
from pathlib import Path
from html.parser import HTMLParser
import io
import re
import tarfile

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = ROOT / "council-landing.tar.gz"
ORIGIN = "https://council.zavarov.com"

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("link", "script", "img"):
            src = a.get("href") if tag == "link" else a.get("src")
            if src and src.startswith("/") and not src.startswith("//"):
                self.paths.add(src.split("?", 1)[0].lstrip("/"))

def main():
    ru = PUBLIC / "council/index.html"
    en = PUBLIC / "en/council/index.html"
    if not ru.is_file() or not en.is_file():
        raise SystemExit("Build Hugo before packaging the Council landing")
    pages = {}
    assets = set()
    for source, target, lang in ((ru, "index.html", "ru"), (en, "en/index.html", "en")):
        html = source.read_text(encoding="utf-8")
        html = html.replace("https://zavarov.com/en/council/", ORIGIN + "/en/")
        html = html.replace("https://zavarov.com/council/", ORIGIN + "/")
        html = re.sub(r'href="/en/council/"', 'href="/en/"', html)
        html = re.sub(r'href="/council/"', 'href="/"', html)
        if f'hreflang="{lang}"' not in html:
            raise SystemExit(f"Missing hreflang in {source}")
        parser = Assets()
        parser.feed(html)
        assets.update(parser.paths)
        pages[target] = html.encode("utf-8")
    for name in ("qui-gon", "dexter", "lando", "padme"):
        assets.add(f"council/avatars/{name}.png")
    with tarfile.open(OUT, "w:gz") as archive:
        for target, data in sorted(pages.items()):
            info = tarfile.TarInfo(target)
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
        for rel in sorted(assets):
            if ".." in Path(rel).parts:
                raise SystemExit("Unsafe asset path")
            source = PUBLIC / rel
            if not source.is_file():
                raise SystemExit(f"Missing asset: {rel}")
            archive.add(source, arcname=rel, recursive=False)
    print(f"Packaged {OUT.name}: {len(pages)} pages, {len(assets)} assets")

if __name__ == "__main__":
    main()
