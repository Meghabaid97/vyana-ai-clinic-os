import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";

// Landing sections are heavy and only needed for unauthed visitors.
// Lazy-load so authed users (who get redirected to /app) don't pay for them.
const EditorialHero = lazy(() => import("@/components/landing/EditorialHero"));
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const QuoteWall = lazy(() => import("@/components/landing/QuoteWall"));
const WedgeSection = lazy(() => import("@/components/landing/WedgeSectionGrid"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const OutcomeSection = lazy(() => import("@/components/landing/OutcomeSection"));
const ResearchAndTeam = lazy(() => import("@/components/landing/ResearchAndTeam"));
const TrustStrip = lazy(() => import("@/components/landing/TrustStrip"));
const StatsStrip = lazy(() => import("@/components/landing/StatsStrip"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const PortraitCTA = lazy(() => import("@/components/landing/PortraitCTA"));
const SideRail = lazy(() => import("@/components/landing/SideRail"));

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navigation />
      <Suspense fallback={<div className="min-h-screen" />}>
        <SideRail />
        <main id="main-content">
          <EditorialHero />
          <ProblemSection />
          <QuoteWall />
          <WedgeSection />
          <HowItWorks />
          <OutcomeSection />
          <StatsStrip />
          <ResearchAndTeam />
          <TrustStrip />
          <PortraitCTA />
          <FAQSection />
        </main>
      </Suspense>
    </div>
  );
};

export default Index;
