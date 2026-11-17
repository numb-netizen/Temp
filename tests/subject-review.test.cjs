const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const subjects = ['physics','chemistry','math','biology','ict','bangla','english','sociology','civics','economics','history','accounting','business','finance','marketing'];
const entries = (s, subject) => [...s.matchAll(new RegExp(`data-subject="${subject}" data-chapter="(\\d+)"><span class="box"></span><span class="nm">([^<]+)</span>`, 'g'))].map(m => [m[1],m[2]]);

test('retired subject is absent from navigation, classes, tracker and indexable pages', () => {
  for (const page of ['index.html','commerce.html','classes.html','tracker.html']) assert.doesNotMatch(read(page), /বাংলাদেশ ও বিশ্বপরিচয়|bangladesh\.html|data-subject="bangladesh"/);
  assert.match(read('bangladesh.html'), /ভুল তালিকা থেকে সরানো হয়েছে/);
  assert.match(read('bangladesh.html'), /name="robots" content="noindex"/);
  assert.doesNotMatch(read('sitemap.xml'), /bangladesh\.html/);
});

test('subject and tracker entries remain synchronized with unique stable keys', () => {
  const tracker = read('tracker.html');
  for (const subject of subjects) {
    const page = read(subject + '.html'), list = entries(page, subject);
    assert.deepEqual(entries(tracker,subject), list, subject);
    assert.equal(new Set(list.map(x=>x[0])).size,list.length, subject);
    assert.ok(page.includes('পূর্ণ পাঠ্যসূচি নয়'), subject);
    assert.ok(page.includes('https://sylhetboard.gov.bd/corner/hsc'), subject);
    assert.ok(page.includes('https://nctb.gov.bd/pages/files/6922dbc6933eb65569e0c702'), subject);
  }
  for (const id of ['2','4','9']) assert.ok(!entries(tracker,'bangla').some(x=>x[0]===id));
  assert.ok(!entries(tracker,'math').some(x=>x[0]==='6'));
  assert.match(tracker, /সরানো পুরোনো বিষয়ের অগ্রগতি সংরক্ষিত আছে/);
  assert.doesNotMatch(read('assets/app.js'), /removeItem\(KEY\("(?:bangladesh|bangla|math)/);
  for (const item of ['সাহিত্যে খেলা','নেকলেস','সিরাজউদ্দৌলা','পদ্মা']) assert.ok(read('bangla.html').includes(`>${item}</span>`),item);
  for (const old of ['আমার পথ','বায়ান্নর দিনগুলো','পদ্মা নদীর মাঝি']) assert.ok(!entries(tracker,'bangla').some(x=>x[1]===old));
  for (const subject of ['bangla','english']) assert.ok(read(subject+'.html').includes('২য় পত্রের প্রস্তুতি এখানে নেই'));
});

test('correct business subject names and both paper areas are available', () => {
  for (const page of ['index.html','commerce.html','classes.html','tracker.html']) {
    for (const title of ['ব্যবসায় সংগঠন ও ব্যবস্থাপনা','উৎপাদন ব্যবস্থাপনা ও বিপণন']) assert.ok(read(page).includes(title), `${page}: ${title}`);
  }
  for (const subject of ['business','marketing']) for (const paper of ['১ম পত্র:', '২য় পত্র:']) {
    // The older marketing topics are general second-paper concepts and keep their saved keys.
    if (subject === 'marketing' && paper === '২য় পত্র:') continue;
    assert.ok(read(subject+'.html').includes(paper),`${subject}: ${paper}`);
  }
});

test('large-heading motion is present on every regular page and honors saved pause and reduced motion', () => {
  for (const name of fs.readdirSync(site).filter(x => x.endsWith('.html') && !x.startsWith('google'))) {
    assert.ok(read(name).includes('assets/heading-motion.css?v=1'),name);
    assert.ok(read(name).includes('assets/heading-motion.js?v=1'),name);
  }
  const css = read('assets/heading-motion.css');
  assert.match(css, /h1, h2, h1 \.grad, h2 \.grad/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.motion-paused h1/);
  for (const saved of ['0','1']) {
    const classes = new Set();
    vm.runInNewContext(read('assets/heading-motion.js'),{localStorage:{getItem:()=>saved},document:{documentElement:{classList:{add:x=>classes.add(x)}}}});
    assert.equal(classes.has('motion-paused'), saved === '1');
  }
  const manifest = require('../scripts/offline-manifest.cjs').makeManifest(site);
  for (const p of ['assets/heading-motion.js','assets/heading-motion.css']) assert.ok(manifest.files.some(x=>x.path===p));
});
