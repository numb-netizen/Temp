const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Bing verification file is published unmodified at the site root', () => {
  const file = path.join(__dirname, '..', 'site', 'BingSiteAuth.xml');
  assert.equal(fs.readFileSync(file, 'utf8'), '<?xml version="1.0"?>\n<users>\n\t<user>76A0C77A1435B5695135852A5F05F622</user>\n</users>');
});
