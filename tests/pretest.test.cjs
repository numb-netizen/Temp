const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'site/assets/app.js'), 'utf8').split('/* ---------- PRE-TEST EXAMS')[1];

function setup(initialTime) {
  const rows = [...html.matchAll(/<div class="exam-row" ([^>]+)>/g)].map(([, attributes]) => {
    const dataset = {};
    for (const [, key, value] of attributes.matchAll(/data-(start|end|date|subject)="([^"]+)"/g)) dataset[key] = value;
    return {dataset, hidden: true};
  });
  const ids = ['exam-timer', 'exam-empty', 'exam-next-title', 'exam-next-date', 'exam-countdown-label', 'exam-days', 'exam-hours', 'exam-minutes', 'exam-seconds'];
  const elements = Object.fromEntries(ids.map(id => ['#' + id, {hidden: false, textContent: ''}]));
  elements['#pretest-routine'] = {querySelectorAll: () => rows};
  let now = Date.parse(initialTime), tick;
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext('/* ---------- PRE-TEST EXAMS' + script, {
    document: {querySelector: selector => elements[selector]},
    Date: Clock, bn: String, setInterval: fn => { tick = fn; },
  });
  return {rows, elements, setTime: time => { now = Date.parse(time); tick(); }};
}

test('notice has five remaining exams and omits the first two', () => {
  const page = setup('2026-11-10T23:59:00+06:00');
  assert.equal(page.rows.length, 5);
  assert.equal(page.rows[0].dataset.subject, 'তথ্য ও যোগাযোগ প্রযুক্তি');
  assert.equal(page.rows.filter(row => !row.hidden).length, 5);
  assert.equal(page.elements['#exam-countdown-label'].textContent, 'পরীক্ষা শুরু হতে বাকি');
});

test('exam remains visible while running and disappears at 3pm Bangladesh time', () => {
  const page = setup('2026-11-11T11:59:59+06:00');
  page.setTime('2026-11-11T12:00:00+06:00');
  assert.equal(page.elements['#exam-countdown-label'].textContent, 'পরীক্ষা চলছে · শেষ হতে বাকি');
  assert.equal(page.elements['#exam-hours'].textContent, '3');
  page.setTime('2026-11-11T14:59:59+06:00');
  assert.equal(page.rows[0].hidden, false);
  page.setTime('2026-11-11T15:00:00+06:00');
  assert.equal(page.rows[0].hidden, true);
  assert.equal(page.elements['#exam-next-title'].textContent, page.rows[1].dataset.subject);
  assert.equal(page.elements['#exam-countdown-label'].textContent, 'পরীক্ষা শুরু হতে বাকি');
});

test('last exam completion shows the empty state', () => {
  const page = setup('2026-11-17T14:59:59+06:00');
  assert.equal(page.rows.filter(row => !row.hidden).length, 1);
  page.setTime('2026-11-17T15:00:00+06:00');
  assert.ok(page.rows.every(row => row.hidden));
  assert.equal(page.elements['#exam-empty'].hidden, false);
  assert.equal(page.elements['#exam-timer'].hidden, true);
  assert.equal(page.elements['#exam-next-title'].textContent, 'সব পরীক্ষা শেষ');
});
