const test = require('node:test');
const assert = require('node:assert/strict');
const {generateKeyPairSync, createSign} = require('node:crypto');
const {handle, verifyActions} = require('../supabase/functions/feedback/index.js');
const {safeText} = require('../scripts/process-feedback.cjs');
const env = {SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'not-a-real-key'};
const root = 'https://example.test/functions/v1/feedback/';
function request(path, data, headers={}) { return new Request(root+path, {method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)}); }
test('submit validates data and reports success, quota and server failure accurately', async () => {
  let calls = [];
  const db = async (url,opts) => { calls.push({url,opts}); return new Response('"6b87df6b-51e2-4abb-a176-b7653ffce4f1"',{status:200}); };
  const ok = await handle(request('submit',{title:' ভুল ',body:'একটি সমস্যা'}),env,db);
  assert.equal(ok.status,202); assert.deepEqual(await ok.json(),{accepted:true});
  assert.equal(calls.length,1); assert.deepEqual(JSON.parse(calls[0].opts.body),{p_title:'ভুল',p_body:'একটি সমস্যা'});
  for (const data of [{title:' ',body:'x'},{title:'x',body:''},{title:'x\nabc',body:'abc'},{title:'a'.repeat(121),body:'a'}]) assert.equal((await handle(request('submit',data),env,db)).status,400);
  const rate = await handle(request('submit',{title:'x',body:'y'}),env,async()=>new Response(JSON.stringify({message:'feedback_rate_limit'}),{status:400}));
  assert.equal(rate.status,429);
  assert.equal((await handle(request('submit',{title:'x',body:'y'}),env,async()=>new Response('',{status:500}))).status,503);
  assert.equal((await handle(request('queue',{}),env,db)).status,401);
});
test('GitHub Actions OIDC verifies signature, identity, workflow, audience and expiry', async () => {
  const {privateKey,publicKey} = generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk = publicKey.export({format:'jwk'}); Object.assign(jwk,{kid:'test',alg:'RS256'});
  const jwks = async () => new Response(JSON.stringify({keys:[jwk]}));
  const now = Math.floor(Date.now()/1000);
  const claims = {iss:'https://token.actions.githubusercontent.com',aud:'https://hsc2027.de5.net/feedback-processor',repository:'numb-netizen/Temp',ref:'refs/heads/main',workflow_ref:'numb-netizen/Temp/.github/workflows/feedback-issues.yml@refs/heads/main',event_name:'schedule',iat:now,exp:now+300};
  const token = payload => { const h=Buffer.from(JSON.stringify({alg:'RS256',kid:'test'})).toString('base64url'), p=Buffer.from(JSON.stringify(payload)).toString('base64url'), data=h+'.'+p; return data+'.'+createSign('RSA-SHA256').update(data).sign(privateKey).toString('base64url'); };
  const req = t => new Request(root+'queue',{headers:{authorization:'Bearer '+t}});
  assert.equal(await verifyActions(req(token(claims)),jwks),true);
  for (const update of [{ref:'refs/heads/other'},{aud:'wrong'},{repository:'other/repo'},{workflow_ref:'other'},{event_name:'push'},{exp:now-1},{iat:now-901}]) assert.equal(await verifyActions(req(token({...claims,...update})),jwks),false);
  const parts=token(claims).split('.'); parts[2]=parts[2].slice(0,-4)+'AAAA';
  assert.equal(await verifyActions(req(parts.join('.')),jwks),false);
});
test('anonymous text cannot inject markdown or mention users in an issue', () => {
  const value = safeText('@everyone <script> [link](https://example.org)');
  assert.ok(value.includes('@\u200beveryone')); assert.ok(value.includes('&lt;script&gt;'));
  assert.ok(value.includes('\\[link\\]\\(https://example\\.org\\)'));
});
test('issue processor creates once, recovers after mark failure, and marks delivered items', async () => {
  const {run} = require('../scripts/process-feedback.cjs');
  const oldFetch = global.fetch, oldEnv = {...process.env};
  const item = {id:'aabbccdd-1234-4567-8901-123456789abc', title:'Hello', body:'@someone <b>hello</b>', created_at:'2026-01-01T00:00:00Z'};
  const calls = [], created = [];
  let existing = false;
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://oidc.example/token';
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-only'; process.env.GITHUB_TOKEN = 'test-only';
  global.fetch = async (url, options={}) => {
    url = String(url); calls.push({url,options});
    if (url.startsWith('https://oidc.example/')) return Response.json({value:'test-oidc'});
    if (url.endsWith('/feedback/queue')) return Response.json([item]);
    if (url.includes('/issues?')) return Response.json(existing ? [{number:17,body:`<!-- site-feedback:${item.id} -->`}] : []);
    if (url.endsWith('/issues') && options.method === 'POST') { created.push(JSON.parse(options.body)); return Response.json({number:17}); }
    if (url.endsWith('/feedback/mark')) return Response.json({marked:true});
    throw Error('Unexpected URL '+url);
  };
  try {
    await run(); assert.equal(created.length,1); assert.match(created[0].body, /@\u200bsomeone/); assert.ok(created[0].body.includes(`<!-- site-feedback:${item.id} -->`));
    assert.deepEqual(JSON.parse(calls.find(c => c.url.endsWith('/feedback/mark')).options.body), {id:item.id,issue_number:17});
    existing = true; await run(); assert.equal(created.length,1, 'existing issue must not be recreated on retry');
  } finally { global.fetch = oldFetch; process.env = oldEnv; }
});
