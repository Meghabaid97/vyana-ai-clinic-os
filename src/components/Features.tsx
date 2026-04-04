import { useState, useEffect } from "react";
import { tLanding } from "@/lib/i18n-landing";

const featureKeys = [
  { emoji: "📄", titleKey: "landing.f1Title", descKey: "landing.f1Desc" },
  { emoji: "📈", titleKey: "landing.f2Title", descKey: "landing.f2Desc" },
  { emoji: "⚡", titleKey: "landing.f3Title", descKey: "landing.f3Desc" },
  { emoji: "🔗", titleKey: "landing.f4Title", descKey: "landing.f4Desc" },
  { emoji: "🔒", titleKey: "landing.f5Title", descKey: "landing.f5Desc" },
  { emoji: "🇮🇳", titleKey: "landing.f6Title", descKey: "landing.f6Desc" },
];

const Features = () => {
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="features" className="py-20 border-t border-border">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <h2 className="text-[32px] font-bold tracking-tight text-foreground mb-3">
            {tLanding("landing.featuresTitle")}{" "}
            <span className="text-primary">{tLanding("landing.featuresHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {tLanding("landing.featuresSub")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border border-border hover:border-muted-foreground/20 transition-colors duration-200"
            >
              <span className="text-xl mb-3 block">{feature.emoji}</span>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">
                {tLanding(feature.titleKey)}
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                {tLanding(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
