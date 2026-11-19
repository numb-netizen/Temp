#!/usr/bin/env node
// MCQ bank tooling.
//   node scripts/mcq.cjs check                 validate data/mcq/*.json against the site's chapter list
//   node scripts/mcq.cjs sql-chapters          SQL that upserts subjects + chapters (from site/tracker.html)
//   node scripts/mcq.cjs sql-questions [n]     SQL upserting the draft questions (split into chunks of n rows)
//   node scripts/mcq.cjs sheet-rows            JSON rows for the Google Sheet ("প্রশ্ন" and "অধ্যায় তালিকা" tabs)
//   node scripts/mcq.cjs sheet-csv <file.csv>  SQL that syncs a CSV export of the Sheet's "প্রশ্ন" tab into Supabase
// The Google Sheet is the editing copy; Supabase serves only rows whose status is verified.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SUBJECTS = [
  ['physics', 'পদার্থবিজ্ঞান', 'science'], ['chemistry', 'রসায়ন', 'science'], ['math', 'উচ্চতর গণিত', 'science'],
  ['biology', 'জীববিজ্ঞান', 'science'], ['ict', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'common'], ['bangla', 'বাংলা ১ম পত্র', 'common'],
  ['bangla-2', 'বাংলা ২য় পত্র', 'common'], ['english', 'English 1st Paper', 'common'], ['sociology', 'সমাজবিজ্ঞান', 'humanities'],
  ['civics', 'পৌরনীতি ও সুশাসন', 'humanities'], ['economics', 'অর্থনীতি', 'humanities'], ['history', 'ইতিহাস', 'humanities'],
  ['accounting', 'হিসাববিজ্ঞান', 'commerce'], ['business', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', 'commerce'],
  ['finance', 'ফিন্যান্স, ব্যাংকিং ও বিমা', 'commerce'], ['marketing', 'উৎপাদন ব্যবস্থাপনা ও বিপণন', 'commerce'],
];
const SUBJECT_NAME = Object.fromEntries(SUBJECTS.map(([k, n]) => [k, n]));
const LETTERS = ['a', 'b', 'c', 'd'];
const BN_LETTERS = ['ক', 'খ', 'গ', 'ঘ'];
const DIFFICULTY_BN = {easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন'};
const SOURCE_BN = {ai_draft: 'AI খসড়া', teacher: 'শিক্ষক', board: 'বোর্ড প্রশ্ন'};
const STATUS_BN = {draft: 'খসড়া', verified: 'যাচাই হয়েছে', rejected: 'বাতিল'};
const invert = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));

function decode(s) { return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }

function chapters() {
  const html = fs.readFileSync(path.join(ROOT, 'site/tracker.html'), 'utf8');
  const re = /data-subject="([^"]+)" data-chapter="(\d+)"><span class="box"><\/span><span class="nm">([^<]*)<\/span>/g;
  const out = []; const sortBySubject = {};
  for (let m; (m = re.exec(html));) {
    const [, subject, no, rawName] = m; const name = decode(rawName).trim();
    if (!SUBJECT_NAME[subject]) throw new Error(`unknown subject in tracker: ${subject}`);
    sortBySubject[subject] = (sortBySubject[subject] || 0) + 1;
    const paper = /^১ম পত্র/.test(name) ? 1 : /^২য় পত্র/.test(name) ? 2 : null;
    out.push({subject, chapter_no: Number(no), name_bn: name, paper, sort: sortBySubject[subject]});
  }
  return out;
}
const chapterKey = (subject, no) => `${subject}-${no}`;
const chapterLabel = c => `${chapterKey(c.subject, c.chapter_no)} · ${SUBJECT_NAME[c.subject]} · ${c.name_bn}`;
const pad3 = n => String(n).padStart(3, '0');

