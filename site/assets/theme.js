/* Apply the saved choice before the page paints; dark remains the default. */
(function () {
  var root = document.documentElement;
  var key = 'site:theme';
  var theme = 'dark';
  try { if (localStorage.getItem(key) === 'light') theme = 'light'; } catch (e) { /* Storage is optional. */ }
  function apply(value) {
    theme = value === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f9f6' : '#07130d');
    var button = document.querySelector('.theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      button.setAttribute('title', theme === 'light' ? 'ডার্ক মোড চালু করো' : 'লাইট মোড চালু করো');
      button.querySelector('span').textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }
  apply(theme);
  function init() {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.hidden = false;
    apply(theme);
    button.addEventListener('click', function () {
      apply(theme === 'light' ? 'dark' : 'light');
      try { localStorage.setItem(key, theme); } catch (e) { /* Keep the choice for this page. */ }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) apply(event.key === null ? 'dark' : event.newValue);
  });
}());
