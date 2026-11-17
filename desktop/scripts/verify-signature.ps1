param(
  [Parameter(Mandatory)][string]$ExpectedThumbprint,
  [Parameter(Mandatory)][string]$AppPath,
  [Parameter(Mandatory)][string]$InstallerPath,
  [switch]$AllowUntrustedTestCertificate
)
$ErrorActionPreference = 'Stop'
if ($ExpectedThumbprint -notmatch '^[0-9A-Fa-f]{40}$') { throw 'Invalid certificate thumbprint.' }
foreach ($file in @($AppPath, $InstallerPath)) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing executable: $file" }
  $signature = Get-AuthenticodeSignature -LiteralPath $file
  $allowed = if ($AllowUntrustedTestCertificate) { @('Valid', 'NotTrusted', 'UnknownError') } else { @('Valid') }
  if ($signature.Status.ToString() -notin $allowed) { throw "Invalid Authenticode signature: $file ($($signature.Status))" }
  if (-not $signature.SignerCertificate -or $signature.SignerCertificate.Thumbprint -ne $ExpectedThumbprint) {
    throw "Unexpected signing certificate: $file"
  }
  if (-not $signature.TimeStamperCertificate) { throw "Missing trusted timestamp: $file" }
  Write-Host "Signature checked: $file ($($signature.Status)); signer $($signature.SignerCertificate.Thumbprint); timestamp present"
}
