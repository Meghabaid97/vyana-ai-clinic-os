import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Features from "@/components/Features";
import Mission from "@/components/Mission";
import Contact from "@/components/Contact";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <Hero />
    <About />
    <Features />
    <Mission />
    <Contact />
  </div>
);

export default Index;
