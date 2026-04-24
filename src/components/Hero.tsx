import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLandingT } from "@/lib/i18n-landing";

const Hero = () => {
  const navigate = useNavigate();
  const t = useLandingT();

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="max-w-[640px] space-y-5 animate-fade-in-slow">
          <p className="text-sm text-primary font-medium">
            {t("landing.badge")}
          </p>

          <h1 className="text-4xl lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
            {t("landing.headline1")}
            <br />
            <span className="text-primary">{t("landing.headline2")}</span>
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed max-w-[520px]">
            {t("landing.subtext")} <span className="text-foreground">{t("landing.subtextBold")}</span>
          </p>

          <div className="flex items-center gap-3 pt-3">
            <Button onClick={scrollToContact} className="group h-9 px-4 text-sm rounded-md">
              {t("landing.cta")}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/why-vyana")}
              className="text-sm text-muted-foreground h-9"
            >
              {t("landing.whyCta")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-6">
            {t("landing.stat")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
