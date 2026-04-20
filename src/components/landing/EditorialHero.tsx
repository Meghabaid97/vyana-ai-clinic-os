import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroPainting from "@/assets/landing-hero-painting.jpg";

const EditorialHero = () => {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Full-bleed sepia painting backdrop */}
      <div className="absolute inset-0">
        <img
          src={heroPainting}
          alt="A daughter sits beside her elderly father, holding his hand"
          className="w-full h-full object-cover"
          width={1920}
          height={1280}
        />
        {/* Lighter ivory wash — lets the painting breathe */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-transparent" />
        {/* Bottom fade into next section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[hsl(36_30%_96%)] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[100svh] flex items-center">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 w-full pt-28 pb-20">
          <div className="max-w-[640px] space-y-8 animate-fade-in-slow">
            <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium">
              I &nbsp;·&nbsp; A longitudinal health memory layer
            </p>

            <h1 className="font-serif text-[44px] sm:text-[64px] lg:text-[84px] leading-[0.98] tracking-[-0.02em] text-foreground">
              Every patient deserves
              <br />
              <em className="italic text-primary font-normal">a doctor who knows their story.</em>
            </h1>

            <p className="text-[17px] leading-[1.65] text-foreground/85 max-w-[520px] relative pl-14">
              <span
                className="absolute left-0 top-0 font-serif text-[64px] leading-[0.85] text-primary"
                aria-hidden
              >
                V
              </span>
              yana turns scattered prescriptions, lab reports and hospital files
              into one calm, doctor-ready record. So when it matters most, your
              family is never starting from zero.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => navigate("/auth")}
                className="group h-11 px-6 text-[15px] rounded-full"
              >
                Try Vyana now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/why-vyana")}
                className="text-[15px] text-foreground/70 hover:text-foreground h-11"
              >
                Read our story
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialHero;
