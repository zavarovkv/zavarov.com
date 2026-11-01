import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readTotals, compactCount, normalizeSnapshot } from "../assets/council/statistics-data.mjs";
import { refreshStatistics } from "../scripts/fetch-council-statistics.mjs";

const fixture = () => ({ schema: 1, agents: [
  { slug: "qui-gon", closed_tasks: 2, tokens: 1500, model: { name: "GPT-6.1 Sol", effort: "PRIVATE", api_key: "PRIVATE" }, linear_model: { name: "GPT-6.1 Sol" } },
  { slug: "lando", closed_tasks: 4, tokens: 200 },
  { slug: "dexter", closed_tasks: 2, tokens: 100 },
  { slug: "padme", closed_tasks: 0, tokens: 50 },
] });

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
