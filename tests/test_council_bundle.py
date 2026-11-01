"""Test deployed asset routes, checksums and metadata independently of Hugo."""

import base64
import hashlib
import importlib.util
import tarfile
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "bundle", Path(__file__).resolve().parents[1] / "scripts/package-council-landing.py"
)
bundle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bundle)


class Tags(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class BundleTests(unittest.TestCase):
    def test_packages_transitive_fonts_and_rehashes_css_without_changing_scripts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            page = """<!doctype html><html lang=ru><head><title>Agent Council</title>
<link rel=canonical href=https://zavarov.com/council/>
<link rel=alternate hreflang=en href=https://zavarov.com/en/council/>
<meta name=description content="Team"><meta property=og:type content=article>
<meta property=article:published_time content=0001><meta property=og:image content=https://zavarov.com/images/card.png>
<link rel=stylesheet href=/css/main.css integrity=old><script src=/js/team.js integrity=old></script>
<script type=application/ld+json>{"@type":"BlogPosting"}</script></head>
<body><svg><path d="M0"/></svg><a href="https://council.zavarov.com/login?next=%2Fprofiles">Login</a></body></html>"""
            files = {
                "council/index.html": page.encode(),
                "en/council/index.html": page.encode(),
                "css/main.css": b"body{font-family:Inter} @font-face{src:url('/fonts/inter.woff2')}",
                "fonts/inter.woff2": b"font fixture",
                "images/card.png": b"image fixture",
                "js/team.js": b'fetch("/auth/login/council/team")',
            }
            for slug in ("qui-gon", "dexter", "lando", "padme"):
                files[f"council/avatars/{slug}.png"] = b"portrait fixture"
            for path, data in files.items():
                target = root / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
            output = root / "bundle.tar.gz"
            bundle.package(root, output)
            with tarfile.open(output) as archive:
                content = {
                    item.name: archive.extractfile(item).read() for item in archive
                }
            self.assertTrue(
                all(
                    name in ("index.html", "en/index.html")
                    or name.startswith("council/")
                    for name in content
                )
            )
            text = content["index.html"].decode()
            tags = Tags(text).tags
            css = next(
                attrs
                for tag, attrs in tags
                if tag == "link" and attrs.get("rel") == "stylesheet"
            )
            data = content[css["href"].lstrip("/")]
            self.assertEqual(
                css["integrity"],
                "sha256-" + base64.b64encode(hashlib.sha256(data).digest()).decode(),
            )
            for reference in bundle.CSS_URL.finditer(data.decode()):
                self.assertEqual(content[reference[2].lstrip("/")], b"font fixture")
            script = next(
                attrs for tag, attrs in tags if tag == "script" and "src" in attrs
            )
            self.assertEqual(content[script["src"].lstrip("/")], files["js/team.js"])
            self.assertIn('href="https://council.zavarov.com/"', text)
            self.assertIn('href="https://council.zavarov.com/en/"', text)
            self.assertIn('property="og:type" content="website"', text)
            self.assertNotIn("article:published_time", text)
            self.assertNotIn("BlogPosting", text)
            self.assertIn('"@type": "WebPage"', text)
            self.assertIn('<path d="M0"/>', text)

    def test_missing_and_symlinked_assets_fail_the_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            with self.assertRaises(ValueError):
                bundle.Bundle(root).asset("missing.css")
            private = root / "private.txt"
            private.write_text("not an asset")
            (root / "linked.css").symlink_to(private)
            with self.assertRaises(ValueError):
                bundle.Bundle(root).asset("linked.css")


if __name__ == "__main__":
    unittest.main()
