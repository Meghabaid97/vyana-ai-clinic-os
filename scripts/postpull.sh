#!/usr/bin/env bash
# Run this after every `git pull` to keep your local environment in sync.
#
# Usage:
#   ./scripts/postpull.sh           # normal: npm install + cap sync + build
#   ./scripts/postpull.sh --clean   # nuke node_modules + lockfile first
#   ./scripts/postpull.sh --ios     # also open Xcode after sync
#   ./scripts/postpull.sh --android # also open Android Studio after sync
#
# What it does, in order:
#   1. (optional) rm -rf node_modules package-lock.json
#   2. npm install                       # picks up new deps (e.g. @capacitor/browser)
#   3. npm run build                     # produces dist/ for Capacitor to copy
#   4. npx cap sync                      # syncs web build + native plugins to ios/android
#   5. (optional) npx cap open ios|android

set -euo pipefail

CLEAN=false
OPEN_IOS=false
OPEN_ANDROID=false

for arg in "$@"; do
  case "$arg" in
    --clean)   CLEAN=true ;;
    --ios)     OPEN_IOS=true ;;
    --android) OPEN_ANDROID=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."

if $CLEAN; then
  echo "==> Cleaning node_modules and package-lock.json"
  rm -rf node_modules package-lock.json
fi

echo "==> Installing npm dependencies"
npm install

echo "==> Building web bundle"
npm run build

echo "==> Syncing Capacitor (iOS + Android)"
npx cap sync

if $OPEN_IOS; then
  echo "==> Opening Xcode"
  npx cap open ios
fi

if $OPEN_ANDROID; then
  echo "==> Opening Android Studio"
  npx cap open android
fi

echo ""
echo "✅ Post-pull sync complete."
echo "   Run on device:  npx cap run ios   |   npx cap run android"
