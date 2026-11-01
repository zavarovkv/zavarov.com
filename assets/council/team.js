// The public Council endpoint exposes only allowlisted aggregate statistics.
// The static page must remain useful when the endpoint is unavailable.
(() => {
  const cards = new Map([...document.querySelectorAll("[data-agent]")].map(card => [card.dataset.agent, card]));
  const status = document.querySelector("[data-team-status]");
  const ru = document.documentElement.lang === "ru";
  const text = (a, b) => ru ? a : b;
  const count = n => Number.isSafeInteger(n) && n >= 0 ? new Intl.NumberFormat(document.documentElement.lang).format(n) : "—";
  async function update() {
    try {
      const response = await fetch("/auth/login/council/team", {
        credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error("unavailable");
      const payload = await response.json();
      if (payload.schema !== 1 || !Array.isArray(payload.agents) || payload.agents.length !== cards.size) throw new Error("invalid");
      const incoming = new Map(payload.agents.map(agent => [agent.slug, agent]));
      if (incoming.size !== cards.size || [...cards.keys()].some(key => !incoming.has(key))) throw new Error("unexpected agent");
      for (const [slug, card] of cards) {
        const agent = incoming.get(slug);
        const field = name => card.querySelector('[data-field="' + name + '"]');
        field("model").textContent = agent.model ? agent.model.name + " · " + agent.model.effort : text("Не настроена", "Not configured");
        field("closed_tasks").textContent = count(agent.closed_tasks);
        field("tokens").textContent = count(agent.tokens);
        field("connection").textContent = agent.linear_connected === true
          ? text("Подключен к Linear", "Connected to Linear")
          : agent.linear_connected === false
            ? text("Подключение к Linear не завершено", "Linear connection incomplete")
            : text("Статистика Linear временно недоступна", "Linear statistics temporarily unavailable");
      }
      status.textContent = "";
    } catch {
      status.textContent = text("Статистика временно недоступна. Данные не подменяются.", "Statistics temporarily unavailable. No placeholder numbers are shown.");
    }
  }
  update();
  setInterval(() => { if (!document.hidden) update(); }, 300000);
})();
