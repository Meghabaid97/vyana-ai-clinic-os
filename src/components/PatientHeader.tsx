import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";
import HeaderLocationSelector from "./HeaderLocationSelector";
import LanguageSelector from "./LanguageSelector";

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
  const [location, setLocation] = useState<{ pincode: string | null; city: string | null }>({
    pincode: null,
    city: null,
  });

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("patients")
      .select("pincode, city")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      setLocation({ pincode: data.pincode, city: data.city });
    }
  };

  const handleLocationChange = async (newLocation: { pincode: string; city: string; latitude?: number; longitude?: number }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("patients")
      .update({
        pincode: newLocation.pincode,
        city: newLocation.city,
        latitude: newLocation.latitude || null,
        longitude: newLocation.longitude || null,
      })
      .eq("user_id", session.user.id);

    setLocation({ pincode: newLocation.pincode, city: newLocation.city });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Vyana Logo - Home */}
          <Link
            to="/patient-dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:scale-105 transition-all">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold text-gradient">
              Vyana
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
          <LanguageSelector />
          {/* Location Selector */}
          <HeaderLocationSelector
            pincode={location.pincode}
            city={location.city}
            onLocationChange={handleLocationChange}
          />
          
          {/* Digital indicator */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
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