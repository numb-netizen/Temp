const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {isInternal, isExternal, resolveSitePath} = require('../desktop/policy.cjs');

test('desktop navigation separates bundled pages and safe external links', () => {
  for (const url of ['hscapp://site/index.html', 'hscapp://site/tracker.html#test']) assert.equal(isInternal(url), true);
  for (const url of ['hscapp://evil/index.html', 'file:///etc/passwd', 'javascript:alert(1)', 'https://site/index.html', 'hscapp://site.evil/index.html', 'hscapp://site:123/index.html']) assert.equal(isInternal(url), false, url);
  for (const url of ['https://youtube.com/', 'http://example.com/', 'mailto:test@example.org', 'tel:+8801234']) assert.equal(isExternal(url), true, url);
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'hscapp://site/index.html', 'https://user:pass@example.com/']) assert.equal(isExternal(url), false, url);
});

test('desktop protocol only resolves paths inside the bundled site', () => {
  const root = path.resolve(__dirname, '../site');
  assert.equal(resolveSitePath(root, 'hscapp://site/'), path.join(root,'index.html'));
  assert.equal(resolveSitePath(root, 'hscapp://site/assets/style.css?v=1'), path.join(root,'assets','style.css'));
  for (const url of ['file:///etc/passwd','hscapp://evil/index.html','hscapp://site/%00secret','hscapp://site/%5c..%5csecret','hscapp://site/%E0%A4%A']) assert.equal(resolveSitePath(root,url), null, url);
  // URL normalization may normalize .. but must always remain inside the site.
  const resolved = resolveSitePath(root, 'hscapp://site/%2e%2e/desktop/main.cjs');
  assert.ok(!resolved || resolved.startsWith(root + path.sep));
});

test('desktop packages a site snapshot and hardens the renderer', () => {
  const root = path.join(__dirname,'..');
  const pkg = require('../desktop/package.json');
  const main = fs.readFileSync(path.join(root,'desktop/main.cjs'),'utf8');
  assert.ok(pkg.build.extraResources.some(r=>r.from==='../site' && r.to==='site'));
  for (const s of ['nodeIntegration:false','contextIsolation:true','sandbox:true','setWindowOpenHandler','setPermissionRequestHandler']) assert.ok(main.includes(s),s);
  assert.match(main, /hscapp:\/\/site\/index\.html/);
  assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);
});
