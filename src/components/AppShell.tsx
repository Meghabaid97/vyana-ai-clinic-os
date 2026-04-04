import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Home, TrendingUp, FolderOpen, Calendar, User, BookOpen } from "lucide-react";

const tabs = [
  { id: "home", label: "Home", icon: Home, path: "/app" },
  { id: "trends", label: "Trends", icon: TrendingUp, path: "/app/trends" },
  { id: "records", label: "Records", icon: FolderOpen, path: "/app/records" },
  { id: "appointments", label: "Appts", icon: Calendar, path: "/app/appointments" },
  { id: "story", label: "Our Story", icon: BookOpen, path: "/app/story" },
  { id: "profile", label: "Profile", icon: User, path: "/app/profile" },
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-background border-b border-border sticky top-0 z-50 safe-area-top">
        <div className="px-5 h-12 flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground tracking-tight">
            V<span className="text-primary">yana</span>
          </span>
          <span className="text-sm text-muted-foreground">{patientName.split(" ")[0]}</span>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
