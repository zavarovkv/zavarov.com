import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const template = readFileSync(new URL("../layouts/council/single.html", import.meta.url), "utf8");
const ru = readFileSync(new URL("../content/ru/council.md", import.meta.url), "utf8");
const en = readFileSync(new URL("../content/en/council.md", import.meta.url), "utf8");
const css = readFileSync(new URL("../assets/council/council.css", import.meta.url), "utf8");

test("Council has localized canonical page paths", () => {
  assert.match(ru, /url = "\/council\/"/);
  assert.match(en, /url = "\/en\/council\/"/);
  const base = readFileSync(new URL("../themes/hugo-mini/layouts/baseof.html", import.meta.url), "utf8");
  assert.match(base, /hreflang=/);
  assert.doesNotMatch(template, /rel="canonical"/);
});
test("Council sign-in stays on the protected application origin", () => {
  assert.match(template, /\/login\?next=%2Fprofiles/);
  assert.doesNotMatch(template, /telegram-login\.js/);
});
test("Council styles are scoped and do not require external CDNs", () => {
  assert.match(template, /resources\.Get "council\/council\.css"/);
  assert.doesNotMatch(css, /@import|https:\/\//);
});

test("Council footer has project controls but no personal social or email contacts", () => {
  const footer = readFileSync(new URL("../layouts/partials/council/footer.html", import.meta.url), "utf8");
  assert.match(template, /partial "council\/footer.html"/);
  assert.match(footer, /theme-toggle/);
  assert.match(footer, /lang-toggle/);
  assert.match(footer, /agent-council/);
  assert.doesNotMatch(footer, /Params\.social|mailto:|linkedin\.com|t\.me\//);
});
test("Council inherits the real hugo-mini base template and styles only layout", () => {
  assert.match(template, /{{ define "main" }}/);
  assert.match(template, /{{ define "footer" }}/);
  assert.doesNotMatch(template, /<!doctype html>/i);
  assert.doesNotMatch(css, /--background-color\s*:|@font-face|font-family\s*:/);
});
