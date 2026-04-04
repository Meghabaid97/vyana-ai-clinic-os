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
    <section className="relative flex min-h-[88vh] items-center pt-24 pb-16">
      <div className="max-w-[1100px] mx-auto px-6 w-full">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
          <div className="max-w-2xl space-y-6 animate-fade-in-slow">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-[14px] text-primary shadow-card">
              <Heart className="h-4 w-4 fill-current" />
              <span>{tLanding("landing.badge")}</span>
            </div>

            <h1 className="text-[42px] lg:text-[64px] font-bold leading-[1.02] tracking-tight text-foreground">
              {tLanding("landing.headline1")} <span className="text-gradient-warm">{tLanding("landing.headline2")}</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              {tLanding("landing.subtext")} <span className="text-foreground font-medium">{tLanding("landing.subtextBold")}</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={scrollToContact}
                className="group rounded-full px-6 text-[15px]"
              >
                {tLanding("landing.cta")}
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/why-vyana")}
                className="rounded-full px-6 text-[15px]"
              >
                {tLanding("landing.whyCta")}
              </Button>
            </div>

            <p className="text-[13px] text-muted-foreground/80 pt-4 max-w-md">
              {tLanding("landing.stat")}
            </p>
          </div>

          <div className="surface-warm rounded-[2rem] p-8 lg:p-10 animate-fade-in-slow">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {tLanding("landing.problemTitle")} {tLanding("landing.problemHighlight")}
                </p>
                <p className="text-2xl font-semibold leading-tight text-foreground">
                  {tLanding("landing.beat1Title")}
                </p>
                <p className="text-[15px] leading-7 text-muted-foreground">
                  {tLanding("landing.beat1Text")}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/75 p-5">
                <p className="text-sm leading-7 text-foreground">
                  {tLanding("landing.vyanaHolds")} <span className="font-semibold text-primary">{tLanding("landing.itsThere")}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
