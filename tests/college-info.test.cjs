const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const info = read('college-info.html');
const honours = read('honours-info.html');
const routine = read('college-routine.html');

test('booklet profile and weekly vigilance teams are paired correctly', () => {
  for (const text of ['১৮ অক্টোবর ১৯৬৯', '৬ এপ্রিল ১৯৭০', '২৮ অক্টোবর ১৯৮৬', 'চুনারুঘাটের পুরাতন হাসপাতাল ভবন', '০২৯৯৬৬০৮৪৫৯', 'chunarughatgovtcollege@yahoo.com']) assert.ok(info.includes(text), text);
  const cards = [...info.matchAll(/<article class="vigilance-card"><h3>(.*?)<\/h3>(.*?)<\/article>/g)];
  const teams = [
    ['রবিবার', 'মোঃ রবিউল হোসেন', 'জুয়েল কৈরী'],
    ['সোমবার', 'জুয়েল সরকার', 'গৌতম দেব রায়'],
    ['মঙ্গলবার', 'মাহবুবা আক্তার', 'মোঃ জহিরুল হক', 'নুরুজ্জামান পাভেল'],
    ['বুধবার', 'ফাতেমা তুজ জহরা', 'সুব্রত চক্রবর্তী', 'বাবুল শেখ'],
    ['বৃহস্পতিবার', 'তানভীর হাসিব', 'সোলেমান হক সজল', 'খালেদা আক্তার'],
  ];
  assert.equal(cards.length, teams.length);
  for (const [day, ...names] of teams) {
    const card = cards.find(x => x[1] === day); assert.ok(card, day);
    assert.equal((card[2].match(/টিম লিডার/g) || []).length, 1);
    for (const name of names) assert.ok(card[2].includes(name), `${day}: ${name}`);
    for (const [, id] of card[2].matchAll(/href="teachers\.html#([^"]+)"/g)) assert.ok(read('teachers.html').includes(`id="${id}"`), id);
  }
});

test('honours and college class routines are distinguished from HSC exam and study material', () => {
  for (const text of ['এগুলো HSC ১ম বা ২য় পত্রের সিলেবাস নয়', 'বাংলা বিভাগ', 'ইতিহাস বিভাগ', 'বাংলা কবিতা–৩', 'মৌখিক পরীক্ষা', 'রবিবার ও মঙ্গলবার', 'বুধবার ও বৃহস্পতিবার']) assert.ok(honours.includes(text), text);
  for (const text of ['একাদশ, দ্বাদশ ও স্নাতক (পাস)', 'পরীক্ষার রুটিন বা ব্যক্তিগত পড়ার রুটিন নয়', 'পৃষ্ঠা ৪৬']) assert.ok(routine.includes(text), text);
  for (const page of ['college-info.html', 'college-routine.html', 'honours-info.html']) {
    assert.ok(read('index.html').includes(`href="${page}"`));
    assert.ok(read(page).includes('সর্বশেষ তথ্যের জন্য কলেজের নোটিশ দেখো'));
  }
  assert.ok(read('routine.html').includes('href="college-routine.html"'));
  assert.ok(read('bangla.html').includes('href="honours-info.html#bangla"'));
  assert.ok(read('history.html').includes('href="honours-info.html#history"'));
  assert.ok(read('teachers.html').includes('href="college-info.html#vigilance"'));
});

test('each photographed page and new page is referenced and included in the offline snapshot', () => {
  const files = require('../scripts/offline-manifest.cjs').makeManifest(site).files.map(item => item.path);
  for (const [page, images] of [['college-info.html', ['college-profile','vigilance']], ['honours-info.html', ['honours-bangla','honours-history']], ['college-routine.html', ['class-routine']]]) {
    assert.ok(files.includes(page), page);
    for (const image of images) {
      const file = `assets/college-booklet/${image}.jpg`;
      assert.ok(read(page).includes(`src="${file}"`), file);
      assert.ok(files.includes(file), file);
    }
  }
  assert.ok(files.includes('assets/college-details.css'));
});

test('booklet source is labelled at the original photo, not at the top of the page', () => {
  for (const page of ['college-info.html', 'college-routine.html', 'honours-info.html']) {
    const html = read(page);
    const photos = (html.match(/<details class="booklet-source">/g) || []).length;
    assert.ok(photos > 0, page);
    assert.equal((html.match(/<summary>📖 এখান থেকে নেওয়া — বইয়ের মূল ছবি দেখো<\/summary>/g) || []).length, photos, page);
    const head = html.match(/<header class="college-head">[\s\S]*?<\/header>/)[0];
    assert.doesNotMatch(head, /নেওয়া|booklet|পৃষ্ঠা/, page);
  }
  assert.doesNotMatch(routine, /source-tag|পৃষ্ঠা ৪৬ থেকে লেখা|পৃষ্ঠা ৪৬-এর ছবি থেকে/);
});
