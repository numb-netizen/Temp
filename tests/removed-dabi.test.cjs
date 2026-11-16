const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');

test('retired appeal is not linked or shown in site pages', () => {
  for (const file of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, file), 'utf8');
    assert.doesNotMatch(html, /href="dabi\.html/ , file);
    assert.doesNotMatch(html, /id="support-form"|dabi_public_supporters/, file);
  }
});
test('old URL and old assets replace the bundled page and cannot submit forms', () => {
  const page = fs.readFileSync(path.join(site, 'dabi.html'), 'utf8');
  assert.match(page, /পেজটি সরানো হয়েছে/);
  assert.match(page, /href="index.html"/);
  assert.doesNotMatch(page, /assets\/dabi\.(js|css)|support-list|support-form/);
  for (const file of ['dabi.js','dabi.css']) {
    const stub = fs.readFileSync(path.join(site, 'assets', file), 'utf8');
    assert.doesNotMatch(stub, /supabase|fetch\(|support-form/);
  }
  const {makeManifest} = require('../scripts/offline-manifest.cjs');
  const paths = makeManifest(site).files.map(f => f.path);
  for (const p of ['dabi.html','assets/dabi.js','assets/dabi.css']) assert.ok(paths.includes(p), p);
});
