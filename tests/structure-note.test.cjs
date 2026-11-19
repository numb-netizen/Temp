const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');

test('home page names the website structure right above the subject tree', () => {
  const section = read('index.html').match(/<section id="structure">([\s\S]*?)<\/section>/)[1];
  const note = section.indexOf('class="structure-note"'), tree = section.indexOf('<div class="tree reveal">');
  assert.ok(note > 0 && note < tree);
  assert.match(section, /ট্রি \(হায়ারার্কিক্যাল\) স্ট্রাকচারে/);
});

test('every page ends with a small ICT chapter-four inspiration line', () => {
  for (const name of fs.readdirSync(site).filter(n => n.endsWith('.html') && !n.startsWith('google'))) {
    const html = read(name);
    assert.match(html, /<p class="ict-inspiration">ICT চতুর্থ অধ্যায় থেকে অনুপ্রাণিত হয়ে বানানো<\/p>\n  <\/div>\n<\/footer>/, name);
  }
  assert.match(read('assets/style.css'), /\.ict-inspiration\{[^}]*font-size:10px/);
});
