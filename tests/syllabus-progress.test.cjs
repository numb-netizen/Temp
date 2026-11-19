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
test('second-paper pages remain linked and distinguish selected image topics from verified syllabi', () => {
  for (const subject of ['bangla','english']) {
    const page = read(subject+'-2.html');
    assert.ok(read(subject+'.html').includes(subject+'-2.html'));
    for (const loc of ['science.html','arts.html','commerce.html','index.html','tracker.html']) assert.ok(read(loc).includes(subject+'-2.html'), loc);
  }
  const bangla = read('bangla-2.html');
  assert.match(bangla, /পূর্ণ সরকারি পাঠ্যসূচি নয়/);
  assert.match(bangla, /পুরো সিলেবাসের শতাংশ নয়/);
  assert.match(bangla, /প্রকাশক, সংস্করণ বা ২০২৫–২৬ শিক্ষাবর্ষের জন্য প্রযোজ্যতা নিশ্চিত করা যায় না/);
  assert.match(bangla, /ছবিতে ১–৫৯ নম্বরের অংশ দেখা যায়/);
  assert.match(bangla, /অধ্যায়ের শিরোনাম দেখা যায় না/);
  const english=read('english-2.html');
  assert.match(english, /তালিকা এখনো প্রকাশের জন্য যাচাই করা হয়নি/);
  assert.doesNotMatch(english, /class="chap"|class="cnt"/);
});
test('Bangla second-paper image topics have separate, stable and synchronized progress keys', () => {
  const subject='bangla-2', page=entries(read('bangla-2.html'),subject), tracker=entries(read('tracker.html'),subject);
  assert.deepEqual(tracker,page);
  assert.deepEqual(page, [
    ['0','১ম অধ্যায়: বাংলা উচ্চারণের নিয়ম'], ['1','২য় অধ্যায়: বাংলা বানানের নিয়ম'],
    ['2','৩য় অধ্যায়: বাংলা ভাষার ব্যাকরণিক শব্দশ্রেণি'], ['3','৪র্থ অধ্যায়: বাংলা শব্দ গঠন (উপসর্গ, প্রত্যয় ও সমাস)'],
    ['4','৫ম অধ্যায়: বাক্যতত্ত্ব'], ['5','৬ষ্ঠ অধ্যায়: বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধ প্রয়োগ'],
    ['6','৭ম অধ্যায় (ক): পারিভাষিক শব্দ'], ['7','৭ম অধ্যায় (খ): অনুবাদ'], ['8','নির্মিতির সূচি: চিঠিপত্র লিখন']
  ]);
  const first=entries(read('bangla.html'),'bangla');
  assert.deepEqual(first,entries(read('tracker.html'),'bangla'));
  assert.equal(new Set(page.map(x=>x[0])).size,9);
  assert.match(read('tracker.html'), /দৃশ্যমান নির্বাচিত বিষয়গুলোর, পূর্ণ সিলেবাসের নয়/);
});
test('all five supplied index images and the partial example lists are available offline', () => {
  const page=read('bangla-2.html');
  const manifest=require('../scripts/offline-manifest.cjs').makeManifest(site).files;
  for (let i=1;i<=5;i++) {
    const asset=`assets/bangla-2-reference/source-${i}.jpg`;
    assert.ok(page.includes(`src="${asset}"`) && page.includes(`href="${asset}"`),asset);
    assert.ok(manifest.some(x=>x.path===asset),asset);
  }
  for(const phrase of ['চিঠিপত্রের ছবিতে থাকা উদাহরণ (১–১২)','অন্য ছবিতে থাকা বিষয়ের নাম (১৯–৪৫)','একুশ শতকে পল্লি উন্নয়ন ও বাংলাদেশ','যুদ্ধ নয় শান্তি','১২. আবেদনপত্র']) assert.ok(page.includes(phrase),phrase);
  assert.ok(manifest.some(x=>x.path==='assets/bangla-2.css'));
  assert.ok(manifest.reduce((sum,file)=>sum+file.size,0) < 25*1024*1024,'Android offline bundle limit');
});
test('two-paper subject pages separate unverified status from the legacy topics', () => {
  for (const subject of ['physics','chemistry','math','biology','economics','sociology','civics','history']) {
    const page = read(subject+'.html');
    assert.ok(page.includes('<strong>১ম পত্র:</strong> পূর্ণ অধ্যায় ও কোড যাচাই বাকি'),subject);
    assert.ok(page.includes('<strong>২য় পত্র:</strong> পূর্ণ অধ্যায় ও কোড যাচাই বাকি'),subject);
  }
  assert.match(read('tracker.html'), /অগ্রগতি শুধু দৃশ্যমান নির্বাচিত বিষয়গুলোর/);
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
