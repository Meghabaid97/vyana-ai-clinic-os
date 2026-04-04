import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tLanding } from "@/lib/i18n-landing";

const Hero = () => {
  const navigate = useNavigate();
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex items-center pt-20 pb-16 relative overflow-hidden">
      <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -left-40 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10 animate-fade-in-slow">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Heart className="h-4 w-4" />
            {tLanding("landing.badge")}
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            {tLanding("landing.headline1")}{" "}
            <br className="hidden md:block" />
            <span className="text-gradient-warm">
              {tLanding("landing.headline2")}
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {tLanding("landing.subtext")}{" "}
            <span className="text-foreground font-semibold">
              {tLanding("landing.subtextBold")}
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button
              variant="gradient"
              size="lg"
              onClick={scrollToContact}
              className="group text-base px-8 py-6 rounded-full"
            >
              {tLanding("landing.cta")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/why-vyana")}
              className="text-base px-8 py-6 rounded-full"
            >
              {tLanding("landing.whyCta")}
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {tLanding("landing.stat")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
