#!/usr/bin/env python3
"""Package Hugo's Council pages with a closed, relocatable static asset graph."""

import base64
import hashlib
import html
import io
import json
import posixpath
import re
import tarfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = ROOT / "council-landing.tar.gz"
ORIGIN = "https://council.zavarov.com"
CSS_URL = re.compile(r"url\(\s*(['\"]?)([^'\"()]+)\1\s*\)")


def local_asset(value, relative_to=""):
    parsed = urlsplit(value)
    if parsed.scheme and (parsed.scheme != "https" or parsed.netloc != "zavarov.com"):
        return None
    if parsed.netloc and parsed.netloc != "zavarov.com":
        return None
    path = parsed.path
    if not path or value.startswith(("data:", "#")):
        return None
    if not path.startswith("/"):
        path = posixpath.join(posixpath.dirname(relative_to), path)
    path = posixpath.normpath(path.lstrip("/"))
    if path == ".." or path.startswith("../"):
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
            or not source.is_file()
            or source.stat().st_size > 8 * 1024 * 1024
        ):
            raise ValueError(f"Missing or unsafe asset: {relative}")
        data = source.read_bytes()
        if source.suffix == ".css":

            def relocate(match):
                path = local_asset(match[2], relative)
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


class Page(HTMLParser):
    def __init__(self, bundle, language):
        super().__init__(convert_charrefs=False)
        self.bundle = bundle
        self.language = language
        self.output = []
        self.skip_schema = False
        self.in_title = False
        self.title = ""
        self.description = ""

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "script" and values.get("type") == "application/ld+json":
            self.skip_schema = True
            return
        if tag == "meta":
            prop = values.get("property", "")
            if prop.startswith("article:"):
                return
            if prop == "og:type":
                values["content"] = "website"
            if prop == "og:site_name":
                values["content"] = "Agent Council"
            if values.get("name") == "description":
                self.description = values.get("content", "")
        attribute = None
        if tag == "link" and values.get("rel") in (
            "stylesheet",
            "preload",
            "icon",
            "apple-touch-icon",
        ):
            attribute = "href"
        elif tag in ("script", "img"):
            attribute = "src"
        elif tag == "meta" and values.get("property", values.get("name")) in (
            "og:image",
            "twitter:image",
        ):
            attribute = "content"
        if attribute and values.get(attribute):
            path = local_asset(values[attribute])
            if path:
                target = self.bundle.asset(path)
                values[attribute] = (
                    ORIGIN + target if attribute == "content" else target
                )
                if "integrity" in values:
                    digest = hashlib.sha256(
                        self.bundle.files[target.lstrip("/")]
                    ).digest()
                    values["integrity"] = "sha256-" + base64.b64encode(digest).decode()
        self.output.append(
            "<"
            + tag
            + "".join(
                " "
                + key
                + (
                    '="' + html.escape(value, quote=True) + '"'
                    if value is not None
                    else ""
                )
                for key, value in values.items()
            )
            + ">"
        )
        if tag == "title":
            self.in_title = True

    def handle_startendtag(self, tag, attrs):
        before = len(self.output)
        self.handle_starttag(tag, attrs)
        if len(self.output) > before:
            self.output[-1] = self.output[-1][:-1] + "/>"

    def handle_endtag(self, tag):
        if self.skip_schema:
            if tag == "script":
                self.skip_schema = False
            return
        if tag == "head":
            page_url = ORIGIN + ("/" if self.language == "ru" else "/en/")
            schema = {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "url": page_url,
                "name": self.title,
                "description": self.description,
                "inLanguage": self.language,
                "isPartOf": {
                    "@type": "WebSite",
                    "name": "Agent Council",
                    "url": ORIGIN + "/",
                },
            }
            self.output.append(
                '<script type="application/ld+json">'
                + json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c")
                + "</script>"
            )
        self.output.append("</" + tag + ">")
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if not self.skip_schema:
            self.output.append(data)
            if self.in_title:
                self.title += data

    def handle_entityref(self, name):
        self.handle_data("&" + name + ";")

    def handle_charref(self, name):
        self.handle_data("&#" + name + ";")

    def handle_decl(self, decl):
        self.output.append("<!" + decl + ">")

    def handle_comment(self, data):
        if not self.skip_schema:
            self.output.append("<!--" + data + "-->")


def package(public, output):
    bundle = Bundle(public)
    for relative, target, language in (
        ("council/index.html", "index.html", "ru"),
        ("en/council/index.html", "en/index.html", "en"),
    ):
        source = public / relative
        text = source.read_text(encoding="utf-8")
        text = text.replace("https://zavarov.com/en/council/", ORIGIN + "/en/")
        text = text.replace("https://zavarov.com/council/", ORIGIN + "/")
        text = re.sub(r"href=([\"\']?)/en/council/\1(?=[\s>])", 'href="/en/"', text)
        text = re.sub(r"href=([\"\']?)/council/\1(?=[\s>])", 'href="/"', text)
        if "hreflang" not in text:
            raise ValueError(f"Missing hreflang in {relative}")
        page = Page(bundle, language)
        page.feed(text)
        page.close()
        bundle.files[target] = "".join(page.output).encode("utf-8")
    for slug in ("qui-gon", "dexter", "lando", "padme"):
        bundle.asset(f"council/avatars/{slug}.png")
    with tarfile.open(output, "w:gz", format=tarfile.USTAR_FORMAT) as archive:
        for target, data in sorted(bundle.files.items()):
            info = tarfile.TarInfo(target)
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
    return len(bundle.files)


if __name__ == "__main__":
    print(f"Packaged {OUT.name}: {package(PUBLIC, OUT)} files")
