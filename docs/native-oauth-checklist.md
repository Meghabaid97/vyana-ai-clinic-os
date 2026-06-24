# Native Google / Apple Sign-In — End-to-End Checklist

Use this every time the OAuth flow changes, or before submitting a new build
to TestFlight / Play Internal. Test on **real devices**, not just a simulator
— in-app browser sheets and deep-link handoffs behave differently in
emulated environments.

## How the flow is wired

```
[Native app]
   │  user taps Google/Apple
   ▼
NativeBrowser.open(           ← @capacitor/browser sheet
  https://vyana.care/~oauth/initiate
    ?provider=google
    &redirect_uri=https://vyana.care/oauth-bridge
    &state=<random>
)
   ▼
Lovable OAuth broker  →  Google/Apple consent
   ▼
https://vyana.care/oauth-bridge#access_token=…&refresh_token=…&state=…
   │  (src/pages/OAuthBridge.tsx)
   ▼
window.location.replace("vyana://oauth-callback/<same payload>")
   ▼
iOS / Android intercepts via CFBundleURLSchemes / intent-filter
   ▼
CapacitorApp "appUrlOpen"  (src/main.tsx)
   │  closes the in-app browser
   │  supabase.auth.setSession(...) or exchangeCodeForSession(...)
   ▼
window.location.replace("/welcome")
   │  Welcome.tsx checks consent_log
   ▼
First-time users → consent form → /app
Returning users → straight to /app
```

The broker only accepts **HTTPS** redirect URIs registered with the project.
A `vyana://` redirect URI is rejected with
`Authorization request is invalid: redirect_uri is not allowed`.
That's why we bounce through `https://vyana.care/oauth-bridge` first.

## Pre-flight (one-time per build)

- [ ] `capacitor.config.ts` has `appId: 'com.vyana.health'` and
      `iosScheme: 'vyana'`.
- [ ] **iOS** `ios/App/App/Info.plist` declares `CFBundleURLSchemes` with
      `vyana` under a `CFBundleURLTypes` entry.
- [ ] **Android** (when added): `android/app/src/main/AndroidManifest.xml`
      has an `<intent-filter>` on `MainActivity` for
      `<data android:scheme="vyana" android:host="oauth-callback"/>`
      with `android.intent.action.VIEW` + `BROWSABLE` + `DEFAULT`.
- [ ] `vyana.care` is **Active** in Lovable Project Settings → Domains.
      OAuth allowlist is automatic for active domains.
- [ ] `vyana.care/~oauth/initiate?provider=google&redirect_uri=https://vyana.care/oauth-bridge&state=test`
      returns `302` to `oauth.lovable.app/initiate?...` (sanity curl).

## iOS device — Google

- [ ] App launches; tap **Continue with Google** on `/auth`.
- [ ] An in-app browser sheet opens at `vyana.care/~oauth/initiate?...`
      then immediately redirects to `accounts.google.com`.
- [ ] If multiple Google accounts are signed in to the device, the chooser
      appears (we send `prompt=select_account`).
- [ ] After picking an account, the sheet briefly shows
      `vyana.care/oauth-bridge` with the spinner.
- [ ] The app **automatically returns to the foreground** — the browser
      sheet closes by itself (no manual "Done" tap required).
- [ ] You land on `/welcome` on first ever sign-in, or directly on `/app`
      for returning users.
- [ ] No "previous user" content flashes before the auth resolves.

## iOS device — Apple

- [ ] Tap **Continue with Apple** on `/auth`.
- [ ] Apple's native sheet appears (not a webview) when the device account
      matches the App Store account. If a webview appears instead, Apple
      Services ID is misconfigured for the bundle.
- [ ] Choose "Share My Email" or "Hide My Email"; complete Face ID / Touch ID.
- [ ] Same auto-return + landing behavior as Google.
- [ ] For brand new Apple accounts: the `user_metadata.name` is captured
      on the first sign-in only. Re-installing the app does NOT re-prompt
      for name — Apple only releases it once per Services ID.

## Android device — Google (when Android target ships)

- [ ] Tap **Continue with Google**.
- [ ] Chrome Custom Tab opens at `vyana.care/~oauth/initiate?...`.
- [ ] Google account picker → consent.
- [ ] Custom Tab redirects to `vyana.care/oauth-bridge`, then deep-links
      to `vyana://oauth-callback/...`.
- [ ] Android prompts "Open with Vyana" the first time; check
      "Always" so subsequent flows skip the chooser.
- [ ] App returns to foreground; lands on `/welcome` or `/app`.

## Android device — Apple

- [ ] Tap **Continue with Apple**.
- [ ] Custom Tab opens Apple's web sign-in (no native sheet on Android).
- [ ] After completion, same bridge → deep-link → `/welcome` flow.

## Edge cases to exercise

- [ ] **Cancel** the OAuth sheet halfway through → app shows `/auth`
      with no toast errors and no half-set session. Re-tapping Google
      should still work (we call `supabase.auth.signOut()` before opening
      the sheet to prevent stale sessions).
- [ ] **Background the app** during the OAuth sheet (lock screen, swipe
      home), then resume → flow completes when the sheet returns.
- [ ] **Kill the app** between tapping Google and granting consent → after
      relaunch the user lands on `/auth` (no orphaned half-session).
- [ ] **Airplane mode** when tapping the social button → toast says
      "Could not start Google sign-in" or similar; no crash.
- [ ] **First-time user** (fresh DB row) → lands on `/welcome`, must check
      all three consent boxes before "Agree and continue" enables.
- [ ] **Returning user** (already has all three rows in `consent_log`) →
      `/welcome` flashes a spinner once, then redirects straight to `/app`.
- [ ] **Phone OTP path** still works: enter `+91XXXXXXXXXX`, receive SMS,
      enter 6-digit code, land on `/welcome` (first time) or `/app`.

## Telemetry / debugging

- Live edge-function logs:
  `Backend → Functions → validate-invite-token / send-auth-otp` if errors.
- Browser-style errors from the broker surface in the URL hash; we already
  toast them on `/auth` (`error_description` → toast).
- On native, `console.error("Failed to handle OAuth callback", ...)` will
  show in Safari / Chrome remote-debug if the deep-link payload is malformed.

## When something breaks

| Symptom | Likely cause |
| --- | --- |
| Broker returns `redirect_uri is not allowed` | Native code is sending `vyana://...` directly instead of the HTTPS bridge. Confirm `NATIVE_OAUTH_REDIRECT` in `src/pages/Auth.tsx` ends with `/oauth-bridge`. |
| iOS sheet stays open after sign-in | `appUrlOpen` listener never fired. Verify `CFBundleURLSchemes` is `vyana` and the bridge page is actually replacing to `vyana://oauth-callback/...`. |
| App reopens to a previous user | `supabase.auth.signOut()` not called before opening the sheet, or session restored from disk before the auth state listener can redirect. We call signOut on both `handleGoogleAuth` and `handleAppleAuth`. |
| `/welcome` keeps re-appearing | `consent_log` insert is failing silently. Check RLS — only `authenticated` role should be able to insert their own row (`user_id = auth.uid()`). |
| Apple sheet shows a generic Lovable name instead of "Vyana" | Apple Services ID still pointing at the managed/default Apple credentials. Switch to BYOC in Backend → Auth Settings → Apple. |
