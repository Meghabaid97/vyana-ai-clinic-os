import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroPainting from "@/assets/landing-hero-painting.jpg";

const EditorialHero = () => {
  const navigate = useNavigate();

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Full-bleed painting backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroPainting}
          alt="A daughter sits beside her elderly father, holding his hand"
          className="w-full h-full object-cover animate-ken-burns"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-primary/60 animate-soft-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-primary/50 animate-soft-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 right-[15%] w-1 h-1 rounded-full bg-primary/40 animate-soft-float" style={{ animationDelay: "4s" }} />
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
                onClick={scrollToContact}
                className="group h-11 px-6 text-[15px] rounded-full"
              >
                Join the waitlist
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
