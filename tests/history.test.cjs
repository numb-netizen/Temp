const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');

test('humanities navigation and online classes point to history', () => {
  for (const name of ['index.html', 'arts.html', 'economics.html']) {
    assert.match(read(name), /href="history\.html"/);
    assert.doesNotMatch(read(name), /href="geography\.html"/);
  }
  const classes = read('classes.html');
  assert.match(classes, /<h3>ইতিহাস ১ম ও ২য় পত্র<\/h3>/);
  assert.ok(classes.includes(encodeURIComponent('ইতিহাস')));
});

test('history tracker entries match the subject page and do not reuse geography keys', () => {
  const entries = text => [...text.matchAll(/data-subject="history" data-chapter="(\d+)"><span class="box"><\/span><span class="nm">([^<]+)<\/span>/g)].map(m => [m[1], m[2]]);
  const subject = read('history.html'), tracker = read('tracker.html');
  assert.equal(entries(subject).length, 8);
  assert.deepEqual(entries(subject), entries(tracker));
  assert.doesNotMatch(subject, /data-subject="geography"/);
  assert.doesNotMatch(tracker, /data-subject="geography"/);
  assert.match(subject, /সম্পূর্ণ সিলেবাস নয়/);
});
