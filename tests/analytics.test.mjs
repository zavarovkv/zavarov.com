import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { parse } from "parse5";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let work;
let output;

before(async () => {
  work = await mkdtemp(join(tmpdir(), "site-analytics-"));
  output = join(work, "public");
  execFileSync(process.env.HUGO_BIN || "hugo", [
    "--minify", "--panicOnWarning", "--noBuildLock",
    "--destination", output, "--cacheDir", join(work, "cache"),
  ], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env, HUGO_RESOURCEDIR: join(work, "resources") },
  });
});

after(async () => {
  if (work) await rm(work, { recursive: true, force: true });
});

function all(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes || []).flatMap(child => all(child, predicate)),
  ];
}

async function assertAnalytics(path) {
  const page = parse(await readFile(join(output, path), "utf8"));
  const scripts = all(page, node => node.tagName === "script")
    .map(node => (node.childNodes || []).map(child => child.value || "").join(""))
    .filter(source => /gtag\(|window\.ym/.test(source));
  const load = [];
  const loadedScripts = [];
  const context = {
    document: {
      createElement: () => ({}),
      head: { appendChild: script => loadedScripts.push(script) },
    },
    addEventListener: (event, callback) => {
      if (event === "load") load.push(callback);
    },
  };
  context.window = context;
  for (const source of scripts) runInNewContext(source, context);

  const commands = (context.dataLayer || []).map(args => Array.from(args));
  assert.equal(commands.filter(args => args[0] === "config" && args[1] === "G-P2MMRVCNQP").length,
    1, `${path}: initialize the owner's GA4 stream exactly once`);
  const yandex = (context.ym?.a || []).map(args => Array.from(args));
  assert.equal(yandex.filter(args => args[0] === 106247763 && args[1] === "init").length,
    1, `${path}: preserve the existing Yandex counter exactly once`);
  assert.equal(loadedScripts.length, 0, "analytics scripts stay deferred until load");
  for (const callback of load) callback();
  assert.equal(loadedScripts.filter(script => script.src ===
    "https://www.googletagmanager.com/gtag/js?id=G-P2MMRVCNQP").length, 1);
  assert.equal(loadedScripts.filter(script => script.src ===
    "https://mc.yandex.ru/metrika/tag.js?id=106247763").length, 1);
  assert.ok(loadedScripts.every(script => script.async === true));
}

test("blog pages initialize GA4 alongside the existing Yandex counter", async () => {
  for (const page of ["index.html", "en/index.html", "blog/index.html", "en/blog/index.html",
    "consultation/index.html", "en/consultation/index.html"]) {
    await assertAnalytics(page);
  }
});
