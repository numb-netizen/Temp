const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '../site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const entries = (html, subject) => [...html.matchAll(new RegExp(`data-subject="${subject}" data-chapter="(\\d+)"><span class="box"></span><span class="nm">([^<]+)</span>`, 'g'))].map(m => [Number(m[1]), m[2]]);
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

// Chapter names and order of the 2025–26 NCTB textbooks (full syllabus for HSC 2027).
const expected = {
  physics: {codes: ['১৭৪', '১৭৫'], first: ['ভৌতজগৎ ও পরিমাপ', 'ভেক্টর', 'গতিবিদ্যা', 'নিউটনিয়ান বলবিদ্যা', 'কাজ, শক্তি ও ক্ষমতা', 'মহাকর্ষ ও অভিকর্ষ', 'পদার্থের গাঠনিক ধর্ম', 'পর্যায়বৃত্ত গতি', 'তরঙ্গ', 'আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব'],
    second: ['তাপগতিবিদ্যা', 'স্থির তড়িৎ', 'চল তড়িৎ', 'তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব', 'তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ', 'জ্যামিতিক আলোকবিজ্ঞান', 'ভৌত আলোকবিজ্ঞান', 'আধুনিক পদার্থবিজ্ঞানের সূচনা', 'পরমাণুর মডেল এবং নিউক্লিয়ার পদার্থবিজ্ঞান', 'সেমিকন্ডাক্টর ও ইলেকট্রনিক্স', 'জ্যোতির্বিজ্ঞান']},
  chemistry: {codes: ['১৭৬', '১৭৭'], first: ['ল্যাবরেটরির নিরাপদ ব্যবহার', 'গুণগত রসায়ন', 'মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন', 'রাসায়নিক পরিবর্তন', 'কর্মমুখী রসায়ন'],
    second: ['পরিবেশ রসায়ন', 'জৈব রসায়ন', 'পরিমাণগত রসায়ন', 'তড়িৎ রসায়ন', 'অর্থনৈতিক রসায়ন']},
  math: {codes: ['২৬৫', '২৬৬'], first: ['ম্যাট্রিক্স ও নির্ণায়ক', 'ভেক্টর', 'সরলরেখা', 'বৃত্ত', 'বিন্যাস ও সমাবেশ', 'ত্রিকোণমিতিক অনুপাত', 'সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত', 'ফাংশন ও ফাংশনের লেখচিত্র', 'অন্তরীকরণ', 'যোগজীকরণ'],
    second: ['বাস্তব সংখ্যা ও অসমতা', 'যোগাশ্রয়ী প্রোগ্রাম', 'জটিল সংখ্যা', 'বহুপদী ও বহুপদী সমীকরণ', 'দ্বিপদী বিস্তৃতি', 'কণিক', 'বিপরীত ত্রিকোণমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ', 'স্থিতিবিদ্যা', 'সমতলে বস্তুকণার গতি', 'বিস্তার পরিমাপ ও সম্ভাবনা']},
  biology: {codes: ['১৭৮', '১৭৯'], first: ['কোষ ও এর গঠন', 'কোষ বিভাজন', 'কোষ রসায়ন', 'অণুজীব', 'শৈবাল ও ছত্রাক', 'ব্রায়োফাইটা ও টেরিডোফাইটা', 'নগ্নবীজী ও আবৃতবীজী উদ্ভিদ', 'টিস্যু ও টিস্যুতন্ত্র', 'উদ্ভিদ শারীরতত্ত্ব', 'উদ্ভিদ প্রজনন', 'জীবপ্রযুক্তি', 'জীবের পরিবেশ, বিস্তার ও সংরক্ষণ'],
    second: ['প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস', 'প্রাণীর পরিচিতি', 'পরিপাক ও শোষণ', 'রক্ত ও সঞ্চালন', 'শ্বাসক্রিয়া ও শ্বসন', 'বর্জ্য ও নিষ্কাশন', 'চলন ও অঙ্গচালনা', 'সমন্বয় ও নিয়ন্ত্রণ', 'মানব জীবনের ধারাবাহিকতা', 'মানবদেহের প্রতিরক্ষা', 'জিনতত্ত্ব ও বিবর্তন', 'প্রাণীর আচরণ']},
};

test('science subjects list every textbook chapter of both papers in order', () => {
  for (const [subject, book] of Object.entries(expected)) {
    const page = read(`${subject}.html`), list = entries(page, subject);
    const names = [...book.first.map(n => `১ম পত্র: ${n}`), ...book.second.map(n => `২য় পত্র: ${n}`)];
    assert.deepEqual(list.map(x => x[1]), names, subject);
    assert.deepEqual(entries(read('tracker.html'), subject), list, `${subject} tracker in sync`);
    const total = bn(names.length);
    assert.ok(page.includes(`<span class="cnt">০/${total}</span>`), `${subject} count`);
    assert.ok(read('science.html').includes(`${total}টি অধ্যায়।`), `${subject} science card`);
    // The old "what changed" box (paper codes, update date, kept ticks) was removed on request.
    assert.ok(!page.includes(`<strong>১ম পত্র (কোড ${book.codes[0]}):</strong>`), `${subject} change box removed`);
    assert.doesNotMatch(page, /যাচাই বাকি|বাছাই করা প্রস্তুতি|নির্বাচিত প্রস্তুতি/, `${subject} no longer marked unverified`);
  }
});

test('newly added chapters use fresh keys so no saved tick changes meaning', () => {
  const keys = subject => entries(read(`${subject}.html`), subject).map(x => x[0]);
  assert.deepEqual(keys('physics').slice(-3), [100, 101, 102]);
  assert.deepEqual(keys('biology').slice(10, 12), [10, 100], 'environment chapter closes the first paper');
  assert.equal(keys('biology').at(-1), 101);
  // The old wrong names are gone.
  const names = subject => entries(read(`${subject}.html`), subject).map(x => x[1]).join('|');
  assert.doesNotMatch(names('math'), /তলস্থ কণিকের গতি|রৈখিক প্রোগ্রামিং|স্ট্যাটিক্স|ডিফারেন্সিয়েশন/);
  assert.doesNotMatch(names('biology'), /রক্ত সঞ্চালন/);
});
