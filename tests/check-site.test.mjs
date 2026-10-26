import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkSite } from "../scripts/check-site.mjs";

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


test("event bundles receive the same source validation as blog content", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "event-metadata-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "events/content/ru/metadata", "events/content/ru/invalid", "public"]) {
    await mkdir(join(root, dir), { recursive: true });
  }
  await writeFile(join(root, "content/ru/_index.md"), '+++\ntitle="Home"\n+++\n');
  await writeFile(join(root, "events/content/ru/metadata/_index.md"), '+++\ntitle="Ещ\u0451 один вебинар"\ntelegram_post="https://t.me/example/123"\n+++\n');
  await writeFile(join(root, "events/content/ru/invalid/_index.md"), '+++\ntitle="Unclosed string\n+++\n');
  await writeFile(join(root, "public/index.html"), "<p>Home</p>");

  const errors = await checkSite({ root, baseURL: "https://example.com/" });
  assert.equal(errors.length, 3, errors.join("\n"));
  assert.ok(errors.some((message) => message.includes("events/content/ru/metadata/_index.md: contains a forbidden Russian letter")));
  assert.ok(errors.some((message) => message.includes("events/content/ru/metadata/_index.md: telegram_post must be a positive integer")));
  assert.ok(errors.some((message) => message.includes("events/content/ru/invalid/_index.md: invalid TOML")));
});

test("an invalid events content path is not ignored as an absent optional module", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "event-content-path-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["content/ru", "events", "public"]) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, "content/ru/_index.md"), '+++\ntitle="Home"\n+++\n');
  await writeFile(join(root, "events/content"), "not a directory");
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
