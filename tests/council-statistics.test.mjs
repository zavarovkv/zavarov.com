import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readTotals, compactCount, normalizeSnapshot } from "../assets/council/statistics-data.mjs";
import { refreshStatistics } from "../scripts/fetch-council-statistics.mjs";
import { startStatistics } from "../assets/council/statistics.mjs";
import { readStatisticsCache, statisticsCacheKey } from "../assets/council/statistics-cache.mjs";

const fixture = () => ({ schema: 1, agents: [
  { slug: "qui-gon", closed_tasks: 2, tokens: 1500, model: { name: "GPT-6.1 Sol", effort: "PRIVATE", api_key: "PRIVATE" }, linear_model: { name: "GPT-6.1 Sol" } },
  { slug: "lando", closed_tasks: 4, tokens: 200 },
  { slug: "dexter", closed_tasks: 2, tokens: 100 },
  { slug: "padme", closed_tasks: 0, tokens: 50 },
] });

function liveCounters(values = { closed_tasks: 12, tokens: 12 }, options = {}) {
  const counters = Object.fromEntries(Object.entries(values).map(([key, value]) => {
    const classes = new Set();
    const attributes = new Map();
    const children = { "[data-total-number]": { textContent: value === null ? "—" : String(value) }, "[data-total-unit]": { textContent: "", hidden: true } };
    return [key, {
      value: value === null ? "" : String(value), classes, attributes, dataset: {},
      classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: name => attributes.delete(name),
      querySelector: selector => children[selector],
    }];
  }));
  const root = {
    dataset: { updated: "2026-11-01T14:00:00.000Z", scales: "[]", messages: JSON.stringify({ unknown: "Unknown", stale: "Stale", updated: "Updated" }) },
    querySelectorAll: () => Object.values(counters),
    querySelector: selector => counters[selector.match(/data-metric="([^"]+)"/)[1]],
  };
  const requests = [];
  const state = { counters, root, requests };
  startStatistics({ root, origin: "https://council.zavarov.com", locale: "en", doc: { hidden: false }, storage: null,
    fetchImpl: () => new Promise(resolve => { requests.push(resolve); }),
    interval: callback => { state.refresh = callback; },
    timeout: (callback, delay) => { state.placeholder = callback; state.delay = delay; return 1; },
    cancelTimeout: () => { state.placeholder = null; },
    now: () => new Date("2026-11-02T14:00:00Z"),
    ...options,
  });
  state.respond = async response => { requests.shift()(response); await new Promise(resolve => setImmediate(resolve)); };
  return state;
}

const response = value => ({ ok: true, text: async () => JSON.stringify(value) });

test("known numbers never disappear during initial requests, failures or background refreshes", async () => {
  const state = liveCounters();
  assert.equal(state.placeholder, undefined);
  assert.ok(Object.values(state.counters).every(counter => counter.classes.size === 0));
  await state.respond({ ok: false });
  assert.ok(Object.values(state.counters).every(counter => counter.value === "12" && counter.classes.size === 0));
  const next = state.refresh();
  assert.ok(Object.values(state.counters).every(counter => counter.classes.size === 0));
  await state.respond(response(fixture()));
  await next;
  assert.equal(state.counters.closed_tasks.value, "8");
  assert.equal(state.counters.tokens.value, "1850");
});

test("only unknown numbers get a delayed placeholder, which clears after failure", async () => {
  const state = liveCounters({ closed_tasks: null, tokens: 12 });
  assert.equal(state.delay, 200);
  assert.ok(Object.values(state.counters).every(counter => counter.classes.size === 0));
  state.placeholder();
  assert.ok(state.counters.closed_tasks.classes.has("loading-skeleton"));
  assert.equal(state.counters.tokens.classes.size, 0);
  await state.respond({ ok: false });
  assert.equal(state.placeholder, null);
  assert.equal(state.counters.closed_tasks.value, "");
  assert.ok(Object.values(state.counters).every(counter => counter.classes.size === 0 && !counter.attributes.has("aria-busy")));
});

