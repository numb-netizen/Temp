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
    assert.ok(html.includes('assets/subject-scene.css?v=1'), name);
    assert.ok(html.includes('<script src="assets/subject-scene.js?v=1" defer></script>'), name);
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
    assert.doesNotMatch(el.innerHTML, /style="[^"]*"[^>]*\sstyle=/, `${name} has no duplicate style attributes`);
    seen.set(el.innerHTML, (seen.get(el.innerHTML) || []).concat(name));
  }
  // Only the two-paper subjects share artwork with their first paper.
  assert.equal(seen.size, 16);
  assert.ok(render('chemistry').innerHTML.includes('sc-rise'), 'chemistry reactions bubble');
  assert.equal(render('unknown'), null);
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
