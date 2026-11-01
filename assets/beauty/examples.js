// Only native form demonstrations need page-specific behavior.
document.querySelectorAll('.beauty-catalog [data-example-form]').forEach(function (form) {
  var status = form.querySelector('[role="status"]');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.hidden = false;
    status.textContent = document.documentElement.lang === 'ru'
      ? 'Все верно. Данные никуда не отправлены.'
      : 'Looks good. Nothing was sent.';
  });
  form.addEventListener('reset', function () { status.hidden = true; });
});
