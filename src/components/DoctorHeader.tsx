import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";
import HeaderLocationSelector from "./HeaderLocationSelector";

interface DoctorHeaderProps {
  title: string;
  subtitle?: string;
  showSignOut?: boolean;
  showProfile?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const DoctorHeader = ({
  title,
  subtitle,
  showSignOut = false,
  showProfile = false,
  actions,
}: DoctorHeaderProps) => {
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
      .from("doctor_profiles")
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
      .from("doctor_profiles")
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
    <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Vyana AI Logo - Home */}
          <Link
            to="/doctor-dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
              <span className="text-sm font-bold text-primary-foreground">V</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
          {/* Location Selector */}
          <HeaderLocationSelector
            pincode={location.pincode}
            city={location.city}
            onLocationChange={handleLocationChange}
          />
          
          {/* Eco indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">100% Digital</span>
          </div>
          <NotificationBell />
          {actions}
          {showProfile && (
            <Button variant="default" size="sm" onClick={() => navigate("/doctor-profile-setup")}>
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
