const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {isNoIndex} = require('../scripts/generate-sitemap.cjs');
const site = path.join(__dirname,'..','site');
const base = 'https://hsc2027.de5.net';
const read = name => fs.readFileSync(path.join(site,name),'utf8');
const meta = (html, name) => [...html.matchAll(new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"\\s*>`, 'gi'))].map(m=>m[1]);
const pages = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]));
function filename(url) { return url.pathname === '/' ? 'index.html' : url.pathname.slice(1); }

test('every sitemap page has a unique title, description, matching canonical and share metadata', () => {
  const titles = new Set(), descriptions = new Set();
  for (const url of pages) {
    const file = filename(url), html = read(file);
    const title = [...html.matchAll(/<title>([^<]+)<\/title>/gi)].map(m=>m[1]);
    const description = meta(html,'description');
    const canonical = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)">/gi)].map(m=>m[1]);
    assert.equal(title.length,1,file); assert.equal(description.length,1,file); assert.equal(canonical.length,1,file);
    assert.ok(title[0].trim() && description[0].trim(),file);
    assert.equal(canonical[0],url.href,file); assert.equal(isNoIndex(html),false,file);
    assert.deepEqual(meta(html,'og:url'),canonical,file);
    assert.deepEqual(meta(html,'og:description'),description,file);
    assert.equal(meta(html,'og:title').length,1,file);
    assert.deepEqual(meta(html,'og:image'),[base+'/assets/study-logo.png'],file);
    assert.ok(!titles.has(title[0]),`duplicate title ${file}`); titles.add(title[0]);
    assert.ok(!descriptions.has(description[0]),`duplicate description ${file}`); descriptions.add(description[0]);
  }
  assert.ok(!read('index.html').includes('<title>হোম |'));
  for (const file of ['bangla-2.html','english-2.html']) assert.match(meta(read(file),'description')[0], /যাচাই/);
  assert.match(meta(read('hsc-2027-routine.html'),'description')[0],/চূড়ান্ত নয়/);
});

test('retired compatibility pages stay available but explicitly request no indexing', () => {
  for (const file of ['dabi.html','geography.html','bangladesh.html']) {
    assert.equal(isNoIndex(read(file)),true,file);
    assert.ok(!pages.some(url => filename(url) === file),file);
    assert.ok(read(file).includes(`href="${base}/${file}"`));
  }
  assert.match(read('geography.html'),/পূর্ণ পাঠ্যসূচি নয়/);
  assert.doesNotMatch(read('geography.html'),/সম্পূর্ণ সিলেবাস/);
});

test('home Website structured data is valid, accurate, and references the canonical homepage', () => {
  const html = read('index.html');
  const tags = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(tags.length,1);
  const data=JSON.parse(tags[0][1]);
  assert.equal(data['@context'],'https://schema.org'); assert.equal(data['@type'],'WebSite');
  assert.equal(data.url,base+'/'); assert.equal(data.inLanguage,'bn');
  assert.ok(data.name.includes('HSC 2027'));
});

test('all indexable pages can be discovered through ordinary links from the homepage', () => {
  const visited=new Set(), queue=['index.html'];
  while (queue.length) {
    const name=queue.shift(); if (visited.has(name) || !fs.existsSync(path.join(site,name))) continue;
    visited.add(name);
    for (const [,href] of read(name).matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const p = href.split(/[?#]/)[0];
      if (/^[A-Za-z0-9_.-]+\.html$/.test(p)) queue.push(p);
    }
  }
  for (const url of pages) assert.ok(visited.has(filename(url)),`unreachable: ${url.href}`);
});
