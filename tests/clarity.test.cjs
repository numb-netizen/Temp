const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const code = read('assets/clarity.js');
const tag = '<script src="assets/clarity.js?v=1" async></script>';
const indexed = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname.slice(1) || 'index.html');

function run(hostname) {
  const inserted = [];
  const first = {parentNode: {insertBefore: el => inserted.push(el)}};
  const window = {};
  vm.runInNewContext(code, {window, location: {hostname}, document: {
    createElement: () => ({}), getElementsByTagName: () => [first],
  }});
  return {inserted, window};
}

test('Clarity loads once on every indexed page and nowhere else', () => {
  for (const file of fs.readdirSync(site).filter(n => n.endsWith('.html'))) {
    const html = read(file), count = html.split('assets/clarity.js').length - 1;
    assert.equal(count, indexed.includes(file) ? 1 : 0, file);
    if (count) assert.ok(html.includes(tag), file);
  }
  assert.equal(indexed.length, 32);
});

test('Clarity uses the Bing Webmaster project and only runs on the live site', () => {
  const live = run('hsc2027.de5.net');
  assert.equal(live.inserted.length, 1);
  assert.equal(live.inserted[0].src, 'https://www.clarity.ms/tag/zg4l4nikx2?ref=bwt');
  assert.equal(live.inserted[0].async, 1);
  assert.equal(typeof live.window.clarity, 'function');
  for (const host of ['127.0.0.1', 'localhost', 'numb-netizen.github.io', 'site']) assert.equal(run(host).inserted.length, 0, host);
});

test('feedback text is masked in recordings, and no visitor notice is shown', () => {
  assert.match(read('feedback.html'), /<form class="feedback-form" id="feedback-form" data-clarity-mask="True">/);
  for (const file of indexed) {
    const footer = (read(file).match(/<footer[\s\S]*?<\/footer>/) || [''])[0];
    assert.doesNotMatch(footer, /Clarity/i, file);
  }
});
