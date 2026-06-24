import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Chrome, User, Shield, AlertCircle, CheckCircle2, Phone, KeyRound, Calendar, Weight, FileCheck, MapPin, Loader2, Apple } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validatePassword, validateEmail, validateHealthId } from "@/lib/validation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";
import { NativeBrowser } from "@/lib/nativeCapacitorPlugins";

type UserRole = "patient";
type AuthMode = "password" | "emailOtp" | "phoneOtp";
type SocialProvider = "google" | "apple";

type PendingSignupDraft = {
  role?: UserRole;
  name?: string;
  phone?: string;
  healthId?: string;
  dateOfBirth?: string;
  weight?: string;
  city?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60; // seconds
const SIGNUP_DRAFT_KEY = "vyana-signup-draft";
const VALIDATED_INVITE_KEY = "vyana-validated-invite-token";
const CUSTOMER_APP_ORIGIN = "https://www.vyana.care";
// The Lovable OAuth broker proxy (`/~oauth/initiate`) is only installed on
// hosts that are registered + Active in this Lovable project. The published
// `.lovable.app` host is always Active, so we use it as the OAuth origin to
// avoid 404s from custom domains that aren't (yet) wired up at the Lovable
// edge. Once `vyana.care` shows Active in Project Settings → Domains, this
// can switch back to `CUSTOMER_APP_ORIGIN`.
const OAUTH_BROKER_ORIGIN = "https://vyanacare.lovable.app";
const WEB_OAUTH_REDIRECT = `${CUSTOMER_APP_ORIGIN}/app`;
const NATIVE_OAUTH_REDIRECT = "vyana://oauth-callback/";

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

type ServerInviteValidation =
  | { valid: true; email?: string | null; name?: string | null }
  | { valid: false; reason?: string; error?: string };

const serverValidateInviteToken = async (
  token: string,
): Promise<ServerInviteValidation> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "validate-invite-token",
      { body: { token } },
    );
    if (error) return { valid: false, error: error.message };
    return (data ?? { valid: false }) as ServerInviteValidation;
  } catch (e: any) {
    return { valid: false, error: e?.message ?? "Network error" };
  }
};

const getStoredSignupDraft = (): PendingSignupDraft | null => {
  try {
    const stored = localStorage.getItem(SIGNUP_DRAFT_KEY);
    return stored ? (JSON.parse(stored) as PendingSignupDraft) : null;
  } catch {
    return null;
  }
};

const setStoredSignupDraft = (draft: PendingSignupDraft | null) => {
  if (!draft) {
    localStorage.removeItem(SIGNUP_DRAFT_KEY);
    return;
  }

  localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
};

