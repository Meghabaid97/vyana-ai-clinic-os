import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, AlertCircle, Chrome, Apple, Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";
import { NativeBrowser } from "@/lib/nativeCapacitorPlugins";

type SocialProvider = "google" | "apple";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60;

const MSG91_WIDGET_ID = "3666706f4643363138353233";
const MSG91_TOKEN_AUTH = "532688Tm0nK9E29J6a316d42P1";
const MSG91_WIDGET_SCRIPT = "https://verify.msg91.com/otp-provider.js";

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
  }
}

const loadMsg91Widget = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no_window"));
    if (window.initSendOTP) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MSG91_WIDGET_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("widget_load_failed")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = MSG91_WIDGET_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("widget_load_failed"));
    document.head.appendChild(s);
  });

const CUSTOMER_APP_ORIGIN = "https://vyana.care";
const OAUTH_BROKER_ORIGIN = CUSTOMER_APP_ORIGIN;
const WEB_OAUTH_REDIRECT = `${CUSTOMER_APP_ORIGIN}/welcome`;
// Native: broker only accepts HTTPS redirect URIs registered with the
// project. The bridge page hands off to the `vyana://oauth-callback/...`
// deep link, which main.tsx's appUrlOpen listener completes.
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

const normalizePhoneForAuth = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits.slice(0, 15)}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return `+${digits.slice(0, 15)}`;
};

const isValidPhoneForAuth = (value: string) => /^\+[1-9]\d{9,14}$/.test(value);

