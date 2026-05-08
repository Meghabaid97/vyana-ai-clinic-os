import { useState, useEffect, useRef } from "react";
import { vitalStatus, STATUS_TONE, type VitalStatus } from "@/lib/vitalStatus";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, TrendingDown, Activity, Heart, Droplets, Thermometer, Eye,
  Brain, Bone, Pill, Zap, Loader2, Sparkles, ArrowRight, ArrowUp, ArrowDown,
  Minus, FileText, ShieldCheck, Info, AlertTriangle, Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import ClinicalRiskDashboard from "@/components/ClinicalRiskDashboard";
import DashboardChangesCard from "@/components/dashboard/DashboardChangesCard";
import PageHero from "@/components/PageHero";
import { TrendsSkeleton } from "@/components/ui/page-skeletons";
import { useLanguage } from "@/lib/i18n";

type VitalKey = string;
type VitalsMap = Record<VitalKey, number | null>;

type HealthRecord = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  category?: string;
  ai_summary: string | null;
  uploaded_at: string;
  updated_at?: string;
  radiology_study_date?: string | null;
};

interface AnalysisResult {
  vitals?: VitalsMap;
  vital_sources?: Record<string, string>;
  confidence?: "high" | "medium" | "low";
  summary?: string;
  risks?: Array<{ condition: string; level: string; reasoning: string }>;
  recommendations?: string[];
  disclaimer?: string;
}

interface VitalHistoryEntry {
  id: string;
  health_record_id: string;
  source_file_name: string;
  confidence: string;
  vitals: VitalsMap;
  recorded_at: string;
}

interface TrendAnalysis {
  trends: Array<{ vital_name: string; vital_key: string; direction: string; significance: string; detail: string }>;
  correlations: Array<{ observation: string; confidence: string; supporting_data: string; medication?: string; affected_vital?: string }>;
  risk_flags: Array<{ flag: string; severity: string; detail: string }>;
  insights: string;
  disclaimer?: string;
}

const hasStrictStructuredSummary = (summary: string | null | undefined) => {
  if (!summary) return false;
  return summary.includes("Safety Note:") && summary.includes("Confidence:") && summary.includes("Document Type:");
};

