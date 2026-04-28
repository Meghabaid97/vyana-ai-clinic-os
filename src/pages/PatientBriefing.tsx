import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, AlertTriangle, TrendingUp, Pill, FileText,
  Copy, CheckCircle2, Heart, Brain, Stethoscope, MessageCircle, Mail,
  ArrowUp, ArrowDown, Minus, Activity, Play, QrCode, NotebookPen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BriefingResultSkeleton } from "@/components/ui/page-skeletons";
import { SAMPLE_BRIEFING } from "@/lib/sampleBriefingData";
import { summarizeFreshness, symptomWindowStartIso, formatFreshDate, SYMPTOM_WINDOW_DAYS, type FreshnessSummary } from "@/lib/symptomFreshness";
import { useLanguage } from "@/lib/i18n";
import { buildEmergencyAccessUrl } from "@/lib/share-url";

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
  const [isDemo, setIsDemo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [qrDialog, setQrDialog] = useState<{ url: string; dataUrl: string } | null>(null);
  const [sharing, setSharing] = useState<null | "whatsapp" | "email" | "qr" | "copylink">(null);
  const [symptomFreshness, setSymptomFreshness] = useState<FreshnessSummary | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const createShareLink = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: t("briefing.toast.signinTitle"), description: t("briefing.toast.signinDesc"), variant: "destructive" });
      return null;
    }
    const { data: patient } = await supabase
      .from("patients").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!patient) {
      toast({ title: t("briefing.toast.profileTitle"), description: t("briefing.toast.profileDesc"), variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase.from("shared_record_links").insert({
      patient_id: patient.id,
      recipient_name: null,
    }).select().single() as { data: { token: string } | null; error: { message: string } | null };
    if (error || !data) {
      toast({ title: t("briefing.toast.linkFail"), description: error?.message ?? "Unknown error", variant: "destructive" });
      return null;
    }
    return buildEmergencyAccessUrl(data.token);
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
        toast({ title: t("briefing.toast.profileFirst"), variant: "destructive" });
        return;
      }

      // Fetch all patient data in parallel — incl. last 90 days of symptom journal
      const ninetyDaysAgo = symptomWindowStartIso();
      const [consultationsRes, recordsRes, vitalsRes, medsRes, symptomsRes] = await Promise.all([
        patient.national_health_id
          ? supabase.from("consultations").select("*").eq("patient_national_health_id", patient.national_health_id).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
        supabase.from("health_records").select("file_name, ai_summary, medications, uploaded_at").eq("patient_id", patient.id).order("uploaded_at", { ascending: false }).limit(20),
        supabase.from("vital_history").select("*").eq("patient_id", patient.id).order("recorded_at", { ascending: true }),
        supabase.from("medication_reminders").select("*").eq("patient_id", patient.id),
        supabase.from("symptom_logs").select("*").eq("patient_id", patient.id).gte("logged_at", ninetyDaysAgo).order("logged_at", { ascending: false }).limit(100),
      ]);

      setSymptomFreshness(summarizeFreshness((symptomsRes.data as any) || []));

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
      toast({ title: t("briefing.toast.errTitle"), description: t("briefing.toast.errDesc"), variant: "destructive" });
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
        text += `• ${s.symptom}: ${s.frequency}, avg ${s.avg_severity}${s.pattern ? ` (${s.pattern})` : ""}\n`;
      });
    }
    text += `\n_Generated by Vyana · ${new Date().toLocaleDateString("en-IN")}_`;
    text += `\n_AI-generated summary. Please verify clinically._`;
    return text;
  };

  const buildShareMessage = (url: string) =>
    `${briefingToText()}\n\nView my full secure record (valid 24 hours):\n${url}`;

  const shareViaWhatsApp = async () => {
    if (sharing) return;
    setSharing("whatsapp");
    try {
      const url = await createShareLink();
      if (!url) return;
      const msg = encodeURIComponent(buildShareMessage(url));
      window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
    } finally {
      setSharing(null);
    }
  };

  const shareViaEmail = async () => {
    if (sharing) return;
    setSharing("email");
    try {
      const url = await createShareLink();
      if (!url) return;
      const subject = encodeURIComponent("My health briefing from Vyana");
      const body = encodeURIComponent(buildShareMessage(url));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } finally {
      setSharing(null);
    }
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
      toast({ title: t("briefing.toast.linkFail"), variant: "destructive" });
    } finally {
      setSharing(null);
    }
  };

  const copyShareLink = async () => {
    if (sharing) return;
    setSharing("copylink");
    try {
      const url = await createShareLink();
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast({ title: t("briefing.copied") });
    } finally {
      setSharing(null);
    }
  };

  const copyToClipboard = async () => {
    const text = briefingToText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: t("briefing.copied") });
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
          {t("briefing.title")}
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          {t("briefing.subtitle")}
        </p>
      </section>

      {/* Generate button */}
      {!briefing && (
        <section className="px-5 pb-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{t("briefing.cta.title")}</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {t("briefing.cta.desc")}
            </p>
            <div className="text-left max-w-xs mx-auto mb-5 rounded-lg bg-background/60 border border-border p-3">
              <p className="text-[12px] font-semibold text-foreground mb-2">{t("briefing.cta.includeTitle")}</p>
              <ul className="space-y-1.5">
                {[
                  t("briefing.cta.inc1"),
                  t("briefing.cta.inc2"),
                  t("briefing.cta.inc3"),
                  t("briefing.cta.inc4"),
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
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("briefing.cta.generating")}</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> {t("briefing.cta.generate")}</>
                )}
              </Button>
              <button
                onClick={loadDemo}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                {t("briefing.cta.preview")}
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
                <span className="font-semibold">{t("briefing.demo.text")}</span>, {t("briefing.demo.suffix")}
              </p>
            </div>
            <Button onClick={clearDemo} variant="outline" size="sm" className="shrink-0 h-7 text-[11px]">
              {t("briefing.demo.exit")}
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
                <span className="font-semibold">{t("briefing.loading.title")}</span>{" "}
                {t("briefing.loading.desc")}
              </p>
            </div>
          </section>
          <BriefingResultSkeleton />
        </>
      )}

      {/* Briefing display */}
      {briefing && (
        <>
          {/* Share actions — one tap each, creates secure 24h link in background */}
          <section className="px-5 pb-4">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">
              {t("briefing.share.whatsapp") /* "Share with your doctor" */ ? "Share securely with your doctor" : "Share securely with your doctor"}
            </p>
            <div className="grid grid-cols-5 gap-2">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                disabled={isDemo || !!sharing}
                className="h-14 flex-col gap-1 text-[10px] font-medium"
                aria-label="Share via WhatsApp"
              >
                {sharing === "whatsapp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                WhatsApp
              </Button>
              <Button
                onClick={shareViaEmail}
                variant="outline"
                disabled={isDemo || !!sharing}
                className="h-14 flex-col gap-1 text-[10px] font-medium"
                aria-label="Share via email"
              >
                {sharing === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Email
              </Button>
              <Button
                onClick={shareViaQr}
                variant="outline"
                disabled={isDemo || !!sharing}
                className="h-14 flex-col gap-1 text-[10px] font-medium"
                aria-label="Show QR code"
                title={isDemo ? t("briefing.share.qrDisabled") : t("briefing.share.qrEnabled")}
              >
                {sharing === "qr" ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                QR
              </Button>
              <Button
                onClick={copyShareLink}
                variant="outline"
                disabled={isDemo || !!sharing}
                className="h-14 flex-col gap-1 text-[10px] font-medium"
                aria-label="Copy secure link"
              >
                {sharing === "copylink" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Link
              </Button>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="h-14 flex-col gap-1 text-[10px] font-medium"
                aria-label={t("briefing.share.copy")}
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4" />}
                Text
              </Button>
            </div>
            <div className="mt-2 flex justify-end">
              <Button onClick={generateBriefing} variant="ghost" size="sm" disabled={isLoading} aria-label={t("briefing.share.regenerate")} className="h-7 text-[11px] text-muted-foreground gap-1">
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {t("briefing.share.regenerate")}
              </Button>
            </div>
          </section>

          {/* Overview */}
          <section className="px-5 pb-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.overview")}</h3>
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
                  <h3 className="text-[14px] font-bold text-destructive">{t("briefing.section.flags")}</h3>
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
                  <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.medications")}</h3>
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
                  <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.trends")}</h3>
                </div>
                <div className="space-y-2">
                  {briefing.key_trends.map((kt, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      {dirIcon(kt.direction)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{kt.vital}</span>
                          {kt.concern_level === "action_needed" && (
                            <Badge variant="destructive" className="text-[9px]">{t("briefing.badge.actionNeeded")}</Badge>
                          )}
                          {kt.concern_level === "monitor" && (
                            <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-600">{t("briefing.badge.monitor")}</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{kt.detail}</p>
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <NotebookPen className="h-4 w-4 text-primary" />
                  <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.recentSymptoms")}</h3>
                  <Badge variant="outline" className="text-[9px] ml-auto">{t("briefing.symptoms.selfReported")} · {SYMPTOM_WINDOW_DAYS}d</Badge>
                </div>
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] text-muted-foreground">{t("briefing.symptoms.fromJournal")}</p>
                  {symptomFreshness && !isDemo && (
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md border ${symptomFreshness.isStale ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : "border-border bg-muted/40 text-muted-foreground"}`}>
                      {symptomFreshness.label}{symptomFreshness.latestAt ? ` · ${t("briefing.symptoms.last")}: ${formatFreshDate(symptomFreshness.latestAt)}` : ""}
                    </span>
                  )}
                </div>
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
                  <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.recentChanges")}</h3>
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
                  <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.soap")}</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: t("briefing.soap.s"), value: briefing.soap_note.subjective },
                    { label: t("briefing.soap.o"), value: briefing.soap_note.objective },
                    { label: t("briefing.soap.a"), value: briefing.soap_note.assessment },
                    { label: t("briefing.soap.p"), value: briefing.soap_note.plan },
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
                  <h3 className="text-[14px] font-bold text-foreground">{t("briefing.section.correlations")}</h3>
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
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(qrDialog.url);
                  toast({ title: t("briefing.copied") });
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientBriefing;
