import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {parse as parseHTML} from "parse5";
import {parse as parseTOML} from "smol-toml";
import {readDocument} from "../scripts/lib/content.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const katex = require("../themes/hugo-mini/static/katex/katex.min.js");
const attrs = (node) => Object.fromEntries((node.attrs || []).map(({name, value}) => [name, value]));
const text = (node) => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap((child) => all(child, predicate))];

test("the restored shelf is one ordinary article with indexable reviews", async (t) => {
  const config = parseTOML(await readFile(join(root, "config.toml"), "utf8"));
  const registry = parseTOML(await readFile(join(root, "data/books.toml"), "utf8"));
  const source = readDocument(await readFile(join(root, "content/ru/blog/books.md"), "utf8"));
  assert.deepEqual(source.data.categories, ["collections"]);
  assert.ok(registry.items.length >= 81, "preserve the imported shelf while allowing new books");
  const work = await mkdtemp(join(tmpdir(), "zavarov-books-"));
  t.after(() => rm(work, {recursive: true, force: true}));
  const output = join(work, "public");
  execFileSync(process.env.HUGO_BIN || "hugo", ["--minify", "--panicOnWarning", "--noBuildLock", "--destination", output, "--cacheDir", join(work, "cache")], {
    cwd: root, stdio: "pipe", env: {...process.env, HUGO_RESOURCEDIR: join(work, "resources")},
  });
  const shelf = parseHTML(await readFile(join(output, "books/index.html"), "utf8"));
  const sitemap = await readFile(join(output, "ru/sitemap.xml"), "utf8");
  const indexedURLs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).href));
  const list = all(shelf, (node) => attrs(node).class?.split(" ").includes("reading-shelf"))[0];
  assert.equal(list.tagName, "table");
  const headers = all(list, (node) => node.tagName === "th");
  assert.deepEqual(headers.map(text), ["Книга", "Прочитана"]);
  assert.ok(headers.every((node) => attrs(node).scope === "col"));
  const body = all(list, (node) => node.tagName === "tbody")[0];
  const rows = all(body, (node) => node.tagName === "tr");
  assert.equal(rows.length, registry.items.length);
  assert.equal(all(list, (node) => ["h2", "h3", "br", "strong", "b"].includes(node.tagName)).length, 0,
    "one continuous table without year groups, forced breaks or bold dates");
  assert.deepEqual(rows.map((row) => attrs(row).id),
    registry.items.toSorted((a, b) => b.read.localeCompare(a.read)).map((book) => `book-${book.id}`));
  for (const book of registry.items) {
    const row = rows.find((node) => attrs(node).id === `book-${book.id}`);
    assert.ok(row, book.id);
    const cells = all(row, (node) => node.tagName === "td");
    assert.equal(cells.length, 2);
    assert.ok(text(cells[0]).includes(book.title));
    assert.ok(text(cells[0]).includes(book.author));
    assert.equal(attrs(cells[1]).class, "reading-date");
    assert.equal(text(cells[1]), book.read.split("-").reverse().join("."));
    const readingTimes = all(cells[1], (node) => node.tagName === "time");
    assert.equal(readingTimes.length, 1);
    assert.equal(attrs(readingTimes[0]).datetime, book.read);
    const details = all(cells[0], (node) => attrs(node).class === "reading-meta")[0];
    assert.ok(text(details).includes(book.author));
    if (book.year) assert.ok(text(details).includes(String(book.year)), "the year belongs with the author");
    if (!book.review) continue;
    const file = join(root, "content/ru", book.review.replace(/^\//, "") + ".md");
    const sourceText = new TextDecoder("utf-8", {fatal: true}).decode(await readFile(file));
    assert.doesNotMatch(sourceText, /\uFFFD|book-details|\{\{[<%]|<\/?(?:style|font|span|div)\b/);
    const review = readDocument(sourceText);
    assert.doesNotMatch(review.body, /\p{L}+-[ \t\u00a0]+\p{Ll}/u, "no words split by an imported hyphen");
    assert.doesNotMatch(review.body, /(?<!\p{L})(\p{L}{2,})[ \t\u00a0]+\1(?!\p{L})/iu, "no accidental adjacent word duplicates");
    assert.doesNotMatch(review.body, /\\[\[\]]|\*\*—|\S[ \t]{2,}\n|\n>(?:[ \t]*\n>){2}/u,
      "no escaped link labels, joined dashes, forced breaks or empty quote paragraphs");
    assert.equal((review.body.match(/«/g) || []).length, (review.body.match(/»/g) || []).length,
      "quotation marks remain balanced");
    assert.equal(review.data.title, `«${book.title}», ${book.author}`);
    assert.equal(review.data.date, `${book.read}-01T00:00:00+03:00`);
    assert.equal(review.data.date_precision, "month");
    assert.ok(new Date(review.data.lastmod) >= new Date(review.data.date), "restoration date stays separate from publication");
    assert.equal(review.data.hidden, true);
    assert.deepEqual(review.data.categories, ["collections"]);
    assert.ok(!review.data.url.startsWith("/"), "legacy URLs must remain language-relative");
    const href = all(row, (node) => node.tagName === "a")[0];
    const expected = new URL(review.data.url, config.baseURL).href;
    assert.ok(indexedURLs.has(expected), "each review remains in the sitemap");
    assert.equal(new URL(attrs(href).href, config.baseURL).href, expected);
    const page = parseHTML(await readFile(join(output, decodeURI(new URL(expected).pathname), "index.html"), "utf8"));
    assert.deepEqual(all(page, (node) => node.tagName === "h1").map(text), [review.data.title]);
    const canonical = all(page, (node) => node.tagName === "link" && attrs(node).rel === "canonical");
    assert.equal(canonical.length, 1);
    assert.equal(new URL(attrs(canonical[0]).href).href, expected);
    const metadata = all(page, (node) => node.tagName === "meta");
    const meta = (key) => attrs(metadata.find((node) => (attrs(node).property || attrs(node).name) === key)).content;
    assert.equal(meta("description"), review.data.description);
    for (const prefix of ["og", "twitter"]) {
      assert.equal(meta(`${prefix}:title`), review.data.title);
      assert.equal(meta(`${prefix}:description`), review.data.description);
    }
    assert.equal(new URL(meta("og:url")).href, expected);
    assert.match(meta("robots"), /^index, follow/);
    const date = all(page, (node) => node.tagName === "time" && attrs(node).class === "post-date")[0];
    assert.equal(attrs(date).datetime, book.read, "do not display an unknown reading day");
    const monthName = new Intl.DateTimeFormat("ru", {month: "long", timeZone: "UTC"}).format(new Date(`${book.read}-15T00:00:00Z`));
    assert.equal(text(date), `${monthName} ${book.read.slice(0, 4)}`);
    const schema = all(page, (node) => node.tagName === "script" && attrs(node).type === "application/ld+json")
      .map((node) => JSON.parse(text(node))).find((entry) => entry["@type"] === "BlogPosting");
    assert.equal(new Date(schema.datePublished).valueOf(), new Date(review.data.date).valueOf());
    assert.equal(new Date(schema.dateModified).valueOf(), new Date(review.data.lastmod).valueOf());
    const article = all(page, (node) => node.tagName === "article" && attrs(node).lang)[0];
    assert.doesNotMatch(text(article), /\uFFFD|\{\{[<%]|[>%]\}\}|tails list=/);
    assert.equal(all(article, (node) => node.tagName === "em" || Object.hasOwn(attrs(node), "style")).length, 0,
      "restored reviews use native Markdown formatting without imported inline styles or italics");
    assert.equal(all(article, (node) => ["br", "style", "font", "iframe"].includes(node.tagName)).length, 0,
      "reviews rely on ordinary article flow without forced breaks or imported widgets");
    for (const link of all(article, (node) => node.tagName === "a")) {
      assert.ok(text(link).trim() || attrs(link)["aria-label"]?.trim(), "links have visible text or an accessible icon label");
      assert.doesNotMatch(new URL(attrs(link).href, expected).hostname, /(?:^|\.)(?:bookmate\.com|amazon\.com|mann-ivanov-ferber\.ru)$/,
        "direct book and store links are intentionally omitted");
    }
    const paragraphs = all(article, (node) => node.tagName === "p").map((node) => text(node).replace(/\s+/g, " ").trim());
    const prose = paragraphs.filter((paragraph) => !paragraph.startsWith("$$"));
    assert.ok(prose.every(Boolean), "no empty paragraphs from the archive");
    assert.equal(new Set(prose).size, prose.length, "no duplicate prose paragraphs; contextual math repetitions are allowed");
    if (review.data.math) {
      const formulas = [...review.body.matchAll(/\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)/g)];
      assert.ok(formulas.length > 0, "a math article contains renderable expressions");
      const renderedFormulas = [...text(article).matchAll(/\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)/g)];
      assert.equal(renderedFormulas.length, formulas.length, "Goldmark preserves all math delimiters");
      for (const [index, formula] of formulas.entries()) {
        assert.equal((renderedFormulas[index][1] || renderedFormulas[index][2]).trim(), (formula[1] || formula[2]).trim(),
          "Goldmark preserves the LaTeX expression, including escaped percent symbols");
      }
      for (const [, display, inline] of formulas) {
        assert.match(katex.renderToString((display || inline).trim(), {throwOnError: true, displayMode: Boolean(display)}), /class="katex"/);
      }
      for (const asset of ["katex/katex.min.css", "katex/katex.min.js", "katex/auto-render.min.js"]) {
        assert.ok(all(page, (node) => ["link", "script"].includes(node.tagName) &&
          new URL(attrs(node).href || attrs(node).src || "", "https://example.org/").pathname.endsWith(asset)).length, `existing local math asset: ${asset}`);
      }
      assert.doesNotMatch(review.body, /\\{2,}(?:\[|\]|over|times|frac)/, "archive escaping must not leak into math");
    }
    if (book.id === "of-mice-and-men") {
      assert.ok(all(article, (node) => node.tagName === "h2" && text(node).includes("Цитаты на память")).length);
      assert.ok(all(article, (node) => node.tagName === "blockquote" && text(node).replace(/\u00a0/g, " ").includes("У нас люди редко друг друга держатся")).length);
    }
    if (book.id === "never-let-me-go") {
      assert.equal(all(article, (node) => node.tagName === "blockquote").length, 5, "all five quotations use native quote markup");
    }
    if (book.id === "the-product-book") {
      const quotedList = all(article, (node) => node.tagName === "blockquote")
        .flatMap((quote) => all(quote, (node) => node.tagName === "ol"))[0];
      assert.ok(quotedList, "the five stages form a real ordered list inside the quotation");
      assert.equal(all(quotedList, (node) => node.tagName === "li").length, 5);
    }
    if (book.id === "thinking-fast-slow") {
      assert.equal(text(article).split("Даниэль Канеман. Загадка дихотомии «опыт-память»").length - 1, 1,
        "the TED talk has one title without a duplicate caption");
    }
    assert.equal(all(page, (node) => node.tagName === "a" && attrs(node).href === `/books/#book-${book.id}`).length, 0);
  }
  const englishShelf = parseHTML(await readFile(join(output, "en/books/index.html"), "utf8"));
  const englishList = all(englishShelf, (node) => attrs(node).class?.split(" ").includes("reading-shelf"))[0];
  assert.equal(englishList.tagName, "table");
  assert.deepEqual(all(englishList, (node) => node.tagName === "th").map(text), ["Book", "Read"]);
  const englishBody = all(englishList, (node) => node.tagName === "tbody")[0];
  const englishRows = all(englishBody, (node) => node.tagName === "tr");
  assert.equal(englishRows.length, registry.items.length);
  const englishSitemap = await readFile(join(output, "en/sitemap.xml"), "utf8");
  const englishIndexed = new Set([...englishSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).href));
  const englishFeed = JSON.parse(await readFile(join(output, "en/index.json"), "utf8"));
  for (const book of registry.items) {
    const localized = book.translations?.en;
    assert.ok(localized?.title && localized.author, `English bibliography: ${book.id}`);
    assert.match(new URL(localized.source_url).protocol, /^https?:$/);
    const row = englishRows.find((node) => attrs(node).id === `book-${book.id}`);
    assert.ok(text(row).includes(localized.title), book.id);
    assert.ok(text(row).includes(localized.author), book.id);
    assert.ok(text(row).includes(book.read.split("-").reverse().join(".")));
    assert.ok(!text(row).includes(localized.source_url), "bibliographic sources are editorial metadata, not UI links");
    if (!book.review) continue;
    const review = readDocument(await readFile(join(root, "content/en", `${book.review.slice(1)}.md`), "utf8"));
    assert.match(review.data.source_hash, /^[a-f0-9]{64}$/);
    assert.equal(review.data.hidden, true);
    const expected = new URL(`en/${review.data.url}`, config.baseURL).href;
    const href = all(row, (node) => node.tagName === "a")[0];
    assert.equal(new URL(attrs(href).href, config.baseURL).href, expected, "English shelf links to English reviews");
    assert.ok(englishIndexed.has(expected));
    assert.ok(!englishFeed.items.some((item) => item.url === expected), "English reviews stay out of feeds");
    const page = parseHTML(await readFile(join(output, decodeURI(new URL(expected).pathname), "index.html"), "utf8"));
    assert.deepEqual(all(page, (node) => node.tagName === "h1").map(text), [review.data.title]);
    const article = all(page, (node) => node.tagName === "article" && attrs(node).lang === "en")[0];
    assert.ok(article && text(article).trim());
    assert.doesNotMatch(text(article), /\uFFFD|\{\{[<%]|[>%]\}\}|tails list=/);
    assert.equal(all(article, (node) => ["br", "style", "font", "iframe", "em"].includes(node.tagName) || Object.hasOwn(attrs(node), "style")).length, 0);
    const date = all(page, (node) => node.tagName === "time" && attrs(node).class === "post-date")[0];
    assert.equal(attrs(date).datetime, book.read);
    const monthName = new Intl.DateTimeFormat("en", {month: "long", timeZone: "UTC"}).format(new Date(`${book.read}-15T00:00:00Z`));
    assert.equal(text(date), `${monthName} ${book.read.slice(0, 4)}`);
    const alternatives = all(page, (node) => node.tagName === "link" && attrs(node).rel === "alternate" && attrs(node).hreflang);
    for (const [lang, url] of [["en", expected], ["ru", new URL(review.data.url, config.baseURL).href]]) {
      assert.ok(alternatives.some((node) => attrs(node).hreflang === lang && new URL(attrs(node).href).href === url), `reciprocal language links: ${book.id}`);
    }
    const metadata = all(page, (node) => node.tagName === "meta");
    assert.ok(metadata.some((node) => attrs(node).name === "robots" && attrs(node).content.startsWith("index, follow")));
    for (const key of ["description", "og:description", "twitter:description"]) {
      assert.ok(metadata.some((node) => (attrs(node).name || attrs(node).property) === key && attrs(node).content === review.data.description));
    }
    if (review.data.math) {
      const original = readDocument(await readFile(join(root, "content/ru", `${book.review.slice(1)}.md`), "utf8"));
      const formulas = (body) => [...body.matchAll(/\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)/g)].map((match) => (match[1] || match[2]).trim());
      assert.deepEqual(formulas(review.body), formulas(original.body));
      assert.deepEqual(formulas(text(article)), formulas(review.body));
    }
  }
  const englishBlog = parseHTML(await readFile(join(output, "en/blog/index.html"), "utf8"));
  assert.equal(all(englishBlog, (node) => node.tagName === "h3" && text(node) === "Collections").length, 1);
  assert.ok(all(englishBlog, (node) => node.tagName === "a" && attrs(node).href === "/en/books/").length, "the English shelf appears in Articles");
  assert.ok(englishFeed.items.some((item) => item.url === new URL("en/books/", config.baseURL).href));
  const robots = await readFile(join(output, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Sitemap: ${new URL("sitemap.xml", config.baseURL).href}`));
  const blog = parseHTML(await readFile(join(output, "blog/index.html"), "utf8"));
  assert.equal(all(blog, (node) => node.tagName === "h3" && text(node) === "Подборки").length, 1);
  const shelfRow = all(blog, (node) => node.tagName === "li" && text(node).includes(source.data.title))[0];
  if (!registry.items.some((book) => book.added)) {
    assert.equal(all(shelfRow, (node) => attrs(node).class === "badge-new").length, 0,
      "restoring the article alone does not activate New");
  }
});
