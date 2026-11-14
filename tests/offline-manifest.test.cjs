const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {makeManifest} = require('../scripts/offline-manifest.cjs');

test('offline manifest covers actual site resources and is deterministic', () => {
  const root = path.join(__dirname, '..', 'site');
  const a = makeManifest(root), b = makeManifest(root);
  assert.deepEqual(a, b); assert.equal(a.version, 1);
  for (const p of ['index.html', 'dabi.html', 'routine.html', 'tracker.html', 'assets/style.css', 'assets/app.js', 'assets/study-logo.png']) {
    const item = a.files.find(f => f.path === p); assert.ok(item, p);
    const content = fs.readFileSync(path.join(root, p));
    assert.equal(item.size, content.length); assert.equal(item.sha256, crypto.createHash('sha256').update(content).digest('hex'));
  }
  assert.ok(!a.files.some(f => f.path === 'CNAME' || f.path === 'offline-manifest.json'));
});

test('unsafe paths and symlinks are rejected', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-manifest-'));
  try {
    fs.writeFileSync(path.join(root, '.hidden'), 'x');
    assert.throws(() => makeManifest(root), /Unsafe path/);
    fs.unlinkSync(path.join(root, '.hidden'));
    fs.symlinkSync('/etc/passwd', path.join(root, 'link.js'));
    assert.throws(() => makeManifest(root), /symlink/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
