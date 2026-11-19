const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const entries = (s, subject) => [...s.matchAll(new RegExp(`data-subject="${subject}" data-chapter="(\\d+)"><span class="box"></span><span class="nm">([^<]+)</span>`, 'g'))].map(m => [m[1], m[2]]);

test('economics is a humanities subject, not a business-studies subject', () => {
  const index = read('index.html');
  const branch = dept => index.match(new RegExp(`<a class="tree-dept" href="${dept}\\.html">[\\s\\S]*?</div>\\s*</div>`))[0];
  assert.match(branch('arts'), /href="economics\.html">অর্থনীতি</);
  assert.doesNotMatch(branch('commerce'), /economics\.html/);
  assert.match(read('arts.html'), /href="economics\.html"/);
  assert.doesNotMatch(read('commerce.html'), /economics\.html|অর্থনীতি/);
  assert.doesNotMatch(read('marketing.html'), /economics\.html/);
  assert.match(read('economics.html'), /<a href="arts\.html">মানবিক বিভাগ<\/a>/);
});

// Chapter names and order from the একাদশ–দ্বাদশ textbook contents (checked November 2026).
const expected = {
  accounting: [10, 10, ['হিসাববিজ্ঞান পরিচিতি', 'রেওয়ামিল', 'একতরফা দাখিলা পদ্ধতি', 'অব্যবসায়ী প্রতিষ্ঠানের হিসাব', 'নগদ প্রবাহ বিবরণী', 'ব্যবস্থাপনা হিসাববিজ্ঞান পরিচিতি']],
  business: [12, 10, ['ব্যবসায়ের মৌলিক ধারণা', 'সমবায় সমিতি', 'ব্যবসায়ের নৈতিকতা ও সামাজিক দায়বদ্ধতা', 'ব্যবস্থাপনার ধারণা', 'কর্মীসংস্থান', 'নিয়ন্ত্রণ']],
  finance: [9, 14, ['অর্থায়নের সূচনা', 'ঝুঁকি এবং মুনাফার হার', 'ব্যাংক ব্যবস্থার প্রাথমিক ধারণা', 'বিবিধ বিমা']],
  marketing: [10, 10, ['উৎপাদন', 'সামষ্টিক পর্যায়ে উৎপাদন', 'লে-আউট বা বিন্যাস', 'বিপণন পরিচিতি', 'বিপণনের সমসাময়িক বিষয়াবলি']],
};
// Old keys whose topic was not a textbook chapter (or was ambiguous) must never be reused,
// otherwise a learner's old tick would appear on a different chapter.
const retired = {accounting: ['5', '7'], business: ['2', '3', '4', '5'], finance: ['4', '5'], marketing: ['3', '7']};

test('business-studies pages list both papers in textbook order and stay in sync with the tracker', () => {
  const tracker = read('tracker.html');
  for (const [subject, [first, second, samples]] of Object.entries(expected)) {
    const page = entries(read(subject + '.html'), subject);
    assert.deepEqual(entries(tracker, subject), page, subject);
    const names = page.map(x => x[1]);
    assert.equal(names.filter(n => n.startsWith('১ম পত্র: ')).length, first, subject + ' 1st paper');
    assert.equal(names.filter(n => n.startsWith('২য় পত্র: ')).length, second, subject + ' 2nd paper');
    const firstSecond = names.findIndex(n => n.startsWith('২য় পত্র: '));
    assert.ok(names.slice(firstSecond).every(n => n.startsWith('২য় পত্র: ')), subject + ' papers grouped');
    for (const name of samples) assert.ok(names.some(n => n.endsWith(': ' + name)), `${subject}: ${name}`);
    for (const key of retired[subject]) assert.ok(!page.some(x => x[0] === key), `${subject}: retired key ${key}`);
    assert.ok(tracker.includes(`<span class="cnt">০/${String(page.length).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d])}</span>`), subject + ' count');
  }
  for (const old of ['কম্পিউটারাইজড হিসাববিজ্ঞান', 'ই-ব্যবসা', 'লভ্যাংশ নীতি', 'মার্কেটিং গবেষণা']) assert.ok(!tracker.includes(old), old);
});
