import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkSite } from "../scripts/check-site.mjs";
import { createHash } from "node:crypto";

test("srcset and CSS references resolve from their own documents, including imports and escaped URLs", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "asset-graph-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "public/css/nested", "public/img", "public/fonts", "public/post"]) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, "public/img/a,b.svg"), '<svg id="icon"/>');
  await writeFile(join(root, "public/fonts/a b.woff2"), "font");
  await writeFile(join(root, "public/css/main.css"), `
    @import "nested/child.css";
    @import url('https://elsewhere.example/remote.css');
    @font-face {src:url(../fonts/a\\20 b.woff2)}
    .mask {background:URL('../img/a,b.svg#icon');filter:url(#local-mask)}
    .missing {background:image-set("../img/missing.png" 2x, url(../img/a,b.svg) 1x)}
    /* url(comment-is-not-an-asset) */`);
  await writeFile(join(root, "public/css/nested/child.css"), '@font-face {src:url(../../fonts/missing.woff2)}');
  await writeFile(join(root, "public/post/index.html"), `
    <base href="/sub/">
    <link rel="stylesheet" href="css/main.css">
    <link rel="preload" as="image" imagesrcset="img/a,b.svg 1x, img/preload-missing.svg 2x">
    <picture><source srcset="img/a,b.svg 320w, img/source-missing.svg 640w"><img src="img/a,b.svg" srcset="data:image/png;base64,AAAA 1x, img/image-missing.svg 2x"></picture>
    <style>.inline {background:url(img/style-missing.svg)}</style>
    <p style="background:url(img/attribute-missing.svg)">Text</p>
    <template><img srcset="inert-missing.svg 2x"></template>`);
  const errors = await checkSite({ root, baseURL: "https://example.org/sub/" });
  assert.equal(errors.length, 7, errors.join("\n"));
  for (const name of ["missing.png", "missing.woff2", "preload-missing.svg", "source-missing.svg", "image-missing.svg", "style-missing.svg", "attribute-missing.svg"]) {
    assert.ok(errors.some(error => error.includes(name)), name);
  }
  assert.ok(errors.some(error => error.startsWith("css/nested/child.css:")));
});

test("local asset integrity checks detect stale files and use the strongest advertised hash", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "integrity-check-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "public/assets"]) await mkdir(join(root, dir), { recursive: true });
  const content = "body { color: black; }";
  const hash = (algorithm, text = content) => `${algorithm}-${createHash(algorithm).update(text).digest("base64")}`;
  await writeFile(join(root, "public/assets/main.css"), content);
  await writeFile(join(root, "public/index.html"), `
    <link rel="stylesheet" href="assets/main.css?valid" integrity="${hash('sha256')}">
    <link rel="stylesheet" href="assets/main.css?stale" integrity="${hash('sha256', 'old file')}">
    <link rel="preload" as="style" href="assets/main.css?stronger" integrity="${hash('sha256')} ${hash('sha384', 'old file')}">
    <link rel="stylesheet" href="assets/main.css?alternate" integrity="${hash('sha512', 'old file')} ${hash('sha512')}">
    <script src="assets/main.css?script" integrity="${hash('sha256', 'old script')}"></script>
    <link rel="stylesheet" href="https://external.example/style.css" integrity="${hash('sha256')}">
    <template><script src="missing.js" integrity="${hash('sha256')}"></script></template>`);
  const errors = await checkSite({ root, baseURL: "https://example.com/sub/" });
  assert.equal(errors.length, 3, errors.join("\n"));
  for (const query of ["stale", "stronger", "script"]) {
    assert.ok(errors.some(message => message.includes(`integrity mismatch assets/main.css?${query}`)));
  }
});

