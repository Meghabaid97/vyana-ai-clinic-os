import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Features from "@/components/Features";
import Mission from "@/components/Mission";
import Contact from "@/components/Contact";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-halo absolute left-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full blur-3xl" />
        <div className="absolute right-[-8rem] top-[22rem] h-[22rem] w-[22rem] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-[12rem] left-[12%] h-[20rem] w-[20rem] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative">
        <Navigation />
        <Hero />
        <About />
        <Features />
        <Mission />
        <Contact />
      </div>
    </div>
  );
};

export default Index;
