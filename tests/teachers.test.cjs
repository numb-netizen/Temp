const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(site, 'teachers.html'), 'utf8');
const records = [
  ['principal','আব্দুল মান্নান চৌধুরী','অধ্যক্ষ','01712612992'],
  ['bangla','জহিরুল হক','প্রভাষক, বাংলা','01843984985'],
  ['english','জুয়েল কৈরী','প্রভাষক, ইংরেজি','01751150574'],
  ['math','গৌতম দেব রায়','প্রভাষক, গণিত বিভাগ','01737994936'],
  ['physics','সুব্রত চক্রবর্তী','প্রভাষক, পদার্থবিদ্যা বিভাগ','01773710796'],
  ['botany','সোলেমান হক সজল','প্রভাষক, উদ্ভিদবিদ্যা বিভাগ','01568318132'],
  ['management','জুয়েল সরকার','সহকারী অধ্যাপক, ব্যবস্থাপনা বিভাগ','01790330583'],
  ['accounting-one','ফাতেমা তুজ জহরা','প্রভাষক, হিসাববিজ্ঞান বিভাগ','01881017153'],
  ['accounting-two','নুরুজ্জামান পাভেল','প্রভাষক, হিসাববিজ্ঞান বিভাগ','01728442267'],
  ['history-one','রবিউল হোসেন','সহকারী অধ্যাপক, ইতিহাস','01609288558'],
  ['political-one','তানভীর হাসিব','প্রভাষক, রাষ্ট্রবিজ্ঞান বিভাগ','01713323216'],
  ['history-two','মাহবুবা আক্তার','প্রভাষক, ইতিহাস','01624170920'],
  ['economics','খালেদা আক্তার','প্রভাষক, অর্থনীতি','01531742538'],
  ['political-two','বাবুল শেখ','প্রভাষক, রাষ্ট্রবিজ্ঞান','01312743672'],
];
test('teacher page presents all source records with paired photos and expandable contacts', () => {
  const cards = [...html.matchAll(/<details class="teacher-card" id="teacher-([^"]+)">([\s\S]*?)<\/details>/g)];
  assert.equal(cards.length, records.length);
  for (const [id, name, role, phone] of records) {
    const card = cards.find(item => item[1] === id);
    assert.ok(card, id); assert.ok(card[2].includes(name), name); assert.ok(card[2].includes(role), role);
    assert.ok(card[2].includes(`href="tel:${phone}"`), name);
    assert.match(card[2], /<summary>[\s\S]*?<\/summary>[\s\S]*?<div class="teacher-contact">/);
    assert.ok(card[2].includes(`src="assets/teachers/${id}.jpg"`));
    assert.ok(fs.existsSync(path.join(site, 'assets', 'teachers', id + '.jpg')));
  }
  for (const section of ['অধ্যক্ষ','বাংলা বিভাগ','ইংরেজি বিভাগ','বিজ্ঞান বিভাগ','ব্যবসায় শিক্ষা বিভাগ','মানবিক বিভাগ','শিক্ষক পরিষদ']) assert.ok(html.includes(section), section);
  for (const title of ['সভাপতি','সম্পাদক','যুগ্ম-সম্পাদক','কোষাধ্যক্ষ']) assert.ok(html.includes(title), title);
  assert.equal((html.match(/<details class="council-card">/g)||[]).length,4);
  assert.ok(!/<details[^>]*\sopen(?:\s|>)/.test(html));
  assert.match(html, /তথ্য পরে বদলে যেতে পারে/);
  assert.match(fs.readFileSync(path.join(site,'index.html'),'utf8'), /href="teachers\.html"/);
});
test('teacher portraits and styling are included in the offline app snapshot', () => {
  const paths = require('../scripts/offline-manifest.cjs').makeManifest(site).files.map(item => item.path);
  for (const file of ['teachers.html','assets/teachers.css', ...records.map(([id]) => `assets/teachers/${id}.jpg`)]) assert.ok(paths.includes(file), file);
});
