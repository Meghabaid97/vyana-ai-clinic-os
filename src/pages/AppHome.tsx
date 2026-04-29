import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Upload, UserCog, X, UserCircle2 } from "lucide-react";
import DashboardBriefingHero from "@/components/dashboard/DashboardBriefingHero";
import LatestVitalsStrip from "@/components/dashboard/LatestVitalsStrip";
import TrustReassuranceStrip from "@/components/dashboard/TrustReassuranceStrip";
import JournalQuickLog from "@/components/journal/JournalQuickLog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();

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
  // Soft nudge for missing profile fields (name, phone, DOB, ABHA).
  const profileIncomplete = !!profile && (!profile.name || !profile.phone || !profile.date_of_birth || !profile.national_health_id);
  const showProfileBanner = profileIncomplete && !bannerDismissed && !requiredOpen;

  const dismissBanner = () => {
    localStorage.setItem(PROFILE_BANNER_DISMISSED_KEY, "1");
    setBannerDismissed(true);
  };

  return (
    <div className="animate-fade-in overflow-x-hidden pb-2 lg:overflow-x-visible">
      {/* Mandatory profile capture — name + phone before using the app */}
      <Dialog open={requiredOpen} onOpenChange={setRequiredOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
              <UserCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>{t("home.required.title")}</DialogTitle>
            <DialogDescription>
              {t("home.required.desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="req-name">{t("home.required.fullName")}</Label>
              <Input id="req-name" value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="e.g. Megha Baid" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="req-phone">{t("home.required.phone")}</Label>
              <Input id="req-phone" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="+91 98765 43210" inputMode="tel" maxLength={20} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveRequired} disabled={savingRequired} className="w-full">
              {savingRequired ? t("home.required.saving") : t("home.required.save")}
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
                {t("home.banner.title")}
              </p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">
                {t("home.banner.body")}
              </p>
            </div>
            <button
              onClick={() => navigate("/app/profile")}
              className="text-[12px] font-medium text-primary hover:underline whitespace-nowrap px-2"
            >
              {t("home.banner.complete")}
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

      {/* ============ HERO BAND — bento on lg+ (briefing 4 / welcome 2) ============ */}
      {/* Doctor-visit briefing is the wedge — give it the dominant tile. */}
      <div className="lg:grid lg:grid-cols-6 lg:gap-5 lg:auto-rows-min">
        {/* Soft opener — warm "letter" tile on the side */}
        <section className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 lg:col-span-2 lg:order-1 lg:px-6 lg:pt-5 lg:pb-5 lg:rounded-3xl lg:border lg:border-border/70 lg:bg-gradient-to-br lg:from-card lg:via-card lg:to-primary/5 lg:flex lg:flex-col lg:justify-center lg:relative lg:overflow-hidden">
          {/* tiny accent bar — desktop only */}
          <div className="hidden lg:block absolute left-0 top-5 h-8 w-1 rounded-r-full bg-gradient-to-b from-primary to-primary/40" />
          <div className="max-w-sm md:max-w-xl lg:max-w-none relative">
            <p className="text-[10.5px] sm:text-xs font-medium tracking-[0.18em] uppercase text-primary mb-1.5 sm:mb-2 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {t("home.welcomeBack", { name: firstName })}
            </p>
            <h1 className="text-[20px] sm:text-[24px] md:text-[26px] lg:text-[24px] xl:text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-foreground">
              {t("home.h1.l1")}{" "}
              <span className="block bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                {t("home.h1.l2")}
              </span>
            </h1>
            <p className="mt-1.5 sm:mt-2 lg:mt-2 max-w-[34ch] md:max-w-[42ch] lg:max-w-[28ch] text-[12.5px] sm:text-[13px] lg:text-[13px] text-muted-foreground leading-snug">
              {t("home.subtitle")}
            </p>
          </div>
        </section>

        <div className="lg:col-span-4 lg:order-2 lg:pb-0" data-tour="briefing-hero">
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

        {/* ABHA prompt — desktop only, fills the right column beside vitals */}
        {!profile?.national_health_id && (
          <section className="px-4 sm:px-5 pb-5 lg:col-span-2 lg:px-0 lg:pb-0 lg:self-start">
            <div className="hidden lg:block rounded-xl p-4 border border-primary/20 bg-primary/5">
              <h3 className="font-bold text-sm text-foreground">{t("home.abha.title")}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
                {t("home.abha.body")}
              </p>
            </div>
          </section>
        )}

        {/* Story so far — full width below vitals row */}
        <section className="px-4 sm:px-6 pb-5 lg:col-span-6 lg:px-0 lg:pb-0">
            <h2 className="mb-1 text-[17px] sm:text-xl md:text-2xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
              <span className="block sm:inline">{t("home.story.title.l1")}</span>{" "}
              <span className="block sm:inline text-primary">{t("home.story.title.l2")}</span>
            </h2>
            <p className="text-[12.5px] sm:text-[13.5px] lg:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed max-w-[58ch]">
              {t("home.story.subtitle")}
            </p>

            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-1 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {[
                { emoji: "🏥", title: t("home.story.beat1.title"), text: t("home.story.beat1.text") },
                { emoji: "📋", title: t("home.story.beat2.title"), text: t("home.story.beat2.text") },
                { emoji: "⏰", title: t("home.story.beat3.title"), text: t("home.story.beat3.text") },
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
                    <p className="font-semibold text-sm text-foreground">{t("home.uploadFirst.title")}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{t("home.uploadFirst.sub")}</p>
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
                            {t("home.records.eyebrow")}
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
                            {totalRecords !== 1 ? t("home.records.heldPlural") : t("home.records.held")}
                          </span>
                        </div>
                        <p className="mt-2 text-[12.5px] sm:text-[13px] text-foreground/80 leading-relaxed">
                          {t("home.records.tagline")}
                        </p>
                      </div>

                      {/* Stat tiles */}
                      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/30">
                        <div className="px-2 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground">{t("home.records.first")}</p>
                          <p className="mt-0.5 text-[12px] sm:text-sm font-semibold text-foreground truncate">{firstDate}</p>
                        </div>
                        <div className="px-2 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground">{t("home.records.latest")}</p>
                          <p className="mt-0.5 text-[12px] sm:text-sm font-semibold text-foreground truncate">{lastDate}</p>
                        </div>
                        <div className="px-2 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground">{t("home.records.activeDays")}</p>
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
              <h2 className="text-[15px] sm:text-base lg:text-lg font-bold text-foreground mb-1.5 sm:mb-2">{t("home.why.title")}</h2>
              <p className="text-[13px] sm:text-[14px] text-foreground leading-relaxed">
                {t("home.why.body1")}
              </p>
              <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed mt-2 sm:mt-3">
                {t("home.why.body2")}
              </p>
            </div>
            <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12.5px] sm:text-[13px] font-semibold text-foreground">{t("home.why.cta.title")}</p>
                <p className="text-[10.5px] sm:text-[11px] text-muted-foreground">{t("home.why.cta.sub")}</p>
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
              <h3 className="font-bold text-sm text-foreground">{t("home.abha.title")}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-1">
                {t("home.abha.body")}
              </p>
            </div>
          </section>
        )}
      </div>

      <section className="px-4 sm:px-5 pb-3 pt-3 text-center lg:hidden">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span> · {t("home.bottom.tagline")}
        </p>
      </section>
    </div>
  );
};

export default AppHome;
