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
if(burger) burger.addEventListener("click", () => navLinks.classList.toggle("open"));
if(navLinks) navLinks.addEventListener("click", e => {
  if(e.target.tagName === "A") navLinks.classList.remove("open");
});

/* ---------- REVEAL ON SCROLL ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
}), {threshold:.12});
$$(".reveal").forEach(el => io.observe(el));

/* ---------- MISC ---------- */
const yr = $("#year"); if(yr) yr.textContent = bn(new Date().getFullYear());
