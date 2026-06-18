import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Sparkles, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Pill, FileText, ChevronDown, ChevronUp, Activity, ShieldAlert, Lock,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PaywallSheet } from "@/components/paywall/PaywallSheet";
import { logEvent } from "@/lib/analytics";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import MedicalAckDialog, { useMedicalAck } from "@/components/MedicalAckDialog";

interface ClinicalBriefingProps {
  consultations: Array<{
    id: string;
    fhir_data: string;
    audio_transcription: string;
    created_at: string;
    patient_name: string;
    patient_age: number;
  }>;
  patientHealthId: string;
  patientId: string;

}

interface DrugInteraction {
  drugs: string[];
  severity: string;
  description: string;
  recommendation?: string;
}

interface DrugInteractionReport {
  overallRisk?: string;
  interactions: DrugInteraction[];
  safetyNotes?: string[];
}

interface Briefing {
  patient_overview: { key_conditions: string[]; summary: string };
  key_trends: Array<{ vital: string; direction: string; detail: string; concern_level: string }>;
  current_medications: Array<{ name: string; status: string; note?: string }>;
  red_flags: Array<{ flag: string; severity: string; detail: string }>;
  recent_changes: string[];
  soap_note: { subjective: string; objective: string; assessment: string; plan: string };
  medication_correlations: Array<{ observation: string; confidence: string; supporting_data: string }>;
  drug_interactions?: DrugInteractionReport;
  disclaimer?: string;
}

const extractDrugName = (full: string) =>
  full.replace(/\d+\s?(mg|mcg|g|ml|iu|units?)\b.*$/i, "").replace(/\s+(od|bd|tds|qid|hs|sos|prn|qd|qhs)\b.*$/i, "").trim();

