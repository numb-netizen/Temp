const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const { exams, status, schedule } = require(path.join(site, 'assets/dabi.js'));
const source = fs.readFileSync(path.join(site, 'assets/dabi.js'), 'utf8');

test('exam status and next exam change at Bangladesh-time start/end boundaries', () => {
  assert.equal(exams.length, 7);
  const t = value => Date.parse(value);
  assert.equal(status(exams[4], t('2026-11-15T11:59:59+06:00')), 'upcoming');
  assert.equal(status(exams[4], t('2026-11-15T12:00:00+06:00')), 'ongoing');
  assert.equal(status(exams[4], t('2026-11-15T15:00:00+06:00')), 'finished');
  assert.equal(schedule(t('2026-11-13T18:00:00+06:00')).selected, 4);
  assert.equal(schedule(t('2026-11-15T13:00:00+06:00')).selected, 4);
  assert.equal(schedule(t('2026-11-15T15:00:00+06:00')).selected, 5);
  assert.equal(schedule(t('2026-11-17T15:00:00+06:00')).selected, -1);
});

test('remaining exams match the existing homepage routine', () => {
  const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  const rows = [...html.matchAll(/class="exam-row" data-start="([^"]+)" data-end="([^"]+)" data-date="[^"]+" data-subject="([^"]+)"/g)];
  assert.equal(rows.length, 5);
  for (let i = 0; i < rows.length; i++) {
    assert.equal(rows[i][1], exams[i + 2].start);
    assert.equal(rows[i][2], exams[i + 2].end);
    assert.equal(rows[i][3], exams[i + 2].subject);
  }
});

test('all pages link to the request and disclose local-only storage', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    assert.match(html, /href="dabi\.html"/, name);
  }
  const page = fs.readFileSync(path.join(site, 'dabi.html'), 'utf8');
  assert.match(page, /শুধু এই ব্রাউজারে সেভ হয়/);
  assert.match(page, /এটি কলেজে পাঠানো হয় না/);
  assert.match(page, /সংরক্ষিত নাম বা রোল পাঠানো হবে না/);
});

function browser({failStorage = false} = {}) {
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.value = ''; this.textContent = ''; this.hidden = false; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute(name, value) { this[name] = value; }
  }
  const ids = ['dabi-timeline','dabi-timer','dabi-next-title','dabi-next-date','dabi-timer-label','dabi-days','dabi-hours','dabi-minutes','dabi-seconds','support-form','support-list','support-message','support-submit','support-name','support-roll','support-count','share-whatsapp'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  elements['support-form'].reset = () => { elements['support-name'].value = ''; elements['support-roll'].value = ''; };
  const storage = new Map();
  const localStorage = {
    getItem: key => { if (failStorage) throw Error('denied'); return storage.get(key) || null; },
    setItem: (key, value) => { if (failStorage) throw Error('denied'); storage.set(key, value); },
  };
  class Clock extends Date { static now() { return Date.parse('2026-11-13T18:00:00+06:00'); } }
  vm.runInNewContext(source, {
    document: {getElementById: id => elements[id], createElement: () => new Element()},
    window: {location: {origin:'https://example.test', pathname:'/dabi.html'}},
    Date: Clock, localStorage, setInterval: () => {},
  });
  return {elements, storage};
}

test('support is stored only locally, rendered as text, removable, and excluded from share', () => {
  const {elements, storage} = browser();
  assert.equal(elements['support-submit'].disabled, false);
  elements['support-name'].value = '<img src=x onerror=alert(1)>';
  elements['support-roll'].value = 'বিজ্ঞান';
  elements['support-form'].listeners.submit({preventDefault(){}});
  assert.equal(storage.size, 1);
  assert.equal(elements['support-list'].children.length, 1);
  const item = elements['support-list'].children[0];
  assert.equal(item.children[0].textContent, '<img src=x onerror=alert(1)> · বিজ্ঞান');
  assert.match(elements['support-message'].textContent, /কলেজে পাঠানো হয়নি/);
  assert.ok(!decodeURIComponent(elements['share-whatsapp'].href).includes('onerror'));
  item.children[1].listeners.click();
  assert.equal(elements['support-list'].children.length, 0);
});

test('local storage failure disables the form rather than claiming submission', () => {
  const {elements} = browser({failStorage:true});
  assert.equal(elements['support-submit'].disabled, true);
  assert.match(elements['support-message'].textContent, /পড়া যাচ্ছে না/);
});
