import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { validatePassword } from "@/lib/validation";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // Supabase parses the recovery token from the URL hash automatically and
  // emits a PASSWORD_RECOVERY event. We also accept an existing session so
  // users coming from the email link can set a new password.
  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setRecoveryReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) setRecoveryReady(true);
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pv = validatePassword(password);
    if (!pv.isValid) {
      setErrors(pv.errors);
      toast({ title: "Weak password", description: "Please meet all requirements.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please re-enter the same password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({
        title: "Couldn't update password",
        description: err?.message ?? "The reset link may have expired. Please request a new one.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong password for your Vyana account.
          </p>
        </div>

        {checking ? (
          <p className="text-center text-sm text-muted-foreground">Verifying reset link…</p>
        ) : !recoveryReady ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
              This reset link is invalid or has expired. Please request a new one from the sign-in page.
            </div>
            <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> New password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(validatePassword(e.target.value).errors);
                }}
                required
                className={`bg-background/50 ${errors.length > 0 && password ? "border-destructive" : ""}`}
              />
              <div className="text-xs space-y-1">
                {password.length === 0 ? (
                  <p className="text-muted-foreground">Must have 8+ chars, uppercase, lowercase, number & special char</p>
                ) : errors.length > 0 ? (
                  <div className="text-destructive space-y-0.5">
                    {errors.map((err, i) => (
                      <p key={i} className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{err}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Strong password</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>

            <button
              type="button"
              onClick={() => navigate("/auth", { replace: true })}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
