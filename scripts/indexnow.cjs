// Tell Bing (and the other IndexNow engines: Yandex, Seznam, Naver, Yep) which public pages changed,
// so they are recrawled within minutes instead of waiting for the next routine crawl.
// Protocol: https://www.indexnow.org/documentation
//
//   node scripts/indexnow.cjs --before <sha> --after <sha>   submit pages changed between two commits
//   node scripts/indexnow.cjs --all                          submit every page in the sitemap
//   add --dry-run to print the request without sending it
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const BASE = 'https://hsc2027.de5.net';
const HOST = new URL(BASE).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE = path.resolve(__dirname, '..', 'site');

// The key is public by design: the engines verify ownership by fetching https://<host>/<key>.txt.
function findKey(root = SITE) {
  const keys = fs.readdirSync(root).filter(name => /^[a-f0-9]{32}\.txt$/.test(name))
    .filter(name => fs.readFileSync(path.join(root, name), 'utf8').trim() === name.slice(0, -4));
  if (keys.length !== 1) throw new Error(`Expected exactly one IndexNow key file in site/, found ${keys.length}`);
  return keys[0].slice(0, -4);
}

function sitemapUrls(root = SITE) {
  return [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

const pageUrl = file => BASE + '/' + (file === 'index.html' ? '' : encodeURIComponent(file));

// Map changed repository paths to the public URLs worth recrawling.
// `deleted` pages are included too: a 404 tells the engines to drop them from results quickly.
function urlsForChanges(changes, publicUrls) {
  const wanted = new Set(publicUrls);
  const out = new Set();
  for (const {status, file} of changes) {
    const m = /^site\/([^/]+\.html)$/.exec(file);
    if (!m || /^google[a-f0-9]+\.html$/i.test(m[1])) continue;
    const url = pageUrl(m[1]);
    if (wanted.has(url) || status === 'D') out.add(url);
  }
  return [...out].sort();
}

const git = args => execFileSync('git', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20});
// Cache-busting bumps such as style.css?v=20261120 touch every page without changing what it says.
const withoutAssetVersions = html => html.replace(/\?v=[^"'\s>]*/g, '');
function onlyAssetVersionsChanged(before, after, file) {
  try { return withoutAssetVersions(git(['show', `${before}:${file}`])) === withoutAssetVersions(git(['show', `${after}:${file}`])); }
  catch { return false; }
}

function changedFiles(before, after) {
  return git(['diff', '--name-status', '--no-renames', before, after, '--', 'site']).split('\n').filter(Boolean)
    .map(line => { const [status, file] = line.split('\t'); return {status: status[0], file}; })
    .filter(({status, file}) => !(status === 'M' && file.endsWith('.html') && onlyAssetVersionsChanged(before, after, file)));
}

function payload(urlList, key) {
  return {host: HOST, key, keyLocation: `${BASE}/${key}.txt`, urlList};
}

async function waitForKey(key, tries = 12) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(`${BASE}/${key}.txt?check=${Date.now()}`, {cache: 'no-store'});
      if (res.ok && (await res.text()).trim() === key) return true;
    } catch {}
    if (i < tries) await new Promise(r => setTimeout(r, 10_000));
  }
  return false;
}

async function main(argv) {
  const arg = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const dry = argv.includes('--dry-run');
  const key = findKey();
  const all = sitemapUrls();
  const before = arg('--before'), after = arg('--after') || 'HEAD';
  let urls;
  if (argv.includes('--all') || !before || /^0+$/.test(before)) {
    urls = all;
  } else {
    try { urls = urlsForChanges(changedFiles(before, after), all); }
    catch { console.log(`Could not compare ${before}..${after}; submitting every page`); urls = all; }
  }
  if (!urls.length) { console.log('IndexNow: no public page changed, nothing to submit'); return 0; }
  const body = payload(urls, key);
  console.log(`IndexNow: ${urls.length} URL(s)\n  ` + urls.join('\n  '));
  if (dry) { console.log(JSON.stringify(body, null, 2)); return 0; }

  if (!(await waitForKey(key))) {
    console.log(`::warning::IndexNow key file ${body.keyLocation} is not live yet; skipped submission`);
    return 1;
  }
  const res = await fetch(ENDPOINT, {method: 'POST', headers: {'Content-Type': 'application/json; charset=utf-8'}, body: JSON.stringify(body)});
  const text = (await res.text()).slice(0, 300);
  // 200 = accepted, 202 = accepted while the key is still being verified.
  if (res.status === 200 || res.status === 202) { console.log(`IndexNow accepted the submission (HTTP ${res.status})`); return 0; }
  console.log(`::warning::IndexNow submission failed: HTTP ${res.status} ${text}`);
  return 1;
}

if (require.main === module) main(process.argv.slice(2)).then(code => { process.exitCode = code; }, e => { console.error(e); process.exitCode = 1; });
module.exports = {withoutAssetVersions, findKey, sitemapUrls, urlsForChanges, payload, pageUrl, BASE, HOST, ENDPOINT};
