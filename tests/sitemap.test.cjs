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
