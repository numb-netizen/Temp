'use strict';
// Runs only on the default branch, with GitHub's short-lived job and OIDC tokens.
const endpoint = 'https://cciwbmtmlrlgpgewiaqk.supabase.co/functions/v1/feedback';
const audience = 'https://hsc2027.de5.net/feedback-processor';
const repo = 'numb-netizen/Temp';
async function json(url, init = {}) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  return res.json();
}
function safeText(s) {
  // Escape HTML, Markdown, and @mentions in anonymous user input.
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/([\\`*_{}\[\]()#+\-.!|])/g,'\\$1').replace(/@/g,'@\u200b');
}
async function run() {
  const tokenUrl = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  tokenUrl.searchParams.set('audience', audience);
  const oidc = await json(tokenUrl, {headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});
  const edgeHeaders = {Authorization:'Bearer '+oidc.value, 'Content-Type':'application/json'};
  const githubHeaders = {Authorization:'Bearer '+process.env.GITHUB_TOKEN, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'HSC-2027-feedback'};
  const queue = await json(endpoint+'/queue',{headers:edgeHeaders});
  for (const item of queue) {
    const marker = `<!-- site-feedback:${item.id} -->`;
    const since = new Date(Date.parse(item.created_at) - 120000).toISOString();
    let found;
    for (let page=1; ; page++) {
      const issues = await json(`https://api.github.com/repos/${repo}/issues?state=all&since=${encodeURIComponent(since)}&per_page=100&page=${page}`, {headers:githubHeaders});
      found = issues.find(issue => !issue.pull_request && typeof issue.body === 'string' && issue.body.includes(marker));
      if (found || issues.length < 100) break;
    }
    if (!found) {
      found = await json(`https://api.github.com/repos/${repo}/issues`, {method:'POST',headers:{...githubHeaders,'Content-Type':'application/json'},body:JSON.stringify({title:'[সাইটের মতামত] '+item.title.replace(/@/g,'@\u200b'),body:`ওয়েবসাইট থেকে পাঠানো প্রকাশ্য মতামত:\n\n${safeText(item.body)}\n\n${marker}`})});
    }
    await json(endpoint+'/mark',{method:'POST',headers:edgeHeaders,body:JSON.stringify({id:item.id,issue_number:found.number})});
    console.log(`Feedback delivered as issue #${found.number}`);
  }
  console.log(`Processed ${queue.length} queued feedback item(s).`);
}
if (require.main === module) run().catch(error=>{ console.error(error.message); process.exitCode=1; });
module.exports = {safeText,run};
