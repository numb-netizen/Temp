const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');

test('subject pages no longer show "what changed" boxes about list updates and kept ticks', () => {
  for (const name of fs.readdirSync(site).filter(n => n.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(site, name), 'utf8');
    for (const [box] of html.matchAll(/<div class="tip[^"]*"[^>]*>[\s\S]*?<\/div>/g)) {
      assert.doesNotMatch(box, /হালনাগাদ করা হয়েছে|আগে দেওয়া টিক|সংরক্ষিত টিক রাখা আছে|আগে তালিকায় ছিল না/, `${name}: change-information box`);
    }
  }
  // The chapter checklists themselves are untouched.
  const physics = fs.readFileSync(path.join(site, 'physics.html'), 'utf8');
  assert.equal((physics.match(/class="chap" data-subject="physics"/g) || []).length, 21);
});
