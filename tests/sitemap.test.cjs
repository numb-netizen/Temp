const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const site = path.join(__dirname, '..', 'site');
const base = 'https://hsc2027.de5.net';

test('sitemap is valid XML with one canonical URL for every public study page', () => {
  const xmlPath = path.join(site, 'sitemap.xml');
  const parser = `import json,sys,xml.etree.ElementTree as ET
root=ET.parse(sys.argv[1]).getroot()
ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
assert root.tag == ns+'urlset'
assert all(x.tag == ns+'url' and len(x)==1 and x[0].tag == ns+'loc' for x in root)
print(json.dumps([x[0].text for x in root]))`;
  const urls = JSON.parse(execFileSync('python3', ['-c', parser, xmlPath], {encoding: 'utf8'}));
  assert.equal(new Set(urls).size, urls.length, 'no duplicate URLs');
  const excluded = new Set(['dabi.html', 'geography.html', 'bangladesh.html', 'googleb7da7b15e33059e0.html']);
  const pages = fs.readdirSync(site).filter(n => n.endsWith('.html') && n !== 'index.html' && !excluded.has(n));
  const expected = [base + '/', ...pages.map(n => base + '/' + n)];
  assert.deepEqual([...urls].sort(), expected.sort());
  for (const url of urls) {
    const parsed = new URL(url);
    assert.equal(parsed.origin, base);
    assert.equal(parsed.search, ''); assert.equal(parsed.hash, '');
    const file = parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1);
    assert.ok(fs.existsSync(path.join(site, file)), url);
  }
});

test('robots.txt advertises the production sitemap without blocking crawling', () => {
  const robots = fs.readFileSync(path.join(site, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Sitemap: https:\/\/hsc2027\.de5\.net\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\//mi);
});

test('generator keeps sitemap current and excludes noindex and compatibility pages', () => {
  const os = require('node:os');
  const {makeSitemap, isNoIndex} = require('../scripts/generate-sitemap.cjs');
  assert.equal(makeSitemap(site), fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8'));
  for (const tag of ['<meta name="robots" content="noindex, follow">', "<meta content='NOINDEX' name='googlebot'>", '<META NAME=robots CONTENT=noindex>']) assert.equal(isNoIndex(tag), true, tag);
  assert.equal(isNoIndex('<meta name="robots" content="index, follow">'), false);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hsc-sitemap-'));
  try {
    for (const [file, content] of Object.entries({'index.html':'<h1>Home</h1>', 'public.html':'<h1>Public</h1>', 'new_page.html':'<h1>New</h1>', 'secret.html':'<meta content="noindex" name="robots">', 'bangladesh.html':'<meta name="robots" content="noindex">', 'dabi.html':'retired', 'geography.html':'retired', 'googleb7da7b15e33059e0.html':'verification'})) fs.writeFileSync(path.join(root, file), content);
    const xml = makeSitemap(root);
    assert.match(xml, /https:\/\/hsc2027\.de5\.net\/public\.html/);
    assert.match(xml, /new_page\.html/);
    assert.doesNotMatch(xml, /secret\.html|bangladesh\.html|dabi\.html|geography\.html|googleb7da7b15e33059e0\.html/);
    assert.doesNotMatch(xml, /<lastmod>/, 'do not fabricate modification dates');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
