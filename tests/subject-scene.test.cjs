const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const subjects = ['physics', 'chemistry', 'math', 'biology', 'ict', 'bangla', 'bangla-2', 'english', 'english-2', 'economics', 'history', 'civics', 'sociology', 'accounting', 'business', 'finance', 'marketing', 'geography'];

// Runs subject-scene.js against a tiny fake header and returns the injected element.
function render(scene) {
  let inserted = null;
  const head = {getAttribute: () => scene, querySelector: () => null, firstChild: null, insertBefore: el => { inserted = el; }};
  const document = {querySelector: sel => sel === '.page-head[data-scene]' ? head : null,
    createElement: () => ({attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }})};
  vm.runInNewContext(read('assets/subject-scene.js'), {document});
  return inserted;
}

test('every subject page opts into its own themed header scene', () => {
  for (const name of subjects) {
    const html = read(`${name}.html`);
    assert.match(html, new RegExp(`<header class="page-head" data-scene="${name}">`), name);
    assert.ok(html.includes('assets/subject-scene.css?v=3'), name);
    assert.ok(html.includes('<script src="assets/subject-scene.js?v=3" defer></script>'), name);
  }
});

test('each subject draws a decorative, hidden SVG scene with its own artwork', () => {
  const seen = new Map();
  for (const name of subjects) {
    const el = render(name);
    assert.ok(el, name);
    assert.equal(el.className, `subject-scene scene-${name}`);
    assert.equal(el.attrs['aria-hidden'], 'true');
    assert.match(el.innerHTML, /^<svg viewBox="0 0 420 260" focusable="false"/);
    assert.ok((el.innerHTML.match(/class="[^"]*\bsc-/g) || []).length >= 4, `${name} is animated`);
    // A repeated attribute (e.g. two class="…") is silently dropped by the browser.
    for (const tag of el.innerHTML.match(/<[a-z]+\s[^>]*>/gi)) {
      const names = [...tag.matchAll(/\s([a-zA-Z-]+)=/g)].map(m => m[1]);
      assert.equal(new Set(names).size, names.length, `${name}: ${tag}`);
    }
    seen.set(el.innerHTML, (seen.get(el.innerHTML) || []).concat(name));
  }
  // Only the two-paper subjects share artwork with their first paper.
  assert.equal(seen.size, 16);
  assert.ok(render('chemistry').innerHTML.includes('sc-rise'), 'chemistry reactions bubble');
  assert.equal(render('unknown'), null);
});

