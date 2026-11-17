// Produce a deterministic sitemap of public site pages, without claiming invented last-modified dates.
const fs = require('node:fs');
const path = require('node:path');
const BASE = 'https://hsc2027.de5.net';
// Compatibility pages remain available to existing links but are intentionally not promoted.
const retired = new Set(['dabi.html', 'geography.html']);

function isNoIndex(html) {
  // Inspect individual meta elements regardless of attribute order, quote style or case.
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some(([tag]) => {
    const name = tag.match(/\bname\s*=\s*["']?([^\s"'/>]+)/i)?.[1];
    const content = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const value = content && (content[1] ?? content[2] ?? content[3]);
    return /^(?:robots|googlebot)$/i.test(name || '') && /(?:^|[\s,])noindex(?:$|[\s,])/i.test(value || '');
  });
}
function makeSitemap(root) {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Missing homepage');
  const pages = fs.readdirSync(root, {withFileTypes:true})
    .filter(entry => entry.isFile() && !entry.name.startsWith('.') && /\.html$/i.test(entry.name))
    .map(entry => entry.name).filter(name => name !== 'index.html' && !retired.has(name) && !/^google[a-f0-9]+\.html$/i.test(name))
    .filter(name => !isNoIndex(fs.readFileSync(path.join(root, name), 'utf8')))
    .sort();
  if (isNoIndex(fs.readFileSync(path.join(root, 'index.html'), 'utf8'))) throw new Error('Homepage marked noindex');
  const urls = [BASE + '/', ...pages.map(name => BASE + '/' + encodeURIComponent(name))];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(url => `  <url><loc>${url}</loc></url>\n`).join('') + '</urlset>\n';
}
if (require.main === module) {
  const root = path.resolve(__dirname, '..', 'site');
  const file = path.join(root, 'sitemap.xml');
  const expected = makeSitemap(root);
  if (process.argv.slice(2).includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== expected) {
      console.error('Sitemap is out of date: run node scripts/generate-sitemap.cjs');
      process.exitCode = 1;
    } else console.log('Sitemap is up to date');
  } else {
    fs.writeFileSync(file, expected);
    console.log('Sitemap generated');
  }
}
module.exports = {makeSitemap, isNoIndex};
