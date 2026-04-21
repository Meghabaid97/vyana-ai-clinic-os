import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Upload, FileText, TrendingUp, Link2, Shield, Calendar,
  Heart, Droplets, Activity, Loader2, ScanLine, IndianRupee,
} from "lucide-react";
import HowItWorksTour from "@/components/HowItWorksTour";

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  national_health_id: string | null;
}

interface HomeVitals {
  bp_systolic: number | null;
  bp_diastolic: number | null;
  fasting_blood_sugar: number | null;
  total_cholesterol: number | null;
  weight: number | null;
}

const AppHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState({ consultations: 0, appointments: 0, healthRecords: 0, doctors: 0 });
  const [recordDates, setRecordDates] = useState<string[]>([]);
  const [homeVitals, setHomeVitals] = useState<HomeVitals | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

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
    const { data: r } = await supabase.from("health_records").select("id, uploaded_at, ai_summary, file_name").eq("patient_id", p.id).order("uploaded_at", { ascending: true });

    setRecordDates((r || []).map(x => new Date(x.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })));
    setStats({ consultations: consultationsCount, appointments: a?.length || 0, healthRecords: r?.length || 0, doctors: doctorsCount });

    // Auto-analyze latest record for home vitals
    if (r && r.length > 0) {
      const latest = r[r.length - 1];
      if (latest.ai_summary) {
        setVitalsLoading(true);
        try {
          const { data: analysis } = await supabase.functions.invoke("analyze-health-risks", {
            body: {
              records: [{ file_name: latest.file_name, ai_summary: latest.ai_summary }],
              patientName: p.name,
              patientAge: p.age,
            },
          });
          if (analysis?.vitals) {
            setHomeVitals(analysis.vitals);
          }
        } catch (err) {
          console.error("Home vitals analysis error:", err);
        } finally {
          setVitalsLoading(false);
        }
      }
    }
  };

  const firstName = profile?.name?.split(" ")[0] || "there";
  const totalRecords = stats.healthRecords + stats.consultations;

  const fmtVital = (val: number | null | undefined) => (val != null ? String(Math.round(val)) : "—");

  return (
    <div className="animate-fade-in overflow-x-hidden pb-2">
      {/* ── Hero ── */}
      <section className="px-4 sm:px-5 pt-8 sm:pt-8 pb-5 sm:pb-6">
        <div className="max-w-sm">
          <p className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
            Welcome back, {firstName}
          </p>
          <h1 className="text-[clamp(1.8rem,8vw,2.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground">
            Your health story.{' '}
            <span className="block text-primary">Always with you.</span>
          </h1>
          <p className="mt-3 max-w-[30ch] text-[14px] sm:text-[14px] text-muted-foreground leading-relaxed">
            Every prescription, every lab report, every doctor visit builds your complete health picture. Quietly. Securely. So when you need it most, it is there.
          </p>
        </div>
      </section>

      {/* ── Action-first CTA (empty) or Stats (with data) ── */}
      <section className="px-4 sm:px-5 pb-4 sm:pb-5">
        {totalRecords === 0 ? (
          <div className="space-y-2.5">
            <button
              onClick={() => navigate("/app/records")}
              className="group flex w-full items-center gap-3 rounded-xl bg-primary p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="h-11 w-11 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-primary-foreground leading-tight">
                  Upload your first report
                </p>
                <p className="text-[12px] text-primary-foreground/80 mt-0.5 leading-snug">
                  Prescription, lab report, or discharge summary.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setTourOpen(true)}
              className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground leading-tight">
                  See how it works
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                  A 60-second tour of your health memory.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { value: stats.doctors, label: "Doctors" },
              { value: stats.consultations, label: "Visits" },
              { value: stats.appointments, label: "Appts" },
              { value: stats.healthRecords, label: "Records" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-2.5 sm:p-3 text-center">
                <p className="text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Story beats — emotional section ── */}
      <section className="px-4 sm:px-5 pb-4 sm:pb-5">
        <h2 className="mb-1 text-lg font-bold text-foreground leading-tight">
          <span className="block sm:inline">Your story so far.</span>{" "}
          <span className="block sm:inline text-primary">Every detail matters.</span>
        </h2>
        <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">
          What happens when the system forgets and families pay the price. Your records make sure that never happens.
        </p>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:block sm:space-y-3 sm:overflow-visible sm:px-0">
          {[
            { emoji: "🏥", title: "Five minutes. A lifetime of history.", text: "A family rushes to the ER. They get five minutes to explain decades of medical history. No records. No context. Just fear." },
            { emoji: "📋", title: "75 pages. Zero continuity.", text: "Scattered reports in thick folders. Every new doctor orders fresh tests. The clock resets. The bill climbs. Nothing connects." },
            { emoji: "⏰", title: "Caught too late.", text: "Nobody tracks the slow changes. Conditions worsen quietly. By the time they are caught, prevention is off the table." },
          ].map((beat, i) => (
            <div key={i} className="min-w-[84%] snap-start rounded-xl border border-border p-4 transition-colors sm:min-w-0 hover:bg-muted/50">
              <span className="text-lg mb-1.5 block">{beat.emoji}</span>
              <h3 className="text-[14px] font-semibold text-foreground mb-1">{beat.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{beat.text}</p>
            </div>
          ))}
        </div>

        {/* Timeline or upload prompt */}
        <div className="mt-4 rounded-xl p-4 border border-border bg-muted/50">
          {totalRecords === 0 ? (
              <button onClick={() => navigate("/app/records")} className="group flex items-center gap-3 text-primary w-full min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4 text-primary" />
              </div>
                <span className="min-w-0 font-medium text-sm text-left">Upload your first record. Your story starts here.</span>
              <ArrowRight className="h-4 w-4 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <div className="space-y-2">
                <div className="relative flex items-center gap-3 overflow-x-auto pb-2">
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

      {/* ── Health Trends Preview ── */}
      <section className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">
            Health trends
          </h2>
          <button onClick={() => navigate("/app/trends")} className="text-xs text-primary font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          {[
            { icon: Heart, label: "Blood Pressure", value: homeVitals?.bp_systolic != null && homeVitals?.bp_diastolic != null ? `${fmtVital(homeVitals.bp_systolic)}/${fmtVital(homeVitals.bp_diastolic)}` : (vitalsLoading ? "..." : "—") },
            { icon: Droplets, label: "Blood Sugar", value: vitalsLoading ? "..." : fmtVital(homeVitals?.fasting_blood_sugar) },
            { icon: Activity, label: "Cholesterol", value: vitalsLoading ? "..." : fmtVital(homeVitals?.total_cholesterol) },
            { icon: TrendingUp, label: "Weight", value: vitalsLoading ? "..." : fmtVital(homeVitals?.weight) },
          ].map((v, i) => (
            <button
              key={i}
              onClick={() => navigate("/app/trends")}
              className="min-w-0 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/30 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <v.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[12px] text-muted-foreground">{v.label}</p>
              <p className="mt-0.5 text-base sm:text-lg font-bold text-foreground break-words">{v.value}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Promises / Features ── */}
      <section className="px-4 sm:px-5 pb-4 sm:pb-5">
        <h2 className="text-lg font-bold text-foreground mb-1">
          Not features. <span className="text-primary">Promises.</span>
        </h2>
        <p className="text-[13px] text-muted-foreground mb-4">Six things we will never compromise on.</p>

        <div className="space-y-2.5">
          {[
            { icon: FileText, title: "Upload anything", desc: "Prescriptions, lab reports, summaries, extracted and organized.", path: "/app/records", badge: stats.healthRecords || undefined },
            { icon: TrendingUp, title: "Track what matters", desc: "HbA1c, BP, cholesterol tracked over time. Changes flagged early.", path: "/app/trends" },
            { icon: Activity, title: "Your timeline", desc: "Every visit, diagnosis, and vital, connected in one view.", path: "/app/timeline" },
            { icon: Link2, title: "Share with any doctor", desc: "Secure link. 24 hours. No app needed on their end.", path: "/app/share", badge: stats.doctors || undefined },
            { icon: Shield, title: "Emergency access", desc: "Family safety net. Share your records instantly in emergencies.", path: "/app/emergency-contacts" },
            { icon: ScanLine, title: "Prescription reader", desc: "Photograph any prescription, AI reads it in 5 languages.", path: "/app/prescription-reader" },
            { icon: IndianRupee, title: "Claim Assistant", desc: "Upload discharge summary, get insurance claim data, medication reminders, and medical summary.", path: "/app/recovery" },
          ].map((f, i) => (
            <button
              key={i}
              onClick={() => navigate(f.path)}
              className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 text-left hover:border-primary/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-foreground">{f.title}</h3>
                  {f.badge && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-[12px] leading-relaxed mt-0.5">{f.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </section>

      {/* ── Why Vyana / Our Story ── */}
      <section className="px-4 sm:px-5 pb-5">
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-primary/5 p-5">
            <h2 className="text-lg font-bold text-foreground mb-2">Why Vyana?</h2>
            <p className="text-[14px] text-foreground leading-relaxed">
              In 2005, in a small hospital in Tirupur, a family lost someone they loved. Not because the doctors didn't care. Because no one had the records. No history. No context. Just five desperate minutes to explain a lifetime.
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed mt-3">
              Vyana exists so that never happens again. Not to your family. Not to anyone's.
            </p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Read our full story</p>
              <p className="text-[11px] text-muted-foreground">The promise behind the product.</p>
            </div>
            <button
              onClick={() => navigate("/why-vyana")}
              className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </section>

      {/* ── ABHA prompt ── */}
      {!profile?.national_health_id && (
        <section className="px-4 sm:px-5 pb-5">
          <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
            <h3 className="font-bold text-sm text-foreground">Connect your ABHA Health ID</h3>
            <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
              Link your national health ID and every consultation across providers connects automatically.
            </p>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <section className="px-4 sm:px-5 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span> · Every patient deserves a doctor who knows their story.
        </p>
      </section>

      <HowItWorksTour
        open={tourOpen}
        onOpenChange={setTourOpen}
        onFinish={() => navigate("/app/records")}
      />
    </div>
  );
};

export default AppHome;
