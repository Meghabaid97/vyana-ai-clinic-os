import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  national_health_id: string | null;
}

const AppHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState({ consultations: 0, appointments: 0, healthRecords: 0, doctors: 0 });
  const [recordDates, setRecordDates] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: p } = await supabase.from("patients").select("*").eq("user_id", session.user.id).single();
    if (!p) return;
    setProfile(p);

    let consultationsCount = 0, doctorsCount = 0;
    if (p.national_health_id) {
      const { data: c } = await supabase.from("consultations").select("doctor_id").eq("patient_national_health_id", p.national_health_id);
      if (c) { consultationsCount = c.length; doctorsCount = new Set(c.map(x => x.doctor_id)).size; }
    }

    const { data: a } = await supabase.from("appointments").select("id").eq("patient_id", p.id);
    const { data: r } = await supabase.from("health_records").select("id, uploaded_at").eq("patient_id", p.id).order("uploaded_at", { ascending: true });

    setRecordDates((r || []).map(x => new Date(x.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })));
    setStats({ consultations: consultationsCount, appointments: a?.length || 0, healthRecords: r?.length || 0, doctors: doctorsCount });
  };

  const totalRecords = stats.healthRecords + stats.consultations;
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="px-5 pt-8 pb-6">
        <p className="text-sm text-primary font-medium mb-2">Welcome back, {firstName}.</p>
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
          Your health story.{" "}
          <span className="text-primary">Always with you.</span>
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed mt-3">
          Every prescription, every lab report, every doctor visit builds your complete health picture. Quietly. Securely.
        </p>
      </section>

      {/* Quick stats row */}
      <section className="px-5 pb-6">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[
            { value: stats.doctors, label: "Doctors" },
            { value: stats.consultations, label: "Visits" },
            { value: stats.appointments, label: "Appts" },
            { value: stats.healthRecords, label: "Records" },
          ].map((s) => (
            <div key={s.label} className="flex-1 min-w-[72px] rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story beats */}
      <section className="px-5 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-1">
          Your story so far. <span className="text-primary">Every detail matters.</span>
        </h2>

        {/* Timeline or upload CTA */}
        <div className="mt-4 rounded-lg p-4 border border-border bg-muted/60">
          {totalRecords === 0 ? (
            <button onClick={() => navigate("/app/records")} className="group flex items-center gap-3 text-primary">
              <Upload className="h-4 w-4" />
              <span className="font-medium text-sm">Upload your first record. Your story starts here.</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative flex items-center gap-0 overflow-x-auto pb-2">
                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-border" />
                {recordDates.map((date, i) => (
                  <div key={i} className="relative flex flex-col items-center shrink-0" style={{ minWidth: "48px" }}>
                    <div className="h-2.5 w-2.5 rounded-full z-10 bg-primary" />
                    <span className="mt-1 text-[10px] whitespace-nowrap text-muted-foreground">{date}</span>
                  </div>
                ))}
                <div className="relative flex flex-col items-center shrink-0" style={{ minWidth: "48px" }}>
                  <div className="h-3.5 w-3.5 rounded-full z-10 bg-primary ring-3 ring-primary/20" />
                  <span className="mt-1 text-[10px] font-semibold whitespace-nowrap text-primary">Today</span>
                </div>
              </div>
              <p className="text-sm text-foreground">
                {totalRecords} record{totalRecords !== 1 ? "s" : ""} held.{" "}
                <span className="text-primary font-medium">Your story is growing.</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Promises / Quick actions */}
      <section className="px-5 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-1">
          Not features. <span className="text-primary">Promises.</span>
        </h2>
        <p className="text-muted-foreground text-[13px] mb-4">What we will never compromise on.</p>

        <div className="space-y-3">
          {[
            { emoji: "📄", title: "Upload anything", desc: "Prescriptions, lab reports, discharge summaries. We extract the data.", path: "/app/records" },
            { emoji: "📈", title: "Track what matters", desc: "HbA1c, BP, cholesterol tracked over time. Changes flagged early.", path: "/app/trends" },
            { emoji: "⚡", title: "30-second summary", desc: "One screen. Complete history. A doctor sees everything instantly.", path: "/patient-medical-history" },
            { emoji: "🔗", title: "Share with any doctor", desc: "Secure link. 24 hours. No app needed on their end.", path: "/find-doctors" },
            { emoji: "🛡️", title: "Emergency access", desc: "Family safety net. Loved ones can share records with any doctor, instantly.", path: "/emergency-contacts" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="w-full rounded-lg border border-border p-4 text-left hover:border-primary/30 transition-colors flex items-start gap-3"
            >
              <span className="text-lg shrink-0">{item.emoji}</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-[13px] leading-relaxed">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ABHA prompt */}
      {!profile?.national_health_id && (
        <section className="px-5 pb-8">
          <div className="rounded-lg p-4 border border-primary/20 bg-primary/5">
            <h3 className="font-semibold text-sm mb-1 text-foreground">One step to connect everything</h3>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              Add your ABHA Health ID and every consultation across any provider links automatically.
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <section className="px-5 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span> · Every patient deserves a doctor who knows their story.
        </p>
      </section>
    </div>
  );
};

export default AppHome;
