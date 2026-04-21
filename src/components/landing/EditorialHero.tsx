import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroPainting from "@/assets/landing-hero-painting.jpg";

const EditorialHero = () => {
  const navigate = useNavigate();

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
        <div className="absolute inset-0 bg-gradient-to-r from-background/75 via-background/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[hsl(36_30%_96%)] to-transparent" />
      </div>

      <div className="relative z-10 min-h-[100svh] flex items-center">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 w-full pt-28 pb-20">
          <div className="max-w-[680px] space-y-8 animate-fade-in-slow">
            <p className="font-serif italic text-[15px] text-foreground/65">
              A clinical memory system for every Indian family
            </p>

            <h1 className="font-serif text-[44px] sm:text-[64px] lg:text-[84px] leading-[0.98] tracking-[-0.02em] text-foreground">
              Every doctor visit
              <br />
              starts from zero.
              <br />
              <em className="italic text-primary font-normal">Vyana fixes that.</em>
            </h1>

            <p className="text-[17px] leading-[1.65] text-foreground/85 max-w-[560px]">
              Build a continuous health memory from your reports, prescriptions
              and tests, so doctors never make decisions without context again.
            </p>

            <ul className="space-y-2 text-[15px] text-foreground/75 max-w-[520px]">
              <li>— No more repeating your medical history</li>
              <li>— No more lost reports</li>
              <li>— No more unnecessary tests</li>
            </ul>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => navigate("/auth")}
                className="group h-11 px-6 text-[15px] rounded-full"
              >
                Upload your first report
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/why-vyana")}
                className="text-[15px] text-foreground/70 hover:text-foreground h-11"
              >
                See the problem we solve
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialHero;
