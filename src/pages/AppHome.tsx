import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Upload, Link2, Shield, UserCog, X, UserCircle2 } from "lucide-react";
import DashboardBriefingHero from "@/components/dashboard/DashboardBriefingHero";
import LatestVitalsStrip from "@/components/dashboard/LatestVitalsStrip";
import TrustReassuranceStrip from "@/components/dashboard/TrustReassuranceStrip";
import JournalQuickLog from "@/components/journal/JournalQuickLog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  national_health_id: string | null;
  phone: string | null;
  date_of_birth: string | null;
}

const PROFILE_BANNER_DISMISSED_KEY = "vyana-profile-banner-dismissed";

const AppHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [recordDates, setRecordDates] = useState<string[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() =>
    typeof window !== "undefined" && localStorage.getItem(PROFILE_BANNER_DISMISSED_KEY) === "1"
  );
  const [requiredOpen, setRequiredOpen] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [savingRequired, setSavingRequired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    void loadData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void loadData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: p } = await supabase
      .from("patients").select("*")
      .eq("user_id", session.user.id).maybeSingle();

    // No patient row yet → still prompt for required fields so we can create it.
    if (!p) {
      setReqName("");
      setReqPhone("");
      setRequiredOpen(true);
      return;
    }
    setProfile(p);

    // Mandatory: name + phone. ABHA + DOB are soft nudges only.
    const missingRequired = !p.name?.trim() || !p.phone?.trim();
    if (missingRequired) {
      setReqName(p.name || "");
      setReqPhone(p.phone || "");
      setRequiredOpen(true);
    }

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

  const saveRequired = async () => {
    const name = reqName.trim();
    const phone = reqPhone.trim();
    if (name.length < 2) { toast({ title: "Please enter your full name", variant: "destructive" }); return; }
    if (!/^[+0-9 ()-]{7,20}$/.test(phone)) { toast({ title: "Please enter a valid phone number", variant: "destructive" }); return; }
    setSavingRequired(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSavingRequired(false); return; }
    let saveError: { message: string } | null = null;
    if (profile) {
      const { error } = await supabase.from("patients").update({ name, phone }).eq("id", profile.id);
      saveError = error;
      if (!error) setProfile({ ...profile, name, phone });
    } else {
      const { data, error } = await supabase
        .from("patients")
        .insert({ user_id: session.user.id, name, phone })
        .select("*")
        .maybeSingle();
      saveError = error;
      if (!error && data) setProfile(data as PatientProfile);
    }
    setSavingRequired(false);
    if (saveError) { toast({ title: "Could not save", description: saveError.message, variant: "destructive" }); return; }
    setRequiredOpen(false);
    toast({ title: "Profile saved", description: "You can add more details anytime." });
    void loadData();
  };

  const firstName = profile?.name?.split(" ")[0] || "there";
  const totalRecords = recordCount + consultationCount;
  const hasRecords = totalRecords > 0;
  // Soft nudge for the optional-but-recommended fields (DOB + ABHA).
  const profileIncomplete = !!profile && (!profile.date_of_birth || !profile.national_health_id);
  const showProfileBanner = profileIncomplete && !bannerDismissed && !requiredOpen;

  const dismissBanner = () => {
    localStorage.setItem(PROFILE_BANNER_DISMISSED_KEY, "1");
    setBannerDismissed(true);
  };

  return (
    <div className="animate-fade-in overflow-x-hidden pb-2 lg:overflow-x-visible">
      {/* Mandatory profile capture — name + phone before using the app */}
      <Dialog open={requiredOpen} onOpenChange={(open) => { if (!open && !profile?.phone) return; setRequiredOpen(open); }}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
              <UserCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Finish your profile</DialogTitle>
            <DialogDescription>
              We just need your name and phone to keep your records connected to you. You can add ABHA ID and other details anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="req-name">Full name</Label>
              <Input id="req-name" value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="e.g. Megha Baid" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="req-phone">Phone number</Label>
              <Input id="req-phone" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="+91 98765 43210" inputMode="tel" maxLength={20} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveRequired} disabled={savingRequired} className="w-full">
              {savingRequired ? "Saving..." : "Save and continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile completion nudge — soft banner for optional fields (DOB, ABHA) */}
      {showProfileBanner && (
        <div className="px-4 sm:px-5 pt-4 pb-2 lg:px-0 lg:pb-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <UserCog className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-foreground leading-tight">
                Finish setting up your profile
              </p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">
                Add your date of birth and ABHA ID so we can personalize your care.
              </p>
            </div>
            <button
              onClick={() => navigate("/app/profile")}
              className="text-[12px] font-medium text-primary hover:underline whitespace-nowrap px-2"
            >
              Complete →
            </button>
            <button
              onClick={dismissBanner}
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground p-1 -mr-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============ HERO BAND — bento on lg+ (welcome 4 / briefing 2) ============ */}
      <div className="lg:grid lg:grid-cols-6 lg:gap-5 lg:auto-rows-min">
        {/* Soft opener — wider tile */}
        <section className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 lg:col-span-4 lg:px-6 lg:pt-7 lg:pb-7 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:flex lg:flex-col lg:justify-center">
          <div className="max-w-sm md:max-w-xl lg:max-w-none">
            <p className="text-[10.5px] sm:text-xs font-medium tracking-[0.18em] uppercase text-primary mb-2 sm:mb-3">
              Welcome back, {firstName}
            </p>
            <h1 className="text-[26px] sm:text-[32px] md:text-[38px] lg:text-[44px] xl:text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
              Your health story.{" "}
              <span className="block text-primary">Always with you.</span>
            </h1>
            <p className="mt-2 sm:mt-3 lg:mt-4 max-w-[34ch] md:max-w-[42ch] lg:max-w-[48ch] text-[13px] sm:text-[14px] lg:text-base text-muted-foreground leading-relaxed">
              Never explain your medical history again. Doctor-ready in 30 seconds.
            </p>
          </div>
        </section>

        <div className="lg:col-span-2 lg:pb-0" data-tour="briefing-hero">
          <DashboardBriefingHero hasRecords={hasRecords} />
        </div>
      </div>

      {/* ============ BENTO BODY — varied tile sizes on lg+ ============ */}
      <div className="lg:grid lg:grid-cols-6 lg:gap-5 lg:mt-5 lg:auto-rows-min">
        {/* Health Journal quick log */}
        <div className="lg:col-span-6">
          <JournalQuickLog patientId={profile?.id ?? null} />
        </div>

        {/* Latest vitals — 4 cols on desktop, with quick actions beside */}
        <div className="lg:col-span-4">
          <LatestVitalsStrip patientId={profile?.id ?? null} />
        </div>

        {/* Quick actions — Share + Emergency, sit beside vitals on desktop */}
        <section className="px-4 sm:px-5 pb-5 lg:col-span-2 lg:px-0 lg:pb-0 lg:self-start">
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
              data-tour="emergency-quick-action"
              onClick={() => navigate("/app/emergency-contacts")}
              className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-left hover:border-primary/30 transition-colors min-w-0"
            >
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[12.5px] lg:text-sm font-medium text-foreground truncate">Emergency access</span>
            </button>
          </div>

          {/* ABHA prompt — desktop only, fills the right column under quick actions */}
          {!profile?.national_health_id && (
            <div className="mt-4 hidden lg:block rounded-xl p-4 border border-primary/20 bg-primary/5">
              <h3 className="font-bold text-sm text-foreground">Connect your ABHA Health ID</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
                Link your national health ID and every consultation across providers connects automatically.
              </p>
            </div>
          )}
        </section>

        {/* Story so far — full width below vitals row */}
        <section className="px-4 sm:px-6 pb-5 lg:col-span-6 lg:px-0 lg:pb-0">
            <h2 className="mb-1 text-[17px] sm:text-xl md:text-2xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
              <span className="block sm:inline">Your story so far.</span>{" "}
              <span className="block sm:inline text-primary">Every detail matters.</span>
            </h2>
            <p className="text-[12.5px] sm:text-[13.5px] lg:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed max-w-[58ch]">
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

            <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
              {totalRecords === 0 ? (
                <button onClick={() => navigate("/app/records")} className="group flex items-center gap-3 w-full min-w-0 p-4 text-left hover:bg-primary/5 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground">Upload your first record</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Your story starts here.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                (() => {
                  // Compute friendly stats
                  const firstDate = recordDates[0];
                  const lastDate = recordDates[recordDates.length - 1];
                  const uniqueDays = new Set(recordDates).size;
                  return (
                    <button
                      onClick={() => navigate("/app/records")}
                      className="group block w-full text-left"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          </span>
                          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                            Your story so far
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>

                      {/* Big number */}
                      <div className="px-4 sm:px-5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[40px] sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-none">
                            {totalRecords}
                          </span>
                          <span className="text-[14px] sm:text-base font-medium text-muted-foreground">
                            record{totalRecords !== 1 ? "s" : ""} held
                          </span>
                        </div>
                        <p className="mt-2 text-[12.5px] sm:text-[13px] text-foreground/80 leading-relaxed">
                          Every detail you save is one less question your next doctor has to ask.
                        </p>
                      </div>

                      {/* Stat tiles */}
                      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/30">
                        <div className="px-2 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground">First</p>
                          <p className="mt-0.5 text-[12px] sm:text-sm font-semibold text-foreground truncate">{firstDate}</p>
                        </div>
                        <div className="px-2 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground">Latest</p>
                          <p className="mt-0.5 text-[12px] sm:text-sm font-semibold text-foreground truncate">{lastDate}</p>
                        </div>
                        <div className="px-2 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground">Active days</p>
                          <p className="mt-0.5 text-[12px] sm:text-sm font-semibold text-primary">{uniqueDays}</p>
                        </div>
                      </div>
                    </button>
                  );
                })()
              )}
            </div>
          </section>

        {/* Trust & privacy — full-width band below the Story+QuickActions row */}
        <div data-tour="trust-strip" className="lg:col-span-6">
          <TrustReassuranceStrip />
        </div>

        {/* Why Vyana — narrative tile (4 cols) */}
        <section className="px-4 sm:px-6 pb-5 lg:col-span-4 lg:px-0 lg:pb-0">
          <div className="rounded-xl border border-border overflow-hidden h-full flex flex-col">
            <div className="bg-primary/5 p-4 sm:p-5 flex-1">
              <h2 className="text-[15px] sm:text-base lg:text-lg font-bold text-foreground mb-1.5 sm:mb-2">Why Vyana?</h2>
              <p className="text-[13px] sm:text-[14px] text-foreground leading-relaxed">
                In 2005, in a small hospital in Tirupur, a family lost someone they loved. Not because the doctors didn't care. Because no one had the records. No history. No context. Just five desperate minutes to explain a lifetime.
              </p>
              <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed mt-2 sm:mt-3">
                Vyana exists so that never happens again. Not to your family. Not to anyone's.
              </p>
            </div>
            <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12.5px] sm:text-[13px] font-semibold text-foreground">Read our full story</p>
                <p className="text-[10.5px] sm:text-[11px] text-muted-foreground">The promise behind the product.</p>
              </div>
              <button
                onClick={() => navigate("/why-vyana")}
                aria-label="Read our story"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary flex items-center justify-center shrink-0"
              >
                <ArrowRight className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </section>

        {/* ABHA — mobile-only standalone tile (desktop version sits inside Quick Actions column) */}
        {!profile?.national_health_id && (
          <section className="px-4 sm:px-5 pb-5 lg:hidden">
            <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 h-full">
              <h3 className="font-bold text-sm text-foreground">Connect your ABHA Health ID</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
                Link your national health ID and every consultation across providers connects automatically.
              </p>
            </div>
          </section>
        )}
      </div>

      <section className="px-4 sm:px-5 pb-3 pt-3 text-center lg:hidden">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span> · Never explain your medical history again.
        </p>
      </section>
    </div>
  );
};

export default AppHome;
