import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="min-h-screen flex items-center pt-20 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              AI that listens, understands, and writes for{" "}
              <span className="text-gradient">
                doctors
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Vyana AI helps clinics automate documentation, follow-ups, and patient 
              communication — saving doctors time while improving care.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="gradient"
                size="lg"
                onClick={scrollToContact}
                className="group"
              >
                Get Early Access
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const element = document.getElementById("features");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30 rounded-3xl blur-3xl animate-pulse"></div>
            <img
              src={heroImage}
              alt="AI-powered healthcare technology"
              className="relative rounded-3xl shadow-glow w-full h-auto border-2 border-primary/20"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
