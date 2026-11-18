const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '../site');
const read = p => fs.readFileSync(path.join(site,p), 'utf8');
test('every navigable page has a prominent in-flow feedback link', () => {
  const files = fs.readdirSync(site).filter(n => n.endsWith('.html') && n !== 'googleb7da7b15e33059e0.html');
  for (const file of files) {
    const html = read(file);
    assert.match(html, /<a class="nav-cta feedback-cta" href="feedback\.html"/, file);
    assert.ok(html.indexOf('feedback-cta') < html.indexOf('</nav>'), file);
    assert.match(html, /href="tracker\.html"/, file);
  }
  assert.match(read('assets/feedback-nav.css'), /\.nav-cta\.feedback-cta\{display:inline-flex/);
  assert.match(read('assets/feedback-nav.css'), /@media\(max-width:1200px\)\{\.nav-cta\.feedback-cta/);
});
test('feedback prepares a public issue without secrets or pretending it is already submitted', () => {
  const html = read('feedback.html');
  assert.match(html, /<form[^>]*action="https:\/\/github\.com\/numb-netizen\/Temp\/issues\/new"[^>]*method="get"/);
  assert.match(html, /name="title"[^>]*required[^>]*maxlength="120"/);
  assert.match(html, /name="body"[^>]*required[^>]*maxlength="500"/);
  for (const text of ['Issue সবাই দেখতে পারে','GitHub অ্যাকাউন্টে লগইন','শুধু ফর্ম পূরণ করলে Issue তৈরি হয় না','Submit new issue','security/advisories/new','পাবলিক Issue-তে লিখো না']) assert.ok(html.includes(text),text);
  const manifest = require('../scripts/offline-manifest.cjs').makeManifest(site).files;
  for (const asset of ['feedback.html','assets/feedback.css','assets/feedback-nav.css']) assert.ok(manifest.some(x => x.path === asset), asset);
});
test('security policy routes sensitive reports privately and ordinary reports publicly', () => {
  const policy = fs.readFileSync(path.join(__dirname,'../SECURITY.md'),'utf8');
  assert.match(policy, /security\/advisories\/new/);
  assert.match(policy, /feedback\.html/);
  assert.match(policy, /unsigned/);
  assert.match(policy, /debug build/);
  assert.match(policy, /সবার জন্য দৃশ্যমান/);
});
