import EditorialHero from "@/components/landing/EditorialHero";
import StatsStrip from "@/components/landing/StatsStrip";
import DemoFilm from "@/components/landing/DemoFilm";
import ResearchAndTeam from "@/components/landing/ResearchAndTeam";
import HowItWorks from "@/components/landing/HowItWorks";
import Constellation from "@/components/landing/Constellation";
import PortraitCTA from "@/components/landing/PortraitCTA";
import SideRail from "@/components/landing/SideRail";
import Navigation from "@/components/Navigation";

const Index = () => (
  <div className="landing-warm min-h-screen bg-background">
    <Navigation />
    <SideRail />
    <EditorialHero />
    <StatsStrip />
    <DemoFilm />
    <ResearchAndTeam />
    <HowItWorks />
    <Constellation />
    <PortraitCTA />
  </div>
);

export default Index;

