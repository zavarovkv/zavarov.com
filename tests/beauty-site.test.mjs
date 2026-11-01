import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { parse } from "parse5";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = join(root, "beauty/public");
const attrs = node => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap(child => all(child, predicate))];

test("the Beauty site is a pinned, complete offline snapshot with a small loading budget", async () => {
  const manifest = JSON.parse(await readFile(join(root, "beauty/upstream.json"), "utf8"));
  if (process.env.CI || manifest.source !== "local-development") assert.match(manifest.revision, /^[a-f0-9]{40}$/);
  const files = [];
  async function walk(base, prefix = "") {
    for (const entry of await readdir(base, { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(join(base, entry.name), `${prefix}${entry.name}/`);
      else { assert.ok(entry.isFile()); files.push(`${prefix}${entry.name}`); }
    }
  }
  await walk(directory);
  assert.deepEqual(files.sort(), Object.keys(manifest.files).sort());
  for (const file of files) {
    assert.equal(createHash("sha256").update(await readFile(join(directory, file))).digest("hex"), manifest.files[file], file);
  }
  for (const [lang, path] of [["ru", ""], ["en", "en/"]]) {
    const bytes = await readFile(join(directory, path, "index.html"));
    const page = parse(bytes.toString());
    assert.equal(attrs(all(page, n => n.tagName === "html")[0]).lang, lang);
    assert.equal(attrs(all(page, n => n.tagName === "link" && attrs(n).rel === "canonical")[0]).href, `https://zavarov.com/beauty/${path}`);
    assert.equal(all(page, n => n.tagName === "h1").length, 1);
    const resources = all(page, n => n.tagName === "script" && attrs(n).src || n.tagName === "link" && attrs(n).rel === "stylesheet").map(n => attrs(n).src || attrs(n).href);
    assert.equal(resources.length, 3, "one CSS library, documentation layout and optional UI script");
    let transfer = gzipSync(bytes).length;
    for (const resource of resources) {
      assert.doesNotMatch(resource, /^(?:https?:)?\/\//, "no third-party runtime assets");
      const file = new URL(resource, `https://zavarov.com/beauty/${path}`).pathname.replace("/beauty/", "");
      transfer += gzipSync(await readFile(join(directory, file))).length;
    }
    assert.ok(transfer < 25 * 1024, `${lang}: initial HTML/CSS/JS should stay below 25 KiB gzip, got ${transfer}`);
    assert.ok(all(page, n => n.tagName === "div" && Object.hasOwn(attrs(n), "data-example")).length >= 17);
    assert.doesNotMatch(bytes.toString(), /\/css\/main|\/js\/main|yandex|google-analytics/);
  }
});

test("Hugo serves Beauty unchanged and indexes both routes without rendering blog wrappers", async t => {
  const work = await mkdtemp(join(tmpdir(), "beauty-hugo-"));
  t.after(() => rm(work, { recursive: true, force: true }));
  const output = join(work, "public");
  execFileSync(process.env.HUGO_BIN || "hugo", ["--minify", "--panicOnWarning", "--noBuildLock", "--destination", output, "--cacheDir", join(work, "cache")], {
    cwd: root, stdio: "pipe", env: { ...process.env, HUGO_RESOURCEDIR: join(work, "resources") },
  });
  for (const [lang, prefix] of [["ru", ""], ["en", "en/"]]) {
    const source = await readFile(join(directory, prefix, "index.html"));
    assert.deepEqual(await readFile(join(output, "beauty", prefix, "index.html")), source);
    const sitemap = await readFile(join(output, lang, "sitemap.xml"), "utf8");
    assert.ok(sitemap.includes(`<loc>https://zavarov.com/beauty/${prefix}</loc>`));
  }
  await readFile(join(output, "images/favicon.png"));
  await readFile(join(output, "fonts/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-300.woff2"));
});
