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

  const brandContent = (
    <div className="w-full max-w-sm text-center -translate-y-8 animate-fade-in">
      <h1 className="text-[clamp(4rem,18vw,5.25rem)] font-bold tracking-tight text-foreground">
        V<span className="text-primary">yana</span>
      </h1>
      <p className="mt-5 text-[clamp(2rem,8vw,2.75rem)] font-semibold leading-tight text-foreground">
        Your health story.
        <br />
        <span className="text-primary">Always with you.</span>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 flex items-center justify-center px-6">
        {brandContent}
      </div>

      <div
        className="px-6 pb-10 animate-fade-in"
        style={{ animationDelay: "160ms", visibility: checking ? "hidden" : "visible" }}
        aria-hidden={checking}
      >
        <div className="mx-auto w-full max-w-sm">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full h-16 rounded-[1.75rem] text-xl font-medium group"
          >
            Get Started
            <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="mt-5 w-full h-12 text-xl font-normal text-muted-foreground"
          >
            I already have an account
          </Button>

          <p className="pt-10 text-center text-base text-muted-foreground">
            Every patient deserves a doctor who knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
