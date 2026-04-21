import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroPainting from "@/assets/landing-hero-painting.jpg";
import WatchItWorkModal from "@/components/WatchItWorkModal";

const EditorialHero = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

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
              The fastest way to explain your medical history
            </p>

            <h1 className="font-serif text-[44px] sm:text-[64px] lg:text-[84px] leading-[0.98] tracking-[-0.02em] text-foreground">
              Never explain
              <br />
              your medical
              <br />
              history{" "}
              <em className="italic text-primary font-normal">again.</em>
            </h1>

            <p className="text-[17px] leading-[1.65] text-foreground/85 max-w-[560px]">
              Upload your reports. Get a doctor-ready summary in 30 seconds.
              Conditions, medications, recent changes, one screen any doctor can read instantly.
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2">
              <Button
                onClick={() => navigate("/auth")}
                className="group h-11 px-6 text-[15px] rounded-full"
              >
                Upload your first record
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDemoOpen(true)}
                className="group text-[15px] text-foreground/70 hover:text-foreground h-11"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                See a sample brief
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
