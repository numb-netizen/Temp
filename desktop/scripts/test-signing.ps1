# CI-only: generate a throwaway, untrusted certificate; NEVER publish this test build.
$ErrorActionPreference = 'Stop'
$cert = $null
$pfx = Join-Path $env:RUNNER_TEMP ("hsc-test-" + [guid]::NewGuid().ToString('N') + '.pfx')
try {
  $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject 'CN=HSC Desktop CI Test Only' -CertStoreLocation Cert:\CurrentUser\My
  $password = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
  $secure = ConvertTo-SecureString $password -AsPlainText -Force
  Export-PfxCertificate -Cert $cert -FilePath $pfx -Password $secure | Out-Null
  $env:WINDOWS_SIGNING_PFX_BASE64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfx))
  $env:WINDOWS_SIGNING_PFX_PASSWORD = $password
  $env:WINDOWS_SIGNING_CERT_SHA1 = $cert.Thumbprint
  & ./scripts/build-signed.ps1 -OutputDirectory dist-ci-signed
  $installers = @(Get-ChildItem -Path dist-ci-signed -Filter '*.exe' -File)
  if ($installers.Count -ne 1) { throw 'Expected exactly one test installer.' }
  & ./scripts/verify-signature.ps1 -ExpectedThumbprint $cert.Thumbprint `
    -AppPath 'dist-ci-signed/win-unpacked/HSC 2027.exe' -InstallerPath $installers[0].FullName -AllowUntrustedTestCertificate
  $rejected = $false
  try {
    & ./scripts/verify-signature.ps1 -ExpectedThumbprint ('0' * 40) `
      -AppPath 'dist-ci-signed/win-unpacked/HSC 2027.exe' -InstallerPath $installers[0].FullName -AllowUntrustedTestCertificate
  } catch { $rejected = $true }
  if (-not $rejected) { throw 'Verifier accepted the wrong thumbprint.' }
  $rejected = $false
  try {
    & ./scripts/verify-signature.ps1 -ExpectedThumbprint $cert.Thumbprint `
      -AppPath 'dist-ci-signed/win-unpacked/HSC 2027.exe' -InstallerPath $installers[0].FullName
  } catch { $rejected = $true }
  if (-not $rejected) { throw 'Production verifier accepted the untrusted test certificate.' }
  Write-Host 'Throwaway signing test passed; the test certificate is not trusted and the output is not distributed.'
} finally {
  Remove-Item Env:WINDOWS_SIGNING_PFX_BASE64,Env:WINDOWS_SIGNING_PFX_PASSWORD,Env:WINDOWS_SIGNING_CERT_SHA1 -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $pfx -Force -ErrorAction SilentlyContinue
  if ($cert) { Remove-Item -LiteralPath ("Cert:\CurrentUser\My\" + $cert.Thumbprint) -Force -ErrorAction SilentlyContinue }
  Remove-Item -LiteralPath 'dist-ci-signed' -Recurse -Force -ErrorAction SilentlyContinue
}
