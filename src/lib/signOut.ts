import { supabase } from "@/integrations/supabase/client";

/**
 * Robust sign-out helper.
 *
 * Why we need this:
 *   `supabase.auth.signOut()` calls the server `/logout` endpoint. If the
 *   refresh token is already invalid / revoked / expired, the server returns
 *   403 `session_not_found`, the JS client throws, and — critically — does
 *   NOT clear the cached session in `localStorage`. The user appears to be
 *   "stuck": they click sign out, the request fails, the local session stays,
 *   `onAuthStateChange` keeps firing, and `Auth.tsx` immediately redirects
 *   them back to `/app`.
 *
 * Fix: always do a `scope: 'local'` sign-out so the local storage is cleared
 * regardless of what the server says. Then attempt a global sign-out as a
 * best effort to revoke the refresh token on the server too. Finally, hard
 * scrub any leftover Supabase auth keys from localStorage as a safety net.
 *
 * Returns nothing — never throws — so callers can `await signOutFully()` and
 * then unconditionally `navigate("/auth")`.
 */
export const signOutFully = async () => {
  // 1. Local sign-out: clears the in-memory session AND removes the persisted
  //    session from localStorage. This is the part that MUST succeed.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* ignore — we'll scrub manually below */
  }

  // 2. Best-effort global sign-out to revoke the refresh token server-side.
  //    Safe to ignore failures (e.g. 403 session_not_found).
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    /* expected when token already revoked */
  }

  // 3. Belt-and-suspenders: nuke any leftover sb-* auth keys from BOTH
  //    localStorage and sessionStorage, plus any sb-* cookies. If even one
  //    cached token survives, the next page mount sees INITIAL_SESSION with
  //    a valid session and silently bounces the user back into the app.
  try {
    if (typeof window !== "undefined") {
      for (const store of [window.localStorage, window.sessionStorage]) {
        if (!store) continue;
        const keys: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && (k.startsWith("sb-") || k.includes("supabase.auth.") || k.startsWith("vyana-oauth"))) {
            keys.push(k);
          }
        }
        keys.forEach((k) => store.removeItem(k));
      }

      if (typeof document !== "undefined" && document.cookie) {
        document.cookie
          .split(";")
          .map((c) => c.split("=")[0].trim())
          .filter((name) => name.startsWith("sb-"))
          .forEach((name) => {
            const expire = "; Max-Age=0; path=/";
            document.cookie = `${name}=${expire}`;
            document.cookie = `${name}=${expire}; domain=${window.location.hostname}`;
            const root = window.location.hostname.split(".").slice(-2).join(".");
            document.cookie = `${name}=${expire}; domain=.${root}`;
          });
      }
    }
  } catch {
    /* private mode / storage disabled */
  }
};
