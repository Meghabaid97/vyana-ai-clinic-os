import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Leaf } from "lucide-react";
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Vyana AI Logo - Home */}
          <Link
            to="/patient-dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
              <span className="text-sm font-bold text-white">V</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Vyana AI
            </span>
          </Link>
          
          {/* Page Title */}
          {title && (
            <>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Eco indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">100% Digital</span>
          </div>
          <NotificationBell />
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate("/patient-profile")} 
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
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
