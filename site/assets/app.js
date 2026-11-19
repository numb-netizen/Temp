/* HSC 2027 — shared site script */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const bn = n => Number(n).toLocaleString("bn-BD");

/* ---------- COUNTDOWN (home page) ---------- */
const target = new Date("2027-06-06T10:00:00+06:00").getTime();
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
  const items = card.querySelectorAll(".item");
  const all   = chaps.length + items.length;
  const done  = card.querySelectorAll(".chap.done").length + card.querySelectorAll(".item.done").length;
  const pct   = all ? Math.round(done / all * 100) : 0;
  const bar = card.querySelector(".bar i");
  const cnt = card.querySelector(".cnt, .prog");
  if(bar) bar.style.width = pct + "%";
  if(cnt) cnt.textContent = bn(done) + "/" + bn(all) + " · " + bn(pct) + "%";
}
function refreshOverall(){
  const all  = $$(".chap").concat($$(".item"));
  const done = $$(".chap.done").length + $$(".item.done").length;
  const pct  = all.length ? Math.round(done / all.length * 100) : 0;
  if($("#overallPct")) $("#overallPct").textContent = bn(pct) + "%";
  if($("#overallBar")) $("#overallBar").style.width = pct + "%";
  if($("#overallTxt")) $("#overallTxt").textContent =
    bn(done) + "টি তালিকার আইটেম সম্পন্ন · আরও " + bn(all.length - done) + "টি বাকি";
}
function refreshAll(){
  $$(".tcard").forEach(refreshCard);
  refreshOverall();
}
function itemIndex(el){
  const items = el.parentNode.querySelectorAll(".item");
  return [...items].indexOf(el);
}
function loadState(){
  $$(".chap").forEach(el => {
    el.setAttribute("role", "checkbox");
    el.setAttribute("tabindex", "0");
    if(localStorage.getItem(KEY(el.dataset.subject + ":" + el.dataset.chapter)) === "1")
      el.classList.add("done");
    el.setAttribute("aria-checked", String(el.classList.contains("done")));
  });
  $$(".item").forEach((el,i) => {
    el.setAttribute("role", "checkbox");
    el.setAttribute("tabindex", "0");
    const subject = el.dataset.subject || "english-2";
    const idx = el.dataset.item != null ? el.dataset.item : i;
    if(localStorage.getItem(KEY(subject + ":" + idx)) === "1")
      el.classList.add("done");
    el.setAttribute("aria-checked", String(el.classList.contains("done")));
  });
  refreshAll();
}
function toggleChapter(el){
  let k;
  if(el.matches(".item")){
    const subject = el.dataset.subject || "english-2";
    const idx = el.dataset.item != null ? el.dataset.item : itemIndex(el);
    k = KEY(subject + ":" + idx);
  } else {
    k = KEY(el.dataset.subject + ":" + el.dataset.chapter);
  }
  el.classList.toggle("done");
  const done = el.classList.contains("done");
  el.setAttribute("aria-checked", String(done));
  done ? localStorage.setItem(k, "1") : localStorage.removeItem(k);
  const card = el.closest(".tcard");
  if(card) refreshCard(card);
  refreshOverall();
}
document.addEventListener("click", e => {
  const el = e.target.closest(".chap") || e.target.closest(".item");
  if(el) toggleChapter(el);
});
document.addEventListener("keydown", e => {
  if(e.key !== " " && e.key !== "Enter") return;
  const el = e.target.closest(".chap") || e.target.closest(".item");
  if(!el) return;
  e.preventDefault();
  toggleChapter(el);
});
const resetBtn = $("#resetBtn");
if(resetBtn) resetBtn.addEventListener("click", () => {
  if(!confirm("সত্যিই সব অগ্রগতি মুছে ফেলতে চাও?")) return;
  Object.keys(localStorage).filter(k => k.startsWith("hsc2027:")).forEach(k => localStorage.removeItem(k));
  $$(".chap").forEach(el => { el.classList.remove("done"); el.setAttribute("aria-checked", "false"); });
  $$(".item").forEach(el => { el.classList.remove("done"); el.setAttribute("aria-checked", "false"); });
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
// Content is visible by default, even when scripts or IntersectionObserver fail.
if(typeof IntersectionObserver !== "undefined") {
  const elements = $$(".reveal");
  try {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
    }), {threshold:.12});
    // Measure every element first, then write classes, so layout is computed once instead of per element.
    const below = elements.map(el => el.getBoundingClientRect().top >= window.innerHeight);
    elements.forEach((el, i) => {
      if(below[i]) el.classList.add("reveal-pending");
      io.observe(el);
    });
  } catch (_) {
    elements.forEach(el => el.classList.remove("reveal-pending"));
  }
}

/* ---------- MISC ---------- */
const yr = $("#year"); if(yr) yr.textContent = new Date().getFullYear().toLocaleString("bn-BD", {useGrouping:false}); // "২০২৬", not "২,০২৬"

/* ---------- PARENTS' MEETING (Bangladesh time; each day marked done after it ends) ---------- */
const meeting = document.querySelector("#parents-meeting");
if(meeting){
  const rows = [...meeting.querySelectorAll(".meet-row")];
  const bdDay = t => Math.floor((t + 6 * 36e5) / 864e5);   // calendar day in UTC+6
  function updateMeeting(){
    const now = Date.now();
    let done = 0;
    rows.forEach(row => {
      const start = Date.parse(row.dataset.start), end = Date.parse(row.dataset.end);
      const status = row.querySelector(".meet-status");
      const days = bdDay(start) - bdDay(now);
      let state = "soon", text;
      if(now >= end){ state = "done"; text = "✓ সম্পন্ন হয়েছে"; done++; }
      else if(now >= start){ state = "live"; text = "আজ সকাল ১১টায় শুরু হয়েছে"; }
      else if(days === 0){ state = "today"; text = "আজ সকাল ১১টায়"; }
      else if(days === 1){ state = "today"; text = "আগামীকাল"; }
      else text = "আর " + bn(days) + " দিন বাকি";
      row.dataset.state = state;
      status.textContent = text;
    });
    document.querySelector("#meet-done").hidden = done < rows.length;
  }
  updateMeeting();
  setInterval(updateMeeting, 60000);
}
