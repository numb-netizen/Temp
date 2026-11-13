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

test('request page links are present and public-name consent is explicit', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    assert.match(html, /href="dabi\.html"/, name);
  }
  const page = fs.readFileSync(path.join(site, 'dabi.html'), 'utf8');
  assert.match(page, /নাম সবার কাছে প্রকাশ্যে দেখা যাবে/);
  assert.match(page, /id="support-consent" type="checkbox" required/);
  assert.match(page, /কলেজে স্বয়ংক্রিয়ভাবে পাঠানো হয় না/);
  assert.match(page, /id="support-roll"[^>]*maxlength="20"/);
  assert.match(page, /Supabase-এ সংরক্ষিত থাকবে এবং সাইটের প্রশাসকেরা দেখতে পারবেন/);
  assert.match(page, /ঐচ্ছিক, প্রকাশ্যে দেখানো হবে না/);
  assert.match(page, /স্বয়ংক্রিয়ভাবে প্রকাশ করা হবে না/);
});

function backend() {
  const rows = [], calls = [];
  let failRead = false, failWrite = false;
  async function fetch(url, options) {
    calls.push({url, options});
    if (options.method === 'POST') {
      if (failWrite) return {ok:false};
      const body = JSON.parse(options.body);
      rows.unshift({id:String(rows.length + 1), name:body.name, roll_no:body.roll_no ?? null, created_at:'2026-11-13T00:00:00Z'});
      return {ok:true};
    }
    if (failRead) return {ok:false};
    const query = new URL(url).searchParams;
    const offset = Number(query.get('offset') || 0), limit = Number(query.get('limit') || 100);
    return {ok:true, json:async () => rows.slice(offset, offset + limit).map(({id, name, created_at}) => ({id, name, created_at})), headers:{get: () => `${offset}-${Math.max(offset, rows.length - 1)}/${rows.length}`}};
  }
  return {rows, calls, fetch, setFailRead: value => { failRead = value; }, setFailWrite: value => { failWrite = value; }};
}

