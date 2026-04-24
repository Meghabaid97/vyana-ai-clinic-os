import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home, TrendingUp, FolderOpen, Stethoscope, Shield, Heart, ArrowLeft, Sparkles, LogOut, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useViewTransitionNavigate } from "@/hooks/use-view-transition-navigate";
import NotificationBell from "@/components/NotificationBell";
import { useLanguage } from "@/lib/i18n";

const LanguageSelector = lazy(() => import("@/components/LanguageSelector"));
const HeaderLocationSelector = lazy(() => import("@/components/HeaderLocationSelector"));
const AskVyanaModal = lazy(() => import("@/components/AskVyanaModal"));
const HowItWorksTour = lazy(() => import("@/components/HowItWorksTour"));

const TOUR_STORAGE_KEY = "vyana-tour-completed-v1";
const hasSeenTour = () => typeof window !== "undefined" && localStorage.getItem(TOUR_STORAGE_KEY) === "1";
const markTourSeen = () => { if (typeof window !== "undefined") localStorage.setItem(TOUR_STORAGE_KEY, "1"); };

const buildTabs = (t: (k: string, p?: any) => string) => [
  { id: "home", label: t("app.tab.home"), shortLabel: t("app.tabShort.home"), icon: Home, path: "/app" },
  { id: "briefing", label: t("app.tab.briefing"), shortLabel: t("app.tabShort.briefing"), icon: Stethoscope, path: "/app/briefing" },
  { id: "trends", label: t("app.tab.trends"), shortLabel: t("app.tabShort.trends"), icon: TrendingUp, path: "/app/trends" },
  { id: "records", label: t("app.tab.records"), shortLabel: t("app.tabShort.records"), icon: FolderOpen, path: "/app/records" },
  { id: "claims", label: t("app.tab.claims"), shortLabel: t("app.tabShort.claims"), icon: Heart, path: "/app/recovery" },
  { id: "profile", label: t("app.tab.profile"), shortLabel: t("app.tabShort.profile"), icon: User, path: "/app/profile" },
];

const buildDesktopTabs = (t: (k: string, p?: any) => string) => {
  const base = buildTabs(t);
  return [
    ...base.slice(0, 5),
    { id: "emergency", label: t("app.tab.emergency"), shortLabel: t("app.tabShort.emergency"), icon: Shield, path: "/app/emergency-contacts" },
  ];
};

const buildSubRouteTitles = (t: (k: string, p?: any) => string): Record<string, string> => ({
  "/app/timeline": t("app.sub.timeline"),
  "/app/vaccinations": t("app.sub.vaccinations"),
  "/app/medications": t("app.sub.medications"),
  "/app/prescription-reader": t("app.sub.prescriptionReader"),
  "/app/share": t("app.sub.share"),
  "/app/story": t("app.sub.story"),
  "/app/support": t("app.sub.support"),
  "/app/medical-history": t("app.sub.medicalHistory"),
  "/app/emergency-contacts": t("app.sub.emergencyContacts"),
  "/app/visit": t("app.sub.visit"),
  "/app/journal": t("app.sub.journal"),
});

