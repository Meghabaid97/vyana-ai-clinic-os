import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import heroBg from "@/assets/landing-hero-painting.jpg";
import familyPhoto from "@/assets/family-tirupur-2005.jpg";

const WhyVyana = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inApp = location.pathname.startsWith("/app");

  return (
    <div
      className={inApp ? "bg-[hsl(36_30%_96%)]" : "min-h-screen"}
      style={
        !inApp
          ? { background: "linear-gradient(180deg, hsl(36 30% 96%) 0%, hsl(34 28% 93%) 60%, hsl(36 30% 96%) 100%)" }
          : undefined
      }
    >
      {/* Subtle paper grain */}
      {!inApp && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none opacity-[0.14] mix-blend-multiply z-0"
          style={{
            backgroundImage:
              "radial-gradient(hsl(22 25% 20% / 0.15) 0.5px, transparent 0.5px)",
            backgroundSize: "3px 3px",
          }}
        />
      )}

      {/* Nav */}
      {!inApp && (
        <nav className="sticky top-0 z-50 backdrop-blur-sm border-b safe-area-top" style={{ background: "hsl(36 30% 96% / 0.9)", borderColor: "hsl(22 20% 80% / 0.3)" }}>
          <div className="max-w-[700px] mx-auto px-6 h-14 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[hsl(22_20%_30%)]" />
              <span className="font-serif text-xl text-[hsl(22_20%_18%)] tracking-tight">Vyana</span>
            </button>
            <Button
              size="sm"
              className="h-8 px-4 text-[13px] rounded-full"
              onClick={() => navigate("/auth")}
            >
              Try Vyana now
            </Button>
          </div>
        </nav>
      )}

      {/* Hero header with backdrop */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-40"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, hsl(36 30% 96% / 0.6) 0%, hsl(36 30% 96%) 100%)",
            }}
          />
        </div>
        <div className="relative z-10 max-w-[700px] mx-auto px-5 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20">
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-semibold mb-5 animate-fade-in-slow">
            The story behind Vyana
          </p>
          <h1 className="font-serif text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.05] tracking-[-0.02em] text-[hsl(22_20%_14%)] animate-fade-in-slow">
            Why this{" "}
            <em className="italic text-primary font-normal">matters to us.</em>
          </h1>
        </div>
      </div>

      {/* Article body */}
      <article className="relative z-10 max-w-[700px] mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <div className="space-y-16 text-[16px] leading-[1.85] text-[hsl(22_15%_35%)]">
          {/* Section 1 */}
          <section className="space-y-5 animate-fade-in-slow" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-serif italic text-primary text-[13px]">I</span>
              <div className="h-px flex-1 bg-[hsl(22_20%_80%/0.4)]" />
            </div>
            <h2 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] text-[hsl(22_20%_14%)]">
              Tirupur, 2005
            </h2>
            <p>
              I grew up in Tirupur, a small city in Tamil Nadu. In 2005 and 2006, both of my grandparents passed away. They were rushed by ambulance to the nearest district hospital, 45 minutes away, because there were no adequate medical facilities in our town.
            </p>
            <p>
              When they arrived, my family had five minutes to explain everything to a doctor who had no records, no history, no context. The family was kept outside the operation theater. The doctors said everything was fine.
            </p>
            <p className="font-serif italic text-[20px] text-[hsl(22_20%_14%)] leading-[1.5]">
              It wasn't. We lost both of them.
            </p>

            {/* Family photo thumbnail */}
            <div className="pt-4">
              <img
                src={familyPhoto}
                alt="Family photo from Tirupur, 2005"
                loading="lazy"
                width={120}
                height={120}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg object-cover border-2 border-[hsl(22_20%_80%/0.4)] shadow-md"
              />
              <p className="text-[11px] text-[hsl(22_15%_50%)] mt-2 italic">
                Tirupur, 2005
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-5 animate-fade-in-slow" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-serif italic text-primary text-[13px]">II</span>
              <div className="h-px flex-1 bg-[hsl(22_20%_80%/0.4)]" />
            </div>
            <h2 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] text-[hsl(22_20%_14%)]">
              COVID, 2020
            </h2>
            <p>
              During the pandemic, my father developed sudden severe stomach pain. The doctors found gangrene in his intestines. Blood flow had stopped completely. They had 24 hours to decide whether to proceed with emergency surgery.
            </p>
            <p>
              Our family had never heard of this condition. We had no medical records, no second opinion infrastructure, no time. Just fear and a decision that had to be made before morning.
            </p>
            <p>
              I made the call. He survived. But the recovery was long, and somewhere in those sleepless nights, something became very clear to me: the crisis doesn't end when the surgery does. And none of this had to be so hard.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-5 animate-fade-in-slow" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-serif italic text-primary text-[13px]">III</span>
              <div className="h-px flex-1 bg-[hsl(22_20%_80%/0.4)]" />
            </div>
            <h2 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] text-[hsl(22_20%_14%)]">
              The everyday version
            </h2>
            <p>
              And then there's the quieter version that every Indian family knows. Every time someone visits a new doctor, they arrive with 75 pages of scattered reports. And still get asked to redo the same blood tests because the new doctor doesn't trust the previous lab.
            </p>
            <p>
              Every visit resets the clock. Every doctor starts from zero. Families burn money on repeated tests and watch conditions worsen slowly because nobody is looking at the whole picture over time.
            </p>
          </section>

          {/* Callout card */}
          <div
            className="my-6 rounded-2xl px-8 sm:px-10 py-10 sm:py-12 animate-fade-in-slow"
            style={{
              animationDelay: "0.4s",
              background: "linear-gradient(135deg, hsl(22 28% 12%) 0%, hsl(20 22% 16%) 100%)",
            }}
          >
            <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-semibold mb-6">
              What this means for Vyana
            </p>
            <p className="font-serif text-[22px] sm:text-[28px] leading-[1.3] text-white mb-6">
              Vyana is not a market opportunity I identified.{" "}
              <em className="italic text-primary font-normal">It is a problem I lived through.</em>
            </p>
            <div className="space-y-3 text-[15px] leading-[1.8] text-[hsl(30_15%_80%)]">
              <p>The clinical memory layer I am building is the thing that would have helped my grandparents' doctors make better decisions in those five minutes.</p>
              <p>It is what would have given my family visibility into what was happening inside that operating theater.</p>
              <p>It is what would have stopped my father's doctors from ordering the same tests he had already done.</p>
            </div>
            <p className="font-serif italic text-[18px] text-white mt-8 leading-[1.5]">
              This product is personal. More personal than most founders will ever admit about theirs.
            </p>
          </div>

          {/* Section 4 */}
          <section className="space-y-5">
            <div className="flex items-center gap-4 mb-2">
              <span className="font-serif italic text-primary text-[13px]">IV</span>
              <div className="h-px flex-1 bg-[hsl(22_20%_80%/0.4)]" />
            </div>
            <h2 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] text-[hsl(22_20%_14%)]">
              What Vyana does
            </h2>
            <p>
              A patient uploads a prescription photo. Our AI extracts the clinical data. Vyana builds a record that grows with every visit, every lab report, every prescription. At the next doctor's appointment, the patient shares a one-screen summary. The doctor sees the complete history in 30 seconds.
            </p>
            <p>
              We track values like HbA1c, blood pressure, and cholesterol over time. We flag when readings fall outside the normal range. We give doctors the full picture so patients never have to explain it from scratch again.
            </p>
            <p>
              Built multilingual. ABHA-linked. ABDM compliant. Designed for the daughter tracking her father's medications from her phone, and for the son rushing to the ER at 2 AM with nothing but his phone in his hand.
            </p>
          </section>
        </div>

        {/* Closing */}
        <div className="mt-20 text-center space-y-6">
          <div className="w-12 h-px bg-primary/40 mx-auto" />
          <p className="font-serif italic text-[20px] sm:text-[24px] leading-[1.5] text-[hsl(22_20%_14%)]">
            Every patient deserves a doctor who already knows their story.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              className="group h-11 px-6 text-[15px] rounded-full"
              onClick={() => (window.location.href = "mailto:mbaid@wharton.upenn.edu")}
            >
              Partner with us
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-6 text-[15px] text-[hsl(22_15%_35%)] hover:text-[hsl(22_20%_14%)]"
              onClick={() => navigate("/auth")}
            >
              Try Vyana
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t text-center" style={{ borderColor: "hsl(22 20% 80% / 0.3)" }}>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[hsl(22_15%_55%)]">
            © 2025 Vyana · Built in Tirupur · Wharton · For Indian families
          </p>
        </footer>
      </article>
    </div>
  );
};

export default WhyVyana;
