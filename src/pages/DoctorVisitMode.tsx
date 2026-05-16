import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, AlertTriangle, Pill, Activity,
  Share2, Copy, CheckCircle2, ArrowUp, ArrowDown, Minus, MessageCircle, Mail,
  Stethoscope, ChevronLeft, Play, FileDown, FileText, QrCode, NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SAMPLE_BRIEFING, SAMPLE_PATIENT } from "@/lib/sampleBriefingData";
import { Change, computeChangesSinceLastVisit, SAMPLE_CHANGES } from "@/lib/changesSinceLastVisit";
import PageHero from "@/components/PageHero";
import { summarizeFreshness, symptomWindowStartIso, formatFreshDate, SYMPTOM_WINDOW_DAYS, type FreshnessSummary } from "@/lib/symptomFreshness";
import { buildEmergencyAccessUrl } from "@/lib/share-url";

interface DrugInteraction {
  drugs: string[];
  severity: string; // minor | moderate | severe | contraindicated
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
  recent_symptoms?: Array<{ symptom: string; frequency: string; avg_severity: string; pattern?: string }>;
  drug_interactions?: DrugInteractionReport;
}

/** Strip dosage/frequency tokens so the AI sees clean drug names. */
const extractDrugName = (raw: string): string => {
  return raw
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|units?)\b/gi, "")
    .replace(/\b(od|bd|tds|qid|hs|prn|sos|po|iv|im|sc|q\d+h|stat)\b/gi, "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/[\s,/+]/)[0];
};

const severityStyle = (sev: string) => {
  const s = sev.toLowerCase();
  if (s === "contraindicated" || s === "severe")
    return "border-destructive/40 bg-destructive/5 text-destructive";
  if (s === "moderate")
    return "border-yellow-500/40 bg-yellow-500/5 text-yellow-700";
  return "border-border bg-muted/40 text-muted-foreground";
};

const dirIcon = (d: string) => {
  if (d === "increasing") return <ArrowUp className="h-3 w-3 text-destructive" />;
  if (d === "decreasing") return <ArrowDown className="h-3 w-3 text-blue-500" />;
  if (d === "stable") return <Minus className="h-3 w-3 text-green-600" />;
  return <Activity className="h-3 w-3 text-yellow-500" />;
};

const sevBg = (s: Change["severity"]) =>
  s === "alert" ? "border-destructive/30 bg-destructive/5"
  : s === "monitor" ? "border-yellow-500/30 bg-yellow-500/5"
  : "border-border bg-card";

