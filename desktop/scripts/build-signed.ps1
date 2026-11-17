# Build with an exportable PFX. Keep secrets out of Git and remove the temporary key file.
param([string]$OutputDirectory = 'dist-signed')
$ErrorActionPreference = 'Stop'
$thumb = $env:WINDOWS_SIGNING_CERT_SHA1
if ([string]::IsNullOrWhiteSpace($env:WINDOWS_SIGNING_PFX_BASE64) -or
    [string]::IsNullOrWhiteSpace($env:WINDOWS_SIGNING_PFX_PASSWORD) -or
    $thumb -notmatch '^[0-9A-Fa-f]{40}$') {
  throw 'Signing requires the protected PFX, its password, and a 40-hex-digit certificate thumbprint.'
}
if ($OutputDirectory -notmatch '^[a-zA-Z0-9_-]+$') { throw 'Invalid build output directory.' }
$tempDir = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [IO.Path]::GetTempPath() }
$pfx = Join-Path $tempDir ("hsc-signing-" + [guid]::NewGuid().ToString('N') + '.pfx')
try {
  [IO.File]::WriteAllBytes($pfx, [Convert]::FromBase64String($env:WINDOWS_SIGNING_PFX_BASE64))
  Remove-Item Env:WINDOWS_SIGNING_PFX_BASE64
  $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
    $pfx, $env:WINDOWS_SIGNING_PFX_PASSWORD,
    [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
  try {
    if (-not $cert.HasPrivateKey -or $cert.Thumbprint -ne $thumb) {
      throw 'The PFX must have the private key and match the configured certificate thumbprint.'
    }
    if ($cert.NotBefore -gt (Get-Date) -or $cert.NotAfter -le (Get-Date)) { throw 'The signing certificate is not currently valid.' }
  } finally { $cert.Dispose() }
  $env:CSC_LINK = $pfx
  $env:CSC_KEY_PASSWORD = $env:WINDOWS_SIGNING_PFX_PASSWORD
  Remove-Item Env:WINDOWS_SIGNING_PFX_PASSWORD
  # Force signing of both application and installer; do not alter the normal unsigned build.
  & npx electron-builder --win nsis --x64 --publish never `
    --config.win.signAndEditExecutable=true --config.forceCodeSigning=true `
    "--config.directories.output=$OutputDirectory"
  if ($LASTEXITCODE -ne 0) { throw "electron-builder failed: $LASTEXITCODE" }
} finally {
  Remove-Item Env:CSC_LINK,Env:CSC_KEY_PASSWORD,Env:WINDOWS_SIGNING_PFX_BASE64,Env:WINDOWS_SIGNING_PFX_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $pfx -Force -ErrorAction SilentlyContinue
}
