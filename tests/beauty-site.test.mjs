import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const directory = join(root, "beauty");
const attrs = node => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap(child => all(child, predicate))];
const hasClass = (node, name) => (attrs(node).class || "").split(/\s+/).includes(name);
const text = node => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");

test("Beauty examples, tokens and exact downloads are pinned without the standalone demo shell", async () => {
  const manifest = JSON.parse(await readFile(join(directory, "upstream.json"), "utf8"));
  if (process.env.CI || manifest.source !== "local-development") assert.match(manifest.revision, /^[a-f0-9]{40}$/);
  const files = [];
  async function walk(base, prefix) {
    for (const entry of await readdir(base, { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(join(base, entry.name), `${prefix}${entry.name}/`);
      else { assert.ok(entry.isFile()); files.push(`${prefix}${entry.name}`); }
    }
  }
  for (const path of ["data", "public"]) await walk(join(directory, path), `${path}/`);
  assert.deepEqual(files.sort(), Object.keys(manifest.files).sort());
  for (const file of files) assert.equal(createHash("sha256").update(await readFile(join(directory, file))).digest("hex"), manifest.files[file], file);
  assert.ok(files.every(file => !/\.(html|js)$/.test(file)), "no standalone page shell or UI script");
  const data = JSON.parse(await readFile(join(directory, "data/catalog.json"), "utf8"));
  for (const language of ["ru", "en"]) assert.equal(data.sections[language].flatMap(s => s.examples).length, 17);
  assert.equal(data.colors.length, 11);
  assert.ok(data.tokens.length > 40);
  assert.deepEqual(await readFile(join(directory, "public/dist/beauty.min.css")), await readFile(join(root, "themes/hugo-mini/assets/css/beauty.css")), "downloaded examples and the blog foundation use the same library CSS");
});

test("Beauty uses the blog shell, shared assets, SEO and exact copyable specimens", async t => {
  const work = await mkdtemp(join(tmpdir(), "beauty-hugo-"));
  t.after(() => rm(work, { recursive: true, force: true }));
  const output = join(work, "public");
  execFileSync(process.env.HUGO_BIN || "hugo", ["--minify", "--panicOnWarning", "--noBuildLock", "--destination", output, "--cacheDir", join(work, "cache")], {
    cwd: root, stdio: "pipe", env: { ...process.env, HUGO_RESOURCEDIR: join(work, "resources") },
  });
  const homepage = parse(await readFile(join(output, "index.html"), "utf8"));
  const styles = page => all(page, n => n.tagName === "link" && attrs(n).rel === "stylesheet").map(n => attrs(n).href);
  const data = JSON.parse(await readFile(join(directory, "data/catalog.json"), "utf8"));
  for (const [lang, prefix] of [["ru", ""], ["en", "en/"]]) {
    const html = await readFile(join(output, "beauty", prefix, "index.html"), "utf8");
    const page = parse(html);
    assert.equal(attrs(all(page, n => n.tagName === "html")[0]).lang, lang);
    assert.equal(attrs(all(page, n => n.tagName === "link" && attrs(n).rel === "canonical")[0]).href, `https://zavarov.com/beauty/${prefix}`);
    assert.equal(all(page, n => n.tagName === "h1").length, 1);
    assert.equal(text(all(page, n => n.tagName === "h1")[0]), "Beauty.css");
    assert.deepEqual(styles(page), styles(homepage), "only the shared blog stylesheet");
    for (const name of ["header-container", "title-avatar", "main-nav", "mobile-menu-toggle", "theme-toggle"]) assert.ok(all(page, n => hasClass(n, name)).length, name);
    assert.ok(all(page, n => n.tagName === "script" && /\/js\/main\.min\./.test(attrs(n).src || "")).length);
    const examples = all(page, n => Object.hasOwn(attrs(n), "data-example"));
    assert.equal(examples.length, 17);
    const sources = all(page, n => hasClass(n, "code-block")).map(n => attrs(n)["data-code"]);
    for (const { html: source } of data.sections[lang].flatMap(s => s.examples)) assert.ok(sources.includes(source), "copy source preserves upstream HTML");
    assert.doesNotMatch(html, /assets\/site\.css|assets\/theme\.js|contents-disclosure|class=hero/);
    assert.ok((await readFile(join(output, lang, "sitemap.xml"), "utf8")).includes(`<loc>https://zavarov.com/beauty/${prefix}</loc>`));
  }
});
