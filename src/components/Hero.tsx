import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
    <section className="min-h-[85vh] flex items-center pt-16 pb-12">
      <div className="max-w-[1100px] mx-auto px-6 w-full">
        <div className="max-w-2xl space-y-6 animate-fade-in-slow">
          <p className="text-muted-foreground text-[15px] tracking-wide">
            {tLanding("landing.badge")}
          </p>

          <h1 className="text-[42px] lg:text-[56px] font-bold leading-[1.1] tracking-tight text-foreground">
            {tLanding("landing.headline1")}{" "}
            <span className="text-gradient-warm">
              {tLanding("landing.headline2")}
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            {tLanding("landing.subtext")}{" "}
            <span className="text-foreground font-medium">
              {tLanding("landing.subtextBold")}
            </span>
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={scrollToContact}
              className="group rounded-lg text-[15px] px-5"
            >
              {tLanding("landing.cta")}
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate("/why-vyana")}
              className="text-[15px] text-muted-foreground hover:text-foreground px-5"
            >
              {tLanding("landing.whyCta")}
            </Button>
          </div>

          <p className="text-[13px] text-muted-foreground/70 pt-4 max-w-md">
            {tLanding("landing.stat")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
