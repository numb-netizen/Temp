// Mirror each page's visible breadcrumb trail (div.crumbs) as schema.org BreadcrumbList data, so
// Bing and Google can show "হোম › বিজ্ঞান বিভাগ › পদার্থবিজ্ঞান" instead of a bare URL in results.
// The structured data is generated from the visible links, so the two can never disagree.
//   node scripts/breadcrumbs.cjs          update every page in the sitemap
//   node scripts/breadcrumbs.cjs --check  fail when any page is out of date
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'https://hsc2027.de5.net';
const SITE = path.resolve(__dirname, '..', 'site');
const LD = /\n?<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList"[^<]*<\/script>/;
const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = href => BASE + '/' + (href === 'index.html' ? '' : href);

function crumbsOf(html, file) {
  const block = /<div class="crumbs">([\s\S]*?)<\/div>/.exec(html);
  if (!block) return null;
  const items = [...block[1].matchAll(/<a href="([^"#?]+\.html)">([\s\S]*?)<\/a>/g)].map(([, href, name]) => ({name: strip(name), url: abs(href)}));
  const current = /<span class="cur">([\s\S]*?)<\/span>/.exec(block[1]);
  if (!items.length || !current) return null;
  return [...items, {name: strip(current[1]), url: abs(file)}];
}

function breadcrumbTag(crumbs) {
  const data = {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, name: c.name, item: c.url}))};
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function withBreadcrumbs(html, file) {
  const crumbs = crumbsOf(html, file);
  const clean = html.replace(LD, '');
  if (!crumbs) return clean;
  return clean.replace(/(<meta property="og:image"[^>]*>)/, `$1\n${breadcrumbTag(crumbs)}`);
}

function sitemapFiles(root = SITE) {
  return [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => new URL(m[1]).pathname.slice(1) || 'index.html');
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const file of sitemapFiles()) {
    const p = path.join(SITE, file), html = fs.readFileSync(p, 'utf8'), next = withBreadcrumbs(html, file);
    if (next === html) continue;
    stale.push(file);
    if (!check) fs.writeFileSync(p, next);
  }
  if (check && stale.length) { console.error('Breadcrumb data out of date: ' + stale.join(', ') + '\nrun node scripts/breadcrumbs.cjs'); process.exitCode = 1; }
  else console.log(check ? 'Breadcrumb data is up to date' : `Breadcrumb data updated on ${stale.length} page(s)`);
}
module.exports = {crumbsOf, breadcrumbTag, withBreadcrumbs, sitemapFiles};
