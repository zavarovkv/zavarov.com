import { readTotals, compactCount, metrics, statisticsOrigin, statisticsEndpoint } from "./statistics-data.mjs";

export function startStatistics({ root, origin, locale, fetchImpl = fetch, doc = document, interval = setInterval, now = () => new Date() }) {
  if (!root || origin !== statisticsOrigin) return;
  const number = new Intl.NumberFormat(locale);
  const compactNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const scales = JSON.parse(root.dataset.scales);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const messages = JSON.parse(root.dataset.messages);
  function updateTitle(counter, stale = false) {
    const exact = counter.value === "" ? messages.unknown : number.format(Number(counter.value));
    counter.title = `${exact}. ${stale ? messages.stale + " " : ""}${messages.updated} ${date.format(new Date(root.dataset.updated))} UTC`;
  }
  let pending = false;
  let firstLoad = true;
  const counters = [...root.querySelectorAll("[data-total]")];
  async function update() {
    if (pending || doc.hidden) return;
    pending = true;
    if (firstLoad) {
      for (const counter of counters) {
        counter.classList.add("loading-skeleton");
        counter.setAttribute("aria-busy", "true");
      }
    }
    try {
      const response = await fetchImpl(statisticsEndpoint, {
        credentials: "omit", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Statistics unavailable");
      const text = await response.text();
      if (text.length > 16384) throw new Error("Statistics response too large");
      const value = JSON.parse(text);
      const totals = readTotals(value);
      root.dataset.updated = now().toISOString();
      for (const metric of metrics) {
        const counter = root.querySelector(`[data-metric="${metric}"] [data-total]`);
        const displayed = compactCount(totals[metric], scales);
        counter.value = totals[metric] === null ? "" : String(totals[metric]);
        counter.querySelector("[data-total-number]").textContent = displayed.number === null ? "—" : compactNumber.format(displayed.number);
        const unit = counter.querySelector("[data-total-unit]");
        unit.textContent = displayed.suffix ? "\u00a0" + displayed.suffix : "";
        unit.hidden = !displayed.suffix;
        updateTitle(counter);
      }
    } catch {
      for (const counter of root.querySelectorAll("[data-total]")) {
        updateTitle(counter, true);
      }
    } finally {
      for (const counter of counters) {
        counter.classList.remove("loading-skeleton");
        counter.removeAttribute("aria-busy");
      }
      firstLoad = false;
      pending = false;
    }
  }
  update();
  interval(update, 300000);
}

if (typeof document !== "undefined") {
  startStatistics({ root: document.querySelector("[data-council-statistics]"), origin: location.origin, locale: document.documentElement.lang });
}
