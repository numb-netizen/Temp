const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const pages = fs.readdirSync(site).filter(f => f.endsWith('.html'));

test('compulsory subjects use the standard spelling আবশ্যিক', () => {
  for (const page of pages) assert.doesNotMatch(read(page), /অবশ্যক|İng/, page);
  for (const page of ['science.html', 'arts.html', 'commerce.html', 'bangla-2.html', 'english-2.html']) assert.ok(read(page).includes('সাধারণ আবশ্যিক'), page);
});

test('college class routine is available as an accessible table alongside the original photo', () => {
  const html = read('college-routine.html');
  const table = html.match(/<table class="college-table routine-table">([\s\S]*?)<\/table>/);
  assert.ok(table, 'routine table');
  const days = [...table[1].matchAll(/<tbody data-day="([^"]+)">([\s\S]*?)<\/tbody>/g)];
  assert.deepEqual(days.map(d => d[1]), ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার']);
  for (const [, day, body] of days) assert.equal((body.match(/<tr>/g) || []).length, 6, day);
  for (const time of ['৯.১০–১০.০০', '১২.৩০–১.২০', '২.৪০–৩.৩০']) assert.ok(table[1].includes(time), time);
  // Spot-check cells against the booklet photo.
  const sunday = days[0][2];
  assert.match(sunday, /<td rowspan="3" class="rt-common">বাংলা<\/td><td rowspan="3" class="rt-common">আইসিটি<\/td><td rowspan="3" class="rt-common">ইংরেজি<\/td>/);
  assert.match(days[4][2], /<th scope="row" class="rt-dept">ব্যবসায় শিক্ষা<\/th><td>হিসাববিজ্ঞান<\/td><td>উৎপাদন ব্যবস্থাপনা ও বিপণন<\/td>/);
  assert.ok(html.includes('src="assets/college-booklet/class-routine.jpg"'));
});

test('English second-paper items are tracked with the same keys on the tracker and subject page', () => {
  const items = html => [...html.matchAll(/<div class="item" data-subject="english-2" data-item="(\d+)"><span class="box"><\/span><span class="nm">(.*?)<\/span><\/div>/g)].map(m => [m[1], m[2]]);
  const page = items(read('english-2.html')), tracker = items(read('tracker.html'));
  assert.equal(page.length, 108);
  assert.deepEqual(tracker, page);
  assert.equal(new Set(page.map(x => x[0])).size, 108);
  assert.ok(read('english-2.html').includes('পূর্ণ পাঠ্যসূচি নয়'));
});
