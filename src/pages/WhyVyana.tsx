import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";

const WhyVyana = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-2xl font-bold text-gradient-warm">Vyana</span>
          </button>
          <Button variant="gradient" className="rounded-full" onClick={() => { const el = document.getElementById("contact"); if (el) el.scrollIntoView({ behavior: "smooth" }); else navigate("/"); }}>
            Get Early Access
          </Button>
        </div>
      </nav>

      <article className="container mx-auto px-6 py-16 max-w-3xl">
        {/* Title */}
        <header className="text-center mb-16 space-y-6 animate-fade-in-slow">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Heart className="h-4 w-4" />
            The story behind Vyana
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
            Why this{" "}
            <span className="text-gradient-warm">matters</span>
          </h1>
        </header>

        {/* The story */}
        <div className="prose prose-lg max-w-none space-y-8">
          <section className="space-y-6 animate-fade-in-slow" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-4">
              Tirupur, 2005
            </h2>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              I grew up in Tirupur, a small city in Tamil Nadu. In 2005 and 2006, 
              both of my grandparents passed away. They were rushed by ambulance to 
              the nearest district hospital — 45 minutes away — because there were 
              no adequate medical facilities in our town.
            </p>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              When they arrived, my family had five minutes to explain everything 
              to a doctor who had no records, no history, no context. The family was 
              kept outside the operation theater. The doctors said everything was fine.
            </p>
            <p className="text-foreground leading-[1.9] text-[17px] font-semibold">
              It wasn't. We lost both of them.
            </p>
          </section>

          <section className="space-y-6 animate-fade-in-slow" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-4">
              COVID, 2020
            </h2>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              During the pandemic, my father developed sudden severe stomach pain. 
              The doctors found he had developed gangrene in his intestines — blood 
              flow had stopped completely. They had 24 hours to decide whether to 
              proceed with emergency surgery to remove the affected intestine.
            </p>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              Our family had never heard of this condition. We didn't know what was 
              happening inside the operating theater. We had no medical records, no 
              second opinion infrastructure, no time.
            </p>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              I made the decision. He survived. But the post-op care was brutal, 
              and I realized the crisis didn't end when the surgery did.
            </p>
          </section>

          <section className="space-y-6 animate-fade-in-slow" style={{ animationDelay: "0.6s" }}>
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-4">
              The everyday version
            </h2>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              And then there's the mundane version that every Indian family knows: 
              every time someone visits a new doctor, they arrive with 75 pages of 
              scattered reports — and still get asked to redo blood tests because the 
              new doctor doesn't trust the previous lab.
            </p>
            <p className="text-muted-foreground leading-[1.9] text-[17px]">
              Every visit resets the clock. Every doctor starts from zero. Patients 
              burn money on repeated tests, watch conditions worsen incrementally 
              because no one is tracking the longitudinal picture, and eventually get 
              diagnosed with chronic disease at the stage where prevention is no 
              longer possible.
            </p>
          </section>

          {/* The turn */}
          <div className="my-16 py-12 px-8 rounded-2xl bg-primary/5 border border-primary/15 animate-fade-in-slow" style={{ animationDelay: "0.8s" }}>
            <div className="flex items-start gap-4">
              <Heart className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  What this means for Vyana
                </h2>
                <p className="text-foreground leading-[1.9] text-[17px] font-semibold">
                  Vyana is not a market opportunity I identified. It's a problem I lived.
                </p>
                <p className="text-muted-foreground leading-[1.9] text-[17px]">
                  The longitudinal clinical memory layer I'm building is the thing 
                  that would have helped my grandparents' doctors make better decisions 
                  in those five minutes.
                </p>
                <p className="text-muted-foreground leading-[1.9] text-[17px]">
                  It's what would have given my family visibility into what was 
                  happening in that operating theater.
                </p>
                <p className="text-muted-foreground leading-[1.9] text-[17px]">
                  It's what would have stopped my father's doctors from ordering 
                  repeat tests he'd already done.
                </p>
                <p className="text-foreground leading-[1.9] text-[17px] font-semibold">
                  The product is personal in a way that most founders' products are not.
                </p>
              </div>
            </div>
          </div>

          {/* What Vyana does */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-4">
              What Vyana does
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-[1.9] text-[17px]">
                Patient uploads a prescription photo → AI extracts clinical data → 
                Vyana builds a longitudinal record → patient shares a one-screen 
                summary at their next doctor visit → doctor sees complete history 
                in 30 seconds.
              </p>
              <p className="text-muted-foreground leading-[1.9] text-[17px]">
                We track values like HbA1c, blood pressure, cholesterol over time. 
                We flag when readings fall outside range. We alert when trends suggest 
                a condition is worsening. We give doctors the full picture without 
                asking patients to explain it.
              </p>
              <p className="text-muted-foreground leading-[1.9] text-[17px]">
                Built multilingual. ABHA-linked. ABDM compliant. Designed for the 
                daughter tracking her father's medications on her phone.
              </p>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center space-y-6">
          <p className="text-xl text-foreground font-semibold">
            Every patient deserves a doctor who knows their story.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="gradient"
              size="lg"
              className="group text-base px-8 py-6 rounded-full"
              onClick={() => window.location.href = "mailto:mbaid@wharton.upenn.edu"}
            >
              Partner with us
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 py-6 rounded-full"
              onClick={() => navigate("/auth")}
            >
              Try Vyana
            </Button>
          </div>
        </div>

        <footer className="mt-20 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 <span className="text-gradient-warm font-semibold">Vyana</span>. Every patient deserves a doctor who knows their story.
          </p>
        </footer>
      </article>
    </div>
  );
};

export default WhyVyana;
