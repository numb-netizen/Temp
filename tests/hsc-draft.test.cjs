const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.join(__dirname, '..', 'site');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');

test('the news-based HSC schedule is partial, explicitly provisional and cites primary notice links', () => {
  const page = read('hsc-2027-routine.html');
  for (const text of ['চূড়ান্ত রুটিন নয়', 'এটি পূর্ণ রুটিন নয়', '১৪ মে ২০২৬', '১০ নভেম্বর ২০২৬', 'সিলেট শিক্ষা বোর্ড', 'সকালের শিফটে', 'https://sylhetboard.gov.bd/corner/hsc', 'https://ekhon.tv/article/6a05aa0cfce37566b5abf518', 'https://thedailycampus.com/academic-exam/254427']) assert.ok(page.includes(text), text);
  for (const [date, subject] of [['৬ জুন, রবিবার','বাংলা ১ম পত্র'],['১৪ জুন, সোমবার','তথ্য ও যোগাযোগ প্রযুক্তি'],['২৩ জুন, বুধবার','ইতিহাস ১ম পত্র'],['১ জুলাই, বৃহস্পতিবার','পৌরনীতি ও সুশাসন ১ম পত্র'],['৭ জুলাই, বুধবার','উচ্চতর গণিত ২য় পত্র']]) assert.ok(page.includes(`<tr><td>${date}</td><td>`) && page.match(new RegExp(`<tr><td>${date}</td><td>(.*?)</td>`))[1].includes(subject), `${date}: ${subject}`);
  const home = read('index.html');
  assert.ok(home.includes('href="hsc-2027-routine.html"'));
  assert.ok(home.includes('প্রস্তাবিত ৬ জুন ২০২৭ পর্যন্ত (চূড়ান্ত নয়)'));
  assert.ok(read('assets/app.js').includes('2027-06-06T10:00:00+06:00'));
  assert.ok(require('../scripts/offline-manifest.cjs').makeManifest(site).files.some(x => x.path === 'hsc-2027-routine.html'));
});

test('college sources are attributed and unverified portraits are not invented', () => {
  const college = read('college-info.html'), teachers = read('teachers.html');
  for (const item of ['১২৯৪১২','১৮০২','https://chugc.edu.bd/?page_id=167','http://services.nu.edu.bd/nu-app/college/profile/1802','প্রতিষ্ঠার সাল এক নয়']) assert.ok(college.includes(item), item);
  for (const item of ['মিলি আক্তার তমা','মোহাম্মদ সাফায়েত মিয়া','যাচাইযোগ্য পরিষ্কার ছবি পাওয়া যায়নি','https://chugc.edu.bd/']) assert.ok(teachers.includes(item), item);
});
