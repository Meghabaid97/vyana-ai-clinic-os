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
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
    <div className="min-h-[100dvh] bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-[1.18]" />

      <div className="px-6 text-center">
        <h1 className="text-[clamp(3.25rem,14vw,4.5rem)] font-bold tracking-[-0.06em] text-foreground leading-[0.92]">
          V<span className="text-primary">yana</span>
        </h1>

        <p className="mx-auto mt-5 max-w-[11ch] text-[clamp(1.7rem,7vw,2.35rem)] font-semibold tracking-[-0.04em] text-foreground leading-[1.04]">
          Your health story.
          <br />
          <span className="text-primary">Always with you.</span>
        </p>
      </div>

      <div className="flex-[1.7]" />

      <div
        className="px-6 pb-10 transition-opacity duration-300"
        style={{ opacity: checking ? 0 : 1, pointerEvents: checking ? "none" : "auto" }}
      >
        <div className="mx-auto w-full max-w-[20.5rem] text-center">
          <Button
            onClick={() => navigate("/auth")}
            className="h-14 w-full rounded-full text-[1.1rem] font-medium tracking-[-0.02em] group"
          >
            Get Started
            <ArrowRight className="ml-1.5 h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="mt-4 h-10 w-full text-[1rem] font-normal text-muted-foreground"
          >
            I already have an account
          </Button>

          <p className="mx-auto pt-8 max-w-[18ch] text-sm leading-relaxed text-muted-foreground">
            Every patient deserves a doctor who knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
