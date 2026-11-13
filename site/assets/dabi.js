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

  // This publishable key is intended for browsers. RLS limits it to reading
  // public names and inserting name/roll; roll is not readable by public clients.
  const endpoint = 'https://cciwbmtmlrlgpgewiaqk.supabase.co/rest/v1/dabi_public_supporters';
  const publicKey = 'sb_publishable_V_X7jg6ww2obzNVFjhbbOA_Ixqes756';
  const form = get('support-form'), list = get('support-list');
  const message = get('support-message'), button = get('support-submit');
  let loadingVersion = 0, submitting = false, page = 0;
  const pageSize = 50, previous = get('support-prev'), next = get('support-next');

  async function refreshSupport(announceFailure = true) {
    const version = ++loadingVersion;
    try {
      const response = await fetch(endpoint + '?select=id,name,created_at&order=created_at.desc,id.desc&limit=' + (pageSize + 1) + '&offset=' + (page * pageSize), {
        headers: {apikey: publicKey, Prefer: 'count=exact'}, cache: 'no-store',
      });
      if (!response.ok) throw new Error('Could not load names');
      const entries = await response.json();
      if (!Array.isArray(entries)) throw new Error('Invalid response');
      if (version !== loadingVersion) return true;
      if (!entries.length && page > 0) { page--; return refreshSupport(announceFailure); }
      list.replaceChildren();
      entries.slice(0, pageSize).forEach(entry => {
        if (!entry || typeof entry.name !== 'string') return;
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = entry.name;
        li.append(name); list.append(li);
      });
      const range = response.headers.get('content-range');
      const count = range && range.match(/\/(\d+)$/);
      get('support-count').textContent = count ? 'মোট জমা: ' + format(Number(count[1])) : '';
      previous.disabled = page === 0;
      next.disabled = entries.length <= pageSize;
      get('support-page').textContent = 'পৃষ্ঠা ' + format(page + 1);
      if (!entries.length) {
        const empty = document.createElement('li');
        empty.textContent = 'এখনো কোনো নাম জমা পড়েনি।'; list.append(empty);
      }
      return true;
    } catch (_) {
      if (version === loadingVersion && announceFailure) message.textContent = 'নামের তালিকা লোড করা যায়নি। ইন্টারনেট সংযোগ যাচাই করে পেজ রিফ্রেশ করো।';
      return false;
    }
  }
  previous.addEventListener('click', () => { if (page > 0) { page--; refreshSupport(); } });
  next.addEventListener('click', () => { if (!next.disabled) { page++; refreshSupport(); } });
  button.disabled = false;
  refreshSupport();
  setInterval(() => refreshSupport(false), 30000);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    const name = get('support-name').value.trim();
    const roll = get('support-roll').value.trim();
    if (!name || name.length > 80 || /[\x00-\x1f\x7f]/.test(name)) {
      message.textContent = '১ থেকে ৮০ অক্ষরের একটি নাম লেখো।'; return;
    }
    if (roll && !/^[0-9০-৯]{1,20}$/.test(roll)) {
      message.textContent = 'রোল নম্বরে শুধু বাংলা বা ইংরেজি সংখ্যা লেখো (সর্বোচ্চ ২০টি)।'; return;
    }
    if (!get('support-consent').checked) {
      message.textContent = 'নাম প্রকাশের সম্মতি দিতে হবে।'; return;
    }
    submitting = true; button.disabled = true; message.textContent = 'নাম সংরক্ষণ হচ্ছে…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {apikey: publicKey, 'Content-Type': 'application/json', Prefer: 'return=minimal'},
        body: JSON.stringify(roll ? {name, roll_no: roll} : {name}),
      });
      if (!response.ok) throw new Error('Could not save name');
      form.reset();
      page = 0;
      const refreshed = await refreshSupport(false);
      message.textContent = refreshed ? 'তোমার নাম সবার জন্য সংরক্ষিত হয়েছে।' : 'নাম সংরক্ষিত হয়েছে, কিন্তু তালিকা লোড করা যায়নি। পেজ রিফ্রেশ করো।';
    } catch (_) {
      message.textContent = 'নাম সংরক্ষণ নিশ্চিত করা যায়নি। আবার চেষ্টা করার আগে তালিকা রিফ্রেশ করে দেখো।';
    } finally { submitting = false; button.disabled = false; }
  });
  const pageUrl = window.location.origin + window.location.pathname;
  get('share-whatsapp').href = 'https://wa.me/?text=' + encodeURIComponent('চুনারুঘাট সরকারি কলেজের শিক্ষার্থীদের আবেদন: ' + pageUrl);
})();
