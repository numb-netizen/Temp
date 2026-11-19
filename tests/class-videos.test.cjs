const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const css = read('assets/style.css');

test('civics 1st paper chapter 1 has a "ক্লাস দেখো" tag that opens the Unique e School video', () => {
  const html = read('civics.html');
  const row = /<div class="chap-row">(<div class="chap" data-subject="civics" data-chapter="0">[\s\S]*?<\/div>)(<a class="class-tag"[^>]*>[^<]*<\/a>)<\/div>/.exec(html);
  assert.ok(row, 'chapter row with tag');
  assert.equal(row[1], '<div class="chap" data-subject="civics" data-chapter="0"><span class="box"></span><span class="nm">১ম পত্র: পৌরনীতি ও সুশাসন পরিচিতি</span></div>');
  const tag = row[2];
  assert.match(tag, /href="https:\/\/youtu\.be\/7PIx8szWEz4"/);
  assert.doesNotMatch(tag, /si=/, 'share-tracking parameter removed');
  assert.match(tag, /target="_blank" rel="noopener noreferrer"/);
  assert.match(tag, />▶ ক্লাস দেখো<\/a>$/);
  assert.match(tag, /aria-label="ক্লাস দেখো: পৌরনীতি ও সুশাসন ১ম পত্র, ১ম অধ্যায় — Unique e School, মিসকাত স্যার/);
  assert.match(tag, /title="Unique e School — মিসকাত স্যার · পৌরনীতি ও সুশাসন পরিচিতি \(সম্পূর্ণ অধ্যায়\)"/);
  assert.equal((html.match(/class="class-tag"/g) || []).length, 1, 'only the chapter that has a video gets a tag');
});

test('the tag sits beside the tick box, never inside it, so opening the video never ticks the chapter', () => {
  for (const file of fs.readdirSync(site).filter(n => n.endsWith('.html'))) {
    for (const [chap] of read(file).matchAll(/<div class="chap"[^>]*>[\s\S]*?<\/div>/g)) assert.doesNotMatch(chap, /<a\b/, file);
  }
  // Clicks are handled by closest(".chap"); the link is a sibling, so it is not matched.
  assert.match(read('assets/app.js'), /const el = e\.target\.closest\("\.chap"\) \|\| e\.target\.closest\("\.item"\);/);
  assert.match(css, /\.chap-row\{display:flex;align-items:center;gap:8px\}/);
  assert.match(css, /\.chap-row \.chap\{flex:1;min-width:0\}/);
  assert.match(css, /@media\(max-width:360px\)\{\.chap-row\{flex-wrap:wrap;gap:0\}/);
});

test('the tag is readable in dark, light and hover states', () => {
  const lum = hex => hex.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  assert.match(css, /\.class-tag\{[^}]*color:#ff8f9a/);
  assert.ok(ratio('#ff8f9a', '#1a1f1c') >= 4.5, 'dark mode');
  assert.match(css, /\.class-tag:hover,\.class-tag:focus-visible\{background:#c8102e;border-color:#c8102e;color:#fff\}/);
  assert.ok(ratio('#ffffff', '#c8102e') >= 4.5, 'hover');
  assert.match(css, /:root\[data-theme="light"\] \.class-tag\{background:#fff0f1;border-color:#f0a1aa;color:#a3001c\}/);
  assert.ok(ratio('#a3001c', '#fff0f1') >= 4.5, 'light mode');
  assert.match(css, /\.class-tag\{[^}]*min-height:30px/, 'easy to tap');
});
