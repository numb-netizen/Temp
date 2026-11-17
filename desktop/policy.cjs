'use strict';
const path = require('node:path');

function isInternal(raw) {
  try { const u = new URL(raw); return u.protocol === 'hscapp:' && u.hostname === 'site' && !u.port && !u.username && !u.password; }
  catch { return false; }
}
function isExternal(raw) {
  try {
    const u = new URL(raw);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(u.protocol) && !u.username && !u.password;
  } catch { return false; }
}
function resolveSitePath(root, raw) {
  if (!isInternal(raw)) return null;
  try {
    const pathname = decodeURIComponent(new URL(raw).pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) return null;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    return file.startsWith(path.resolve(root) + path.sep) ? file : null;
  } catch { return null; }
}
module.exports = {isInternal, isExternal, resolveSitePath};
