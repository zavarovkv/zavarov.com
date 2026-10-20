import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../assets/js/registration.js", import.meta.url), "utf8");

function element(properties = {}) {
  const attributes = new Map();
  const events = {};
  return {
    ...properties,
    events,
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    addEventListener(type, callback) { events[type] = callback; },
    focus() { this.focused = true; },
  };
}

// A deliberately local DOM model: native POSTs are recorded, never sent.
function registration(value = " @example ", { missing = "", target = null } = {}) {
  const frames = [];
  const posts = [];
  const timers = new Map();
  let timerId = 0;
  const field = element({
    value, readOnly: false, validationMessage: "",
    setCustomValidity(message) { this.validationMessage = message; },
  });
  const button = element({ textContent: "Зарегистрироваться", disabled: false });
  const status = element({ textContent: "", hidden: true });
  const result = element({ hidden: true, focused: false });
  const transport = element({
    name: "signup-response", hidden: true,
    cloneNode() {
      return element({
        hidden: true, removed: false,
        contentWindow: { location: { href: "about:blank" } },
        remove() { this.removed = true; },
      });
    },
    insertAdjacentElement(position, frame) {
      assert.equal(position, "afterend");
      frames.push(frame);
    },
  });
  const form = element({
    hidden: false, noValidate: false,
    dataset: { responseId: "signup-response", resultId: "signup-result" },
    reportValidity() { return field.value.length > 0 && !field.validationMessage; },
    querySelector(selector) {
      const key = selector.startsWith("input") ? "field"
        : selector.startsWith("button") ? "button" : "status";
      return key === missing ? null : { field, button, status }[key];
    },
  });
  Object.defineProperty(form, "target", {
    get() { return this.getAttribute("target") ?? ""; },
    set(value) { this.setAttribute("target", value); },
  });
  if (target !== null) form.target = target;
  runInNewContext(script, {
    document: {
      querySelector() { return missing === "form" ? null : form; },
      getElementById(id) {
        const key = id === "signup-result" ? "result" : "transport";
        return key === missing ? null : { result, transport }[key];
      },
    },
    window: {
      setTimeout(callback, delay) {
        assert.equal(delay, 30000);
        timers.set(++timerId, callback);
        return timerId;
      },
      clearTimeout(id) { timers.delete(id); },
    },
  });
  return {
    form, field, button, status, result, transport, frames, posts, timers,
    submit() {
      let prevented = false;
      form.events.submit?.({ preventDefault() { prevented = true; } });
      if (!prevented) posts.push({ target: form.target, value: field.value });
      return prevented;
    },
    input(value) { field.value = value; field.events.input(); },
    load(frame = frames.at(-1), { blank = false } = {}) {
      if (!blank) {
        Object.defineProperty(frame.contentWindow, "location", {
          configurable: true,
          get() { throw new Error("Cross-origin access denied"); },
        });
      }
      frame.events.load();
    },
    error(frame = frames.at(-1)) { frame.events.error(); },
    expire() { [...timers.values()][0](); },
  };
}

test("Telegram handles and profile links normalize before the native POST", () => {
  for (const [value, normalized] of [
    [" example ", "@example"],
    [" @Example_42 ", "@Example_42"],
    ["t.me/example", "@example"],
    ["https://t.me/Example_42", "@Example_42"],
    [" HTTP://T.ME/example/ ", "@example"],
    ["https://www.t.me/example", "@example"],
    ["@nick", "@nick"], // Collectible names may have fewer than five characters.
    [`@${"a".repeat(32)}`, `@${"a".repeat(32)}`],
  ]) {
    const page = registration(value);
    assert.equal(page.submit(), false, value);
    assert.equal(page.field.value, normalized, value);
    assert.deepEqual(page.posts, [{ target: page.frames[0].name, value: normalized }]);
    assert.equal(page.field.readOnly, true);
    assert.notEqual(page.field.disabled, true, "keep Telegram in the POST payload");
    assert.equal(page.button.disabled, true);
    assert.equal(page.form.getAttribute("aria-busy"), "true");
    assert.equal(page.status.hidden, false);
    assert.match(page.status.textContent, /Отправляем/);
  }
});

