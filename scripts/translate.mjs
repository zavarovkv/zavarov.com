#!/usr/bin/env node
// RU -> EN translation. --allow-stale keeps existing EN on provider failures.
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { listMarkdown, readDocument } from "./lib/content.mjs";
import { assertPreserved, isCurrent, prepareTranslation } from "./lib/translation.mjs";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MAX_RETRIES = 3;
const SYSTEM_PROMPT = `You are a professional translator from Russian to English.
You translate blog posts about Product Management, strategy, and leadership.

Rules:
- Translate naturally, not word-for-word. Preserve the author's voice and tone.
- Keep all Markdown formatting, links, shortcodes ({{< ... >}}), and HTML intact.
- The front matter is TOML (+++ delimiters). Translate only "title" and "description". Keep every other field and its type exactly as-is, including slug, date, categories, telegram_post, math, mermaid, hidden, draft, and pinned.
- Do NOT translate category names.
- Preserve paragraph structure and line breaks exactly.
- If the text references Russian-specific concepts, provide brief context where helpful.
- Output ONLY the translated document — no commentary, no wrapping.`;

async function readOptional(file) {
  try { return await readFile(file, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function contentFile(arg) {
  const file = arg.endsWith(".md") ? arg : `${arg}.md`;
  if (file.startsWith("/") || file.includes("\\") || file.split("/").some((part) => !part || part === ".." || part === ".") || file.split("/").at(-1) === "_index.md") {
    throw new Error(`Invalid translation path: ${arg}`);
  }
  return file;
}

export async function planTranslations({ root, args = [], baseline = {} }) {
  for (const arg of args) {
    if (arg.startsWith("--") && !["--force", "--dry-run", "--allow-stale"].includes(arg)) throw new Error(`Unknown option: ${arg}`);
  }
  const ruDir = resolve(root, "content/ru");
  const enDir = resolve(root, "content/en");
  const sources = (await listMarkdown(ruDir)).filter((file) => file.split("/").at(-1) !== "_index.md");
  const selected = [...new Set(args.filter((arg) => !arg.startsWith("--")).map(contentFile))];
  const files = selected.length ? selected.filter((file) => sources.includes(file)) : sources;
  const toTranslate = [];
  for (const file of files) {
    const source = await readFile(resolve(ruDir, file), "utf8");
    readDocument(source, file);
    const translated = await readOptional(resolve(enDir, file));
    if (translated !== null && !args.includes("--force")) {
      try {
        if (isCurrent(source, translated, baseline[file])) {
          assertPreserved(source, translated, file);
          continue;
        }
      } catch {
        // Invalid existing translations must be repairable, even if their old
        // source_hash claims they are current.
      }
    }
    toTranslate.push({ file, source });
  }

  const orphans = [];
  let englishFiles = [];
  try { englishFiles = await listMarkdown(enDir); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  for (const file of englishFiles) {
    if (file.split("/").at(-1) === "_index.md" || sources.includes(file) || (selected.length && !selected.includes(file))) continue;
    const translated = await readFile(resolve(enDir, file), "utf8");
    let hash;
    try { hash = readDocument(translated, file).data.source_hash; }
    catch { continue; }
    // Only generated files belong to this script; hand-maintained pages survive.
    if (typeof hash === "string" && /^(?:[a-f0-9]{12}|[a-f0-9]{64})$/.test(hash)) orphans.push(file);
  }
  for (const file of selected) {
    if (!sources.includes(file) && !orphans.includes(file)) throw new Error(`Source not found: ${file}`);
  }
  return { toTranslate, orphans };
}

async function writeAtomic(file, text) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, text, { encoding: "utf8", flag: "wx" });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

function deferTranslations(plan) {
  const message = `Translation update deferred: ${plan.toTranslate.length} pending file(s). All existing EN files and source hashes are unchanged; the next run will retry. Building with available translations.`;
  console.warn(process.env.GITHUB_ACTIONS === "true" ? `::warning title=English translations deferred::${message}` : `Warning: ${message}`);
  return { ...plan, deferred: true };
}

export async function translate({ root = process.cwd(), args = process.argv.slice(2), createClient = () => new OpenAI(), baseline } = {}) {
  baseline ??= JSON.parse(await readFile(new URL("./translation-baseline.json", import.meta.url), "utf8")).files;
  const plan = await planTranslations({ root, args, baseline });
  console.log(`${plan.toTranslate.length} translation(s), ${plan.orphans.length} removed source(s).`);
  if (args.includes("--dry-run")) {
    for (const { file } of plan.toTranslate) console.log(`  translate ${file}`);
    for (const file of plan.orphans) console.log(`  remove generated EN ${file}`);
    return plan;
  }
  let client;
  try { client = plan.toTranslate.length ? createClient() : null; }
  catch (error) {
    if (!args.includes("--allow-stale")) throw error;
    console.error(`Translation provider unavailable: ${error.message}`);
    return deferTranslations(plan);
  }
  const pending = [];
  const failed = [];
  for (const { file, source } of plan.toTranslate) {
    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await client.responses.create({
          model: MODEL,
          instructions: SYSTEM_PROMPT,
          input: `Translate this blog post from Russian to English:\n\n${source}`,
          max_output_tokens: 8192,
          reasoning: { effort: "none" },
          store: false,
        });
        if (response.status !== "completed" || !response.output_text) {
          throw Object.assign(new Error(`Incomplete translation: ${response.incomplete_details?.reason || response.status}`), { permanent: true });
        }
        let translated;
        try { translated = prepareTranslation(source, response.output_text, file); }
        catch (error) { throw Object.assign(error, { permanent: true }); }
        pending.push({ file, translated });
        console.log(`  ${file}: validated (${response.usage?.input_tokens ?? 0}+${response.usage?.output_tokens ?? 0} tokens)`);
        success = true;
        break;
      } catch (error) {
        const rejected = error.status >= 400 && error.status < 500 && ![408, 409, 429].includes(error.status);
        if (error.permanent || rejected || attempt === MAX_RETRIES) {
          console.error(`  ${file}: ${error.message}`);
          break;
        }
        await new Promise((done) => setTimeout(done, attempt * 2000));
      }
    }
    if (!success) failed.push(file);
  }
  // Never publish half of a content update, or prune files after API failure.
  if (failed.length) {
    if (args.includes("--allow-stale")) return deferTranslations(plan);
    throw new Error(`${failed.length} translation(s) failed; no EN files changed`);
  }
  for (const { file, translated } of pending) await writeAtomic(resolve(root, "content/en", file), translated);
  for (const file of plan.orphans) {
    await rm(resolve(root, "content/en", file));
    console.log(`  removed generated EN ${file}`);
  }
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  translate().catch((error) => { console.error(`Fatal: ${error.message}`); process.exitCode = 1; });
}
