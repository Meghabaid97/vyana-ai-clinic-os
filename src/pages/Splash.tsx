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
    setTimeout(checkSession, 800);
  }, [navigate]);

  return (
    <div className="min-h-screen min-h-[100svh] bg-background">
      <div className="mx-auto flex min-h-screen min-h-[100svh] w-full max-w-sm flex-col safe-area-top safe-area-bottom px-6">
        <div className="flex-[1.75]" />

        <div className="shrink-0 text-center">
          <h1 className="text-[2.8rem] font-bold tracking-[-0.06em] text-foreground leading-none sm:text-5xl">
          V<span className="text-primary">yana</span>
          </h1>
          <p className="mt-5 text-[0.95rem] font-semibold leading-tight text-foreground sm:text-xl">
            Your health story.
            <br />
            <span className="text-primary">Always with you.</span>
          </p>
        </div>

        <div className="flex-[1.15]" />

        <div
          className="shrink-0 pb-8 transition-opacity duration-200"
          style={{ opacity: checking ? 0 : 1, pointerEvents: checking ? "none" : "auto" }}
        >
          <div className="mx-auto w-full max-w-xs text-center">
            <Button
              onClick={() => navigate("/auth")}
              className="h-11 w-full rounded-full px-5 text-lg font-medium group"
            >
              Get Started
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
