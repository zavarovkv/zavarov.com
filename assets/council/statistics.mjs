import { readTotals, compactCount, metrics, statisticsOrigin, statisticsEndpoint } from "./statistics-data.mjs";
import { readStatisticsCache, saveStatisticsCache, browserStatisticsStorage } from "./statistics-cache.mjs";

export function startStatistics({
  root, origin, locale, fetchImpl = fetch, doc = document,
  interval = setInterval, now = () => new Date(),
  storage = browserStatisticsStorage(), timeout = setTimeout, cancelTimeout = clearTimeout,
}) {
  if (!root || origin !== statisticsOrigin) return;
  const number = new Intl.NumberFormat(locale);
  const compactNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const scales = JSON.parse(root.dataset.scales);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const messages = JSON.parse(root.dataset.messages);
  const counters = Object.fromEntries(metrics.map(metric => [metric, root.querySelector(`[data-metric="${metric}"] [data-total]`)]));
  const cached = readStatisticsCache(storage);

  function updateTitle(counter, stale = false) {
    const exact = counter.value === "" ? messages.unknown : number.format(Number(counter.value));
    const updated = counter.dataset.updated || root.dataset.updated;
    counter.title = `${exact}. ${stale ? messages.stale + " " : ""}${messages.updated} ${date.format(new Date(updated))} UTC`;
  }
  function render(counter, value, updated) {
    const displayed = compactCount(value, scales);
    counter.value = String(value);
    counter.dataset.updated = updated;
    counter.querySelector("[data-total-number]").textContent = compactNumber.format(displayed.number);
    const unit = counter.querySelector("[data-total-unit]");
    unit.textContent = displayed.suffix ? "\u00a0" + displayed.suffix : "";
    unit.hidden = !displayed.suffix;
    updateTitle(counter);
  }
  // Keep the freshest known value per metric, even when another metric is unavailable.
  for (const metric of metrics) {
    const counter = counters[metric];
    counter.dataset.updated = root.dataset.updated;
    const record = cached[metric];
    if (record && (counter.value === "" || Date.parse(record.updated) > Date.parse(root.dataset.updated))) {
      render(counter, record.value, record.updated);
    } else if (counter.value !== "") {
      cached[metric] = { value: Number(counter.value), updated: root.dataset.updated };
    }
  }
  saveStatisticsCache(storage, cached);

  let pending = false;
  let firstLoad = true;
  async function update() {
    if (pending || doc.hidden) return;
    pending = true;
    const missing = firstLoad ? Object.values(counters).filter(counter => counter.value === "") : [];
    for (const counter of missing) counter.setAttribute("aria-busy", "true");
    // Fast requests never flash a placeholder, and known values are never masked.
    const placeholder = missing.length ? timeout(() => {
      for (const counter of missing) counter.classList.add("loading-skeleton");
    }, 200) : null;
    try {
      const response = await fetchImpl(statisticsEndpoint, {
        credentials: "omit", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Statistics unavailable");
      const text = await response.text();
      if (text.length > 16384) throw new Error("Statistics response too large");
      const totals = readTotals(JSON.parse(text));
      const updated = now().toISOString();
      root.dataset.updated = updated;
      for (const metric of metrics) {
        const counter = counters[metric];
        if (totals[metric] === null) {
          updateTitle(counter, true);
          continue;
        }
        render(counter, totals[metric], updated);
        cached[metric] = { value: totals[metric], updated };
      }
      saveStatisticsCache(storage, cached);
    } catch {
      for (const counter of Object.values(counters)) updateTitle(counter, true);
    } finally {
      if (placeholder !== null) cancelTimeout(placeholder);
      for (const counter of missing) {
        counter.classList.remove("loading-skeleton");
        counter.removeAttribute("aria-busy");
      }
      firstLoad = false;
      pending = false;
    }
  }
  if (doc.hidden) {
    const resume = () => {
      if (doc.hidden) return;
      doc.removeEventListener("visibilitychange", resume);
      return update();
    };
    doc.addEventListener("visibilitychange", resume);
  } else {
    update();
  }
  interval(update, 300000);
}

if (typeof document !== "undefined") {
  startStatistics({ root: document.querySelector("[data-council-statistics]"), origin: location.origin, locale: document.documentElement.lang });
}
