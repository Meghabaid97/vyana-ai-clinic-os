import { useEffect } from "react";

/**
 * Native OAuth bridge.
 *
 * The Lovable managed OAuth broker only allows HTTPS redirect URIs registered
 * with the project (custom URL schemes like `vyana://` are rejected). To get
 * tokens from the broker back into the native iOS app, we:
 *
 *   1. Tell the broker to redirect here (https://vyana.care/oauth-bridge).
 *   2. This page picks up the OAuth payload from `location.hash` / `search`.
 *   3. It immediately hands off to `vyana://oauth-callback/...`, which the
 *      iOS app intercepts via its CFBundleURLSchemes entry. The
 *      `appUrlOpen` listener in `src/main.tsx` then completes the session.
 *
 * On the web (someone landing here in a normal browser) we just forward to
 * `/app` so the regular Supabase web flow can pick up the tokens.
 */
const OAuthBridge = () => {
  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    // Build a clean payload preserving whatever the broker returned.
    const payload = `${search}${hash}`;
    const deepLink = `vyana://oauth-callback/${payload}`;

    // Attempt the deep link — on iOS the OS will intercept and hand off to
    // the app. We give it a moment, then fall back to the web app so users
    // opening this URL outside the native app aren't stranded.
    try {
      window.location.replace(deepLink);
    } catch {
      /* ignore */
    }

    const fallback = window.setTimeout(() => {
      // If the deep link didn't open the app, send the user to the web app
      // (consent gate first) with the same OAuth payload so Supabase can
      // complete the session.
      window.location.replace(`/welcome${payload}`);
    }, 1500);

    return () => window.clearTimeout(fallback);
  }, []);

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Returning to the Vyana app…</p>
      </div>
    </div>
  );
};

export default OAuthBridge;
