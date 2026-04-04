import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";
import HeaderLocationSelector from "./HeaderLocationSelector";
import LanguageSelector from "./LanguageSelector";

interface DoctorHeaderProps {
  title: string;
  subtitle?: string;
  showSignOut?: boolean;
  showProfile?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const DoctorHeader = ({ title, subtitle, showSignOut = false, showProfile = false, actions }: DoctorHeaderProps) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ pincode: string | null; city: string | null }>({ pincode: null, city: null });

  useEffect(() => { loadLocation(); }, []);

  const loadLocation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("doctor_profiles").select("pincode, city").eq("user_id", session.user.id).maybeSingle();
    if (data) setLocation({ pincode: data.pincode, city: data.city });
  };

  const handleLocationChange = async (newLocation: { pincode: string; city: string; latitude?: number; longitude?: number }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("doctor_profiles").update({ pincode: newLocation.pincode, city: newLocation.city, latitude: newLocation.latitude || null, longitude: newLocation.longitude || null }).eq("user_id", session.user.id);
    setLocation({ pincode: newLocation.pincode, city: newLocation.city });
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  return (
    <div className="bg-background border-b border-border sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link to="/doctor-dashboard" className="font-semibold text-foreground">Vyana</Link>
          {title && (
            <>
              <span className="text-border">/</span>
              <div>
                <h1 className="text-sm font-medium text-foreground">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <HeaderLocationSelector pincode={location.pincode} city={location.city} onLocationChange={handleLocationChange} />
          <NotificationBell />
          {actions}
          {showProfile && <Button size="sm" onClick={() => navigate("/doctor-profile-setup")}>Profile</Button>}
          {showSignOut && <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>}
        </div>
      </div>
    </div>
  );
};

export default DoctorHeader;
