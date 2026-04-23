# iOS Capacitor Rebuild Checklist

Use this when your local `ios/` folder is broken, half-generated, or Xcode shows
errors like **"Missing package product 'CapApp-SPM'"**, **"No Podfile found"**,
or **"ios platform already exists"**.

> ⚠️ This project uses **Capacitor 8 with Swift Package Manager (SPM)**.
> There is **no `Podfile`** and `pod install` is **not** part of the workflow.

---

## 0. Prerequisites (one-time)

- [ ] macOS with **Xcode 26+** installed (required for Capacitor 8 SPM).
- [ ] Command line tools: `xcode-select --install`
- [ ] Node 20+: `node -v`
- [ ] You cloned the repo from GitHub (not editing inside `ios/App`).

You do **not** need CocoaPods for this project.

---

## 1. Pull the latest code

```bash
cd ~/path/to/vyana-ai-clinic-os   # folder that contains package.json
git pull
ls package.json capacitor.config.ts   # both must exist
```

---

## 2. Wipe the broken native folder

```bash
rm -rf ios node_modules ~/Library/Developer/Xcode/DerivedData
```

---

## 3. Reinstall and build

```bash
npm install
npm run build
```

---

## 4. Re-add the iOS platform (DEV — hot reload from Lovable)

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then in Xcode: **File → Packages → Reset Package Caches**, **Resolve Package
Versions**, **Product → Clean Build Folder**, then **Run**.

The simulator will load the live Lovable preview URL — any web change appears
instantly without rebuilding.

---

## 5. Build a PROD app (no live preview, ships bundled assets)

Use this for TestFlight / App Store / real installable builds. Without this
step the iOS app will keep loading the website and OAuth links will bounce to
Safari.

```bash
rm -rf ios
npm run build
CAP_MODE=prod npx cap add ios
CAP_MODE=prod npx cap sync ios
CAP_MODE=prod npx cap open ios
```

Verify in Xcode:
- `ios/App/App/capacitor.config.json` should **not** contain `server.url`.
- The app should launch directly into the bundled UI offline.

---

## 6. App icon (one-time)

Capacitor does not auto-generate the iOS home-screen icon. Either:

- Open `ios/App/App/Assets.xcassets/AppIcon.appiconset` in Xcode and drag a
  1024×1024 PNG, **or**
- Run `npx @capacitor/assets generate --iconBackgroundColor "#FFFFFF" --iconBackgroundColorDark "#0F172A"`
  after placing a 1024×1024 source at `assets/icon.png`.

---

## Common errors & fixes

| Error                                                          | Cause                                       | Fix                                                          |
| -------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `No Podfile found`                                             | Running `pod install` on an SPM project     | Skip it. Use `npx cap sync ios` only.                        |
| `ios platform already exists`                                  | Half-created `ios/` from a previous run     | `rm -rf ios` then re-run `npx cap add ios`.                  |
| `Missing package product 'CapApp-SPM'`                         | Stale Swift Package cache or Xcode < 26     | Update to Xcode 26, then Reset Package Caches.               |
| App opens website / redirects to Safari                        | `server.url` is set in `capacitor.config`   | Build with `CAP_MODE=prod npx cap sync ios`.                 |
| Blank app icon on home screen                                  | `AppIcon.appiconset` is empty               | See section 6 above.                                         |
| `command not found: pod`                                       | Trying to use CocoaPods (not needed)        | Ignore. This project uses SPM.                               |

---

## CI safety net

`.github/workflows/ios-build.yml` runs the full sequence on every push and PR
so a broken `ios/` setup is caught before merge.
