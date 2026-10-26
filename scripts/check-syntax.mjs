#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let count = 0;
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) {
      execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
      count++;
    }
  }
}
for (const directory of ["scripts", "events/scripts", "events/assets/js", "themes/hugo-mini/scripts", "themes/hugo-mini/assets/js"]) {
  await check(join(root, directory));
}
console.log(`JavaScript syntax check passed (${count} files).`);