// Options are written correct-first in the data files; a deterministic shuffle (seeded by the question code)
// places the correct answer at a stable, evenly spread position.
function shuffled(code, options) {
  const order = [0, 1, 2, 3];
  const h = crypto.createHash('sha256').update(code).digest();
  for (let i = 3; i > 0; i--) { const j = h[i] % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return {options: order.map(i => options[i]), correct: LETTERS[order.indexOf(0)]};
}

function loadQuestions() {
  const dir = path.join(ROOT, 'data/mcq');
  const out = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const meta = data.meta || {};
    for (const [subject, byChapter] of Object.entries(data.questions)) {
      for (const [no, list] of Object.entries(byChapter)) {
        list.forEach((row, i) => {
          const [stem, correct, w1, w2, w3, explanation = null, difficulty = 'medium'] = row;
          const code = `${subject}-${pad3(no)}-${pad3(i + 1)}`;
          const s = shuffled(code, [correct, w1, w2, w3]);
          out.push({code, subject, chapter_no: Number(no), stem, options: s.options, correct: s.correct, explanation,
            difficulty, source: meta.source || 'ai_draft', source_note: meta.source_note || null, status: 'draft', file});
        });
      }
    }
  }
  return out;
}

function validate(questions, chapterList = chapters()) {
  const errors = [];
  const known = new Set(chapterList.map(c => chapterKey(c.subject, c.chapter_no)));
  const codes = new Set(); const stems = new Map();
  for (const q of questions) {
    const where = `${q.code} (${q.file || 'sheet'})`;
    if (!known.has(chapterKey(q.subject, q.chapter_no))) errors.push(`${where}: chapter ${q.subject}-${q.chapter_no} is not on the site`);
    if (codes.has(q.code)) errors.push(`${where}: duplicate code`); codes.add(q.code);
    if (typeof q.stem !== 'string' || q.stem.trim().length < 3 || q.stem.length > 600) errors.push(`${where}: bad stem`);
    if (q.options.length !== 4 || q.options.some(o => typeof o !== 'string' || !o.trim() || o.length > 200)) errors.push(`${where}: options must be 4 non-empty strings ≤200 chars`);
    if (new Set(q.options.map(o => String(o).trim())).size !== 4) errors.push(`${where}: options are not distinct`);
    if (!LETTERS.includes(q.correct)) errors.push(`${where}: bad correct letter`);
    if (!DIFFICULTY_BN[q.difficulty]) errors.push(`${where}: bad difficulty ${q.difficulty}`);
    if (!STATUS_BN[q.status]) errors.push(`${where}: bad status ${q.status}`);
    if (q.status === 'verified' && (!q.verified_by || !q.verified_at)) errors.push(`${where}: verified rows need a reviewer name and date`);
    if (q.explanation != null && (typeof q.explanation !== 'string' || q.explanation.length > 800)) errors.push(`${where}: bad explanation`);
    const stemKey = `${q.subject}|${String(q.stem).replace(/\s+/g, ' ').trim()}`;
    if (stems.has(stemKey)) errors.push(`${where}: same question as ${stems.get(stemKey)}`); stems.set(stemKey, q.code);
  }
  return errors;
}

const lit = v => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

function sqlChapters(chapterList = chapters()) {
  const subj = SUBJECTS.map(([k, n, s], i) => `(${lit(k)},${lit(n)},${lit(s)},${i + 1})`).join(',\n');
  const ch = chapterList.map(c => `(${lit(c.subject)},${c.chapter_no},${lit(c.name_bn)},${c.paper ?? 'NULL'},${c.sort})`).join(',\n');
  return `INSERT INTO public.mcq_subjects (key,name_bn,stream,sort) VALUES\n${subj}\nON CONFLICT (key) DO UPDATE SET name_bn=EXCLUDED.name_bn, stream=EXCLUDED.stream, sort=EXCLUDED.sort;\n` +
    `INSERT INTO public.mcq_chapters (subject,chapter_no,name_bn,paper,sort) VALUES\n${ch}\nON CONFLICT (subject,chapter_no) DO UPDATE SET name_bn=EXCLUDED.name_bn, paper=EXCLUDED.paper, sort=EXCLUDED.sort;\n`;
}