test("malformed contacts are rejected without a POST or transport", () => {
  for (const value of [
    "", "   ", "@@example", "@1example", "@_example", "@example_",
    "@exa mple", "@пример", "@exam-ple", "@example.com", `@${"a".repeat(33)}`,
    "https://t.me/example/123", "https://t.me/+123456789", "https://t.me/example?start=x",
    "https://t.me.evil.test/example", "https://evil.test/t.me/example", "t.me/",
  ]) {
    const page = registration(value);
    assert.equal(page.submit(), true, value);
    assert.equal(page.posts.length, 0, value);
    assert.equal(page.frames.length, 0, value);
    assert.equal(page.result.hidden, true);
    assert.equal(page.button.disabled, false);
    assert.equal(page.field.readOnly, false);
    assert.equal(page.field.getAttribute("aria-invalid"), "true");
    assert.match(page.field.validationMessage, /@username/);
    assert.equal(page.status.hidden, false);
  }
});

test("editing clears an old validation error and allows a corrected contact", () => {
  const page = registration("wrong value");
  page.submit();
  page.input("https://t.me/example");
  assert.equal(page.field.validationMessage, "");
  assert.equal(page.field.getAttribute("aria-invalid"), null);
  assert.equal(page.status.hidden, true);
  assert.equal(page.submit(), false);
  assert.equal(page.field.value, "@example");
});

test("duplicate submits do not create another POST, iframe, or timer", () => {
  const page = registration();
  assert.equal(page.submit(), false);
  assert.equal(page.submit(), true);
  assert.equal(page.posts.length, 1);
  assert.equal(page.frames.length, 1);
  assert.equal(page.timers.size, 1);
});

test("only a response to the active attempt reveals and focuses the sent state", () => {
  const page = registration();
  page.submit();
  page.load(undefined, { blank: true });
  assert.equal(page.result.hidden, true, "ignore the iframe's initial blank load");
  page.load();
  assert.equal(page.form.hidden, true);
  assert.equal(page.result.hidden, false);
  assert.equal(page.result.focused, true);
  assert.equal(page.frames[0].hidden, true);
  assert.equal(page.frames[0].removed, true);
  assert.equal(page.form.getAttribute("target"), null);
  assert.equal(page.form.getAttribute("aria-busy"), "false");
  assert.equal(page.status.hidden, true);
  assert.equal(page.timers.size, 0);
  assert.equal(page.submit(), true, "ignore queued submits after completion");
  assert.equal(page.posts.length, 1);
});

for (const failure of ["expire", "error"]) {
  test(`registration recovers from ${failure} and isolates an explicit retry`, () => {
    const page = registration();
    page.submit();
    const oldFrame = page.frames[0];
    const oldTimer = [...page.timers.values()][0];
    page[failure]();
    assert.equal(page.form.hidden, false);
    assert.equal(page.result.hidden, true);
    assert.equal(page.button.disabled, false);
    assert.equal(page.field.readOnly, false);
    assert.equal(page.form.getAttribute("aria-busy"), "false");
    assert.equal(page.form.getAttribute("target"), null);
    assert.equal(page.status.hidden, false);
    assert.match(page.status.textContent, /Не удалось/);
    assert.doesNotMatch(page.status.textContent, /Google/);
    assert.equal(oldFrame.removed, true);
    assert.equal(page.timers.size, 0);

    assert.equal(page.submit(), false, "allow an explicit retry");
    assert.notEqual(page.frames[1].name, oldFrame.name);
    page.load(oldFrame);
    page.error(oldFrame);
    oldTimer();
    assert.equal(page.result.hidden, true, "ignore old responses and queued callbacks");
    assert.equal(page.button.disabled, true, "the retry is still pending");
    assert.equal(page.timers.size, 1);
    assert.match(page.status.textContent, /Отправляем/);
    page.load();
    assert.equal(page.result.hidden, false);
    assert.equal(page.timers.size, 0);
  });
}

test("the form's original target is restored after a failed attempt", () => {
  const page = registration("@example", { target: "_blank" });
  page.submit();
  page.error();
  assert.equal(page.form.target, "_blank");
});

test("incomplete markup leaves the browser's native fallback untouched", () => {
  for (const missing of ["form", "field", "button", "status", "result", "transport"]) {
    const page = registration("@example", { missing });
    assert.equal(page.form.noValidate, false, missing);
    assert.equal(page.form.events.submit, undefined, missing);
    assert.equal(page.form.target, "", missing);
  }
});