const Auth = () => {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();
  useLanguage();

  // After any successful auth, hand off to /welcome which decides whether
  // to show the first-time consent flow or send the user straight into /app.
  const handleAuthenticatedUser = useCallback(() => {
    navigate("/welcome", { replace: true });
  }, [navigate]);

  // Restore rate-limit state
  useEffect(() => {
    const stored = sessionStorage.getItem("auth-attempts");
    const storedLockout = sessionStorage.getItem("auth-lockout");
    if (stored) setAttempts(parseInt(stored, 10));
    if (storedLockout) {
      const end = parseInt(storedLockout, 10);
      if (Date.now() < end) setLockoutEnd(end);
      else {
        sessionStorage.removeItem("auth-lockout");
        sessionStorage.removeItem("auth-attempts");
      }
    }
  }, []);

  useEffect(() => {
    if (!lockoutEnd) { setLockoutRemaining(0); return; }
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setLockoutRemaining(0);
        setAttempts(0);
        sessionStorage.removeItem("auth-lockout");
        sessionStorage.removeItem("auth-attempts");
        clearInterval(interval);
      } else setLockoutRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  useEffect(() => {
    let isMounted = true;

    // Surface OAuth-callback errors stamped into the URL hash.
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted || !session) return;
      handleAuthenticatedUser();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted || !session) return;
      window.setTimeout(handleAuthenticatedUser, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthenticatedUser, toast]);

  const recordAttempt = () => {
    const next = attempts + 1;
    setAttempts(next);
    sessionStorage.setItem("auth-attempts", String(next));
    if (next >= MAX_ATTEMPTS) {
      const end = Date.now() + LOCKOUT_DURATION * 1000;
      setLockoutEnd(end);
      sessionStorage.setItem("auth-lockout", String(end));
    }
  };

  const isLockedOut = lockoutEnd !== null && Date.now() < lockoutEnd;

  const handleSendOtp = async () => {
    if (isLockedOut) {
      toast({ title: "Locked Out", description: t("auth.tooManyAttempts", { seconds: lockoutRemaining }), variant: "destructive" });
      return;
    }
    const normalizedPhone = normalizePhoneForAuth(phone);
    if (!isValidPhoneForAuth(normalizedPhone)) {
      setPhoneError("Enter a valid mobile number with country code");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      await loadMsg91Widget();
      // identifier must be without "+" per MSG91 widget spec
      const identifier = normalizedPhone.replace(/^\+/, "");

      await new Promise<void>((resolve, reject) => {
        window.initSendOTP?.({
          widgetId: MSG91_WIDGET_ID,
          tokenAuth: MSG91_TOKEN_AUTH,
          identifier,
          exposeMethods: false,
          success: async (data: any) => {
            try {
              const accessToken: string = data?.message ?? data?.["access-token"] ?? data;
              if (!accessToken) throw new Error("No access token from MSG91");
              const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
                "msg91-verify",
                { body: { accessToken, phone: normalizedPhone } },
              );
              if (verifyErr) throw verifyErr;
              const { email, password } = (verifyData ?? {}) as { email?: string; password?: string };
              if (!email || !password) throw new Error("Verification response missing credentials");
              const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
              if (signInErr) throw signInErr;
              setAttempts(0);
              sessionStorage.removeItem("auth-attempts");
              sessionStorage.removeItem("auth-lockout");
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          failure: (err: any) => {
            recordAttempt();
            reject(new Error(err?.message ?? "OTP verification failed"));
          },
        });
      });
    } catch (e: any) {
      toast({ title: "Couldn't sign in", description: e?.message ?? "Try again in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Legacy verify path kept as no-op (MSG91 widget handles OTP entry in its own modal).
  const handleVerifyOtp = async () => {};


  const handleGoogleAuth = async () => {
    try {
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
    } catch (e: any) {
      toast({ title: "Sign-in error", description: e?.message ?? "Could not start Google sign-in.", variant: "destructive" });
    }
  };

  const handleAppleAuth = async () => {
    try {
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
        window.location.assign(buildCustomerOAuthUrl("apple", WEB_OAUTH_REDIRECT));
        return;
      }
      const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: WEB_OAUTH_REDIRECT });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/welcome", { replace: true });
    } catch (e: any) {
      toast({ title: "Sign-in error", description: e?.message ?? "Could not start Apple sign-in.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center bg-background px-4 py-6 sm:py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-foreground mb-2">{t("auth.welcome")}</h1>
          <p className="text-sm text-muted-foreground">Sign in to carry your health story into every visit.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>

          {isLockedOut && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">
                {t("auth.tooManyAttempts", { seconds: lockoutRemaining })}
              </p>
            </div>
          )}

          {!otpSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-phone" className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  Mobile number
                </Label>
                <Input
                  id="login-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                  className={`bg-background/50 h-12 text-base ${phoneError ? "border-destructive" : ""}`}
                />
                {phoneError ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{phoneError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    We'll text you a 6-digit code. Indian numbers default to +91.
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendOtp}
                variant="gradient"
                className="w-full h-12 text-base"
                disabled={loading || isLockedOut}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Enter the code we sent to <span className="font-medium text-foreground">{normalizePhoneForAuth(phone)}</span>
              </p>
              <div className="flex justify-center">
                <InputOTP value={otpValue} onChange={setOtpValue} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleVerifyOtp}
                variant="gradient"
                className="w-full h-12"
                disabled={loading || otpValue.length < 6 || isLockedOut}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpValue(""); }}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
              >
                ← Use a different number
              </button>
            </div>
          )}

          {!otpSent && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  aria-label="Continue with Google"
                  className="h-12 w-12 rounded-full border border-border bg-background hover:bg-muted/40 flex items-center justify-center transition-colors"
                >
                  <Chrome className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleAppleAuth}
                  aria-label="Continue with Apple"
                  className="h-12 w-12 rounded-full border border-border bg-background hover:bg-muted/40 flex items-center justify-center transition-colors"
                >
                  <Apple className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-[11px] text-muted-foreground text-center leading-relaxed">
            By continuing you agree to our{" "}
            <Link to="/legal" target="_blank" className="text-primary hover:underline">Terms</Link>{" "}
            and{" "}
            <Link to="/legal#privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