function sqlQuestions(questions, {overwriteReview = false} = {}) {
  const cols = 'code,subject,chapter_no,stem,option_a,option_b,option_c,option_d,correct,explanation,difficulty,source,source_note,status,verified_by,verified_at';
  const rows = questions.map(q => `(${[q.code, q.subject].map(lit).join(',')},${q.chapter_no},${[q.stem, ...q.options, q.correct, q.explanation, q.difficulty, q.source, q.source_note, q.status, q.verified_by, q.verified_at].map(lit).join(',')})`);
  // Seeding drafts must never downgrade a question a teacher already reviewed; a Sheet sync may.
  const update = overwriteReview
    ? 'stem=EXCLUDED.stem, option_a=EXCLUDED.option_a, option_b=EXCLUDED.option_b, option_c=EXCLUDED.option_c, option_d=EXCLUDED.option_d, correct=EXCLUDED.correct, explanation=EXCLUDED.explanation, difficulty=EXCLUDED.difficulty, source=EXCLUDED.source, source_note=EXCLUDED.source_note, status=EXCLUDED.status, verified_by=EXCLUDED.verified_by, verified_at=EXCLUDED.verified_at, subject=EXCLUDED.subject, chapter_no=EXCLUDED.chapter_no, updated_at=now()'
    : null;
  return `INSERT INTO public.mcq_questions (${cols}) VALUES\n${rows.join(',\n')}\nON CONFLICT (code) DO ${update ? `UPDATE SET ${update}` : 'NOTHING'};\n`;
}

const SHEET_HEADER = ['কোড', 'অধ্যায় (তালিকা থেকে বেছে নাও)', 'প্রশ্ন', 'ক', 'খ', 'গ', 'ঘ', 'সঠিক উত্তর', 'ব্যাখ্যা', 'কঠিনতা', 'উৎস', 'উৎসের নোট', 'অবস্থা', 'যাচাইকারী', 'যাচাইয়ের তারিখ'];
const CHAPTER_HEADER = ['অধ্যায় (বিষয়কোড-নং · বিষয় · অধ্যায়)'];

function sheetRows(questions, chapterList = chapters()) {
  const byKey = new Map(chapterList.map(c => [chapterKey(c.subject, c.chapter_no), c]));
  return {
    questions: [SHEET_HEADER, ...questions.map(q => [q.code, chapterLabel(byKey.get(chapterKey(q.subject, q.chapter_no))), q.stem, ...q.options,
      BN_LETTERS[LETTERS.indexOf(q.correct)], q.explanation || '', DIFFICULTY_BN[q.difficulty], SOURCE_BN[q.source], q.source_note || '', STATUS_BN[q.status], '', ''])],
    chapters: [CHAPTER_HEADER, ...chapterList.map(c => [chapterLabel(c)])],
  };
}

function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += ch; }
    else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

