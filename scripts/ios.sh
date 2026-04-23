#!/usr/bin/env bash
# scripts/ios.sh — one command for every iOS Capacitor situation.
#
# Usage:
#   ./scripts/ios.sh dev      # daily: sync + open Xcode (hot-reload from Lovable)
#   ./scripts/ios.sh prod     # release: bundled assets, no live preview
#   ./scripts/ios.sh sync     # after adding a Capacitor plugin
#   ./scripts/ios.sh fix      # ios/ folder is broken — full wipe & rebuild
#   ./scripts/ios.sh doctor   # diagnose without changing anything

set -euo pipefail

MODE="${1:-prod}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

c_red()    { printf "\033[31m%s\033[0m\n" "$*"; }
c_green()  { printf "\033[32m%s\033[0m\n" "$*"; }
c_yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
c_blue()   { printf "\033[34m%s\033[0m\n" "$*"; }

require_root() {
  [[ -f package.json && -f capacitor.config.ts ]] || {
    c_red "Must run from project root (where package.json lives)."
    exit 1
  }
}

ensure_deps() {
  [[ -d node_modules ]] || { c_blue "Installing npm dependencies..."; npm install; }
}

ensure_build() {
  [[ -d dist ]] || { c_blue "Building web assets..."; npm run build; }
}

ensure_ios_platform() {
  if [[ ! -d ios/App ]]; then
    c_blue "iOS platform not found. Adding it..."
    npx cap add ios
  fi
}

# Regenerate the iOS AppIcon from assets/icon.png. Capacitor wipes the
# AppIcon.appiconset on every `cap add ios`, so we have to re-run this
# every time or the home-screen icon goes blank.
generate_app_icon() {
  if [[ ! -f assets/icon.png ]]; then
    c_yellow "assets/icon.png missing — skipping icon generation."
    return
  fi
  c_blue "Generating iOS AppIcon from assets/icon.png..."
  npx --yes @capacitor/assets generate --ios \
    --iconBackgroundColor "#FFFFFF" \
    --iconBackgroundColorDark "#0F172A" \
    >/dev/null 2>&1 || c_yellow "Icon generation failed (non-fatal). Run manually: npx @capacitor/assets generate --ios"
}

# Verify the AppIcon set was actually written before we hand off to Xcode.
# A blank icon almost always means `cap add ios` ran after generate and wiped it,
# or @capacitor/assets failed silently. Either way, we do NOT want to open Xcode
# in that state — the user will archive a build with a white square icon.
verify_app_icon() {
  local iconset="ios/App/App/Assets.xcassets/AppIcon.appiconset"
  if [[ ! -d "$iconset" ]]; then
    c_red "Pre-build check failed: $iconset is missing."
    c_red "iOS platform looks broken. Run: ./scripts/ios.sh fix"
    exit 1
  fi
  # Capacitor's generator writes AppIcon-512@2x.png (1024x1024) as the marketing icon.
  # If it isn't there, the icon set is the empty placeholder and Xcode will ship a blank icon.
  if [[ ! -f "$iconset/AppIcon-512@2x.png" ]]; then
    c_red "Pre-build check failed: AppIcon-512@2x.png missing in $iconset."
    c_red "Icon was not generated. Fix:"
    c_red "  1) ensure assets/icon.png exists (1024x1024 PNG)"
    c_red "  2) run: npx @capacitor/assets generate --ios"
    c_red "  3) re-run this script"
    exit 1
  fi
  c_green "AppIcon verified."
}

case "$MODE" in
  dev)
    require_root
    ensure_deps
    ensure_build
    ensure_ios_platform
    generate_app_icon
    c_blue "Syncing Capacitor (dev: hot-reload from Lovable)..."
    npx cap sync ios
    verify_app_icon
    c_green "Opening Xcode. Hit Run (⌘R) — the simulator will load the live preview."
    npx cap open ios
    ;;

  prod)
    require_root
    c_yellow "PROD build: app will load bundled assets (no live preview, OAuth stays in-app)."
    ensure_deps
    c_blue "Building web assets..."
    npm run build
    c_blue "Re-creating ios/ in prod mode..."
    rm -rf ios
    CAP_MODE=prod npx cap add ios
    generate_app_icon
    CAP_MODE=prod npx cap sync ios
    verify_app_icon
    c_green "Opening Xcode. Build for a real device or Archive for TestFlight."
    CAP_MODE=prod npx cap open ios
    ;;

  sync)
    require_root
    ensure_deps
    ensure_build
    ensure_ios_platform
    generate_app_icon
    c_blue "Syncing iOS plugins..."
    npx cap sync ios
    c_green "Done. Reopen Xcode if it was already open so it picks up new plugins."
    ;;

  fix)
    require_root
    c_yellow "Full wipe & rebuild — this resets ios/, node_modules, and Xcode caches."
    read -r -p "Continue? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || { c_red "Aborted."; exit 1; }
    rm -rf ios node_modules ~/Library/Developer/Xcode/DerivedData
    npm install
    npm run build
    npx cap add ios
    generate_app_icon
    npx cap sync ios
    c_green "Done. Opening Xcode — do File → Packages → Reset Package Caches once."
    npx cap open ios
    ;;

  doctor)
    require_root
    c_blue "Diagnosing iOS setup..."
    echo
    printf "Node:       "; node -v 2>/dev/null || c_red "missing"
    printf "Xcode:      "; xcodebuild -version 2>/dev/null | head -1 || c_red "missing — install Xcode 26+"
    printf "node_modules: "; [[ -d node_modules ]] && c_green "ok" || c_yellow "missing (run: npm install)"
    printf "dist/:      "; [[ -d dist ]] && c_green "ok" || c_yellow "missing (run: npm run build)"
    printf "ios/App:    "; [[ -d ios/App ]] && c_green "ok" || c_yellow "missing (run: ./scripts/ios.sh dev)"
    if [[ -f ios/App/App/capacitor.config.json ]]; then
      if grep -q '"url"' ios/App/App/capacitor.config.json; then
        c_yellow "Mode:       DEV (live preview from Lovable)"
      else
        c_green  "Mode:       PROD (bundled assets)"
      fi
    fi
    echo
    c_blue "Commands: dev | prod | sync | fix | doctor"
    ;;

  *)
    c_red "Unknown mode: $MODE"
    echo "Usage: ./scripts/ios.sh {dev|prod|sync|fix|doctor}"
    exit 1
    ;;
esac
