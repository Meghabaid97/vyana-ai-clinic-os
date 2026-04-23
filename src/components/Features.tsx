import { useState, useEffect } from "react";
import { tLanding } from "@/lib/i18n-landing";
import { useReveal } from "@/hooks/use-reveal";

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
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="features" className="py-16 bg-muted/40">
      <div className="max-w-[980px] mx-auto px-6">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[540px] mb-10`}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {tLanding("landing.featuresTitle")}{" "}
            <span className="text-primary">{tLanding("landing.featuresHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-[15px]">
            {tLanding("landing.featuresSub")}
          </p>
        </div>

        <div ref={grid.ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureKeys.map((f, i) => (
            <div
              key={i}
              className={`reveal reveal-delay-${(i % 6) + 1} ${grid.visible ? "is-visible" : ""} rounded-lg border border-border bg-background p-5 hover:border-primary/30 transition-colors`}
            >
              <span className="text-lg mb-2.5 block">{f.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {tLanding(f.titleKey)}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {tLanding(f.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
