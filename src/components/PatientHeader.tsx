import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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
    <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Vyana AI Logo - Home */}
          <Link
            to="/patient-dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:scale-105 transition-all">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold text-gradient">
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
          {/* Digital indicator */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">100% Digital</span>
          </div>
          <NotificationBell />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/patient-profile")} 
          >
            Profile
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;