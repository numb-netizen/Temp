/* Hide the temporary footer credit at the original deadline. Kept separate
   from the main site script so cached files or unrelated errors cannot hide it. */
(() => {
  const credit = document.getElementById('temporary-credit');
  if (!credit) return;
  const expires = Date.parse('2026-11-21T12:43:22Z');
  let timer;
  function refresh() {
    clearTimeout(timer);
    const remaining = expires - Date.now();
    credit.hidden = remaining <= 0;
    if (remaining > 0) timer = setTimeout(refresh, Math.min(remaining, 2147483647));
  }
  refresh();
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', refresh);
})();
