import test from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readDocument } from "../../scripts/lib/content.mjs";
import { createEvent } from "../scripts/new.mjs";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "new-event-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "events/templates/webinar"), { recursive: true });
  await copyFile(join(repository, "events/templates/webinar/_index.md"), join(root, "events/templates/webinar/_index.md"));
  return root;
}

test("new events start as editable drafts without a live registration endpoint", async t => {
  const root = await fixture(t);
  const directory = await createEvent({ root, slug: "product-interviews", now: new Date("2026-10-20T20:00:00Z") });
  const { data } = readDocument(await readFile(join(directory, "_index.md"), "utf8"));
  assert.equal(directory, join(root, "events/content/ru/product-interviews"));
  assert.equal(data.draft, true);
  assert.equal(data.type, "event");
  assert.equal(data.layout, "landing");
  assert.equal(data.registration_action, "");
  assert.equal(data.registration_telegram_field, "");
  assert.equal(data.event_start, "2026-10-27T19:00:00+03:00");
  assert.equal((new Date(data.event_end) - new Date(data.event_start)) / 60000, 90);
});

test("new events cannot overwrite an event or a blog page at the same address", async t => {
  const root = await fixture(t);
  for (const existing of ["events/content/ru/existing/_index.md", "content/ru/blog-page.md", "content/ru/section/index.md"]) {
    const file = join(root, existing);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, "keep this content");
    const slug = existing.includes("existing") ? "existing" : existing.includes("blog-page") ? "blog-page" : "section";
    await assert.rejects(createEvent({ root, slug }), /already exists/);
    assert.equal(await readFile(file, "utf8"), "keep this content");
  }
  await createEvent({ root, slug: "new-event" });
  await assert.rejects(createEvent({ root, slug: "new-event" }), /already exists/);
});

test("event addresses reject paths and invalid slugs before writing files", async t => {
  const root = await fixture(t);
  for (const slug of [undefined, "", "../escape", "a/b", "/absolute", "UPPER", "two--hyphens", "-prefix", "suffix-", "a".repeat(65)]) {
    await assert.rejects(createEvent({ root, slug }), /lowercase URL slug/);
  }
});


test("blog slugs and redirects reserve addresses even with different source names", async t => {
  const root = await fixture(t);
  const file = join(root, "content/ru/blog/another-name.md");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, '+++\nslug = "product-research"\naliases = ["/old-event/"]\nurl = "/custom-address/"\n+++\n');
  for (const slug of ["product-research", "old-event", "custom-address"]) {
    await assert.rejects(createEvent({ root, slug }), /reserved in/);
  }
});


test("language homepages and the default-language redirect reserve their prefixes", async t => {
  const root = await fixture(t);
  await writeFile(join(root, "config.toml"), 'defaultContentLanguage = "ru"\n[languages.ru]\nweight = 1\n[languages.en]\nweight = 2\n');
  for (const slug of ["ru", "en"]) {
    await assert.rejects(createEvent({ root, slug }), /reserved for a site language/);
  }
});
