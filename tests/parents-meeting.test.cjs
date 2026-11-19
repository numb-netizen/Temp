const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(site, 'assets/app.js'), 'utf8');
const script = app.slice(app.indexOf("/* ---------- PARENTS' MEETING"));

// Runs the meeting block against rows parsed from the real markup, with a fake clock.
function setup(time) {
  const rows = [...html.matchAll(/<div class="meet-row" data-start="([^"]+)" data-end="([^"]+)">/g)].map(([, start, end]) => {
    const status = {textContent: ''};
    return {dataset: {start, end}, status, querySelector: sel => sel === '.meet-status' ? status : null};
  });
  const done = {hidden: true};
  let now = Date.parse(time), tick;
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext(script, {
    document: {querySelector: sel => sel === '#parents-meeting' ? {querySelectorAll: () => rows} : sel === '#meet-done' ? done : null},
    Date: Clock, bn: String, setInterval: fn => { tick = fn; },
  });
  return {rows, done, at: t => { now = Date.parse(t); tick(); }};
}

test('the finished pre-test routine is gone and the parents meeting notice takes its place', () => {
  assert.doesNotMatch(html, /pretest|প্রাক-নির্বাচনী|exam-row|exam-syllabus|exam-rules/);
  assert.doesNotMatch(app, /PRE-TEST|updatePretest/);
  assert.ok(!fs.existsSync(path.join(site, 'assets/pretest-notice-2026.jpg')));
  const structure = html.indexOf('<!-- TREE STRUCTURE -->'), notice = html.indexOf('id="parents-meeting"');
  assert.ok(notice > html.indexOf('href="honours-info.html"') && notice < structure, 'same place as the old routine');
  for (const text of ['বিজ্ঞপ্তি · নং ২০২৬/৬৫ · ১৭ নভেম্বর ২০২৬', 'অভিভাবক সমাবেশ-২০২৬', 'বিজ্ঞান ও ব্যবসায় শিক্ষা', 'মানবিক',
    '<b>২৯</b><span>নভেম্বর</span><small>রবিবার</small>', '<b>৩০</b><span>নভেম্বর</span><small>সোমবার</small>', 'প্রফেসর মোঃ আব্দুল মান্নান চৌধুরী'])
    assert.ok(html.includes(text), text);
  assert.equal((html.match(/📍 ০২ নং হলরুম/g) || []).length, 2);
  assert.equal((html.match(/🕚 সকাল ১১\.০০ ঘটিকায়/g) || []).length, 2);
});

test('the original notice image is shown with a source label and is available offline', () => {
  // A light 800px WebP for the page; the full JPG stays for wide screens and opens when tapped.
  assert.match(html, /<a href="assets\/parents-meeting-notice-2026\.jpg" target="_blank" rel="noopener"><img src="assets\/parents-meeting-notice-2026-800\.webp" srcset="assets\/parents-meeting-notice-2026-800\.webp 800w, assets\/parents-meeting-notice-2026\.jpg 1376w" sizes="[^"]+" width="1376" height="768" loading="lazy" decoding="async" alt="[^"]*অভিভাবক সমাবেশ-২০২৬[^"]*">/);
  assert.ok(fs.statSync(path.join(site, 'assets/parents-meeting-notice-2026-800.webp')).size < 100 * 1024);
  assert.match(html, /<figcaption>📖 এখান থেকে নেওয়া — কলেজের মূল বিজ্ঞপ্তি/);
  const file = path.join(site, 'assets/parents-meeting-notice-2026.jpg');
  assert.ok(fs.statSync(file).size < 400 * 1024, 'compressed for phones');
  const manifest = JSON.parse(fs.readFileSync(path.join(site, 'offline-manifest.json'), 'utf8'));
  assert.ok(manifest.files.some(x => x.path === 'assets/parents-meeting-notice-2026.jpg'));
  assert.ok(!manifest.files.some(x => x.path === 'assets/pretest-notice-2026.jpg'));
});

test('dates match the notice: Sunday 29 and Monday 30 November 2026 at 11am Bangladesh time', () => {
  const [science, arts] = setup('2026-11-20T10:00:00+06:00').rows;
  assert.equal(new Date(science.dataset.start).toISOString(), '2026-11-29T05:00:00.000Z');
  assert.equal(new Date(science.dataset.start).getUTCDay(), 0);
  assert.equal(new Date(arts.dataset.start).toISOString(), '2026-11-30T05:00:00.000Z');
  assert.equal(new Date(arts.dataset.start).getUTCDay(), 1);
});

test('each day counts down, shows today, then is marked done; the closing line appears after both', () => {
  const page = setup('2026-11-20T10:00:00+06:00');
  const [science, arts] = page.rows;
  assert.equal(science.status.textContent, 'আর 9 দিন বাকি');
  assert.equal(arts.status.textContent, 'আর 10 দিন বাকি');
  page.at('2026-11-28T23:30:00+06:00');
  assert.equal(science.status.textContent, 'আগামীকাল');
  page.at('2026-11-29T00:10:00+06:00');
  assert.equal(science.status.textContent, 'আজ সকাল ১১টায়');
  assert.equal(science.dataset.state, 'today');
  page.at('2026-11-29T11:00:00+06:00');
  assert.equal(science.status.textContent, 'আজ সকাল ১১টায় শুরু হয়েছে');
  assert.equal(arts.status.textContent, 'আগামীকাল');
  page.at('2026-11-30T00:00:00+06:00');
  assert.equal(science.status.textContent, '✓ সম্পন্ন হয়েছে');
  assert.equal(science.dataset.state, 'done');
  assert.equal(page.done.hidden, true);
  page.at('2026-12-01T00:00:00+06:00');
  assert.equal(arts.dataset.state, 'done');
  assert.equal(page.done.hidden, false);
});
