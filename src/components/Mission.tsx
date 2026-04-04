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
    <section id="mission" className="py-20 bg-muted/50 border-t border-border">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <h2 className="text-[32px] font-bold tracking-tight text-foreground leading-tight">
            {tLanding("landing.missionTitle1")} <span className="text-primary">{tLanding("landing.missionHighlight")}</span>{" "}
            {tLanding("landing.missionTitle2")}
          </h2>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-10">
          {tLanding("landing.missionText")}
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { valueKey: "landing.stat1Value", labelKey: "landing.stat1Label" },
            { valueKey: "landing.stat2Value", labelKey: "landing.stat2Label" },
            { valueKey: "landing.stat3Value", labelKey: "landing.stat3Label" },
          ].map((stat, i) => (
            <div key={i} className="surface-warm rounded-[1.5rem] p-6">
              <div className="text-3xl font-bold text-primary mb-1">
                {tLanding(stat.valueKey)}
              </div>
              <p className="text-muted-foreground text-[14px]">
                {tLanding(stat.labelKey)}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/why-vyana")}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-primary hover:text-primary/80 font-medium text-[15px] shadow-card transition-all group hover:-translate-y-0.5"
        >
          {tLanding("landing.readStory")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
};

export default Mission;
