import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LegalLink } from "@/components/LegalLink";
import { cn } from "@/lib/utils";

const POLICY_VERSION = "v1.0";

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dpdpaAccepted, setDpdpaAccepted] = useState(false);
  const [aiAccepted, setAiAccepted] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
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
        types.has("dpdpa_data_processing") &&
        types.has("ai_processing");

      if (allGranted) {
        await ensurePatientRow(session.user.id, session.user.user_metadata);
        navigate("/app", { replace: true });
        return;
      }
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate, ensurePatientRow]);

  const canSubmit = ageConfirmed && termsAccepted && dpdpaAccepted && aiAccepted && !submitting;

  const handleAccept = async () => {
    if (!userId || !canSubmit) return;
    setSubmitting(true);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const { error } = await supabase.from("consent_log").insert([
        { user_id: userId, consent_type: "age_18_confirmation", policy_version: POLICY_VERSION, granted: true, user_agent: ua, context: { source: "welcome" } },
        { user_id: userId, consent_type: "terms_of_service", policy_version: POLICY_VERSION, granted: true, user_agent: ua, context: { source: "welcome" } },
        { user_id: userId, consent_type: "privacy_policy", policy_version: POLICY_VERSION, granted: true, user_agent: ua, context: { source: "welcome" } },
        { user_id: userId, consent_type: "dpdpa_data_processing", policy_version: POLICY_VERSION, granted: true, user_agent: ua, context: { source: "welcome" } },
        {
          user_id: userId,
          consent_type: "ai_processing",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: {
            source: "welcome",
            providers: ["Google Gemini", "OpenAI GPT", "OpenAI Whisper"],
            gateway: "Lovable AI Gateway",
            data_categories: [
              "uploaded_health_documents",
              "structured_vitals",
              "medications",
              "symptom_notes",
              "voice_recordings",
            ],
            excludes_identifiers: true,
          },
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
    <div className="min-h-[100svh] bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-10 pb-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary mx-auto mb-5">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-serif italic text-foreground leading-tight">
            Your privacy
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed px-4">
            A few consents we need before storing any health information. You can change these any time in Settings.
          </p>
        </div>

        {/* Grouped settings list */}
        <div className="flex-1">
          <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden">
            <ConsentRow
              id="age-18"
              checked={ageConfirmed}
              onChange={setAgeConfirmed}
              title="Age verification"
              body="I confirm that I am 18 years or older."
              isFirst
            />
            <ConsentRow
              id="terms"
              checked={termsAccepted}
              onChange={setTermsAccepted}
              title="Terms & Privacy"
              body={
                <>
                  I accept the{" "}
                  <LegalLink section="terms">Terms of Service</LegalLink>{" "}and{" "}
                  <LegalLink section="privacy">Privacy Policy</LegalLink>.
                </>
              }
            />
            <ConsentRow
              id="dpdpa"
              checked={dpdpaAccepted}
              onChange={setDpdpaAccepted}
              title="Data processing"
              body="I consent to processing my health data under India's DPDPA, 2023."
            />
            <ConsentRow
              id="ai-processing"
              checked={aiAccepted}
              onChange={setAiAccepted}
              title="AI processing"
              body={
                <>
                  I consent to my health content (documents, vitals, medications,
                  symptoms, voice notes) being sent to{" "}
                  <strong className="text-foreground font-medium">Google Gemini</strong>{" "}and{" "}
                  <strong className="text-foreground font-medium">OpenAI</strong>{" "}
                  via the Lovable AI Gateway for AI features. Identifiers like
                  name, email, and ABHA ID are never sent.{" "}
                  <button
                    type="button"
                    onClick={() => setAiExpanded((v) => !v)}
                    className="text-primary font-medium inline-flex items-center gap-0.5 hover:underline"
                  >
                    {aiExpanded ? "Less" : "Learn more"}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        aiExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  {aiExpanded && (
                    <span className="block mt-2 text-xs text-muted-foreground/90 leading-relaxed">
                      Providers process this data over encrypted connections
                      and do not retain it for model training. You can withdraw
                      this consent any time in Settings — the rest of the app
                      keeps working. Full details in the{" "}
                      <LegalLink section="privacy">Privacy Policy</LegalLink>,
                      Section 7.
                    </span>
                  )}
                </>
              }
              isLast
            />
          </div>

          <p className="mt-5 text-center text-[11px] text-muted-foreground/80 px-6 leading-relaxed">
            Each consent is logged with a timestamp so you can see exactly what you agreed to.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-6">
          <Button
            onClick={handleAccept}
            variant="gradient"
            className="w-full h-13 py-3.5 text-base rounded-2xl"
            disabled={!canSubmit}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agree and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ConsentRow = ({
  id,
  checked,
  onChange,
  title,
  body,
  isFirst,
  isLast,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}) => (
  <div
    className={cn(
      "flex items-start gap-4 p-4 bg-card/50 transition-colors",
      !isLast && "border-b border-border/60",
      checked && "bg-primary/[0.04]"
    )}
  >
    <div className="flex-1 min-w-0">
      <label
        htmlFor={id}
        className="text-[15px] font-medium text-foreground leading-snug cursor-pointer block"
      >
        {title}
      </label>
      <div className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
        {body}
      </div>
    </div>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      className="mt-1 h-5 w-5 shrink-0 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
    />
  </div>
);

export default Welcome;
