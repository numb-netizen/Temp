const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');

test('humanities links to sociology, without changing commerce', () => {
  const artsTree = read('index.html').split('<a class="tree-dept" href="arts.html">')[1].split('</div>')[0];
  assert.match(artsTree, /href="sociology\.html"/);
  assert.doesNotMatch(artsTree, /href="bangladesh\.html"/);
  for (const name of ['arts.html', 'civics.html']) {
    assert.match(read(name), /href="sociology\.html"/);
    assert.doesNotMatch(read(name), /href="bangladesh\.html"/);
  }
  assert.match(read('commerce.html'), /href="bangladesh\.html"/);
  assert.match(read('classes.html'), /<h3>সমাজবিজ্ঞান ১ম ও ২য় পত্র<\/h3>/);
  assert.ok(read('classes.html').includes(encodeURIComponent('সমাজবিজ্ঞান')));
});

test('sociology tracker uses the same separate keys and topics as the subject page', () => {
  const entries = text => [...text.matchAll(/data-subject="sociology" data-chapter="(\d+)"><span class="box"><\/span><span class="nm">([^<]+)<\/span>/g)].map(m => [m[1], m[2]]);
  const subject = read('sociology.html'), tracker = read('tracker.html');
  assert.equal(entries(subject).length, 8);
  assert.deepEqual(entries(subject), entries(tracker));
  assert.doesNotMatch(subject, /data-subject="bangladesh"/);
  assert.match(tracker, /data-subject="bangladesh"/);
  assert.match(subject, /সম্পূর্ণ সিলেবাস নয়/);
});
