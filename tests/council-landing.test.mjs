import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { parse } from "parse5";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const attrs = node => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap(child => all(child, predicate))];
const hasClass = (node, name) => attrs(node).class?.split(" ").includes(name);
const links = document => all(document, node => node.tagName === "a").map(attrs);
const canonical = document => attrs(all(document, node => node.tagName === "link" && attrs(node).rel === "canonical")[0]).href;
const assertEntryPreferences = document => {
  const html = attrs(all(document, node => node.tagName === "html")[0]);
  assert.equal(html["data-preference-cookie-domain"], "zavarov.com");
  assert.equal(html["data-remember-language"], "true");
  assert.equal(html["data-language-preference-entry"], "true");
  const head = all(document, node => node.tagName === "head")[0];
  const firstScript = head.childNodes.findIndex(node => node.tagName === "script");
  const alternates = head.childNodes.filter(node => attrs(node).hreflang);
  assert.ok(alternates.length >= 2);
  assert.ok(alternates.every(node => head.childNodes.indexOf(node) < firstScript), "language destinations are available before preference initialization");
};
const assertProjectFooter = document => {
  const footer = all(document, node => hasClass(node, "social-icons"))[0];
  assert.deepEqual(links(footer).map(a => a.href).sort(), [
    "https://github.com/zavarovkv/agent-council",
    "https://t.me/Qui_Gon_Jinn_ai",
  ], "Council footer links belong to the project and its coordinator");
  assert.ok(links(footer).every(a => a["aria-label"]), "icon links have accessible names");
};

