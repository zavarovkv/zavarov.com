// Keep public team totals; discard per-agent details and configuration.
export const statisticsOrigin = "https://council.zavarov.com";
export const statisticsEndpoint = "/auth/login/council/team";
export const metrics = ["closed_tasks", "tokens"];

// The template supplies the same localized scales to its initial render and JS.
export function compactCount(count, scales) {
  if (count === null) return { number: null, suffix: "" };
  for (const [index, scale] of scales.entries()) {
    if (count < scale.divisor) continue;
    const number = Math.round(count / scale.divisor * 10) / 10;
    if (number >= 1000 && index > 0) return { number: 1, suffix: scales[index - 1].suffix };
    return { number, suffix: scale.suffix };
  }
  return { number: count, suffix: "" };
}

const agentSlugs = new Set(["qui-gon", "galen-erso", "dexter", "lando", "padme", "k-2so"]);
const validCount = value => value === null || Number.isSafeInteger(value) && value >= 0;

function teamAgents(value) {
  if (value?.schema !== 1 || !Array.isArray(value.agents) || !value.agents.length || value.agents.length > agentSlugs.size) {
    throw new Error("Invalid Council statistics");
  }
  const seen = new Set();
  for (const agent of value.agents) {
    if (!agentSlugs.has(agent?.slug) || seen.has(agent.slug)) throw new Error("Invalid agent");
    seen.add(agent.slug);
  }
  return value.agents;
}

export function readTotals(value) {
  const totals = { closed_tasks: 0, tokens: 0 };
  for (const agent of teamAgents(value)) {
    for (const metric of metrics) {
      const count = agent[metric];
      if (!validCount(count)) throw new Error("Invalid counter");
      if (count === null) totals[metric] = null;
      else if (totals[metric] !== null) {
        totals[metric] += count;
        if (!Number.isSafeInteger(totals[metric])) throw new Error("Counter total exceeds safe precision");
      }
    }
  }
  return totals;
}

export function normalizeSnapshot(value) {
  const timestamp = Date.parse(value?.fetched_at);
  if (value?.schema !== 1 || !Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value.fetched_at) {
    throw new Error("Invalid snapshot");
  }
  const totals = {};
  for (const metric of metrics) {
    const count = value.totals?.[metric];
    if (!validCount(count)) throw new Error("Invalid snapshot counter");
    totals[metric] = count;
  }
  return { schema: 1, fetched_at: value.fetched_at, totals };
}
