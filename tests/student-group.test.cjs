const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '..', 'site');
const page = fs.readFileSync(path.join(site, 'student-group.html'), 'utf8');
const source = fs.readFileSync(path.join(site, 'assets/student-group.js'), 'utf8');
const url = 'https://chat.whatsapp.com/Kj4T6Y3BpDJD3j3K7kB0Yu';
function setup() {
  const nodes = {};
  const element = (id) => nodes[id] = {hidden: false, attrs: {}, dataset: {},
    setAttribute(k,v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(event, cb) { this.click = cb; }, focus() { this.focused = true; }};
  for (const step of ['student','not-student','choice','girl','boy']) element(step + '-step');
  for (const id of ['group-join','student-yes','student-no','choose-girl','choose-boy']) element(id);
  const back = ['student','student','choice','choice'].map((name, i) => { const e = element('back' + i); e.dataset.back = name; return e; });
  const document = {getElementById: id => nodes[id], querySelector: () => ({focus(){}}), querySelectorAll: () => back};
  vm.runInNewContext(source, {document});
  return {nodes, back};
}
test('group entry is discoverable, while the invitation is not in the page HTML', () => {
  assert.match(fs.readFileSync(path.join(site, 'index.html'), 'utf8'), /href="student-group\.html"/);
  assert.ok(!page.includes(url));
  assert.match(page, /src="assets\/student-group\.js\?v=2"/);
  assert.ok(!source.includes('KPdaTIjQNo93DEeFTldweN'), 'the previous invite must not be used');
  assert.match(page, /id="boy-step"[^>]*hidden/);
  assert.match(page, /id="choice-step"[^>]*hidden/);
  assert.match(page, /শিক্ষার্থী পরিচয় যাচাই করা হয় না/);
});
test('student and boy selections reveal the exact link; other routes and back clear it', () => {
  const {nodes:n, back} = setup();
  n['student-no'].click();
  assert.equal(n['not-student-step'].hidden, false); assert.equal(n['choice-step'].hidden, true); assert.equal(n['group-join'].attrs.href, undefined);
  back[0].click(); n['student-yes'].click();
  assert.equal(n['choice-step'].hidden, false); assert.equal(n['boy-step'].hidden, true);
  n['choose-girl'].click();
  assert.equal(n['girl-step'].hidden, false); assert.equal(n['group-join'].attrs.href, undefined);
  back[2].click(); n['choose-boy'].click();
  assert.equal(n['boy-step'].hidden, false); assert.equal(n['group-join'].attrs.href, url);
  back[3].click(); assert.equal(n['group-join'].attrs.href, undefined);
  back[1].click(); assert.equal(n['student-step'].hidden, false); assert.equal(n['boy-step'].hidden, true);
});
