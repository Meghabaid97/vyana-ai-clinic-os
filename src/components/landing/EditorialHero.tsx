import { Button } from "@/components/ui/button";
import { StatefulButton, ButtonState } from "@/components/ui/stateful-button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroPainting from "@/assets/landing-hero-painting.jpg";
import WatchItWorkModal from "@/components/WatchItWorkModal";
import { useLandingT } from "@/lib/i18n-landing";

const EditorialHero = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const [ctaState, setCtaState] = useState<ButtonState>("idle");
  const t = useLandingT();

  const handleEarlyAccess = () => {
    if (ctaState !== "idle") return;
    setCtaState("loading");
    // Brief feedback so the action feels acknowledged before the route swap
    setTimeout(() => {
      setCtaState("success");
      setTimeout(() => navigate("/request-access"), 450);
    }, 350);
  };

  return (
    <section id="hero" className="relative min-h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroPainting}
          alt="A daughter sits beside her elderly father, holding his hand"
          className="w-full h-full object-cover"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 min-h-[100svh] flex items-center">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 w-full pt-28 pb-20">
          <div className="max-w-[680px] space-y-8 animate-fade-in-slow">
            <p className="font-serif italic text-[15px] text-foreground/65">
              {t("hero.eyebrow")}
            </p>

            <h1 className="font-serif text-[44px] sm:text-[64px] lg:text-[84px] leading-[0.98] tracking-[-0.02em] text-foreground">
              {t("hero.h1.l1")}
              <br />
              {t("hero.h1.l2")}{" "}
              <em className="italic text-primary font-normal">{t("hero.h1.again")}</em>
            </h1>

            <p className="text-body text-foreground/85 max-w-[560px]">
              {t("hero.sub")}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2">
              <StatefulButton
                state={ctaState}
                onClick={handleEarlyAccess}
                variant="premium"
                loadingLabel="Just a moment…"
                successLabel="Let's begin"
                className="h-11 px-6 text-[15px] rounded-full min-w-[180px]"
                idleIcon={<ArrowRight className="h-4 w-4" />}
              >
                Get early access
              </StatefulButton>
              <Button
                variant="ghost"
                onClick={() => setDemoOpen(true)}
                className="group text-[15px] text-foreground/70 hover:text-foreground h-11"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                {t("hero.cta.secondary")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <WatchItWorkModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default EditorialHero;
