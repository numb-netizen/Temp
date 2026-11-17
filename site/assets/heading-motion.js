/* Apply the home-page motion preference before styles paint on every page. */
(function () {
  try {
    if (localStorage.getItem('site:motion-paused') === '1') {
      document.documentElement.classList.add('motion-paused');
    }
  } catch (e) { /* Storage is optional. */ }
}());
