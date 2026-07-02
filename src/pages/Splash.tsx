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

    const timeoutId = window.setTimeout(checkSession, 800);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="relative mx-auto box-border h-[100svh] w-full max-w-sm safe-area-top safe-area-bottom px-6">
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="relative w-full max-w-xs">
            <div className="v-hero-halo" aria-hidden />
            <h1 className="v-display relative text-[3.4rem] sm:text-6xl">
              V<span className="text-gradient-primary">yana</span>
            </h1>
            <p className="relative mt-5 text-[1rem] font-semibold leading-tight text-foreground sm:text-xl">
              Your health story. <span className="text-gradient-primary">Always with you.</span>
            </p>
          </div>
        </div>

        <div
          className="absolute inset-x-6 bottom-0 pb-8 transition-opacity duration-200"
          style={{ opacity: checking ? 0 : 1, pointerEvents: checking ? "none" : "auto" }}
        >
          <div className="mx-auto w-full max-w-xs text-center">
            <Button
              onClick={() => navigate("/auth?signup=1")}
              className="h-11 w-full rounded-full px-5 text-lg font-medium group"
            >
              Create your account
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="mt-4 h-9 w-full text-[0.95rem] font-normal text-muted-foreground"
            >
              I already have an account
            </Button>


            <p className="pt-8 text-center text-[0.8rem] leading-relaxed text-muted-foreground">
              Every patient deserves a doctor who knows their story.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
