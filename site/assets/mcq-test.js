// Live Bangla 1st paper MCQ test (mcq-test.html).
// Questions are read from the "mcq exam" Supabase project with the public (publishable) key.
// Row-level security only lets visitors read verified questions plus Bangla AI drafts, and only the
// public columns; source notes and reviewer details are never requested or readable.
(function () {
  var setup = document.getElementById('mcqSetup');
  var quiz = document.getElementById('mcqQuiz');
  if (!setup || !quiz) return;
  var API = 'https://jwzznffykcxghigkwzab.supabase.co/rest/v1/mcq_questions' +
    '?subject=eq.bangla&select=code,chapter_no,stem,option_a,option_b,option_c,option_d,correct,explanation,difficulty&order=code';
  var KEY = 'sb_publishable_RpGFHEBdwg1-7a47ZFy07w_RYh_iZby';
  var LETTERS = ['a', 'b', 'c', 'd'];
  var LABELS = {a: 'ক', b: 'খ', c: 'গ', d: 'ঘ'};
  var chapterSel = document.getElementById('mcqChapter');
  var countSel = document.getElementById('mcqCount');
  var startBtn = document.getElementById('mcqStart');
  var status = document.getElementById('mcqStatus');
  var retry = document.getElementById('mcqRetry');
  var list = document.getElementById('mcqList');
  var title = document.getElementById('mcqQuizTitle');
  var score = document.getElementById('mcqScore');
  var submitBtn = document.getElementById('mcqSubmit');
  var againBtn = document.getElementById('mcqAgain');
  var bank = [], current = [];
  var names = {};
  Array.prototype.forEach.call(chapterSel.options, function (o) { if (o.value !== 'all') names[o.value] = o.textContent; });

  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function valid(q) {
    return q && typeof q.stem === 'string' && q.stem && LETTERS.indexOf(q.correct) !== -1 &&
      LETTERS.every(function (l) { return typeof q['option_' + l] === 'string' && q['option_' + l]; });
  }

  function updateAvailability() {
    if (!bank.length) return;
    var ch = chapterSel.value;
    var n = ch === 'all' ? bank.length : bank.filter(function (q) { return String(q.chapter_no) === ch; }).length;
    status.textContent = n ? 'এই বাছাইয়ে ' + bn(n) + 'টি প্রশ্ন আছে।' : 'এই অধ্যায়ের কোনো প্রশ্ন এখনো নেই — অন্য অধ্যায় বেছে নাও।';
    startBtn.disabled = !n;
  }

  async function load() {
    startBtn.disabled = true; retry.hidden = true;
    status.textContent = 'প্রশ্ন লোড হচ্ছে…';
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var res = await fetch(API, {headers: {apikey: KEY, Accept: 'application/json'}, signal: controller.signal});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('bad data');
      bank = rows.filter(valid);
      if (!bank.length) throw new Error('empty');
      updateAvailability();
    } catch (e) {
      bank = [];
      status.textContent = 'প্রশ্ন লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করো।';
      retry.hidden = false;
    } finally { clearTimeout(timer); }
  }

  function render(qs) {
    list.textContent = '';
    qs.forEach(function (q, i) {
      var li = el('li', 'mcq-q');
      var fs = el('fieldset');
      var lg = el('legend');
      if (chapterSel.value === 'all' && names[q.chapter_no]) lg.appendChild(el('span', 'mcq-chap', names[q.chapter_no]));
      lg.appendChild(document.createTextNode(q.stem));
      fs.appendChild(lg);
      LETTERS.forEach(function (l) {
        var lab = el('label', 'mcq-opt');
        lab.dataset.letter = l;
        var input = el('input'); input.type = 'radio'; input.name = 'q' + i; input.value = l;
        lab.appendChild(input);
        lab.appendChild(el('span', null, LABELS[l] + ') ' + q['option_' + l]));
        fs.appendChild(lab);
      });
      li.appendChild(fs);
      list.appendChild(li);
    });
  }

  function start() {
    var ch = chapterSel.value;
    var pool = ch === 'all' ? bank : bank.filter(function (q) { return String(q.chapter_no) === ch; });
    if (!pool.length) return;
    current = shuffle(pool).slice(0, Number(countSel.value) || 10);
    render(current);
    title.textContent = (ch === 'all' ? 'সব অধ্যায়' : names[ch] || 'বাছাই করা অধ্যায়') + ' — ' + bn(current.length) + 'টি প্রশ্ন';
    score.hidden = true; score.textContent = '';
    quiz.classList.remove('is-done');
    submitBtn.hidden = false; againBtn.hidden = true;
    setup.hidden = true; quiz.hidden = false;
    title.focus();
  }

  function grade() {
    var right = 0, skipped = 0;
    current.forEach(function (q, i) {
      var li = list.children[i];
      var picked = quiz.querySelector('input[name="q' + i + '"]:checked');
      var ans = picked ? picked.value : null;
      if (!ans) skipped++; else if (ans === q.correct) right++;
      Array.prototype.forEach.call(li.querySelectorAll('.mcq-opt'), function (lab) {
        var l = lab.dataset.letter;
        lab.querySelector('input').disabled = true;
        if (l === q.correct) { lab.classList.add('is-right'); lab.appendChild(el('span', 'mark', '✓ সঠিক')); }
        else if (l === ans) { lab.classList.add('is-wrong'); lab.appendChild(el('span', 'mark', '✗ তোমার উত্তর')); }
      });
      var fs = li.querySelector('fieldset');
      fs.appendChild(el('p', 'mcq-result ' + (ans === q.correct ? 'ok' : 'bad'),
        !ans ? 'উত্তর দাওনি — সঠিক উত্তর: ' + LABELS[q.correct] : ans === q.correct ? 'সঠিক হয়েছে!' : 'ভুল — সঠিক উত্তর: ' + LABELS[q.correct]));
      if (q.explanation) fs.appendChild(el('p', 'mcq-explain', 'ব্যাখ্যা: ' + q.explanation));
    });
    var n = current.length;
    score.textContent = 'তোমার নম্বর: ' + bn(right) + ' / ' + bn(n) + ' (' + bn(Math.round(right * 100 / n)) + '%)' +
      (skipped ? ' · উত্তর দাওনি ' + bn(skipped) + 'টি' : '') + '। মনে রেখো, প্রশ্নগুলো AI খসড়া — সন্দেহ হলে বই মিলিয়ে নাও।';
    score.hidden = false;
    quiz.classList.add('is-done');
    submitBtn.hidden = true; againBtn.hidden = false;
    score.focus();
  }

  chapterSel.addEventListener('change', updateAvailability);
  retry.addEventListener('click', load);
  setup.addEventListener('submit', function (e) { e.preventDefault(); start(); });
  quiz.addEventListener('submit', function (e) { e.preventDefault(); if (!quiz.classList.contains('is-done')) grade(); });
  againBtn.addEventListener('click', function () {
    quiz.hidden = true; setup.hidden = false; list.textContent = ''; current = [];
    updateAvailability(); chapterSel.focus();
  });
  load();
}());