test('physics electrons travel their orbits, the microscope is detailed and the ballot enters the box', () => {
  const physics = render('physics').innerHTML;
  assert.equal((physics.match(/<g class="electron">/g) || []).length, 3);
  assert.equal((physics.match(/<animateMotion dur="[\d.]+s" begin="-?[\d.]+s" repeatCount="indefinite" path="M186 130a76 25/g) || []).length, 3);
  assert.doesNotMatch(physics, /sc-spin/, 'orbits stay put while electrons move');
  const chemistry = render('chemistry').innerHTML;
  for (const part of ['scene-lens-clip', 'class="hl"', 'class="k fb" cx="80" cy="210"']) assert.ok(chemistry.includes(part), part);
  const civics = render('civics').innerHTML;
  assert.match(civics, /<clipPath id="scene-ballot-clip"><rect x="340" y="40" width="80" height="130"\/>/);
  assert.match(civics, /<g clip-path="url\(#scene-ballot-clip\)"><g class="sc-ballot"/);
  const css = read('assets/subject-scene.css');
  assert.match(css, /@keyframes sc-ballot\{[^\n]*80%,100%\{transform:translateY\(36px\)/, 'ballot top (y 138) ends below the slot (y 170)');
  assert.match(read('assets/subject-scene.js'), /svg\.pauseAnimations\(\)/);
});

test('scenes stay behind the text, ignore the pointer and respect motion preferences', () => {
  const css = read('assets/subject-scene.css');
  assert.match(css, /\.page-head>\.wrap\{position:relative;z-index:1\}/);
  assert.match(css, /\.subject-scene\{position:absolute;z-index:0;pointer-events:none;/);
  assert.match(css, /:root\[data-theme="light"\] \.subject-scene\{/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.subject-scene,\.subject-scene \*\{animation:none!important\}\}/);
  assert.match(css, /\.motion-paused \.subject-scene,\.motion-paused \.subject-scene \*\{animation:none!important\}/);
});

test('light mode has its own visible motion on every page and stops when motion is off', () => {
  for (const name of fs.readdirSync(site).filter(n => n.endsWith('.html') && !n.startsWith('google'))) {
    const html = read(name);
    assert.ok(html.indexOf('assets/light-motion.css?v=1') > html.indexOf('assets/theme.css?v=1'), name);
  }
  const css = read('assets/light-motion.css');
  for (const rule of ['.hero-spark{', '.orbit{', '.hero::before{', '.page-head::before{', '.page-head::after{', '.subj .ic', 'footer::before{'])
    assert.ok(css.includes(`:root[data-theme="light"] ${rule}`), rule);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.page-head::before[^}]*animation:none!important\}/);
  assert.match(css, /:root\.motion-paused\[data-theme="light"\] \.hero::before[^{]*\{animation:none!important\}/);
  // Every selector is scoped to light mode so the dark theme stays unchanged.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '');
  for (const sel of rules.match(/[^{}@]+(?=\{)/g).map(s => s.trim()).filter(s => s && !/^\(|^media|^\d/.test(s)))
    for (const part of sel.split(',')) assert.match(part.trim(), /^:root(\.motion-paused)?\[data-theme="light"\]/, part);
});

test('new motion assets are available offline', () => {
  const manifest = JSON.parse(read('offline-manifest.json'));
  for (const p of ['assets/subject-scene.js', 'assets/subject-scene.css', 'assets/light-motion.css'])
    assert.ok(manifest.files.some(x => x.path === p), p);
});

test('history sand stays inside the glass, finance coins land on the stack and enter the piggy bank', () => {
  const history = render('history').innerHTML;
  // Both sand bodies are clipped to the inside of their bulbs.
  assert.match(history, /<g clip-path="url\(#scene-sand-top\)"><path class="fb sand-top sc-sand-top"/);
  assert.match(history, /<g clip-path="url\(#scene-sand-bottom\)"><path class="fb sand-bottom sc-sand-bottom"/);
  assert.match(history, /class="sc-turn" style="[^"]*transform-origin:80px 138px"/, 'turns around the neck');
  const css = read('assets/subject-scene.css');
  assert.match(css, /@keyframes sc-sand-top\{0%\{transform:translateY\(0\)\}80%,100%\{transform:translateY\(74px\)\}\}/, 'top surface (y 66) drains past the neck (y 137)');
  assert.match(css, /@keyframes sc-turn\{0%,84%\{transform:rotate\(0\)\}100%\{transform:rotate\(180deg\)\}\}/);
  const finance = render('finance').innerHTML;
  assert.match(finance, /cx="80" cy="176" rx="34"/, 'top of the stack');
  assert.match(finance, /class="sc-stack"[^>]*><ellipse class="k fb" cx="80" cy="164"/, 'falling coin rests one coin above it');
  assert.match(finance, /<g clip-path="url\(#scene-piggy-clip\)"><g class="sc-coin-in"[^>]*><circle class="k fb" cx="262" cy="116" r="12"/);
  assert.match(css, /@keyframes sc-coin-in\{[^\n]*80%,100%\{transform:translateY\(28px\)/, 'coin top (y 104) ends below the slot (y 128)');
});

test('the accounting calculator types random amounts and stops when motion is off', () => {
  const html = render('accounting').innerHTML;
  assert.deepEqual([...html.matchAll(/data-k="([^"]+)"/g)].map(m => m[1]), ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '=']);
  // Drive the typing loop with fake timers and a fake SVG.
  const timers = [], display = {textContent: '৳ 12,500'}, paused = {value: false};
  const keys = [...html.matchAll(/data-k="([^"]+)"/g)].map(m => ({key: m[1], classList: {add() {}, remove() {}}, getAttribute: () => m[1]}));
  const svg = {pauseAnimations() {}, unpauseAnimations() {}, querySelector: sel => sel === '.calc-display' ? display : null, querySelectorAll: () => keys};
  const head = {getAttribute: () => 'accounting', querySelector: () => null, insertBefore: el => { el.firstChild = svg; }};
  const document = {hidden: false, querySelector: () => head, createElement: () => ({setAttribute() {}}),
    documentElement: {classList: {contains: () => paused.value}}};
  vm.runInNewContext(read('assets/subject-scene.js'), {document, window: {}, setTimeout: (fn, ms) => timers.push(fn), Math, Number, String});
  const seen = new Set();
  for (let i = 0; i < 400; i++) { timers.shift()(); seen.add(display.textContent); }
  assert.ok(seen.size > 30, 'many different amounts appear');
  for (const text of seen) assert.match(text, /^৳ [\d,]{1,6}$/, 'fits the calculator screen');
  assert.ok([...seen].some(t => t.includes(',')), '= shows a formatted total');
  paused.value = true;
  const before = display.textContent;
  for (let i = 0; i < 50; i++) timers.shift()();
  assert.equal(display.textContent, before, 'no typing while motion is paused');
});
