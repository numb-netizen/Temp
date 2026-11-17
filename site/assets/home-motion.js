/* Decorative particles only; the rest of the site works without this script. */
(function () {
  var layer = document.querySelector('.hero-sparkles');
  var toggle = document.querySelector('.motion-toggle');
  if (!layer || !toggle) return;
  var media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var paused = false;
  try { paused = localStorage.getItem('site:motion-paused') === '1'; } catch (e) { /* Storage is optional. */ }

  function makeSparks() {
    if (layer.children.length) return;
    var count = window.innerWidth < 600 ? 7 : 12;
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var spark = document.createElement('span');
      spark.className = 'hero-spark' + (i % 3 === 0 ? ' hero-spark-ring' : '');
      spark.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
      spark.style.top = (8 + Math.random() * 84).toFixed(1) + '%';
      spark.style.setProperty('--duration', (7 + Math.random() * 7).toFixed(1) + 's');
      spark.style.setProperty('--delay', (-Math.random() * 12).toFixed(1) + 's');
      spark.style.setProperty('--drift', (-10 - Math.random() * 18).toFixed(0) + 'px');
      fragment.appendChild(spark);
    }
    layer.appendChild(fragment);
  }
  function update() {
    var reduced = !!(media && media.matches);
    if (!reduced && !paused) makeSparks();
    document.documentElement.classList.toggle('motion-paused', reduced || paused);
    toggle.hidden = reduced;
    toggle.textContent = paused ? 'অ্যানিমেশন চালু' : 'অ্যানিমেশন বন্ধ';
  }
  toggle.addEventListener('click', function () {
    paused = !paused;
    try { localStorage.setItem('site:motion-paused', paused ? '1' : '0'); } catch (e) { /* Storage is optional. */ }
    update();
  });
  if (media && media.addEventListener) media.addEventListener('change', update);
  else if (media && media.addListener) media.addListener(update);
  update();
}());
