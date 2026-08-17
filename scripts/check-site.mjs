#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function report(message) {
  errors.push(message);
}

const ruFiles = (await walk(join(root, "content/ru"))).filter((file) => file.endsWith(".md"));
for (const file of ruFiles) {
  const content = await readFile(file, "utf8");
  if (/[ёЁ]/.test(content)) report(`${relative(root, file)} contains a forbidden Russian letter`);

  if (file.includes("/blog/") && !file.endsWith("/_index.md")) {
    const frontMatter = content.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+/)?.[1] ?? "";
    for (const key of ["title", "slug", "date", "description", "categories"]) {
      if (!new RegExp(`^${key}\\s*=`, "m").test(frontMatter)) {
        report(`${relative(root, file)} is missing front matter field: ${key}`);
      }
    }
  }
}

const contentFiles = (await walk(join(root, "content"))).filter((file) => file.endsWith(".md"));
for (const file of contentFiles) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(/\/(images|data)\/[^\s)'"<>]+/g)) {
    const target = join(root, "static", match[0]);
    if (!existsSync(target)) report(`${relative(root, file)} references missing asset: ${match[0]}`);
  }
}

const publicDir = join(root, "public");
if (!existsSync(publicDir)) {
  report("public/ does not exist; run Hugo before this check");
} else {
  const htmlFiles = (await walk(publicDir)).filter((file) => file.endsWith(".html"));
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const match of html.matchAll(/(?:href|src)="?([^" >]+)/g)) {
      let url = match[1];
      if (!url.startsWith("/") || url.startsWith("//")) continue;
      url = decodeURI(url.split(/[?#]/)[0]);
      if (url === "/livereload.js") continue;
      const target = join(publicDir, url);
      if (!existsSync(target) && !existsSync(join(target, "index.html"))) {
        report(`${relative(publicDir, file)} references missing output: ${url}`);
      }
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  console.error(`\nSite check failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log("Site check passed.");
