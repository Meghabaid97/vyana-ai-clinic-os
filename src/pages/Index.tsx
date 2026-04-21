import EditorialHero from "@/components/landing/EditorialHero";
import ProblemSection from "@/components/landing/ProblemSection";
import QuoteWall from "@/components/landing/QuoteWall";
import WedgeSection from "@/components/landing/WedgeSection";
import DemoFilm from "@/components/landing/DemoFilm";
import HowItWorks from "@/components/landing/HowItWorks";
import OutcomeSection from "@/components/landing/OutcomeSection";
import ResearchAndTeam from "@/components/landing/ResearchAndTeam";
import PortraitCTA from "@/components/landing/PortraitCTA";
import SideRail from "@/components/landing/SideRail";
import Navigation from "@/components/Navigation";

const Index = () => (
  <div className="landing-warm min-h-screen bg-background">
    <Navigation />
    <SideRail />
    <EditorialHero />        {/* ivory */}
    <ProblemSection />       {/* dark  */}
    <QuoteWall />            {/* ivory */}
    <WedgeSection />         {/* dark  */}
    <DemoFilm />             {/* ivory — proof after the claim */}
    <HowItWorks />           {/* dark  */}
    <OutcomeSection />       {/* ivory */}
    <ResearchAndTeam />      {/* dark  */}
    <PortraitCTA />          {/* ivory */}
  </div>
);

export default Index;
