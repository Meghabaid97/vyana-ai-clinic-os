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
      {/* Top spacer — pushes brand to optical center */}
      <div className="flex-[1.1]" />

      {/* Brand block */}
      <div className="px-6 text-center">
        <h1 className="text-[clamp(4rem,18vw,5.25rem)] font-bold tracking-tight text-foreground leading-none">
          V<span className="text-primary">yana</span>
        </h1>
        <p className="mt-6 text-[clamp(1.6rem,6vw,2.2rem)] font-semibold leading-tight text-foreground">
          Your health story.
          <br />
          <span className="text-primary">Always with you.</span>
        </p>
      </div>

      {/* Bottom spacer — pushes buttons down */}
      <div className="flex-[1.6]" />

      {/* CTA block anchored near bottom */}
      <div
        className="px-6 pb-10 transition-opacity duration-300"
        style={{ opacity: checking ? 0 : 1, pointerEvents: checking ? "none" : "auto" }}
      >
        <div className="mx-auto w-full max-w-sm">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full h-14 rounded-full text-lg font-medium group"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="mt-4 w-full h-11 text-base font-normal text-muted-foreground"
          >
            I already have an account
          </Button>

          <p className="pt-8 text-center text-sm text-muted-foreground">
            Every patient deserves a doctor who knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
