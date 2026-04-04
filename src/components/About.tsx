import { useState, useEffect } from "react";
import { Heart, FileText, AlertTriangle } from "lucide-react";
import { tLanding } from "@/lib/i18n-landing";

const About = () => {
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="about" className="py-24 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              {tLanding("landing.problemTitle")}{" "}
              <span className="text-gradient-warm">{tLanding("landing.problemHighlight")}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {tLanding("landing.problemSub")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-4 hover:shadow-warm transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{tLanding("landing.beat1Title")}</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                {tLanding("landing.beat1Text")}
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-4 hover:shadow-warm transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{tLanding("landing.beat2Title")}</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                {tLanding("landing.beat2Text")}
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-4 hover:shadow-warm transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{tLanding("landing.beat3Title")}</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                {tLanding("landing.beat3Text")}
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-xl text-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              {tLanding("landing.vyanaHolds")}{" "}
              <span className="text-gradient-warm font-semibold">{tLanding("landing.itsThere")}</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
