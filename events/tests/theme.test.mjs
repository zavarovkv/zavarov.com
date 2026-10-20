import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../assets/js/theme.js", import.meta.url), "utf8");

function colorScheme({ saved = null, dark = false, storageUnavailable = false } = {}) {
  const attributes = new Map();
  runInNewContext(script, {
    localStorage: {
      getItem(key) {
        assert.equal(key, "theme");
        if (storageUnavailable) throw new Error("Storage unavailable");
        return saved;
      },
    },
    window: {
      matchMedia(query) {
        assert.equal(query, "(prefers-color-scheme: dark)");
        return { matches: dark };
      },
    },
    document: { documentElement: { setAttribute(name, value) { attributes.set(name, value); } } },
  });
  return attributes.get("data-theme");
}

test("an event honors a saved light or dark preference over the system scheme", () => {
  assert.equal(colorScheme({ saved: "light", dark: true }), "light");
  assert.equal(colorScheme({ saved: "dark", dark: false }), "dark");
});

test("an event follows the system scheme without a valid saved preference", () => {
  for (const saved of [null, "", "system", "invalid"]) {
    for (const dark of [false, true]) assert.equal(colorScheme({ saved, dark }), dark ? "dark" : "light");
  }
});

test("an event still resolves its color scheme when storage is unavailable", () => {
  assert.equal(colorScheme({ dark: true, storageUnavailable: true }), "dark");
  assert.equal(colorScheme({ dark: false, storageUnavailable: true }), "light");
});
