import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { readDocument } from "../scripts/lib/content.mjs";
import { sourceHash, isCurrent, prepareTranslation } from "../scripts/lib/translation.mjs";
import { translate, planTranslations } from "../scripts/translate.mjs";

const source = '+++\ntitle = "Source"\nslug = "example"\ndate = 2026-01-01\ncategories = [\n "product",\n "team"\n]\nmath = true\nmermaid = true\n[custom]\nvalue = 7\n+++\nFirst paragraph.\n\nSecond paragraph.\n';
const translated = source.replace('title = "Source"', 'title = "Translation"');

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "translation-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const lang of ["ru", "en"]) await mkdir(join(root, "content", lang, "blog"), { recursive: true });
  return root;
}

test("hash preserves paragraphs and code indentation, normalizing only CRLF", () => {
  assert.notEqual(sourceHash("a\n\nb"), sourceHash("a\nb"));
  assert.notEqual(sourceHash("if ok:\n    a()\n    b()"), sourceHash("if ok:\n    a()\nb()"));
  assert.equal(sourceHash(source), sourceHash(source.replaceAll("\n", "\r\n")));
  const baseline = { legacy_hash: createHash("sha256").update(source.replace(/\s+/g, " ").trim()).digest("hex").slice(0, 12), source_hash: sourceHash(source) };
  const old = translated.replace("+++\n", `+++\nsource_hash = "${baseline.legacy_hash}"\n`);
  assert.equal(isCurrent(source, old, baseline), true);
  assert.equal(isCurrent(source.replace("\n\nSecond", "\nSecond"), old, baseline), false);
});

test("translation validates TOML and all non-translatable values", () => {
  const output = prepareTranslation(source, translated, "example.md");
  assert.equal(readDocument(output).data.source_hash, sourceHash(source));
  assert.equal(readDocument(output).data.date.toISOString(), "2026-01-01");
  for (const altered of [
    translated.replace('title = "Translation"', 'title = "An "invalid" title"'),
    translated.replace('"product"', '"different"'),
    translated.replace("math = true\n", ""),
    translated.replace("mermaid = true\n", ""),
    translated.replace("value = 7", "value = 8"),
  ]) assert.throws(() => prepareTranslation(source, altered, "example.md"));
});

test("one rejected response leaves every EN file and orphan untouched", async (t) => {
  const root = await fixture(t);
  for (const file of ["a.md", "b.md"]) {
    await writeFile(join(root, "content/ru/blog", file), source);
    await writeFile(join(root, "content/en/blog", file), "old content");
  }
  const orphan = join(root, "content/en/blog/orphan.md");
  await writeFile(orphan, prepareTranslation(source, translated, "orphan.md"));
  let calls = 0;
  const createClient = () => ({ responses: { create: async () => ({ status: "completed", output_text: ++calls === 1 ? translated : translated.replace("math = true\n", "") }) } });
  await assert.rejects(translate({ root, args: [], baseline: {}, createClient }), /no EN files changed/);
  for (const file of ["a.md", "b.md"]) assert.equal(await readFile(join(root, "content/en/blog", file), "utf8"), "old content");
  await access(orphan);
});

test("invalid file with a matching hash is repaired instead of skipped", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, "content/ru/blog/a.md"), source);
  await writeFile(join(root, "content/en/blog/a.md"), `+++\nsource_hash = "${sourceHash(source)}"\ntitle = "invalid "quote""\n+++\nBody`);
  assert.equal((await planTranslations({ root })).toTranslate.length, 1);
  const empty = prepareTranslation(source, translated, "a.md").replace(readDocument(translated).body, "");
  await writeFile(join(root, "content/en/blog/a.md"), empty);
  assert.equal((await planTranslations({ root })).toTranslate.length, 1);
  const createClient = () => ({ responses: { create: async () => ({ status: "completed", output_text: translated }) } });
  await translate({ root, args: [], baseline: {}, createClient });
  const result = await readFile(join(root, "content/en/blog/a.md"), "utf8");
  assert.equal(result, prepareTranslation(source, translated, "a.md"));
  assert.equal((await planTranslations({ root })).toTranslate.length, 0);
});

test("pruning is limited to generated orphans and dry-run is read-only", async (t) => {
  const root = await fixture(t);
  const generated = join(root, "content/en/blog/orphan.md");
  const manual = join(root, "content/en/manual.md");
  const index = join(root, "content/en/_index.md");
  await writeFile(generated, prepareTranslation(source, translated, "orphan.md"));
  await writeFile(manual, translated);
  await writeFile(index, translated);
  const createClient = () => { throw new Error("API must not be called"); };
  await translate({ root, args: ["--dry-run"], baseline: {}, createClient });
  await access(generated);
  await translate({ root, args: [], baseline: {}, createClient });
  await assert.rejects(access(generated), { code: "ENOENT" });
  await access(manual);
  await access(index);
});

for (const failure of ["missing credentials", "API rejected", "invalid response"]) {
  test(`allow-stale preserves the complete EN batch on ${failure}`, async (t) => {
    const root = await fixture(t);
    const old = prepareTranslation(source.replace("First paragraph.", "Old paragraph."), translated.replace("First paragraph.", "Old paragraph."), "old.md");
    for (const file of ["a.md", "b.md"]) {
      await writeFile(join(root, "content/ru/blog", file), source);
      await writeFile(join(root, "content/en/blog", file), old);
    }
    await writeFile(join(root, "content/ru/blog/new.md"), source);
    const orphan = join(root, "content/en/blog/orphan.md");
    await writeFile(orphan, old);
    let calls = 0;
    const createClient = () => {
      if (failure === "missing credentials") throw new Error("Missing credentials");
      return { responses: { create: async () => {
        calls++;
        if (calls === 2 && failure === "API rejected") throw Object.assign(new Error("Invalid API key"), { status: 401 });
        return { status: "completed", output_text: calls === 2 ? translated.replace("math = true\n", "") : translated };
      } } };
    };
    const plan = await translate({ root, args: ["--allow-stale"], baseline: {}, createClient });
    assert.equal(plan.deferred, true);
    for (const file of ["a.md", "b.md", "orphan.md"]) assert.equal(await readFile(join(root, "content/en/blog", file), "utf8"), old);
    await assert.rejects(access(join(root, "content/en/blog/new.md")), { code: "ENOENT" });
    assert.equal((await planTranslations({ root })).toTranslate.length, 3, "pending files must be retried later");
    assert.equal(calls, failure === "missing credentials" ? 0 : 3);
  });
}

test("allow-stale does not suppress invalid source content", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, "content/ru/blog/a.md"), '+++\ntitle = "invalid "quote""\n+++\nBody');
  const createClient = () => { throw new Error("API must not be called"); };
  await assert.rejects(translate({ root, args: ["--allow-stale"], baseline: {}, createClient }), /invalid TOML/);
});
