import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Apple, X, Loader2, AlertCircle, Check, Mail } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useLanguage } from "@/lib/i18n";
import { NativeBrowser } from "@/lib/nativeCapacitorPlugins";
import { validatePassword, validateEmail } from "@/lib/validation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";


type SocialProvider = "google" | "apple";

const CUSTOMER_APP_ORIGIN = "https://vyana.care";
const OAUTH_BROKER_ORIGIN = CUSTOMER_APP_ORIGIN;
// Same-origin redirect targets so the Supabase session lands on the origin
// the user started on (www.vyana.care, vyana.care, preview domains, etc.).
// Hard-coding to vyana.care caused first-time Google sign-in to hang on
// www.vyana.care because the session was set on a different origin.
const getWebOAuthRedirect = () =>
  typeof window !== "undefined" ? `${window.location.origin}/welcome` : `${CUSTOMER_APP_ORIGIN}/welcome`;
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

const LOGIN_TIMEOUT_MS = 180_000;

const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  useLanguage();

  const isSignup = useMemo(
    () => new URLSearchParams(location.search).get("signup") === "1",
    [location.search],
  );

  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [formError, setFormError] = useState<ReactNode | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Reset inline error when switching between log-in and sign-up
  useEffect(() => { setFormError(null); }, [isSignup]);


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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") && session) {
        go();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go();
    });

    // Safety net: while a sign-in is in flight, poll for a session every
    // second. Catches cases where SIGNED_IN fires before subscribe or is
    // swallowed by an iframe/popup boundary, so the spinner can never hang.
    const poll = window.setInterval(() => {
      if (!isMounted || navigated) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) go();
      });
    }, 1000);

    // Also re-check whenever the tab regains focus (popup closed, redirect back).
    const onFocus = () => {
      if (!isMounted || navigated) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) go();
      });
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onFocus);
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
      await NativeBrowser.open({
        url: buildCustomerOAuthUrl("google", NATIVE_OAUTH_REDIRECT),
        presentationStyle: "fullscreen",
      });
      return;
    }
    if (isMobileOrTabletBrowser()) {
      window.location.assign(buildCustomerOAuthUrl("google", getWebOAuthRedirect()));
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getWebOAuthRedirect(),
    });
    if (result.error) throw result.error;
    if (result.redirected) return;
    // Popup flow succeeded — session is set. Force navigation in case
    // onAuthStateChange already fired before we subscribed or was missed.
    handleAuthenticatedUser();
  });

  const handleAppleAuth = () => runOAuth("apple", async () => {
    const isNativeApp = Capacitor.isNativePlatform();
    if (isNativeApp) {
      await supabase.auth.signOut().catch(() => {});
      await NativeBrowser.open({
        url: buildCustomerOAuthUrl("apple", NATIVE_OAUTH_REDIRECT),
        presentationStyle: "fullscreen",
      });
      return;
    }
    if (isMobileOrTabletBrowser()) {
      window.location.assign(buildCustomerOAuthUrl("apple", getWebOAuthRedirect()));
      return;
    }
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: getWebOAuthRedirect(),
    });
    if (result.error) throw result.error;
    if (result.redirected) return;
    handleAuthenticatedUser();
  });


  const dismissTimeoutError = () => {
    clearLoginTimeout();
    setLoadingProvider(null);
    setTimeoutError(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeoutError(null);
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (isSignup) {
      const pw = validatePassword(password);
      if (!pw.isValid) {
        setFormError(`Password is too weak: ${pw.errors.join(", ")}.`);
        return;
      }
    }

    setEmailLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/welcome` },
        });
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (msg.includes("registered") || msg.includes("already")) {
            setFormError(
              <>
                An account with this email already exists. Please{" "}
                <Link to="/auth" replace className="font-semibold underline underline-offset-2">
                  log in
                </Link>{" "}
                instead.
              </>,
            );
            return;
          }
          throw error;
        }
        // Supabase returns a user with an empty identities array when the
        // email is already registered (and confirmations are on). Detect that.
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setFormError(
            <>
              An account with this email already exists. Please{" "}
              <Link to="/auth" replace className="font-semibold underline underline-offset-2">
                log in
              </Link>{" "}
              instead.
            </>,
          );
          return;
        }
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to finish creating your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (msg.includes("invalid login") || msg.includes("invalid_credentials") || msg.includes("invalid credentials")) {
            setFormError(
              <>
                Account not found, or the password is incorrect. Please{" "}
                <Link
                  to="/auth?signup=1"
                  replace
                  className="font-semibold underline underline-offset-2"
                >
                  sign up first
                </Link>
                .
              </>,
            );
            return;
          }
          if (msg.includes("not confirmed") || msg.includes("confirm")) {
            setFormError("Please confirm your email first. Check your inbox for the confirmation link.");
            return;
          }
          throw error;
        }
      }
    } catch (err: any) {
      const raw = (err?.message ?? "").toString();
      const lower = raw.toLowerCase();
      const isNetwork =
        err?.name === "TypeError" ||
        err?.name === "AuthRetryableFetchError" ||
        lower.includes("load failed") ||
        lower.includes("failed to fetch") ||
        lower.includes("networkerror") ||
        lower.includes("network request failed") ||
        lower.includes("fetch") ||
        !navigator.onLine;
      if (isNetwork) {
        setFormError(
          isSignup
            ? "Couldn't reach the server. Please check your internet connection and try creating your account again."
            : "Couldn't reach the server. Please check your internet connection and try signing in again.",
        );
      } else {
        setFormError(raw || "Something went wrong. Please try again.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotEmail(email.trim());
    setForgotSent(false);
    setForgotOpen(true);
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = forgotEmail.trim();
    if (!validateEmail(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${CUSTOMER_APP_ORIGIN}/reset-password`,
      });

      if (error) throw error;
      setForgotSent(true);
      toast({ title: "Reset link sent!", description: "Please check your email inbox." });
    } catch (err: any) {
      toast({ title: "Could not send link", description: err?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };


  const anyLoading = loadingProvider !== null || emailLoading;

  return (
    <div className="min-h-[100svh] flex flex-col bg-background px-6 pt-6 pb-8 safe-area-top safe-area-bottom overflow-y-auto">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="self-start w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 flex flex-col justify-center min-h-min py-6">
          <div className="mb-7">
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignup
                ? "Start carrying your health story in seconds."
                : "Sign in to pick up your health story where you left off."}
            </p>
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
              disabled={anyLoading}
              className="w-full h-12 px-4 rounded-full border border-border bg-background hover:bg-muted/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
            >
              {loadingProvider === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Chrome className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {loadingProvider === "google"
                  ? "Connecting to Google…"
                  : isSignup ? "Sign up with Google" : "Continue with Google"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleAppleAuth}
              disabled={anyLoading}
              className="w-full h-12 px-4 rounded-full border border-border bg-background hover:bg-muted/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
            >
              {loadingProvider === "apple" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Apple className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {loadingProvider === "apple"
                  ? "Connecting to Apple…"
                  : isSignup ? "Sign up with Apple" : "Continue with Apple"}
              </span>
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              OR
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                {isSignup ? "Email" : "Email or Username"}
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={anyLoading}
                placeholder="you@example.com"
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-medium text-muted-foreground">
                  Password
                </label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={anyLoading}
                placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60"
                required
              />
              {isSignup && (
                <ul className="mt-2 space-y-1 pl-0.5">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = password.length > 0 && rule.test(password);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-[11px] leading-snug transition-colors ${
                          ok ? "text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        <Check className={`h-3 w-3 shrink-0 ${ok ? "opacity-100" : "opacity-40"}`} />
                        {rule.label}
                      </li>
                    );
                  })}
                  <li className="text-[11px] leading-snug text-muted-foreground/80 pt-0.5">
                    Also include a lowercase letter.
                  </li>
                </ul>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="leading-snug flex-1">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={anyLoading || !email || !password}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "Create account" : "Log in"}
            </button>
          </form>


          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link to="/auth" replace className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New to Vyana?{" "}
                <Link to="/auth?signup=1" replace className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>

        <p className="pt-4 text-[11px] text-muted-foreground text-center leading-relaxed">
          By continuing you agree to our{" "}
          <Link to="/legal" target="_blank" className="text-primary hover:underline">Terms</Link>{" "}
          and{" "}
          <Link to="/legal#privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter the email tied to your account and we&apos;ll send you a secure reset link.
            </DialogDescription>
          </DialogHeader>

          {forgotSent ? (
            <div className="py-4 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-sm text-foreground font-medium">Reset link sent!</p>
              <p className="text-xs text-muted-foreground">
                Please check your email inbox at <span className="font-medium text-foreground">{forgotEmail}</span>.
              </p>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="w-full h-11 mt-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-4 pt-1">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="h-11 px-4 rounded-full border border-border text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="h-11 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
