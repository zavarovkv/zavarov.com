import { metrics } from "./statistics-data.mjs";

export const statisticsCacheKey = "council.statistics.v1";

export function readStatisticsCache(storage) {
  try {
    const text = storage?.getItem(statisticsCacheKey);
    if (!text || text.length > 2048) return {};
    const saved = JSON.parse(text);
    if (saved?.schema !== 1) return {};
    const records = {};
    for (const metric of metrics) {
      const record = saved.metrics?.[metric];
      if (!Number.isSafeInteger(record?.value) || record.value < 0) continue;
      const date = Date.parse(record.updated);
      if (!Number.isFinite(date) || new Date(date).toISOString() !== record.updated) continue;
      records[metric] = { value: record.value, updated: record.updated };
    }
    return records;
  } catch {
    return {};
  }
}

export function saveStatisticsCache(storage, records) {
  try {
    storage?.setItem(statisticsCacheKey, JSON.stringify({ schema: 1, metrics: records }));
  } catch {
    // Blocked storage or an exhausted quota must never interrupt the counters.
  }
}

export function browserStatisticsStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
