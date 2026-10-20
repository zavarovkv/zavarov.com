// Resolve the event color scheme before first paint.
(function () {
  let theme;
  try {
    theme = localStorage.getItem("theme");
  } catch {
    // Storage may be unavailable; use the system preference below.
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
