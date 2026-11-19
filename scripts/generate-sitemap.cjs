// Produce a deterministic sitemap of public site pages, without claiming invented last-modified dates.
// At deploy time `--lastmod` adds each page's real last commit date from git history, which helps
// Bing and Google recrawl recently changed pages first. The committed sitemap stays date-free.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
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
function makeSitemap(root, {lastmod} = {}) {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Missing homepage');
  const pages = fs.readdirSync(root, {withFileTypes:true})
    .filter(entry => entry.isFile() && !entry.name.startsWith('.') && /\.html$/i.test(entry.name))
    .map(entry => entry.name).filter(name => name !== 'index.html' && !retired.has(name) && !/^google[a-f0-9]+\.html$/i.test(name))
    .filter(name => !isNoIndex(fs.readFileSync(path.join(root, name), 'utf8')))
    .sort();
  if (isNoIndex(fs.readFileSync(path.join(root, 'index.html'), 'utf8'))) throw new Error('Homepage marked noindex');
  const entries = [['index.html', BASE + '/'], ...pages.map(name => [name, BASE + '/' + encodeURIComponent(name)])];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.map(([name, url]) => {
      const date = lastmod && lastmod(name);
      return `  <url><loc>${url}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>\n`;
    }).join('') + '</urlset>\n';
}
// Real date (YYYY-MM-DD) of the last commit that touched a page; null when git has no history for it.
function gitLastmod(root) {
  return name => {
    try {
      const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', name], {cwd: root, encoding: 'utf8'}).trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
    } catch { return null; }
  };
}
if (require.main === module) {
  const root = path.resolve(__dirname, '..', 'site');
  const file = path.join(root, 'sitemap.xml');
  const expected = makeSitemap(root, process.argv.includes('--lastmod') ? {lastmod: gitLastmod(root)} : {});
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
module.exports = {makeSitemap, isNoIndex, gitLastmod};
