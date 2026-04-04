import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Activity, Heart, Droplets, Thermometer, Eye,
  Brain, Bone, Pill, Zap, Loader2, Sparkles, ArrowRight,
} from "lucide-react";

type VitalKey = string;
type VitalsMap = Record<VitalKey, number | null>;

type HealthRecord = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  ai_summary: string | null;
  uploaded_at: string;
  updated_at?: string;
};

interface AnalysisResult {
  vitals?: VitalsMap;
  summary?: string;
  risks?: Array<{ condition: string; level: string; reasoning: string }>;
  recommendations?: string[];
  disclaimer?: string;
}

const hasStrictStructuredSummary = (summary: string | null | undefined) => {
  if (!summary) return false;
  return summary.includes("Safety Note:") && summary.includes("Confidence:") && summary.includes("Document Type:");
};

const HealthTrends = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const autoProcessedRecordRef = useRef<string | null>(null);

  useEffect(() => {
    void loadTrends();
  }, []);

  useEffect(() => {
    if (!records.length) {
      setAnalysisResult(null);
      return;
    }

    const latestRecord = records[0];
    const marker = `${latestRecord.id}:${latestRecord.updated_at ?? latestRecord.uploaded_at}`;
    if (autoProcessedRecordRef.current === marker) return;
    autoProcessedRecordRef.current = marker;

    void autoAnalyzeLatestRecord(latestRecord);
  }, [records]);

  const loadTrends = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: patient } = await supabase
      .from("patients")
      .select("id, national_health_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!patient) return;

    const { data: r } = await supabase
      .from("health_records")
      .select("id, file_name, file_path, file_type, ai_summary, uploaded_at, updated_at")
      .eq("patient_id", patient.id)
      .order("uploaded_at", { ascending: false });

    setRecords((r || []) as HealthRecord[]);

    if (patient.national_health_id) {
      const { data: c } = await supabase
        .from("consultations")
        .select("id")
        .eq("patient_national_health_id", patient.national_health_id);
      setConsultationCount(c?.length || 0);
    }
  };

  const toDataUrl = async (signedUrl: string) => {
    const response = await fetch(signedUrl);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read latest report"));
      reader.readAsDataURL(blob);
    });
  };

  const refreshLatestRecordSummary = async (record: HealthRecord) => {
    if (hasStrictStructuredSummary(record.ai_summary)) return record;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("health-records")
      .createSignedUrl(record.file_path, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error("Could not access latest report");
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
      throw new Error(error?.message || "Could not summarize latest report safely");
    }

    const { error: updateError } = await supabase
      .from("health_records")
      .update({ ai_summary: data.summary })
      .eq("id", record.id);

    if (updateError) {
      throw new Error(updateError.message || "Could not save latest report summary");
    }

    const updatedRecord = { ...record, ai_summary: data.summary };
    setRecords((prev) => prev.map((item) => (item.id === record.id ? updatedRecord : item)));
    return updatedRecord;
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
    } catch (err) {
      console.error("Automatic analysis error:", err);
      setAnalysisResult({
        summary: "We couldn’t safely extract structured values from the latest report yet. Please try again in a moment.",
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
    autoProcessedRecordRef.current = null;
    await autoAnalyzeLatestRecord(records[0]);
  };

  const v = analysisResult?.vitals || {};

  const fmt = (val: number | null | undefined, decimals = 0): string => {
    if (val === null || val === undefined) return "—";
    return decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
  };

  const getStatus = (val: number | null | undefined, low: number, high: number): "normal" | "warning" | "none" => {
    if (val === null || val === undefined) return "none";
    if (val < low || val > high) return "warning";
    return "normal";
  };

  const statusColor = (status: "normal" | "warning" | "none") => {
    if (status === "warning") return "text-destructive";
    if (status === "normal") return "text-green-600";
    return "text-foreground";
  };

  const vitalCategories = [
    {
      title: "Cardiovascular",
      vitals: [
        { icon: Heart, label: "BP (Systolic)", value: fmt(v.bp_systolic), unit: "mmHg", range: "90–120", status: getStatus(v.bp_systolic, 90, 120) },
        { icon: Heart, label: "BP (Diastolic)", value: fmt(v.bp_diastolic), unit: "mmHg", range: "60–80", status: getStatus(v.bp_diastolic, 60, 80) },
        { icon: Activity, label: "Heart Rate", value: fmt(v.heart_rate), unit: "bpm", range: "60–100", status: getStatus(v.heart_rate, 60, 100) },
        { icon: Droplets, label: "Total Cholesterol", value: fmt(v.total_cholesterol), unit: "mg/dL", range: "<200", status: getStatus(v.total_cholesterol, 0, 200) },
        { icon: Droplets, label: "HDL Cholesterol", value: fmt(v.hdl), unit: "mg/dL", range: ">40", status: getStatus(v.hdl, 40, 999) },
        { icon: Droplets, label: "LDL Cholesterol", value: fmt(v.ldl), unit: "mg/dL", range: "<100", status: getStatus(v.ldl, 0, 100) },
        { icon: Droplets, label: "Triglycerides", value: fmt(v.triglycerides), unit: "mg/dL", range: "<150", status: getStatus(v.triglycerides, 0, 150) },
      ],
    },
    {
      title: "Metabolic",
      vitals: [
        { icon: Zap, label: "Fasting Blood Sugar", value: fmt(v.fasting_blood_sugar), unit: "mg/dL", range: "70–100", status: getStatus(v.fasting_blood_sugar, 70, 100) },
        { icon: Zap, label: "HbA1c", value: fmt(v.hba1c, 1), unit: "%", range: "4.0–5.6", status: getStatus(v.hba1c, 4.0, 5.6) },
        { icon: Zap, label: "Post-Prandial Glucose", value: fmt(v.post_prandial_glucose), unit: "mg/dL", range: "<140", status: getStatus(v.post_prandial_glucose, 0, 140) },
        { icon: TrendingUp, label: "Weight", value: fmt(v.weight, 1), unit: "kg", range: "Patient record / report", status: "none" as const },
        { icon: TrendingUp, label: "BMI", value: fmt(v.bmi, 1), unit: "kg/m²", range: "18.5–24.9", status: getStatus(v.bmi, 18.5, 24.9) },
      ],
    },
    {
      title: "Blood & Immunity",
      vitals: [
        { icon: Droplets, label: "Hemoglobin", value: fmt(v.hemoglobin, 1), unit: "g/dL", range: "12–17.5", status: getStatus(v.hemoglobin, 12, 17.5) },
        { icon: Droplets, label: "WBC Count", value: fmt(v.wbc), unit: "/μL", range: "4000–11000", status: getStatus(v.wbc, 4000, 11000) },
        { icon: Droplets, label: "Platelet Count", value: fmt(v.platelet_count), unit: "/μL", range: "150K–400K", status: getStatus(v.platelet_count, 150000, 400000) },
        { icon: Droplets, label: "RBC Count", value: fmt(v.rbc, 1), unit: "M/μL", range: "4.5–5.5", status: getStatus(v.rbc, 4.5, 5.5) },
        { icon: Droplets, label: "ESR", value: fmt(v.esr), unit: "mm/hr", range: "0–20", status: getStatus(v.esr, 0, 20) },
      ],
    },
    {
      title: "Kidney & Liver",
      vitals: [
        { icon: Bone, label: "Creatinine", value: fmt(v.creatinine, 1), unit: "mg/dL", range: "0.7–1.3", status: getStatus(v.creatinine, 0.7, 1.3) },
        { icon: Bone, label: "BUN", value: fmt(v.bun), unit: "mg/dL", range: "7–20", status: getStatus(v.bun, 7, 20) },
        { icon: Bone, label: "Uric Acid", value: fmt(v.uric_acid, 1), unit: "mg/dL", range: "3.5–7.2", status: getStatus(v.uric_acid, 3.5, 7.2) },
        { icon: Pill, label: "SGOT (AST)", value: fmt(v.sgot), unit: "U/L", range: "8–33", status: getStatus(v.sgot, 8, 33) },
        { icon: Pill, label: "SGPT (ALT)", value: fmt(v.sgpt), unit: "U/L", range: "4–36", status: getStatus(v.sgpt, 4, 36) },
        { icon: Pill, label: "Bilirubin", value: fmt(v.bilirubin, 1), unit: "mg/dL", range: "0.1–1.2", status: getStatus(v.bilirubin, 0.1, 1.2) },
        { icon: Pill, label: "Albumin", value: fmt(v.albumin, 1), unit: "g/dL", range: "3.5–5.5", status: getStatus(v.albumin, 3.5, 5.5) },
      ],
    },
    {
      title: "Thyroid & Hormones",
      vitals: [
        { icon: Brain, label: "TSH", value: fmt(v.tsh, 2), unit: "mIU/L", range: "0.4–4.0", status: getStatus(v.tsh, 0.4, 4.0) },
        { icon: Brain, label: "T3", value: fmt(v.t3), unit: "ng/dL", range: "80–200", status: getStatus(v.t3, 80, 200) },
        { icon: Brain, label: "T4", value: fmt(v.t4, 1), unit: "μg/dL", range: "5.1–14.1", status: getStatus(v.t4, 5.1, 14.1) },
      ],
    },
    {
      title: "Vitamins & Minerals",
      vitals: [
        { icon: Thermometer, label: "Vitamin D", value: fmt(v.vitamin_d, 1), unit: "ng/mL", range: "30–100", status: getStatus(v.vitamin_d, 30, 100) },
        { icon: Thermometer, label: "Vitamin B12", value: fmt(v.vitamin_b12), unit: "pg/mL", range: "200–900", status: getStatus(v.vitamin_b12, 200, 900) },
        { icon: Bone, label: "Calcium", value: fmt(v.calcium, 1), unit: "mg/dL", range: "8.5–10.5", status: getStatus(v.calcium, 8.5, 10.5) },
        { icon: Bone, label: "Iron", value: fmt(v.iron), unit: "μg/dL", range: "60–170", status: getStatus(v.iron, 60, 170) },
        { icon: Bone, label: "Ferritin", value: fmt(v.ferritin), unit: "ng/mL", range: "12–300", status: getStatus(v.ferritin, 12, 300) },
        { icon: Eye, label: "Folate", value: fmt(v.folate, 1), unit: "ng/mL", range: "2.7–17", status: getStatus(v.folate, 2.7, 17) },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">Health Trends</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          Your latest report is analyzed automatically and mapped into major vitals.
        </p>
      </section>

      <section className="px-5 pb-5">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{records.length}</p>
            <p className="text-[10px] text-muted-foreground">Records</p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{consultationCount}</p>
            <p className="text-[10px] text-muted-foreground">Visits</p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-primary">{isAnalyzing ? "Syncing" : "Ready"}</p>
            <p className="text-[10px] text-muted-foreground">Analyzer</p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">AI Health Analyzer</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically refreshes the latest report, then extracts structured values safely.
              </p>
            </div>
          </div>

          {isAnalyzing && (
            <div className="rounded-lg bg-card border border-border p-4 mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Refreshing latest report and filling Trends...
            </div>
          )}

          {analysisResult ? (
            <div className="rounded-lg bg-card border border-border p-4 mt-3 space-y-3">
              {analysisResult.summary && (
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{analysisResult.summary}</p>
              )}
              {analysisResult.risks && analysisResult.risks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Indicators</p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recommendations</p>
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
              <><Loader2 className="h-4 w-4 animate-spin" /> Syncing latest report...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Refresh latest report</>
            )}
          </button>

          {records.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Upload a health record and Trends will populate automatically.
            </p>
          )}
        </div>
      </section>

      {vitalCategories.map((category, ci) => (
        <section key={ci} className="px-5 pb-6">
          <h2 className="text-[15px] font-bold text-foreground mb-3">{category.title}</h2>
          <div className="space-y-2">
            {category.vitals.map((vital, vi) => (
              <div key={vi} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${vital.status === "warning" ? "bg-destructive/10" : "bg-primary/10"}`}>
                  <vital.icon className={`h-4 w-4 ${vital.status === "warning" ? "text-destructive" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{vital.label}</p>
                  <p className="text-[11px] text-muted-foreground">Normal: {vital.range} {vital.unit}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${statusColor(vital.status)}`}>{vital.value}</p>
                  <p className="text-[10px] text-muted-foreground">{vital.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {records.length > 0 && (
        <section className="px-5 pb-8">
          <h2 className="text-[15px] font-bold text-foreground mb-3">Latest uploads</h2>
          <div className="space-y-2">
            {records.slice(0, 5).map((rec) => (
              <div key={rec.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{rec.file_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(rec.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground uppercase">{rec.file_type?.split("/")[1] || "file"}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HealthTrends;
