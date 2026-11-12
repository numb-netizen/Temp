const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const app = fs.readFileSync(path.join(site, 'assets/app.js'), 'utf8');
const script = app.split('/* ---------- TEMPORARY SITE CREDIT ---------- */')[1];
const expiry = Date.parse(script.match(/creditExpiry = Date\.parse\("([^"]+)"\)/)[1]);

test('every page contains a single initially hidden credit for Mahadin and Morshed', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    assert.equal((html.match(/id="temporary-credit" hidden/g) || []).length, 1, name);
    assert.match(html, /Made by <strong>Mahadin &amp; Morshed<\/strong>/);
    assert.match(html, /src="assets\/app\.js"/);
  }
});

test('credit is visible before expiry and hides at the original deadline', () => {
  assert.equal(new Date(expiry).toISOString(), '2026-11-21T12:43:22.000Z');
  let now = expiry - 1000, callback, delay;
  const credit = {hidden: true};
  const events = {};
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext(script, {
    document: {querySelector: () => credit, addEventListener: (name, fn) => { events[name] = fn; }},
    window: {addEventListener: (name, fn) => { events[name] = fn; }},
    Date: Clock, clearTimeout: () => {}, setTimeout: (fn, ms) => { callback = fn; delay = ms; },
  });
  assert.equal(credit.hidden, false);
  assert.equal(delay, 1000);
  now = expiry;
  callback();
  assert.equal(credit.hidden, true);
  events.focus();
  assert.equal(credit.hidden, true);
});

test('credit remains hidden when first opened after expiry', () => {
  const credit = {hidden: true};
  class Clock extends Date { static now() { return expiry + 1000; } }
  vm.runInNewContext(script, {
    document: {querySelector: () => credit, addEventListener: () => {}},
    window: {addEventListener: () => {}},
    Date: Clock, clearTimeout: () => {}, setTimeout: () => { throw new Error('should not schedule after expiry'); },
  });
  assert.equal(credit.hidden, true);
});
