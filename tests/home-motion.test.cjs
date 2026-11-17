const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const read = p => fs.readFileSync(path.join(site, p), 'utf8');
const script = read('assets/home-motion.js');

function setup(width, reduced, saved = '0') {
  const layer = {children: [], appendChild(fragment) { this.children.push(...fragment.children); }};
  const classes = new Set();
  const toggle = {hidden: true, addEventListener(event, handler) { this.handler = handler; }};
  const store = {value:saved, getItem() {return this.value;}, setItem(key, value) {this.value = value;}};
  const document = {
    documentElement: {classList: {toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }}},
    querySelector: selector => selector === '.hero-sparkles' ? layer : selector === '.motion-toggle' ? toggle : null,
    createDocumentFragment: () => ({children: [], appendChild(element) { this.children.push(element); }}),
    createElement: () => ({style: {setProperty(key, value) { this[key] = value; }}})
  };
  const media = {matches: reduced, addEventListener(event, handler) {this.handler = handler;}};
  vm.runInNewContext(script, {document, window: {innerWidth: width, matchMedia: () => media}, localStorage: store, Math});
  return {layer, toggle, classes, store, media};
}

test('decorative effects are bounded, non-interactive and disabled for reduced motion', () => {
  assert.equal(setup(360, false).layer.children.length, 7);
  const instance = setup(1200, false), sparks = instance.layer.children; assert.equal(sparks.length, 12);
  const reduced = setup(1200, true); assert.equal(reduced.layer.children.length, 0); assert.equal(reduced.toggle.hidden, true);
  instance.toggle.handler(); assert.ok(instance.classes.has('motion-paused')); assert.equal(instance.store.value, '1');
  assert.equal(instance.toggle.textContent, 'অ্যানিমেশন চালু');
  instance.toggle.handler(); assert.equal(instance.classes.has('motion-paused'), false); assert.equal(instance.store.value, '0');
  const saved = setup(360, false, '1'); assert.equal(saved.layer.children.length, 0); assert.ok(saved.classes.has('motion-paused'));
  saved.toggle.handler(); assert.equal(saved.layer.children.length, 7);
  reduced.media.matches = false; reduced.media.handler(); assert.equal(reduced.layer.children.length, 12);
  for (const spark of sparks) {
    assert.ok(parseFloat(spark.style.left) >= 4 && parseFloat(spark.style.left) <= 96);
    assert.ok(parseFloat(spark.style.top) >= 8 && parseFloat(spark.style.top) <= 92);
    assert.ok(parseFloat(spark.style['--duration']) >= 7 && parseFloat(spark.style['--duration']) <= 14);
  }
  const page = read('index.html'), css = read('assets/motion.css');
  assert.match(page, /class="hero-sparkles" aria-hidden="true"/);
  assert.match(css, /\.hero-sparkles\{[^}]*pointer-events:none/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.reveal\{opacity:1;transform:none;transition:none\}/);
  for (const asset of ['assets/home-motion.js','assets/motion.css']) assert.ok(require('../scripts/offline-manifest.cjs').makeManifest(site).files.some(x => x.path === asset), asset);
});

test('unnecessary advice is trimmed but essential exam information and links remain', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /প্রতিদিন পড়ো অন্তত|Hierarchical Structure|পরীক্ষা শেষ হলে তালিকা থেকে নিজে থেকেই সরে যাবে/);
  for (const s of ['চূড়ান্ত নয়','পরীক্ষার্থীদের জন্য নোটিশের নির্দেশনা','কলেজ ইউনিফর্ম','কলেজ প্রদত্ত আইডি কার্ড','পরীক্ষা শুরু হলে তার সিলেবাস, শেষ হলে রুটিন থেকে বিষয়টি সরে যাবে','href="assets/pretest-notice-2026.jpg"']) assert.ok(html.includes(s), s);
  for (const link of ['student-group.html','teachers.html','college-info.html','hsc-2027-routine.html','college-routine.html','honours-info.html']) assert.ok(html.includes(`href="${link}"`), link);
  assert.doesNotMatch(read('routine.html'), /মোবাইল পড়ার সময় সাইলেন্ট মোডে রাখো/);
  assert.doesNotMatch(read('classes.html'), /টিপস: ক্লাস দেখার পর/);
});
