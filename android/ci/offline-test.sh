#!/bin/bash
set -euo pipefail
# Report failures as annotations; hosted-runner log downloads may be unavailable.
log=$(mktemp)
trap 'code=$?; if ((code)); then message=$(tail -c 4000 "$log" | sed ":a;N;\$!ba;s/\n/%0A/g"); echo "::error title=Offline emulator setup or test::$message"; fi; rm -f "$log"' EXIT
run() { echo "+ $*" | tee -a "$log"; "$@" 2>&1 | tee -a "$log"; }
run adb shell svc wifi disable
run adb shell svc data disable
cd android
run ./gradlew --no-daemon connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=bd.edu.hsc2027.OfflineSiteTest -Pandroid.testInstrumentationRunnerArguments.requireOffline=true
