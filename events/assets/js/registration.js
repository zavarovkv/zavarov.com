// Keep native POSTs and the no-JS confirmation page. A cross-origin iframe load
// acknowledges a response, but cannot prove that Google Forms saved the answer.
(function () {
  const form = document.querySelector("[data-webinar-registration]");
  if (!form) return;

  const transport = document.getElementById(form.dataset.responseId);
  const result = document.getElementById(form.dataset.resultId);
  const field = form.querySelector('input[type="text"]');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector("[data-registration-status]");
  if (!transport || !result || !field || !button || !status) return;

  const label = button.textContent;
  const originalTarget = form.getAttribute("target");
  let activeAttempt = null;
  let attemptNumber = 0;
  let completed = false;

  function normalizeTelegram(value) {
    let username = value.trim();
    const linkPrefix = /^(?:https?:\/\/)?(?:www\.)?t\.me\//i;
    if (linkPrefix.test(username)) {
      username = username.replace(linkPrefix, "").replace(/\/$/, "");
    } else {
      username = username.replace(/^@/, "");
    }

    // Collectible usernames can be shorter than five characters. This checks
    // syntax only; it neither looks up an account nor checks its ownership.
    return /^[a-z](?:[a-z0-9_]{0,30}[a-z0-9])?$/i.test(username)
      ? `@${username}`
      : "";
  }

  function showStatus(message = "") {
    status.textContent = message;
    status.hidden = !message;
  }

  function setPending(value) {
    button.disabled = value;
    button.textContent = value ? "Отправляем…" : label;
    // Disabled fields are omitted from native POSTs; readonly fields are sent.
    field.readOnly = value;
    form.setAttribute("aria-busy", String(value));
  }

  function finish(attempt, message = "") {
    if (activeAttempt !== attempt) return;
    activeAttempt = null;
    window.clearTimeout(attempt.timer);
    attempt.frame.remove();
    if (originalTarget === null) {
      form.removeAttribute("target");
    } else {
      form.setAttribute("target", originalTarget);
    }
    setPending(false);
    showStatus(message);
    if (message) return;

    completed = true;
    form.hidden = true;
    result.hidden = false;
    result.focus();
  }

  field.addEventListener("input", () => {
    field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    if (!activeAttempt) showStatus();
  });

  // Validate explicitly after normalizing pasted links. This does not affect
  // the native required-field check when JavaScript is unavailable.
  form.noValidate = true;
  form.addEventListener("submit", (event) => {
    if (activeAttempt || completed) {
      event.preventDefault();
      return;
    }

    const username = normalizeTelegram(field.value);
    const validationMessage = username
      ? ""
      : "Укажите Telegram в формате @username или t.me/username.";
    field.setCustomValidity(validationMessage);
    if (validationMessage) {
      event.preventDefault();
      field.setAttribute("aria-invalid", "true");
      showStatus(validationMessage);
      form.reportValidity();
      return;
    }

    field.value = username;
    field.removeAttribute("aria-invalid");
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    // A fresh target isolates every retry from late responses to older POSTs.
    const frame = transport.cloneNode(false);
    frame.removeAttribute("id");
    frame.name = `${transport.name}-${++attemptNumber}`;
    const attempt = { frame, timer: null };
    activeAttempt = attempt;
    frame.addEventListener("load", () => {
      if (activeAttempt !== attempt) return;
      try {
        // The new iframe's initial blank document is not a server response.
        if (frame.contentWindow.location.href === "about:blank") return;
      } catch {
        // The cross-origin response cannot be inspected for acceptance.
      }
      finish(attempt);
    });
    frame.addEventListener("error", () => {
      finish(attempt, "Не удалось получить ответ. Проверьте соединение и попробуйте еще раз.");
    });
    transport.insertAdjacentElement("afterend", frame);
    form.target = frame.name;
    setPending(true);
    showStatus("Отправляем заявку…");
    attempt.timer = window.setTimeout(() => {
      finish(attempt, "Не удалось дождаться ответа. Проверьте соединение и попробуйте еще раз.");
    }, 30000);
  });
})();
