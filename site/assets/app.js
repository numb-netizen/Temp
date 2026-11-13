/* HSC 2027 — shared site script */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const bn = n => Number(n).toLocaleString("bn-BD");

/* ---------- COUNTDOWN (home page) ---------- */
const target = new Date("2027-06-25T09:00:00+06:00").getTime();
function tick(){
  if(!$("#cdD")) return;
  const diff = Math.max(0, target - Date.now());
  $("#cdD").textContent = bn(Math.floor(diff / 864e5));
  $("#cdH").textContent = bn(Math.floor(diff / 36e5) % 24);
  $("#cdM").textContent = bn(Math.floor(diff / 6e4) % 60);
  $("#cdS").textContent = bn(Math.floor(diff / 1e3) % 60);
}
tick(); setInterval(tick, 1000);

/* ---------- CHAPTER TRACKER (generic, localStorage) ---------- */
const KEY = k => "hsc2027:" + k;
function refreshCard(card){
  const chaps = card.querySelectorAll(".chap");
  const done  = card.querySelectorAll(".chap.done").length;
  const pct   = chaps.length ? Math.round(done / chaps.length * 100) : 0;
  const bar = card.querySelector(".bar i");
  const cnt = card.querySelector(".cnt");
  if(bar) bar.style.width = pct + "%";
  if(cnt) cnt.textContent = bn(done) + "/" + bn(chaps.length) + " · " + bn(pct) + "%";
}
function refreshOverall(){
  const all  = $$(".chap");
  const done = $$(".chap.done").length;
  const pct  = all.length ? Math.round(done / all.length * 100) : 0;
  if($("#overallPct")) $("#overallPct").textContent = bn(pct) + "%";
  if($("#overallBar")) $("#overallBar").style.width = pct + "%";
  if($("#overallTxt")) $("#overallTxt").textContent =
    bn(done) + "টি অধ্যায় সম্পন্ন · আরও " + bn(all.length - done) + "টি বাকি";
}
function refreshAll(){
  $$(".tcard").forEach(refreshCard);
  refreshOverall();
}
function loadState(){
  $$(".chap").forEach(el => {
    if(localStorage.getItem(KEY(el.dataset.subject + ":" + el.dataset.chapter)) === "1")
      el.classList.add("done");
  });
  refreshAll();
}
document.addEventListener("click", e => {
  const el = e.target.closest(".chap");
  if(!el) return;
  const k = KEY(el.dataset.subject + ":" + el.dataset.chapter);
  el.classList.toggle("done");
  el.classList.contains("done") ? localStorage.setItem(k, "1") : localStorage.removeItem(k);
  const card = el.closest(".tcard");
  if(card) refreshCard(card);
  refreshOverall();
});
const resetBtn = $("#resetBtn");
if(resetBtn) resetBtn.addEventListener("click", () => {
  if(!confirm("সত্যিই সব অগ্রগতি মুছে ফেলতে চাও?")) return;
  Object.keys(localStorage).filter(k => k.startsWith("hsc2027:")).forEach(k => localStorage.removeItem(k));
  $$(".chap").forEach(el => el.classList.remove("done"));
  refreshAll();
});
loadState();

/* ---------- NAV ---------- */
const burger = $("#burger"), navLinks = $("#navLinks");
if(burger && navLinks) burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});
if(navLinks) navLinks.addEventListener("click", e => {
  if(e.target.closest("a")) {
    navLinks.classList.remove("open");
    if(burger) burger.setAttribute("aria-expanded", "false");
  }
});

/* ---------- REVEAL ON SCROLL ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
}), {threshold:.12});
$$(".reveal").forEach(el => io.observe(el));

/* ---------- MISC ---------- */
const yr = $("#year"); if(yr) yr.textContent = bn(new Date().getFullYear());

/* ---------- PRE-TEST EXAMS (Bangladesh time; hide after the scheduled end) ---------- */
const pretest = document.querySelector("#pretest-routine");
if(pretest){
  const rows = [...pretest.querySelectorAll(".exam-row")];
  const timer = document.querySelector("#exam-timer");
  function updatePretest(){
    const now = Date.now();
    const remaining = rows.filter(row => now < Date.parse(row.dataset.end));
    rows.forEach(row => {
      row.hidden = now >= Date.parse(row.dataset.end);
      const syllabus = row.querySelector(".exam-syllabus");
      if(syllabus) syllabus.hidden = now >= Date.parse(row.dataset.start);
    });
    document.querySelector("#exam-empty").hidden = remaining.length > 0;
    timer.hidden = remaining.length === 0;
    const next = remaining[0];
    if(!next){
      document.querySelector("#exam-next-title").textContent = "সব পরীক্ষা শেষ";
      document.querySelector("#exam-next-date").textContent = "প্রাক-নির্বাচনী পরীক্ষার রুটিন সম্পন্ন হয়েছে।";
      document.querySelector("#exam-countdown-label").textContent = "";
      return;
    }
    const start = Date.parse(next.dataset.start);
    const end = Date.parse(next.dataset.end);
    const inProgress = now >= start;
    const difference = Math.max(0, (inProgress ? end : start) - now);
    document.querySelector("#exam-next-title").textContent = next.dataset.subject;
    document.querySelector("#exam-next-date").textContent = next.dataset.date + " · দুপুর ১২:০০ – বিকেল ৩:০০";
    document.querySelector("#exam-countdown-label").textContent = inProgress ? "পরীক্ষা চলছে · শেষ হতে বাকি" : "পরীক্ষা শুরু হতে বাকি";
    document.querySelector("#exam-days").textContent = bn(Math.floor(difference / 864e5));
    document.querySelector("#exam-hours").textContent = bn(Math.floor(difference / 36e5) % 24);
    document.querySelector("#exam-minutes").textContent = bn(Math.floor(difference / 6e4) % 60);
    document.querySelector("#exam-seconds").textContent = bn(Math.floor(difference / 1e3) % 60);
  }
  updatePretest();
  setInterval(updatePretest, 1000);
}
