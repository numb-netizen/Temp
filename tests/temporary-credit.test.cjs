const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const app = fs.readFileSync(path.join(site, 'assets/app.js'), 'utf8');
const script = app.split('/* ---------- TEMPORARY SITE CREDIT ---------- */')[1];
const expiry = Date.parse(script.match(/creditExpiry = Date\.parse\("([^"]+)"\)/)[1]);

test('each page contains a single initially hidden credit and shared script', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    assert.equal((html.match(/id="temporary-credit" hidden/g) || []).length, 1, name);
    assert.match(html, /Made by <strong>Mahadin &amp; Morshed<\/strong>/);
    assert.match(html, /src="assets\/app\.js"/);
  }
});

test('credit is visible before expiry and disappears on time without reloading', () => {
  let now = expiry - 1000, callback, timeoutDelay;
  const credit = {hidden: true};
  const events = {};
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext(script, {
    document: {querySelector: () => credit, addEventListener: (name, fn) => { events[name] = fn; }},
    window: {addEventListener: (name, fn) => { events[name] = fn; }},
    Date: Clock, clearTimeout: () => {}, setTimeout: (fn, delay) => { callback = fn; timeoutDelay = delay; },
  });
  assert.equal(credit.hidden, false);
  assert.equal(timeoutDelay, 1000);
  now = expiry;
  callback();
  assert.equal(credit.hidden, true);
  events.focus();
  assert.equal(credit.hidden, true);
});

test('credit stays hidden when a page is first opened after expiry', () => {
  const credit = {hidden: true};
  class Clock extends Date { static now() { return expiry + 1000; } }
  vm.runInNewContext(script, {
    document: {querySelector: () => credit, addEventListener: () => {}},
    window: {addEventListener: () => {}},
    Date: Clock, clearTimeout: () => {}, setTimeout: () => { throw new Error('should not schedule after expiry'); },
  });
  assert.equal(credit.hidden, true);
});
