import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home, TrendingUp, FolderOpen, FileSearch, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { id: "home", label: "Home", shortLabel: "Home", icon: Home, path: "/app" },
  { id: "vaccines", label: "Vaccines", shortLabel: "Vax", icon: Shield, path: "/app/vaccinations" },
  { id: "trends", label: "Trends", shortLabel: "Trnd", icon: TrendingUp, path: "/app/trends" },
  { id: "records", label: "Records", shortLabel: "Files", icon: FolderOpen, path: "/app/records" },
  { id: "rx-reader", label: "Rx Reader", shortLabel: "Rx", icon: FileSearch, path: "/app/prescription-reader" },
  { id: "profile", label: "Profile", shortLabel: "Me", icon: User, path: "/app/profile" },
];

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState("Patient");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth", { replace: true }); return; }
      const { data } = await supabase.from("patients").select("name").eq("user_id", session.user.id).maybeSingle();
      if (data) setPatientName(data.name);
    };
    load();
  }, [navigate]);

  const activeTab = tabs.find(t =>
    t.path === "/app"
      ? location.pathname === "/app"
      : location.pathname.startsWith(t.path)
  )?.id || "home";

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Top bar */}
      <header className="bg-background/95 border-b border-border sticky top-0 z-50 safe-area-top backdrop-blur-sm">
        <div className="px-4 sm:px-5 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground tracking-tight">
            V<span className="text-primary">yana</span>
          </span>
          <span className="max-w-[7rem] truncate text-xs sm:text-sm text-muted-foreground">{patientName.split(" ")[0]}</span>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-24">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border z-50 safe-area-bottom backdrop-blur-sm">
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
  );
};

export default AppShell;
