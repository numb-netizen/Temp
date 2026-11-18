const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
test('desktop download links and runtime, offline and data limitations are visible', () => {
  const html = read('site/android-app.html');
  for (const item of ['desktop-lite-v0.2.1-beta/HSC-2027-Lite-0.2.1-beta-win-x64.zip','desktop-lite-v0.2.1-beta/HSC-2027-Lite-0.2.1-beta-linux.deb','WebView2 Runtime','.NET 10 Desktop Runtime','WebKitGTK 4.1','unsigned','স্থানান্তর হয় না']) assert.ok(html.includes(item), item);
});
test('lite builds bundle the site, deny permissions and gate releases on both smoke tests', () => {
  const win = read('desktop-lite/windows/Program.cs'), linux = read('desktop-lite/linux/hsc-lite.py');
  const ci = read('.github/workflows/desktop-lite.yml');
  assert.match(win, /CoreWebView2PermissionState\.Deny/);
  assert.match(win, /NavigationStarting/);
  assert.match(linux, /permission-request/);
  assert.match(linux, /decide-policy/);
  assert.match(ci, /needs: \[linux, windows\]/);
  assert.match(ci, /--smoke/);
  assert.match(read('desktop-lite/linux/build-deb.sh'), /cp -a site\/\./);
});
