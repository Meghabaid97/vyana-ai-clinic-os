import EditorialHero from "@/components/landing/EditorialHero";
import DemoFilm from "@/components/landing/DemoFilm";
import ResearchStrip from "@/components/landing/ResearchStrip";
import HowItWorks from "@/components/landing/HowItWorks";
import TeamSection from "@/components/landing/TeamSection";
import ClosingCTA from "@/components/landing/ClosingCTA";
import SideRail from "@/components/landing/SideRail";
import Navigation from "@/components/Navigation";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <SideRail />
    <EditorialHero />
    <DemoFilm />
    <ResearchStrip />
    <HowItWorks />
    <TeamSection />
    <ClosingCTA />
  </div>
);

export default Index;
