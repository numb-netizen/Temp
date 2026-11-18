/* Optional context is added to the public GitHub issue, not stored by the site. */
(function () {
  var form = document.querySelector('.feedback-form');
  var extra = document.getElementById('feedback-extra');
  if (!form || !extra || !('FormDataEvent' in window)) return;
  extra.disabled = false;
  extra.hidden = false;
  form.addEventListener('formdata', function (event) {
    var data = event.formData;
    var fields = [
      ['মতামতের ধরন', 'feedback_type'],
      ['পেজ', 'feedback_page'],
      ['ডিভাইস বা ব্রাউজার', 'feedback_device']
    ];
    var details = [];
    fields.forEach(function (field) {
      var value = String(data.get(field[1]) || '').trim();
      if (value) details.push(field[0] + ': ' + value);
      data.delete(field[1]);
    });
    if (details.length) data.set('body', String(data.get('body') || '') + '\n\n' + details.join('\n'));
  });
}());
