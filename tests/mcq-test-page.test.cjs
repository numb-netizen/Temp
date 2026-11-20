const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mcq = require('../scripts/mcq.cjs');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const page = read('site/mcq-test.html');
const js = read('site/assets/mcq-test.js');
const bangla = read('site/bangla.html');
const live = read('supabase/migrations/20261120151659_mcq_bangla_live_test.sql');
const PLAYLIST = 'https://www.youtube.com/playlist?list=PLrmBq0y6Fwt9jW2Z0XCyKLtAONto63uG-';

test('a later batch file continues a chapter\'s numbering instead of reusing earlier codes', () => {
  const qs = mcq.loadQuestions();
  const byCode = Object.fromEntries(qs.map(q => [q.code, q]));
  assert.equal(new Set(qs.map(q => q.code)).size, qs.length, 'codes are unique across files');
  // Five Gemini questions already own bangla-029-001…005; the playlist batch starts at 006.
  for (let i = 1; i <= 5; i++) assert.equal(byCode[`bangla-029-00${i}`].file, 'bangla-gemini-batch.json');
  assert.equal(byCode['bangla-029-006'].file, 'bangla-playlist-batch.json');
  assert.equal(byCode['bangla-000-006'].file, 'bangla-playlist-batch.json');
  // Codes already stored in Supabase and the Sheet do not move.
  assert.equal(byCode['bangla-029-001'].stem, "'বিভীষণের প্রতি মেঘনাদ' কাব্যাংশটি 'মেঘনাদবধ কাব্য'-এর কোন সর্গ থেকে নেওয়া হয়েছে?");
  assert.equal(byCode['physics-000-001'].file, 'ai-draft-batch-1.json');
  const playlist = qs.filter(q => q.file === 'bangla-playlist-batch.json');
  assert.equal(playlist.length, 64);
  assert.ok(playlist.every(q => q.subject === 'bangla' && q.status === 'draft' && /ইউটিউব প্লেলিস্ট/.test(q.source_note)));
  assert.equal(qs.length, 513);
});

test('live-test migration only opens Bangla drafts for reading, never rejected rows, never writes', () => {
  assert.match(live, /CREATE POLICY mcq_questions_public_read_bangla_drafts ON public\.mcq_questions FOR SELECT TO anon, authenticated\s+USING \(subject = 'bangla' AND status = 'draft'\);/);
  const sql = live.replace(/--.*$/gm, '');
  assert.doesNotMatch(sql, /rejected/);
  assert.doesNotMatch(sql, /\bGRANT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bALTER\b/i, 'no grants, writes or schema changes');
  assert.match(read('supabase/migrations/20261118120000_mcq_bank.sql'), /USING \(status = 'verified'\);/, 'the verified-only policy is untouched');
});

test('the test page reads only public columns of Bangla questions with the publishable key', () => {
  const api = /var API = '([^']+)' \+\s*'([^']+)'/.exec(js);
  assert.ok(api);
  const url = new URL(api[1] + api[2]);
  assert.equal(url.origin, 'https://jwzznffykcxghigkwzab.supabase.co');
  assert.equal(url.searchParams.get('subject'), 'eq.bangla');
  assert.deepEqual(url.searchParams.get('select').split(','), ['code', 'chapter_no', 'stem', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'explanation', 'difficulty']);
  assert.doesNotMatch(js, /source_note|verified_by|eyJhbGciOi|sb_secret_|service_role/);
  assert.match(js, /sb_publishable_[\w-]+/);
  assert.match(js, /AbortController/);
  assert.match(js, /প্রশ্ন লোড করা যায়নি/, 'friendly error when offline');
  assert.doesNotMatch(js, /innerHTML/, 'question text is inserted as text, never as HTML');
});

test('the page warns that questions are unverified AI drafts and offers every chapter that has questions', () => {
  assert.match(page, /AI-লিখিত খসড়া প্রশ্ন/);
  assert.match(page, /শিক্ষক এখনো এগুলো যাচাই করেননি/);
  assert.match(page, /ভুল থাকতে পারে/);
  const select = /<select id="mcqChapter"[\s\S]*?<\/select>/.exec(page)[0];
  const options = [...select.matchAll(/<option value="(\d+)">([^<]+)<\/option>/g)].map(m => Number(m[1]));
  const have = [...new Set(mcq.loadQuestions().filter(q => q.subject === 'bangla').map(q => q.chapter_no))].sort((a, b) => a - b);
  assert.deepEqual(options, have);
  assert.match(page, /<div class="crumbs"><a href="index\.html">হোম<\/a><span class="sep">›<\/span><a href="bangla\.html">বাংলা ১ম পত্র<\/a><span class="sep">›<\/span><span class="cur">MCQ টেস্ট<\/span><\/div>/);
  assert.match(read('site/sitemap.xml'), /<url><loc>https:\/\/hsc2027\.de5\.net\/mcq-test\.html<\/loc><\/url>/);
  assert.ok(JSON.parse(read('site/offline-manifest.json')).files.some(f => f.path === 'assets/mcq-test.js'));
});

test('Bangla 1st paper links to the MCQ test and the one-shot class playlist', () => {
  assert.match(bangla, /<a class="btn btn-p" href="mcq-test\.html">📝 MCQ টেস্ট দাও<\/a>/);
  const link = new RegExp(`<a class="btn btn-g" href="${PLAYLIST.replace(/[.?]/g, '\\$&')}" target="_blank" rel="noopener noreferrer"[^>]*>▶ সম্পূর্ণ বিষয়ের ওয়ান শট ক্লাস ↗</a>`);
  assert.match(bangla, link);
  assert.ok(bangla.indexOf('mcq-test.html') > bangla.indexOf('🎥'), 'buttons sit after the online class tip');
  for (const f of fs.readdirSync(path.join(root, 'site')).filter(n => n.endsWith('.html') && n !== 'bangla.html' && n !== 'mcq-test.html')) {
    assert.doesNotMatch(read('site/' + f), /href="mcq-test\.html"/, `${f}: the test is only linked from Bangla 1st paper`);
  }
});
