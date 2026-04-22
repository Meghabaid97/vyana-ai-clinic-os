import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditorialHero from "@/components/landing/EditorialHero";
import ProblemSection from "@/components/landing/ProblemSection";
import QuoteWall from "@/components/landing/QuoteWall";
import WedgeSection from "@/components/landing/WedgeSection";
import HowItWorks from "@/components/landing/HowItWorks";
import OutcomeSection from "@/components/landing/OutcomeSection";
import ResearchAndTeam from "@/components/landing/ResearchAndTeam";
import TrustStrip from "@/components/landing/TrustStrip";
import FAQSection from "@/components/landing/FAQSection";
import PortraitCTA from "@/components/landing/PortraitCTA";
import SideRail from "@/components/landing/SideRail";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const handleSession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!active) return;
      if (session) {
        navigate("/app", { replace: true });
        return;
      }
      setAuthChecked(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => handleSession(session), 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!authChecked) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="landing-warm min-h-screen bg-background">
      <Navigation />
      <SideRail />
      <EditorialHero />
      <ProblemSection />
      <QuoteWall />
      <WedgeSection />
      <HowItWorks />
      <OutcomeSection />
      <ResearchAndTeam />
      <TrustStrip />
      <FAQSection />
      <PortraitCTA />
    </div>
  );
};

export default Index;
