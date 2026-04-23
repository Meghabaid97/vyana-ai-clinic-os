import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { tLanding } from "@/lib/i18n-landing";
import { useReveal } from "@/hooks/use-reveal";

const Mission = () => {
  const navigate = useNavigate();
  const [, setLangTick] = useState(0);
  const header = useReveal<HTMLDivElement>();
  const text = useReveal<HTMLParagraphElement>();
  const stats = useReveal<HTMLDivElement>();
  const cta = useReveal<HTMLButtonElement>();

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="mission" className="py-16">
      <div className="max-w-[980px] mx-auto px-6">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[540px] mb-8`}
        >
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            {tLanding("landing.missionTitle1")}{" "}
            <span className="text-primary">{tLanding("landing.missionHighlight")}</span>{" "}
            {tLanding("landing.missionTitle2")}
          </h2>
        </div>

        <p
          ref={text.ref}
          className={`reveal reveal-delay-1 ${text.visible ? "is-visible" : ""} text-[15px] text-muted-foreground leading-relaxed max-w-[540px] mb-8`}
        >
          {tLanding("landing.missionText")}
        </p>

        <div ref={stats.ref} className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { valueKey: "landing.stat1Value", labelKey: "landing.stat1Label" },
            { valueKey: "landing.stat2Value", labelKey: "landing.stat2Label" },
            { valueKey: "landing.stat3Value", labelKey: "landing.stat3Label" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`reveal reveal-delay-${i + 1} ${stats.visible ? "is-visible" : ""} rounded-lg border border-border p-5`}
            >
              <div className="text-2xl font-bold text-primary mb-0.5">
                {tLanding(stat.valueKey)}
              </div>
              <p className="text-muted-foreground text-[13px]">
                {tLanding(stat.labelKey)}
              </p>
            </div>
          ))}
        </div>

        <button
          ref={cta.ref}
          onClick={() => navigate("/why-vyana")}
          className={`reveal ${cta.visible ? "is-visible" : ""} inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium group`}
        >
          {tLanding("landing.readStory")}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
};

export default Mission;
