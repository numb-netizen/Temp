const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '../site');
const read = p => fs.readFileSync(path.join(site,p), 'utf8');
test('feedback stays out of navigation, with a prominent in-flow home invitation and footer links', () => {
  const files = fs.readdirSync(site).filter(n => n.endsWith('.html') && n !== 'googleb7da7b15e33059e0.html');
  for (const file of files) {
    const html = read(file), nav = html.match(/<nav>[\s\S]*?<\/nav>/)[0], footer = html.match(/<footer>[\s\S]*?<\/footer>/)[0];
    assert.doesNotMatch(nav, /feedback\.html|feedback-cta/, file);
    assert.match(footer, /href="feedback\.html"/, file);
    assert.match(nav, /href="tracker\.html"/, file);
  }
  const home = read('index.html');
  assert.match(home, /<section class="feedback-invite"/);
  assert.match(home, /class="btn btn-p feedback-banner-link" href="feedback\.html"/);
  assert.ok(home.indexOf('feedback-invite') > home.indexOf('</header>'));
  assert.doesNotMatch(read('assets/feedback.css'), /position\s*:\s*(fixed|sticky|absolute)/);
});
test('feedback prepares a public issue without secrets or pretending it is already submitted', () => {
  const html = read('feedback.html');
  assert.match(html, /<form[^>]*action="https:\/\/github\.com\/numb-netizen\/Temp\/issues\/new"[^>]*method="get"/);
  assert.match(html, /name="title"[^>]*required[^>]*maxlength="120"/);
  assert.match(html, /name="body"[^>]*required[^>]*maxlength="500"/);
  assert.match(html, /id="feedback-extra"[^>]*hidden disabled/);
  for (const text of ['Issue সবাই দেখতে পারে','GitHub অ্যাকাউন্টে লগইন','শুধু ফর্ম পূরণ করলে Issue তৈরি হয় না','Submit new issue','security/advisories/new','পাবলিক Issue-তে লিখো না']) assert.ok(html.includes(text),text);
  const manifest = require('../scripts/offline-manifest.cjs').makeManifest(site).files;
  for (const asset of ['feedback.html','assets/feedback.css','assets/feedback.js']) assert.ok(manifest.some(x => x.path === asset), asset);
});
test('optional context is appended only to the submitted issue without changing the draft', () => {
  const listeners = {}, extra = {disabled:true,hidden:true};
  const form = {addEventListener:(event, fn) => listeners[event] = fn};
  const document = {querySelector:() => form, getElementById:() => extra};
  vm.runInNewContext(read('assets/feedback.js'), {document, window:{FormDataEvent:function(){}}});
  assert.equal(extra.hidden, false); assert.equal(extra.disabled, false);
  const fields = new Map([['body','মূল লেখা & তথ্য'], ['feedback_type','সমস্যা'], ['feedback_page','tracker.html'], ['feedback_device','Android']]);
  listeners.formdata({formData: fields});
  assert.equal(fields.get('body'), 'মূল লেখা & তথ্য\n\nমতামতের ধরন: সমস্যা\nপেজ: tracker.html\nডিভাইস বা ব্রাউজার: Android');
  assert.equal(fields.has('feedback_page'), false);
  const plain = new Map([['body','মূল লেখা'],['feedback_type',''],['feedback_page',''],['feedback_device','']]);
  listeners.formdata({formData:plain});
  assert.equal(plain.get('body'), 'মূল লেখা');
  const unsupported = {hidden:true,disabled:true};
  vm.runInNewContext(read('assets/feedback.js'), {document:{querySelector:()=>form,getElementById:()=>unsupported},window:{}});
  assert.equal(unsupported.hidden,true); assert.equal(unsupported.disabled,true);
});
test('security policy routes sensitive reports privately and ordinary reports publicly', () => {
  const policy = fs.readFileSync(path.join(__dirname,'../SECURITY.md'),'utf8');
  assert.match(policy, /security\/advisories\/new/);
  assert.match(policy, /feedback\.html/);
  assert.match(policy, /unsigned/);
  assert.match(policy, /debug build/);
  assert.match(policy, /সবার জন্য দৃশ্যমান/);
});
