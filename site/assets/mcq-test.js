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
  var SECONDS_PER_QUESTION = 40;  // 30 questions → 20 minutes
  var MAX_PICKS = 3;              // the 3rd choice locks that question's answer
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
  var timeInfo = document.getElementById('mcqTimeInfo');
  var timerBox = document.getElementById('mcqTimer');
  var timeLeft = document.getElementById('mcqTimeLeft');
  var timeNote = document.getElementById('mcqTimeNote');
  var bank = [], current = [], picks = [];
  var deadline = 0, ticker = null, warned = false;
  var names = {};
  Array.prototype.forEach.call(chapterSel.options, function (o) { if (o.value !== 'all') names[o.value] = o.textContent; });

  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function two(n) { return bn(n < 10 ? '0' + n : n); }
  function duration(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m ? bn(m) + ' মিনিট' : '') + (m && s ? ' ' : '') + (s ? bn(s) + ' সেকেন্ড' : '');
  }
  function showTimeInfo() {
    var n = Number(countSel.value) || 10;
    timeInfo.textContent = bn(n) + 'টি প্রশ্নে ' + duration(n * SECONDS_PER_QUESTION);
  }
  function stopTimer() { if (ticker) clearInterval(ticker); ticker = null; }
  function tick() {
    var left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    timeLeft.textContent = two(Math.floor(left / 60)) + ':' + two(left % 60);
    timerBox.classList.toggle('is-low', left <= 60);
    if (left <= 60 && !warned && left > 0) { warned = true; timeNote.textContent = 'আর ১ মিনিট বাকি!'; }
    if (left === 0) { stopTimer(); grade(true); }
  }
  function startTimer(n) {
    stopTimer(); warned = false; timeNote.textContent = '';
    deadline = Date.now() + n * SECONDS_PER_QUESTION * 1000;
    timerBox.hidden = false;
    tick(); ticker = setInterval(tick, 1000);
  }
  function hint(i) {
    var li = list.children[i], left = MAX_PICKS - picks[i];
    var p = li.querySelector('.mcq-picks');
    if (left <= 0) {
      p.textContent = '🔒 উত্তর লক হয়ে গেছে — আর বদলানো যাবে না।';
      li.classList.add('is-locked');
      Array.prototype.forEach.call(li.querySelectorAll('input'), function (inp) { inp.disabled = true; });
    } else p.textContent = 'আর ' + bn(left) + ' বার উত্তর বাছতে পারবে' + (left === 1 ? ' — পরের বাছাইয়ে উত্তর লক হবে।' : '।');
  }
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
      lg.appendChild(el('span', 'mcq-stem', q.stem));
      fs.appendChild(lg);
      LETTERS.forEach(function (l) {
        var lab = el('label', 'mcq-opt');
        lab.dataset.letter = l;
        var input = el('input'); input.type = 'radio'; input.name = 'q' + i; input.value = l;
        lab.appendChild(input);
        lab.appendChild(el('span', null, LABELS[l] + ') ' + q['option_' + l]));
        fs.appendChild(lab);
      });
      fs.appendChild(el('p', 'mcq-picks', 'সর্বোচ্চ ' + bn(MAX_PICKS) + ' বার উত্তর বাছতে পারবে।'));
      li.appendChild(fs);
      list.appendChild(li);
    });
  }

  function start() {
    var ch = chapterSel.value;
    var pool = ch === 'all' ? bank : bank.filter(function (q) { return String(q.chapter_no) === ch; });
    if (!pool.length) return;
    current = shuffle(pool).slice(0, Number(countSel.value) || 10);
    picks = current.map(function () { return 0; });
    render(current);
    title.textContent = (ch === 'all' ? 'সব অধ্যায়' : names[ch] || 'বাছাই করা অধ্যায়') + ' — ' + bn(current.length) + 'টি প্রশ্ন';
    score.hidden = true; score.textContent = '';
    quiz.classList.remove('is-done');
    submitBtn.hidden = false; againBtn.hidden = true;
    setup.hidden = true; quiz.hidden = false;
    startTimer(current.length);
    title.focus();
  }

  function grade(timeUp) {
    if (quiz.classList.contains('is-done')) return;
    stopTimer();
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
      var pk = fs.querySelector('.mcq-picks'); if (pk) pk.remove();
      if (q.explanation) fs.appendChild(el('p', 'mcq-explain', 'ব্যাখ্যা: ' + q.explanation));
    });
    var n = current.length;
    score.textContent = (timeUp ? '⏰ সময় শেষ! উত্তর নিজে থেকেই জমা হয়েছে। ' : '') + 'তোমার নম্বর: ' + bn(right) + ' / ' + bn(n) + ' (' + bn(Math.round(right * 100 / n)) + '%)' +
      (skipped ? ' · উত্তর দাওনি ' + bn(skipped) + 'টি' : '') + '। মনে রেখো, প্রশ্নগুলো AI খসড়া — সন্দেহ হলে বই মিলিয়ে নাও।';
    score.hidden = false;
    quiz.classList.add('is-done');
    timerBox.classList.add('is-over');
    if (timeUp) timeLeft.textContent = '০০:০০';
    submitBtn.hidden = true; againBtn.hidden = false;
    score.focus();
  }

  list.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'radio' || quiz.classList.contains('is-done')) return;
    var i = Number(input.name.slice(1));
    if (picks[i] >= MAX_PICKS) return;
    picks[i]++;
    hint(i);
  });
  countSel.addEventListener('change', showTimeInfo);
  chapterSel.addEventListener('change', updateAvailability);
  retry.addEventListener('click', load);
  setup.addEventListener('submit', function (e) { e.preventDefault(); start(); });
  quiz.addEventListener('submit', function (e) { e.preventDefault(); grade(false); });
  againBtn.addEventListener('click', function () {
    stopTimer(); timerBox.classList.remove('is-over', 'is-low');
    quiz.hidden = true; setup.hidden = false; list.textContent = ''; current = []; picks = [];
    updateAvailability(); chapterSel.focus();
  });
  showTimeInfo();
  load();
}());
