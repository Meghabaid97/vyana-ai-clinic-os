import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const WhyVyana = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inApp = location.pathname.startsWith("/app");

  return (
    <div className={inApp ? "bg-background" : "min-h-screen bg-background"}>
      {!inApp && (
        <nav className="sticky top-0 z-50 bg-background border-b border-border safe-area-top">
          <div className="max-w-[700px] mx-auto px-6 h-12 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">Vyana</span>
            </button>
            <Button size="sm" className="h-7 px-3 text-sm rounded-md" onClick={() => { const el = document.getElementById("contact"); if (el) el.scrollIntoView({ behavior: "smooth" }); else navigate("/"); }}>
              Get Early Access
            </Button>
          </div>
        </nav>
      )}

      <article className="max-w-[700px] mx-auto px-5 sm:px-6 py-8 sm:py-12">
        <header className="mb-12 animate-fade-in-slow">
          <p className="text-sm text-primary font-medium mb-3">The story behind Vyana</p>
          <h1 className="text-3xl lg:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
            Why this <span className="text-primary">matters to us</span>
          </h1>
        </header>

        <div className="space-y-10 text-[15px] leading-[1.8] text-muted-foreground">
          <section className="space-y-4 animate-fade-in-slow" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-lg font-semibold text-foreground">Tirupur, 2005</h2>
            <p>I grew up in Tirupur, a small city in Tamil Nadu. In 2005 and 2006, both of my grandparents passed away. They were rushed by ambulance to the nearest district hospital, 45 minutes away, because there were no adequate medical facilities in our town.</p>
            <p>When they arrived, my family had five minutes to explain everything to a doctor who had no records, no history, no context. The family was kept outside the operation theater. The doctors said everything was fine.</p>
            <p className="text-foreground font-semibold">It wasn't. We lost both of them.</p>
          </section>

          <section className="space-y-4 animate-fade-in-slow" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-lg font-semibold text-foreground">COVID, 2020</h2>
            <p>During the pandemic, my father developed sudden severe stomach pain. The doctors found gangrene in his intestines. Blood flow had stopped completely. They had 24 hours to decide whether to proceed with emergency surgery.</p>
            <p>Our family had never heard of this condition. We had no medical records, no second opinion infrastructure, no time. Just fear and a decision that had to be made before morning.</p>
            <p>I made the call. He survived. But the recovery was long, and somewhere in those sleepless nights, something became very clear to me: the crisis doesn't end when the surgery does. And none of this had to be so hard.</p>
          </section>

          <section className="space-y-4 animate-fade-in-slow" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-lg font-semibold text-foreground">The everyday version</h2>
            <p>And then there's the quieter version that every Indian family knows. Every time someone visits a new doctor, they arrive with 75 pages of scattered reports. And still get asked to redo the same blood tests because the new doctor doesn't trust the previous lab.</p>
            <p>Every visit resets the clock. Every doctor starts from zero. Families burn money on repeated tests and watch conditions worsen slowly because nobody is looking at the whole picture over time.</p>
          </section>

          <div className="my-10 py-6 px-6 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in-slow" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-lg font-semibold text-foreground mb-3">What this means for Vyana</h2>
            <p className="text-foreground font-semibold mb-3">Vyana is not a market opportunity I identified. It is a problem I lived through.</p>
            <p className="mb-2">The clinical memory layer I am building is the thing that would have helped my grandparents' doctors make better decisions in those five minutes.</p>
            <p className="mb-2">It is what would have given my family visibility into what was happening inside that operating theater.</p>
            <p className="mb-2">It is what would have stopped my father's doctors from ordering the same tests he had already done.</p>
            <p className="text-foreground font-semibold">This product is personal. More personal than most founders will ever admit about theirs.</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">What Vyana does</h2>
            <p>A patient uploads a prescription photo. Our AI extracts the clinical data. Vyana builds a record that grows with every visit, every lab report, every prescription. At the next doctor's appointment, the patient shares a one-screen summary. The doctor sees the complete history in 30 seconds.</p>
            <p>We track values like HbA1c, blood pressure, and cholesterol over time. We flag when readings fall outside the normal range. We give doctors the full picture so patients never have to explain it from scratch again.</p>
            <p>Built multilingual. ABHA-linked. ABDM compliant. Designed for the daughter tracking her father's medications from her phone, and for the son rushing to the ER at 2 AM with nothing but his phone in his hand.</p>
          </section>
        </div>

        <div className="mt-14 text-center space-y-4">
          <p className="text-[15px] text-foreground font-semibold">
            Every patient deserves a doctor who already knows their story.
          </p>
          <div className="flex justify-center gap-3">
            <Button className="group h-9 px-5 text-sm rounded-md" onClick={() => (window.location.href = "mailto:mbaid@wharton.upenn.edu")}>
              Partner with us
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button variant="outline" className="h-9 px-5 text-sm rounded-md" onClick={() => navigate("/auth")}>
              Try Vyana
            </Button>
          </div>
        </div>

        <footer className="mt-14 pt-5 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Vyana. Every patient deserves a doctor who knows their story.
          </p>
        </footer>
      </article>
    </div>
  );
};

export default WhyVyana;
