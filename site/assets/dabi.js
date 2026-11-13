/* Student request and pre-test schedule, in Bangladesh time. */
(() => {
  const exams = [
    {day:'৯ নভেম্বর · সোমবার', subject:'বাংলা', start:'2026-11-09T12:00:00+06:00', end:'2026-11-09T15:00:00+06:00'},
    {day:'১০ নভেম্বর · মঙ্গলবার', subject:'ইংরেজি', start:'2026-11-10T12:00:00+06:00', end:'2026-11-10T15:00:00+06:00'},
    {day:'১১ নভেম্বর · বুধবার', subject:'তথ্য ও যোগাযোগ প্রযুক্তি', start:'2026-11-11T12:00:00+06:00', end:'2026-11-11T15:00:00+06:00'},
    {day:'১২ নভেম্বর · বৃহস্পতিবার', subject:'পদার্থবিজ্ঞান / অর্থনীতি / হিসাববিজ্ঞান', start:'2026-11-12T12:00:00+06:00', end:'2026-11-12T15:00:00+06:00'},
    {day:'১৫ নভেম্বর · রবিবার', subject:'উচ্চতর গণিত / পৌরনীতি ও সুশাসন / ব্যবসায় সংগঠন ও ব্যবস্থাপনা', start:'2026-11-15T12:00:00+06:00', end:'2026-11-15T15:00:00+06:00'},
    {day:'১৬ নভেম্বর · সোমবার', subject:'রসায়ন / ইতিহাস / ফিন্যান্স ব্যাংকিং ও বিমা', start:'2026-11-16T12:00:00+06:00', end:'2026-11-16T15:00:00+06:00'},
    {day:'১৭ নভেম্বর · মঙ্গলবার', subject:'জীববিজ্ঞান / সমাজবিজ্ঞান / উৎপাদন ব্যবস্থাপনা ও বিপণন', start:'2026-11-17T12:00:00+06:00', end:'2026-11-17T15:00:00+06:00'},
  ];
  function status(exam, now) {
    if (now < Date.parse(exam.start)) return 'upcoming';
    if (now < Date.parse(exam.end)) return 'ongoing';
    return 'finished';
  }
  function schedule(now) {
    const states = exams.map(exam => status(exam, now));
    let selected = states.indexOf('ongoing');
    if (selected === -1) selected = states.indexOf('upcoming');
    return {states, selected};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {exams, status, schedule};
  if (typeof document === 'undefined') return;

  const get = id => document.getElementById(id);
  const format = number => Number(number).toLocaleString('bn-BD');
  const timeline = get('dabi-timeline');
  const timer = get('dabi-timer');
  let previousStates = '';
  function updateSchedule() {
    const now = Date.now();
    const {states, selected} = schedule(now);
    const signature = states.join(',') + ':' + selected;
    if (signature !== previousStates) {
      previousStates = signature;
      timeline.replaceChildren();
      exams.forEach((exam, index) => {
        const row = document.createElement('div');
        row.className = 'dabi-row' + (index === selected ? ' is-next' : '');
        const date = document.createElement('div'); date.className = 'dabi-date'; date.textContent = exam.day;
        const subject = document.createElement('div'); subject.className = 'dabi-subject'; subject.textContent = exam.subject;
        const badge = document.createElement('span');
        badge.className = 'dabi-status' + (states[index] === 'ongoing' ? ' is-current' : index === selected ? ' is-next' : '');
        badge.textContent = states[index] === 'finished' ? 'শেষ হয়েছে' : states[index] === 'ongoing' ? 'পরীক্ষা চলছে' : index === selected ? 'পরবর্তী পরীক্ষা' : 'বাকি আছে';
        row.append(date, subject, badge); timeline.append(row);
      });
    }
    if (selected === -1) {
      get('dabi-next-title').textContent = 'এই রুটিনের সব পরীক্ষা শেষ';
      get('dabi-next-date').textContent = 'সর্বশেষ তথ্যের জন্য কলেজের নোটিশ দেখো।';
      get('dabi-timer-label').textContent = '';
      timer.hidden = true;
      return;
    }
    const exam = exams[selected], ongoing = states[selected] === 'ongoing';
    get('dabi-next-title').textContent = exam.subject;
    get('dabi-next-date').textContent = exam.day + ' · দুপুর ১২টা–বিকেল ৩টা';
    get('dabi-timer-label').textContent = ongoing ? 'পরীক্ষা চলছে · শেষ হতে বাকি' : 'পরীক্ষা শুরু হতে বাকি';
    timer.hidden = false;
    const diff = Math.max(0, Date.parse(ongoing ? exam.end : exam.start) - now);
    get('dabi-days').textContent = format(Math.floor(diff / 86400000));
    get('dabi-hours').textContent = format(Math.floor(diff / 3600000) % 24);
    get('dabi-minutes').textContent = format(Math.floor(diff / 60000) % 60);
    get('dabi-seconds').textContent = format(Math.floor(diff / 1000) % 60);
  }
  updateSchedule();
  setInterval(updateSchedule, 1000);

  // Local-only drafts; this is not a shared petition or an official submission.
  const key = 'dabi:local-support:v1', form = get('support-form'), list = get('support-list');
  const message = get('support-message'), button = get('support-submit');
  let entries = [];
  let storageAvailable = true;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(stored)) entries = stored.filter(item => item && typeof item.name === 'string' && typeof item.roll === 'string').slice(0, 200);
  } catch (_) {
    storageAvailable = false;
    message.textContent = 'এই ব্রাউজারে স্থানীয় তথ্য পড়া যাচ্ছে না। ব্রাউজার সেটিংস যাচাই করো।';
  }
  button.disabled = !storageAvailable;
  function renderSupport() {
    list.replaceChildren();
    get('support-count').textContent = format(entries.length);
    entries.forEach((entry, index) => {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = entry.name + (entry.roll ? ' · ' + entry.roll : '');
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = 'সরাও';
      remove.setAttribute('aria-label', entry.name + ' নামটি সরাও');
      remove.addEventListener('click', () => {
        const next = entries.filter((_, i) => i !== index);
        try { localStorage.setItem(key, JSON.stringify(next)); entries = next; renderSupport(); message.textContent = 'নামটি এই ব্রাউজার থেকে সরানো হয়েছে।'; }
        catch (_) { message.textContent = 'তথ্য সরানো যায়নি। ব্রাউজারের স্টোরেজ যাচাই করো।'; }
      });
      li.append(text, remove); list.append(li);
    });
  }
  renderSupport();
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!storageAvailable) return;
    const name = get('support-name').value.trim(), roll = get('support-roll').value.trim();
    if (!name) { message.textContent = 'নাম লিখে আবার চেষ্টা করো।'; return; }
    if (entries.length >= 200) { message.textContent = 'এই ব্রাউজারে সর্বোচ্চ ২০০টি নাম রাখা যাবে।'; return; }
    const next = [{name: name.slice(0,80), roll: roll.slice(0,80)}, ...entries];
    try {
      localStorage.setItem(key, JSON.stringify(next)); entries = next; renderSupport(); form.reset();
      message.textContent = 'শুধু এই ব্রাউজারে সংরক্ষিত হয়েছে; কলেজে পাঠানো হয়নি।';
    } catch (_) { message.textContent = 'সংরক্ষণ করা যায়নি। ব্রাউজারের স্টোরেজ যাচাই করো।'; }
  });
  const pageUrl = window.location.origin + window.location.pathname;
  get('share-whatsapp').href = 'https://wa.me/?text=' + encodeURIComponent('চুনারুঘাট সরকারি কলেজের শিক্ষার্থীদের আবেদন: ' + pageUrl);
})();
