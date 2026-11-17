const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const home = fs.readFileSync(path.join(site, 'index.html'), 'utf8');

test('home organizes useful links while preserving study and college features', () => {
  assert.match(home, /<main id="main-content">/);
  assert.match(home, /class="skip-link" href="#main-content"/);
  for (const page of ['student-group.html','teachers.html','college-info.html','hsc-2027-routine.html','college-routine.html','honours-info.html']) {
    assert.match(home, new RegExp(`href="${page.replace('.', '\\.')}`), page);
  }
  for (const id of ['cdD','cdH','cdM','cdS','exam-routine','pretest-routine','structure','contact']) assert.ok(home.includes(`id="${id}"`), id);
  assert.match(home, /প্রস্তাবিত ৬ জুন ২০২৭ পর্যন্ত \(চূড়ান্ত নয়\)/);
  assert.doesNotMatch(home, /প্রতিদিন পড়ো অন্তত <b>৬ ঘণ্টা/);
  assert.doesNotMatch(home, /Hierarchical Structure/);
});

test('home presentation is available offline and accommodates reduced motion', () => {
  assert.match(home, /href="assets\/home\.css\?v=1"/);
  const css = fs.readFileSync(path.join(site, 'assets/home.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.home \.reveal\{opacity:1;transform:none\}/);
  assert.ok(require('../scripts/offline-manifest.cjs').makeManifest(site).files.some(x => x.path === 'assets/home.css'));
});
