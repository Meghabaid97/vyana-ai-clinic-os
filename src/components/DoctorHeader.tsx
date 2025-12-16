import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DoctorBreadcrumb from "./DoctorBreadcrumb";

interface DoctorHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showSignOut?: boolean;
  showProfile?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const DoctorHeader = ({
  title,
  subtitle,
  showBackButton = true,
  showSignOut = false,
  showProfile = false,
  icon,
  actions,
}: DoctorHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <>
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/doctor-dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
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
          <div className="flex items-center gap-2">
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
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <DoctorBreadcrumb />
      </div>
    </>
  );
};

export default DoctorHeader;
