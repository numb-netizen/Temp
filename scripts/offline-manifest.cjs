// Build a deterministic list of all files that can be served offline by the app.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const allowed = /\.(?:html|css|js|png|jpe?g|webp|gif|svg|woff2?)$/i;
function makeManifest(root) {
  const files = [];
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${prefix}${entry.name}`);
      const rel = prefix + entry.name;
      if (!/^[A-Za-z0-9_.\/-]+$/.test(rel) || entry.name.startsWith('.')) throw new Error(`Unsafe path: ${rel}`);
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel + '/');
      else if (entry.isFile() && allowed.test(rel)) {
        const data = fs.readFileSync(path.join(dir, entry.name));
        files.push({path: rel, size: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex')});
      }
    }
  }
  walk(root);
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return {version: 1, files};
}
if (require.main === module) {
  const root = path.resolve(process.argv[2] || 'site');
  const data = JSON.stringify(makeManifest(root)) + '\n';
  fs.writeFileSync(path.join(root, 'offline-manifest.json'), data);
  console.log(`Offline update manifest: ${JSON.parse(data).files.length} files`);
}
module.exports = {makeManifest};
