import EditorialHero from "@/components/landing/EditorialHero";
import DemoFilm from "@/components/landing/DemoFilm";
import ResearchAndTeam from "@/components/landing/ResearchAndTeam";
import HowItWorks from "@/components/landing/HowItWorks";
import ClosingCTA from "@/components/landing/ClosingCTA";
import SideRail from "@/components/landing/SideRail";
import Navigation from "@/components/Navigation";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <SideRail />
    <EditorialHero />
    <DemoFilm />
    <ResearchAndTeam />
    <HowItWorks />
    <ClosingCTA />
  </div>
);

export default Index;
