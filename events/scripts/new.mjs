#!/usr/bin/env node
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "smol-toml";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function exists(path) {
  try { await access(path); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function* markdownFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return; throw error; }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* markdownFiles(path);
    else if (entry.isFile() && entry.name.endsWith(".md")) yield path;
  }
}

async function assertUnusedMetadataPath(root, slug) {
  for (const source of ["content/ru", "events/content/ru"]) {
    for await (const file of markdownFiles(join(root, source))) {
      const text = await readFile(file, "utf8");
      const match = text.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+/);
      if (!match) continue;
      const data = parse(match[1]);
      // Blog permalinks flatten posts to /:slug/; aliases and explicit URLs
      // can reserve an address even when its source filename is different.
      const reserved = [data.slug, data.url, ...(data.aliases || [])];
      if (reserved.some(value => typeof value === "string" && value.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0].replace(/^\/+|\/+$/g, "").toLowerCase() === slug)) {
        throw new Error(`Адрес /${slug}/ уже занят в метаданных: ${file}`);
      }
    }
  }
}

export async function createEvent({ slug, root = repository, now = new Date() } = {}) {
  if (typeof slug !== "string" || slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Укажите адрес латиницей, например: npm run event:new -- product-interviews");
  }
  let config = {};
  try { config = parse(await readFile(join(root, "config.toml"), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  // Hugo uses every language prefix, including the default-language redirect.
  if (Object.hasOwn(config.languages || {}, slug)) {
    throw new Error(`Адрес /${slug}/ занят языковым разделом сайта.`);
  }
  for (const source of ["content/ru", "events/content/ru"]) {
    for (const suffix of [slug, `${slug}.md`, `${slug}.html`]) {
      if (await exists(join(root, source, suffix))) throw new Error(`Адрес /${slug}/ уже занят: ${source}/${suffix}`);
    }
  }

  await assertUnusedMetadataPath(root, slug);

  // A draft starts a week from today; its date must be reviewed before release.
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now.getTime() + 7 * 86400000));
  const template = await readFile(join(root, "events/templates/webinar/_index.md"), "utf8");
  const content = template.replaceAll("__EVENT_DAY__", day);
  const directory = join(root, "events/content/ru", slug);
  await mkdir(dirname(directory), { recursive: true });
  await mkdir(directory); // Never merge into or overwrite an existing event.
  await writeFile(join(directory, "_index.md"), content, { flag: "wx" });
  return directory;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) {
    console.error("Использование: npm run event:new -- product-interviews");
    process.exitCode = 1;
  } else {
    createEvent({ slug: process.argv[2] }).then(directory => {
      console.log(`Создан черновик: ${join(directory, "_index.md")}`);
      console.log("Замените дату, тексты и настройки регистрации. Для предпросмотра: hugo server --buildDrafts");
    }).catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
