#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseHTML } from "parse5";
import { parse as parseTOML } from "smol-toml";
import { listMarkdown, readDocument } from "./lib/content.mjs";

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export function inspectHTML(html) {
  const ids = new Set();
  const links = [];
  let base;
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
    if (attrs.id) ids.add(attrs.id);
    if (node.tagName === "a" && attrs.name) ids.add(attrs.name);
    if (node.tagName === "base" && attrs.href && base === undefined) base = attrs.href;
    if (node.tagName !== "base") {
      for (const key of ["href", "src"]) if (attrs[key]) links.push(attrs[key]);
    }
    for (const child of node.childNodes || []) visit(child);
    // Inert template contents do not create page anchors or load resources.
  }
  visit(parseHTML(html));
  return { ids, links, base };
}

export async function checkSite({ root = resolve(dirname(fileURLToPath(import.meta.url)), ".."), publicDir = resolve(root, "public"), baseURL } = {}) {
  const errors = [];
  const report = (message) => errors.push(message);
  baseURL ??= parseTOML(await readFile(join(root, "config.toml"), "utf8")).baseURL;
  const siteURL = new URL(baseURL);
  const basePath = siteURL.pathname.replace(/\/?$/, "/");
  const ruDir = join(root, "content/ru");
  for (const file of await listMarkdown(join(root, "content"))) {
    const fullPath = join(root, "content", file);
    const content = await readFile(fullPath, "utf8");
    if (fullPath.startsWith(ruDir + sep) && /[\u0451\u0401]/u.test(content)) report(`${file}: contains a forbidden Russian letter`);
    try {
      const { data } = readDocument(content, file);
      if (file.includes("/blog/") && !file.endsWith("/_index.md")) {
        for (const key of ["title", "slug", "date", "description", "categories"]) {
          if (!Object.hasOwn(data, key)) report(`${file}: missing front matter field ${key}`);
        }
        if (data.categories !== undefined && (!Array.isArray(data.categories) || data.categories.some((item) => typeof item !== "string"))) report(`${file}: categories must be an array of strings`);
      }
      if (data.telegram_post !== undefined && (!Number.isSafeInteger(data.telegram_post) || data.telegram_post <= 0)) report(`${file}: telegram_post must be a positive integer, not a URL`);
    } catch (error) { report(error.message); }
  }

  let files;
  try { files = await walk(publicDir); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    report("public/ does not exist; run Hugo before this check");
    return errors;
  }
  const documents = new Map();
  for (const file of files.filter((file) => file.endsWith(".html"))) {
    documents.set(file, inspectHTML(await readFile(file, "utf8")));
  }
  for (const [file, document] of documents) {
    const name = relative(publicDir, file).split(sep).join("/");
    const pageURL = new URL(name.replace(/index\.html$/, ""), siteURL);
    const documentURL = document.base ? new URL(document.base, pageURL) : pageURL;
    for (const link of document.links) {
      let url;
      try { url = new URL(link, documentURL); }
      catch { report(`${name}: malformed URL ${link}`); continue; }
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== siteURL.origin) continue;
      let pathname;
      let fragment;
      try {
        pathname = decodeURIComponent(url.pathname);
        fragment = decodeURIComponent(url.hash.slice(1).split(":~:")[0]);
      } catch { report(`${name}: malformed URL encoding ${link}`); continue; }
      if (pathname.endsWith("/livereload.js")) continue;
      if (!pathname.startsWith(basePath)) {
        report(`${name}: local URL is outside the site base path: ${link}`);
        continue;
      }
      let target = resolve(publicDir, pathname.slice(basePath.length));
      if (relative(publicDir, target).startsWith(".." + sep)) {
        report(`${name}: invalid local path ${link}`);
        continue;
      }
      try {
        if ((await stat(target)).isDirectory()) target = join(target, "index.html");
        if (!(await stat(target)).isFile()) throw Object.assign(new Error(), { code: "ENOENT" });
      } catch (error) {
        if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
        report(`${name}: missing output ${link}`);
        continue;
      }
      if (fragment && /\.(?:html|svg)$/.test(target)) {
        if (!documents.has(target)) documents.set(target, inspectHTML(await readFile(target, "utf8")));
        if (!documents.get(target).ids.has(fragment)) report(`${name}: missing anchor ${link}`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--public-dir")) throw new Error("Usage: check-site.mjs [--public-dir PATH]");
  const errors = await checkSite(args.length ? { publicDir: resolve(args[1]) } : {});
  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    console.error(`Site check failed with ${errors.length} error(s).`);
    process.exitCode = 1;
  } else console.log("Site check passed.");
}
