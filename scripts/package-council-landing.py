#!/usr/bin/env python3
"""Package a standalone Council-subdomain static bundle from the Hugo output."""

import argparse
import base64
import hashlib
import io
import json
import re
import tarfile
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = ROOT / "council-landing.tar.gz"
ORIGIN = "https://council.zavarov.com"
BLOG = "https://zavarov.com"
PAGES = {"/council/": "/", "/en/council/": "/en/"}
CSS_URL = re.compile(r"url\(\s*([\"']?)([^'\"()]+)\1\s*\)")


def local_asset(value, base):
    if not value or value.startswith(("data:", "#")):
        return None
    url = urlsplit(urljoin(base, value))
    if url.scheme != "https" or url.netloc not in (
        urlsplit(BLOG).netloc,
        urlsplit(ORIGIN).netloc,
    ):
        return None
    path = unquote(url.path).lstrip("/")
    if ".." in Path(path).parts:
        raise ValueError("Unsafe asset path")
    return path


class Bundle:
    def __init__(self, public):
        self.public = public.resolve()
        self.files = {}
        self.paths = {}
        self.visiting = set()

    def asset(self, relative):
        if relative in self.paths:
            return self.paths[relative]
        if relative in self.visiting or len(self.paths) > 90:
            raise ValueError("Cyclic or oversized asset graph")
        self.visiting.add(relative)
        source = self.public / relative
        if (
            source.resolve() != source
            or self.public not in source.parents
            or not source.is_file()
            or source.stat().st_size > 8 * 1024 * 1024
        ):
            raise ValueError(f"Missing or unsafe asset: {relative}")
        data = source.read_bytes()
        if source.suffix == ".css":

            def relocate(match):
                path = local_asset(match[2], BLOG + "/" + relative)
                return 'url("' + self.asset(path) + '")' if path else match[0]

            data = CSS_URL.sub(relocate, data.decode("utf-8")).encode("utf-8")
        if relative.startswith("council/avatars/"):
            target = relative
        else:
            target = (
                "council/assets/" + hashlib.sha256(data).hexdigest() + source.suffix
            )
        self.files[target] = data
        self.paths[relative] = "/" + target
        self.visiting.remove(relative)
        return self.paths[relative]


class Landing(HTMLParser):
    """Relocate assets and navigation while preserving the theme metadata."""

    def __init__(self, bundle, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.bundle = bundle
        self.output = []
        self.json_ld = False

    def asset(self, value):
        path = local_asset(value, self.source)
        if path is None:
            return value
        return self.bundle.asset(path)

    def navigation(self, value):
        if value.startswith("#"):
            return value
        url = urlsplit(urljoin(self.source, value))
        if url.netloc != urlsplit(BLOG).netloc:
            return value
        target = PAGES.get(url.path)
        return urlunsplit(
            (
                url.scheme,
                urlsplit(ORIGIN).netloc if target else url.netloc,
                target or url.path,
                url.query,
                url.fragment,
            )
        )

    def start(self, tag, attrs, closed=False):
        values = dict(attrs)
        if tag == "script":
            self.json_ld = values.get("type") == "application/ld+json"
        attribute = None
        if tag == "link" and set(values.get("rel", "").split()) & {
            "stylesheet",
            "preload",
            "modulepreload",
            "icon",
            "apple-touch-icon",
        }:
            attribute = "href"
        elif tag in ("script", "img"):
            attribute = "src"
        elif tag == "meta" and values.get("property", values.get("name")) in (
            "og:image",
            "twitter:image",
        ):
            attribute = "content"
        if attribute and values.get(attribute):
            target = self.asset(values[attribute])
            values[attribute] = (
                ORIGIN + target
                if attribute == "content" and target.startswith("/")
                else target
            )
            if target.startswith("/") and "integrity" in values:
                digest = hashlib.sha256(self.bundle.files[target.lstrip("/")]).digest()
                values["integrity"] = "sha256-" + base64.b64encode(digest).decode()
        for name in values:
            if (
                name != attribute
                and values[name] is not None
                and (
                    name == "href"
                    or tag == "meta"
                    and name == "content"
                    and values.get("property") == "og:url"
                )
            ):
                values[name] = self.navigation(values[name])
        rendered = [
            name if value is None else f'{name}="{escape(value, quote=True)}"'
            for name, value in values.items()
        ]
        self.output.append(
            "<"
            + tag
            + (" " + " ".join(rendered) if rendered else "")
            + ("/>" if closed else ">")
        )

    def handle_starttag(self, tag, attrs):
        self.start(tag, attrs)

    def handle_startendtag(self, tag, attrs):
        self.start(tag, attrs, True)

    def handle_endtag(self, tag):
        self.output.append(f"</{tag}>")
        if tag == "script":
            self.json_ld = False

    def handle_data(self, data):
        if self.json_ld:

            def rewrite(value):
                if isinstance(value, dict):
                    return {key: rewrite(item) for key, item in value.items()}
                if isinstance(value, list):
                    return [rewrite(item) for item in value]
                if isinstance(value, str) and value.startswith(BLOG + "/"):
                    return self.navigation(value)
                return value

            data = json.dumps(
                rewrite(json.loads(data)), ensure_ascii=False, separators=(",", ":")
            ).replace("<", "\\u003c")
        self.output.append(data)

    def handle_entityref(self, name):
        self.output.append(f"&{name};")

    def handle_charref(self, name):
        self.output.append(f"&#{name};")

    def handle_decl(self, decl):
        self.output.append(f"<!{decl}>")

    def handle_comment(self, data):
        self.output.append(f"<!--{data}-->")


def package(public=PUBLIC, output=OUT):
    public = public.resolve()
    bundle = Bundle(public)
    for relative, target, source_url in (
        ("council/index.html", "index.html", BLOG + "/council/"),
        ("en/council/index.html", "en/index.html", BLOG + "/en/council/"),
    ):
        source = public / relative
        if not source.is_file():
            raise ValueError("Build Hugo before packaging the Council landing")
        text = source.read_text(encoding="utf-8")
        if "hreflang" not in text:
            raise ValueError(f"Missing hreflang in {relative}")
        page = Landing(bundle, source_url)
        page.feed(text)
        page.close()
        bundle.files[target] = "".join(page.output).encode("utf-8")
    for slug in ("qui-gon", "dexter", "lando", "padme"):
        bundle.asset(f"council/avatars/{slug}.png")
    # The Council virtual host owns robots.txt and sitemap.xml. Its installer
    # accepts only the two pages and assets under council/.
    with tarfile.open(output, "w:gz", format=tarfile.USTAR_FORMAT) as archive:
        for target, data in sorted(bundle.files.items()):
            info = tarfile.TarInfo(target)
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
    return len(bundle.files)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public-dir", type=Path, default=PUBLIC)
    parser.add_argument("--output", type=Path, default=OUT)
    args = parser.parse_args()
    print(f"Packaged {args.output.name}: {package(args.public_dir, args.output)} files")
