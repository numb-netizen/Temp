const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Google verification file is published unmodified at the site root', () => {
  const file = path.join(__dirname, '..', 'site', 'googleb7da7b15e33059e0.html');
  assert.equal(fs.readFileSync(file, 'utf8'), 'google-site-verification: googleb7da7b15e33059e0.html');
});
