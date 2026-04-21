import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home, TrendingUp, FolderOpen, Stethoscope, User, Heart, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";

const tabs = [
  { id: "home", label: "Home", shortLabel: "Home", icon: Home, path: "/app" },
  { id: "claims", label: "Claims", shortLabel: "Claim", icon: Heart, path: "/app/recovery" },
  { id: "trends", label: "Trends", shortLabel: "Trnd", icon: TrendingUp, path: "/app/trends" },
  { id: "records", label: "Records", shortLabel: "Files", icon: FolderOpen, path: "/app/records" },
  { id: "briefing", label: "Briefing", shortLabel: "Brief", icon: Stethoscope, path: "/app/briefing" },
  { id: "profile", label: "Profile", shortLabel: "Me", icon: User, path: "/app/profile" },
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
};

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Patient");

  useEffect(() => {
    let cancelled = false;

    const loadPatient = async (userId: string) => {
      const { data } = await supabase.from("patients").select("name").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (data) setPatientName(data.name);
      await supabase.from("patients").update({ last_app_open_at: new Date().toISOString() }).eq("user_id", userId);
    };

    // Subscribe first to avoid race with session hydration after redirect from /auth
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
        // Give Supabase a brief moment to hydrate before bouncing to /auth
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

  return (
    <div className="min-h-screen bg-muted/40 sm:bg-muted/60 flex justify-center overflow-x-hidden">
      {/* Phone-frame container: full-bleed on mobile, centered card on tablet/desktop */}
      <div className="relative w-full sm:max-w-[440px] min-h-screen bg-background sm:my-4 sm:rounded-[28px] sm:shadow-2xl sm:shadow-foreground/10 sm:border sm:border-border sm:overflow-hidden flex flex-col">
        {/* Top bar */}
        <header className="bg-background/95 border-b border-border sticky top-0 z-50 safe-area-top backdrop-blur-sm sm:rounded-t-[28px]">
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
              <NotificationBell />
              <span className="max-w-[7rem] truncate text-xs sm:text-sm text-muted-foreground">{patientName.split(" ")[0]}</span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto pb-20 sm:pb-24">
          <Outlet />
        </main>

        {/* Bottom tab bar: pinned to viewport on mobile, pinned to frame on desktop */}
        <nav className="fixed sm:absolute bottom-0 left-0 right-0 bg-background/95 border-t border-border z-50 safe-area-bottom backdrop-blur-sm sm:rounded-b-[28px]">
          <div className="grid grid-cols-6 items-center h-14 sm:h-16 max-w-lg mx-auto px-0.5 sm:px-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
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
      </div>
    </div>
  );
};

export default AppShell;
