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

const PatientHeader = ({ patientName, title, subtitle }: PatientHeaderProps) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ pincode: string | null; city: string | null }>({ pincode: null, city: null });

  useEffect(() => { loadLocation(); }, []);

  const loadLocation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("patients").select("pincode, city").eq("user_id", session.user.id).maybeSingle();
    if (data) setLocation({ pincode: data.pincode, city: data.city });
  };

  const handleLocationChange = async (newLocation: { pincode: string; city: string; latitude?: number; longitude?: number }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("patients").update({ pincode: newLocation.pincode, city: newLocation.city, latitude: newLocation.latitude || null, longitude: newLocation.longitude || null }).eq("user_id", session.user.id);
    setLocation({ pincode: newLocation.pincode, city: newLocation.city });
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link to="/app" className="font-semibold text-foreground">Vyana</Link>
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/patient-profile")}>Profile</Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;
