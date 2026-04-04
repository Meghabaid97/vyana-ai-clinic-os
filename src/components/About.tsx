import { useState, useEffect } from "react";
import { tLanding } from "@/lib/i18n-landing";

const About = () => {
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="about" className="py-20 border-t border-border">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <h2 className="text-[32px] font-bold tracking-tight text-foreground mb-3">
            {tLanding("landing.problemTitle")}{" "}
            <span className="text-primary">{tLanding("landing.problemHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {tLanding("landing.problemSub")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
          {[
            { emoji: "🏥", titleKey: "landing.beat1Title", textKey: "landing.beat1Text" },
            { emoji: "📋", titleKey: "landing.beat2Title", textKey: "landing.beat2Text" },
            { emoji: "⏰", titleKey: "landing.beat3Title", textKey: "landing.beat3Text" },
          ].map((beat, i) => (
            <div key={i} className="bg-background p-8 space-y-3">
              <span className="text-2xl">{beat.emoji}</span>
              <h3 className="text-[16px] font-semibold text-foreground">
                {tLanding(beat.titleKey)}
              </h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                {tLanding(beat.textKey)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-2xl">
          <p className="text-lg text-foreground leading-relaxed">
            {tLanding("landing.vyanaHolds")}{" "}
            <span className="text-primary font-medium">{tLanding("landing.itsThere")}</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
