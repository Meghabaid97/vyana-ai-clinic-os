import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Chrome, Stethoscope, User, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validatePassword, validateEmail, validateHealthId } from "@/lib/validation";

type UserRole = "doctor" | "patient";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [healthId, setHealthId] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("doctor");
  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [healthIdError, setHealthIdError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectBasedOnRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setTimeout(() => {
          redirectBasedOnRole(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const redirectBasedOnRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      const role = roles[0].role;
      if (role === "doctor" || role === "admin") {
        // Check if doctor has completed profile
        const { data: profile } = await supabase
          .from("doctor_profiles")
          .select("is_profile_complete")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (!profile || !profile.is_profile_complete) {
          navigate("/doctor-profile-setup");
        } else {
          navigate("/doctor-dashboard");
        }
      } else if (role === "patient") {
        navigate("/patient-dashboard");
      } else {
        navigate("/doctor-profile-setup");
      }
    } else {
      // No role found - could be Google sign-in, need to ask for role
      navigate("/doctor-profile-setup");
    }
  };

  // Validation handlers
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isSignUp && value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp) {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
    }
  };

  const handleHealthIdChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    setHealthId(cleaned);
    setHealthIdError("");
  };

  const checkHealthIdExists = async (id: string): Promise<boolean> => {
    const { data } = await supabase
      .from("patients")
      .select("id")
      .eq("national_health_id", id)
      .maybeSingle();
    return !!data;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for signup
    if (isSignUp) {
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordErrors(passwordValidation.errors);
        toast({
          title: "Weak Password",
          description: "Please meet all password requirements",
          variant: "destructive",
        });
        return;
      }

      if (userRole === "patient" && healthId) {
        if (!validateHealthId(healthId)) {
          setHealthIdError("Health ID must be exactly 12 digits");
          return;
        }
        
        // Check if health ID is already registered
        const exists = await checkHealthIdExists(healthId);
        if (exists) {
          setHealthIdError("This Health ID is already registered. Please sign in instead.");
          toast({
            title: "Health ID Already Registered",
            description: "An account with this Health ID already exists. Please sign in.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              role: userRole,
              name: name,
            },
          },
        });
        if (error) throw error;

        // If user created successfully and we have a user ID
        if (data.user) {
          // Insert the role directly (no trigger auto-creates it now)
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: userRole });
          
          if (roleError) {
            console.error("Role insert error:", roleError);
          }

          // For patients, create the patient profile
          if (userRole === "patient") {
            const { error: patientError } = await supabase.from("patients").insert({
              user_id: data.user.id,
              name: name,
              phone: phone || null,
              national_health_id: healthId || null,
            });
            if (patientError) {
              console.error("Patient profile error:", patientError);
            }
          }
        }

        toast({
          title: "Account created!",
          description: userRole === "doctor" 
            ? "Please complete your profile to get started." 
            : "You can now sign in with your credentials.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Welcome to Vyana AI</h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-glow">
          {/* Role Selection - Only show during sign up */}
          {isSignUp && (
            <Tabs value={userRole} onValueChange={(v) => setUserRole(v as UserRole)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="doctor" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Doctor
                </TabsTrigger>
                <TabsTrigger value="patient" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                {userRole === "patient" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="healthId" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        National Health ID (Aadhaar)
                      </Label>
                      <Input
                        id="healthId"
                        type="text"
                        placeholder="Enter 12-digit Aadhaar number"
                        value={healthId}
                        onChange={(e) => handleHealthIdChange(e.target.value)}
                        maxLength={12}
                        required
                        className={`bg-background/50 ${healthIdError ? "border-destructive" : ""}`}
                      />
                      {healthIdError ? (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {healthIdError}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Used to link your consultations and medical records
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (for reminders)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
                className={`bg-background/50 ${emailError ? "border-destructive" : ""}`}
              />
              {emailError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className={`bg-background/50 ${isSignUp && passwordErrors.length > 0 ? "border-destructive" : ""}`}
              />
              {isSignUp && (
                <div className="text-xs space-y-1">
                  {password.length === 0 ? (
                    <p className="text-muted-foreground">
                      Must have 8+ chars, uppercase, lowercase, number & special char
                    </p>
                  ) : passwordErrors.length > 0 ? (
                    <div className="text-destructive space-y-0.5">
                      {passwordErrors.map((err, i) => (
                        <p key={i} className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {err}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Strong password
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? `Sign Up as ${userRole === "doctor" ? "Doctor" : "Patient"}` : "Sign In"}
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
