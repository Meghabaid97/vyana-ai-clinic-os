import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Activity, Heart, Droplets, Thermometer, Eye,
  Brain, Bone, Pill, Zap, Loader2, Sparkles, ArrowRight,
} from "lucide-react";

const HealthTrends = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => { loadTrends(); }, []);

  const loadTrends = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: patient } = await supabase.from("patients").select("id, national_health_id").eq("user_id", session.user.id).maybeSingle();
    if (!patient) return;

    const { data: r } = await supabase.from("health_records").select("*").eq("patient_id", patient.id).order("uploaded_at", { ascending: false });
    setRecords(r || []);

    if (patient.national_health_id) {
      const { data: c } = await supabase.from("consultations").select("id").eq("patient_national_health_id", patient.national_health_id);
      setConsultationCount(c?.length || 0);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-health-risks", {
        body: { records: records.map(r => ({ file_name: r.file_name, ai_summary: r.ai_summary })) },
      });
      if (error) throw error;
      setAiSummary(data?.summary || data?.analysis || "No insights available yet. Upload more records for a comprehensive analysis.");
    } catch (err) {
      console.error("Analysis error:", err);
      setAiSummary("Unable to analyze right now. Please try again later.");
    } finally { setIsAnalyzing(false); }
  };

  const vitalCategories = [
    {
      title: "Cardiovascular",
      vitals: [
        { icon: Heart, label: "Blood Pressure (Systolic)", value: "—", unit: "mmHg", range: "90–120" },
        { icon: Heart, label: "Blood Pressure (Diastolic)", value: "—", unit: "mmHg", range: "60–80" },
        { icon: Activity, label: "Heart Rate", value: "—", unit: "bpm", range: "60–100" },
        { icon: Droplets, label: "Total Cholesterol", value: "—", unit: "mg/dL", range: "<200" },
        { icon: Droplets, label: "HDL Cholesterol", value: "—", unit: "mg/dL", range: ">40" },
        { icon: Droplets, label: "LDL Cholesterol", value: "—", unit: "mg/dL", range: "<100" },
        { icon: Droplets, label: "Triglycerides", value: "—", unit: "mg/dL", range: "<150" },
      ],
    },
    {
      title: "Metabolic",
      vitals: [
        { icon: Zap, label: "Fasting Blood Sugar", value: "—", unit: "mg/dL", range: "70–100" },
        { icon: Zap, label: "HbA1c", value: "—", unit: "%", range: "4.0–5.6" },
        { icon: Zap, label: "Post-Prandial Glucose", value: "—", unit: "mg/dL", range: "<140" },
        { icon: TrendingUp, label: "Weight", value: "—", unit: "kg", range: "BMI 18.5–24.9" },
        { icon: TrendingUp, label: "BMI", value: "—", unit: "kg/m²", range: "18.5–24.9" },
      ],
    },
    {
      title: "Blood & Immunity",
      vitals: [
        { icon: Droplets, label: "Hemoglobin", value: "—", unit: "g/dL", range: "12–17.5" },
        { icon: Droplets, label: "WBC Count", value: "—", unit: "/μL", range: "4000–11000" },
        { icon: Droplets, label: "Platelet Count", value: "—", unit: "/μL", range: "150K–400K" },
        { icon: Droplets, label: "RBC Count", value: "—", unit: "M/μL", range: "4.5–5.5" },
        { icon: Droplets, label: "ESR", value: "—", unit: "mm/hr", range: "0–20" },
      ],
    },
    {
      title: "Kidney & Liver",
      vitals: [
        { icon: Bone, label: "Creatinine", value: "—", unit: "mg/dL", range: "0.7–1.3" },
        { icon: Bone, label: "BUN (Blood Urea Nitrogen)", value: "—", unit: "mg/dL", range: "7–20" },
        { icon: Bone, label: "Uric Acid", value: "—", unit: "mg/dL", range: "3.5–7.2" },
        { icon: Pill, label: "SGOT (AST)", value: "—", unit: "U/L", range: "8–33" },
        { icon: Pill, label: "SGPT (ALT)", value: "—", unit: "U/L", range: "4–36" },
        { icon: Pill, label: "Bilirubin (Total)", value: "—", unit: "mg/dL", range: "0.1–1.2" },
        { icon: Pill, label: "Albumin", value: "—", unit: "g/dL", range: "3.5–5.5" },
      ],
    },
    {
      title: "Thyroid & Hormones",
      vitals: [
        { icon: Brain, label: "TSH", value: "—", unit: "mIU/L", range: "0.4–4.0" },
        { icon: Brain, label: "T3", value: "—", unit: "ng/dL", range: "80–200" },
        { icon: Brain, label: "T4", value: "—", unit: "μg/dL", range: "5.1–14.1" },
      ],
    },
    {
      title: "Vitamins & Minerals",
      vitals: [
        { icon: Thermometer, label: "Vitamin D", value: "—", unit: "ng/mL", range: "30–100" },
        { icon: Thermometer, label: "Vitamin B12", value: "—", unit: "pg/mL", range: "200–900" },
        { icon: Bone, label: "Calcium", value: "—", unit: "mg/dL", range: "8.5–10.5" },
        { icon: Bone, label: "Iron", value: "—", unit: "μg/dL", range: "60–170" },
        { icon: Bone, label: "Ferritin", value: "—", unit: "ng/mL", range: "12–300" },
        { icon: Eye, label: "Folate", value: "—", unit: "ng/mL", range: "2.7–17" },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
          Health Trends
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          The slow changes matter most. We track them so nothing slips through.
        </p>
      </section>

      {/* Summary strip */}
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
            <p className="text-xl font-bold text-primary">Active</p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </div>
        </div>
      </section>

      {/* AI Health Summarizer */}
      <section className="px-5 pb-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">AI Health Analyzer</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyzes your records and gives personalized insights
              </p>
            </div>
          </div>

          {aiSummary ? (
            <div className="rounded-lg bg-card border border-border p-4 mt-3">
              <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{aiSummary}</p>
            </div>
          ) : null}

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || records.length === 0}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {isAnalyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {aiSummary ? "Re-analyze" : "Analyze My Health"}</>
            )}
          </button>

          {records.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Upload health records first to get AI-powered insights
            </p>
          )}
        </div>
      </section>

      {/* Vital categories */}
      {vitalCategories.map((category, ci) => (
        <section key={ci} className="px-5 pb-6">
          <h2 className="text-[15px] font-bold text-foreground mb-3">{category.title}</h2>
          <div className="space-y-2">
            {category.vitals.map((vital, vi) => (
              <div key={vi} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <vital.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{vital.label}</p>
                  <p className="text-[11px] text-muted-foreground">Normal: {vital.range} {vital.unit}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">{vital.value}</p>
                  <p className="text-[10px] text-muted-foreground">{vital.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Recent uploads */}
      {records.length > 0 && (
        <section className="px-5 pb-8">
          <h2 className="text-[15px] font-bold text-foreground mb-3">Recent uploads</h2>
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
