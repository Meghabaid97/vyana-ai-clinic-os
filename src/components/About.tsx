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
    <section id="about" className="py-16">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="max-w-[540px] mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {tLanding("landing.problemTitle")}{" "}
            <span className="text-primary">{tLanding("landing.problemHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            {tLanding("landing.problemSub")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { emoji: "🏥", titleKey: "landing.beat1Title", textKey: "landing.beat1Text" },
            { emoji: "📋", titleKey: "landing.beat2Title", textKey: "landing.beat2Text" },
            { emoji: "⏰", titleKey: "landing.beat3Title", textKey: "landing.beat3Text" },
          ].map((beat, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-5 hover:bg-muted/50 transition-colors"
            >
              <span className="text-xl mb-3 block">{beat.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                {tLanding(beat.titleKey)}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {tLanding(beat.textKey)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-[540px] bg-muted/60 rounded-lg p-5 border border-border">
          <p className="text-[15px] text-foreground leading-relaxed">
            {tLanding("landing.vyanaHolds")}{" "}
            <span className="text-primary font-medium">{tLanding("landing.itsThere")}</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
