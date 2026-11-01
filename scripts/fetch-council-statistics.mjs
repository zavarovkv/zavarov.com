#!/usr/bin/env node
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readTotals, normalizeSnapshot, statisticsEndpoint, statisticsOrigin } from "../assets/council/statistics-data.mjs";

const destination = new URL("../data/council_statistics.json", import.meta.url);

export async function refreshStatistics({ fetchImpl = fetch, target = destination, now = () => new Date() } = {}) {
  try {
    const response = await fetchImpl(statisticsOrigin + statisticsEndpoint, {
      credentials: "omit", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Statistics unavailable");
    const text = await response.text();
    if (text.length > 16384) throw new Error("Statistics response too large");
    const value = JSON.parse(text);
    const snapshot = { schema: 1, fetched_at: now().toISOString(), totals: readTotals(value) };
    const temporary = new URL(target);
    temporary.pathname += ".tmp";
    await writeFile(temporary, JSON.stringify(snapshot, null, 2) + "\n");
    await rename(temporary, target);
    return true;
  } catch {
    // Keep the previous snapshot and its actual retrieval time on an outage.
    normalizeSnapshot(JSON.parse(await readFile(target, "utf8")));
    console.warn("Council statistics could not be refreshed; keeping the saved snapshot.");
    return false;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await refreshStatistics();
}
