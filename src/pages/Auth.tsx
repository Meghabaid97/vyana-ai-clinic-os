import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Apple, X, Loader2, AlertCircle } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useLanguage } from "@/lib/i18n";
import { NativeBrowser } from "@/lib/nativeCapacitorPlugins";

type SocialProvider = "google" | "apple";

const CUSTOMER_APP_ORIGIN = "https://vyana.care";
const OAUTH_BROKER_ORIGIN = CUSTOMER_APP_ORIGIN;
const WEB_OAUTH_REDIRECT = `${CUSTOMER_APP_ORIGIN}/welcome`;
const NATIVE_OAUTH_REDIRECT = `${CUSTOMER_APP_ORIGIN}/oauth-bridge`;

const isMobileOrTabletBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
};

const createOAuthState = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

const buildCustomerOAuthUrl = (
  provider: SocialProvider,
  redirectUri: string,
  extraParams: Record<string, string> = {},
) => {
  const url = new URL("/~oauth/initiate", OAUTH_BROKER_ORIGIN);
  const state = createOAuthState();
  sessionStorage.setItem("vyana-oauth-state", state);
  Object.entries(extraParams).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
};

const LOGIN_TIMEOUT_MS = 12_000;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useLanguage();

  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearLoginTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startLoginTimeout = useCallback((provider: SocialProvider) => {
    clearLoginTimeout();
    setTimeoutError(null);
    setLoadingProvider(provider);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setLoadingProvider(null);
      setTimeoutError(
        "Sign-in is taking longer than expected. Please check your connection and try again.",
      );
    }, LOGIN_TIMEOUT_MS);
  }, [clearLoginTimeout]);

  const handleAuthenticatedUser = useCallback(() => {
    clearLoginTimeout();
    // Hard replace to guarantee we leave /auth even if React state is mid-render
    // from an OAuth redirect (web) or in-app browser close (native).
    window.location.replace("/welcome");
  }, [clearLoginTimeout]);

  useEffect(() => {
    let isMounted = true;
    let navigated = false;

    const go = () => {
      if (!isMounted || navigated) return;
      navigated = true;
      handleAuthenticatedUser();
    };

    const hash = window.location.hash || "";
    if (hash.includes("error")) {
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const errDesc = params.get("error_description") || params.get("error") || "";
      const decoded = decodeURIComponent(errDesc);
      if (decoded) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        toast({
          title: "Sign-in failed",
          description: decoded.length > 200 ? decoded.slice(0, 200) + "…" : decoded,
          variant: "destructive",
        });
      }
    }

    // Register the listener FIRST so we never miss the SIGNED_IN event that
    // fires synchronously when Supabase parses the OAuth tokens from the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") && session) {
        go();
      }
    });

    // Fallback: if a session already exists on mount, navigate immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearLoginTimeout();
    };
  }, [handleAuthenticatedUser, toast, clearLoginTimeout]);

  const runOAuth = async (
    provider: SocialProvider,
    fn: () => Promise<void>,
  ) => {
    startLoginTimeout(provider);
    try {
      await fn();
    } catch (e: any) {
      clearLoginTimeout();
      setLoadingProvider(null);
      const message = e?.message ?? `Could not start ${provider === "google" ? "Google" : "Apple"} sign-in.`;
      setTimeoutError(message);
      toast({ title: "Sign-in error", description: message, variant: "destructive" });
    }
  };

  const handleGoogleAuth = () => runOAuth("google", async () => {
    const isNativeApp = Capacitor.isNativePlatform();
    if (isNativeApp) {
      await supabase.auth.signOut().catch(() => {});
      await NativeBrowser.open({
        url: buildCustomerOAuthUrl("google", NATIVE_OAUTH_REDIRECT, { prompt: "select_account" }),
        presentationStyle: "fullscreen",
      });
      return;
    }
    if (isMobileOrTabletBrowser()) {
      window.location.assign(buildCustomerOAuthUrl("google", WEB_OAUTH_REDIRECT, { prompt: "select_account" }));
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: WEB_OAUTH_REDIRECT,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) throw result.error;
    if (result.redirected) return;
    navigate("/welcome", { replace: true });
  });

  const handleAppleAuth = () => runOAuth("apple", async () => {
    const isNativeApp = Capacitor.isNativePlatform();
    const appleExtraParams = { response_mode: "form_post", scope: "name email" };
    if (isNativeApp) {
      await supabase.auth.signOut().catch(() => {});
      await NativeBrowser.open({
        url: buildCustomerOAuthUrl("apple", NATIVE_OAUTH_REDIRECT, appleExtraParams),
        presentationStyle: "fullscreen",
      });
      return;
    }
    if (isMobileOrTabletBrowser()) {
      window.location.assign(buildCustomerOAuthUrl("apple", WEB_OAUTH_REDIRECT, appleExtraParams));
      return;
    }
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: WEB_OAUTH_REDIRECT,
      extraParams: appleExtraParams,
    });
    if (result.error) throw result.error;
    if (result.redirected) return;
    navigate("/welcome", { replace: true });
  });

  const dismissTimeoutError = () => {
    clearLoginTimeout();
    setLoadingProvider(null);
    setTimeoutError(null);
  };

  return (
    <div className="min-h-[100svh] flex flex-col bg-background px-6 pt-6 pb-8 sm:py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="self-start w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mt-10 mb-10">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Log in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to carry your health story into every visit.</p>
        </div>

        {timeoutError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="leading-snug">{timeoutError}</p>
              <button
                type="button"
                onClick={dismissTimeoutError}
                className="mt-1 text-xs font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loadingProvider !== null}
            className="w-full h-12 rounded-full border border-border bg-background hover:bg-muted/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
          >
            {loadingProvider === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Chrome className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {loadingProvider === "google" ? "Connecting to Google…" : "Continue with Google"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleAppleAuth}
            disabled={loadingProvider !== null}
            className="w-full h-12 rounded-full border border-border bg-background hover:bg-muted/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
          >
            {loadingProvider === "apple" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Apple className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {loadingProvider === "apple" ? "Connecting to Apple…" : "Continue with Apple"}
            </span>
          </button>
        </div>

        <p className="mt-auto pt-8 text-[11px] text-muted-foreground text-center leading-relaxed">
          By continuing you agree to our{" "}
          <Link to="/legal" target="_blank" className="text-primary hover:underline">Terms</Link>{" "}
          and{" "}
          <Link to="/legal#privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
