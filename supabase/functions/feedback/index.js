// Public submission + a private GitHub Actions OIDC-authenticated queue.
// GitHub credentials never leave the Actions runner.
const ALLOWED_ORIGINS = new Set(['https://hsc2027.de5.net', 'https://numb-netizen.github.io', 'hscapp://site', 'http://127.0.0.1:19828', 'http://127.0.0.1:19829']);
const AUDIENCE = 'https://hsc2027.de5.net/feedback-processor';
const WORKFLOW = 'numb-netizen/Temp/.github/workflows/feedback-issues.yml@refs/heads/main';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function cors(req) {
  const origin = req.headers.get('origin');
  return origin && ALLOWED_ORIGINS.has(origin) ? {'Access-Control-Allow-Origin':origin, 'Vary':'Origin', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'content-type'} : {};
}
function reply(req, status, body) { return new Response(JSON.stringify(body), {status, headers:{...cors(req), 'Content-Type':'application/json', 'Cache-Control':'no-store'}}); }
function decode64(s) {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw Error('invalid encoding');
  const raw = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function verifyActions(req, fetcher = fetch) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ') || auth.length > 12000) return false;
    const parts = auth.slice(7).split('.');
    if (parts.length !== 3) return false;
    const header = JSON.parse(decoder.decode(decode64(parts[0])));
    const claims = JSON.parse(decoder.decode(decode64(parts[1])));
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || !header.kid || claims.iss !== 'https://token.actions.githubusercontent.com' || claims.aud !== AUDIENCE ||
        claims.repository !== 'numb-netizen/Temp' || claims.ref !== 'refs/heads/main' || claims.workflow_ref !== WORKFLOW ||
        !['schedule','workflow_dispatch'].includes(claims.event_name) || !Number.isInteger(claims.exp) || claims.exp <= now ||
        !Number.isInteger(claims.iat) || claims.iat > now + 60 || claims.iat < now - 900 || (claims.nbf && claims.nbf > now + 60)) return false;
    const res = await fetcher('https://token.actions.githubusercontent.com/.well-known/jwks');
    if (!res.ok) return false;
    const data = await res.json();
    const jwk = data.keys.find(k => k.kid === header.kid && k.kty === 'RSA' && k.alg === 'RS256');
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode64(parts[2]), encoder.encode(parts[0]+'.'+parts[1]));
  } catch { return false; }
}
async function smallJson(req) {
  if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) throw Error('content-type');
  if (Number(req.headers.get('content-length') || 0) > 4096 || !req.body) throw Error('size');
  const reader = req.body.getReader(); let size = 0, chunks = [];
  try {
    while (true) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > 4096) { await reader.cancel(); throw Error('size'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(size); let offset=0; for (const chunk of chunks) { data.set(chunk,offset); offset+=chunk.length; }
  return JSON.parse(decoder.decode(data));
}
async function handle(req, env, fetcher = fetch) {
  const path = new URL(req.url).pathname.replace(/\/$/, '').split('/').pop();
  if (req.method === 'OPTIONS' && path === 'submit') return new Response(null, {status:204, headers:cors(req)});
  const db = env.SUPABASE_URL + '/rest/v1/';
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !secret) return reply(req,503,{error:'unavailable'});
  const headers = {apikey:secret, authorization:'Bearer '+secret, 'Content-Type':'application/json'};
  try {
    if (path === 'submit' && req.method === 'POST') {
      const data = await smallJson(req);
      if (!data || typeof data.title !== 'string' || typeof data.body !== 'string' || !data.title.trim() || !data.body.trim() || [...data.title].length > 120 || [...data.body].length > 500 || /[\x00-\x1f\x7f]/.test(data.title) || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(data.body)) return reply(req,400,{error:'invalid'});
      const result = await fetcher(db+'rpc/enqueue_feedback', {method:'POST', headers, body:JSON.stringify({p_title:data.title.trim(),p_body:data.body.trim()})});
      if (!result.ok) {
        const error = await result.json().catch(()=>({}));
        return error.message === 'feedback_rate_limit' ? reply(req,429,{error:'rate_limit'}) : reply(req,503,{error:'unavailable'});
      }
      return reply(req,202,{accepted:true});
    }
    if (!await verifyActions(req,fetcher)) return reply(req,401,{error:'unauthorized'});
    if (path === 'queue' && req.method === 'GET') {
      const result = await fetcher(db+'feedback_queue?select=id,title,body,created_at&issue_number=is.null&order=created_at.asc,id.asc&limit=5',{headers});
      if (!result.ok) return reply(req,503,{error:'unavailable'});
      return reply(req,200,await result.json());
    }
    if (path === 'mark' && req.method === 'POST') {
      const data = await smallJson(req);
      if (!data || typeof data.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(data.id) || !Number.isSafeInteger(data.issue_number) || data.issue_number <= 0) return reply(req,400,{error:'invalid'});
      const result = await fetcher(db+'feedback_queue?id=eq.'+data.id+'&issue_number=is.null',{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({issue_number:data.issue_number})});
      if (!result.ok) return reply(req,503,{error:'unavailable'});
      const updated = await result.json();
      return updated.length === 1 ? reply(req,200,{marked:true}) : reply(req,409,{error:'already_marked'});
    }
    return reply(req,404,{error:'not_found'});
  } catch { return reply(req,503,{error:'unavailable'}); }
}
if (typeof Deno !== 'undefined') Deno.serve(req => handle(req, Deno.env.toObject()));
if (typeof module !== 'undefined') module.exports = {handle,verifyActions,smallJson};
