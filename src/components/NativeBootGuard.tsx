import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * NativeBootGuard
 *
 * On native (Capacitor iOS / Android) builds we want every app boot to land
 * on `/splash` unless the user already has a Supabase session. This protects:
 *   - Cold starts that try to render the marketing landing (`/`).
 *   - Deep links that open arbitrary unauthenticated routes.
 *   - OAuth callbacks that briefly land on `/` before the session is set.
 *
 * On the web build this guard is a no-op so the marketing site keeps working.
 *
 * Public routes that are intentionally reachable without auth (auth flow,
 * splash itself, OAuth callback handler, legal, etc.) are allow-listed.
 */
const PUBLIC_NATIVE_PATHS = new Set<string>([
  "/splash",
  "/auth",
  "/request-access",
  "/access-pending",
  "/legal",
  "/unsubscribe",
]);

const PUBLIC_NATIVE_PREFIXES = ["/emergency-access/"];

const isPublicNativePath = (pathname: string) => {
  if (PUBLIC_NATIVE_PATHS.has(pathname)) return true;
  return PUBLIC_NATIVE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const NativeBootGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialBootHandled = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;

    const evaluate = async (pathname: string) => {
      // Authenticated session bypasses the guard entirely.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (session) {
        // Authed user trying to view splash → send into the app.
        if (pathname === "/splash" || pathname === "/") {
          navigate("/app", { replace: true });
        }
        return;
      }

      // Unauthed: only allow whitelisted public routes; everything else
      // (including the marketing landing on `/`) goes back to splash.
      if (!isPublicNativePath(pathname)) {
        navigate("/splash", { replace: true });
      }
    };

    void evaluate(location.pathname);

    // Re-evaluate when auth state changes (e.g. OAuth callback completes).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!active) return;
      window.setTimeout(() => void evaluate(window.location.pathname), 0);
    });

    initialBootHandled.current = true;

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  return null;
};

export default NativeBootGuard;
