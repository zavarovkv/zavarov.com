import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { parse as parseTOML, stringify } from "smol-toml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const eventsRoot = join(root, "events");
const contentRoot = join(eventsRoot, "content");

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.isFile() && entry.name === "_index.md") files.push(path);
  }
  return files.sort();
}

async function readBundle(file, base = contentRoot) {
  const text = await readFile(file, "utf8");
  const frontMatter = text.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+(?:\r?\n|$)/);
  assert.ok(frontMatter, `${file}: TOML front matter is required`);
  const data = parseTOML(frontMatter[1]);
  const [language, ...route] = relative(base, dirname(file)).split(sep);
  return { data, file, directory: dirname(file), language, route: route.join("/") };
}

function inspectHTML(html) {
  const nodes = [];
  function text(node) {
    return node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
  }
  function visit(node) {
    if (node.tagName) nodes.push({
      tag: node.tagName,
      attrs: Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])),
      text: text(node),
    });
    for (const child of node.childNodes || []) visit(child);
  }
  visit(parse(html));
  return nodes;
}

function scheduleLabels(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  assert.ok(Number.isFinite(start.valueOf()), "event_start must be an ISO timestamp");
  assert.ok(end > start, "event_end must follow event_start");
  const timeZone = "Europe/Moscow";
  const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone }).format(start);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long", timeZone }).format(start);
  const year = new Intl.DateTimeFormat("ru-RU", { year: "numeric", timeZone }).formatToParts(start).find(({ type }) => type === "year").value;
  const clock = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone });
  return {
    date: `${weekday[0].toUpperCase()}${weekday.slice(1)}, ${shortDate}`,
    dateWithYear: `${shortDate} ${year}`,
    shortDate,
    start: clock.format(start),
    time: `${clock.format(start)}–${clock.format(end)} МСК`,
    durationMinutes: (end - start) / 60000,
  };
}

function pageURL(bundle, config) {
  const defaultLanguage = config.defaultContentLanguage || "en";
  const prefix = bundle.language === defaultLanguage && !config.defaultContentLanguageInSubdirectory ? "" : `${bundle.language}/`;
  const route = bundle.data.url || `${prefix}${bundle.route}/`;
  return new URL(route.replace(/^\/+/, ""), config.baseURL).href;
}

function outputPath(output, url, baseURL) {
  const location = new URL(url, baseURL);
  const base = new URL(baseURL);
  assert.equal(location.origin, base.origin, `expected a local asset: ${location.href}`);
  assert.ok(location.pathname.startsWith(base.pathname), `URL must retain the base path: ${location.href}`);
  const path = decodeURIComponent(location.pathname.slice(base.pathname.length));
  return join(output, path, location.pathname.endsWith("/") ? "index.html" : "");
}

async function existingAsset(output, url, baseURL) {
  const file = outputPath(output, url, baseURL);
  assert.ok((await stat(file)).size > 0, `asset is empty: ${url}`);
  return file;
}

function build(source, output, work, { drafts = false } = {}) {
  execFileSync(process.env.HUGO_BIN || "hugo", [
    "--minify", "--panicOnWarning", "--noBuildLock",
    ...(drafts ? ["--buildDrafts"] : []),
    "--destination", output,
    "--cacheDir", join(work, "cache"),
  ], {
    cwd: source,
    // Event offsets must survive a build on a machine in a different zone.
    env: { ...process.env, TZ: "Pacific/Honolulu", HUGO_RESOURCEDIR: join(work, "resources") },
    stdio: "pipe",
  });
}