test("Council inherits the blog shell and packages a complete subdomain with working navigation", async t => {
  const work = await mkdtemp(join(tmpdir(), "council-landing-"));
  t.after(() => rm(work, { recursive: true, force: true }));
  const output = join(work, "public");
  execFileSync(process.env.HUGO_BIN || "hugo", ["--minify", "--panicOnWarning", "--noBuildLock", "--destination", output, "--cacheDir", join(work, "cache")], {
    cwd: root, stdio: "pipe", env: { ...process.env, HUGO_RESOURCEDIR: join(work, "resources") },
  });
  // Keep the regression independent of network access and the portrait download step.
  await mkdir(join(output, "council/avatars"), { recursive: true });
  const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=", "base64");
  for (const name of ["qui-gon", "dexter", "lando", "padme"]) await writeFile(join(output, `council/avatars/${name}.png`), pixel);
  const home = parse(await readFile(join(output, "index.html"), "utf8"));
  assertEntryPreferences(home);
  const englishHome = parse(await readFile(join(output, "en/index.html"), "utf8"));
  assertEntryPreferences(englishHome);
  for (const homepage of [home, englishHome]) {
    const projects = links(homepage).filter(a => a.class === "project-link");
    assert.deepEqual(projects.map(a => a.href), [
      "https://themes.gohugo.io/themes/hugo-mini/",
      "https://www.npmjs.com/package/beauty-css",
    ], "blog homepages list only the two public design projects");
    const projectLinks = all(homepage, node => node.tagName === "a" && hasClass(node, "project-link"));
    const spinButtons = all(homepage, node => node.tagName === "button" && hasClass(node, "project-mark-button"));
    assert.equal(spinButtons.length, 2, "both public design projects have separate logo controls");
    const logos = [
      { name: "Hugo Mini", paths: ["/images/hugo-mini-logo-light.svg", "/images/hugo-mini-logo-dark.svg"] },
      { name: "Beauty.css", paths: ["/images/beauty-logo-light.svg", "/images/beauty-logo-dark.svg"] },
    ];
    for (const [index, { name, paths }] of logos.entries()) {
      const button = spinButtons[index];
      assert.ok(Object.hasOwn(attrs(button), "disabled"), "logos stay decorative until JavaScript initializes");
      assert.equal(attrs(button)["aria-label"], homepage === home ? `Покрутить логотип ${name}` : `Spin the ${name} logo`);
      assert.equal(all(projectLinks[index], node => node.tagName === "button").length, 0, "project links have no nested controls");
      const mark = all(button, node => hasClass(node, "project-mark"))[0];
      assert.ok(mark && hasClass(mark, "has-dark-mark"), `${name} has artwork for both themes`);
      const images = all(mark, node => node.tagName === "img").map(attrs);
      assert.deepEqual(images.map(image => image.src), paths);
      assert.ok(images.every(image => image.alt === "" && image.width === "18" && image.height === "18"),
        "decorative marks do not duplicate the accessible project name or shift the layout");
    }
  }
  const sharedCSS = attrs(all(home, node => node.tagName === "link" && attrs(node).rel === "stylesheet")[0]).href;
  const snapshot = JSON.parse(await readFile(join(root, "data/council_statistics.json"), "utf8"));
  for (const prefix of ["", "en/"]) {
    const html = await readFile(join(output, prefix, "council/index.html"), "utf8");
    const page = parse(html);
    assertEntryPreferences(page);
    assertProjectFooter(page);
    assert.equal(canonical(page), `https://council.zavarov.com/${prefix}`);
    assert.equal(all(page, node => node.tagName === "h1").length, 1);
    for (const name of ["council-header", "footer-controls", "theme-toggle", "beauty-reading"]) {
      assert.equal(all(page, node => hasClass(node, name)).length, 1, name);
    }
    assert.equal(all(page, node => hasClass(node, "council-member-heading")).length, 6);
    const counters = all(page, node => Object.hasOwn(attrs(node), "data-metric"));
    assert.equal(counters.length, 2, "two activity counters are present without JavaScript");
    for (const counter of counters) {
      const metric = attrs(counter)["data-metric"];
      const total = all(counter, node => Object.hasOwn(attrs(node), "data-total"))[0];
      const count = attrs(total).value;
      assert.equal(count, snapshot.totals[metric] === null ? "" : String(snapshot.totals[metric]));
      assert.equal(total.tagName, "data", "the rounded display preserves its exact numeric value");
      assert.ok(attrs(total).title);
      assert.equal(all(counter, node => ["svg", "table", "time"].includes(node.tagName) || Object.hasOwn(attrs(node), "data-agent")).length, 0, "counters have no charts, dates or agent breakdown");
    }
    assert.equal(all(page, node => attrs(node)["data-updated"] === snapshot.fetched_at).length, 1);
    const statistics = all(page, node => node.tagName === "section" && attrs(node).id === "council-statistics-title")[0];
    assert.ok(attrs(statistics)["aria-label"], "the counters keep an accessible section name");
    assert.equal(all(statistics, node => node.tagName === "h2").length, 0, "the counters have no visible heading");
    const counterList = all(statistics, node => hasClass(node, "council-counters"))[0];
    assert.equal(attrs(counterList).tabindex, "0", "the native mobile scroller is keyboard focusable");
    assert.equal(all(counterList, node => node.tagName === "dt").length, 4);
    const tools = all(page, node => hasClass(node, "council-tools"))[0];
    const toolsTotal = all(statistics, node => Object.hasOwn(attrs(node), "data-tools-total"))[0];
    assert.equal(Number(toolsTotal.childNodes.map(node => node.value || "").join("")), all(tools, node => node.tagName === "h3").length, "integration count follows the rendered service catalog");
    const team = all(page, node => hasClass(node, "council-team"))[0];
    const rosterTotal = all(page, node => Object.hasOwn(attrs(node), "data-roster-total"))[0];
    assert.equal(Number(rosterTotal.childNodes.map(node => node.value || "").join("")), all(team, node => node.tagName === "h3").length);
    const workflow = all(page, node => hasClass(node, "beauty-steps"))[0];
    assert.equal(workflow.tagName, "ol");
    assert.equal(all(workflow, node => node.tagName === "li").length, 3);
    assert.deepEqual(all(team, node => node.tagName === "h3").map(node => attrs(node).id),
      ["council-qui-gon", "council-galen-erso", "council-dexter", "council-lando", "council-padme", "council-k-2so"]);
    const portraits = all(team, node => node.tagName === "img");
    assert.equal(portraits.length, 6);
    assert.equal(all(team, node => attrs(node)["data-status"]).length, 0);
    for (const portrait of portraits.filter(node => attrs(node).src.includes("/portraits/"))) {
      const png = await readFile(join(output, new URL(attrs(portrait).src, "https://zavarov.com").pathname));
      assert.equal(png.readUInt32BE(16), 256);
      assert.equal(png.readUInt32BE(20), 256);
      assert.equal(png[25], 6, "generated portraits retain transparent alpha after Hugo resizing");
    }
    assert.ok(all(page, node => node.tagName === "link").some(node => attrs(node).href === sharedCSS));
    assert.ok(links(page).some(a => a.href === "https://council.zavarov.com/auth/login?provider=telegram-owner&next=%2Fprofiles"));
    assert.equal(all(page, node => hasClass(node, "title-avatar")).length, 0);
    const toggle = all(page, node => hasClass(node, "mobile-menu-toggle"))[0];
    assert.equal(toggle.tagName, "button");
    assert.equal(attrs(toggle)["aria-expanded"], "false");
    const header = all(page, node => hasClass(node, "council-header"))[0];
    assert.ok(links(header).every(a => !a.href.includes("/auth/login")), "login stays outside the top menu");
    const earlyAccess = all(page, node => attrs(node)["aria-labelledby"] === "council-access-title")[0];
    const note = all(earlyAccess, node => hasClass(node, "beauty-note"))[0];
    assert.equal(links(note)[0].href, "https://council.zavarov.com/auth/login?provider=telegram-owner&next=%2Fprofiles");
    assert.equal(all(page, node => hasClass(node, "tg-auth-button")).length, 0);
    const navigation = all(page, node => hasClass(node, "council-nav"))[0];
    assert.ok(hasClass(navigation, "main-nav"));
    assert.equal(attrs(toggle)["aria-controls"], attrs(navigation).id);
    assert.deepEqual(links(navigation).map(a => a.href), [
      "#council-team-title", "#council-workflow-title", "#council-tools-title", "#council-access-title",
    ]);
    for (const link of links(navigation)) {
      assert.equal(all(page, node => attrs(node).id === link.href.slice(1)).length, 1);
    }
    assert.ok(all(page, node => node.tagName === "meta").some(node => attrs(node).property === "og:type" && attrs(node).content === "website"));
    assert.doesNotMatch(html, /article:published_time|class=cta/);
    assert.ok(all(page, node => attrs(node).property === "og:site_name" && attrs(node).content === "Agent Council").length);
    const alternates = Object.fromEntries(all(page, node => node.tagName === "link" && attrs(node).hreflang).map(node => [attrs(node).hreflang, attrs(node).href]));
    assert.deepEqual(alternates, { ru: "https://council.zavarov.com/", en: "https://council.zavarov.com/en/", "x-default": "https://council.zavarov.com/" });
    assert.doesNotMatch(await readFile(join(output, prefix || "ru/", "sitemap.xml"), "utf8"), /\/council\//, "blog sitemap omits copies canonicalized to the subdomain");
  }

  const archive = join(work, "council.tar.gz");
  const unpacked = join(work, "unpacked");
  await mkdir(unpacked);
  execFileSync("python3", [join(root, "scripts/package-council-landing.py"), "--public-dir", output, "--output", archive]);
  execFileSync("tar", ["-xzf", archive, "-C", unpacked]);
  const names = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n");
  assert.equal(names.filter(name => name.endsWith(".woff2")).length, 4, "include CSS-only font weights, not just preloads");
  assert.ok(names.some(name => /^council\/assets\/[a-f0-9]{64}\.js$/.test(name)));
  assert.ok(names.every(name => ["index.html", "en/index.html"].includes(name) || name.startsWith("council/")), "archive follows the restricted server installer contract");
  for (const prefix of ["", "en/"]) {
    const page = parse(await readFile(join(unpacked, prefix, "index.html"), "utf8"));
    assertEntryPreferences(page);
    assertProjectFooter(page);
    assert.equal(canonical(page), `https://council.zavarov.com/${prefix}`);
    assert.ok(links(page).some(a => a.class === "lang-toggle" && a.href === `https://council.zavarov.com/${prefix ? "" : "en/"}`));
    assert.ok(links(page).some(a => a.href === "https://council.zavarov.com/auth/login?provider=telegram-owner&next=%2Fprofiles"));
    const metadata = all(page, node => node.tagName === "script" && attrs(node).type === "application/ld+json")
      .map(node => JSON.parse(node.childNodes.map(child => child.value).join("")));
    assert.equal(metadata.find(block => block["@type"] === "WebPage").url, `https://council.zavarov.com/${prefix}`);
    assert.equal(metadata.find(block => block["@type"] === "WebPage").author.url, "https://zavarov.com/");
    assert.equal(metadata.find(block => block["@type"] === "WebSite").name, "Agent Council");
    assert.equal(metadata.find(block => block["@type"] === "WebSite").url, "https://council.zavarov.com/");
    assert.ok(!metadata.some(block => block["@type"] === "BreadcrumbList"), "standalone landing has no blog breadcrumb trail");
    const shareImage = attrs(all(page, node => attrs(node).property === "og:image")[0]).content;
    assert.match(new URL(shareImage).pathname, /^\/council\/assets\/[a-f0-9]{64}\.png$/);
    assert.deepEqual(await readFile(join(unpacked, new URL(shareImage).pathname)), await readFile(join(output, prefix, "council/og.png")), "retain the localized landing share image");
    for (const node of all(page, node => ["link", "script", "img"].includes(node.tagName))) {
      const a = attrs(node);
      const value = a.src || a.href;
      if (!value || (node.tagName === "link" && ["canonical", "alternate"].includes(a.rel))) continue;
      const url = new URL(value, "https://council.zavarov.com/");
      if (url.origin !== "https://council.zavarov.com") continue;
      const path = join(unpacked, decodeURIComponent(url.pathname));
      await access(path);
      if (a.integrity) assert.equal(a.integrity, "sha256-" + createHash("sha256").update(await readFile(path)).digest("base64"));
    }
  }
  const originalCSS = await readFile(join(output, sharedCSS), "utf8");
  const missingFont = originalCSS.match(/url\(["']?([^\s)"']+-500\.woff2)/)?.[1];
  assert.ok(missingFont, "fixture uses the medium font weight");
  await rm(join(output, missingFont));
  assert.throws(() => execFileSync("python3", [join(root, "scripts/package-council-landing.py"), "--public-dir", output, "--output", join(work, "broken.tar.gz")], { stdio: "pipe" }), /Missing or unsafe asset/);
});

test("Council CSS owns arrangement only, leaving shared typography and colors to Beauty and the theme", async () => {
  const css = (await readFile(join(root, "assets/council/council.css"), "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /(?:^|[;{])\s*(?:font(?:-[\w-]+)?|line-height|letter-spacing|color|background(?:-[\w-]+)?|text-decoration(?:-[\w-]+)?)\s*:/);
  assert.doesNotMatch(css, /@import|https:\/\/|:root|--beauty-[\w-]+\s*:/);
});