function browser(db) {
  class Element {
    constructor() { this.children = []; this.listeners = {}; this.value = ''; this.textContent = ''; this.hidden = false; this.checked = false; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute(name, value) { this[name] = value; }
  }
  const ids = ['dabi-timeline','dabi-timer','dabi-next-title','dabi-next-date','dabi-timer-label','dabi-days','dabi-hours','dabi-minutes','dabi-seconds','support-form','support-list','support-message','support-submit','support-name','support-roll','support-consent','support-count','support-prev','support-next','support-page','share-whatsapp'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  elements['support-form'].reset = () => { elements['support-name'].value = ''; elements['support-roll'].value = ''; elements['support-consent'].checked = false; };
  let poll;
  class Clock extends Date { static now() { return Date.parse('2026-11-13T18:00:00+06:00'); } }
  vm.runInNewContext(source, {
    document: {getElementById: id => elements[id], createElement: () => new Element()},
    window: {location: {origin:'https://example.test', pathname:'/dabi.html'}},
    Date: Clock, fetch: db.fetch, setInterval: (fn, delay) => { if (delay === 30000) poll = fn; },
  });
  return {elements, poll: () => poll()};
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('names saved by one visitor become visible to another, safely as text', async () => {
  const db = backend(), first = browser(db), second = browser(db);
  await flush();
  first.elements['support-name'].value = '<img src=x onerror=alert(1)>';
  await first.elements['support-form'].listeners.submit({preventDefault(){}});
  assert.equal(db.rows.length, 0, 'no publication without consent');
  first.elements['support-consent'].checked = true;
  await first.elements['support-form'].listeners.submit({preventDefault(){}});
  assert.equal(db.rows.length, 1);
  assert.match(first.elements['support-message'].textContent, /সবার জন্য সংরক্ষিত/);
  second.poll(); await flush();
  assert.equal(second.elements['support-list'].children[0].children[0].textContent, '<img src=x onerror=alert(1)>');
  assert.match(second.elements['support-count'].textContent, /১/);
  assert.ok(!decodeURIComponent(first.elements['share-whatsapp'].href).includes('onerror'));
  const post = db.calls.find(call => call.options.method === 'POST');
  assert.deepEqual(Object.keys(JSON.parse(post.options.body)), ['name']);
  assert.ok(post.options.headers.apikey.startsWith('sb_publishable_'));
  assert.ok(!('Authorization' in post.options.headers));
  assert.ok(!source.includes('localStorage'), 'old local drafts are not auto-uploaded');
});

test('network failures do not claim that a name was saved', async () => {
  const db = backend(); db.setFailRead(true); db.setFailWrite(true);
  const page = browser(db); await flush();
  assert.match(page.elements['support-message'].textContent, /লোড করা যায়নি/);
  page.elements['support-name'].value = 'নাম'; page.elements['support-consent'].checked = true;
  await page.elements['support-form'].listeners.submit({preventDefault(){}});
  assert.match(page.elements['support-message'].textContent, /নিশ্চিত করা যায়নি/);
  assert.equal(page.elements['support-submit'].disabled, false);
  assert.equal(db.rows.length, 0);
});


test('older public names remain accessible on later pages', async () => {
  const db = backend();
  for (let i = 0; i < 60; i++) db.rows.push({id:String(i), name:'Name ' + i, created_at:'2026-11-13T00:00:00Z'});
  const page = browser(db); await flush();
  assert.equal(page.elements['support-list'].children.length, 50);
  assert.equal(page.elements['support-next'].disabled, false);
  page.elements['support-next'].listeners.click(); await flush();
  assert.equal(page.elements['support-list'].children.length, 10);
  assert.equal(page.elements['support-list'].children[0].children[0].textContent, 'Name 50');
  assert.equal(page.elements['support-prev'].disabled, false);
  page.elements['support-prev'].listeners.click(); await flush();
  assert.equal(page.elements['support-list'].children.length, 50);
});


test('optional roll is submitted privately, never requested or rendered in public listings', async () => {
  const db = backend(), first = browser(db), second = browser(db);
  await flush();
  first.elements['support-name'].value = 'শিক্ষার্থী';
  first.elements['support-roll'].value = '০০১২৩';
  first.elements['support-consent'].checked = true;
  await first.elements['support-form'].listeners.submit({preventDefault(){}});
  assert.equal(db.rows[0].roll_no, '০০১২৩', 'leading zeros are preserved');
  assert.deepEqual(JSON.parse(db.calls.find(c => c.options.method === 'POST').options.body), {name:'শিক্ষার্থী', roll_no:'০০১২৩'});
  assert.equal(first.elements['support-roll'].value, '', 'roll cleared after success');
  second.poll(); await flush();
  const rendered = second.elements['support-list'].children;
  assert.equal(rendered[0].children.length, 1);
  assert.equal(rendered[0].children[0].textContent, 'শিক্ষার্থী');
  for (const call of db.calls.filter(c => c.options.method !== 'POST')) {
    const select = new URL(call.url).searchParams.get('select');
    assert.equal(select, 'id,name,created_at');
    assert.ok(!call.url.includes('০০১২৩'));
  }
  assert.ok(!decodeURIComponent(first.elements['share-whatsapp'].href).includes('০০১২৩'));
});

test('invalid roll is rejected and a roll is optional', async () => {
  const db = backend(), page = browser(db); await flush();
  page.elements['support-name'].value = 'শিক্ষার্থী';
  page.elements['support-consent'].checked = true;
  for (const roll of ['abc', '123 4', '1'.repeat(21)]) {
    page.elements['support-roll'].value = roll;
    await page.elements['support-form'].listeners.submit({preventDefault(){}});
    assert.equal(db.rows.length, 0);
    assert.match(page.elements['support-message'].textContent, /রোল নম্বরে/);
  }
  page.elements['support-roll'].value = '';
  await page.elements['support-form'].listeners.submit({preventDefault(){}});
  assert.equal(db.rows.length, 1);
  assert.deepEqual(JSON.parse(db.calls.find(c => c.options.method === 'POST').options.body), {name:'শিক্ষার্থী'});
});
