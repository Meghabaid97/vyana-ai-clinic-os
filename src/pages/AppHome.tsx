import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Upload, Link2, Shield } from "lucide-react";
import DashboardBriefingHero from "@/components/dashboard/DashboardBriefingHero";
import DashboardChangesCard from "@/components/dashboard/DashboardChangesCard";

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  national_health_id: string | null;
}

const AppHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [recordDates, setRecordDates] = useState<string[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);

  useEffect(() => { void loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: p } = await supabase
      .from("patients").select("*")
      .eq("user_id", session.user.id).single();
    if (!p) return;
    setProfile(p);

    const { data: r } = await supabase
      .from("health_records")
      .select("uploaded_at")
      .eq("patient_id", p.id)
      .order("uploaded_at", { ascending: true });
    setRecordCount(r?.length || 0);
    setRecordDates((r || []).map(x =>
      new Date(x.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    ));

    if (p.national_health_id) {
      const { data: c } = await supabase
        .from("consultations").select("id")
        .eq("patient_national_health_id", p.national_health_id);
      setConsultationCount(c?.length || 0);
    }
  };

  const firstName = profile?.name?.split(" ")[0] || "there";
  const totalRecords = recordCount + consultationCount;
  const hasRecords = totalRecords > 0;

  return (
    <div className="animate-fade-in overflow-x-hidden pb-2 lg:overflow-x-visible">
      {/* ============ DESKTOP: 2-column hero band ============ */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Soft opener — spans full width on mobile, 7 cols on desktop */}
        <section className="px-4 sm:px-5 pt-8 pb-5 lg:col-span-7 lg:px-0 lg:pt-2">
          <div className="max-w-sm lg:max-w-2xl">
            <p className="text-xs font-medium tracking-widest uppercase text-primary mb-3">
              Welcome back, {firstName}
            </p>
            <h1 className="text-[clamp(1.7rem,7.5vw,2.2rem)] lg:text-5xl xl:text-6xl font-extrabold leading-[1.04] tracking-[-0.03em] text-foreground">
              Your health story.{" "}
              <span className="block text-primary">Always with you.</span>
            </h1>
            <p className="mt-2.5 lg:mt-4 max-w-[32ch] lg:max-w-[44ch] text-[13.5px] lg:text-base text-muted-foreground leading-relaxed">
              Never explain your medical history again. Doctor-ready in 30 seconds.
            </p>
          </div>
        </section>

        {/* HERO: Briefing CTA — full width on mobile, 5 cols on desktop */}
        <div className="lg:col-span-5 lg:pb-0">
          <DashboardBriefingHero hasRecords={hasRecords} />
        </div>
      </div>

      {/* ============ DESKTOP: 2-column body grid ============ */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:mt-2">
        {/* MAIN column (8 cols on desktop) */}
        <div className="lg:col-span-8 lg:space-y-6">
          {/* ── Your story so far (KEEP) ── */}
          <section className="px-4 sm:px-5 pb-5 lg:px-0 lg:pb-0">
            <h2 className="mb-1 text-lg lg:text-2xl font-bold text-foreground leading-tight">
              <span className="block sm:inline">Your story so far.</span>{" "}
              <span className="block sm:inline text-primary">Every detail matters.</span>
            </h2>
            <p className="text-[13px] lg:text-sm text-muted-foreground mb-4 leading-relaxed">
              What happens when the system forgets and families pay the price. Your records make sure that never happens.
            </p>

            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-1 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {[
                { emoji: "🏥", title: "Five minutes. A lifetime of history.", text: "A family rushes to the ER. They get five minutes to explain decades of medical history. No records. No context. Just fear." },
                { emoji: "📋", title: "75 pages. Zero continuity.", text: "Scattered reports in thick folders. Every new doctor orders fresh tests. The clock resets. The bill climbs. Nothing connects." },
                { emoji: "⏰", title: "Caught too late.", text: "Nobody tracks the slow changes. Conditions worsen quietly. By the time they are caught, prevention is off the table." },
              ].map((beat, i) => (
                <div key={i} className="min-w-[84%] snap-start rounded-xl border border-border p-4 transition-colors sm:min-w-0 hover:bg-muted/50 hover:border-primary/30">
                  <span className="text-lg mb-1.5 block">{beat.emoji}</span>
                  <h3 className="text-[14px] font-semibold text-foreground mb-1">{beat.title}</h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">{beat.text}</p>
                </div>
              ))}
            </div>

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

          {/* ── What changed since last visit ── */}
          <DashboardChangesCard patientId={profile?.id ?? null} />
        </div>

        {/* SIDE column (4 cols on desktop) */}
        <aside className="lg:col-span-4 lg:space-y-6">
          {/* Slim quick actions */}
          <section className="px-4 sm:px-5 pb-5 lg:px-0 lg:pb-0">
            <h3 className="hidden lg:block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button
                onClick={() => navigate("/app/share")}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-left hover:border-primary/30 transition-colors min-w-0"
              >
                <Link2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[12.5px] lg:text-sm font-medium text-foreground truncate">Share with doctor</span>
              </button>
              <button
                onClick={() => navigate("/app/emergency-contacts")}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-left hover:border-primary/30 transition-colors min-w-0"
              >
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[12.5px] lg:text-sm font-medium text-foreground truncate">Emergency access</span>
              </button>
            </div>
          </section>

          {/* Why Vyana */}
          <section className="px-4 sm:px-5 pb-5 lg:px-0 lg:pb-0">
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

          {!profile?.national_health_id && (
            <section className="px-4 sm:px-5 pb-5 lg:px-0 lg:pb-0">
              <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
                <h3 className="font-bold text-sm text-foreground">Connect your ABHA Health ID</h3>
                <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
                  Link your national health ID and every consultation across providers connects automatically.
                </p>
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="px-4 sm:px-5 pb-8 pt-4 text-center lg:hidden">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span> · Never explain your medical history again.
        </p>
      </section>
    </div>
  );
};

export default AppHome;
