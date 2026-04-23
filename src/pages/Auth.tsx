import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
  const { toast } = useToast();
  useLanguage();

  // Validate invite token on mount. If present + valid → unlock signup.
  // If absent → only login is allowed (signup tab is hidden).
  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (!inviteToken) {
        setTokenChecked(true);
        return;
      }
      const { data } = await (supabase as any)
        .rpc("get_access_request_by_token", { _token: inviteToken })
        .maybeSingle();
      if (!active) return;
      if (
        data &&
        data.status === "approved" &&
        !data.token_used_at &&
        (!data.token_expires_at || new Date(data.token_expires_at) > new Date())
      ) {
        setTokenValid(true);
        setIsSignUp(true);
        if (data.email) setEmail(data.email);
        if (data.name) setName(data.name);
      } else {
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
    // Prefer admin, then patient, then doctor for routing/setup logic
    const primaryRole = roles.includes("admin")
      ? "admin"
      : roles.includes("patient")
        ? "patient"
        : roles[0] ?? null;
    const resolvedRole = (primaryRole ?? fallbackRole) as UserRole | "admin" | null;

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
      toast({
        title: "Login failed",
        description: error?.message ?? "We couldn't finish signing you in.",
        variant: "destructive",
      });
    }
  }, [ensureAccountSetup, redirectBasedOnRole, toast]);

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
  }, [handleAuthenticatedUser]);

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

  const NATIVE_OAUTH_REDIRECT = "vyana://oauth-callback/";

  const handleGoogleAuth = async () => {
    try {
      if (isSignUp) {
        setStoredSignupDraft(buildSignupDraft());
      }

      const isNativeApp = Capacitor.isNativePlatform();

      if (isNativeApp) {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: NATIVE_OAUTH_REDIRECT,
        });
        if (result.error) throw result.error;
        if (result.redirected) return;

        navigate("/app", { replace: true });
        return;
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;

      navigate("/app", { replace: true });
    } catch (error: any) {
      toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
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
                <Label htmlFor="password" className="flex items-center gap-2"><Lock className="w-4 h-4" />{t("auth.password")}</Label>
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
