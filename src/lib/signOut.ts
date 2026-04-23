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

  // 3. Belt-and-suspenders: nuke any leftover sb-* auth keys.
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("supabase.auth."))) {
          keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* private mode / storage disabled */
  }
};