// Converts the Sheet's rows (header + data) into question objects. Rows without a code get the next free
// code in their chapter; the returned `assigned` list says which Sheet rows need that code written back.
function fromSheet(rows) {
  const [header, ...data] = rows;
  if (header.join('|') !== SHEET_HEADER.join('|')) throw new Error('Sheet header changed; expected: ' + SHEET_HEADER.join(' | '));
  const status = invert(STATUS_BN), diff = invert(DIFFICULTY_BN), src = invert(SOURCE_BN);
  const next = {}; const assigned = []; const out = []; const errors = [];
  for (const r of data) { const m = /^(.+)-(\d{3})-(\d{3})$/.exec((r[0] || '').trim()); if (m) { const k = `${m[1]}-${Number(m[2])}`; next[k] = Math.max(next[k] || 0, Number(m[3])); } }
  data.forEach((r, i) => {
    const line = i + 2; const cell = j => (r[j] || '').trim();
    if (!cell(2) && !cell(1)) return;
    const km = /^([a-z0-9-]+)-(\d+) · /.exec(cell(1));
    if (!km) { errors.push(`সারি ${line}: অধ্যায় তালিকা থেকে বেছে নেওয়া হয়নি`); return; }
    const [subject, no] = [km[1], Number(km[2])]; const k = `${subject}-${no}`;
    let code = cell(0);
    if (!code) { next[k] = (next[k] || 0) + 1; code = `${subject}-${pad3(no)}-${pad3(next[k])}`; assigned.push({row: line, code}); }
    const correctIdx = BN_LETTERS.indexOf(cell(7));
    const q = {code, subject, chapter_no: no, stem: cell(2), options: [cell(3), cell(4), cell(5), cell(6)], correct: LETTERS[correctIdx],
      explanation: cell(8) || null, difficulty: diff[cell(9)] || cell(9), source: src[cell(10)] || 'teacher', source_note: cell(11) || null,
      status: status[cell(12)] || cell(12), verified_by: cell(13) || null, verified_at: cell(14) || null, file: `sheet row ${line}`};
    if (q.status !== 'verified') { q.verified_by = null; q.verified_at = null; }
    else if (q.verified_at) {
      const d = q.verified_at.replace(/[০-৯]/g, c => String(c.charCodeAt(0) - 0x09E6));
      const dm = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(d);
      const ok = dm && !Number.isNaN(Date.parse(`${dm[1]}-${dm[2].padStart(2, '0')}-${dm[3].padStart(2, '0')}T00:00:00Z`));
      if (ok) q.verified_at = `${dm[1]}-${dm[2].padStart(2, '0')}-${dm[3].padStart(2, '0')}`;
      else errors.push(`সারি ${line}: যাচাইয়ের তারিখ বছর-মাস-দিন আকারে লেখো (যেমন ২০২৬-১১-২০)`);
    }
    if (correctIdx < 0) errors.push(`সারি ${line}: সঠিক উত্তর ক/খ/গ/ঘ হতে হবে`);
    out.push(q);
  });
  return {questions: out, assigned, errors};
}

module.exports = {SUBJECTS, chapters, loadQuestions, validate, shuffled, sqlChapters, sqlQuestions, sheetRows, parseCsv, fromSheet, SHEET_HEADER, chapterLabel};

if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  const fail = errs => { if (errs.length) { console.error(errs.join('\n')); process.exit(1); } };
  if (cmd === 'check') {
    const qs = loadQuestions(); fail(validate(qs));
    const per = {}; for (const q of qs) per[q.subject] = (per[q.subject] || 0) + 1;
    const pos = {a: 0, b: 0, c: 0, d: 0}; for (const q of qs) pos[q.correct]++;
    console.log(`OK ${qs.length} questions`, per, 'answer positions', pos);
  } else if (cmd === 'sql-chapters') process.stdout.write(sqlChapters());
  else if (cmd === 'sql-questions') {
    const qs = loadQuestions(); fail(validate(qs)); const n = Number(arg) || qs.length;
    for (let i = 0; i < qs.length; i += n) process.stdout.write(sqlQuestions(qs.slice(i, i + n)) + '-- CHUNK --\n');
  } else if (cmd === 'sheet-rows') process.stdout.write(JSON.stringify(sheetRows(loadQuestions())));
  else if (cmd === 'sheet-csv') {
    const {questions, assigned, errors} = fromSheet(parseCsv(fs.readFileSync(arg, 'utf8')));
    fail([...errors, ...validate(questions)]);
    process.stdout.write(sqlQuestions(questions, {overwriteReview: true}));
    if (assigned.length) console.error('Write these codes back to the Sheet:\n' + assigned.map(a => `row ${a.row}: ${a.code}`).join('\n'));
  } else { console.error('usage: node scripts/mcq.cjs check|sql-chapters|sql-questions [n]|sheet-rows|sheet-csv <file>'); process.exit(2); }
}
