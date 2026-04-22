import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import heroBg from "@/assets/landing-hero-painting.jpg";
import familyPhoto from "@/assets/family-tirupur-2005.jpg";

const chapters = [
  { id: "ch-1", numeral: "I", title: "Tirupur, 2005", short: "The loss" },
  { id: "ch-2", numeral: "II", title: "COVID, 2020", short: "The call" },
  { id: "ch-3", numeral: "III", title: "The everyday version", short: "The pattern" },
  { id: "ch-4", numeral: "IV", title: "What Vyana does", short: "The answer" },
];

const WhyVyana = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inApp = location.pathname.startsWith("/app");
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState("ch-1");
  const articleRef = useRef<HTMLElement>(null);

  // Reading progress + active chapter
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(Math.min(scrolled / Math.max(total, 1), 1));

      // active chapter: nearest section above 30% viewport
      const threshold = window.innerHeight * 0.3;
      let current = chapters[0].id;
      for (const c of chapters) {
        const node = document.getElementById(c.id);
        if (node && node.getBoundingClientRect().top <= threshold) current = c.id;
      }
      setActiveChapter(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToChapter = (id: string) => {
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={inApp ? "bg-[hsl(36_30%_96%)]" : "min-h-screen"}
      style={
        !inApp
          ? { background: "linear-gradient(180deg, hsl(36 30% 96%) 0%, hsl(34 28% 93%) 60%, hsl(36 30% 96%) 100%)" }
          : undefined
      }
    >
      {/* Reading progress bar */}
      {!inApp && (
        <div
          aria-hidden
          className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none"
        >
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Paper grain */}
      {!inApp && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none opacity-[0.14] mix-blend-multiply z-0"
          style={{
            backgroundImage: "radial-gradient(hsl(22 25% 20% / 0.15) 0.5px, transparent 0.5px)",
            backgroundSize: "3px 3px",
          }}
        />
      )}

      {/* Nav */}
      {!inApp && (
        <nav
          className="sticky top-0 z-50 backdrop-blur-md border-b safe-area-top"
          style={{ background: "hsl(36 30% 96% / 0.85)", borderColor: "hsl(22 20% 80% / 0.3)" }}
        >
          <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[hsl(22_20%_30%)]" />
              <span className="font-serif text-xl text-[hsl(22_20%_18%)] tracking-tight">Vyana</span>
            </button>
            <div className="hidden md:flex items-center gap-1 text-[12px] text-[hsl(22_15%_45%)]">
              <span className="font-mono tabular-nums">{String(Math.round(progress * 100)).padStart(2, "0")}%</span>
              <span className="opacity-50">·</span>
              <span>5 min read</span>
            </div>
            <Button size="sm" className="h-8 px-4 text-[13px] rounded-full" onClick={() => navigate("/auth")}>
              Try Vyana
            </Button>
          </div>
        </nav>
      )}

      {/* Hero — editorial cover */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" aria-hidden className="w-full h-full object-cover opacity-40" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, hsl(36 30% 96% / 0.5) 0%, hsl(36 30% 96% / 0.85) 70%, hsl(36 30% 96%) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1100px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28">
          {/* Magazine-style metadata strip */}
          <div className="flex items-center gap-3 sm:gap-4 mb-10 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-[hsl(22_15%_40%)] font-medium">
            <span className="text-primary font-semibold">Founder Letter</span>
            <span className="h-px flex-1 bg-[hsl(22_20%_70%/0.4)] max-w-[120px]" />
            <span>Issue 01</span>
            <span className="opacity-50">·</span>
            <span>Vyana</span>
          </div>

          {/* Massive editorial headline */}
          <h1 className="font-serif text-[44px] sm:text-[72px] lg:text-[104px] leading-[0.95] tracking-[-0.035em] text-[hsl(22_20%_12%)] animate-fade-in-slow">
            Why this
            <br />
            <em className="italic font-normal text-primary">matters</em>
            <span className="text-[hsl(22_20%_12%)]"> to us.</span>
          </h1>

          {/* Standfirst / deck */}
          <p className="mt-10 max-w-[640px] font-serif text-[18px] sm:text-[22px] leading-[1.55] text-[hsl(22_20%_25%)] italic animate-fade-in-slow">
            A small city in Tamil Nadu. Two grandparents. Five minutes to explain everything to a doctor who knew nothing. This is the story behind Vyana.
          </p>

          {/* Byline */}
          <div className="mt-12 flex items-center gap-4 text-[13px] text-[hsl(22_15%_40%)]">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center font-serif italic text-primary text-[15px]">
              M
            </div>
            <div className="leading-tight">
              <div className="text-[hsl(22_20%_18%)] font-medium">Megha Baid</div>
              <div className="text-[11px] tracking-wider uppercase">Founder · Wharton MBA</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout: sticky chapter index + article */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-5 sm:px-8 pb-24 grid grid-cols-12 gap-6 lg:gap-12">
        {/* Sticky chapter index */}
        <aside className="hidden lg:block col-span-3">
          <div className="sticky top-24">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[hsl(22_15%_50%)] font-semibold mb-5">
              Chapters
            </p>
            <ul className="space-y-3">
              {chapters.map((c) => {
                const active = activeChapter === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => scrollToChapter(c.id)}
                      className={`group flex items-start gap-3 text-left w-full transition-all ${
                        active ? "text-[hsl(22_20%_14%)]" : "text-[hsl(22_15%_45%)] hover:text-[hsl(22_20%_20%)]"
                      }`}
                    >
                      <span
                        className={`mt-[6px] h-px transition-all ${
                          active ? "w-8 bg-primary" : "w-4 bg-[hsl(22_20%_70%/0.6)] group-hover:w-6"
                        }`}
                      />
                      <span className="flex flex-col">
                        <span
                          className={`font-serif italic text-[11px] ${
                            active ? "text-primary" : "text-[hsl(22_15%_55%)]"
                          }`}
                        >
                          {c.numeral}
                        </span>
                        <span className="text-[13px] leading-tight font-medium">{c.short}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Article */}
        <article ref={articleRef} className="col-span-12 lg:col-span-9 max-w-[680px]">
          <div className="space-y-20 text-[17px] leading-[1.85] text-[hsl(22_15%_30%)]">
            {/* Section 1 */}
            <section id="ch-1" className="space-y-6 scroll-mt-24">
              <ChapterMarker numeral="I" />
              <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-[hsl(22_20%_12%)]">
                Tirupur, 2005
              </h2>

              {/* Drop cap paragraph */}
              <p className="first-letter:font-serif first-letter:text-[68px] first-letter:leading-[0.85] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-primary first-letter:italic">
                I grew up in Tirupur, a small city in Tamil Nadu. In 2005 and 2006, both of my grandparents passed away. They were rushed by ambulance to the nearest district hospital, 45 minutes away, because there were no adequate medical facilities in our town.
              </p>
              <p>
                When they arrived, my family had five minutes to explain everything to a doctor who had no records, no history, no context. The family was kept outside the operation theater. The doctors said everything was fine.
              </p>

              {/* Pull quote */}
              <blockquote className="my-10 sm:my-14 relative">
                <span
                  aria-hidden
                  className="absolute -top-6 -left-2 font-serif text-[120px] leading-none text-primary/20 select-none"
                >
                  &ldquo;
                </span>
                <p className="relative font-serif italic text-[28px] sm:text-[36px] leading-[1.25] tracking-[-0.01em] text-[hsl(22_20%_12%)] pl-6 border-l-2 border-primary/40">
                  It wasn't.
                  <br />
                  We lost both of them.
                </p>
              </blockquote>

              {/* Polaroid-style figure */}
              <figure className="pt-2 flex flex-col items-start">
                <div
                  className="bg-white p-3 pb-8 shadow-[0_12px_30px_-12px_hsl(22_30%_15%/0.35)] rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
                  style={{ maxWidth: 220 }}
                >
                  <img
                    src={familyPhoto}
                    alt="The Baid family in Tirupur, 2005"
                    loading="lazy"
                    width={200}
                    height={200}
                    className="w-[200px] h-[200px] object-cover"
                  />
                </div>
                <figcaption className="mt-3 ml-2 font-serif italic text-[13px] text-[hsl(22_15%_45%)]">
                  Tirupur · 2005
                </figcaption>
              </figure>
            </section>

            {/* Section 2 */}
            <section id="ch-2" className="space-y-6 scroll-mt-24">
              <ChapterMarker numeral="II" />
              <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-[hsl(22_20%_12%)]">
                COVID, 2020
              </h2>
              <p>
                During the pandemic, my father developed sudden severe stomach pain. The doctors found gangrene in his intestines. Blood flow had stopped completely. They had 24 hours to decide whether to proceed with emergency surgery.
              </p>
              <p>
                Our family had never heard of this condition. We had no medical records, no second opinion infrastructure, no time. Just fear and a decision that had to be made before morning.
              </p>

              {/* Inline emphasis */}
              <p className="font-serif text-[20px] sm:text-[22px] leading-[1.55] text-[hsl(22_20%_15%)]">
                I made the call. He survived.
              </p>
              <p>
                But the recovery was long, and somewhere in those sleepless nights, something became very clear to me: the crisis doesn't end when the surgery does. And none of this had to be so hard.
              </p>
            </section>

            {/* Section 3 */}
            <section id="ch-3" className="space-y-6 scroll-mt-24">
              <ChapterMarker numeral="III" />
              <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-[hsl(22_20%_12%)]">
                The everyday version
              </h2>
              <p>
                And then there's the quieter version that every Indian family knows. Every time someone visits a new doctor, they arrive with 75 pages of scattered reports. And still get asked to redo the same blood tests because the new doctor doesn't trust the previous lab.
              </p>
              <p>
                Every visit resets the clock. Every doctor starts from zero. Families burn money on repeated tests and watch conditions worsen slowly because nobody is looking at the whole picture over time.
              </p>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-[hsl(22_20%_75%/0.4)]">
                {[
                  { n: "75", l: "pages of scattered reports" },
                  { n: "0", l: "longitudinal view of vitals" },
                  { n: "5 min", l: "to explain a lifetime" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-serif text-[28px] sm:text-[36px] leading-none text-primary tracking-tight">
                      {s.n}
                    </div>
                    <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-wider text-[hsl(22_15%_45%)] leading-snug">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Callout — cinematic dark card */}
            <aside
              className="relative my-4 rounded-2xl px-7 sm:px-12 py-12 sm:py-16 overflow-hidden"
              style={{
                background:
                  "radial-gradient(circle at 20% 0%, hsl(20 28% 22%) 0%, hsl(22 28% 12%) 50%, hsl(20 22% 9%) 100%)",
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(white 0.5px, transparent 0.5px)",
                  backgroundSize: "4px 4px",
                }}
              />
              <p className="relative text-[10px] tracking-[0.35em] uppercase text-primary font-semibold mb-7">
                — What this means for Vyana
              </p>
              <p className="relative font-serif text-[24px] sm:text-[34px] leading-[1.25] text-white mb-8 tracking-[-0.01em]">
                Vyana is not a market opportunity I identified.{" "}
                <em className="italic text-primary font-normal">It is a problem I lived through.</em>
              </p>
              <div className="relative space-y-4 text-[15px] leading-[1.8] text-[hsl(30_15%_82%)] max-w-[560px]">
                <p>
                  The clinical memory layer I am building is the thing that would have helped my grandparents' doctors make better decisions in those five minutes.
                </p>
                <p>
                  It is what would have given my family visibility into what was happening inside that operating theater.
                </p>
                <p>
                  It is what would have stopped my father's doctors from ordering the same tests he had already done.
                </p>
              </div>
              <p className="relative font-serif italic text-[18px] sm:text-[20px] text-white/90 mt-10 leading-[1.5] border-t border-white/10 pt-8">
                This product is personal. More personal than most founders will ever admit about theirs.
              </p>
            </aside>

            {/* Section 4 */}
            <section id="ch-4" className="space-y-6 scroll-mt-24">
              <ChapterMarker numeral="IV" />
              <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-[hsl(22_20%_12%)]">
                What Vyana does
              </h2>
              <p>
                A patient uploads a prescription photo. Our AI extracts the clinical data. Vyana builds a record that grows with every visit, every lab report, every prescription. At the next doctor's appointment, the patient shares a one-screen summary. The doctor sees the complete history in 30 seconds.
              </p>
              <p>
                We track values like HbA1c, blood pressure, and cholesterol over time. We flag when readings fall outside the normal range. We give doctors the full picture so patients never have to explain it from scratch again.
              </p>

              {/* Tag chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {["Multilingual", "ABHA-linked", "ABDM compliant", "Built for families"].map((t) => (
                  <span
                    key={t}
                    className="text-[11px] tracking-wide px-3 py-1 rounded-full border border-[hsl(22_20%_70%/0.5)] text-[hsl(22_20%_25%)] bg-white/40 backdrop-blur-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <p>
                Designed for the daughter tracking her father's medications from her phone, and for the son rushing to the ER at 2 AM with nothing but his phone in his hand.
              </p>
            </section>
          </div>

          {/* Closing — kicker */}
          <div className="mt-24 sm:mt-32 text-center space-y-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-primary/40" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="w-8 h-px bg-primary/40" />
            </div>
            <p className="font-serif italic text-[26px] sm:text-[34px] leading-[1.4] text-[hsl(22_20%_12%)] tracking-[-0.01em] max-w-[520px] mx-auto">
              Every patient deserves a doctor who already knows their story.
            </p>

            {/* Signature */}
            <div className="pt-2">
              <p className="font-serif italic text-[22px] text-primary">— Megha</p>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[hsl(22_15%_50%)] mt-2">
                Founder, Vyana
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-6">
              <Button
                className="group h-11 px-6 text-[14px] rounded-full"
                onClick={() => navigate("/auth")}
              >
                Try Vyana now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                className="group h-11 px-6 text-[14px] text-[hsl(22_15%_30%)] hover:text-[hsl(22_20%_14%)]"
                onClick={() => (window.location.href = "mailto:mbaid@wharton.upenn.edu")}
              >
                Partner with us
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <footer
            className="mt-24 pt-6 border-t flex items-center justify-between text-[11px] tracking-[0.15em] uppercase text-[hsl(22_15%_55%)]"
            style={{ borderColor: "hsl(22 20% 80% / 0.3)" }}
          >
            <span>© 2025 Vyana</span>
            <span>For Indian families</span>
          </footer>
        </article>
      </div>
    </div>
  );
};

const ChapterMarker = ({ numeral }: { numeral: string }) => (
  <div className="flex items-center gap-4">
    <span className="font-serif italic text-primary text-[14px]">{numeral}</span>
    <div className="h-px w-12 bg-primary/40" />
    <span className="text-[10px] tracking-[0.3em] uppercase text-[hsl(22_15%_50%)] font-semibold">
      Chapter
    </span>
  </div>
);

export default WhyVyana;
