const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '../site');
const read = p => fs.readFileSync(path.join(site,p), 'utf8');
test('feedback stays out of navigation, with a prominent in-flow home invitation and footer links', () => {
  const files = fs.readdirSync(site).filter(n => n.endsWith('.html') && n !== 'googleb7da7b15e33059e0.html');
  for (const file of files) {
    const html = read(file), nav = html.match(/<nav>[\s\S]*?<\/nav>/)[0], footer = html.match(/<footer>[\s\S]*?<\/footer>/)[0];
    assert.doesNotMatch(nav, /feedback\.html|feedback-cta/, file);
    assert.match(footer, /href="feedback\.html"/, file);
    assert.match(nav, /href="tracker\.html"/, file);
  }
  const home = read('index.html');
  assert.match(home, /<section class="feedback-invite"/);
  assert.match(home, /class="btn btn-p feedback-banner-link" href="feedback\.html"/);
  assert.ok(home.indexOf('feedback-invite') > home.indexOf('</header>'));
  assert.doesNotMatch(read('assets/feedback.css'), /position\s*:\s*(fixed|sticky|absolute)/);
});
test('feedback allows direct submission with a clear public notice and no-JavaScript fallback', () => {
  const html = read('feedback.html');
  assert.match(html, /<form[^>]*id="feedback-form"/);
  assert.match(html, /name="title"[^>]*required[^>]*maxlength="120"/);
  assert.match(html, /name="body"[^>]*required[^>]*maxlength="500"/);
  assert.match(html, /type="submit" disabled/);
  for (const text of ['Issue হিসেবে সবাই দেখতে পারবে','GitHub অ্যাকাউন্ট লাগে না','security/advisories/new','পাবলিক Issue-তে লিখো না']) assert.ok(html.includes(text),text);
  const manifest = require('../scripts/offline-manifest.cjs').makeManifest(site).files;
  for (const asset of ['feedback.html','assets/feedback.css','assets/feedback.js']) assert.ok(manifest.some(x => x.path === asset), asset);
});
test('security policy routes sensitive reports privately and ordinary reports publicly', () => {
  const policy = fs.readFileSync(path.join(__dirname,'../SECURITY.md'),'utf8');
  assert.match(policy, /security\/advisories\/new/);
  assert.match(policy, /feedback\.html/);
  assert.match(policy, /unsigned/);
  assert.match(policy, /debug build/);
  assert.match(policy, /সবার জন্য দৃশ্যমান/);
});
