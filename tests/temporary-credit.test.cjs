const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const script = fs.readFileSync(path.join(site, 'assets/credit.js'), 'utf8');
const deadline = id => Date.parse(script.match(new RegExp(`\\['${id}', '([^']+)'\\]`))[1]);
const credit = deadline('temporary-credit');
const ict = deadline('ict-inspiration');

// Runs credit.js with a fake clock; returns the two notes and the scheduled timers.
function run(now) {
  const notes = {'temporary-credit': {hidden: false}, 'ict-inspiration': {hidden: false}};
  const timers = [], events = {};
  class Clock extends Date { static now() { return now.value; } }
  vm.runInNewContext(script, {
    document: {getElementById: id => notes[id], addEventListener: (name, fn) => { (events[name] ||= []).push(fn); }},
    window: {addEventListener: (name, fn) => { (events[name] ||= []).push(fn); }},
    Date: Clock, clearTimeout: () => {}, setTimeout: (fn, ms) => { timers.push([fn, ms]); },
  });
  return {notes, timers, events};
}

test('every page shows both footer notes by default and loads the independent credit script', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html') && name !== 'googleb7da7b15e33059e0.html')) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    assert.equal((html.match(/id="temporary-credit"/g) || []).length, 1, name);
    assert.match(html, /<p class="temporary-credit" id="temporary-credit">Made by <strong>Mahadin &amp; Morshed<\/strong><\/p>/);
    assert.match(html, /<p class="ict-inspiration" id="ict-inspiration">ICT চতুর্থ অধ্যায় থেকে অনুপ্রাণিত হয়ে বানানো<\/p>/, name);
    assert.match(html, /src="assets\/credit\.js\?v=20261119"/);
  }
});

test('Made by is extended by ten days and the ICT line lasts one month', () => {
  assert.equal(new Date(credit).toISOString(), '2026-12-01T12:43:22.000Z');
  assert.equal(credit - Date.parse('2026-11-21T12:43:22Z'), 10 * 24 * 3600 * 1000);
  assert.equal(new Date(ict).toISOString(), '2026-12-19T12:43:22.000Z');
});

test('each note is visible before its deadline and hides exactly at it', () => {
  const now = {value: credit - 1000};
  const {notes, timers, events} = run(now);
  assert.equal(notes['temporary-credit'].hidden, false);
  assert.equal(notes['ict-inspiration'].hidden, false);
  now.value = credit;
  timers[0][0]();
  assert.equal(notes['temporary-credit'].hidden, true);
  assert.equal(notes['ict-inspiration'].hidden, false, 'ICT line outlives the credit');
  now.value = ict;
  for (const fn of events.focus) fn();
  assert.equal(notes['ict-inspiration'].hidden, true);
  assert.equal(notes['temporary-credit'].hidden, true);
});

test('notes are hidden when first opened after their deadlines', () => {
  const {notes, timers} = run({value: ict + 1000});
  assert.equal(notes['temporary-credit'].hidden, true);
  assert.equal(notes['ict-inspiration'].hidden, true);
  assert.equal(timers.length, 0, 'nothing scheduled after expiry');
});
