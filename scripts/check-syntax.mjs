#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let count = 0;
function checkFile(file) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
  count++;
}
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) checkFile(file);
  }
}
for (const project of [root, join(root, "themes/hugo-mini")]) {
  checkFile(join(project, "playwright.config.mjs"));
  await check(join(project, "scripts"));
  await check(join(project, "tests"));
}
await check(join(root, "assets"));
await check(join(root, "themes/hugo-mini/assets/js"));
console.log(`JavaScript syntax check passed (${count} files).`);
