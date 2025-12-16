import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Bell, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PatientHeaderProps {
  patientName: string;
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
  subtitle?: string;
}

const PatientHeader = ({
  patientName,
  showBackButton = false,
  backTo = "/patient-dashboard",
  title,
  subtitle,
}: PatientHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="border-b bg-gradient-to-r from-teal-500/10 via-background to-emerald-500/10 sticky top-0 z-10 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={() => navigate(backTo)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              {title || patientName}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle || "My Health Portal"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/patient-profile")}>
            <Settings className="h-4 w-4 mr-2" />
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
