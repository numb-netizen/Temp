const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');

test('every page links its contact menu to a WhatsApp link and displays the username', () => {
  for (const name of fs.readdirSync(site).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    const nav = html.match(/<div class="links" id="navLinks">([\s\S]*?)<\/div>/);
    assert.ok(nav, name);
    assert.match(nav[1], /href="#contact">যোগাযোগ<\/a>/, name);
    assert.equal((html.match(/id="contact"/g) || []).length, 1, name);
    assert.match(html, /href="https:\/\/wa\.me\/8801974500165" target="_blank" rel="noopener noreferrer"/, name);
    assert.match(html, /\+880 1974-500165/, name);
    assert.match(html, /@Mahadin321/, name);
  }
});
