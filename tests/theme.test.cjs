const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '../site');
const script = fs.readFileSync(path.join(site, 'assets/theme.js'), 'utf8');

test('all navigable pages load the theme early, provide the control and cache assets offline', () => {
  const files = fs.readdirSync(site).filter(n => n.endsWith('.html'));
  let pages = 0;
  for (const name of files) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    if (!html.includes('assets/app-context.js?v=20261113')) continue;
    pages++;
    assert.ok(html.indexOf('assets/theme.js?v=1') < html.indexOf('assets/style.css'), name);
    assert.ok(html.indexOf('assets/theme.css?v=1') > html.indexOf('assets/heading-motion.css'), name);
    assert.match(html, /class="theme-toggle"[^>]*aria-label="লাইট মোড"[^>]*aria-pressed="false"[^>]*hidden/);
  }
  assert.equal(pages, 32);
  const manifest = require('../scripts/offline-manifest.cjs').makeManifest(site).files;
  for (const asset of ['assets/theme.js', 'assets/theme.css']) assert.ok(manifest.some(x => x.path === asset), asset);
});

function setup(saved, blocked = false) {
  const attrs = {}, buttonAttrs = {}, handlers = {}, docHandlers = {}, events = {}, icon = {};
  const root = {setAttribute(k,v) { attrs[k] = v; }};
  const button = {hidden:true, setAttribute(k,v) {buttonAttrs[k] = v;}, querySelector() {return icon;}, addEventListener(k,fn) {handlers[k] = fn;}};
  const document = {documentElement:root, readyState:'loading', querySelector(s) {return s === '.theme-toggle' ? button : null;}, addEventListener(k,fn) {docHandlers[k] = fn;}};
  const storage = {getItem() {if (blocked) throw Error('blocked'); return saved;}, setItem(k,v) {if (blocked) throw Error('blocked'); saved = v;}};
  vm.runInNewContext(script, {document, localStorage:storage, window:{addEventListener(k,fn) {events[k] = fn;}}});
  return {attrs,buttonAttrs,button,icon,handlers,docHandlers,events,getSaved:() => saved};
}
test('defaults dark, toggles both ways, persists and syncs across tabs', () => {
  const x = setup(null);
  assert.equal(x.attrs['data-theme'], 'dark');
  x.docHandlers.DOMContentLoaded();
  assert.equal(x.button.hidden, false);
  assert.equal(x.buttonAttrs['aria-pressed'], 'false');
  x.handlers.click();
  assert.equal(x.attrs['data-theme'], 'light');
  assert.equal(x.buttonAttrs['aria-pressed'], 'true');
  assert.equal(x.getSaved(), 'light');
  assert.equal(setup(x.getSaved()).attrs['data-theme'], 'light');
  x.handlers.click();
  assert.equal(x.attrs['data-theme'], 'dark');
  assert.equal(x.getSaved(), 'dark');
  x.events.storage({key:'site:theme', newValue:'light'});
  assert.equal(x.attrs['data-theme'], 'light');
  x.events.storage({key:null});
  assert.equal(x.attrs['data-theme'], 'dark');
});
test('blocked storage and invalid preferences fall back safely', () => {
  const x = setup('light', true);
  assert.equal(x.attrs['data-theme'], 'dark');
  x.docHandlers.DOMContentLoaded();
  x.handlers.click();
  assert.equal(x.attrs['data-theme'], 'light');
  assert.equal(setup('surprise').attrs['data-theme'], 'dark');
});