test("cached values survive unavailable metrics and keep their original retrieval time", async () => {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  const first = liveCounters(undefined, { storage });
  await first.respond(response(fixture()));
  const second = liveCounters({ closed_tasks: null, tokens: 1 }, { storage, now: () => new Date("2026-11-03T14:00:00Z") });
  assert.equal(second.counters.closed_tasks.value, "8");
  assert.equal(second.counters.tokens.value, "1850");
  assert.equal(second.placeholder, undefined);
  const value = fixture();
  value.agents[0].closed_tasks = null;
  await second.respond(response(value));
  assert.equal(second.counters.closed_tasks.value, "8");
  assert.match(second.counters.closed_tasks.title, /Stale/);
  assert.equal(second.counters.closed_tasks.dataset.updated, "2026-11-02T14:00:00.000Z");
  assert.equal(second.counters.tokens.dataset.updated, "2026-11-03T14:00:00.000Z");
  const third = liveCounters({ closed_tasks: null, tokens: null }, { storage });
  assert.equal(third.counters.closed_tasks.value, "8");
  await third.respond({ ok: false });
});

test("a fast first response cancels the unknown-value placeholder before it appears", async () => {
  const state = liveCounters({ closed_tasks: null, tokens: 12 });
  assert.equal(state.delay, 200);
  await state.respond(response(fixture()));
  assert.equal(state.placeholder, null);
  assert.equal(state.counters.closed_tasks.value, "8");
  assert.ok(Object.values(state.counters).every(counter => counter.classes.size === 0));
});

test("newer server-rendered zeros win over older cached numbers", async () => {
  const records = { closed_tasks: { value: 99, updated: "2026-10-01T14:00:00.000Z" }, tokens: { value: 500, updated: "2026-10-01T14:00:00.000Z" } };
  const storage = { getItem: () => JSON.stringify({ schema: 1, metrics: records }), setItem() {} };
  const state = liveCounters({ closed_tasks: 0, tokens: 0 }, { storage });
  assert.equal(state.counters.closed_tasks.value, "0");
  assert.equal(state.counters.tokens.value, "0");
  assert.equal(state.placeholder, undefined);
  await state.respond({ ok: false });
});

