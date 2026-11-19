const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {withoutAssetVersions, findKey, sitemapUrls, urlsForChanges, payload, BASE, HOST, ENDPOINT} = require('../scripts/indexnow.cjs');
const {makeSitemap, gitLastmod} = require('../scripts/generate-sitemap.cjs');
const {crumbsOf, withBreadcrumbs, sitemapFiles} = require('../scripts/breadcrumbs.cjs');

const root = path.join(__dirname, '..');
const site = path.join(root, 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');

test('one IndexNow key file is published at the site root and contains exactly its own key', () => {
  const key = findKey();
  assert.match(key, /^[a-f0-9]{32}$/);
  assert.equal(read(`${key}.txt`), key, 'no trailing newline or extra text');
  assert.ok(!read('sitemap.xml').includes(key), 'key file is not a page to index');
  assert.match(fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8'), /path: \.\/site\n/, 'whole site folder is deployed');
});

test('IndexNow request follows the protocol: host, key, matching keyLocation, absolute site URLs', () => {
  const key = findKey(), urls = sitemapUrls();
  assert.equal(ENDPOINT, 'https://api.indexnow.org/indexnow');
  const body = payload(urls, key);
  assert.deepEqual(Object.keys(body), ['host', 'key', 'keyLocation', 'urlList']);
  assert.equal(body.host, HOST); assert.equal(HOST, 'hsc2027.de5.net');
  assert.equal(body.keyLocation, `${BASE}/${key}.txt`);
  assert.ok(body.urlList.length >= 30 && body.urlList.length <= 10000);
  for (const url of body.urlList) assert.equal(new URL(url).host, HOST, url);
  const out = execFileSync(process.execPath, ['scripts/indexnow.cjs', '--all', '--dry-run'], {cwd: root, encoding: 'utf8'});
  assert.match(out, new RegExp(`IndexNow: ${urls.length} URL\\(s\\)`));
  assert.ok(out.includes(`"keyLocation": "${BASE}/${key}.txt"`));
});

test('only changed public pages are submitted; assets, retired and verification pages are not', () => {
  const urls = sitemapUrls();
  const changes = [
    {status: 'M', file: 'site/index.html'}, {status: 'M', file: 'site/physics.html'},
    {status: 'M', file: 'site/assets/style.css'}, {status: 'A', file: 'site/assets/parents-meeting-notice-2026.jpg'},
    {status: 'M', file: 'site/dabi.html'}, {status: 'M', file: 'site/googleb7da7b15e33059e0.html'},
    {status: 'M', file: 'tests/seo.test.cjs'}, {status: 'D', file: 'site/old-page.html'},
  ];
  assert.deepEqual(urlsForChanges(changes, urls), [`${BASE}/`, `${BASE}/old-page.html`, `${BASE}/physics.html`]);
  assert.deepEqual(urlsForChanges([{status: 'M', file: 'site/assets/app.js'}], urls), []);
});

test('a cache-busting ?v= bump alone does not count as a content change', () => {
  const a = '<link rel="stylesheet" href="assets/style.css?v=20261119-ict"><script src="assets/app.js?v=1" defer></script><p>নোটিশ</p>';
  const b = '<link rel="stylesheet" href="assets/style.css?v=20261120-notice"><script src="assets/app.js?v=2" defer></script><p>নোটিশ</p>';
  assert.equal(withoutAssetVersions(a), withoutAssetVersions(b));
  assert.notEqual(withoutAssetVersions(a), withoutAssetVersions(b.replace('নোটিশ', 'নতুন নোটিশ')));
});

test('Pages deploy pings IndexNow after the deployment, never blocking it, with full git history', () => {
  const yml = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.match(yml, /fetch-depth: 0/);
  assert.match(yml, /node scripts\/generate-sitemap\.cjs --lastmod/);
  const deploy = yml.indexOf('uses: actions/deploy-pages@v4'), ping = yml.indexOf('name: Notify Bing via IndexNow');
  assert.ok(deploy > 0 && ping > deploy, 'submission happens only once the new pages are live');
  assert.match(yml.slice(ping), /continue-on-error: true/);
  assert.match(yml.slice(ping), /--before "\$BEFORE" --after "\$GITHUB_SHA"/);
  assert.match(yml.slice(ping), /node scripts\/indexnow\.cjs --all/);
  assert.match(yml, /indexnow_all:/);
});

test('deploy-time sitemap carries real git dates while the committed sitemap stays date-free', () => {
  assert.doesNotMatch(read('sitemap.xml'), /lastmod/);
  const xml = makeSitemap(site, {lastmod: name => name === 'index.html' ? '2026-11-19' : null});
  assert.match(xml, /<url><loc>https:\/\/hsc2027\.de5\.net\/<\/loc><lastmod>2026-11-19<\/lastmod><\/url>/);
  assert.match(xml, /<url><loc>https:\/\/hsc2027\.de5\.net\/physics\.html<\/loc><\/url>/);
  assert.match(gitLastmod(site)('index.html'), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(gitLastmod(site)('no-such-page.html'), null);
});

test('every indexed sub-page mirrors its visible breadcrumb trail as valid BreadcrumbList data', () => {
  execFileSync(process.execPath, ['scripts/breadcrumbs.cjs', '--check'], {cwd: root});
  const files = sitemapFiles(), urls = new Set(sitemapUrls());
  let count = 0;
  for (const file of files) {
    const html = read(file);
    const tags = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => JSON.parse(m[1])).filter(d => d['@type'] === 'BreadcrumbList');
    if (file === 'index.html') { assert.equal(tags.length, 0); continue; }
    assert.equal(tags.length, 1, file); count++;
    const items = tags[0].itemListElement, crumbs = crumbsOf(html, file);
    assert.deepEqual(items.map(i => i.name), crumbs.map(c => c.name), file);
    assert.deepEqual(items.map(i => i.position), items.map((_, i) => i + 1), file);
    assert.equal(items[0].item, `${BASE}/`); assert.equal(items.at(-1).item, `${BASE}/${file}`);
    for (const i of items) assert.ok(urls.has(i.item), `${file}: ${i.item} is an indexed page`);
    assert.equal(withBreadcrumbs(html, file), html, 'regenerating is a no-op');
  }
  assert.equal(count, files.length - 1);
  const physics = JSON.stringify(crumbsOf(read('physics.html'), 'physics.html').map(c => c.name));
  assert.equal(physics, JSON.stringify(['হোম', 'বিজ্ঞান বিভাগ', 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র']));
});

test('home page title leads with the searched name instead of the word "হোম"', () => {
  const html = read('index.html');
  assert.match(html, /<title>HSC 2027 স্টাডি প্ল্যাটফর্ম — চুনারুঘাট সরকারি কলেজ, হবিগঞ্জ<\/title>/);
  assert.match(html, /name="description" content="[^"]*Chunarughat Government College, Habiganj[^"]*"/);
  const site = JSON.parse(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"WebSite".*?)<\/script>/.exec(html)[1]);
  assert.ok(site.alternateName.includes('HSC 2027 Chunarughat Government College'));
});
