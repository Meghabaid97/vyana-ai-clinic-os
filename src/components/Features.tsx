import { useState, useEffect } from "react";
import { FileText, TrendingUp, Share2, Shield, Clock, Heart } from "lucide-react";
import { tLanding } from "@/lib/i18n-landing";

const featureKeys = [
  { icon: FileText, titleKey: "landing.f1Title", descKey: "landing.f1Desc", color: "primary" },
  { icon: TrendingUp, titleKey: "landing.f2Title", descKey: "landing.f2Desc", color: "secondary" },
  { icon: Clock, titleKey: "landing.f3Title", descKey: "landing.f3Desc", color: "accent" },
  { icon: Share2, titleKey: "landing.f4Title", descKey: "landing.f4Desc", color: "primary" },
  { icon: Shield, titleKey: "landing.f5Title", descKey: "landing.f5Desc", color: "secondary" },
  { icon: Heart, titleKey: "landing.f6Title", descKey: "landing.f6Desc", color: "primary" },
];

const Features = () => {
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            {tLanding("landing.featuresTitle")}{" "}
            <span className="text-gradient-warm">{tLanding("landing.featuresHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {tLanding("landing.featuresSub")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {featureKeys.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-warm transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-3">{tLanding(feature.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  {tLanding(feature.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
