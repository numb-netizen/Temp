const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const apk = 'https://github.com/numb-netizen/Temp/releases/download/android-v1.3-beta/HSC-2027-v1.3-beta-debug.apk';

test('every page has a working app link inside its navigation and footer', () => {
  const pages = fs.readdirSync(site).filter(name => name.endsWith('.html'));
  for (const name of pages) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    const nav = html.match(/<div class="links" id="navLinks">([\s\S]*?)<\/div>/);
    assert.ok(nav, name);
    assert.ok(html.indexOf('src="assets/app-context.js?v=20261113"') >= 0, name);
    assert.ok(html.indexOf('src="assets/app-context.js?v=20261113"') < html.indexOf('href="assets/style.css?v=20261113-app-context"'), name);
    assert.equal((nav[1].match(/href="android-app\.html"/g) || []).length, 1, name);
    assert.match(html, /id="burger"[^>]*aria-controls="navLinks"[^>]*aria-expanded="false"/, name);
    assert.match(html.match(/<footer[\s\S]*?<\/footer>/)[0], /href="android-app\.html"/, name);
  }
});

test('app page points to published beta and explains installation and limitations', () => {
  const page = fs.readFileSync(path.join(site, 'android-app.html'), 'utf8');
  assert.ok(page.includes(`href="${apk}"`));
  assert.match(page, /href="android-app\.html" class="active" aria-current="page"/);
  assert.match(page, /পরীক্ষামূলক debug APK/);
  assert.match(page, /Android 6\.0 বা নতুন/);
  assert.match(page, /সাধারণ পড়াশোনা অফলাইনে/);
  assert.match(page, /ইন্টারনেট লাগবে/);
  assert.match(page, /Install unknown apps/);
  assert.match(page, /আনইনস্টল করলে অ্যাপের স্থানীয় ট্র্যাকার তথ্য মুছে যাবে/);
  assert.match(page, /GitHub release দেখো/);
});

test('mobile menu toggles accessibility state and closes after navigation', () => {
  const source = fs.readFileSync(path.join(site, 'assets/app.js'), 'utf8');
  const nav = source.split('/* ---------- NAV ---------- */')[1].split('/* ---------- REVEAL')[0];
  const handlers = {}, attrs = {}, classes = new Set();
  const links = {classList: {
    toggle: c => { if (classes.has(c)) { classes.delete(c); return false; } classes.add(c); return true; },
    remove: c => classes.delete(c),
  }, addEventListener: (event, fn) => handlers.link = fn};
  const burger = {setAttribute: (name, value) => attrs[name] = value,
    addEventListener: (event, fn) => handlers.burger = fn};
  vm.runInNewContext(nav, {$: selector => selector === '#burger' ? burger : links});
  handlers.burger(); assert.equal(attrs['aria-expanded'], 'true'); assert.ok(classes.has('open'));
  handlers.link({target: {closest: () => ({})}});
  assert.equal(attrs['aria-expanded'], 'false'); assert.equal(classes.has('open'), false);
});


test('only the explicit HSC app marker sets the presentation class', () => {
  const script = fs.readFileSync(path.join(site, 'assets/app-context.js'), 'utf8');
  function classes(userAgent) {
    const result = new Set();
    vm.runInNewContext(script, {navigator:{userAgent}, document:{documentElement:{classList:{add: name => result.add(name)}}}});
    return result;
  }
  const webview = 'Mozilla/5.0 (Linux; Android 13; Pixel; wv) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
  assert.equal(classes(webview).has('hsc-android-app'), false, 'other app webviews must keep download links');
  assert.equal(classes(webview + ' HSC2027App').has('hsc-android-app'), true);
  assert.equal(classes(webview + ' FakeHSC2027App').has('hsc-android-app'), false);
  assert.equal(classes('Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36').size, 0);
});
