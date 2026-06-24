import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileCheck, Shield, Calendar, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const POLICY_VERSION = "v1.0";

/**
 * Post-auth consent gate.
 *
 * Every auth flow (phone OTP, Google, Apple) lands here. If the signed-in
 * user already has a consent_log row of type "terms_of_service" we skip
 * straight to /app. Otherwise we show the three required consents
 * (age, ToS+Privacy, DPDPA) and gate /app behind them.
 */
const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dpdpaAccepted, setDpdpaAccepted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const ensurePatientRow = useCallback(async (uid: string, metadata?: Record<string, any>) => {
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (existing) return;

    const name =
      metadata?.name ||
      metadata?.full_name ||
      metadata?.display_name ||
      (metadata?.email ? String(metadata.email).split("@")[0] : null) ||
      "Patient";

    await supabase.from("patients").insert({
      user_id: uid,
      name,
      is_primary: true,
      relationship: "Self",
      avatar_emoji: "👤",
    });
  }, []);

  // Check session + whether consent has already been given.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);

      const { data: consents } = await supabase
        .from("consent_log")
        .select("consent_type")
        .eq("user_id", session.user.id)
        .eq("granted", true);

      const types = new Set((consents ?? []).map((c) => c.consent_type));
      const allGranted =
        types.has("age_18_confirmation") &&
        types.has("terms_of_service") &&
        types.has("dpdpa_data_processing");

      if (allGranted) {
        // Make sure a patient row exists even for users who consented previously.
        await ensurePatientRow(session.user.id, session.user.user_metadata);
        navigate("/app", { replace: true });
        return;
      }
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate, ensurePatientRow]);

  const canSubmit = ageConfirmed && termsAccepted && dpdpaAccepted && !submitting;

  const handleAccept = async () => {
    if (!userId || !canSubmit) return;
    setSubmitting(true);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const { error } = await supabase.from("consent_log").insert([
        {
          user_id: userId,
          consent_type: "age_18_confirmation",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "welcome" },
        },
        {
          user_id: userId,
          consent_type: "terms_of_service",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "welcome" },
        },
        {
          user_id: userId,
          consent_type: "privacy_policy",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "welcome" },
        },
        {
          user_id: userId,
          consent_type: "dpdpa_data_processing",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "welcome" },
        },
      ]);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await ensurePatientRow(userId, user?.user_metadata);

      navigate("/app", { replace: true });
    } catch (e: any) {
      toast({
        title: "Couldn't save your consent",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background px-4 py-6 sm:py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-3">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">A few quick confirmations</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We need your consent before we store any health information. Takes 20 seconds.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <ConsentRow
            icon={<Calendar className="h-5 w-5 text-primary" />}
            id="age-18"
            checked={ageConfirmed}
            onChange={setAgeConfirmed}
            title="I am 18 years or older"
            body="If you're managing records for a child or parent, you'll add them as a family member inside the app."
          />

          <ConsentRow
            icon={<FileCheck className="h-5 w-5 text-primary" />}
            id="terms"
            checked={termsAccepted}
            onChange={setTermsAccepted}
            title="I accept the Terms of Service and Privacy Policy"
            body={
              <>
                Read the full{" "}
                <Link to="/legal" target="_blank" className="text-primary underline">Terms</Link>
                {" "}and{" "}
                <Link to="/legal#privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>.
                Vyana is clinical decision support, not a substitute for medical advice.
              </>
            }
          />

          <ConsentRow
            icon={<Shield className="h-5 w-5 text-primary" />}
            id="dpdpa"
            checked={dpdpaAccepted}
            onChange={setDpdpaAccepted}
            title="I consent to processing my health data under India's DPDPA, 2023"
            body="Your records, prescriptions, lab reports, and AI summaries are stored only to power your health timeline and shareable briefings. You can withdraw this consent or delete your data at any time from Settings."
          />

          <Button
            onClick={handleAccept}
            variant="gradient"
            className="w-full h-12 text-base mt-2"
            disabled={!canSubmit}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agree and continue"}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            We log each consent with a timestamp so we can show you exactly what you agreed to.
          </p>
        </div>
      </div>
    </div>
  );
};

const ConsentRow = ({
  icon,
  id,
  checked,
  onChange,
  title,
  body,
}: {
  icon: React.ReactNode;
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: React.ReactNode;
}) => (
  <label
    htmlFor={id}
    className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
  >
    <div className="shrink-0 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
    </div>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      className="mt-0.5 shrink-0"
    />
  </label>
);

export default Welcome;
