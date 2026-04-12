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
    <div className="min-h-[100dvh] bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Top spacer */}
      <div className="flex-[1.2]" />

      {/* Brand block */}
      <div className="px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-none">
          V<span className="text-primary">yana</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl font-semibold leading-snug text-foreground">
          Your health story.
          <br />
          <span className="text-primary">Always with you.</span>
        </p>
      </div>

      {/* Bottom spacer */}
      <div className="flex-[1.8]" />

      {/* CTA block */}
      <div
        className="px-6 pb-10 transition-opacity duration-300"
        style={{ opacity: checking ? 0 : 1, pointerEvents: checking ? "none" : "auto" }}
      >
        <div className="mx-auto w-full max-w-xs">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full h-12 rounded-full text-base font-medium group"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="mt-3 w-full h-10 text-sm font-normal text-muted-foreground"
          >
            I already have an account
          </Button>

          <p className="pt-6 text-center text-xs text-muted-foreground">
            Every patient deserves a doctor who knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
