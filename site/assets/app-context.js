/* Presentation only: the HSC Android app identifies its WebView explicitly.
   Do not treat this client-supplied marker as authentication or security. */
if (/\bHSC2027App\b/.test(navigator.userAgent)) {
  document.documentElement.classList.add('hsc-android-app');
}
