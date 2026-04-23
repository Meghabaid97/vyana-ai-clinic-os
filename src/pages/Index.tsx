import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";

// Landing sections are heavy and only needed for unauthed visitors.
// Lazy-load so authed users (who get redirected to /app) don't pay for them.
const MuseumHero = lazy(() => import("@/components/landing/MuseumHero"));
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const WedgeSection = lazy(() => import("@/components/landing/WedgeSection"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const ResearchAndTeam = lazy(() => import("@/components/landing/ResearchAndTeam"));
const TrustStrip = lazy(() => import("@/components/landing/TrustStrip"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const PortraitCTA = lazy(() => import("@/components/landing/PortraitCTA"));
const ChapterRail = lazy(() => import("@/components/landing/ChapterRail"));

const Index = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Native app should always boot to the splash screen, never the
    // marketing landing page (which is web-only).
    if (Capacitor.isNativePlatform()) {
      navigate("/splash", { replace: true });
      return;
    }

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
      <Suspense fallback={<div className="min-h-screen" />}>
        <ChapterRail />
        <MuseumHero />
        <ProblemSection />
        <WedgeSection />
        <HowItWorks />
        <ResearchAndTeam />
        <TrustStrip />
        <PortraitCTA />
        <FAQSection />
      </Suspense>
    </div>
  );
};

export default Index;
