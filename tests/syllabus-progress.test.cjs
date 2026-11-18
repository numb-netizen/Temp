const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname,'../site');
const baseline = require('./fixtures/legacy-chapter-keys.json');
const read = file => fs.readFileSync(path.join(site,file),'utf8');
const entries = (s, subject) => [...s.matchAll(new RegExp(`data-subject="${subject}" data-chapter="(\\d+)"><span class="box"></span><span class="nm">([^<]+)</span>`, 'g'))].map(m=>[m[1],m[2]]);
test('legacy storage keys and their meanings are unchanged and synchronized', () => {
  for (const [subject, original] of Object.entries(baseline)) {
    const page = entries(read(subject+'.html'),subject), tracker = entries(read('tracker.html'),subject);
    assert.deepEqual(tracker, page, subject);
    assert.equal(new Set(page.map(x=>x[0])).size, page.length, subject+' unique IDs');
    assert.equal(new Set(page.map(x=>x[1])).size, page.length, subject+' unique names');
    for (const [key, name] of Object.entries(original)) assert.equal(new Map(page).get(key), name, `${subject}:${key}`);
  }
});
test('second-paper pages explicitly await verification and are linked everywhere needed', () => {
  for (const subject of ['bangla','english']) {
    const page = read(subject+'-2.html');
    assert.match(page, /তালিকা এখনো প্রকাশের জন্য যাচাই করা হয়নি/);
    assert.doesNotMatch(page, /class="chap"|class="cnt"/);
    assert.ok(read(subject+'.html').includes(subject+'-2.html'));
    for (const loc of ['science.html','arts.html','commerce.html','index.html','tracker.html']) assert.ok(read(loc).includes(subject+'-2.html'), loc);
  }
});
test('two-paper subject pages separate unverified status from the legacy topics', () => {
  for (const subject of ['physics','chemistry','math','biology','economics','sociology','civics','history','accounting','business','finance','marketing']) {
    const page = read(subject+'.html');
    assert.ok(page.includes('<strong>১ম পত্র:</strong> পূর্ণ অধ্যায় ও কোড যাচাই বাকি'),subject);
    assert.ok(page.includes('<strong>২য় পত্র:</strong> পূর্ণ অধ্যায় ও কোড যাচাই বাকি'),subject);
  }
  assert.match(read('tracker.html'), /অগ্রগতি শুধু আগে থেকে থাকা নির্বাচিত বিষয়গুলোর/);
});

test('local links and fragments on all HTML pages resolve to existing site files', () => {
  const htmls = fs.readdirSync(site).filter(n => n.endsWith('.html'));
  const doc = Object.fromEntries(htmls.map(n => [n,read(n)]));
  for (const [name, html] of Object.entries(doc)) {
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const raw = match[1].replace(/&amp;/g,'&');
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw)) continue;
      const url = new URL(raw, `https://local.test/${name}`);
      if (url.origin !== 'https://local.test') continue;
      const filename = decodeURIComponent(url.pathname.slice(1));
      const file = path.resolve(site, filename);
      assert.ok(file.startsWith(site + path.sep), `${name}: ${raw}`);
      assert.ok(fs.existsSync(file) && fs.statSync(file).isFile(), `${name}: ${raw}`);
      if (url.hash && doc[filename]) {
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(doc[filename].includes(`id="${id}"`) || doc[filename].includes(`id='${id}'`), `${name}: ${raw}`);
      }
    }
  }
});
