import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (roleData?.role === "doctor") {
          navigate("/doctor-dashboard", { replace: true });
        } else {
          navigate("/app", { replace: true });
        }
      } else {
        setChecking(false);
      }
    };
    // Small delay for brand moment
    setTimeout(checkSession, 800);
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-area-top safe-area-bottom">
        <div className="animate-fade-in space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            V<span className="text-primary">yana</span>
          </h1>
          <p className="text-sm text-muted-foreground">Your health story. Always with you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom">
      <div className="animate-fade-in w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            V<span className="text-primary">yana</span>
          </h1>
          <p className="text-lg text-foreground font-medium leading-snug">
            Your health story.
            <br />
            <span className="text-primary">Always with you.</span>
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full h-13 text-base rounded-2xl group"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="w-full h-11 text-base text-muted-foreground"
          >
            I already have an account
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Every patient deserves a doctor who knows their story.
        </p>
      </div>
    </div>
  );
};

export default Splash;
