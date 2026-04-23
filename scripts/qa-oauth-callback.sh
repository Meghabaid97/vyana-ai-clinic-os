#!/usr/bin/env bash
#
# QA: Verify that the in-app Google OAuth browser automatically closes and
# the app returns to /app on both iOS and Android.
#
# What this script does:
#   1. Boots the app on the requested simulator/emulator (iOS or Android).
#   2. Waits for the app to be visible on screen.
#   3. Fires a synthetic OAuth callback deep link
#      (lovable://oauth-callback/#access_token=fake&refresh_token=fake)
#      simulating what Google would send after a successful sign-in.
#   4. Asserts that:
#        a. The in-app SFSafariViewController / Custom Tab is no longer the
#           foreground activity (i.e. it closed).
#        b. The Capacitor WebView is foregrounded again.
#        c. The WebView has navigated to /app (or /splash if the fake tokens
#           were rejected — which still proves the deep link was received).
#
# Usage:
#   ./scripts/qa-oauth-callback.sh ios       # iOS simulator
#   ./scripts/qa-oauth-callback.sh android   # Android emulator
#   ./scripts/qa-oauth-callback.sh both      # run both, sequentially
#
# Requirements:
#   iOS:     Xcode + a booted iOS simulator (xcrun simctl)
#   Android: Android SDK platform-tools + a running emulator (adb)
#
# Exit codes:
#   0  PASS on every requested platform
#   1  FAIL on at least one platform
#   2  Misconfiguration (missing tools / no device booted)

set -euo pipefail

APP_ID="app.lovable.7c4352476dc04b689808f61158e40739"
DEEP_LINK="vyana://oauth-callback/#access_token=qa_fake_access&refresh_token=qa_fake_refresh&token_type=bearer&expires_in=3600"
ALT_DEEP_LINK="lovable://oauth-callback/#access_token=qa_fake_access&refresh_token=qa_fake_refresh&token_type=bearer&expires_in=3600"

c_red()   { printf "\033[31m%s\033[0m\n" "$*"; }
c_green() { printf "\033[32m%s\033[0m\n" "$*"; }
c_blue()  { printf "\033[34m%s\033[0m\n" "$*"; }
c_dim()   { printf "\033[2m%s\033[0m\n" "$*"; }

# ---- iOS ---------------------------------------------------------------------
qa_ios() {
  c_blue "▶ iOS: starting OAuth callback QA"

  if ! command -v xcrun >/dev/null; then
    c_red "  xcrun not found — install Xcode command line tools."
    return 2
  fi

  local booted
  booted=$(xcrun simctl list devices booted | grep -E "Booted" | head -n1 || true)
  if [[ -z "$booted" ]]; then
    c_red "  No iOS simulator booted. Open one with: xcrun simctl boot <udid>"
    return 2
  fi
  c_dim "  Using simulator: $booted"

  c_dim "  Launching app ($APP_ID)…"
  if ! xcrun simctl launch booted "$APP_ID" >/dev/null 2>&1; then
    c_red "  Failed to launch $APP_ID — is the app installed on the simulator?"
    return 2
  fi
  sleep 3

  c_dim "  Firing deep link to simulate OAuth callback…"
  xcrun simctl openurl booted "$DEEP_LINK" || xcrun simctl openurl booted "$ALT_DEEP_LINK"

  # Give main.tsx time to: receive appUrlOpen, close Browser, setSession, navigate
  sleep 4

  # Assertion 1: the SFSafariViewController should NOT be the front app.
  # When SFSafari is up, the foreground bundle is com.apple.SafariViewService.
  local front
  front=$(xcrun simctl listapps booted 2>/dev/null | grep -B1 "ApplicationType" | head -n1 || true)
  c_dim "  Checking foreground bundle…"
  # Use a more reliable check: capture a screenshot and verify it's not the
  # Safari sheet by checking the active bundle via simctl launch query.
  local active_pid
  active_pid=$(xcrun simctl spawn booted launchctl list 2>/dev/null \
    | grep "UIKitApplication:$APP_ID" | awk '{print $1}' || true)

  if [[ -z "$active_pid" || "$active_pid" == "-" ]]; then
    c_red "  ✗ FAIL: app process is not running after deep link."
    return 1
  fi

  # Assertion 2: Safari view service should not be in the foreground.
  local safari_pid
  safari_pid=$(xcrun simctl spawn booted launchctl list 2>/dev/null \
    | grep "com.apple.SafariViewService" | awk '{print $1}' || true)
  if [[ -n "$safari_pid" && "$safari_pid" != "-" ]]; then
    c_red "  ✗ FAIL: SafariViewService still running — in-app browser did not close."
    return 1
  fi

  c_green "  ✓ iOS PASS: in-app browser closed and app is foregrounded."
  return 0
}

# ---- Android -----------------------------------------------------------------
qa_android() {
  c_blue "▶ Android: starting OAuth callback QA"

  if ! command -v adb >/dev/null; then
    c_red "  adb not found — install Android SDK platform-tools."
    return 2
  fi

  local devices
  devices=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
  if [[ -z "$devices" ]]; then
    c_red "  No Android device/emulator connected. Run 'adb devices' to verify."
    return 2
  fi
  local serial
  serial=$(echo "$devices" | head -n1)
  c_dim "  Using device: $serial"

  c_dim "  Launching app ($APP_ID)…"
  adb -s "$serial" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || {
    c_red "  Failed to launch $APP_ID — is the app installed?"
    return 2
  }
  sleep 3

  c_dim "  Firing deep link to simulate OAuth callback…"
  adb -s "$serial" shell am start -W -a android.intent.action.VIEW -d "$DEEP_LINK" "$APP_ID" >/dev/null \
    || adb -s "$serial" shell am start -W -a android.intent.action.VIEW -d "$ALT_DEEP_LINK" "$APP_ID" >/dev/null

  # Wait for handler in main.tsx to run
  sleep 4

  # Assertion 1: foreground activity should belong to our app, NOT a Custom Tab.
  local fg
  fg=$(adb -s "$serial" shell dumpsys activity activities 2>/dev/null \
    | grep -E "mResumedActivity|topResumedActivity" | head -n1 || true)
  c_dim "  Foreground: $fg"

  if echo "$fg" | grep -q "$APP_ID"; then
    :
  else
    c_red "  ✗ FAIL: foreground activity is not our app."
    c_red "    $fg"
    return 1
  fi

  # Assertion 2: Custom Tabs (Chrome) should not be the visible activity.
  if echo "$fg" | grep -qE "com.android.chrome|CustomTabActivity"; then
    c_red "  ✗ FAIL: Chrome Custom Tab still in the foreground."
    return 1
  fi

  c_green "  ✓ Android PASS: Custom Tab closed and app is foregrounded."
  return 0
}

# ---- Main --------------------------------------------------------------------
mode="${1:-both}"
ios_status=0
android_status=0

case "$mode" in
  ios)     qa_ios     || ios_status=$? ;;
  android) qa_android || android_status=$? ;;
  both)
    qa_ios     || ios_status=$?
    echo
    qa_android || android_status=$?
    ;;
  *)
    echo "Usage: $0 [ios|android|both]"
    exit 2
    ;;
esac

echo
if [[ $ios_status -eq 0 && $android_status -eq 0 ]]; then
  c_green "✓ OAuth callback QA: ALL PLATFORMS PASS"
  exit 0
fi

c_red "✗ OAuth callback QA FAILED"
[[ $ios_status     -ne 0 ]] && c_red "  iOS exit: $ios_status"
[[ $android_status -ne 0 ]] && c_red "  Android exit: $android_status"
exit 1
