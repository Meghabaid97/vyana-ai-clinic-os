import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, AlertTriangle, Pill, Activity,
  Share2, Copy, CheckCircle2, ArrowUp, ArrowDown, Minus,
  Stethoscope, ChevronLeft, Play, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_BRIEFING, SAMPLE_PATIENT } from "@/lib/sampleBriefingData";
import { Change, computeChangesSinceLastVisit, SAMPLE_CHANGES } from "@/lib/changesSinceLastVisit";

interface Briefing {
  patient_overview: { key_conditions: string[]; summary: string };
  key_trends: Array<{ vital: string; direction: string; detail: string; concern_level: string }>;
  current_medications: Array<{ name: string; status: string; note?: string }>;
  red_flags: Array<{ flag: string; severity: string; detail: string }>;
  recent_changes: string[];
  soap_note: { subjective: string; objective: string; assessment: string; plan: string };
  medication_correlations: Array<{ observation: string; confidence: string; supporting_data: string }>;
}

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

      const [consRes, recRes, vitRes, medRes] = await Promise.all([
        patient.national_health_id
          ? supabase.from("consultations").select("*").eq("patient_national_health_id", patient.national_health_id).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("health_records").select("file_name, ai_summary").eq("patient_id", patient.id).order("uploaded_at", { ascending: false }).limit(10),
        supabase.from("vital_history").select("*").eq("patient_id", patient.id).order("recorded_at", { ascending: true }),
        supabase.from("medication_reminders").select("*").eq("patient_id", patient.id),
      ]);

      const { data, error } = await supabase.functions.invoke("clinical-briefing", {
        body: {
          patientHealthId: patient.national_health_id,
          consultations: consRes.data || [],
          healthRecordSummaries: recRes.data || [],
          vitalHistory: vitRes.data || [],
          medicationReminders: medRes.data || [],
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

  const activeMeds = briefing?.current_medications.filter(m => m.status !== "stopped") ?? [];

  return (
    <div className="animate-fade-in pb-8">
      {/* Compact top bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 sm:px-5 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/app")} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full hover:bg-muted">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-primary leading-none">Doctor Visit Mode</p>
            <h1 className="text-[15px] font-bold text-foreground leading-tight mt-0.5 truncate">
              {briefing ? "Your visit brief is ready" : "Get ready in 30 seconds"}
            </h1>
          </div>
          {briefing && (
            <Button size="sm" onClick={shareWA} className="h-8 px-3 text-[12px] gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          )}
        </div>
      </div>

      {/* HERO CTA when no brief */}
      {!briefing && (
        <section className="px-4 sm:px-5 pt-6 pb-5">
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
            <section className="px-4 sm:px-5 pt-4">
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
          <section className="px-4 sm:px-5 pt-4 pb-2">
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
          <section className="px-4 sm:px-5 pb-3">
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
          <section className="px-4 sm:px-5 pb-3">
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
          <section className="px-4 sm:px-5 pb-3">
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

          {/* Flags (if any) */}
          {briefing.red_flags.length > 0 && (
            <section className="px-4 sm:px-5 pb-3">
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

          {/* 4. Share */}
          <section className="px-4 sm:px-5 pt-2 pb-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">4</span>
                <h3 className="text-[13px] font-bold text-foreground">Share with your doctor</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={shareWA} size="sm" className="h-10 gap-1.5 text-[12px]">
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button onClick={copy} size="sm" variant="outline" className="h-10 gap-1.5 text-[12px]">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button onClick={downloadTxt} size="sm" variant="outline" className="h-10 gap-1.5 text-[12px]">
                  <FileDown className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
              <p className="mt-3 text-[10.5px] text-muted-foreground leading-snug">
                AI generated summary for clinical discussion. Always defer to your doctor for medical decisions.
              </p>
            </div>

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
    </div>
  );
};

export default DoctorVisitMode;
