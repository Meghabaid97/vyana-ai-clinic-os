import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Activity, Heart, Droplets } from "lucide-react";

const HealthTrends = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);

  useEffect(() => {
    loadTrends();
  }, []);

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

  const trendCards = [
    { icon: Heart, label: "Blood Pressure", value: "—", note: "Upload a BP reading to start tracking", color: "text-primary" },
    { icon: Droplets, label: "Blood Sugar (HbA1c)", value: "—", note: "Upload lab results to see trends", color: "text-primary" },
    { icon: Activity, label: "Cholesterol", value: "—", note: "Track your lipid profile over time", color: "text-primary" },
    { icon: TrendingUp, label: "Weight", value: "—", note: "Log your weight to see changes", color: "text-primary" },
  ];

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-6">
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
          Health Trends
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed mt-2">
          The slow changes matter most. We track them so nothing slips through.
        </p>
      </section>

      {/* Summary strip */}
      <section className="px-5 pb-6">
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{records.length}</p>
            <p className="text-[11px] text-muted-foreground">Records</p>
          </div>
          <div className="flex-1 rounded-lg border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{consultationCount}</p>
            <p className="text-[11px] text-muted-foreground">Visits</p>
          </div>
          <div className="flex-1 rounded-lg border border-border p-3 text-center">
            <p className="text-2xl font-bold text-primary">Active</p>
            <p className="text-[11px] text-muted-foreground">Status</p>
          </div>
        </div>
      </section>

      {/* Vital cards */}
      <section className="px-5 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">
          Your vitals. <span className="text-primary">Over time.</span>
        </h2>
        <div className="space-y-3">
          {trendCards.map((card, i) => (
            <div key={i} className="rounded-lg border border-border p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{card.label}</h3>
                  <span className="text-lg font-bold text-foreground">{card.value}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-0.5">{card.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI insight placeholder */}
      <section className="px-5 pb-8">
        <div className="rounded-lg p-4 border border-primary/20 bg-primary/5">
          <h3 className="font-semibold text-sm mb-1 text-foreground">🔍 AI Health Insights</h3>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            Upload more records and we will start flagging patterns, risks, and recommendations. The more data we have, the better we protect you.
          </p>
        </div>
      </section>

      {/* Recent records */}
      {records.length > 0 && (
        <section className="px-5 pb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Recent uploads</h2>
          <div className="space-y-2">
            {records.slice(0, 5).map((rec) => (
              <div key={rec.id} className="rounded-lg border border-border p-3 flex items-center justify-between">
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
