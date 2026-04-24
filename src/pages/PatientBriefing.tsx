import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, AlertTriangle, TrendingUp, Pill, FileText,
  Share2, Copy, CheckCircle2, Heart, Brain, Stethoscope,
  ArrowUp, ArrowDown, Minus, Activity, Play, QrCode, NotebookPen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatefulButton, ButtonState } from "@/components/ui/stateful-button";
import { BriefingResultSkeleton } from "@/components/ui/page-skeletons";
import { SAMPLE_BRIEFING } from "@/lib/sampleBriefingData";
import ShareCeremonySheet from "@/components/ShareCeremonySheet";

interface Briefing {
  patient_overview: { key_conditions: string[]; summary: string };
  key_trends: Array<{ vital: string; direction: string; detail: string; concern_level: string }>;
  current_medications: Array<{ name: string; status: string; note?: string }>;
  red_flags: Array<{ flag: string; severity: string; detail: string }>;
  recent_changes: string[];
  soap_note: { subjective: string; objective: string; assessment: string; plan: string };
  medication_correlations: Array<{ observation: string; confidence: string; supporting_data: string }>;
  recent_symptoms?: Array<{ symptom: string; frequency: string; avg_severity: string; pattern?: string }>;
  disclaimer?: string;
}

const PatientBriefing = () => {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<ButtonState>("idle");
  const [isDemo, setIsDemo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const { toast } = useToast();

  const createShareLink = async (recipientName: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in required", description: "Please sign in to share your briefing.", variant: "destructive" });
      return null;
    }
    const { data: patient } = await supabase
      .from("patients").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!patient) {
      toast({ title: "Profile missing", description: "Complete your profile first.", variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase.from("shared_record_links").insert({
      patient_id: patient.id,
      recipient_name: recipientName || null,
    }).select().single() as { data: { token: string } | null; error: { message: string } | null };
    if (error || !data) {
      toast({ title: "Could not create link", description: error?.message ?? "Unknown error", variant: "destructive" });
      return null;
    }
    return `${window.location.origin}/emergency-access/${data.token}`;
  };

  // Honour ?demo=1 deep link from home "Try sample data"
  useEffect(() => {
    if (searchParams.get("demo") === "1" && !briefing) {
      setBriefing(SAMPLE_BRIEFING as unknown as Briefing);
      setIsDemo(true);
    }
  }, [searchParams, briefing]);

  const loadDemo = () => {
    setBriefing(SAMPLE_BRIEFING as unknown as Briefing);
    setIsDemo(true);
    setSearchParams({ demo: "1" });
  };

  const clearDemo = () => {
    setBriefing(null);
    setIsDemo(false);
    setSearchParams({});
  };

  const generateBriefing = async () => {
    setIsDemo(false);
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: patient } = await supabase
        .from("patients")
        .select("id, national_health_id, name, age")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!patient) {
        toast({ title: "Complete your profile first", variant: "destructive" });
        return;
      }

      // Fetch all patient data in parallel — incl. last 90 days of symptom journal
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const [consultationsRes, recordsRes, vitalsRes, medsRes, symptomsRes] = await Promise.all([
        patient.national_health_id
          ? supabase.from("consultations").select("*").eq("patient_national_health_id", patient.national_health_id).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
        supabase.from("health_records").select("file_name, ai_summary, medications, uploaded_at").eq("patient_id", patient.id).order("uploaded_at", { ascending: false }).limit(20),
        supabase.from("vital_history").select("*").eq("patient_id", patient.id).order("recorded_at", { ascending: true }),
        supabase.from("medication_reminders").select("*").eq("patient_id", patient.id),
        supabase.from("symptom_logs").select("*").eq("patient_id", patient.id).gte("logged_at", ninetyDaysAgo).order("logged_at", { ascending: false }).limit(100),
      ]);

      const { data, error } = await supabase.functions.invoke("clinical-briefing", {
        body: {
          patientHealthId: patient.national_health_id,
          consultations: consultationsRes.data || [],
          healthRecordSummaries: recordsRes.data || [],
          vitalHistory: vitalsRes.data || [],
          medicationReminders: medsRes.data || [],
          symptomLogs: symptomsRes.data || [],
        },
      });

      if (error) throw error;
      setBriefing(data);
    } catch (err: any) {
      console.error("Briefing error:", err);
      toast({ title: "Error", description: "Failed to generate briefing", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const briefingToText = (): string => {
    if (!briefing) return "";
    let text = `🏥 *My Health Briefing*\n\n`;
    text += `*Overview:* ${briefing.patient_overview.summary}\n`;
    if (briefing.patient_overview.key_conditions.length > 0) {
      text += `*Conditions:* ${briefing.patient_overview.key_conditions.join(", ")}\n`;
    }
    if (briefing.red_flags.length > 0) {
      text += `\n⚠️ *Flags:*\n`;
      briefing.red_flags.forEach(rf => { text += `• ${rf.flag}: ${rf.detail}\n`; });
    }
    if (briefing.current_medications.length > 0) {
      text += `\n💊 *Current Medications:*\n`;
      briefing.current_medications.filter(m => m.status === "active").forEach(m => {
        text += `• ${m.name}${m.note ? `, ${m.note}` : ""}\n`;
      });
    }
    if (briefing.key_trends.length > 0) {
      text += `\n📊 *Key Trends:*\n`;
      briefing.key_trends.forEach(t => { text += `• ${t.vital}: ${t.direction}, ${t.detail}\n`; });
    }
    if (briefing.recent_symptoms && briefing.recent_symptoms.length > 0) {
      text += `\n📓 *Recent Symptoms (self-reported):*\n`;
      briefing.recent_symptoms.forEach(s => {
        text += `• ${s.symptom} — ${s.frequency}, avg ${s.avg_severity}${s.pattern ? ` (${s.pattern})` : ""}\n`;
      });
    }
    text += `\n_Generated by Vyana · ${new Date().toLocaleDateString("en-IN")}_`;
    text += `\n_AI-generated summary. Please verify clinically._`;
    return text;
  };

  const shareViaWhatsApp = () => {
    if (shareState !== "idle") return;
    setShareState("loading");
    const text = briefingToText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    // Brief "preparing" beat so the AI summary feels assembled, not instant.
    setTimeout(() => {
      window.open(url, "_blank");
      setShareState("success");
      setTimeout(() => setShareState("idle"), 2000);
    }, 500);
  };

  const copyToClipboard = async () => {
    const text = briefingToText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const dirIcon = (d: string) => {
    if (d === "increasing") return <ArrowUp className="h-3 w-3 text-destructive" />;
    if (d === "decreasing") return <ArrowDown className="h-3 w-3 text-blue-500" />;
    if (d === "stable") return <Minus className="h-3 w-3 text-green-600" />;
    return <Activity className="h-3 w-3 text-yellow-500" />;
  };

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
          My Briefing
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          Generate your clinical summary to share with any doctor, instantly.
        </p>
      </section>

      {/* Generate button */}
      {!briefing && (
        <section className="px-5 pb-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Doctor-Ready Summary</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              AI analyzes your records, vitals, and medications to create a summary any doctor can read in 30 seconds.
            </p>
            <div className="text-left max-w-xs mx-auto mb-5 rounded-lg bg-background/60 border border-border p-3">
              <p className="text-[12px] font-semibold text-foreground mb-2">Your summary will include:</p>
              <ul className="space-y-1.5">
                {[
                  "Conditions & diagnoses",
                  "Medications history",
                  "Key vitals & trends",
                  "Recent symptoms from your journal",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
              <Button
                onClick={generateBriefing}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate My Briefing</>
                )}
              </Button>
              <button
                onClick={loadDemo}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                Or preview with sample data
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Demo banner */}
      {briefing && isDemo && (
        <section className="px-5 pb-3">
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <Play className="h-3.5 w-3.5 text-yellow-700 mt-0.5 shrink-0 fill-current" />
              <p className="text-[12px] text-foreground leading-snug">
                <span className="font-semibold">Demo data</span>, sample patient (Ramesh, 58, T2 diabetic). Generate yours from real records.
              </p>
            </div>
            <Button onClick={clearDemo} variant="outline" size="sm" className="shrink-0 h-7 text-[11px]">
              Exit demo
            </Button>
          </div>
        </section>
      )}

      {/* Loading state — skeleton mirrors the result layout to avoid jank on swap */}
      {isLoading && !briefing && (
        <>
          <section className="px-5 pb-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <p className="text-[12px] text-foreground leading-snug">
                <span className="font-semibold">Generating your briefing.</span>{" "}
                Analyzing records, vitals, and medications…
              </p>
            </div>
          </section>
          <BriefingResultSkeleton />
        </>
      )}

      {/* Briefing display */}
      {briefing && (
        <>
          {/* Share actions */}
          <section className="px-5 pb-4">
            <div className="flex gap-2">
              <StatefulButton
                state={shareState}
                onClick={shareViaWhatsApp}
                variant="outline"
                className="flex-1"
                loadingLabel="Preparing…"
                successLabel="Opened WhatsApp"
                errorLabel="Try again"
                idleIcon={<Share2 className="h-4 w-4" />}
              >
                Share via WhatsApp
              </StatefulButton>
              <Button
                onClick={() => setShareSheetOpen(true)}
                variant="outline"
                className="gap-1.5"
                aria-label="Show QR for doctor to scan"
                disabled={isDemo}
                title={isDemo ? "QR sharing isn't available for sample data" : "Show QR"}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              <Button onClick={copyToClipboard} variant="outline" className="gap-2" aria-label="Copy briefing">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={generateBriefing} variant="outline" size="icon" disabled={isLoading} aria-label="Regenerate briefing">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
          </section>

          {/* Overview */}
          <section className="px-5 pb-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-bold text-foreground">Overview</h3>
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">{briefing.patient_overview.summary}</p>
              {briefing.patient_overview.key_conditions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {briefing.patient_overview.key_conditions.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[11px]">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Red flags */}
          {briefing.red_flags.length > 0 && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="text-[14px] font-bold text-destructive">Flags for Doctor</h3>
                </div>
                <div className="space-y-2">
                  {briefing.red_flags.map((rf, i) => (
                    <div key={i} className={`rounded-lg p-3 ${rf.severity === "critical" ? "bg-destructive/10 border border-destructive/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
                      <p className="text-[13px] font-medium text-foreground">{rf.flag}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{rf.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Medications */}
          {briefing.current_medications.length > 0 && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">Medications</h3>
                </div>
                <div className="space-y-1.5">
                  {briefing.current_medications.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <span className={`h-2 w-2 rounded-full ${m.status === "active" ? "bg-green-500" : m.status === "recently_started" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                      <span className="text-[13px] text-foreground flex-1">{m.name}</span>
                      <Badge variant="outline" className="text-[9px]">{m.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Trends */}
          {briefing.key_trends.length > 0 && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">Key Trends</h3>
                </div>
                <div className="space-y-2">
                  {briefing.key_trends.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      {dirIcon(t.direction)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{t.vital}</span>
                          {t.concern_level === "action_needed" && (
                            <Badge variant="destructive" className="text-[9px]">action needed</Badge>
                          )}
                          {t.concern_level === "monitor" && (
                            <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-600">monitor</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent symptoms (from health journal) */}
          {briefing.recent_symptoms && briefing.recent_symptoms.length > 0 && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <NotebookPen className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">Recent Symptoms</h3>
                  <Badge variant="outline" className="text-[9px] ml-auto">self-reported · 90d</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">From your health journal</p>
                <div className="space-y-2">
                  {briefing.recent_symptoms.map((s, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-foreground capitalize">{s.symptom}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{s.frequency} · {s.avg_severity}</span>
                      </div>
                      {s.pattern && <p className="text-[11px] text-muted-foreground mt-1">{s.pattern}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent changes */}
          {briefing.recent_changes.length > 0 && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">Recent Changes</h3>
                </div>
                <ul className="space-y-1">
                  {briefing.recent_changes.map((c, i) => (
                    <li key={i} className="text-[12px] text-foreground flex gap-2 items-start">
                      <span className="text-primary mt-0.5">•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* SOAP Note */}
          {briefing.soap_note && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">SOAP Note</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "S, Subjective", value: briefing.soap_note.subjective },
                    { label: "O, Objective", value: briefing.soap_note.objective },
                    { label: "A, Assessment", value: briefing.soap_note.assessment },
                    { label: "P, Plan", value: briefing.soap_note.plan },
                  ]
                    .filter((s) => s.value && s.value.trim() && s.value.trim().toUpperCase() !== "N/A")
                    .map((s, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{s.label}</p>
                        <p className="text-[12px] text-foreground leading-relaxed">{s.value}</p>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Medication correlations */}
          {briefing.medication_correlations.length > 0 && (
            <section className="px-5 pb-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">Medication-Lab Correlations</h3>
                </div>
                <div className="space-y-2">
                  {briefing.medication_correlations.map((c, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[12px] font-medium text-foreground flex-1">{c.observation}</p>
                        <Badge variant="outline" className={`text-[9px] ${c.confidence === "high" ? "border-green-500/30 text-green-600" : c.confidence === "medium" ? "border-yellow-500/30 text-yellow-600" : ""}`}>
                          {c.confidence}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.supporting_data}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Disclaimer */}
          {briefing.disclaimer && (
            <section className="px-5 pb-8">
              <p className="text-[10px] text-muted-foreground italic text-center">{briefing.disclaimer}</p>
            </section>
          )}
        </>
      )}

      <ShareCeremonySheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        onCreate={createShareLink}
      />
    </div>
  );
};

export default PatientBriefing;
