(() => {
  const steps = ['student', 'not-student', 'choice', 'girl', 'boy'];
  const links = [
    [document.getElementById('group-join-old'), 'https://chat.whatsapp.com/KPdaTIjQNo93DEeFTldweN?s=sw&p=a&iam=2'],
    [document.getElementById('group-join'), 'https://chat.whatsapp.com/Kj4T6Y3BpDJD3j3K7kB0Yu']
  ];
  function show(step) {
    for (const name of steps) document.getElementById(name + '-step').hidden = name !== step;
    for (const [join, link] of links) {
      if (step === 'boy') join.setAttribute('href', link);
      else join.removeAttribute('href');
    }
    document.querySelector('#' + step + '-step h2').focus();
  }
  document.getElementById('student-yes').addEventListener('click', () => show('choice'));
  document.getElementById('student-no').addEventListener('click', () => show('not-student'));
  document.getElementById('choose-girl').addEventListener('click', () => show('girl'));
  document.getElementById('choose-boy').addEventListener('click', () => show('boy'));
  document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => show(button.dataset.back)));
})();
