const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const site = path.join(__dirname, '..', 'site');
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
// The owner's exact Clarity snippet, pasted inline so Clarity's install check finds it in the page.
const snippet = `<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "zg4l4nikx2");
</script>
`;
const indexed = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname.slice(1) || 'index.html');

test('the exact Clarity snippet is inline in the head of every indexed page, once, and nowhere else', () => {
  for (const file of fs.readdirSync(site).filter(n => n.endsWith('.html'))) {
    const html = read(file), count = html.split('www.clarity.ms/tag/').length - 1;
    assert.equal(count, indexed.includes(file) ? 1 : 0, file);
    if (!count) continue;
    const head = html.slice(0, html.indexOf('</head>'));
    assert.ok(head.includes(snippet), `${file}: snippet must be verbatim inside <head>`);
  }
  assert.equal(indexed.length, 32);
  assert.ok(!fs.existsSync(path.join(site, 'assets/clarity.js')), 'old loader file removed');
  assert.ok(!indexed.some(file => read(file).includes('assets/clarity.js')));
});

test('the snippet queues calls and loads the zg4l4nikx2 Clarity tag asynchronously', () => {
  const inserted = [], window = {};
  const first = {parentNode: {insertBefore: el => inserted.push(el)}};
  const code = /<script type="text\/javascript">([\s\S]*?)<\/script>/.exec(snippet)[1];
  vm.runInNewContext(code, {window, document: {createElement: () => ({}), getElementsByTagName: () => [first]}});
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].src, 'https://www.clarity.ms/tag/zg4l4nikx2');
  assert.equal(inserted[0].async, 1);
  window.clarity('event', 'test');
  assert.deepEqual([...window.clarity.q[0]], ['event', 'test']);
});

test('feedback text is masked in recordings, and no visitor notice is shown', () => {
  assert.match(read('feedback.html'), /<form class="feedback-form" id="feedback-form" data-clarity-mask="True">/);
  for (const file of indexed) {
    const footer = (read(file).match(/<footer[\s\S]*?<\/footer>/) || [''])[0];
    assert.doesNotMatch(footer, /Clarity/i, file);
  }
});
