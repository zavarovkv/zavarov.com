#!/usr/bin/env node
/**
 * Pre-build translation script.
 * Scans content/ru/ recursively and creates missing or outdated
 * English translations in content/en/ via OpenAI API.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/translate.mjs
 *   node scripts/translate.mjs --force                    # re-translate all
 *   node scripts/translate.mjs blog/brandage.md           # translate specific file(s)
 *   node scripts/translate.mjs consultation.md             # pages too
 */

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import OpenAI from "openai";

/** Normalized SHA-256: collapse whitespace, trim, then hash. */
function sourceHash(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 12);
}

/** Read source_hash from EN file's TOML front matter. */
function readStoredHash(content) {
  const m = content.match(/^source_hash\s*=\s*"([a-f0-9]+)"/m);
  return m ? m[1] : null;
}

/**
 * Add or replace source_hash in translated file's front matter.
 * Operates only on the opening TOML block (everything up to the
 * first closing `+++`), so `+++` sequences inside the body cannot
 * be mistaken for delimiters.
 */
function addSourceHash(translated, hash) {
  const match = translated.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+\r?\n/);
  if (!match) {
    throw new Error(
      "Translation is missing TOML front matter (expected +++ delimiters at start)"
    );
  }
  const [fullBlock, fmBody] = match;
  const rest = translated.slice(fullBlock.length);
  const cleaned = fmBody.replace(/^source_hash\s*=\s*"[a-f0-9]+"\n?/m, "");
  return `+++\nsource_hash = "${hash}"\n${cleaned}\n+++\n${rest}`;
}

/**
 * Front-matter keys the model is told to copy verbatim. Translating any of
 * these silently changes the published page — `slug` rewrites its URL, `date`
 * moves it in every listing — so they are verified after the fact rather than
 * trusted. Prompt compliance is not a guarantee.
 */
const PRESERVED_KEYS = ["slug", "date", "categories", "telegram_post", "draft", "hidden", "pinned"];

/** Values of PRESERVED_KEYS as raw strings, read from a TOML front matter block. */
function readPreserved(content) {
  const fm = content.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+/);
  const body = fm ? fm[1] : "";
  const out = {};
  for (const key of PRESERVED_KEYS) {
    const m = body.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, "m"));
    if (m) out[key] = m[1].trim();
  }
  return out;
}

/** Throws if the translation altered a field that had to be copied verbatim. */
function assertPreserved(source, translated, file) {
  const before = readPreserved(source);
  const after = readPreserved(translated);
  const changed = [];
  for (const key of PRESERVED_KEYS) {
    if ((before[key] ?? null) !== (after[key] ?? null)) {
      changed.push(`${key}: ${before[key] ?? "(absent)"} -> ${after[key] ?? "(absent)"}`);
    }
  }
  if (changed.length) {
    throw Object.assign(
      new Error(`translation changed preserved front matter in ${file}:\n    ${changed.join("\n    ")}`),
      { permanent: true }
    );
  }
}

const RU_DIR = "content/ru";
const EN_DIR = "content/en";
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MAX_RETRIES = 3;

const SYSTEM_PROMPT = `You are a professional translator from Russian to English.
You translate blog posts about Product Management, strategy, and leadership.

Rules:
- Translate naturally, not word-for-word. Preserve the author's voice and tone.
- Keep all Markdown formatting, links, shortcodes ({{< ... >}}), and HTML intact.
- The front matter is in TOML (+++ delimiters). Translate "title" and "description" fields. Keep all other fields exactly as-is (slug, date, categories, telegram_post, math, mermaid, hidden, draft).
- Do NOT translate category names in the "categories" field — keep them in Russian as-is.
- Preserve paragraph structure and line breaks exactly.
- If the text references Russian-specific concepts, provide brief context where helpful.
- Output ONLY the translated document — no commentary, no wrapping.`;

/** Recursively list all .md files under dir, returning paths relative to dir. */
async function listMd(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  let results = [];
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      results = results.concat(await listMd(join(dir, e.name), rel));
    } else if (e.name.endsWith(".md") && e.name !== "_index.md") {
      results.push(rel);
    }
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes("--force");
  const specificFiles = args.filter((a) => !a.startsWith("--"));

  const files = specificFiles.length
    ? specificFiles.map((f) => (f.endsWith(".md") ? f : f + ".md"))
    : await listMd(RU_DIR);

  // Determine which files need translation
  const toTranslate = [];
  for (const file of files) {
    const ruPath = join(RU_DIR, file);
    const enPath = join(EN_DIR, file);

    try {
      await stat(ruPath);
    } catch {
      console.log(`  skip ${file} (not found in ${RU_DIR})`);
      continue;
    }

    if (!forceAll) {
      let enContent;
      try {
        enContent = await readFile(enPath, "utf-8");
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
        // EN file doesn't exist — falls through to translate
      }
      if (enContent !== undefined) {
        const ruContent = await readFile(ruPath, "utf-8");
        if (sourceHash(ruContent) === readStoredHash(enContent)) {
          console.log(`  skip ${file} (unchanged)`);
          continue;
        }
      }
    }

    toTranslate.push(file);
  }

  if (toTranslate.length === 0) {
    console.log("Nothing to translate.");
    return;
  }

  console.log(`\nTranslating ${toTranslate.length} file(s)...\n`);

  const client = new OpenAI();
  let failed = 0;

  for (const file of toTranslate) {
    const ruPath = join(RU_DIR, file);
    const enPath = join(EN_DIR, file);
    const ruContent = await readFile(ruPath, "utf-8");

    // Ensure target directory exists
    await mkdir(dirname(enPath), { recursive: true });

    process.stdout.write(`  ${file} ... `);

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await client.responses.create({
          model: MODEL,
          instructions: SYSTEM_PROMPT,
          input: `Translate this blog post from Russian to English:\n\n${ruContent}`,
          max_output_tokens: 8192,
          reasoning: { effort: "none" },
          store: false,
        });

        // Guard against truncation: saving a partial translation with a
        // valid source_hash would mark it "up to date" forever.
        if (response.status !== "completed") {
          // Deterministic failure — retrying with the same max_tokens can
          // only truncate again, so skip the retry loop.
          const reason = response.incomplete_details?.reason || response.error?.message || response.status;
          throw Object.assign(
            new Error(
              `API returned status="${response.status}" (${reason}) — response may be truncated`
            ),
            { permanent: true }
          );
        }

        if (!response.output_text) {
          throw new Error("Expected text output, got an empty response");
        }

        const translated = addSourceHash(response.output_text, sourceHash(ruContent));
        assertPreserved(ruContent, translated, file);
        await writeFile(enPath, translated, "utf-8");

        const inputTokens = response.usage?.input_tokens ?? 0;
        const outputTokens = response.usage?.output_tokens ?? 0;
        console.log(`done (${inputTokens}+${outputTokens} tokens)`);
        success = true;
        break;
      } catch (err) {
        if (err.permanent) {
          console.log(`FAILED (permanent, no retry): ${err.message}`);
          break;
        }
        if (attempt < MAX_RETRIES) {
          const delay = attempt * 2000;
          process.stdout.write(`retry ${attempt}/${MAX_RETRIES} in ${delay}ms ... `);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          console.log(`FAILED after ${MAX_RETRIES} attempts: ${err.message}`);
        }
      }
    }
    if (!success) failed++;
  }

  console.log(`\nDone. ${toTranslate.length - failed} translated, ${failed} failed.`);
  if (failed > toTranslate.length / 2) {
    console.error("ERROR: More than half of translations failed. Exiting with error.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
