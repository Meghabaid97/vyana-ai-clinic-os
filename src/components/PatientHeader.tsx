import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, Leaf, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";

interface PatientHeaderProps {
  patientName: string;
  title?: string;
  subtitle?: string;
}

const PatientHeader = ({
  patientName,
  title,
  subtitle,
}: PatientHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnDashboard = location.pathname === "/patient-dashboard";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="border-b bg-gradient-to-r from-teal-500/10 via-background to-emerald-500/10 sticky top-0 z-10 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Vyana AI Logo as Home */}
          <Link
            to="/patient-dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-500/20 transition-all"
          >
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent hidden sm:inline">
              Vyana AI
            </span>
          </Link>
          {!isOnDashboard && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              {title || patientName}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle || "My Health Portal"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Eco indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">100% Digital</span>
          </div>
          <NotificationBell />
          <Button variant="default" size="sm" onClick={() => navigate("/patient-profile")} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
            Profile
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