const calculateAge = (dateOfBirth?: string | null) => {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [healthId, setHealthId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weight, setWeight] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [skipAbha, setSkipAbha] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole] = useState<UserRole>("patient");
  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [healthIdError, setHealthIdError] = useState("");
  
  // OTP states (email-only)
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  
  // Rate limiting states
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tokenChecked, setTokenChecked] = useState(false);
  const { toast } = useToast();
  useLanguage();

  useEffect(() => {
    if (searchParams.get("signup") === "1") setIsSignUp(true);
    setTokenChecked(true);
  }, [searchParams]);



  const buildSignupDraft = useCallback(
    (): PendingSignupDraft => {
      const cleanPhone = phone.trim() ? (phone.startsWith("+") ? phone.trim() : `+91${phone.replace(/\D/g, '')}`) : undefined;
      return {
        role: userRole,
        name: name.trim() || undefined,
        phone: cleanPhone,
        healthId: (healthId && !skipAbha) ? healthId : undefined,
        dateOfBirth: dateOfBirth || undefined,
        weight: weight || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        latitude: latitude,
        longitude: longitude,
      };
    },
    [userRole, name, phone, healthId, dateOfBirth, weight, skipAbha, city, pincode, latitude, longitude],
  );

  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Not supported", description: "Your browser does not support location detection.", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        toast({ title: "Location captured", description: "We saved your coordinates to personalize care." });
      },
      (err) => {
        setLocating(false);
        toast({ title: "Couldn't get location", description: err.message || "Please enter your city and pincode manually.", variant: "destructive" });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, [toast]);

  const redirectBasedOnRole = useCallback(async (_userId: string, _fallbackRole?: UserRole | null) => {
    // Vyana is consumer-only: every signed-in user goes to the patient app.
    navigate("/app", { replace: true });
  }, [navigate]);

  const ensureAccountSetup = useCallback(async (userId: string, metadata?: Record<string, any>) => {
    const signupDraft = getStoredSignupDraft();
    const fallbackRole = metadata?.role ?? signupDraft?.role ?? null;

    const { data: existingRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roleError) throw roleError;

    const roles = (existingRoles ?? []).map((r) => r.role);
    // Prefer admin, then patient, then doctor for routing/setup logic.
    // Vyana is consumer-only — default any new account to "patient".
    const primaryRole = roles.includes("admin")
      ? "admin"
      : roles.includes("patient")
        ? "patient"
        : roles[0] ?? null;
    const resolvedRole = (primaryRole ?? fallbackRole ?? "patient") as UserRole | "admin" | null;

    // Beta gating removed — all signups are open.


    if (roles.length === 0 && resolvedRole && resolvedRole !== "admin") {
      const { error: insertRoleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: resolvedRole });

      if (insertRoleError && insertRoleError.code !== "23505") throw insertRoleError;
    }

    if (resolvedRole === "patient") {
      const { data: existingPatient, error: patientLookupError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (patientLookupError) throw patientLookupError;

      if (!existingPatient) {
        const patientName = signupDraft?.name ?? metadata?.name ?? metadata?.full_name ?? metadata?.display_name ?? metadata?.email?.split("@")[0] ?? "Patient";
        const patientWeight = signupDraft?.weight ? parseFloat(signupDraft.weight) : null;

        const { error: insertPatientError } = await supabase.from("patients").insert({
          user_id: userId,
          name: patientName,
          phone: signupDraft?.phone ?? null,
          national_health_id: signupDraft?.healthId ?? null,
          date_of_birth: signupDraft?.dateOfBirth ?? null,
          weight: Number.isFinite(patientWeight) ? patientWeight : null,
          age: calculateAge(signupDraft?.dateOfBirth),
          city: signupDraft?.city ?? null,
          pincode: signupDraft?.pincode ?? null,
          latitude: signupDraft?.latitude ?? null,
          longitude: signupDraft?.longitude ?? null,
          is_primary: true,
          relationship: "Self",
          avatar_emoji: "👤",
        });

        if (insertPatientError) throw insertPatientError;
      }
    }

    if (resolvedRole) {
      setStoredSignupDraft(null);
    }

    return resolvedRole;
  }, []);

  const handleAuthenticatedUser = useCallback(async (userId: string, metadata?: Record<string, any>) => {
    try {
      await ensureAccountSetup(userId, metadata);
      await redirectBasedOnRole(userId);
    } catch (error: any) {
      const isGated = error?.__gatedBeta === true;
      toast({
        title: isGated ? "Invite required" : "Login failed",
        description: error?.message ?? "We couldn't finish signing you in.",
        variant: "destructive",
      });
      if (isGated) {
        navigate("/auth", { replace: true });
      }

    }
  }, [ensureAccountSetup, redirectBasedOnRole, toast, navigate]);

  // Load attempts from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("auth-attempts");
    const storedLockout = sessionStorage.getItem("auth-lockout");
    if (stored) setAttempts(parseInt(stored, 10));
    if (storedLockout) {
      const end = parseInt(storedLockout, 10);
      if (Date.now() < end) {
        setLockoutEnd(end);
      } else {
        sessionStorage.removeItem("auth-lockout");
        sessionStorage.removeItem("auth-attempts");
      }
    }
  }, []);

  // Lockout countdown
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
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  useEffect(() => {
    let isMounted = true;

    // Surface generic OAuth callback errors from the URL hash.
    const hash = window.location.hash || "";
    if (hash.includes("error")) {
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const errDesc = params.get("error_description") || params.get("error") || "";
      const decoded = decodeURIComponent(errDesc).toLowerCase();

      if (decoded) {
        // Generic OAuth failure — surface a toast but stay on the auth page.
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
      void handleAuthenticatedUser(session.user.id, session.user.user_metadata);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted || !session) return;
      window.setTimeout(() => {
        void handleAuthenticatedUser(session.user.id, session.user.user_metadata);
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthenticatedUser, navigate, toast]);


  const recordAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    sessionStorage.setItem("auth-attempts", String(newAttempts));
    if (newAttempts >= MAX_ATTEMPTS) {
      const end = Date.now() + LOCKOUT_DURATION * 1000;
      setLockoutEnd(end);
      sessionStorage.setItem("auth-lockout", String(end));
    }
  };

  const isLockedOut = lockoutEnd !== null && Date.now() < lockoutEnd;

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isSignUp && value && !validateEmail(value)) setEmailError("Please enter a valid email address");
    else setEmailError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp) setPasswordErrors(validatePassword(value).errors);
  };

  const handleHealthIdChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 14);
    setHealthId(cleaned);
    setHealthIdError("");
  };

  const checkHealthIdExists = async (id: string): Promise<boolean> => {
    const { data } = await supabase.from("patients").select("id").eq("national_health_id", id).maybeSingle();
    return !!data;
  };

  const checkPhoneExists = async (phoneNum: string): Promise<boolean> => {
    const { data } = await supabase.from("patients").select("id").eq("phone", phoneNum).maybeSingle();
    return !!data;
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email address first");
      toast({
        title: "Email required",
        description: "Enter your email above, then tap Forgot password again.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const redirectBase = Capacitor.isNativePlatform()
        ? CUSTOMER_APP_ORIGIN
        : window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectBase}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Check your inbox",
        description: `We sent a password reset link to ${email}.`,
      });
    } catch (err: any) {
      toast({
        title: "Couldn't send reset link",
        description: err?.message ?? "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      toast({ title: "Locked Out", description: t("auth.tooManyAttempts", { seconds: lockoutRemaining }), variant: "destructive" });
      return;
    }

    if (isSignUp) {
      if (!validateEmail(email)) { setEmailError("Please enter a valid email address"); return; }
      const pv = validatePassword(password);
      if (!pv.isValid) { setPasswordErrors(pv.errors); toast({ title: "Weak Password", description: "Please meet all password requirements", variant: "destructive" }); return; }
      if (userRole === "patient") {
        if (!ageConfirmed) {
          toast({ title: "Age confirmation required", description: "You must be 13 or older to use Vyana.", variant: "destructive" });
          return;
        }
        if (!consentGiven) {
          toast({ title: "Consent Required", description: "You must accept the data consent agreement to proceed.", variant: "destructive" });
          return;
        }
        // Phone, ABHA, DOB, weight, location are now collected in the profile after signup.
        // Keeps the signup form short — patients complete their profile inside the app.
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const signupDraft = buildSignupDraft();
        setStoredSignupDraft(signupDraft);

        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              role: signupDraft.role,
              name: signupDraft.name,
              phone: signupDraft.phone,
              healthId: signupDraft.healthId,
              dateOfBirth: signupDraft.dateOfBirth,
              weight: signupDraft.weight,
            },
          },
        });
        if (error) throw error;
        // Beta gating removed — no invite token to consume.

        if (data.session && data.user) {
          await handleAuthenticatedUser(data.user.id, data.user.user_metadata);
          // DPDPA 2023 — record consent grant on signup
          try {
            await supabase.from("consent_log").insert([
              { user_id: data.user.id, consent_type: "data_processing", policy_version: "v1.0", granted: true, user_agent: navigator.userAgent, context: { source: "signup" } },
              { user_id: data.user.id, consent_type: "privacy_policy", policy_version: "v1.0", granted: true, user_agent: navigator.userAgent, context: { source: "signup" } },
              { user_id: data.user.id, consent_type: "terms_of_service", policy_version: "v1.0", granted: true, user_agent: navigator.userAgent, context: { source: "signup" } },
            ]);
          } catch (e) { console.warn("consent_log write failed", e); }
          const { logEvent } = await import("@/lib/analytics");
          void logEvent("signup_completed", { method: "email", role: signupDraft.role });
        }
        toast({
          title: "Account created!",
          description: data.session
            ? "You're signed in now."
            : "Check your email, verify your account, then sign in.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          recordAttempt();
          throw error;
        }
        // Reset attempts on success
        setAttempts(0);
        sessionStorage.removeItem("auth-attempts");
        sessionStorage.removeItem("auth-lockout");
      }
    } catch (error: any) {
      toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (isLockedOut) {
      toast({ title: "Locked Out", description: t("auth.tooManyAttempts", { seconds: lockoutRemaining }), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (authMode === "phoneOtp") {
        const normalizedPhone = normalizePhoneForAuth(phone);
        if (!isValidPhoneForAuth(normalizedPhone)) {
          setPhoneError("Enter a valid mobile number with country code");
          toast({ title: "Invalid mobile number", description: "Use a 10-digit Indian mobile number or include the country code.", variant: "destructive" });
          setLoading(false);
          return;
        }
        setPhoneError("");
        const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
        if (error) { recordAttempt(); throw error; }
        setOtpSent(true);
        toast({ title: t("auth.otpSent"), description: "Check your phone for the code" });
        return;
      }

      if (!email || !validateEmail(email)) {
        toast({ title: "Invalid Email", description: "Enter a valid email", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth` } });
      if (error) { recordAttempt(); throw error; }
      setOtpSent(true);
      toast({ title: t("auth.otpSent"), description: "Check your email inbox" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) return;
    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneForAuth(phone);
      const { error } = authMode === "phoneOtp"
        ? await supabase.auth.verifyOtp({ phone: normalizedPhone, token: otpValue, type: "sms" })
        : await supabase.auth.verifyOtp({ email, token: otpValue, type: "email" });
      if (error) { recordAttempt(); throw error; }
      setAttempts(0);
      sessionStorage.removeItem("auth-attempts");
      sessionStorage.removeItem("auth-lockout");
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    try {
      if (isSignUp) {
        setStoredSignupDraft(buildSignupDraft());
      }

      const isNativeApp = Capacitor.isNativePlatform();

      if (isNativeApp) {
        // Clear any cached session so a cancelled OAuth flow doesn't drop the
        // user back into a previous account on next app open.
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

      navigate("/app", { replace: true });
    } catch (error: any) {
      const message = error?.message || "Could not start Google sign-in.";
      toast({
        title: "Authentication Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleAppleAuth = async () => {
    try {
      if (isSignUp) {
        setStoredSignupDraft(buildSignupDraft());
      }
      const isNativeApp = Capacitor.isNativePlatform();
      const redirectUri = isNativeApp ? NATIVE_OAUTH_REDIRECT : `${window.location.origin}/app`;

      if (isNativeApp) {
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

      const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: redirectUri });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/app", { replace: true });
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error?.message || "Could not start Apple sign-in.",
        variant: "destructive",
      });
    }
  };

  const isNativeApp = Capacitor.isNativePlatform();
  const allowSignup = true;
  const effectiveIsSignUp = isSignUp;




  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center bg-background px-4 py-6 sm:py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("auth.welcome")}</h1>
          <p className="text-muted-foreground">{effectiveIsSignUp ? t("auth.signUp") : t("auth.signIn")}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>

          {/* Lockout Warning */}
          {isLockedOut && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {t("auth.tooManyAttempts", { seconds: lockoutRemaining })}
              </p>
            </div>
          )}

          {/* Beta gating removed — open sign-ups. */}


          {/* Vyana is consumer-only, no role selection. */}


          {/* Auth Mode Toggle (login only) */}
          {!isSignUp && (
            <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as AuthMode); setOtpSent(false); setOtpValue(""); setPhoneError(""); }} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t("auth.password")}
                </TabsTrigger>
                <TabsTrigger value="emailOtp" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phoneOtp" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* PASSWORD AUTH */}
          {(isSignUp || authMode === "password") && (
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t("auth.name")}
                    </Label>
                    <Input id="name" type="text" placeholder="Dr. John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50" />
                  </div>
                   {userRole === "patient" && (
                    <>
                      <p className="text-xs text-muted-foreground -mt-2">
                        We'll ask for your phone, ABHA ID, and other details inside the app, takes 30 seconds.
                      </p>

                      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2">
                        <Checkbox
                          id="age-confirm"
                          checked={ageConfirmed}
                          onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="age-confirm" className="text-xs text-foreground leading-tight cursor-pointer">
                          I confirm I am <span className="font-semibold">13 years or older</span>. If you are managing records for a child, you will add them as a family member after signup.
                        </label>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">

                        <div className="flex items-start gap-2">
                          <FileCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Data Consent & Privacy Agreement</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Required to proceed</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button type="button" onClick={() => setShowConsent(!showConsent)} className="text-primary hover:underline">
                            {showConsent ? "Hide summary ▲" : "Quick summary ▼"}
                          </button>
                          <span className="text-muted-foreground">|</span>
                          <Link to="/legal" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                          <span className="text-muted-foreground">|</span>
                          <Link to="/legal#privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
                        </div>
                        {showConsent && (
                          <div className="text-xs text-muted-foreground space-y-2 max-h-48 overflow-y-auto border-t border-border pt-2">
                            <p><strong>1. Purpose:</strong> Vyana stores your health records, prescriptions, lab reports, and vital signs solely to provide you with health tracking, clinical decision support, and shareable health summaries.</p>
                            <p><strong>2. Data Stored:</strong> Personal identifiers (name, phone, ABHA ID, email), uploaded health documents, AI-generated summaries, medication reminders, and vital history.</p>
                            <p><strong>3. Your Control:</strong> You decide who sees your data. Records are only shared when you explicitly generate a shareable link or grant access to a healthcare provider.</p>
                            <p><strong>4. Not Medical Advice:</strong> Vyana is a clinical decision support tool. All AI-generated insights are for informational purposes only and do not constitute medical diagnosis, treatment, or advice. Always consult a qualified healthcare professional.</p>
                            <p><strong>5. Data Security:</strong> Your data is encrypted at rest and in transit. We follow industry-standard security practices (HIPAA-aligned, DPDPA compliant).</p>
                            <p><strong>6. Data Retention:</strong> Your data is retained as long as your account is active. You may request deletion at any time.</p>
                            <p><strong>7. No Liability:</strong> Vyana, its creators, and affiliates are not liable for any medical decisions made based on information displayed in the app.</p>
                          </div>
                        )}
                        <div className="flex items-start gap-2 pt-1">
                          <Checkbox
                            id="consent"
                            checked={consentGiven}
                            onCheckedChange={(checked) => setConsentGiven(checked === true)}
                            className="mt-0.5"
                          />
                          <label htmlFor="consent" className="text-xs text-foreground leading-tight cursor-pointer">
                            I agree to the <Link to="/legal" target="_blank" className="text-primary underline">Terms of Service</Link> and <Link to="/legal#privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>. I understand Vyana is not a substitute for professional medical advice.
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />{t("auth.email")}</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => handleEmailChange(e.target.value)} required className={`bg-background/50 ${emailError ? "border-destructive" : ""}`} />
                {emailError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{emailError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2"><Lock className="w-4 h-4" />{t("auth.password")}</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading || !email}
                      className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => handlePasswordChange(e.target.value)} required className={`bg-background/50 ${isSignUp && passwordErrors.length > 0 ? "border-destructive" : ""}`} />
                {isSignUp && (
                  <div className="text-xs space-y-1">
                    {password.length === 0 ? (
                      <p className="text-muted-foreground">Must have 8+ chars, uppercase, lowercase, number & special char</p>
                    ) : passwordErrors.length > 0 ? (
                      <div className="text-destructive space-y-0.5">
                        {passwordErrors.map((err, i) => (
                          <p key={i} className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{err}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Strong password</p>
                    )}
                  </div>
                )}
              </div>

              {!isSignUp && attempts > 0 && attempts < MAX_ATTEMPTS && (
                <p className="text-xs text-muted-foreground">{MAX_ATTEMPTS - attempts} attempts remaining</p>
              )}

              <Button type="submit" variant="gradient" className="w-full" disabled={loading || isLockedOut}>
                {loading ? t("common.loading") : isSignUp ? t("auth.signUpBtn") : t("auth.signInBtn")}
              </Button>
            </form>
          )}

          {/* OTP AUTH (email only) */}
          {!isSignUp && authMode !== "password" && (
            <div className="space-y-4 mb-6">
              {!otpSent ? (
                <>
                  {authMode === "phoneOtp" ? (
                    <div className="space-y-2">
                      <Label htmlFor="login-phone" className="flex items-center gap-2"><Phone className="w-4 h-4" />Mobile number</Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                        className={`bg-background/50 ${phoneError ? "border-destructive" : ""}`}
                      />
                      {phoneError ? (
                        <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{phoneError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">We'll send a 6-digit code to this mobile number.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{t("auth.email")}</Label>
                      <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50" />
                      <p className="text-xs text-muted-foreground">We'll send a 6-digit code to your email.</p>
                    </div>
                  )}
                  <Button onClick={handleSendOtp} variant="gradient" className="w-full" disabled={loading || isLockedOut}>
                    {loading ? t("common.loading") : t("auth.sendOtp")}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">{t("auth.enterOtp")}</p>
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
                  <Button onClick={handleVerifyOtp} variant="gradient" className="w-full" disabled={loading || otpValue.length < 6 || isLockedOut}>
                    {loading ? t("common.loading") : t("auth.verifyOtp")}
                  </Button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtpValue(""); }} className="text-sm text-primary hover:underline w-full text-center">
                    {t("auth.backToPassword")}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t("auth.orContinue")}</span></div>
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth}>
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleAppleAuth}>
              <Apple className="w-5 h-5 mr-2" />
              Continue with Apple
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center leading-relaxed">
            Sign in with Apple keeps your email private. We only receive your name and a relay address.
          </p>

          <div className="mt-6 text-center">
            {isSignUp ? (
              <button type="button" onClick={() => { setIsSignUp(false); setAuthMode("password"); setOtpSent(false); }} className="text-sm text-primary hover:underline">
                {t("auth.hasAccount")}
              </button>
            ) : (
              <button type="button" onClick={() => { setIsSignUp(true); }} className="text-sm text-primary hover:underline">
                {t("auth.noAccount")}
              </button>
            )}
          </div>

          {/* Compliance footer — covers Google sign-in path and meets App Store / Play Store requirements */}
          <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              By continuing you agree to our{" "}
              <Link to="/legal" target="_blank" className="text-primary hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/legal#privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
              You confirm you are <span className="font-semibold">13 years or older</span>.
            </p>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed italic">
              Vyana is a clinical decision support tool, not a diagnosis engine. AI insights are informational and must be confirmed with a qualified doctor.
            </p>
          </div>



        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← {t("common.back")}</button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