const severityStyle = (sev: string) => {
  const s = sev?.toLowerCase();
  if (s === "contraindicated" || s === "severe") return "bg-destructive/10 text-destructive border-destructive/30";
  if (s === "moderate") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const directionIcon = (dir: string) => {
  if (dir === "increasing") return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
  if (dir === "decreasing") return <TrendingDown className="h-3.5 w-3.5 text-blue-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const concernColor = (level: string) => {
  if (level === "action_needed") return "bg-destructive/10 text-destructive border-destructive/20";
  if (level === "monitor") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
  return "bg-green-500/10 text-green-700 border-green-500/20";
};

const ClinicalBriefing = ({ consultations, patientHealthId, patientId }: ClinicalBriefingProps) => {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [soapOpen, setSoapOpen] = useState(false);
  const [correlationsOpen, setCorrelationsOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { toast } = useToast();
  const ent = useEntitlements();

  const generateBriefing = async () => {
    // Wait for entitlements to load before allowing generation
    if (ent.loading) {
      toast({ title: "Checking your plan...", description: "One sec." });
      return;
    }
    // Gate: free users get 1 briefing lifetime
    if (!ent.is_pro && (ent.briefings_remaining ?? 0) <= 0) {
      void logEvent("paywall_triggered", { reason: "briefing", surface: "inline" }, patientId);
      setPaywallOpen(true);
      return;
    }
    setIsLoading(true);
    setBriefing(null);
    try {
      const { data, error } = await supabase.functions.invoke("clinical-briefing", {
        body: {
          patientId,
          patientHealthId,
          consultations: consultations.map(c => ({
            fhir_data: c.fhir_data,
            audio_transcription: c.audio_transcription,
            created_at: c.created_at,
          })),
        },
      });
      if (error) {
        // Server-side plan gate: open the paywall if the function refused with 402.
        const ctx: any = (error as any)?.context;
        let bodyJson: any = null;
        try {
          if (ctx?.body && typeof ctx.body === "string") bodyJson = JSON.parse(ctx.body);
          else if (typeof ctx?.json === "function") bodyJson = await ctx.json();
        } catch { /* ignore */ }
        const status = ctx?.status ?? ctx?.response?.status;
        if (status === 402 || bodyJson?.error === "PLAN_LIMIT_REACHED") {
          setPaywallOpen(true);
          await ent.refresh();
          return;
        }
        throw error;
      }
      setBriefing(data);
      void logEvent("briefing_generated", { surface: "inline" }, patientId);

      // Usage is incremented server-side; just refresh local entitlements.
      await ent.refresh();

      // Cross-check current medications for drug-to-drug interactions
      const meds = (data?.current_medications ?? [])
        .filter((m: any) => m.status === "active" || m.status === "recently_started")
        .map((m: any) => extractDrugName(m.name))
        .filter(Boolean);
      if (meds.length >= 2) {
        try {
          const { data: dx } = await supabase.functions.invoke("check-drug-interactions", {
            body: { medications: meds },
          });
          if (dx && Array.isArray(dx.interactions) && dx.interactions.length > 0) {
            setBriefing((prev) => prev ? { ...prev, drug_interactions: dx } : prev);
          }
        } catch (e) {
          console.warn("Drug interaction check failed:", e);
        }
      }
    } catch (err: any) {
      console.error("Briefing error:", err);
      toast({ title: "Error", description: "Failed to generate clinical briefing", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const outOfBriefings = !ent.is_pro && (ent.briefings_remaining ?? 0) <= 0;

  if (!briefing && !isLoading) {
    return (
      <>
      <Card className="p-5 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {outOfBriefings ? <Lock className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">30-Second Clinical Briefing</h3>
            <p className="text-xs text-muted-foreground">
              {outOfBriefings
                ? "Free includes 1 briefing per month. Upgrade for unlimited."
                : !ent.is_pro
                  ? `Free: ${ent.briefings_remaining ?? 0} briefing left this month`
                  : "AI-generated patient summary with SOAP notes, trends & red flags"}
            </p>
          </div>
        </div>
        <Button onClick={generateBriefing} className="w-full gap-2" size="sm">
          {outOfBriefings ? <><Lock className="h-4 w-4" /> Unlock briefing · ₹99/mo</> : <><Sparkles className="h-4 w-4" /> Generate Briefing</>}
        </Button>
      </Card>
      <PaywallSheet
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="briefing"
        onSuccess={() => ent.refresh()}
      />
      </>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating clinical briefing...</p>
      </Card>
    );
  }

  if (!briefing) return null;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Clinical Briefing
        </h3>
        <Button variant="ghost" size="sm" onClick={generateBriefing} className="text-xs gap-1">
          <Activity className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <MedicalDisclaimer />

      {/* Patient Overview */}

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-sm text-foreground">{briefing.patient_overview.summary}</p>
        {briefing.patient_overview.key_conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {briefing.patient_overview.key_conditions.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Red Flags */}
      {briefing.red_flags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Red Flags
          </p>
          {briefing.red_flags.map((rf, i) => (
            <div key={i} className={`rounded-lg p-3 border ${rf.severity === "critical" ? "bg-destructive/10 border-destructive/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
              <p className="text-sm font-medium">{rf.flag}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rf.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Key Trends */}
      {briefing.key_trends.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Trends</p>
          {briefing.key_trends.map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border p-3">
              {directionIcon(t.direction)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.vital}</span>
                  <Badge variant="outline" className={`text-[10px] ${concernColor(t.concern_level)}`}>
                    {t.direction}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Medications */}
      {briefing.current_medications.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Pill className="h-3 w-3" /> Medications
          </p>
          <div className="flex flex-wrap gap-1.5">
            {briefing.current_medications.map((m, i) => (
              <Badge key={i} variant="outline" className={`text-xs ${m.status === "active" ? "border-green-500/30 text-green-700" : m.status === "recently_started" ? "border-blue-500/30 text-blue-700" : "border-muted text-muted-foreground"}`}>
                {m.name} {m.status !== "active" && `(${m.status.replace("_", " ")})`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Drug Interaction Flags */}
      {briefing.drug_interactions && briefing.drug_interactions.interactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 text-destructive">
            <ShieldAlert className="h-3 w-3" /> Drug Interaction Flags
            {briefing.drug_interactions.overallRisk && (
              <Badge variant="outline" className={`ml-1 text-[10px] ${severityStyle(briefing.drug_interactions.overallRisk)}`}>
                {briefing.drug_interactions.overallRisk} risk
              </Badge>
            )}
          </p>
          {briefing.drug_interactions.interactions.map((it, i) => (
            <div key={i} className={`rounded-lg p-3 border ${severityStyle(it.severity)}`}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold">{it.drugs.join(" + ")}</p>
                <Badge variant="outline" className={`text-[10px] ${severityStyle(it.severity)}`}>{it.severity}</Badge>
              </div>
              <p className="text-xs text-foreground/80">{it.description}</p>
              {it.recommendation && (
                <p className="text-xs mt-1 text-muted-foreground"><span className="font-medium">Action:</span> {it.recommendation}</p>
              )}
            </div>
          ))}
          {briefing.drug_interactions.safetyNotes?.map((n, i) => (
            <p key={`sn-${i}`} className="text-xs text-muted-foreground italic">• {n}</p>
          ))}
        </div>
      )}


      {briefing.recent_changes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recent Changes</p>
          <ul className="space-y-1">
            {briefing.recent_changes.map((ch, i) => (
              <li key={i} className="text-xs text-foreground flex gap-1.5">
                <span className="text-primary">•</span> {ch}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SOAP Note (collapsible) */}
      <Collapsible open={soapOpen} onOpenChange={setSoapOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> SOAP Note</span>
            {soapOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
            <div><span className="font-semibold text-foreground">S:</span> <span className="text-muted-foreground">{briefing.soap_note.subjective}</span></div>
            <div><span className="font-semibold text-foreground">O:</span> <span className="text-muted-foreground">{briefing.soap_note.objective}</span></div>
            <div><span className="font-semibold text-foreground">A:</span> <span className="text-muted-foreground">{briefing.soap_note.assessment}</span></div>
            <div><span className="font-semibold text-foreground">P:</span> <span className="text-muted-foreground">{briefing.soap_note.plan}</span></div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Medication Correlations (collapsible) */}
      {briefing.medication_correlations.length > 0 && (
        <Collapsible open={correlationsOpen} onOpenChange={setCorrelationsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Med-Lab Correlations</span>
              {correlationsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2">
              {briefing.medication_correlations.map((mc, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground flex-1">{mc.observation}</p>
                    <Badge variant="outline" className={`text-[10px] ${mc.confidence === "high" ? "border-green-500/30 text-green-700" : mc.confidence === "medium" ? "border-yellow-500/30 text-yellow-700" : "border-muted"}`}>
                      {mc.confidence}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{mc.supporting_data}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {briefing.disclaimer && (
        <p className="text-[10px] text-muted-foreground italic border-t border-border pt-2">{briefing.disclaimer}</p>
      )}
    </Card>
  );
};

export default ClinicalBriefing;