const DoctorVisitMode = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [patientName, setPatientName] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDialog, setQrDialog] = useState<{ url: string; dataUrl: string } | null>(null);
  const [sharing, setSharing] = useState<null | "whatsapp" | "email" | "qr" | "copylink">(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [symptomFreshness, setSymptomFreshness] = useState<FreshnessSummary | null>(null);

  const createShareLink = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in required", variant: "destructive" });
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
      recipient_name: null,
    }).select("token").single();
    if (error || !data) {
      toast({ title: "Could not create link", description: error?.message ?? "Unknown error", variant: "destructive" });
      return null;
    }
    return buildEmergencyAccessUrl(data.token);
  };
  // Auto-load demo via ?demo=1
  useEffect(() => {
    if (searchParams.get("demo") === "1") {
      setBriefing(SAMPLE_BRIEFING as unknown as Briefing);
      setChanges(SAMPLE_CHANGES);
      setPatientName(SAMPLE_PATIENT.name);
      setIsDemo(true);
    }
  }, [searchParams]);

  const loadDemo = () => {
    setBriefing(SAMPLE_BRIEFING as unknown as Briefing);
    setChanges(SAMPLE_CHANGES);
    setPatientName(SAMPLE_PATIENT.name);
    setIsDemo(true);
    setSearchParams({ demo: "1" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exitDemo = () => {
    setBriefing(null);
    setChanges([]);
    setIsDemo(false);
    setSearchParams({});
  };

  const generate = async () => {
    setLoading(true);
    setIsDemo(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: patient } = await supabase
        .from("patients").select("id, national_health_id, name, age")
        .eq("user_id", session.user.id).maybeSingle();

      if (!patient) {
        toast({ title: "Complete your profile first", variant: "destructive" });
        return;
      }
      setPatientName(patient.name || "");

      const ninetyDaysAgo = symptomWindowStartIso();
      const [consRes, recRes, vitRes, medRes, sympRes] = await Promise.all([
        patient.national_health_id
          ? supabase.from("consultations").select("*").eq("patient_national_health_id", patient.national_health_id).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("health_records").select("file_name, ai_summary, medications, uploaded_at").eq("patient_id", patient.id).order("uploaded_at", { ascending: false }).limit(20),
        supabase.from("vital_history").select("*").eq("patient_id", patient.id).order("recorded_at", { ascending: true }),
        supabase.from("medication_reminders").select("*").eq("patient_id", patient.id),
        supabase.from("symptom_logs").select("*").eq("patient_id", patient.id).gte("logged_at", ninetyDaysAgo).order("logged_at", { ascending: false }).limit(100),
      ]);

      setSymptomFreshness(summarizeFreshness((sympRes.data as any) || []));

      const { data, error } = await supabase.functions.invoke("clinical-briefing", {
        body: {
          patientHealthId: patient.national_health_id,
          consultations: consRes.data || [],
          healthRecordSummaries: recRes.data || [],
          vitalHistory: vitRes.data || [],
          medicationReminders: medRes.data || [],
          symptomLogs: sympRes.data || [],
        },
      });
      if (error) throw error;
      setBriefing(data);

      try {
        const ch = await computeChangesSinceLastVisit(patient.id);
        setChanges(ch.length ? ch : []);
      } catch { /* changes optional */ }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Visit generate error:", err);
      toast({ title: "Could not generate", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const briefingToText = (): string => {
    if (!briefing) return "";
    let t = `🏥 *My Doctor Visit Brief*\n\n`;
    if (patientName) t += `*Patient:* ${patientName}\n`;
    t += `*Overview:* ${briefing.patient_overview.summary}\n`;
    if (briefing.patient_overview.key_conditions.length) {
      t += `*Conditions:* ${briefing.patient_overview.key_conditions.join(", ")}\n`;
    }
    if (changes.length) {
      t += `\n🔔 *What changed since last visit:*\n`;
      changes.forEach(c => { t += `• ${c.label}: ${c.detail} (${c.when})\n`; });
    }
    if (briefing.red_flags.length) {
      t += `\n⚠️ *Flags:*\n`;
      briefing.red_flags.forEach(rf => { t += `• ${rf.flag}: ${rf.detail}\n`; });
    }
    const active = briefing.current_medications.filter(m => m.status === "active" || m.status === "recently_started");
    if (active.length) {
      t += `\n💊 *Current Medications:*\n`;
      active.forEach(m => { t += `• ${m.name}${m.note ? ` (${m.note})` : ""}\n`; });
    }
    if (briefing.recent_symptoms && briefing.recent_symptoms.length) {
      t += `\n📓 *Recent Symptoms (self-reported):*\n`;
      briefing.recent_symptoms.forEach(s => {
        t += `• ${s.symptom}: ${s.frequency}, avg ${s.avg_severity}${s.pattern ? ` (${s.pattern})` : ""}\n`;
      });
    }
    t += `\n_Generated by Vyana · ${new Date().toLocaleDateString("en-IN")}_`;
    t += `\n_AI summary. Please verify clinically._`;
    return t;
  };

  const shareWA = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(briefingToText())}`;
    window.open(url, "_blank");
  };
  const copy = async () => {
    await navigator.clipboard.writeText(briefingToText());
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };
  const downloadTxt = () => {
    const blob = new Blob([briefingToText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `doctor-brief-${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const shareMessage = (url: string) =>
    `${briefingToText()}\n\nView my full secure record (valid 24 hours):\n${url}`;

  const shareViaWhatsAppLink = async () => {
    if (sharing) return;
    setSharing("whatsapp");
    try {
      const url = await createShareLink();
      if (!url) return;
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(url))}`, "_blank", "noopener,noreferrer");
    } finally { setSharing(null); }
  };

  const shareViaEmail = async () => {
    if (sharing) return;
    setSharing("email");
    try {
      const url = await createShareLink();
      if (!url) return;
      const subject = encodeURIComponent("My health briefing from Vyana");
      const body = encodeURIComponent(shareMessage(url));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } finally { setSharing(null); }
  };

  const shareViaQr = async () => {
    if (sharing) return;
    setSharing("qr");
    try {
      const url = await createShareLink();
      if (!url) return;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 480, margin: 1, errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrDialog({ url, dataUrl });
    } catch {
      toast({ title: "Could not generate QR", variant: "destructive" });
    } finally { setSharing(null); }
  };

  const copyShareLink = async () => {
    if (sharing) return;
    setSharing("copylink");
    try {
      const url = await createShareLink();
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast({ title: "Secure link copied" });
    } finally { setSharing(null); }
  };

  const activeMeds = briefing?.current_medications.filter(m => m.status !== "stopped") ?? [];

  return (
    <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-8 space-y-4">
      {/* Hero — shared with Records, Trends */}
      <PageHero
        icon={Stethoscope}
        eyebrow="Doctor Visit Mode"
        title={briefing ? "Your visit brief is ready" : "Get ready in 30 seconds"}
        subtitle={
          briefing
            ? "Share the one-page brief with your doctor before you walk in."
            : "Generate a one-page summary your doctor can read in under a minute."
        }
        action={
          briefing ? (
            <Button size="sm" onClick={() => setShareDialogOpen(true)} disabled={isDemo} className="h-9 px-3 text-[12px] gap-1.5" title={isDemo ? "Sharing isn't available for sample data" : "Share with your doctor"}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          ) : undefined
        }
      />


      {/* HERO CTA when no brief */}
      {!briefing && (
        <section>
          <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-foreground">
              Walk in <span className="text-primary">prepared.</span>
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed max-w-[40ch]">
              One scrollable sheet your doctor can read in under a minute. Conditions, what changed, medications, ready to share.
            </p>

            <Button onClick={generate} disabled={loading} size="lg" className="mt-5 w-full gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your brief...</>
                       : <><Sparkles className="h-4 w-4" /> Generate my visit brief</>}
            </Button>
            <button
              onClick={loadDemo}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              Or preview with sample data
            </button>
          </div>

          {/* What you get */}
          <div className="mt-5 space-y-2">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground px-1">What you get</p>
            {[
              { icon: Activity, t: "Overview & conditions", s: "A 2-line summary any doctor can scan" },
              { icon: AlertTriangle, t: "What changed since last visit", s: "Vitals and meds that moved" },
              { icon: Pill, t: "Current medications", s: "Active list, dosages, recent additions" },
              { icon: NotebookPen, t: "Recent symptoms from your journal", s: "Frequency, severity, patterns the doctor should hear" },
              { icon: Share2, t: "One-tap share", s: "WhatsApp, copy, or download" },
            ].map(({ icon: I, t, s }) => (
              <div key={t} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <I className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-tight">{t}</p>
                  <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* THE VISIT SHEET */}
      {briefing && (
        <>
          {isDemo && (
            <section className="pt-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <Play className="h-3.5 w-3.5 text-yellow-700 mt-0.5 shrink-0 fill-current" />
                  <p className="text-[12px] text-foreground leading-snug">
                    <span className="font-semibold">Demo brief</span>. Sample patient (Ramesh, 58, T2 diabetic).
                  </p>
                </div>
                <Button onClick={exitDemo} variant="outline" size="sm" className="shrink-0 h-7 text-[11px]">Exit demo</Button>
              </div>
            </section>
          )}

          {/* Patient strip */}
          <section className="pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Patient</p>
                <p className="text-[15px] font-bold text-foreground leading-tight mt-0.5">{patientName || "You"}</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </section>

          {/* 1. Overview */}
          <section className="pb-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
                <h3 className="text-[13px] font-bold text-foreground">Overview</h3>
              </div>
              <p className="text-[13.5px] text-foreground leading-relaxed">{briefing.patient_overview.summary}</p>
              {briefing.patient_overview.key_conditions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {briefing.patient_overview.key_conditions.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[11px]">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 2. What changed */}
          <section className="pb-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">2</span>
                <h3 className="text-[13px] font-bold text-foreground">What changed since last visit</h3>
              </div>
              {changes.length === 0 ? (
                <p className="text-[12px] text-muted-foreground leading-snug">
                  No notable changes detected. We will surface deltas once you log another report.
                </p>
              ) : (
                <div className="space-y-2">
                  {changes.map((c, i) => (
                    <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${sevBg(c.severity)}`}>
                      <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
                        {c.kind === "vital_up" ? <ArrowUp className="h-3.5 w-3.5 text-destructive" />
                          : c.kind === "vital_down" ? <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
                          : c.kind === "new_med" ? <Pill className="h-3.5 w-3.5 text-primary" />
                          : <Activity className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground leading-tight">{c.label}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{c.detail}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">{c.when}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 3. Medications */}
          <section className="pb-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">3</span>
                <h3 className="text-[13px] font-bold text-foreground">Current medications</h3>
              </div>
              {activeMeds.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No active medications on file.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeMeds.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <span className={`h-2 w-2 rounded-full ${m.status === "recently_started" ? "bg-blue-500" : "bg-green-500"}`} />
                      <span className="text-[13px] text-foreground flex-1 min-w-0 truncate">{m.name}</span>
                      {m.status === "recently_started" && (
                        <Badge variant="outline" className="text-[9px]">new</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Recent symptoms (from health journal) */}
          {briefing.recent_symptoms && briefing.recent_symptoms.length > 0 && (
            <section className="pb-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">4</span>
                  <h3 className="text-[13px] font-bold text-foreground">Recent symptoms</h3>
                  <Badge variant="outline" className="text-[9px] ml-auto">self-reported · {SYMPTOM_WINDOW_DAYS}d</Badge>
                </div>
                <div className="ml-7 mb-3 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] text-muted-foreground">From your health journal</p>
                  {symptomFreshness && !isDemo && (
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md border ${symptomFreshness.isStale ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : "border-border bg-muted/40 text-muted-foreground"}`}>
                      {symptomFreshness.label}{symptomFreshness.latestAt ? ` · last: ${formatFreshDate(symptomFreshness.latestAt)}` : ""}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {briefing.recent_symptoms.map((s, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <NotebookPen className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-[13px] font-medium text-foreground capitalize truncate">{s.symptom}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{s.frequency} · {s.avg_severity}</span>
                      </div>
                      {s.pattern && <p className="text-[11px] text-muted-foreground mt-1 ml-5">{s.pattern}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SOAP Note */}
          {briefing.soap_note && (
            <section className="pb-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-[13px] font-bold text-foreground">SOAP Note</h3>
                  <span className="text-[10px] text-muted-foreground">Clinical summary</span>
                </div>
                <div className="space-y-3">
                  {[
                    { letter: "S", label: "Subjective", value: briefing.soap_note.subjective },
                    { letter: "O", label: "Objective", value: briefing.soap_note.objective },
                    { letter: "A", label: "Assessment", value: briefing.soap_note.assessment },
                    { letter: "P", label: "Plan", value: briefing.soap_note.plan },
                  ]
                    .filter((s) => s.value && s.value.trim() && s.value.trim().toUpperCase() !== "N/A")
                    .map((s) => (
                      <div key={s.letter} className="flex gap-3">
                        <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                          {s.letter}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                          <p className="text-[13px] text-foreground leading-relaxed mt-0.5">{s.value}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Flags (if any) */}
          {briefing.red_flags.length > 0 && (
            <section className="pb-3">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="text-[13px] font-bold text-destructive">Flag for the doctor</h3>
                </div>
                <div className="space-y-2">
                  {briefing.red_flags.map((rf, i) => (
                    <div key={i} className="rounded-lg bg-background/60 border border-destructive/20 p-3">
                      <p className="text-[13px] font-medium text-foreground">{rf.flag}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{rf.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Regenerate */}
          <section className="pt-2 pb-6">
            <p className="text-[10.5px] text-muted-foreground leading-snug text-center px-4">
              AI generated summary for clinical discussion. Always defer to your doctor for medical decisions.
            </p>
            <Button
              onClick={generate}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="mt-3 w-full text-[12px] gap-1.5 text-muted-foreground"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Regenerate from latest data
            </Button>
          </section>
        </>
      )}

      {/* Share options popup */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share with your doctor</DialogTitle>
            <DialogDescription className="text-[12px]">
              Choose how you'd like to share your visit brief. Links expire in 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              disabled={!!sharing}
              onClick={async () => { setShareDialogOpen(false); await shareViaWhatsAppLink(); }}
              className="h-20 flex-col gap-1.5 text-[11px] font-medium"
            >
              {sharing === "whatsapp" ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5 text-primary" />}
              WhatsApp
            </Button>
            <Button
              variant="outline"
              disabled={!!sharing}
              onClick={async () => { setShareDialogOpen(false); await shareViaEmail(); }}
              className="h-20 flex-col gap-1.5 text-[11px] font-medium"
            >
              {sharing === "email" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5 text-primary" />}
              Email
            </Button>
            <Button
              variant="outline"
              disabled={!!sharing}
              onClick={async () => { setShareDialogOpen(false); await shareViaQr(); }}
              className="h-20 flex-col gap-1.5 text-[11px] font-medium"
            >
              {sharing === "qr" ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5 text-primary" />}
              QR code
            </Button>
            <Button
              variant="outline"
              disabled={!!sharing}
              onClick={async () => { setShareDialogOpen(false); await copyShareLink(); }}
              className="h-20 flex-col gap-1.5 text-[11px] font-medium"
            >
              {sharing === "copylink" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Copy className="h-5 w-5 text-primary" />}
              Copy link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR dialog — shown after a secure link is created */}
      <Dialog open={!!qrDialog} onOpenChange={(o) => !o && setQrDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan to open</DialogTitle>
            <DialogDescription>
              Have the doctor scan this code with their phone camera. Link expires in 24 hours.
            </DialogDescription>
          </DialogHeader>
          {qrDialog && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl border border-border bg-white p-3">
                <img src={qrDialog.dataUrl} alt="QR code" className="h-56 w-56" />
              </div>
              <p className="text-[12px] text-muted-foreground text-center break-all px-4">
                {qrDialog.url}
              </p>
              <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(qrDialog.url); toast({ title: "Secure link copied" }); }}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorVisitMode;
