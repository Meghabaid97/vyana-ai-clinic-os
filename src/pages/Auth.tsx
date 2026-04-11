import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Chrome, Stethoscope, User, Shield, AlertCircle, CheckCircle2, Phone, KeyRound, Calendar, Weight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validatePassword, validateEmail, validateHealthId } from "@/lib/validation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";

type UserRole = "doctor" | "patient";
type AuthMode = "password" | "otp";
type OtpMethod = "email" | "phone";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60; // seconds

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [healthId, setHealthId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weight, setWeight] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("doctor");
  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [healthIdError, setHealthIdError] = useState("");
  
  // OTP states
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  
  // Rate limiting states
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang } = useLanguage();

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectBasedOnRole(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setTimeout(() => redirectBasedOnRole(session.user.id), 0);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const redirectBasedOnRole = async (userId: string) => {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (roles && roles.length > 0) {
      const role = roles[0].role;
      if (role === "doctor" || role === "admin") {
        const { data: profile } = await supabase.from("doctor_profiles").select("is_profile_complete").eq("user_id", userId).maybeSingle();
        if (!profile || !profile.is_profile_complete) navigate("/doctor-profile-setup");
        else navigate("/doctor-dashboard");
      } else if (role === "patient") {
        navigate("/app");
      } else navigate("/doctor-profile-setup");
    } else navigate("/doctor-profile-setup");
  };

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
      if (userRole === "patient" && healthId) {
        if (!validateHealthId(healthId)) { setHealthIdError("Health ID must be exactly 14 digits"); return; }
        if (await checkHealthIdExists(healthId)) {
          setHealthIdError("This Health ID is already registered.");
          toast({ title: "Health ID Already Registered", description: "An account with this Health ID already exists.", variant: "destructive" });
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth`, data: { role: userRole, name } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: userRole });
          if (userRole === "patient") {
            await supabase.from("patients").insert({
              user_id: data.user.id,
              name,
              phone: phone || null,
              national_health_id: healthId || null,
              date_of_birth: dateOfBirth || null,
              weight: weight ? parseFloat(weight) : null,
              age: dateOfBirth ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            });
          }
        }
        toast({ title: "Account created!", description: userRole === "doctor" ? "Please complete your profile." : "You can now sign in." });
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
      if (otpMethod === "email") {
        if (!email || !validateEmail(email)) { toast({ title: "Invalid Email", description: "Enter a valid email", variant: "destructive" }); setLoading(false); return; }
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) { recordAttempt(); throw error; }
      } else {
        if (!otpPhone || otpPhone.length < 10) { toast({ title: "Invalid Phone", description: "Enter a valid phone number", variant: "destructive" }); setLoading(false); return; }
        const formattedPhone = otpPhone.startsWith("+") ? otpPhone : `+91${otpPhone}`;
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
        if (error) { recordAttempt(); throw error; }
      }
      setOtpSent(true);
      toast({ title: t("auth.otpSent"), description: otpMethod === "email" ? "Check your email inbox" : "Check your phone for SMS" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) return;
    setLoading(true);
    try {
      if (otpMethod === "email") {
        const { error } = await supabase.auth.verifyOtp({ email, token: otpValue, type: "email" });
        if (error) { recordAttempt(); throw error; }
      } else {
        const formattedPhone = otpPhone.startsWith("+") ? otpPhone : `+91${otpPhone}`;
        const { error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otpValue, type: "sms" });
        if (error) { recordAttempt(); throw error; }
      }
      setAttempts(0);
      sessionStorage.removeItem("auth-attempts");
      sessionStorage.removeItem("auth-lockout");
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    try {
      const isNativeApp = /Capacitor|iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: isNativeApp ? "lovable://oauth-callback" : window.location.origin,
      });
      if (result.error) {
        throw result.error;
      }
      if (result.redirected) {
        return;
      }
    } catch (error: any) {
      toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("auth.welcome")}</h1>
          <p className="text-muted-foreground">{isSignUp ? t("auth.signUp") : t("auth.signIn")}</p>
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

          {/* Role Selection - Only show during sign up */}
          {isSignUp && (
            <Tabs value={userRole} onValueChange={(v) => setUserRole(v as UserRole)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="doctor" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  {t("auth.doctor")}
                </TabsTrigger>
                <TabsTrigger value="patient" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("auth.patient")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

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
                      <div className="space-y-2">
                        <Label htmlFor="healthId" className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t("auth.healthId")}
                        </Label>
                        <Input id="healthId" type="text" placeholder="Enter 14-digit ABHA Health ID" value={healthId} onChange={(e) => handleHealthIdChange(e.target.value)} maxLength={14} required className={`bg-background/50 ${healthIdError ? "border-destructive" : ""}`} />
                        {healthIdError ? (
                          <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{healthIdError}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{t("auth.healthIdHelp")}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("auth.phone")}</Label>
                        <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date of Birth
                        </Label>
                        <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="flex items-center gap-2">
                          <Weight className="w-4 h-4" />
                          Weight (kg)
                        </Label>
                        <Input id="weight" type="number" placeholder="e.g. 65" value={weight} onChange={(e) => setWeight(e.target.value)} min="1" max="300" className="bg-background/50" />
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
                {loading ? t("common.loading") : isSignUp ? `${t("auth.signUpBtn")} as ${userRole === "doctor" ? t("auth.doctor") : t("auth.patient")}` : t("auth.signInBtn")}
              </Button>
            </form>
          )}

          {/* OTP AUTH */}
          {!isSignUp && authMode === "otp" && (
            <div className="space-y-4 mb-6">
              {/* OTP Method Toggle */}
              <Tabs value={otpMethod} onValueChange={(v) => { setOtpMethod(v as OtpMethod); setOtpSent(false); setOtpValue(""); }} className="mb-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("auth.emailOtp")}
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("auth.phoneOtp")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {!otpSent ? (
                <>
                  {otpMethod === "email" ? (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{t("auth.email")}</Label>
                      <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />{t("auth.phone")}</Label>
                      <Input type="tel" placeholder="+91 98765 43210" value={otpPhone} onChange={(e) => setOtpPhone(e.target.value)} className="bg-background/50" />
                      <p className="text-xs text-muted-foreground">Enter with country code or we'll add +91</p>
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

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth}>
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setAuthMode("password"); setOtpSent(false); }} className="text-sm text-primary hover:underline">
              {isSignUp ? t("auth.hasAccount") : t("auth.noAccount")}
            </button>
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
