import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/use-page-meta";
import EditorialHero from "@/components/landing/EditorialHero";

// Landing sections below the fold are heavy and only needed for unauthed visitors.
// Lazy-load so authed users (who get redirected to /app) don't pay for them.
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

  usePageMeta({
    title: "Vyana: Your longitudinal health story",
    description:
      "Vyana is India's longitudinal health memory layer. Carry prescriptions, labs, and summaries into every visit. Never explain your history again.",
    path: "/",
  });
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Is this approved by India's national health system?", acceptedAnswer: { "@type": "Answer", text: "Yes. Vyana is built to align with the Ayushman Bharat Digital Mission (ABDM), the same framework Apollo, Max, and government hospitals use. Your records can travel across any ABDM-connected clinic in India." } },
        { "@type": "Question", name: "Who can actually see my records?", acceptedAnswer: { "@type": "Answer", text: "Only you. Doctors see what you choose to share, for as long as you choose. Every share creates a 24-hour link that expires automatically. We never sell your data, never share it with insurers, and never use it to train public AI models." } },
        { "@type": "Question", name: "Does Vyana work in my language?", acceptedAnswer: { "@type": "Answer", text: "Yes. The app speaks English, Hindi, Tamil, Telugu, and Bengali. Your prescriptions are read in any of these scripts, including handwritten notes. More languages are added based on family requests." } },
        { "@type": "Question", name: "Will my doctor actually accept the briefing?", acceptedAnswer: { "@type": "Answer", text: "We generate a clean, one-page clinical summary in standard SOAP format that any doctor can read in 30 seconds. It also exports as a structured FHIR file, the global standard hospitals already use. No new app for the doctor to download." } },
        { "@type": "Question", name: "What if I delete my account?", acceptedAnswer: { "@type": "Answer", text: "Everything goes. Within 30 days every record, vital, prescription, and note is permanently erased from our systems. You can also export all your data as a single download before you leave." } },
        { "@type": "Question", name: "How much does this cost?", acceptedAnswer: { "@type": "Answer", text: "Free to start. You can upload, organize, and share unlimited records on the free plan. Paid plans add advanced AI features like longitudinal trend analysis and faster support." } },
        { "@type": "Question", name: "Who is this really for?", acceptedAnswer: { "@type": "Answer", text: "Families managing chronic conditions, adult children caring for elderly parents, anyone juggling specialists across cities, and patients tired of repeating their history every visit. If you've ever lost a prescription, this is for you." } },
        { "@type": "Question", name: "Is the AI making medical decisions?", acceptedAnswer: { "@type": "Answer", text: "No. Vyana is clinical decision support, not a diagnosis engine. We surface patterns, flag drug interactions, and prepare your history for the doctor. Every medical decision stays with your doctor, where it belongs." } },
      ],
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

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
