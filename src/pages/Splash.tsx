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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-fade-in space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            V<span className="text-primary drop-shadow-[0_0_20px_hsl(12,76%,61%,0.6)]">yana</span>
          </h1>
          <p className="text-sm text-muted-foreground">Your health story. Always with you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      <div className="px-6 pb-10 pt-4 space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
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
          className="w-full h-12 text-base text-muted-foreground"
        >
          I already have an account
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-2">
          Every patient deserves a doctor who knows their story.
        </p>
      </div>
    </div>
  );
};

export default Splash;