test("HTML link checks handle relative URLs, own origin, fragments and query strings", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "link-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "public/post", "public/images"]) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, "content/ru/_index.md"), '+++\ntitle="Home"\n+++\n![Image](/images/photo.webp?v=2)\n');
  await writeFile(join(root, "public/images/photo.webp"), "test image");
  await writeFile(join(root, "public/index.html"), '<div id="root"></div>');
  await writeFile(join(root, "public/post/index.html"), `<h2 id="привет">Hello</h2>
    <a href="https://example.com/post/#%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82">Existing</a>
    <img src='../images/photo.webp?v=2&amp;size=large'>
    <a href="../#root">Root anchor</a>
    <a href="https://elsewhere.example/images/missing.png">External</a>
    <a href="missing/">Missing relative</a>
    <a href="https://example.com/missing/">Missing absolute</a>
    <a href="#absent">Missing fragment</a>`);
  const errors = await checkSite({ root, baseURL: "https://example.com/" });
  assert.equal(errors.length, 3, errors.join("\n"));
  assert.ok(errors.some((s) => s.includes("missing output missing/")));
  assert.ok(errors.some((s) => s.includes("missing output https://example.com/missing/")));
  assert.ok(errors.some((s) => s.includes("missing anchor #absent")));
});

test("telegram_post is a message ID, not the URL from the former archetype", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "metadata-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "public"]) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, "content/ru/_index.md"), '+++\ntitle="Home"\ntelegram_post="https://t.me/example/123"\n+++\n');
  await writeFile(join(root, "public/index.html"), "<p>Home</p>");
  const errors = await checkSite({ root, baseURL: "https://example.com/" });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /positive integer/);
});


test("page bundles validate source text and front matter", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "bundle-metadata-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "content/ru/metadata", "content/ru/invalid", "public"]) {
    await mkdir(join(root, dir), { recursive: true });
  }
  await writeFile(join(root, "content/ru/_index.md"), '+++\ntitle="Home"\n+++\n');
  await writeFile(join(root, "content/ru/metadata/_index.md"), '+++\ntitle="Ещ\u0451 одна страница"\ntelegram_post="https://t.me/example/123"\n+++\n');
  await writeFile(join(root, "content/ru/invalid/_index.md"), '+++\ntitle="Unclosed string\n+++\n');
  await writeFile(join(root, "public/index.html"), "<p>Home</p>");

  const errors = await checkSite({ root, baseURL: "https://example.com/" });
  assert.equal(errors.length, 3, errors.join("\n"));
  assert.ok(errors.some((message) => message.includes("ru/metadata/_index.md: contains a forbidden Russian letter")));
  assert.ok(errors.some((message) => message.includes("ru/metadata/_index.md: telegram_post must be a positive integer")));
  assert.ok(errors.some((message) => message.includes("ru/invalid/_index.md: invalid TOML")));
});

test("an invalid content path fails validation", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "content-path-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "public"));
  await writeFile(join(root, "content"), "not a directory");
  await writeFile(join(root, "public/index.html"), "<p>Home</p>");
  await assert.rejects(checkSite({ root, baseURL: "https://example.com/" }), { code: "ENOTDIR" });
});

test("empty output, duplicate element IDs and malformed base URLs fail validation", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "output-check-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "public"]) await mkdir(join(root, dir), { recursive: true });
  const options = { root, baseURL: "https://example.com/" };
  assert.deepEqual(await checkSite(options), ["No HTML pages found; run Hugo before this check"]);
  await writeFile(join(root, "public/index.html"), '<h2 id="same">One</h2><p id="same">Two</p><base href="http://[invalid"><a href="relative">Link</a>');
  const errors = await checkSite(options);
  assert.equal(errors.length, 2, errors.join("\n"));
  assert.ok(errors.some((message) => message.includes("duplicate element id same")));
  assert.ok(errors.some((message) => message.includes("malformed base URL")));
});

test("legacy named anchors remain valid and encoded paths cannot escape the output directory", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "anchor-boundary-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "public"]) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, "public/index.html"), '<a name="section"></a><h2 id="section">Heading</h2><a href="#section">Jump</a><a href="/%2e%2e%2f">Outside</a>');
  const errors = await checkSite({ root, baseURL: "https://example.com/" });
  assert.equal(errors.length, 1, errors.join("\n"));
  assert.match(errors[0], /invalid local path/);
});
