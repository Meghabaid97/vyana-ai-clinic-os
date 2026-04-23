import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home, TrendingUp, FolderOpen, Stethoscope, Shield, Heart, ArrowLeft, Sparkles, LogOut, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import LanguageSelector from "@/components/LanguageSelector";
import HeaderLocationSelector from "@/components/HeaderLocationSelector";
import AskVyanaModal from "@/components/AskVyanaModal";
import SpotlightTour, { hasSeenTour } from "@/components/SpotlightTour";

const tabs = [
  { id: "home", label: "Home", shortLabel: "Home", icon: Home, path: "/app" },
  { id: "claims", label: "Claims", shortLabel: "Claim", icon: Heart, path: "/app/recovery" },
  { id: "trends", label: "Trends", shortLabel: "Trnd", icon: TrendingUp, path: "/app/trends" },
  { id: "records", label: "Records", shortLabel: "Files", icon: FolderOpen, path: "/app/records" },
  { id: "briefing", label: "Briefing", shortLabel: "Brief", icon: Stethoscope, path: "/app/briefing" },
  { id: "emergency", label: "Emergency", shortLabel: "SOS", icon: Shield, path: "/app/emergency-contacts" },
];

// Sub-route titles (routes inside /app that aren't a primary tab)
const subRouteTitles: Record<string, string> = {
  "/app/timeline": "Timeline",
  "/app/vaccinations": "Vaccinations",
  "/app/medications": "Medications",
  "/app/prescription-reader": "Prescription Reader",
  "/app/share": "Share Records",
  "/app/story": "Our Story",
  "/app/support": "Help & Support",
  "/app/medical-history": "Medical History",
  "/app/emergency-contacts": "Emergency Contacts",
  "/app/visit": "Doctor Visit Mode",
};

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Patient");
  const [location_, setLocation_] = useState<{ pincode: string | null; city: string | null }>({ pincode: null, city: null });
  const [askOpen, setAskOpen] = useState(false);
  const [askInitial, setAskInitial] = useState("");
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-open the spotlight tour on first /app HOME visit only
  useEffect(() => {
    if (hasSeenTour()) return;
    if (location.pathname !== "/app") return;
    const t = window.setTimeout(() => setTourOpen(true), 800);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const loadPatient = async (userId: string) => {
      const { data } = await supabase.from("patients").select("name, pincode, city").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (data) {
        setPatientName(data.name);
        setLocation_({ pincode: data.pincode, city: data.city });
      }
      await supabase.from("patients").update({ last_app_open_at: new Date().toISOString() }).eq("user_id", userId);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) {
        void loadPatient(session.user.id);
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

  const activeTab = tabs.find(t =>
    t.path === "/app"
      ? location.pathname === "/app"
      : location.pathname.startsWith(t.path)
  )?.id || "home";

  const tabPaths = new Set(tabs.map((t) => t.path));
  const isSubRoute = !tabPaths.has(location.pathname) && location.pathname.startsWith("/app");
  const subTitle = subRouteTitles[location.pathname];

  const firstName = patientName.split(" ")[0];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background flex flex-col">
      {/* ============ MOBILE TOP BAR (hidden on lg+) ============ */}
      <header className="lg:hidden bg-background/95 border-b border-border sticky top-0 z-50 safe-area-top backdrop-blur-sm">
        <div className="px-4 sm:px-5 h-12 sm:h-14 flex items-center justify-between gap-2">
          {isSubRoute ? (
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/app"))}
              aria-label="Go back"
              className="-ml-1 inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-display text-lg truncate">{subTitle || "Back"}</span>
            </button>
          ) : (
            <span className="font-display text-2xl text-foreground tracking-tight leading-none">
              V<span className="text-primary italic">yana</span>
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setAskInitial(""); setAskOpen(true); }}
              aria-label="Ask Vyana"
              className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-primary transition-colors"
            >
              <Sparkles className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTourOpen(true)}
              aria-label="Take the tour"
              className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <NotificationBell />
            <button
              onClick={() => navigate("/app/profile")}
              aria-label="Profile"
              className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary hover:bg-primary/25 transition-colors"
            >
              {firstName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
        {/* Secondary row — location + language (mobile) */}
        <div className="px-4 sm:px-5 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <HeaderLocationSelector pincode={location_.pincode} city={location_.city} onLocationChange={handleLocationChange} />
          <LanguageSelector />
        </div>
      </header>

      {/* ============ DESKTOP TOP BAR (lg+) — Amazon-style full-width ============ */}
      <header className="hidden lg:block bg-background border-b border-border sticky top-0 z-50">
        {/* Primary row */}
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
          <button
            onClick={() => navigate("/app")}
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
            <NotificationBell />
            <button
              onClick={() => navigate("/app/profile")}
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
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
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
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/app"))}
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

      {/* ============ MOBILE BOTTOM TAB BAR (hidden on lg+) ============ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border z-50 safe-area-bottom backdrop-blur-sm">
        <div className="grid grid-cols-6 items-center h-14 sm:h-16 max-w-lg mx-auto px-0.5 sm:px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tour={`nav-${tab.id}`}
                onClick={() => navigate(tab.path)}
                aria-label={tab.label}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-0.5 sm:gap-1 h-full rounded-xl px-0.5 sm:px-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", isActive && "stroke-[2.5]")} />
                <span className="hidden min-[361px]:block truncate text-[10px] font-medium leading-none">{tab.label}</span>
                <span className="block min-[361px]:hidden truncate text-[9px] font-medium leading-none">{tab.shortLabel}</span>
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
            <button onClick={() => navigate("/app/support")} className="hover:text-foreground transition-colors">Support</button>
            <button onClick={() => navigate("/legal")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/why-vyana")} className="hover:text-foreground transition-colors">Our story</button>
          </div>
        </div>
      </footer>
      <AskVyanaModal open={askOpen} initialQuestion={askInitial} onClose={() => setAskOpen(false)} />
      <SpotlightTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
};

export default AppShell;
