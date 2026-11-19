const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const pages = fs.readdirSync(site).filter(n => n.endsWith('.html') && !/^google[a-f0-9]+\.html$/.test(n));
const css = read('assets/style.css');

function luminance(hex) {
  const c = hex.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('every page has exactly one main landmark between the navigation and the footer', () => {
  for (const file of pages) {
    const html = read(file);
    assert.equal((html.match(/<main\b/g) || []).length, 1, file);
    const nav = html.indexOf('</nav>'), main = html.indexOf('<main'), end = html.indexOf('</main>'), footer = html.indexOf('<footer>');
    assert.ok(nav < main && main < end && end < footer, `${file}: nav → main → footer`);
  }
});

test('heading levels never skip (h1 → h3 or h2 → h4) on any page', () => {
  for (const file of pages) {
    let prev = 0;
    for (const [, level] of read(file).matchAll(/<h([1-6])\b/g)) {
      assert.ok(!prev || +level <= prev + 1, `${file}: h${prev} followed by h${level}`);
      prev = +level;
    }
  }
});

test('helper headings are visually hidden and the visible design keeps its old styles', () => {
  assert.match(css, /\.sr-only\{position:absolute!important;width:1px;height:1px;[^}]*clip:rect\(0,0,0,0\)/);
  for (const file of pages) {
    const footer = read(file).match(/<footer>[\s\S]*?<\/footer>/)[0];
    assert.match(footer, /^<footer>\n  <h2 class="sr-only">সাইটের লিংক ও যোগাযোগ<\/h2>/, file);
    assert.doesNotMatch(footer, /<h4>/, file);
  }
  assert.match(css, /\.foot h3,\.foot h4\{margin:0 0 10px;font-size:16px\}/);
  assert.match(css, /\.cd-card h3,\.cd-card \.cd-title\{margin:0 0 4px;font-family:"Baloo Da 2";font-size:20px;font-weight:700\}/);
  assert.match(read('index.html'), /<p class="cd-title">⏳ পরীক্ষার কাউন্টডাউন<\/p>/);
  for (const file of ['arts.html', 'science.html', 'commerce.html']) assert.match(read(file), /<h2 class="sr-only">বিষয়সমূহ<\/h2>\n  <div class="subj-grid">/, file);
});

test('footer text and badges meet the 4.5:1 contrast minimum', () => {
  const copy = /\.copy\{[^}]*color:(#[0-9a-f]{6})/.exec(css)[1];
  const footerBg = /footer\{[^}]*background:(#[0-9a-f]{6})/.exec(css)[1];
  assert.ok(contrast(copy, footerBg) >= 4.5, `footer copyright ${copy} on ${footerBg}`);
  const green2 = /--green2:(#[0-9a-f]{6})/.exec(css)[1];
  for (const file of ['bangla.html', 'tracker.html']) {
    for (const [, color] of read(file).matchAll(/class="badge" style="background:var\(--green2\);color:(#[0-9a-f]{3,6});/g)) {
      const full = color.length === 4 ? '#' + [...color.slice(1)].map(x => x + x).join('') : color;
      assert.ok(contrast(full, green2) >= 4.5, `${file}: badge ${color} on ${green2}`);
    }
  }
  assert.match(read('teachers.html'), /href="https:\/\/chugc\.edu\.bd\/"[^>]*text-decoration:underline/);
});

test('footer links are at least 24px tall and the WhatsApp name includes its visible text', () => {
  assert.match(css, /\.foot a\{display:flex;align-items:center;min-height:24px;/);
  for (const file of pages) {
    const m = /<a class="contact-whatsapp"[^>]*aria-label="([^"]+)">💬 WhatsApp-এ মেসেজ ↗<\/a>/.exec(read(file));
    if (m) assert.ok(m[1].includes('WhatsApp-এ মেসেজ'), file);
  }
});

test('footer year is written without a thousands comma', () => {
  const app = read('assets/app.js');
  assert.match(app, /yr\.textContent = new Date\(\)\.getFullYear\(\)\.toLocaleString\("bn-BD", \{useGrouping:false\}\)/);
  assert.equal((2026).toLocaleString('bn-BD', {useGrouping: false}), '২০২৬');
});

test('pages show a small logo and notice image; the full-size files stay for sharing and zoom', () => {
  for (const file of pages) {
    const html = read(file);
    assert.doesNotMatch(html, /<img\b[^>]*src="assets\/study-logo\.png"/, file);
    if (html.includes('rel="icon"')) assert.match(html, /<link rel="icon" href="assets\/study-logo-96\.png" type="image\/png">/, file);
  }
  assert.ok(fs.statSync(path.join(site, 'assets/study-logo-192.webp')).size < 20 * 1024);
  assert.ok(fs.statSync(path.join(site, 'assets/study-logo-96.png')).size < 30 * 1024);
  assert.ok(fs.existsSync(path.join(site, 'assets/study-logo.png')), 'kept for og:image and the desktop app icon');
  const webp = fs.readFileSync(path.join(site, 'assets/study-logo-192.webp'));
  assert.equal(webp.subarray(0, 4).toString(), 'RIFF'); assert.equal(webp.subarray(8, 12).toString(), 'WEBP');
});
