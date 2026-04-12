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
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Brand hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="animate-fade-in space-y-5 max-w-sm">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            V<span className="text-primary">yana</span>
          </h1>

          <p className="text-lg text-foreground font-medium leading-snug">
            Your health story.
            <br />
            <span className="text-primary">Always with you.</span>
          </p>
        </div>
      </div>

      {/* Bottom CTAs */}
      <div className="px-5 pb-8 pt-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full h-12 text-base rounded-xl group"
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
          <p className="text-center text-[11px] text-muted-foreground pt-1">
            Every patient deserves a doctor who knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
