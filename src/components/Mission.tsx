import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { tLanding } from "@/lib/i18n-landing";

const Mission = () => {
  const navigate = useNavigate();
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="mission" className="py-24 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            {tLanding("landing.missionTitle1")}{" "}
            <span className="text-gradient-warm">
              {tLanding("landing.missionHighlight")}
            </span>{" "}
            {tLanding("landing.missionTitle2")}
          </h2>

          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {tLanding("landing.missionText")}
          </p>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="p-8 rounded-2xl bg-card border border-primary/15 hover:border-primary/30 transition-all shadow-card hover:shadow-warm">
              <div className="text-4xl font-bold text-gradient-warm mb-3">
                {tLanding("landing.stat1Value")}
              </div>
              <p className="text-muted-foreground font-medium">
                {tLanding("landing.stat1Label")}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-secondary/15 hover:border-secondary/30 transition-all shadow-card hover:shadow-warm">
              <div className="text-4xl font-bold text-gradient-warm mb-3">
                {tLanding("landing.stat2Value")}
              </div>
              <p className="text-muted-foreground font-medium">
                {tLanding("landing.stat2Label")}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-accent/15 hover:border-accent/30 transition-all shadow-card hover:shadow-warm">
              <div className="text-4xl font-bold text-gradient mb-3">
                {tLanding("landing.stat3Value")}
              </div>
              <p className="text-muted-foreground font-medium">
                {tLanding("landing.stat3Label")}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate("/why-vyana")}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-lg transition-colors group"
            >
              {tLanding("landing.readStory")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;
