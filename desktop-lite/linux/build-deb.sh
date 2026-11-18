#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
out="${1:-desktop-lite/dist}"
mkdir -p "$out"
out="$(realpath "$out")"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/DEBIAN" "$tmp/opt/hsc-2027-lite/site" "$tmp/usr/bin" "$tmp/usr/share/applications" "$tmp/usr/share/icons/hicolor/256x256/apps"
cp -a site/. "$tmp/opt/hsc-2027-lite/site/"
cp desktop-lite/linux/{hsc-lite.py,policy.py} "$tmp/opt/hsc-2027-lite/"
chmod 755 "$tmp/opt/hsc-2027-lite/hsc-lite.py"
ln -s /opt/hsc-2027-lite/hsc-lite.py "$tmp/usr/bin/hsc-2027-lite"
cp desktop/build-resources/icon.png "$tmp/usr/share/icons/hicolor/256x256/apps/hsc-2027-lite.png"
cat > "$tmp/DEBIAN/control" <<'CONTROL'
Package: hsc-2027-lite
Version: 0.2.1~beta1
Section: education
Priority: optional
Architecture: all
Maintainer: HSC 2027 study site
Depends: python3, python3-gi, gir1.2-gtk-3.0, gir1.2-webkit2-4.1
Description: HSC 2027 study companion (system WebKit)
 Offline study pages and tracker using the system WebKitGTK browser engine.
CONTROL
cat > "$tmp/usr/share/applications/hsc-2027-lite.desktop" <<'DESKTOP'
[Desktop Entry]
Type=Application
Name=HSC 2027 Lite
Comment=Offline study companion
Exec=hsc-2027-lite
Icon=hsc-2027-lite
Categories=Education;
Terminal=false
DESKTOP
dpkg-deb --root-owner-group -Zxz --build "$tmp" "$out/HSC-2027-Lite-0.2.1-beta-linux.deb"
