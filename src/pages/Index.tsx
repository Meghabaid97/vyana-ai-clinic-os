import EditorialHero from "@/components/landing/EditorialHero";
import ProblemSection from "@/components/landing/ProblemSection";
import QuoteWall from "@/components/landing/QuoteWall";
import WedgeSection from "@/components/landing/WedgeSection";
import HowItWorks from "@/components/landing/HowItWorks";
import OutcomeSection from "@/components/landing/OutcomeSection";
import StatsStrip from "@/components/landing/StatsStrip";
import DemoFilm from "@/components/landing/DemoFilm";
import ResearchAndTeam from "@/components/landing/ResearchAndTeam";
import StepsCinematic from "@/components/landing/StepsCinematic";
import PortraitCTA from "@/components/landing/PortraitCTA";
import SideRail from "@/components/landing/SideRail";
import Navigation from "@/components/Navigation";

const Index = () => (
  <div className="landing-warm min-h-screen bg-background">
    <Navigation />
    <SideRail />
    <EditorialHero />
    <ProblemSection />
    <QuoteWall />
    <WedgeSection />
    <HowItWorks />
    <OutcomeSection />
    <StatsStrip />
    <DemoFilm />
    <ResearchAndTeam />
    <StepsCinematic />
    <PortraitCTA />
  </div>
);

export default Index;
