const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mcq = require('../scripts/mcq.cjs');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261118120000_mcq_bank.sql'), 'utf8');

test('chapters come straight from the tracker, kept separate by subject and chapter number', () => {
  const list = mcq.chapters();
  const tracker = fs.readFileSync(path.join(root, 'site/tracker.html'), 'utf8');
  assert.equal(list.length, (tracker.match(/class="chap" data-subject="/g) || []).length, 'every tracker chapter is in the bank');
  const keys = list.map(c => `${c.subject}-${c.chapter_no}`);
  assert.equal(new Set(keys).size, keys.length, 'subject + chapter number is unique');
  for (const c of list) {
    assert.ok(mcq.SUBJECTS.some(([k]) => k === c.subject), c.subject);
    if (/^১ম পত্র/.test(c.name_bn)) assert.equal(c.paper, 1);
    if (/^২য় পত্র/.test(c.name_bn)) assert.equal(c.paper, 2);
  }
  const subjectsInTracker = new Set(list.map(c => c.subject));
  for (const [k] of mcq.SUBJECTS) assert.ok(subjectsInTracker.has(k), `${k} has chapters in the tracker`);
});

test('every drafted question is valid, belongs to a real chapter and is stored as an unverified draft', () => {
  const qs = mcq.loadQuestions();
  assert.ok(qs.length >= 280);
  assert.deepEqual(mcq.validate(qs), []);
  for (const q of qs) {
    assert.equal(q.status, 'draft', `${q.code} must wait for a teacher`);
    assert.equal(q.source, 'ai_draft');
    assert.match(q.code, /^[a-z0-9-]+-\d{3}-\d{3}$/);
  }
  const pos = {a: 0, b: 0, c: 0, d: 0};
  for (const q of qs) pos[q.correct]++;
  for (const n of Object.values(pos)) assert.ok(n > qs.length * 0.18, `answer letters are spread out: ${JSON.stringify(pos)}`);
});

test('answer shuffling is deterministic and keeps the correct option', () => {
  const opts = ['right', 'w1', 'w2', 'w3'];
  const a = mcq.shuffled('physics-002-001', opts), b = mcq.shuffled('physics-002-001', opts);
  assert.deepEqual(a, b);
  assert.equal(a.options[['a', 'b', 'c', 'd'].indexOf(a.correct)], 'right');
  assert.deepEqual([...a.options].sort(), [...opts].sort());
});

test('validation catches the mistakes a reviewer could make', () => {
  const base = {code: 'ict-000-901', subject: 'ict', chapter_no: 0, stem: 'নমুনা প্রশ্ন?', options: ['১', '২', '৩', '৪'], correct: 'a',
    explanation: null, difficulty: 'easy', source: 'teacher', status: 'draft'};
  assert.deepEqual(mcq.validate([base]), []);
  assert.match(mcq.validate([{...base, chapter_no: 99}]).join(), /not on the site/);
  assert.match(mcq.validate([{...base, options: ['১', '১', '৩', '৪']}]).join(), /not distinct/);
  assert.match(mcq.validate([{...base, status: 'verified'}]).join(), /reviewer/);
  assert.deepEqual(mcq.validate([{...base, status: 'verified', verified_by: 'শিক্ষক', verified_at: '2026-11-20'}]), []);
  assert.match(mcq.validate([base, {...base, code: 'ict-000-902'}]).join(), /same question/);
});

test('Sheet rows round-trip through a CSV export back into the same questions', () => {
  const qs = mcq.loadQuestions().slice(0, 12);
  const {questions: rows, chapters} = mcq.sheetRows(qs);
  assert.deepEqual(rows[0], mcq.SHEET_HEADER);
  assert.equal(chapters.length - 1, mcq.chapters().length);
  // A teacher verifies one question and adds a new one without a code.
  rows[1][12] = 'যাচাই হয়েছে'; rows[1][13] = 'রহিম স্যার'; rows[1][14] = '2026-11-20';
  rows.push(['', rows[2][1], 'নতুন প্রশ্ন, "উদ্ধৃতি", কমা সহ?', 'ক১', 'খ১', 'গ১', 'ঘ১', 'গ', '', 'কঠিন', 'শিক্ষক', '', 'খসড়া', '', '']);
  const csv = rows.map(r => r.map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(',')).join('\r\n');
  const {questions, assigned, errors} = mcq.fromSheet(mcq.parseCsv(csv));
  assert.deepEqual(errors, []);
  assert.equal(questions.length, 13);
  for (let i = 0; i < 12; i++) {
    for (const k of ['code', 'subject', 'chapter_no', 'stem', 'options', 'correct', 'difficulty', 'source']) assert.deepEqual(questions[i][k], qs[i][k], `${qs[i].code} ${k}`);
  }
  assert.equal(questions[0].status, 'verified');
  assert.equal(questions[0].verified_by, 'রহিম স্যার');
  assert.equal(questions[1].verified_by, null);
  const added = questions[12];
  assert.equal(added.stem, 'নতুন প্রশ্ন, "উদ্ধৃতি", কমা সহ?');
  assert.equal(added.correct, 'c');
  assert.equal(added.source, 'teacher');
  assert.equal(assigned.length, 1);
  assert.equal(assigned[0].code, added.code);
  assert.deepEqual(mcq.validate(questions), []);
  assert.match(mcq.sqlQuestions(questions, {overwriteReview: true}), /ON CONFLICT \(code\) DO UPDATE SET/);
  assert.match(mcq.sqlQuestions(qs), /ON CONFLICT \(code\) DO NOTHING;/, 'seeding drafts never overwrites reviewed rows');
});

test('Sheet review dates accept Bengali digits and reject unclear formats', () => {
  const {questions: rows} = mcq.sheetRows(mcq.loadQuestions().slice(0, 3));
  const toCsv = r => r.map(row => row.map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(',')).join('\n');
  rows[1].splice(12, 3, 'যাচাই হয়েছে', 'করিম স্যার', '২০২৬-১১-৫');
  rows[2].splice(12, 3, 'যাচাই হয়েছে', 'করিম স্যার', '20/11/2026');
  rows[3].splice(12, 3, 'বাতিল', 'করিম স্যার', 'যেকোনো লেখা');
  const {questions, errors} = mcq.fromSheet(mcq.parseCsv(toCsv(rows)));
  assert.equal(questions[0].verified_at, '2026-11-05');
  assert.deepEqual(errors, ['সারি 3: যাচাইয়ের তারিখ বছর-মাস-দিন আকারে লেখো (যেমন ২০২৬-১১-২০)']);
  assert.equal(questions[2].status, 'rejected');
  assert.equal(questions[2].verified_at, null, 'non-verified rows drop the reviewer fields');
});

test('migration: visitors can only ever read verified questions, and only the public columns', () => {
  for (const t of ['mcq_subjects', 'mcq_chapters', 'mcq_questions']) assert.match(migration, new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;`));
  assert.match(migration, /REVOKE ALL ON public\.mcq_subjects, public\.mcq_chapters, public\.mcq_questions FROM PUBLIC, anon, authenticated;/);
  assert.match(migration, /CREATE POLICY mcq_questions_public_read_verified ON public\.mcq_questions FOR SELECT TO anon, authenticated\s+USING \(status = 'verified'\);/);
  const grant = /GRANT SELECT \(([^)]+)\)\s+ON public\.mcq_questions TO anon, authenticated;/.exec(migration);
  assert.ok(grant, 'column-level grant');
  const cols = grant[1].split(',').map(s => s.trim());
  for (const hidden of ['status', 'verified_by', 'verified_at', 'source', 'source_note']) assert.ok(!cols.includes(hidden), `${hidden} stays private`);
  assert.doesNotMatch(migration, /GRANT (INSERT|UPDATE|DELETE|ALL)[^;]*TO (anon|authenticated)/, 'visitors cannot write');
  assert.match(migration, /CHECK \(status <> 'verified' OR \(verified_at IS NOT NULL AND verified_by IS NOT NULL\)\)/);
  assert.doesNotMatch(migration, /dabi_public_supporters|feedback_queue/, 'existing tables are untouched');
});
