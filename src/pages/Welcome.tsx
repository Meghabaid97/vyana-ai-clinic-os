import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Calendar, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LegalLink } from "@/components/LegalLink";


const POLICY_VERSION = "v1.0";

/**
 * Post-auth consent gate.
 *
 * ToS, Privacy Policy and DPDPA processing consent are captured implicitly
 * on the Auth screen ("By continuing you agree to..."). This screen only
 * enforces the two consents that must be on-screen and explicit:
 *  - 18+ age confirmation (DPDPA hard requirement, no minors)
 *  - AI processing disclosure (Apple 5.1.2(i): must name recipients and
 *    data on-screen, not just in the policy)
 */
const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [aiAccepted, setAiAccepted] = useState(false);
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
        types.has("dpdpa_data_processing") &&
        types.has("ai_processing");

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

  const canSubmit = ageConfirmed && aiAccepted && !submitting;

  const handleAccept = async () => {
    if (!userId || !canSubmit) return;
    setSubmitting(true);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      // ToS, Privacy and DPDPA are captured implicitly at sign-in
      // ("By continuing you agree to..."), but we log them here too so the
      // audit trail and the strict AppShell gate stay satisfied.
      const { error } = await supabase.from("consent_log").insert([
        {
          user_id: userId,
          consent_type: "age_18_confirmation",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "welcome", explicit: true },
        },
        {
          user_id: userId,
          consent_type: "terms_of_service",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "auth_continue", implicit: true },
        },
        {
          user_id: userId,
          consent_type: "privacy_policy",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "auth_continue", implicit: true },
        },
        {
          user_id: userId,
          consent_type: "dpdpa_data_processing",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: { source: "auth_continue", implicit: true },
        },
        {
          user_id: userId,
          consent_type: "ai_processing",
          policy_version: POLICY_VERSION,
          granted: true,
          user_agent: ua,
          context: {
            source: "welcome",
            explicit: true,
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
    <div className="min-h-[100svh] bg-background px-4 py-6 sm:py-12 safe-area-top safe-area-bottom">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-3">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">AI Features & Privacy Consent</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Two final checks before we store any health information.
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

          <div className="rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="ai" className="border-0">
                    <AccordionTrigger className="py-0 text-sm font-medium text-foreground leading-snug hover:no-underline [&>svg]:ml-2">
                      I consent to AI processing by the services below
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-3">
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        To generate briefings, interpret prescriptions, score risks, and analyze
                        trends, Vyana sends the specific health content you choose to process
                        (uploaded documents, vitals, medications, symptoms, voice notes) over
                        encrypted connections via the Lovable AI Gateway. Your name, email, phone,
                        ABHA ID, and account identifiers are never sent. Providers do not retain
                        the data for training. You can withdraw this any time from Settings. The rest of
                        the app keeps working.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="rounded-lg border border-border bg-muted/40 p-3">
                          <p className="font-medium text-foreground">Google LLC - Gemini</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Document understanding, briefings, risk scoring, trend analysis.
                          </p>
                        </li>
                        <li className="rounded-lg border border-border bg-muted/40 p-3">
                          <p className="font-medium text-foreground">OpenAI, L.L.C. - GPT</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Prescription interpretation, clinical reasoning, summaries.
                          </p>
                        </li>
                        <li className="rounded-lg border border-border bg-muted/40 p-3">
                          <p className="font-medium text-foreground">OpenAI, L.L.C. - Whisper</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Voice note transcription (only when you record one).
                          </p>
                        </li>
                      </ul>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-3">
                        None of these providers receive your name, email, phone, ABHA ID, or account
                        identifiers, and none retain your data for model training. Details in the{" "}
                        <LegalLink section="privacy">Privacy Policy</LegalLink>, Section 7.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  You can withdraw this any time from Settings.
                </p>
              </div>
              <label htmlFor="ai-processing" className="sr-only">
                I consent to AI processing
              </label>
              <Checkbox
                id="ai-processing"
                checked={aiAccepted}
                onCheckedChange={(v) => setAiAccepted(v === true)}
                className="mt-0.5 shrink-0"
              />
            </div>
          </div>

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
  title: React.ReactNode;
  body: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/30 transition-colors">
    <div className="shrink-0 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground leading-snug cursor-pointer block"
      >
        {title}
      </label>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
    </div>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      className="mt-0.5 shrink-0"
    />
  </div>
);

export default Welcome;
