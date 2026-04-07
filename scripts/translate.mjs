#!/usr/bin/env node
/**
 * Pre-build translation script.
 * Scans content/ru/ recursively and creates missing or outdated
 * English translations in content/en/ via Claude API.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate.mjs
 *   node scripts/translate.mjs --force                    # re-translate all
 *   node scripts/translate.mjs blog/brandage.md           # translate specific file(s)
 *   node scripts/translate.mjs consultation.md             # pages too
 */

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

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

/** Add or replace source_hash in translated file's front matter. */
function addSourceHash(translated, hash) {
  const stripped = translated.replace(/^source_hash\s*=\s*"[a-f0-9]+"\n/m, "");
  return stripped.replace(/^\+\+\+\n/, `+++\nsource_hash = "${hash}"\n`);
}

const RU_DIR = "content/ru";
const EN_DIR = "content/en";
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
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
      try {
        const ruContent = await readFile(ruPath, "utf-8");
        const enContent = await readFile(enPath, "utf-8");
        if (sourceHash(ruContent) === readStoredHash(enContent)) {
          console.log(`  skip ${file} (unchanged)`);
          continue;
        }
      } catch {
        // EN file doesn't exist — needs translation
      }
    }

    toTranslate.push(file);
  }

  if (toTranslate.length === 0) {
    console.log("Nothing to translate.");
    return;
  }

  console.log(`\nTranslating ${toTranslate.length} file(s)...\n`);

  const client = new Anthropic();
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
        const message = await client.messages.create({
          model: MODEL,
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Translate this blog post from Russian to English:\n\n${ruContent}`,
            },
          ],
        });

        const translated = addSourceHash(message.content[0].text, sourceHash(ruContent));
        await writeFile(enPath, translated, "utf-8");

        const inputTokens = message.usage.input_tokens;
        const outputTokens = message.usage.output_tokens;
        console.log(`done (${inputTokens}+${outputTokens} tokens)`);
        success = true;
        break;
      } catch (err) {
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

main();
