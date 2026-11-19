/* Hide temporary footer notes at their deadlines. Kept separate from the main
   site script so cached files or unrelated errors cannot hide them early. */
(() => {
  const notes = [
    // "Made by" credit: the original 21 November deadline, extended by 10 days.
    ['temporary-credit', '2026-12-01T12:43:22Z'],
    // "ICT চতুর্থ অধ্যায় থেকে অনুপ্রাণিত" line: shown for one month from 19 November.
    ['ict-inspiration', '2026-12-19T12:43:22Z'],
  ];
  for (const [id, deadline] of notes) {
    const note = document.getElementById(id);
    if (!note) continue;
    const expires = Date.parse(deadline);
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      const remaining = expires - Date.now();
      note.hidden = remaining <= 0;
      if (remaining > 0) timer = setTimeout(refresh, Math.min(remaining, 2147483647));
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
  }
})();