async function inspectLanding(bundle, config, output) {
  const { data: source } = bundle;
  assert.equal(source.type, "event", `${bundle.file}: type`);
  assert.equal(source.layout, "landing", `${bundle.file}: layout`);
  assert.equal(source.event_date, undefined, "derive display dates from ISO timestamps");
  assert.equal(source.event_time, undefined, "derive display times from ISO timestamps");
  assert.doesNotMatch(await readFile(bundle.file, "utf8"), /[\u0451\u0401]/u, "event content follows the Russian text convention");
  const schedule = scheduleLabels(source.event_start, source.event_end);
  const url = pageURL(bundle, config);
  const nodes = inspectHTML(await readFile(outputPath(output, url, config.baseURL), "utf8"));
  const body = nodes.find(({ tag }) => tag === "body");
  const ids = nodes.filter(({ attrs }) => attrs.id).map(({ attrs }) => attrs.id);
  assert.equal(new Set(ids).size, ids.length, "all element IDs must be unique");
  function meta(key) {
    const matches = nodes.filter(({ tag, attrs }) => tag === "meta" && (attrs.name === key || attrs.property === key));
    assert.equal(matches.length, 1, `${key} must occur exactly once`);
    return matches[0].attrs.content;
  }
  assert.deepEqual(nodes.filter(({ tag, attrs }) => tag === "link" && attrs.rel === "canonical").map(({ attrs }) => attrs.href), [url]);
  assert.equal(meta("og:url"), url);
  assert.equal(meta("og:type"), "website");
  assert.equal(meta("og:locale"), (config.languages?.[bundle.language]?.languageCode || bundle.language).replace("-", "_"));
  const title = `${source.title} — ${(source.event_label || "Вебинар").toLowerCase()} ${schedule.dateWithYear}`;
  const description = `${schedule.shortDate}, ${schedule.time}. ${source.description}`;
  assert.equal(meta("og:title"), title);
  assert.equal(meta("twitter:title"), title);
  assert.equal(meta("description"), description);
  assert.equal(meta("og:description"), description);
  assert.equal(meta("twitter:description"), description);
  if (source.cover_image) {
    assert.equal(meta("twitter:card"), "summary_large_image");
    assert.equal(meta("twitter:image"), meta("og:image"));
    assert.equal(meta("og:image:width"), "1200");
    assert.equal(meta("og:image:height"), "630");
    assert.equal(meta("og:image:type"), "image/png");
    assert.ok(meta("og:image:alt"));
    assert.equal(meta("twitter:image:alt"), meta("og:image:alt"));
    const png = await readFile(await existingAsset(output, meta("og:image"), config.baseURL));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  } else {
    assert.equal(meta("twitter:card"), "summary");
    const imageMeta = nodes.filter(({ tag, attrs }) => tag === "meta" &&
      ((attrs.property || "").startsWith("og:image") || (attrs.name || "").startsWith("twitter:image")));
    assert.equal(imageMeta.length, 0, "text-only previews must not advertise an image");
    await assert.rejects(stat(outputPath(output, new URL("og.png", url).href, config.baseURL)), { code: "ENOENT" }, "text-only events must not generate a share image");
  }
  if (source.draft || source.noindex) {
    assert.match(meta("robots"), /\bnoindex\b/);
  } else {
    assert.match(meta("robots"), /\bindex\b/);
    assert.doesNotMatch(meta("robots"), /noindex/);
  }

  const blocks = nodes.filter(({ tag, attrs }) => tag === "script" && attrs.type === "application/ld+json").map(({ text }) => JSON.parse(text));
  assert.equal(blocks.length, 1, "the standalone landing emits only its Event schema");
  const [event] = blocks;
  assert.equal(event["@type"], "Event");
  assert.equal(event.name, source.title);
  assert.equal(event.description, description);
  assert.equal(event.url, url);
  assert.equal(event.startDate, source.event_start);
  assert.equal(event.endDate, source.event_end);
  assert.equal(event.eventAttendanceMode, "https://schema.org/OnlineEventAttendanceMode");
  assert.equal(event.location["@type"], "VirtualLocation");
  if (source.cover_image) assert.equal(event.image.url, meta("og:image"));
  else assert.equal(event.image, undefined, "text-only events must not reference an image in structured data");
  assert.ok(event.organizer.name, "organizer comes from page/site data");
  assert.deepEqual(event.performer.map(({ name }) => name), source.speakers.map(({ name }) => name));
  for (const [i, speaker] of source.speakers.entries()) {
    const contacts = [speaker.telegram, ...(speaker.telegram_channels || [])].filter(Boolean).map((username) => `https://t.me/${username}`);
    assert.deepEqual(event.performer[i].sameAs || [], contacts);
    assert.ok(body.text.includes(speaker.name), `visible speaker ${speaker.name}`);
    for (const href of contacts) {
      assert.ok(nodes.some(({ tag, attrs }) => tag === "a" && attrs.href === href), `visible contact ${href}`);
    }
  }
  assert.deepEqual(nodes.filter(({ tag }) => tag === "h1").map(({ text }) => text), [source.title]);
  for (const topic of source.takeaways) {
    assert.ok(nodes.some(({ tag, text }) => tag === "h3" && text === topic.title), `visible topic ${topic.title}`);
  }
  const date = nodes.find(({ tag }) => tag === "time");
  assert.equal(date.attrs.datetime, event.startDate);
  assert.equal(date.text, schedule.date);
  assert.ok(body.text.includes(schedule.time));
  assert.equal(nodes.find(({ tag }) => tag === "title").text, title);

  const form = nodes.find(({ tag, attrs }) => tag === "form" && Object.hasOwn(attrs, "data-webinar-registration"));
  if (source.registration_action && source.registration_telegram_field) {
    assert.ok(form, "native registration form is present");
    assert.equal(form.attrs.method.toLowerCase(), "post");
    assert.equal(form.attrs.action, source.registration_action);
    assert.equal(form.attrs.target, undefined, "without JavaScript the POST opens its native confirmation");
    const input = nodes.find(({ tag, attrs }) => tag === "input" && attrs.name === source.registration_telegram_field);
    assert.equal(input.attrs.type, "text");
    assert.ok(Object.hasOwn(input.attrs, "required"));
    assert.ok(nodes.some(({ tag, attrs }) => tag === "label" && attrs.for === input.attrs.id));
    for (const id of (input.attrs["aria-describedby"] || "").split(/\s+/).filter(Boolean)) assert.ok(ids.includes(id), `field description ${id}`);
    const confirmation = nodes.find(({ attrs }) => attrs.id === form.attrs["data-result-id"]);
    assert.ok(confirmation.text.includes("Заявка отправлена"), "a cross-origin response must not claim confirmed registration");
    assert.ok(confirmation.text.includes(`${schedule.shortDate} в ${schedule.start} МСК`));
    assert.equal(confirmation.attrs.tabindex, "-1");
    assert.ok(Object.hasOwn(confirmation.attrs, "hidden"));
  } else {
    assert.equal(form, undefined, "a draft without an endpoint must not offer a submission form");
    assert.ok(body.text.includes("Регистрация скоро откроется."));
  }

  const styles = nodes.filter(({ tag, attrs }) => tag === "link" && attrs.rel === "stylesheet");
  assert.equal(styles.length, 1, "event CSS is a single standalone bundle");
  assert.match(new URL(styles[0].attrs.href, url).pathname, /\/events\/css\/landing\.min\.[a-f0-9]+\.css$/);
  const themeScript = nodes.find(({ tag, attrs, text }) => tag === "script" && !attrs.src && text.includes("data-theme"));
  assert.ok(themeScript && nodes.indexOf(themeScript) < nodes.indexOf(styles[0]), "the event resolves its theme before CSS loads");
  const cssURL = new URL(styles[0].attrs.href, url).href;
  const css = await readFile(await existingAsset(output, cssURL, config.baseURL), "utf8");
  const fontURLs = [...css.matchAll(/url\((?:"([^"]+)"|'([^']+)'|([^\s)]+))\)/g)]
    .map((match) => match[1] || match[2] || match[3]).filter((value) => !value.startsWith("data:"));
  assert.ok(fontURLs.some((value) => /\.woff2?(?:[?#]|$)/.test(value)), "the event stylesheet includes its own web fonts");
  for (const value of fontURLs) {
    const assetURL = new URL(value, cssURL);
    assert.ok(assetURL.pathname.includes("/events/"), `event-owned CSS asset ${assetURL.href}`);
    await existingAsset(output, assetURL.href, config.baseURL);
  }
  const localScripts = nodes.filter(({ tag, attrs }) => tag === "script" && attrs.src && new URL(attrs.src, url).origin === new URL(url).origin);
  assert.equal(localScripts.length, 1, "theme scripts must not load on an event landing");
  assert.match(new URL(localScripts[0].attrs.src, url).pathname, /\/events\/js\/registration\.min\.[a-f0-9]+\.js$/);
  assert.ok(Object.hasOwn(localScripts[0].attrs, "defer"));
  await existingAsset(output, new URL(localScripts[0].attrs.src, url).href, config.baseURL);
  for (const image of nodes.filter(({ tag, attrs }) => tag === "img" && attrs.src)) {
    assert.ok(Number(image.attrs.width) > 0 && Number(image.attrs.height) > 0, "images reserve their rendered dimensions");
    await existingAsset(output, new URL(image.attrs.src, url).href, config.baseURL);
  }
  for (const image of [source.cover_image, ...source.speakers.map(({ image }) => image)].filter(Boolean)) {
    const path = resolve(bundle.directory, image);
    assert.ok(path.startsWith(bundle.directory + sep), `image belongs to the event bundle: ${image}`);
    assert.ok((await stat(path)).size > 0);
    if (source.build?.publishResources === false) {
      await assert.rejects(stat(outputPath(output, new URL(image, url).href, config.baseURL)), { code: "ENOENT" }, "original bundle images must not be published");
    }
  }
  return { url, nodes, schedule };
}

test("every event bundle builds with consistent metadata, assets and registration", async (t) => {
  const files = await markdownFiles(contentRoot);
  assert.ok(files.length > 0, "at least one event bundle must be checked");
  const config = parseTOML(await readFile(join(root, "config.toml"), "utf8"));
  const work = await mkdtemp(join(tmpdir(), "events-landings-"));
  t.after(() => rm(work, { recursive: true, force: true }));
  const output = join(work, "public");
  build(root, output, work);
  for (const file of files) {
    const bundle = await readBundle(file);
    if (bundle.data.draft) continue; // Drafts are checked in the isolated build below.
    await t.test(`${bundle.language}/${bundle.route}`, async () => {
      const { url } = await inspectLanding(bundle, config, output);
      const sitemap = await readFile(join(output, bundle.language, "sitemap.xml"), "utf8");
      assert.equal(sitemap.includes(url), !bundle.data.sitemap?.disable, "sitemap visibility follows the event configuration");
    });
  }
});

test("a second event builds through mounts without any theme or host assets", async (t) => {
  const work = await mkdtemp(join(tmpdir(), "events-independent-"));
  t.after(() => rm(work, { recursive: true, force: true }));
  const bundleDir = join(work, "content/ru/independent-event");
  await mkdir(bundleDir, { recursive: true });
  const source = {
    title: "Как проводить исследования",
    share_title: "Самостоятельное мероприятие",
    description: "Другое мероприятие с собственными темами и одним ведущим.",
    type: "event", layout: "landing", event_label: "Практикум", hidden: true, outputs: ["HTML"],
    build: { publishResources: false },
    intro: "Обсудим исследования и научимся задавать вопросы.",
    format: "Онлайн", format_note: "Вопросы и практика", cover_image: "fixture-cover.png",
    audience: "Тем, кто проводит интервью с пользователями.",
    questions_note: "Приносите вопросы об исследованиях.",
    event_start: "2027-02-11T10:15:00+03:00", event_end: "2027-02-11T11:30:00+03:00",
    registration_action: "https://example.invalid/register", registration_telegram_field: "entry.123",
    registration_label: "Зарегистрироваться", registration_note: "Напишем лично в Telegram.",
    takeaways: [{ title: "Вопросы об опыте", text: "Как обсуждать реальные ситуации." }],
    speakers: [{ name: "Тестовый Ведущий", role: "Исследователь", bio: "Проводит интервью.", image: "fixture-speaker.png", telegram: "fixture_speaker" }],
  };
  const file = join(bundleDir, "_index.md");
  await writeFile(file, `+++\n${stringify(source)}+++\n`);
  for (const name of [source.cover_image, source.speakers[0].image]) {
    await copyFile(join(eventsRoot, "assets/og/base.png"), join(bundleDir, name));
  }
  // Keep a Home object for organizer links without rendering a host homepage.
  await writeFile(join(work, "content/ru/_index.md"), '+++\ntitle = "Fixture"\n[_build]\nrender = "never"\nlist = "never"\n+++\n');
  const starterDirectory = join(work, "content/ru/starter-draft");
  await mkdir(starterDirectory);
  const starterFile = join(starterDirectory, "_index.md");
  const starter = await readFile(join(eventsRoot, "templates/webinar/_index.md"), "utf8");
  await writeFile(starterFile, starter.replaceAll("__EVENT_DAY__", "2027-03-10"));
  const config = {
    baseURL: "https://events.example.test/demo/", title: "Проверка модуля мероприятий",
    defaultContentLanguage: "ru", defaultContentLanguageInSubdirectory: false,
    disableKinds: ["taxonomy", "term", "RSS"],
    languages: { ru: { languageCode: "ru-RU", languageName: "RU", weight: 1 } },
    params: { authorName: "Другой организатор" },
    module: { mounts: [
      { source: join(eventsRoot, "layouts"), target: "layouts" },
      { source: join(eventsRoot, "assets"), target: "assets/events" },
      { source: join(eventsRoot, "content/ru"), target: "content", lang: "ru" },
      { source: join(work, "content/ru"), target: "content", lang: "ru" },
    ] },
  };
  await writeFile(join(work, "hugo.toml"), stringify(config));
  const output = join(work, "public");
  build(work, output, work, { drafts: true });
  const { nodes, schedule } = await inspectLanding(await readBundle(file, join(work, "content")), config, output);
  assert.equal(schedule.durationMinutes, 75, "the second event has an independent schedule");
  const body = nodes.find(({ tag }) => tag === "body");
  assert.doesNotMatch(body.text, /Как нанимают продактов|Дарья Беглова/);
  assert.ok(body.text.includes(source.takeaways[0].title));
  await inspectLanding(await readBundle(starterFile, join(work, "content")), config, output);
  for (const existing of await markdownFiles(contentRoot)) {
    const bundle = await readBundle(existing);
    if (bundle.language === "ru") await inspectLanding(bundle, config, output);
  }
});
