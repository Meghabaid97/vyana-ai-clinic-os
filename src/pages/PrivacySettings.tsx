import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ShieldCheck, ArrowLeft } from "lucide-react";
import { LegalLink } from "@/components/LegalLink";

const POLICY_VERSION = "v1.0";

/**
 * Settings -> Privacy.
 *
 * Surfaces the AI processing consent so the user can review what they
 * agreed to and withdraw it at any time. Every flip writes a new row to
 * consent_log (granted: true/false). On the next app reload the strict
 * AppShell gate reads the LATEST row per consent_type, so withdrawing
 * here immediately blocks any further health processing until consent
 * is granted again.
 */
const PrivacySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [aiGranted, setAiGranted] = useState(false);
  const [grantedAt, setGrantedAt] = useState<string | null>(null);

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

      // Latest row per consent_type wins.
      const { data } = await supabase
        .from("consent_log")
        .select("consent_type, granted, created_at")
        .eq("user_id", session.user.id)
        .eq("consent_type", "ai_processing")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!mounted) return;
      const latest = data?.[0];
      setAiGranted(Boolean(latest?.granted));
      setGrantedAt(latest?.created_at ?? null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const handleToggle = async (next: boolean) => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const { error } = await supabase.from("consent_log").insert({
        user_id: userId,
        consent_type: "ai_processing",
        policy_version: POLICY_VERSION,
        granted: next,
        user_agent: ua,
        withdrawn_at: next ? null : new Date().toISOString(),
        context: {
          source: "settings_privacy",
          explicit: true,
          action: next ? "grant" : "withdraw",
        },
      });
      if (error) throw error;
      setAiGranted(next);
      setGrantedAt(new Date().toISOString());
      toast({
        title: next ? "AI processing enabled" : "AI processing withdrawn",
        description: next
          ? "Your future uploads can be analyzed for briefings and trends."
          : "Future AI processing is paused. You will be asked to re-confirm on your next launch.",
      });
    } catch (e: any) {
      toast({
        title: "Could not update consent",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60svh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="lg:hidden inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="mb-6">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mb-3">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-serif text-foreground">Privacy & Security</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review what you have agreed to and withdraw consent at any time.
        </p>
      </header>

      <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">AI processing</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {aiGranted ? "Currently enabled" : "Currently withdrawn"}
                  {grantedAt ? ` • last updated ${new Date(grantedAt).toLocaleString()}` : ""}
                </p>
              </div>
              <Switch
                checked={aiGranted}
                disabled={saving}
                onCheckedChange={handleToggle}
                aria-label="Toggle AI processing consent"
              />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Vyana uses secure endpoints from Google Gemini and OpenAI to extract and
              organize the medical documents you upload, build your health timeline, and
              generate clinical summaries. Content is transmitted over encrypted connections
              and your name, email, phone, ABHA ID, and account identifiers are stripped
              out. Providers are contractually prohibited from using your data to train
              their models.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-3">
              Withdrawing consent here stops all future AI processing immediately. The rest
              of the app keeps working. You will be asked to re-confirm on your next launch
              before any new health information can be stored. Details in the{" "}
              <LegalLink section="privacy">Privacy Policy</LegalLink>, Section 7.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <Button variant="outline" onClick={() => navigate("/app/profile")}>
          Back to profile
        </Button>
      </div>
    </div>
  );
};

export default PrivacySettings;
