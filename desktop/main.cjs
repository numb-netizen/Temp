'use strict';
const {app, BrowserWindow, Menu, protocol, net, shell, session} = require('electron');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const {isInternal, isExternal, resolveSitePath} = require('./policy.cjs');

const HOME = 'hscapp://site/index.html';
protocol.registerSchemesAsPrivileged([{scheme:'hscapp', privileges:{standard:true, secure:true, supportFetchAPI:true}}]);
const smoke = process.env.HSC_DESKTOP_SMOKE === '1';
let smokeDir;
if (smoke) {
  smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hsc-desktop-test-'));
  app.setPath('userData', smokeDir);
}
const siteRoot = app.isPackaged ? path.join(process.resourcesPath, 'site') : path.join(__dirname, '..', 'site');
function openExternal(url) {
  if (isExternal(url)) shell.openExternal(url).catch(() => {});
}
function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 320, minHeight: 480,
    title: 'HSC 2027', backgroundColor: '#07130d', show: !smoke,
    icon: path.join(siteRoot, 'assets', 'study-logo.png'),
    webPreferences: {nodeIntegration:false, contextIsolation:true, sandbox:true, webSecurity:true}
  });
  win.webContents.setWindowOpenHandler(({url}) => {
    if (isInternal(url)) win.loadURL(url);
    else openExternal(url);
    return {action:'deny'};
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isInternal(url)) { event.preventDefault(); openExternal(url); }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'নেভিগেশন', submenu:[
      {label:'হোম', click:()=>win.loadURL(HOME)},
      {label:'পেছনে', accelerator:'Alt+Left', click:()=>{if(win.webContents.navigationHistory.canGoBack()) win.webContents.navigationHistory.goBack();}},
      {label:'সামনে', accelerator:'Alt+Right', click:()=>{if(win.webContents.navigationHistory.canGoForward()) win.webContents.navigationHistory.goForward();}},
      {type:'separator'}, {role:'quit', label:'বন্ধ করুন'}
    ]},
    {label:'দেখুন', submenu:[{role:'reload', label:'রিলোড'}, {role:'resetZoom'}, {role:'zoomIn'}, {role:'zoomOut'}, {role:'togglefullscreen'}]}
  ]));
  return win;
}
async function runSmoke(win) {
  const assert = require('node:assert/strict');
  // Treat the internet as unavailable so this checks the bundled snapshot.
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']}, (details, callback)=>callback({cancel:true}));
  await win.loadURL(HOME);
  assert.match(await win.webContents.executeJavaScript('document.title'), /HSC 2027/);
  assert.equal(await win.webContents.executeJavaScript('typeof require'), 'undefined');
  await win.webContents.executeJavaScript("localStorage.setItem('hsc2027:physics:0','1')");
  await win.loadURL('hscapp://site/tracker.html');
  assert.equal(await win.webContents.executeJavaScript("localStorage.getItem('hsc2027:physics:0')"), '1');
  assert.equal(await win.webContents.executeJavaScript("document.querySelector('[data-subject=physics][data-chapter=\"0\"]').classList.contains('done')"), true);
  assert.equal(await win.webContents.executeJavaScript("document.querySelector('#pretest-routine') === null"), true);
  console.log('Desktop offline navigation and tracker smoke test passed');
}
app.whenReady().then(async () => {
  protocol.handle('hscapp', request => {
    const file = resolveSitePath(siteRoot, request.url);
    if (!file) return new Response('Not found', {status:404});
    return net.fetch(pathToFileURL(file).toString());
  });
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  const win = createWindow();
  if (smoke) {
    try { await runSmoke(win); app.exit(0); }
    catch (error) { console.error(error); app.exit(1); }
  } else await win.loadURL(HOME);
}).catch(error => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => app.quit());