test("blocked browser storage never interrupts loading and hidden pages request on becoming visible", async () => {
  const handlers = new Map();
  const doc = { hidden: true, addEventListener: (name, callback) => handlers.set(name, callback), removeEventListener: name => handlers.delete(name) };
  const storage = { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Quota"); } };
  const state = liveCounters(undefined, { storage, doc });
  assert.equal(state.requests.length, 0);
  doc.hidden = false;
  const resumed = handlers.get("visibilitychange")();
  assert.equal(state.requests.length, 1);
  assert.equal(handlers.size, 0);
  await state.respond(response(fixture()));
  await resumed;
  assert.equal(state.counters.tokens.value, "1850");
});

test("counters publish only team totals and keep unknown values distinct from zero", () => {
  assert.deepEqual(readTotals(fixture()), { closed_tasks: 8, tokens: 1850 });
  const value = fixture();
  value.agents[1].closed_tasks = null;
  assert.deepEqual(readTotals(value), { closed_tasks: null, tokens: 1850 });
  for (const agent of value.agents) agent.closed_tasks = 0;
  assert.deepEqual(readTotals(value), { closed_tasks: 0, tokens: 1850 });
  value.agents.push({ slug: "galen-erso", closed_tasks: 3, tokens: 500 }, { slug: "k-2so", closed_tasks: 5, tokens: 250 });
  assert.deepEqual(readTotals(value), { closed_tasks: 8, tokens: 2600 });
});

test("compact counters preserve zero and unknown values and carry across unit boundaries", () => {
  const scales = [
    { divisor: 1e12, suffix: "T" }, { divisor: 1e9, suffix: "B" },
    { divisor: 1e6, suffix: "M" }, { divisor: 1e3, suffix: "K" },
  ];
  for (const [count, number, suffix] of [
    [null, null, ""], [0, 0, ""], [999, 999, ""], [1000, 1, "K"],
    [1490, 1.5, "K"], [999949, 999.9, "K"], [999950, 1, "M"],
    [1937982, 1.9, "M"], [1e9, 1, "B"], [1e12, 1, "T"],
  ]) assert.deepEqual(compactCount(count, scales), { number, suffix });
});

test("invalid responses cannot publish plausible totals", () => {
  for (const count of [-1, 1.5, true, "12", undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const value = fixture();
    value.agents[0].tokens = count;
    assert.throws(() => readTotals(value));
  }
  for (const agents of [[], [...fixture().agents, fixture().agents[0]], [{ slug: "unknown", closed_tasks: 0, tokens: 0 }]]) {
    assert.throws(() => readTotals({ schema: 1, agents }));
  }
  assert.throws(() => readTotals({ ...fixture(), schema: 2 }));
  const overflow = fixture();
  overflow.agents[0].tokens = Number.MAX_SAFE_INTEGER;
  assert.throws(() => readTotals(overflow));
});

test("saved counters validate their retrieval date and discard unrelated fields", () => {
  const saved = { schema: 1, fetched_at: "2026-11-01T14:00:00.000Z", totals: { closed_tasks: 0, tokens: null, secret: "ignore" }, extra: "ignore" };
  assert.deepEqual(normalizeSnapshot(saved), { schema: 1, fetched_at: saved.fetched_at, totals: { closed_tasks: 0, tokens: null } });
  assert.throws(() => normalizeSnapshot({ ...saved, fetched_at: "invalid" }));
  assert.throws(() => normalizeSnapshot({ ...saved, totals: {} }));
});

test("refresh saves an allowlisted snapshot atomically and preserves it on outages or invalid responses", async t => {
  const dir = await mkdtemp(join(tmpdir(), "council-statistics-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const target = pathToFileURL(join(dir, "snapshot.json"));
  const now = () => new Date("2026-11-01T14:00:00Z");
  const requests = [];
  assert.equal(await refreshStatistics({ target, now, fetchImpl: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, text: async () => JSON.stringify(fixture()) };
  } }), true);
  assert.equal(requests[0].url, "https://council.zavarov.com/auth/login/council/team");
  assert.equal(requests[0].options.credentials, "omit");
  assert.equal(requests[0].options.redirect, "error");
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  const saved = await readFile(target, "utf8");
  assert.equal(JSON.parse(saved).fetched_at, now().toISOString());
  assert.doesNotMatch(saved, /PRIVATE|api_key|effort|not-for-the-landing|"agents"|"slug"|"models"|GPT-/);
  assert.deepEqual(JSON.parse(saved).totals, { closed_tasks: 8, tokens: 1850 });
  for (const fetchImpl of [
    async () => { throw new Error("offline"); },
    async () => ({ ok: false }),
    async () => ({ ok: true, text: async () => "not JSON" }),
    async () => ({ ok: true, text: async () => " ".repeat(16385) }),
    async () => ({ ok: true, text: async () => JSON.stringify({ schema: 1, agents: [] }) }),
  ]) {
    assert.equal(await refreshStatistics({ target, now, fetchImpl }), false);
    assert.equal(await readFile(target, "utf8"), saved, "failed refresh cannot advance the timestamp or overwrite data");
  }
  await writeFile(target, "{}");
  await assert.rejects(refreshStatistics({ target, now, fetchImpl: async () => { throw new Error("offline"); } }));
});


test("browser cache discards malformed records and unrelated fields", () => {
  const updated = "2026-11-02T14:00:00.000Z";
  const read = value => readStatisticsCache({ getItem: key => { assert.equal(key, statisticsCacheKey); return JSON.stringify(value); } });
  assert.deepEqual(read({ schema: 1, metrics: { closed_tasks: { value: 0, updated, secret: "ignore" }, tokens: { value: -1, updated }, extra: { value: 10, updated } } }), { closed_tasks: { value: 0, updated } });
  for (const value of [null, {}, { schema: 2 }, { schema: 1, metrics: { tokens: { value: 1, updated: "invalid" } } }]) assert.deepEqual(read(value), {});
  assert.deepEqual(readStatisticsCache({ getItem: () => "not JSON" }), {});
  assert.deepEqual(readStatisticsCache({ getItem: () => " ".repeat(2049) }), {});
});
