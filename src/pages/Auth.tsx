import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Chrome, User, Shield, AlertCircle, CheckCircle2, Phone, KeyRound, Calendar, Weight, FileCheck, MapPin, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validatePassword, validateEmail, validateHealthId } from "@/lib/validation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";

type UserRole = "patient";
type AuthMode = "password" | "otp";

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
const WEB_OAUTH_REDIRECT = `${CUSTOMER_APP_ORIGIN}/app`;
const NATIVE_OAUTH_REDIRECT = "vyana://oauth-callback/";

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
  const inviteToken = searchParams.get("token");
  const [tokenChecked, setTokenChecked] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [pastedInvite, setPastedInvite] = useState("");
  const [validatingPasted, setValidatingPasted] = useState(false);
  const { toast } = useToast();
  useLanguage();

  // Validate invite token (from ?token=) on mount via the server-side
  // edge function. On success, persist the token to sessionStorage so the
  // post-OAuth callback can re-verify and consume it.
  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (!inviteToken) {
        setTokenChecked(true);
        return;
      }
      const result = await serverValidateInviteToken(inviteToken);
      if (!active) return;
      if (result.valid) {
        setTokenValid(true);
        setIsSignUp(true);
        sessionStorage.setItem(VALIDATED_INVITE_KEY, inviteToken);
        if (result.email) setEmail(result.email);
        if (result.name) setName(result.name);
      } else {
        sessionStorage.removeItem(VALIDATED_INVITE_KEY);
        toast({
          title: "Invite link invalid or expired",
          description: "Please request a new one.",
          variant: "destructive",
        });
      }
      setTokenChecked(true);
    };
    void validate();
    return () => { active = false; };
  }, [inviteToken, toast]);

  // Validate a manually-pasted invite link/token. Accepts either the bare
  // UUID or the full /auth?token=... URL.
  const handleValidatePastedInvite = useCallback(async () => {
    const raw = pastedInvite.trim();
    if (!raw) return;
    let token = raw;
    try {
      // If the user pasted a full URL, extract the token query param.
      if (/^https?:\/\//i.test(raw)) {
        const u = new URL(raw);
        token = u.searchParams.get("token") ?? raw;
      }
    } catch {
      // ignore — fall through with raw value
    }
    setValidatingPasted(true);
    const result = await serverValidateInviteToken(token);
    setValidatingPasted(false);
    if (result.valid) {
      setTokenValid(true);
      setIsSignUp(true);
      sessionStorage.setItem(VALIDATED_INVITE_KEY, token);
      if (result.email) setEmail(result.email);
      if (result.name) setName(result.name);
      toast({
        title: "Invite confirmed",
        description: "You can now create your Vyana account.",
      });
    } else {
      sessionStorage.removeItem(VALIDATED_INVITE_KEY);
      toast({
        title: "Invite link invalid or expired",
        description: "Double-check the link or request a new one.",
        variant: "destructive",
      });
    }
  }, [pastedInvite, toast]);

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

    // ── Gated-beta gate ──────────────────────────────────────────────────
    // Block sign-ins for accounts that aren't already in the database
    // UNLESS the user presented a server-validated invite token.
    // "Already in the database" = has at least one user_roles row OR an
    // existing patients row.
    const hasExistingRole = roles.length > 0;
    let hasExistingPatient = false;
    if (!hasExistingRole) {
      const { data: existingPatientRow } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      hasExistingPatient = !!existingPatientRow;
    }
    const isExistingAccount = hasExistingRole || hasExistingPatient;

    if (!isExistingAccount) {
      // New account — require a server-validated invite token in this session.
      const validatedToken = sessionStorage.getItem(VALIDATED_INVITE_KEY);
      const inviteOk = validatedToken
        ? await serverValidateInviteToken(validatedToken)
        : { valid: false as const };

      if (!inviteOk.valid) {
        // Sign them out so we don't leave a half-provisioned account.
        await supabase.auth.signOut();
        sessionStorage.removeItem(VALIDATED_INVITE_KEY);
        const err = new Error(
          "Vyana is in gated beta. Sign-up requires a valid invite link.",
        );
        (err as any).__gatedBeta = true;
        throw err;
      }

      // Token confirmed valid — consume it now (single-use) so it can't be
      // reused for another account.
      try {
        await (supabase as any).rpc("consume_invite_token", {
          _token: validatedToken,
        });
      } catch {
        // Non-fatal: account creation continues even if consume fails;
        // expiration still protects.
      }
      sessionStorage.removeItem(VALIDATED_INVITE_KEY);
    }
    // ─────────────────────────────────────────────────────────────────────

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
        navigate("/request-access", { replace: true });
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

    // Detect OAuth callback errors (e.g., gated-beta trigger blocked signup at the DB level).
    // Supabase puts these on the URL hash: #error=server_error&error_description=...
    const hash = window.location.hash || "";
    if (hash.includes("error")) {
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const errDesc = params.get("error_description") || params.get("error") || "";
      const decoded = decodeURIComponent(errDesc).toLowerCase();
      if (decoded.includes("gated_beta") || decoded.includes("not on the approved")) {
        // Clear the hash so it doesn't replay on refresh, then send to friendly screen.
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        navigate("/access-pending", { replace: true });
        return;
      }
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
        // Mark invite token as used (best effort)
        if (inviteToken) {
          await supabase.rpc("consume_invite_token", { _token: inviteToken });
        }
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
      const { error } = await supabase.auth.verifyOtp({ email, token: otpValue, type: "email" });
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
      // Gated-beta gate (sign-up only): server-validate the invite token
      // RIGHT NOW. Don't trust client-side `tokenValid` state alone — it
      // could be stale (token consumed in another tab, expired since page
      // load, etc.). The same edge function is also called again after
      // OAuth callback inside ensureAccountSetup as a final defense.
      if (isSignUp) {
        const storedToken = sessionStorage.getItem(VALIDATED_INVITE_KEY);
        if (!storedToken) {
          toast({
            title: "Invite required",
            description: "Vyana is in gated beta. Paste your invite link below to sign up with Google.",
            variant: "destructive",
          });
          return;
        }
        const check = await serverValidateInviteToken(storedToken);
        if (!check.valid) {
          sessionStorage.removeItem(VALIDATED_INVITE_KEY);
          setTokenValid(false);
          toast({
            title: "Invite link invalid or expired",
            description: "Please request a new invite to continue.",
            variant: "destructive",
          });
          return;
        }
        setStoredSignupDraft(buildSignupDraft());
      }

      const isNativeApp = Capacitor.isNativePlatform();

      if (isNativeApp) {
        const { Browser } = await import("@capacitor/browser");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: NATIVE_OAUTH_REDIRECT,
            skipBrowserRedirect: true,
            queryParams: { prompt: "select_account" },
          },
        });

        if (error) throw error;
        if (!data?.url) throw new Error("Could not start Google sign-in");

        await Browser.open({ url: data.url, presentationStyle: "popover" });
        return;
      }

      // Web: direct Supabase OAuth flow — works on any host (Vercel, custom
      // domain, lovable.app) because the round-trip stays on supabase.co.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: WEB_OAUTH_REDIRECT,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      navigate("/app", { replace: true });
    } catch (error: any) {
      const message = error?.message || "Could not start Google sign-in.";
      const isProxy404 = /404|not[_ ]?found|oauth\/initiate/i.test(message);
      toast({
        title: isProxy404 ? "Google sign-in unavailable" : "Authentication Error",
        description: isProxy404
          ? "Vyana is in gated beta. Please use email or your invite link to sign in."
          : message,
        variant: "destructive",
      });
    }
  };

  // Block signup view entirely without valid invite token
  const allowSignup = tokenValid;
  const effectiveIsSignUp = isSignUp && allowSignup;

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

          {/* Gated-beta banner — shown until the user has a server-validated invite. */}
          {!tokenValid && (
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold text-foreground">Vyana is in gated beta</p>
                  <p className="text-muted-foreground mt-0.5">
                    Sign-in works for existing accounts. New sign-ups (including
                    Google) require a one-time invite link.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-paste" className="text-xs text-muted-foreground">
                  Have an invite link? Paste it here
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-paste"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="https://www.vyana.care/auth?token=…"
                    value={pastedInvite}
                    onChange={(e) => setPastedInvite(e.target.value)}
                    className="bg-background/70 text-xs h-9"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleValidatePastedInvite}
                    disabled={validatingPasted || !pastedInvite.trim()}
                    className="shrink-0"
                  >
                    {validatingPasted ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Don't have one?{" "}
                  <Link to="/request-access" className="text-primary hover:underline">
                    Request access →
                  </Link>
                </p>
              </div>
            </div>
          )}

          {tokenValid && (
            <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-xs text-foreground">
                Invite confirmed — you can sign up with email or Google.
              </p>
            </div>
          )}

          {/* Vyana is consumer-only, no role selection. */}


          {/* Auth Mode Toggle (login only) */}
          {!isSignUp && (
            <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as AuthMode); setOtpSent(false); setOtpValue(""); }} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t("auth.password")}
                </TabsTrigger>
                <TabsTrigger value="otp" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  OTP
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
          {!isSignUp && authMode === "otp" && (
            <div className="space-y-4 mb-6">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{t("auth.email")}</Label>
                    <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50" />
                    <p className="text-xs text-muted-foreground">We'll send a 6-digit code to your email.</p>
                  </div>
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

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth}>
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>
          <p className="mt-2 text-[11px] text-muted-foreground text-center leading-relaxed">
            {tokenValid
              ? "You'll be redirected to Google to finish creating your account."
              : isSignUp
                ? "Google sign-up needs a verified invite link (paste it above)."
                : "Sign in only — Google sign-up is gated to invited members."}
          </p>

          {/* Toggle: only show if user has valid invite (signup) or is currently signing up */}
          {(tokenValid || !isSignUp) && (
            <div className="mt-6 text-center">
              {isSignUp ? (
                <button type="button" onClick={() => { setIsSignUp(false); setAuthMode("password"); setOtpSent(false); }} className="text-sm text-primary hover:underline">
                  {t("auth.hasAccount")}
                </button>
              ) : (
                tokenValid ? (
                  <button type="button" onClick={() => { setIsSignUp(true); }} className="text-sm text-primary hover:underline">
                    {t("auth.noAccount")}
                  </button>
                ) : (
                  <Link to="/request-access" className="text-sm text-primary hover:underline">
                    Don't have an account? Request access →
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← {t("common.back")}</button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
