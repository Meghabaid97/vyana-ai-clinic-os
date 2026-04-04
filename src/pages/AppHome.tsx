import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Upload, FileText, TrendingUp, Zap, Link2, Shield, Calendar } from "lucide-react";

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
    const { data: r } = await supabase.from("health_records").select("id").eq("patient_id", p.id);

    setStats({ consultations: consultationsCount, appointments: a?.length || 0, healthRecords: r?.length || 0, doctors: doctorsCount });
  };

  const firstName = profile?.name?.split(" ")[0] || "there";
  const totalRecords = stats.healthRecords + stats.consultations;

  const features = [
    {
      icon: FileText,
      title: "Upload anything",
      desc: "Prescriptions, lab reports, discharge summaries — extracted and organized automatically.",
      path: "/app/records",
      badge: stats.healthRecords || undefined,
    },
    {
      icon: TrendingUp,
      title: "Track what matters",
      desc: "HbA1c, blood pressure, cholesterol — tracked over time. Changes flagged early.",
      path: "/app/trends",
    },
    {
      icon: Zap,
      title: "30-second summary",
      desc: "One screen. Complete history. A doctor sees everything in half a minute.",
      path: "/patient-medical-history",
      badge: stats.consultations || undefined,
    },
    {
      icon: Link2,
      title: "Share with any doctor",
      desc: "Secure link. 24 hours. No app needed on their end.",
      path: "/find-doctors",
      badge: stats.doctors || undefined,
    },
    {
      icon: Calendar,
      title: "Book appointments",
      desc: "Find doctors near you. Book visits. Get reminders.",
      path: "/app/appointments",
      badge: stats.appointments || undefined,
    },
    {
      icon: Shield,
      title: "Emergency access",
      desc: "Family safety net. Loved ones share your records with any doctor, instantly.",
      path: "/emergency-contacts",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero — Notion-style big bold headline */}
      <section className="px-5 pt-10 pb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
          Welcome back, {firstName}
        </p>
        <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
          Your health,{"\n"}
          <span className="text-primary">one place.</span>
        </h1>
      </section>

      {/* Stats row — compact, Notion-like */}
      <section className="px-5 pb-8">
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: stats.doctors, label: "Doctors" },
            { value: stats.consultations, label: "Visits" },
            { value: stats.appointments, label: "Appts" },
            { value: stats.healthRecords, label: "Records" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upload CTA — if no records */}
      {totalRecords === 0 && (
        <section className="px-5 pb-6">
          <button
            onClick={() => navigate("/app/records")}
            className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 flex items-center gap-4 group"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Upload your first record</p>
              <p className="text-xs text-muted-foreground">Your story starts here.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </section>
      )}

      {/* Feature cards — Notion-style grid */}
      <section className="px-5 pb-6">
        <h2 className="text-[22px] sm:text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-foreground mb-5">
          Everything you need.
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {features.map((f, i) => (
            <button
              key={i}
              onClick={() => navigate(f.path)}
              className="group relative w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 transition-all flex items-start gap-4 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-foreground">{f.title}</h3>
                  {f.badge && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-[13px] leading-relaxed mt-0.5">{f.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </section>

      {/* ABHA prompt */}
      {!profile?.national_health_id && (
        <section className="px-5 pb-6">
          <div className="rounded-xl p-5 border border-primary/20 bg-primary/5">
            <h3 className="font-bold text-sm text-foreground">Connect your ABHA Health ID</h3>
            <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
              Link your national health ID and every consultation across providers connects automatically.
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
