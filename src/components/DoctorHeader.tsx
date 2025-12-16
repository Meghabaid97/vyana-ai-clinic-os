import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Leaf, Home, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";

interface DoctorHeaderProps {
  title: string;
  subtitle?: string;
  showSignOut?: boolean;
  showProfile?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const routeLabels: Record<string, string> = {
  "/doctor-dashboard": "Dashboard",
  "/consultation": "New Consultation",
  "/consultations": "Patients",
  "/doctor-appointments": "Appointments",
  "/shared-records": "Shared Records",
  "/doctor-profile-setup": "Profile",
};

const DoctorHeader = ({
  title,
  subtitle,
  showSignOut = false,
  showProfile = false,
  icon,
  actions,
}: DoctorHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isHome = currentPath === "/doctor-dashboard";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Build breadcrumb label
  const getBreadcrumbLabel = () => {
    if (currentPath.startsWith("/patient/")) {
      return "Patient Profile";
    }
    return routeLabels[currentPath] || title;
  };

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Breadcrumb integrated */}
          {!isHome && (
            <div className="flex items-center gap-2 mr-2">
              <Link
                to="/doctor-dashboard"
                className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {currentPath.startsWith("/patient/") && (
                <>
                  <Link
                    to="/consultations"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Patients
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </div>
          )}
          {icon && (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Eco indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">100% Digital</span>
          </div>
          <NotificationBell />
          {actions}
          {showProfile && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/doctor-profile-setup")}>
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
          )}
          {showSignOut && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorHeader;