const AppShell = () => {
  const navigate = useNavigate();
  const vtNavigate = useViewTransitionNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const tabs = buildTabs(t);
  const desktopTabs = buildDesktopTabs(t);
  const subRouteTitles = buildSubRouteTitles(t);
  const [patientName, setPatientName] = useState("Patient");
  const [location_, setLocation_] = useState<{ pincode: string | null; city: string | null }>({ pincode: null, city: null });
  const [askOpen, setAskOpen] = useState(false);
  const [askInitial, setAskInitial] = useState("");
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-launch the spotlight tour once per device on first visit to /app.
  // Manual replay is always available via the help (?) button in the top bar.
  useEffect(() => {
    if (hasSeenTour()) return;
    if (location.pathname !== "/app") return;
    const t = window.setTimeout(() => setTourOpen(true), 800);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    let loadedForUser: string | null = null;

    const loadPatient = async (userId: string) => {
      // Dedupe: skip if we've already loaded for this user in this mount
      if (loadedForUser === userId) return;
      loadedForUser = userId;

      const { data } = await supabase
        .from("patients")
        .select("name, pincode, city")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPatientName(data.name);
        setLocation_({ pincode: data.pincode, city: data.city });
      }
      // Fire-and-forget: don't await, don't block UI
      void supabase
        .from("patients")
        .update({ last_app_open_at: new Date().toISOString() })
        .eq("user_id", userId);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // Only react to real sign-in events, not every token refresh / tab focus
      if (event === "SIGNED_IN" && session) {
        void loadPatient(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        loadedForUser = null;
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        void loadPatient(session.user.id);
      } else {
        setTimeout(async () => {
          if (cancelled) return;
          const { data: { session: retry } } = await supabase.auth.getSession();
          if (cancelled) return;
          if (!retry) navigate("/auth", { replace: true });
        }, 400);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Union of all tab paths (mobile + desktop) so /app/profile and /app/emergency-contacts
  // both resolve to a primary route and don't render the back-arrow header.
  const allTabs = [...tabs, ...desktopTabs.filter(d => !tabs.some(t => t.id === d.id))];
  const activeTab = allTabs.find(t =>
    t.path === "/app"
      ? location.pathname === "/app"
      : location.pathname.startsWith(t.path)
  )?.id || "home";

  const tabPaths = new Set(allTabs.map((t) => t.path));
  const isSubRoute = !tabPaths.has(location.pathname) && location.pathname.startsWith("/app");
  const subTitle = subRouteTitles[location.pathname];

  // Title for mobile top bar when on a primary tab
  const activeTabLabel = allTabs.find((t) => t.id === activeTab)?.label;

  const firstName = patientName.split(" ")[0];

  const handleSignOut = async () => {
    const { signOutFully } = await import("@/lib/signOut");
    await signOutFully();
    navigate("/auth", { replace: true });
  };

  const handleLocationChange = async (newLocation: { pincode: string; city: string; latitude?: number; longitude?: number }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("patients").update({
      pincode: newLocation.pincode,
      city: newLocation.city,
      latitude: newLocation.latitude ?? null,
      longitude: newLocation.longitude ?? null,
    }).eq("user_id", session.user.id);
    setLocation_({ pincode: newLocation.pincode, city: newLocation.city });
  };

  return (
    <div className="aurora-warm-soft min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background flex flex-col">
      {/* ============ MOBILE TOP BAR (hidden on lg+) — iOS-native proportions ============ */}
      <header className="lg:hidden bg-background/85 border-b border-border/60 sticky top-0 z-50 safe-area-top backdrop-blur-xl">
        <div className="px-3 h-11 flex items-center justify-between gap-1.5">
          {/* LEFT — back on sub-routes, page title on tab roots */}
          <div className="flex items-center min-w-0 flex-1">
            {isSubRoute ? (
              <button
                onClick={() => (window.history.length > 1 ? vtNavigate(-1) : vtNavigate("/app"))}
                aria-label="Go back"
                className="-ml-1.5 inline-flex items-center gap-0.5 h-9 px-1.5 rounded-lg text-primary active:bg-muted transition-colors min-w-0"
              >
                <ArrowLeft className="h-[22px] w-[22px] shrink-0" strokeWidth={2.25} />
                <span className="text-[17px] font-normal truncate">{subTitle || "Back"}</span>
              </button>
            ) : (
              <h1 className="text-[17px] font-semibold text-foreground tracking-tight truncate px-1">
                {activeTabLabel || "Vyana"}
              </h1>
            )}
          </div>

          {/* RIGHT — compact icon cluster (iOS 24pt standard) */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => { setAskInitial(""); setAskOpen(true); }}
              aria-label="Ask Vyana"
              className="h-9 w-9 rounded-full active:bg-muted flex items-center justify-center text-primary transition-colors"
            >
              <Sparkles className="h-[20px] w-[20px]" />
            </button>
            <button
              onClick={() => setTourOpen(true)}
              aria-label="Take the tour"
              className="h-9 w-9 rounded-full active:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            >
              <HelpCircle className="h-[20px] w-[20px]" />
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ============ DESKTOP TOP BAR (lg+) — Amazon-style full-width ============ */}
      <header className="hidden lg:block bg-background border-b border-border sticky top-0 z-50">
        {/* Primary row */}
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
          <button
            onClick={() => vtNavigate("/app")}
            className="font-display text-3xl text-foreground tracking-tight leading-none shrink-0"
            aria-label="Vyana home"
          >
            V<span className="text-primary italic">yana</span>
          </button>

          {/* Ask Vyana — grounded medical Q&A */}
          <div className="flex-1 max-w-2xl">
            <button
              onClick={() => { setAskInitial(""); setAskOpen(true); }}
              className="group w-full h-10 pl-4 pr-3 rounded-full border border-border bg-muted/40 hover:bg-background hover:border-primary/40 hover:shadow-sm flex items-center gap-3 text-left transition-all"
            >
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 text-sm text-muted-foreground truncate">
                Ask Vyana anything about your health…
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                Cited
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <HeaderLocationSelector pincode={location_.pincode} city={location_.city} onLocationChange={handleLocationChange} />
            <LanguageSelector />
            <button
              onClick={() => setTourOpen(true)}
              aria-label="Take the tour"
              className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
            </button>
            <NotificationBell />
            <button
              data-tour="nav-profile"
              onClick={() => vtNavigate("/app/profile")}
              className="flex items-center gap-2 rounded-full px-3 h-10 hover:bg-muted transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <div className="text-[10px] text-muted-foreground">Account</div>
                <div className="text-xs font-semibold text-foreground max-w-[8rem] truncate">{firstName}</div>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Secondary nav row */}
        <div className="border-t border-border bg-muted/30">
          <div className="max-w-[1400px] mx-auto px-6 h-11 flex items-center gap-1">
            {desktopTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tour={`nav-${tab.id}`}
                  onClick={() => vtNavigate(tab.path)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 h-8 rounded-full text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-route breadcrumb */}
        {isSubRoute && (
          <div className="border-t border-border">
            <div className="max-w-[1400px] mx-auto px-6 h-10 flex items-center gap-2">
              <button
                onClick={() => (window.history.length > 1 ? vtNavigate(-1) : vtNavigate("/app"))}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span className="text-muted-foreground/50 text-xs">/</span>
              <span className="text-xs font-semibold text-foreground">{subTitle || "Page"}</span>
            </div>
          </div>
        )}
      </header>

      {/* ============ CONTENT ============ */}
      {/* Mobile: full-bleed scroll. Desktop: centered max-width container */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto pb-20 lg:pb-10">
        <div className="w-full max-w-full lg:max-w-[1400px] lg:mx-auto lg:px-6 lg:py-6">
          <Outlet />
        </div>
      </main>

      {/* ============ MOBILE BOTTOM TAB BAR (hidden on lg+) — iOS-native 6-tab ============ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 border-t border-border/60 z-50 safe-area-bottom backdrop-blur-xl">
        <div className="grid grid-cols-6 items-stretch h-[54px] w-full max-w-full overflow-hidden">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tour={`nav-${tab.id}`}
                onClick={() => vtNavigate(tab.path)}
                aria-label={tab.label}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-[2px] h-full px-0 transition-colors active:bg-muted/40",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className={cn("h-[19px] w-[19px] shrink-0", isActive ? "stroke-[2.4]" : "stroke-[1.8]")} />
                <span className={cn(
                  "block w-full text-center truncate text-[10px] leading-none tracking-tight px-px",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============ DESKTOP FOOTER ============ */}
      <footer className="hidden lg:block border-t border-border bg-muted/30">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-display text-base text-foreground">
              V<span className="text-primary italic">yana</span>
            </span>
            <span>Never explain your medical history again.</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => vtNavigate("/app/support")} className="hover:text-foreground transition-colors">Support</button>
            <button onClick={() => vtNavigate("/legal")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => vtNavigate("/why-vyana")} className="hover:text-foreground transition-colors">Our story</button>
          </div>
        </div>
      </footer>
      <AskVyanaModal open={askOpen} initialQuestion={askInitial} onClose={() => setAskOpen(false)} />
      <Suspense fallback={null}>
        <HowItWorksTour
          open={tourOpen}
          onOpenChange={(o) => { setTourOpen(o); if (!o) markTourSeen(); }}
          onFinish={() => markTourSeen()}
        />
      </Suspense>
    </div>
  );
};

export default AppShell;
