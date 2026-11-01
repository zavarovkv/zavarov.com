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
  assert.match(template, /hreflang="ru"/);
  assert.match(template, /hreflang="en"/);
});
test("Council sign-in stays on the protected application origin", () => {
  assert.match(template, /https:\/\/council\.zavarov\.com\/login\?next=%2Fprofiles/);
  assert.doesNotMatch(template, /telegram-login\.js/);
});
test("Council styles are scoped and do not require external CDNs", () => {
  assert.match(template, /resources\.Get "council\/council\.css"/);
  assert.doesNotMatch(css, /@import|https:\/\//);
});
