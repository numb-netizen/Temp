(function () {
  var form = document.getElementById('feedback-form');
  var status = document.getElementById('feedback-status');
  if (!form || !status) return;
  var button = form.querySelector('button[type="submit"]');
  button.disabled = false;
  var endpoint = 'https://cciwbmtmlrlgpgewiaqk.supabase.co/functions/v1/feedback/submit';
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var title = form.elements.title.value.trim(), body = form.elements.body.value.trim();
    if (!title || !body) { status.textContent = 'বিষয় ও মতামত দুটোই লিখো।'; return; }
    button.disabled = true;
    status.textContent = 'পাঠানো হচ্ছে…';
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:title, body:body}), signal:controller.signal});
      var result = await response.json();
      if (response.status === 429) throw new Error('এখন অনেক মতামত এসেছে। এক ঘণ্টা পরে আবার চেষ্টা করো।');
      if (!response.ok || result.accepted !== true) throw new Error('পাঠানো যায়নি। একটু পরে আবার চেষ্টা করো।');
      if (form.elements.title.value.trim() === title && form.elements.body.value.trim() === body) form.reset();
      status.textContent = 'তোমার মতামত গ্রহণ করা হয়েছে। কিছু সময় পরে এটি প্রকাশ্য GitHub Issue হিসেবে যুক্ত হবে। ধন্যবাদ!';
    } catch (error) {
      status.textContent = error.message === 'এখন অনেক মতামত এসেছে। এক ঘণ্টা পরে আবার চেষ্টা করো।' ? error.message : 'মতামত গ্রহণ হয়েছে কি না নিশ্চিত হওয়া যায়নি। লেখা রয়ে গেছে; আবার পাঠালে একই মতামত দুবার যেতে পারে।';
    } finally { clearTimeout(timer); button.disabled = false; }
  });
}());
