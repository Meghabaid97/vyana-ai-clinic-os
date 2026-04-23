# iOS Capacitor Rebuild Checklist

Use this when your local `ios/` folder is broken, half-generated, or Xcode shows
errors like **"Missing package product 'CapApp-SPM'"**, **"No Podfile found"**,
or **"ios platform already exists"**.

> ⚠️ This project uses **Capacitor 8 with Swift Package Manager (SPM)**.
> There is **no `Podfile`** and `pod install` is **not** part of the workflow.

---

## 0. Prerequisites (one-time)

- [ ] macOS with **Xcode 15.4+** installed (Xcode 26 recommended for Cap 8).
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

If either file is missing, you are in the wrong directory. `cd` up until you see them.

---

## 2. Wipe the broken native folder

```bash
rm -rf ios
rm -rf node_modules
rm -rf ~/Library/Developer/Xcode/DerivedData
```

Optional (only if you previously ran CocoaPods):

```bash
rm -rf ios/App/Pods ios/App/Podfile ios/App/Podfile.lock
```

---

## 3. Reinstall JS dependencies and build the web bundle

```bash
npm install
npm run build
```

`npm run build` must succeed — Capacitor copies `dist/` into the iOS app.

---

## 4. Re-add the iOS platform (from project root)

```bash
npx cap add ios
npx cap sync ios
```

Expected output includes:

```
[info] Writing Package.swift
✔ update ios in ...ms
[success] ios platform added!
```

If you see `[error] ios platform already exists`, repeat step 2 first.

---

## 5. Open and build in Xcode

```bash
npx cap open ios
```

In Xcode:

1. **File → Packages → Reset Package Caches**
2. **File → Packages → Resolve Package Versions**
3. **Product → Clean Build Folder** (`⇧⌘K`)
4. Select an iPhone simulator → **Product → Build** (`⌘B`)

---

## 6. Verify hot-reload from the sandbox

`capacitor.config.ts` points `server.url` at the Lovable sandbox preview.
After `Run` (`⌘R`), the simulator should load the live preview URL — any web
change you make in Lovable appears instantly without rebuilding.

For an offline build (App Store submission), remove the `server.url` block,
re-run `npm run build && npx cap sync ios`, then rebuild in Xcode.

---

## Common errors & fixes

| Error                                                           | Cause                                      | Fix                                                    |
| --------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `No Podfile found`                                              | Running `pod install` on an SPM project    | Skip it. Use `npx cap sync ios` only.                  |
| `ios platform already exists`                                   | Half-created `ios/` from a previous run    | `rm -rf ios` then re-run `npx cap add ios`.            |
| `The Capacitor CLI needs to run at the root of an npm package`  | You ran `npx cap …` inside `ios/App`       | `cd` back to the folder containing `package.json`.     |
| `Missing package product 'CapApp-SPM'`                          | Stale Swift Package cache                  | Xcode → File → Packages → Reset Package Caches.        |
| `command not found: pod`                                        | Trying to use CocoaPods (not needed here)  | Ignore. This project uses SPM.                         |
| `xcode-select: error: tool 'xcodebuild' requires Xcode`         | Command-line tools selected, not full Xcode | `sudo xcode-select -s /Applications/Xcode.app`         |

---

## CI safety net

`.github/workflows/ios-build.yml` runs this exact sequence on every push and PR:

1. `npm ci` → `npm run build`
2. `rm -rf ios && npx cap add ios && npx cap sync ios`
3. Verifies `Package.swift` exists
4. `xcodebuild -resolvePackageDependencies`
5. Builds the iOS app for the simulator (no signing)

If anything in this checklist breaks, CI will fail before you do.
