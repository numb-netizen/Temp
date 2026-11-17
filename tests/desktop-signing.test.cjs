const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('production signing is manually dispatched, main-only and protected by an environment', () => {
  const workflow = read('.github/workflows/windows-signing.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*(push|pull_request):/m);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /environment: windows-signing/);
  assert.match(workflow, /secrets\.WINDOWS_SIGNING_PFX_BASE64/);
  assert.match(workflow, /secrets\.WINDOWS_SIGNING_PFX_PASSWORD/);
  assert.match(workflow, /vars\.WINDOWS_SIGNING_CERT_SHA1/);
  assert.match(workflow, /verify-signature\.ps1/);
  assert.doesNotMatch(workflow, /-AllowUntrustedTestCertificate/);
  assert.match(workflow, /needs: sign/);
  assert.match(workflow, /desktop-v0\.1\.0-signed-beta/);
});

test('forced signing, trusted verification and isolated dummy CI build are all required', () => {
  const build = read('desktop/scripts/build-signed.ps1');
  const verify = read('desktop/scripts/verify-signature.ps1');
  const testScript = read('desktop/scripts/test-signing.ps1');
  for (const required of ['WINDOWS_SIGNING_PFX_BASE64','WINDOWS_SIGNING_PFX_PASSWORD','WINDOWS_SIGNING_CERT_SHA1','HasPrivateKey','EphemeralKeySet','--config.win.signAndEditExecutable=true','--config.forceCodeSigning=true','Remove-Item -LiteralPath $pfx']) assert.ok(build.includes(required), required);
  for (const required of ['Get-AuthenticodeSignature','SignerCertificate.Thumbprint','TimeStamperCertificate',"else { @('Valid') }"]) assert.ok(verify.includes(required), required);
  assert.match(testScript, /dist-ci-signed/);
  assert.match(testScript, /Production verifier accepted the untrusted test certificate/);
  assert.match(read('.github/workflows/desktop.yml'), /\.\/scripts\/test-signing\.ps1/);
  assert.equal(require('../desktop/package.json').build.win.signAndEditExecutable, false, 'normal beta remains explicitly unsigned');
});