const confidenceConfig = {
  high: { label: "High", color: "bg-green-500/10 text-green-700 border-green-500/20" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
  low: { label: "Low", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const HealthTrends = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [vitalHistory, setVitalHistory] = useState<VitalHistoryEntry[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [isAnalyzingTrends, setIsAnalyzingTrends] = useState(false);
  const [medications, setMedications] = useState<Array<{ medication_name: string; dosage: string | null; frequency: string; is_active: boolean }>>([]);
  const [patientAge, setPatientAge] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const autoProcessedRecordRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    void loadTrends();
  }, []);

  // Deep-link: scroll to a specific vital when ?vital=key is present
  useEffect(() => {
    const target = searchParams.get("vital");
    if (!target) return;
    // Wait a tick for vitals to render
    const t = setTimeout(() => {
      const el = document.getElementById(`vital-${target}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary/40");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 2000);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchParams, vitalHistory]);

  useEffect(() => {
    if (!records.length) {
      setAnalysisResult(null);
      return;
    }

    // Trends should always reflect the latest VITALS-bearing report.
    // Skip imaging, prescriptions, and hospital bills — they don't contain
    // lab vitals, and analyzing them would just blank out the displayed trends.
    const VITAL_CATEGORIES = new Set(["report", "discharge_summary", "other"]);
    const latestVitalsRecord =
      records.find((r) => VITAL_CATEGORIES.has((r as any).category)) || null;
    if (!latestVitalsRecord) return;

    const marker = `${latestVitalsRecord.id}:${latestVitalsRecord.updated_at ?? latestVitalsRecord.uploaded_at}`;
    if (autoProcessedRecordRef.current === marker) return;
    autoProcessedRecordRef.current = marker;

    void autoAnalyzeLatestRecord(latestVitalsRecord);
  }, [records]);

  const loadTrends = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: patient } = await supabase
        .from("patients")
        .select("id, national_health_id, age")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!patient) return;
      setPatientAge(patient.age ?? null);
      setPatientId(patient.id);

      const { data: r } = await supabase
        .from("health_records")
        .select("id, file_name, file_path, file_type, category, ai_summary, uploaded_at, updated_at, radiology_study_date")
        .eq("patient_id", patient.id)
        .order("uploaded_at", { ascending: false });

      // Sort by clinical report date when available so the "latest" record reflects
      // the most recent report, not the most recently uploaded file.
      const sorted = ((r || []) as HealthRecord[]).slice().sort((a, b) => {
        const aDate = a.radiology_study_date
          ? new Date(`${a.radiology_study_date}T12:00:00Z`).getTime()
          : new Date(a.uploaded_at).getTime();
        const bDate = b.radiology_study_date
          ? new Date(`${b.radiology_study_date}T12:00:00Z`).getTime()
          : new Date(b.uploaded_at).getTime();
        return bDate - aDate;
      });

      setRecords(sorted);

      // Load vital history for longitudinal view
      const { data: vh } = await supabase
        .from("vital_history")
        .select("*")
        .eq("patient_id", patient.id)
        .order("recorded_at", { ascending: true }) as { data: VitalHistoryEntry[] | null };

      setVitalHistory(vh || []);

      // Load medications for risk engine
      const { data: meds } = await supabase
        .from("medication_reminders")
        .select("medication_name, dosage, frequency, is_active")
        .eq("patient_id", patient.id);
      setMedications((meds || []) as any);

      if (patient.national_health_id) {
        const { data: c } = await supabase
          .from("consultations")
          .select("id")
          .eq("patient_national_health_id", patient.national_health_id);
        setConsultationCount(c?.length || 0);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const toDataUrl = async (signedUrl: string) => {
    const response = await fetch(signedUrl);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(t("trends.toast.readErr")));
      reader.readAsDataURL(blob);
    });
  };

  const refreshLatestRecordSummary = async (record: HealthRecord) => {
    if (hasStrictStructuredSummary(record.ai_summary)) return record;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("health-records")
      .createSignedUrl(record.file_path, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(t("trends.toast.accessErr"));
    }

    const fileContent = await toDataUrl(signedUrlData.signedUrl);

    const { data, error } = await supabase.functions.invoke("summarize-health-record", {
      body: {
        fileName: record.file_name,
        fileType: record.file_type,
        fileContent,
      },
    });

    if (error || !data?.summary) {
      throw new Error(error?.message || t("trends.toast.summarizeErr"));
    }

    // Persist report date (date printed on the document) when the AI extracts it.
    const reportDate: string | null =
      (typeof data.reportDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.reportDate) && data.reportDate) ||
      (typeof data?.radiology?.studyDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.radiology.studyDate) && data.radiology.studyDate) ||
      null;

    const updatePayload: Record<string, unknown> = { ai_summary: data.summary };
    if (reportDate && !record.radiology_study_date) {
      updatePayload.radiology_study_date = reportDate;
    }

    const { error: updateError } = await supabase
      .from("health_records")
      .update(updatePayload)
      .eq("id", record.id);

    if (updateError) {
      throw new Error(updateError.message || t("trends.toast.saveErr"));
    }

    const updatedRecord = {
      ...record,
      ai_summary: data.summary,
      radiology_study_date: record.radiology_study_date || reportDate || null,
    };
    setRecords((prev) => prev.map((item) => (item.id === record.id ? updatedRecord : item)));
    return updatedRecord;
  };

  const saveVitalHistory = async (
    recordId: string,
    fileName: string,
    vitals: VitalsMap,
    confidence: string,
    reportDate?: string | null,
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!patient) return;

    // Use the date printed on the report when available, so trends reflect the
    // clinical timeline rather than when the user uploaded the document.
    const recordedAt =
      reportDate && /^\d{4}-\d{2}-\d{2}$/.test(reportDate)
        ? new Date(`${reportDate}T12:00:00Z`).toISOString()
        : undefined;

    // Check if entry already exists for this record
    const { data: existing } = await supabase
      .from("vital_history")
      .select("id, recorded_at")
      .eq("health_record_id", recordId)
      .maybeSingle() as { data: { id: string; recorded_at: string } | null };

    if (existing) {
      // Backfill recorded_at if we now know the clinical report date and it differs
      if (recordedAt && new Date(existing.recorded_at).toISOString() !== recordedAt) {
        await supabase
          .from("vital_history")
          .update({ recorded_at: recordedAt })
          .eq("id", existing.id);

        const { data: vh } = await supabase
          .from("vital_history")
          .select("*")
          .eq("patient_id", patient.id)
          .order("recorded_at", { ascending: true }) as { data: VitalHistoryEntry[] | null };
        setVitalHistory(vh || []);
      }
      return;
    }

    await supabase.from("vital_history").insert({
      patient_id: patient.id,
      health_record_id: recordId,
      source_file_name: fileName,
      confidence,
      vitals: vitals as any,
      ...(recordedAt ? { recorded_at: recordedAt } : {}),
    });

    // Reload history
    const { data: vh } = await supabase
      .from("vital_history")
      .select("*")
      .eq("patient_id", patient.id)
      .order("recorded_at", { ascending: true }) as { data: VitalHistoryEntry[] | null };
    setVitalHistory(vh || []);
  };

  const autoAnalyzeLatestRecord = async (latestRecord: HealthRecord) => {
    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: patient } = await supabase
        .from("patients")
        .select("name, age")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const safeLatestRecord = await refreshLatestRecordSummary(latestRecord);

      const { data, error } = await supabase.functions.invoke("analyze-health-risks", {
        body: {
          records: [{
            file_name: safeLatestRecord.file_name,
            ai_summary: safeLatestRecord.ai_summary,
          }],
          patientName: patient?.name,
          patientAge: patient?.age,
        },
      });

      if (error) throw error;
      setAnalysisResult(data);

      // Save vitals to history (use the date on the report itself when known)
      if (data?.vitals) {
        await saveVitalHistory(
          safeLatestRecord.id,
          safeLatestRecord.file_name,
          data.vitals,
          data.confidence || "medium",
          safeLatestRecord.radiology_study_date ?? null,
        );
      }
    } catch (err) {
      console.error("Automatic analysis error:", err);
      setAnalysisResult({
        summary: t("trends.fallback.summary"),
        vitals: {},
        risks: [],
        recommendations: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runAnalysis = async () => {
    if (!records.length) return;
    const VITAL_CATEGORIES = new Set(["report", "discharge_summary", "other"]);
    const target = records.find((r) => VITAL_CATEGORIES.has((r as any).category)) || records[0];
    autoProcessedRecordRef.current = null;
    await autoAnalyzeLatestRecord(target);
  };

  const runTrendAnalysis = async () => {
    if (vitalHistory.length < 2) {
      toast({ title: t("trends.toast.needMoreTitle"), description: t("trends.toast.needMoreDesc") });
      return;
    }
    setIsAnalyzingTrends(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: patient } = await supabase.from("patients").select("name, age, id").eq("user_id", session.user.id).maybeSingle();
      const { data: meds } = await supabase.from("medication_reminders").select("*").eq("patient_id", patient?.id || "");

      const { data, error } = await supabase.functions.invoke("analyze-trends", {
        body: {
          vitalHistory,
          medicationReminders: meds || [],
          patientName: patient?.name,
          patientAge: patient?.age,
        },
      });
      if (error) throw error;
      setTrendAnalysis(data);
    } catch (err: any) {
      console.error("Trend analysis error:", err);
      toast({ title: t("trends.toast.trendErrTitle"), description: t("trends.toast.trendErrDesc"), variant: "destructive" });
    } finally {
      setIsAnalyzingTrends(false);
    }
  };

  // Get trend direction for a vital key from AI analysis
  const getVitalTrend = (key: string) => {
    if (!trendAnalysis?.trends) return null;
    return trendAnalysis.trends.find(t => t.vital_key === key);
  };

  const trendDirectionIcon = (direction: string) => {
    if (direction === "increasing") return <ArrowUp className="h-3 w-3 text-destructive" />;
    if (direction === "decreasing") return <ArrowDown className="h-3 w-3 text-blue-500" />;
    if (direction === "stable") return <Minus className="h-3 w-3 text-green-600" />;
    return <Activity className="h-3 w-3 text-yellow-500" />;
  };

  // Use latest vital_history entry if available, fall back to live analysis
  const latestHistory = vitalHistory.length > 0 ? vitalHistory[vitalHistory.length - 1] : null;
  const v = analysisResult?.vitals || latestHistory?.vitals || {};
  const sources = analysisResult?.vital_sources || {};
  const confidence = analysisResult?.confidence || latestHistory?.confidence || null;
  const sourceFileName = records[0]?.file_name || latestHistory?.source_file_name || "Unknown";

  const fmt = (val: number | null | undefined, decimals = 0): string => {
    if (val === null || val === undefined) return "-";
    return decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
  };

  /**
   * Classify a vital reading using the shared 4-state helper, with a
   * "none" fallback for missing values. Open-ended ranges (e.g. HDL > 40)
   * pass `999` as `high` and we coerce it to undefined here so the helper
   * only checks the lower bound.
   */
  const getStatus = (
    val: number | null | undefined,
    low: number,
    high: number,
    key?: string,
  ): VitalStatus | "none" => {
    if (val === null || val === undefined) return "none";
    const range: { low?: number; high?: number } = {};
    if (low > 0) range.low = low;
    if (high > 0 && high < 999) range.high = high;
    return vitalStatus(val, range, key);
  };

  /** Pick the foreground color class for a vital's value, given its status. */
  const statusColor = (status: VitalStatus | "none") => {
    if (status === "none") return "text-foreground";
    if (status === "normal") return "text-status-normal";
    if (status === "watch") return "text-status-watch";
    if (status === "high") return "text-status-high";
    return "text-status-low";
  };

  // Get history for a specific vital key
  const getVitalTimeline = (key: string): Array<{ date: string; value: number; source: string }> => {
    return vitalHistory
      .filter((h) => h.vitals[key] != null)
      .map((h) => ({
        date: new Date(h.recorded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        value: h.vitals[key] as number,
        source: h.source_file_name,
      }));
  };

  const vitalCategories = [
    {
      title: t("trends.cat.cv"),
      vitals: [
        { icon: Heart, key: "bp_systolic", label: t("trends.vital.bp_systolic"), value: fmt(v.bp_systolic), unit: "mmHg", range: "90-120", status: getStatus(v.bp_systolic, 90, 120) },
        { icon: Heart, key: "bp_diastolic", label: t("trends.vital.bp_diastolic"), value: fmt(v.bp_diastolic), unit: "mmHg", range: "60-80", status: getStatus(v.bp_diastolic, 60, 80) },
        { icon: Activity, key: "heart_rate", label: t("trends.vital.heart_rate"), value: fmt(v.heart_rate), unit: "bpm", range: "60-100", status: getStatus(v.heart_rate, 60, 100) },
        { icon: Droplets, key: "total_cholesterol", label: t("trends.vital.total_cholesterol"), value: fmt(v.total_cholesterol), unit: "mg/dL", range: "<200", status: getStatus(v.total_cholesterol, 0, 200) },
        { icon: Droplets, key: "hdl", label: t("trends.vital.hdl"), value: fmt(v.hdl), unit: "mg/dL", range: ">40", status: getStatus(v.hdl, 40, 999) },
        { icon: Droplets, key: "ldl", label: t("trends.vital.ldl"), value: fmt(v.ldl), unit: "mg/dL", range: "<100", status: getStatus(v.ldl, 0, 100) },
        { icon: Droplets, key: "triglycerides", label: t("trends.vital.triglycerides"), value: fmt(v.triglycerides), unit: "mg/dL", range: "<150", status: getStatus(v.triglycerides, 0, 150) },
      ],
    },
    {
      title: t("trends.cat.metabolic"),
      vitals: [
        { icon: Zap, key: "fasting_blood_sugar", label: t("trends.vital.fasting_blood_sugar"), value: fmt(v.fasting_blood_sugar), unit: "mg/dL", range: "70-100", status: getStatus(v.fasting_blood_sugar, 70, 100) },
        { icon: Zap, key: "hba1c", label: t("trends.vital.hba1c"), value: fmt(v.hba1c, 1), unit: "%", range: "4.0-5.6", status: getStatus(v.hba1c, 4.0, 5.6) },
        { icon: Zap, key: "post_prandial_glucose", label: t("trends.vital.post_prandial_glucose"), value: fmt(v.post_prandial_glucose), unit: "mg/dL", range: "<140", status: getStatus(v.post_prandial_glucose, 0, 140) },
        { icon: TrendingUp, key: "weight", label: t("trends.vital.weight"), value: fmt(v.weight, 1), unit: "kg", range: t("trends.vital.weight_range"), status: "none" as const },
        { icon: TrendingUp, key: "bmi", label: t("trends.vital.bmi"), value: fmt(v.bmi, 1), unit: "kg/m²", range: "18.5-24.9", status: getStatus(v.bmi, 18.5, 24.9) },
      ],
    },
    {
      title: t("trends.cat.blood"),
      vitals: [
        { icon: Droplets, key: "hemoglobin", label: t("trends.vital.hemoglobin"), value: fmt(v.hemoglobin, 1), unit: "g/dL", range: "12-17.5", status: getStatus(v.hemoglobin, 12, 17.5) },
        { icon: Droplets, key: "wbc", label: t("trends.vital.wbc"), value: fmt(v.wbc), unit: "/μL", range: "4000-11000", status: getStatus(v.wbc, 4000, 11000) },
        { icon: Droplets, key: "platelet_count", label: t("trends.vital.platelet_count"), value: fmt(v.platelet_count), unit: "/μL", range: "150K-400K", status: getStatus(v.platelet_count, 150000, 400000) },
        { icon: Droplets, key: "rbc", label: t("trends.vital.rbc"), value: fmt(v.rbc, 1), unit: "M/μL", range: "4.5-5.5", status: getStatus(v.rbc, 4.5, 5.5) },
        { icon: Droplets, key: "esr", label: t("trends.vital.esr"), value: fmt(v.esr), unit: "mm/hr", range: "0-20", status: getStatus(v.esr, 0, 20) },
      ],
    },
    {
      title: t("trends.cat.kidneyLiver"),
      vitals: [
        { icon: Bone, key: "creatinine", label: t("trends.vital.creatinine"), value: fmt(v.creatinine, 1), unit: "mg/dL", range: "0.7-1.3", status: getStatus(v.creatinine, 0.7, 1.3) },
        { icon: Bone, key: "bun", label: t("trends.vital.bun"), value: fmt(v.bun), unit: "mg/dL", range: "7-20", status: getStatus(v.bun, 7, 20) },
        { icon: Bone, key: "uric_acid", label: t("trends.vital.uric_acid"), value: fmt(v.uric_acid, 1), unit: "mg/dL", range: "3.5-7.2", status: getStatus(v.uric_acid, 3.5, 7.2) },
        { icon: Pill, key: "sgot", label: t("trends.vital.sgot"), value: fmt(v.sgot), unit: "U/L", range: "8-33", status: getStatus(v.sgot, 8, 33) },
        { icon: Pill, key: "sgpt", label: t("trends.vital.sgpt"), value: fmt(v.sgpt), unit: "U/L", range: "4-36", status: getStatus(v.sgpt, 4, 36) },
        { icon: Pill, key: "bilirubin", label: t("trends.vital.bilirubin"), value: fmt(v.bilirubin, 1), unit: "mg/dL", range: "0.1-1.2", status: getStatus(v.bilirubin, 0.1, 1.2) },
        { icon: Pill, key: "albumin", label: t("trends.vital.albumin"), value: fmt(v.albumin, 1), unit: "g/dL", range: "3.5-5.5", status: getStatus(v.albumin, 3.5, 5.5) },
      ],
    },
    {
      title: t("trends.cat.thyroid"),
      vitals: [
        { icon: Brain, key: "tsh", label: t("trends.vital.tsh"), value: fmt(v.tsh, 2), unit: "mIU/L", range: "0.4-4.0", status: getStatus(v.tsh, 0.4, 4.0) },
        { icon: Brain, key: "t3", label: t("trends.vital.t3"), value: fmt(v.t3), unit: "ng/dL", range: "80-200", status: getStatus(v.t3, 80, 200) },
        { icon: Brain, key: "t4", label: t("trends.vital.t4"), value: fmt(v.t4, 1), unit: "μg/dL", range: "5.1-14.1", status: getStatus(v.t4, 5.1, 14.1) },
      ],
    },
    {
      title: t("trends.cat.vitamins"),
      vitals: [
        { icon: Thermometer, key: "vitamin_d", label: t("trends.vital.vitamin_d"), value: fmt(v.vitamin_d, 1), unit: "ng/mL", range: "30-100", status: getStatus(v.vitamin_d, 30, 100) },
        { icon: Thermometer, key: "vitamin_b12", label: t("trends.vital.vitamin_b12"), value: fmt(v.vitamin_b12), unit: "pg/mL", range: "200-900", status: getStatus(v.vitamin_b12, 200, 900) },
        { icon: Bone, key: "calcium", label: t("trends.vital.calcium"), value: fmt(v.calcium, 1), unit: "mg/dL", range: "8.5-10.5", status: getStatus(v.calcium, 8.5, 10.5) },
        { icon: Bone, key: "iron", label: t("trends.vital.iron"), value: fmt(v.iron), unit: "μg/dL", range: "60-170", status: getStatus(v.iron, 60, 170) },
        { icon: Bone, key: "ferritin", label: t("trends.vital.ferritin"), value: fmt(v.ferritin), unit: "ng/mL", range: "12-300", status: getStatus(v.ferritin, 12, 300) },
        { icon: Eye, key: "folate", label: t("trends.vital.folate"), value: fmt(v.folate, 1), unit: "ng/mL", range: "2.7-17", status: getStatus(v.folate, 2.7, 17) },
      ],
    },
  ];

  if (initialLoading) {
    return <TrendsSkeleton />;
  }

  return (
    <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4">
      <PageHero
        icon={TrendingUp}
        title={t("trends.title")}
        subtitle={t("trends.subtitle")}
      />

      {/* Lead: What changed since last visit (the killer feature) */}
      <DashboardChangesCard patientId={patientId} />


      {/* Preview insight card, shown until user has 2+ records */}
      {records.length < 2 && (
        <section className="pb-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-semibold text-foreground">{t("trends.preview.title")}</h2>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5">
                <ArrowUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[12px] text-foreground leading-snug">
                  {t("trends.preview.example1", { from: "5.4", to: "5.8" })}
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5">
                <ArrowDown className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[12px] text-foreground leading-snug">
                  {t("trends.preview.example2")}
                </p>
              </div>
            </div>
            <p className="text-[12px] font-medium text-primary mb-3">
              {t("trends.preview.uploadCta", { what: records.length === 0 ? t("trends.preview.twoReports") : t("trends.preview.oneMore") })}
            </p>
            <button
              onClick={() => navigate("/app/records?upload=1")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold py-2.5 hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Upload reports
            </button>
          </div>
        </section>
      )}

      <section className="pb-5">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{records.length}</p>
            <p className="text-[10px] text-muted-foreground">{t("trends.stats.records")}</p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{consultationCount}</p>
            <p className="text-[10px] text-muted-foreground">{t("trends.stats.visits")}</p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{vitalHistory.length}</p>
            <p className="text-[10px] text-muted-foreground">{t("trends.stats.snapshots")}</p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-primary">{isAnalyzing ? t("trends.stats.syncing") : t("trends.stats.ready")}</p>
            <p className="text-[10px] text-muted-foreground">{t("trends.stats.analyzer")}</p>
          </div>
        </div>
      </section>

      {/* Confidence & Source Banner */}
      {confidence && (
        <section className="pb-4">
          <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-foreground">{t("trends.source")}</span>
                <span className="text-[12px] text-muted-foreground truncate">{sourceFileName}</span>
                <Badge variant="outline" className={`text-[10px] ${confidenceConfig[confidence as keyof typeof confidenceConfig]?.color || ""}`}>
                  {confidenceConfig[confidence as keyof typeof confidenceConfig]?.label || confidence} {t("trends.confidenceSuffix")}
                </Badge>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pb-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">{t("trends.analyzer.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("trends.analyzer.desc")}
              </p>
            </div>
          </div>

          {isAnalyzing && (
            <div className="rounded-lg bg-card border border-border p-4 mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("trends.analyzer.refreshing")}
            </div>
          )}

          {analysisResult ? (
            <div className="rounded-lg bg-card border border-border p-4 mt-3 space-y-3">
              {analysisResult.summary && (
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{analysisResult.summary}</p>
              )}
              {analysisResult.risks && analysisResult.risks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("trends.analyzer.risksTitle")}</p>
                  {analysisResult.risks.map((risk, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block h-2 w-2 rounded-full ${risk.level === 'high' ? 'bg-destructive' : risk.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <span className="text-[13px] font-medium text-foreground">{risk.condition}</span>
                        <span className={`text-[10px] uppercase font-bold ml-auto ${risk.level === 'high' ? 'text-destructive' : risk.level === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>{risk.level}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground">{risk.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("trends.analyzer.recsTitle")}</p>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-[12px] text-foreground flex gap-2"><ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResult.disclaimer && (
                <p className="text-[10px] text-muted-foreground italic border-t border-border pt-2">{analysisResult.disclaimer}</p>
              )}
            </div>
          ) : null}

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || records.length === 0}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {isAnalyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("trends.analyzer.syncing")}</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {t("trends.analyzer.refresh")}</>
            )}
          </button>

          {records.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              {t("trends.analyzer.uploadHint")}
            </p>
          )}
        </div>
      </section>

      {/* AI Trend Insights */}
      <section className="pb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-[15px] font-bold text-foreground">{t("trends.long.title")}</h2>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {vitalHistory.length} {t("trends.long.snapshots")}
            </Badge>
          </div>

          {trendAnalysis ? (
            <div className="space-y-4">
              {trendAnalysis.insights && (
                <p className="text-[13px] text-foreground leading-relaxed">{trendAnalysis.insights}</p>
              )}

              {trendAnalysis.risk_flags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {t("trends.long.riskFlags")}
                  </p>
                  {trendAnalysis.risk_flags.map((rf, i) => (
                    <div key={i} className={`rounded-lg p-3 border ${rf.severity === "high" ? "bg-destructive/10 border-destructive/30" : rf.severity === "medium" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/50 border-border"}`}>
                      <p className="text-sm font-medium text-foreground">{rf.flag}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rf.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {trendAnalysis.correlations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Pill className="h-3 w-3" /> {t("trends.long.correlations")}
                  </p>
                  {trendAnalysis.correlations.map((c, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-medium text-foreground flex-1">{c.observation}</p>
                        <Badge variant="outline" className={`text-[10px] ${c.confidence === "high" ? "border-green-500/30 text-green-700" : c.confidence === "medium" ? "border-yellow-500/30 text-yellow-600" : "border-muted"}`}>
                          {c.confidence}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.supporting_data}</p>
                    </div>
                  ))}
                </div>
              )}

              {trendAnalysis.disclaimer && (
                <p className="text-[10px] text-muted-foreground italic border-t border-border pt-2">{trendAnalysis.disclaimer}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {vitalHistory.length < 2
                ? t("trends.long.empty.few")
                : t("trends.long.empty.ready")}
            </p>
          )}

          <button
            onClick={runTrendAnalysis}
            disabled={isAnalyzingTrends || vitalHistory.length < 2}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {isAnalyzingTrends ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("trends.long.analyzing")}</>
            ) : (
              <><TrendingUp className="h-4 w-4" /> {t("trends.long.cta")}</>
            )}
          </button>
        </div>
      </section>

      {/* Clinical Risk Scores */}
      {Object.keys(v).length > 0 && (
        <ClinicalRiskDashboard
          vitals={v}
          vitalHistory={vitalHistory}
          medications={medications}
          age={patientAge}
        />
      )}

      {vitalCategories.map((category, ci) => (
        <section key={ci} className="pb-6">
          <h2 className="text-[15px] font-bold text-foreground mb-3">{category.title}</h2>
          <div className="space-y-2">
            {category.vitals.map((vital, vi) => {
              const timeline = getVitalTimeline(vital.key);
              const source = sources[vital.key];
              const hasValue = vital.value !== "-";
              const trend = getVitalTrend(vital.key);

              return (
                <HoverCard key={vi} openDelay={200}>
                  <HoverCardTrigger asChild>
                    {(() => {
                      // Off-band = anything except "normal" or "none". Use the matching status tone for the icon chip.
                      const offBand = vital.status !== "normal" && vital.status !== "none";
                      const tone = offBand && vital.status !== "none" ? STATUS_TONE[vital.status] : null;
                      return (
                        <div id={`vital-${vital.key}`} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3 scroll-mt-24 transition-colors cursor-default">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone ? tone.track : "bg-primary/10"}`}>
                            <vital.icon className={`h-4 w-4 ${offBand ? statusColor(vital.status) : "text-primary"}`} />
                          </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-medium text-foreground truncate">{vital.label}</p>
                          {trend && trendDirectionIcon(trend.direction)}
                          {hasValue && source && (
                            <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-muted-foreground">{t("trends.vital.normal")} {vital.range} {vital.unit}</p>
                          {timeline.length > 1 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary">
                              {timeline.length} {t("trends.vital.readings")}
                            </Badge>
                          )}
                          {trend && (
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${trend.significance === "concerning" ? "border-destructive/30 text-destructive" : trend.significance === "notable" ? "border-yellow-500/30 text-yellow-600" : "border-green-500/30 text-green-600"}`}>
                              {t(`trends.trend.${trend.direction}` as any) || trend.direction}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-bold ${statusColor(vital.status)}`}>{vital.value}</p>
                        <p className="text-[10px] text-muted-foreground">{vital.unit}</p>
                      </div>
                    </div>
                      );
                    })()}
                  </HoverCardTrigger>
                  {hasValue && (
                    <HoverCardContent className="w-72">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-[12px] font-medium text-foreground">{vital.label}</span>
                        </div>
                        {source && (
                          <div className="rounded-lg bg-muted/50 p-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{t("trends.hover.source")}</p>
                            <p className="text-[11px] text-foreground italic">"{source}"</p>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium">{t("trends.hover.from")}</span> {sourceFileName}
                        </div>
                        {timeline.length > 1 && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{t("trends.hover.history")}</p>
                            <div className="space-y-1">
                              {timeline.map((t, ti) => (
                                <div key={ti} className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground">{t.date}</span>
                                  <span className="font-medium text-foreground">{t.value} {vital.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              );
            })}
          </div>
        </section>
      ))}

    </div>
  );
};

export default HealthTrends;
