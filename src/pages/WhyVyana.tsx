import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import familyPhoto from "@/assets/family-tirupur-2005.jpg";

const chapters = [
  { id: "ch-1", numeral: "01", title: "Tirupur, 2005", short: "The loss" },
  { id: "ch-2", numeral: "02", title: "COVID, 2020", short: "The call" },
  { id: "ch-3", numeral: "03", title: "75 pages", short: "The pattern" },
  { id: "ch-4", numeral: "04", title: "What we built", short: "The answer" },
];

const WhyVyana = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inApp = location.pathname.startsWith("/app");
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState("ch-1");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(Math.min(scrolled / Math.max(total, 1), 1));

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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={inApp ? "bg-[hsl(36_30%_96%)]" : "min-h-screen bg-[hsl(36_28%_94%)] text-[hsl(22_22%_14%)]"}
    >
      {/* Reading progress */}
      {!inApp && (
        <div aria-hidden className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Subtle paper grain */}
      {!inApp && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none opacity-[0.18] mix-blend-multiply z-0"
          style={{
            backgroundImage: "radial-gradient(hsl(22 25% 18% / 0.18) 0.5px, transparent 0.5px)",
            backgroundSize: "3px 3px",
          }}
        />
      )}

      {/* Minimal nav (no logo flourish — quieter than landing) */}
      {!inApp && (
        <nav className="sticky top-0 z-50 backdrop-blur-md safe-area-top" style={{ background: "hsl(36 28% 94% / 0.85)" }}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-[hsl(22_18%_30%)] hover:text-[hsl(22_22%_14%)] transition-colors"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
            <div className="text-[11px] tracking-[0.3em] uppercase text-[hsl(22_15%_45%)]">
              A letter from the founder
            </div>
            <div className="hidden md:block text-[11px] tabular-nums text-[hsl(22_15%_45%)]">
              {String(Math.round(progress * 100)).padStart(2, "0")} / 100
            </div>
          </div>
        </nav>
      )}

      {/* HERO — typographic, no image. Very different from landing's painted hero. */}
      <section className="relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-20 sm:pt-32 pb-24 sm:pb-40">
          {/* Date / location stamp */}
          <div className="flex items-center gap-4 text-[11px] tracking-[0.3em] uppercase text-[hsl(22_15%_42%)] mb-16">
            <span>Tirupur · Tamil Nadu</span>
            <span className="h-px w-8 bg-[hsl(22_18%_60%/0.6)]" />
            <span>2005 — Today</span>
          </div>

          {/* Massive condensed editorial title */}
          <h1 className="font-serif text-[56px] sm:text-[100px] lg:text-[148px] leading-[0.88] tracking-[-0.045em] text-[hsl(22_22%_10%)] max-w-[1100px]">
            We built Vyana
            <br />
            because we{" "}
            <em className="italic font-normal text-primary">lost</em>
            <br />
            people we loved.
          </h1>

          {/* Long quiet pause */}
          <div className="mt-20 sm:mt-32 grid grid-cols-12 gap-6">
            <div className="hidden lg:block col-span-3" />
            <p className="col-span-12 lg:col-span-6 font-serif text-[18px] sm:text-[22px] leading-[1.55] text-[hsl(22_18%_28%)] max-w-[560px]">
              This is not a pitch. This is the reason a company exists. If you read nothing else, read this.
            </p>
            <div className="hidden lg:block col-span-3" />
          </div>
        </div>

        {/* Hairline divider */}
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="h-px bg-[hsl(22_18%_55%/0.3)]" />
        </div>
      </section>

      {/* MAIN — single narrow column. Very different from landing's wide horizontal sections. */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-12 gap-6 lg:gap-12 pt-20">
        {/* Sticky index */}
        <aside className="hidden lg:block col-span-3">
          <div className="sticky top-28">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[hsl(22_15%_45%)] font-semibold mb-6">
              Contents
            </p>
            <ul className="space-y-4">
              {chapters.map((c) => {
                const active = activeChapter === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => scrollToChapter(c.id)}
                      className={`group flex items-baseline gap-3 text-left w-full transition-all ${
                        active ? "text-[hsl(22_22%_12%)]" : "text-[hsl(22_15%_45%)] hover:text-[hsl(22_22%_20%)]"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] tabular-nums tracking-wider ${
                          active ? "text-primary" : "text-[hsl(22_15%_55%)]"
                        }`}
                      >
                        {c.numeral}
                      </span>
                      <span className={`text-[13px] leading-tight ${active ? "font-medium" : ""}`}>
                        {c.short}
                      </span>
                      {active && <span className="ml-auto h-px w-6 bg-primary self-center" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Article — narrow */}
        <article ref={articleRef} className="col-span-12 lg:col-span-7 lg:col-start-4 max-w-[640px]">
          <div className="space-y-24 text-[18px] leading-[1.85] text-[hsl(22_18%_25%)]">
            {/* CHAPTER 1 */}
            <section id="ch-1" className="scroll-mt-24">
              <ChapterMarker num="01" title="Tirupur, 2005" />

              {/* Drop cap, raw opening */}
              <p className="first-letter:font-serif first-letter:text-[88px] first-letter:leading-[0.78] first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-primary first-letter:italic mt-10">
                I was a child when I watched my grandmother die in the back of an ambulance.
              </p>

              <p className="mt-6">
                Tirupur is a small city in Tamil Nadu. The nearest hospital that could actually do anything was forty-five minutes away. So that's where the ambulance went, siren on, my grandfather holding her hand, my mother trying not to cry in front of me.
              </p>

              <p className="mt-6">
                When we got there, the doctor had five minutes. Five minutes to understand a woman whose body had been telling stories for seventy years. He asked questions. We didn't have answers. We didn't have her old reports. We didn't know which medications she was on that week. We didn't know what the cardiologist in Coimbatore had said three months ago.
              </p>

              <p className="mt-6">
                We were sent outside. The doors closed. The doctors said it was going fine.
              </p>

              {/* Big, devastating pull quote */}
              <blockquote className="my-16 sm:my-20">
                <p className="font-serif text-[40px] sm:text-[56px] leading-[1.05] tracking-[-0.025em] text-[hsl(22_22%_10%)]">
                  It wasn't <em className="italic text-primary">going</em> fine.
                </p>
                <p className="mt-6 font-serif text-[20px] sm:text-[22px] italic text-[hsl(22_18%_30%)] leading-[1.5]">
                  A year later, my grandfather. Same hospital. Same five minutes. Same questions nobody could answer.
                </p>
              </blockquote>

              <p>
                I was eleven. I remember thinking, very clearly, that the doctor wasn't a bad man. He was just guessing. He was guessing because we hadn't given him anything to know.
              </p>

              {/* Photo, integrated as figure not card */}
              <figure className="my-14">
                <div className="relative inline-block">
                  <img
                    src={familyPhoto}
                    alt="My grandparents, Tirupur, around 2004"
                    loading="lazy"
                    className="block w-[260px] sm:w-[300px] h-auto grayscale contrast-[1.05] sepia-[0.15]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-30"
                    style={{ background: "linear-gradient(180deg, transparent 0%, hsl(22 22% 10% / 0.25) 100%)" }}
                  />
                </div>
                <figcaption className="mt-4 font-serif italic text-[14px] text-[hsl(22_15%_42%)] max-w-[300px] leading-relaxed">
                  My grandparents. Tirupur, around 2004. The last photo we have of them together.
                </figcaption>
              </figure>
            </section>

            {/* CHAPTER 2 */}
            <section id="ch-2" className="scroll-mt-24">
              <ChapterMarker num="02" title="COVID, 2020" />

              <p className="mt-10">
                Fifteen years later. My father called me at 2 AM. He was holding his stomach and couldn't stand up.
              </p>

              <p className="mt-6">
                The doctors found gangrene. His intestines had stopped getting blood. They gave us twenty-four hours to decide whether to operate. None of us had ever heard the word before. None of us knew what we were agreeing to. There was no second opinion to get at 2 AM in a pandemic. There was just a phone, and my father in pain, and a decision.
              </p>

              <p className="mt-6 font-serif text-[22px] sm:text-[26px] leading-[1.5] text-[hsl(22_22%_12%)]">
                I made the call. He survived.
              </p>

              <p className="mt-6">
                I want to be honest with you about what happened next. He survived the surgery. The recovery took almost a year. And in those quiet, terrified months, sitting next to him, I kept thinking the same thing on a loop:
              </p>

              <blockquote className="my-12 pl-6 border-l-2 border-primary">
                <p className="font-serif italic text-[22px] sm:text-[28px] leading-[1.4] text-[hsl(22_22%_12%)]">
                  None of this had to be this hard. We had every record. They were just scattered across fifteen folders, three cities, and four pharmacies. Nobody, not one doctor, had ever seen all of it.
                </p>
              </blockquote>
            </section>

            {/* CHAPTER 3 */}
            <section id="ch-3" className="scroll-mt-24">
              <ChapterMarker num="03" title="75 pages" />

              <p className="mt-10">
                There is a quieter version of this story that every Indian family knows.
              </p>

              <p className="mt-6">
                You walk into a new doctor's office with a plastic folder. Inside: seventy-five pages of lab reports, prescriptions, discharge summaries, X-rays the wrong size to fit anywhere. The doctor flips through six of them. Then orders the same blood test you did last month, because she doesn't trust the previous lab.
              </p>

              <p className="mt-6">
                Every visit, the clock resets. Every doctor starts from zero. Your mother's HbA1c has been creeping up for two years and nobody has noticed because nobody is looking at the trend, only the latest number on a single page. Your father has been on three medications that quietly interact with each other since 2019.
              </p>

              {/* Stats — newspaper style */}
              <div className="mt-14 mb-4 grid grid-cols-3 gap-6 sm:gap-10 border-t border-b border-[hsl(22_18%_55%/0.3)] py-8">
                {[
                  { n: "75", l: "scattered pages per family" },
                  { n: "0", l: "longitudinal view of vitals" },
                  { n: "5", l: "minutes to explain a life" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-serif text-[44px] sm:text-[60px] leading-none text-[hsl(22_22%_10%)] tracking-[-0.04em]">
                      {s.n}
                    </div>
                    <div className="mt-3 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[hsl(22_15%_45%)] leading-snug">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-10">
                Families burn money on repeated tests. They burn time in waiting rooms. They burn trust in a system that asks them, every single time, to remember everything perfectly while they are at their most frightened.
              </p>

              <p className="mt-6">
                And quietly, in the background, conditions get worse. Because nobody is looking at the whole picture over time. Nobody is the keeper of the story.
              </p>
            </section>

            {/* DARK CINEMATIC INTERLUDE — full bleed */}
          </div>

          {/* Closing line of the body before dark break */}
        </article>
      </div>

      {/* FULL-BLEED DARK SECTION — completely different rhythm than landing */}
      <section className="relative mt-32 py-28 sm:py-40 overflow-hidden" style={{ background: "hsl(22 28% 8%)" }}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(hsl(36 30% 90%) 0.5px, transparent 0.5px)",
            backgroundSize: "5px 5px",
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-12 gap-6 lg:gap-12">
          <div className="hidden lg:block col-span-3" />
          <div className="col-span-12 lg:col-span-7 lg:col-start-4 max-w-[640px]">
            <p className="text-[11px] tracking-[0.35em] uppercase text-primary font-semibold mb-10">
              Why this product exists
            </p>
            <p className="font-serif text-[34px] sm:text-[52px] leading-[1.05] tracking-[-0.025em] text-white">
              Vyana is not a market opportunity I noticed.
            </p>
            <p className="mt-6 font-serif italic text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.02em] text-primary">
              It is the thing that would have saved my grandparents.
            </p>
            <div className="mt-14 space-y-6 text-[16px] sm:text-[17px] leading-[1.85] text-[hsl(36_20%_82%)] max-w-[560px]">
              <p>
                It is the screen the doctor in that emergency room would have seen instead of our terrified faces.
              </p>
              <p>
                It is the trend line that would have caught my father's condition long before it became a 2 AM phone call.
              </p>
              <p>
                It is the one thing the family carries into every hospital room, in every language, on a phone that has barely any battery left.
              </p>
            </div>

            <div className="mt-16 pt-10 border-t border-white/10">
              <p className="font-serif italic text-[20px] sm:text-[22px] leading-[1.5] text-white/90">
                This product is personal. More personal than most founders will ever admit theirs is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4 + closing — back to light */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-12 gap-6 lg:gap-12 py-28 sm:py-36">
        <div className="hidden lg:block col-span-3" />
        <div className="col-span-12 lg:col-span-7 lg:col-start-4 max-w-[640px]">
          <section id="ch-4" className="scroll-mt-24 text-[18px] leading-[1.85] text-[hsl(22_18%_25%)]">
            <ChapterMarker num="04" title="What we built" />

            <p className="mt-10">
              You take a photo of a prescription. Vyana reads it. It reads it in Tamil, in Hindi, in the doctor's terrible handwriting. It pulls out the medication, the dose, the diagnosis, the next test. It does this for every report you've ever received.
            </p>

            <p className="mt-6">
              And then, quietly, it keeps watching. Your HbA1c over four years, not four months. Your blood pressure on the days you remembered to log it. The medication your cardiologist added that your endocrinologist doesn't know about.
            </p>

            <p className="mt-6">
              At the next visit, you don't bring a folder. You hand the doctor your phone. One screen. Thirty seconds. They know everything they need to know to make a good decision.
            </p>

            {/* Tag chips */}
            <div className="flex flex-wrap gap-2 mt-10">
              {["Multilingual", "ABHA-linked", "ABDM compliant", "Built for families"].map((t) => (
                <span
                  key={t}
                  className="text-[11px] tracking-wide px-3 py-1 rounded-full border border-[hsl(22_18%_55%/0.4)] text-[hsl(22_18%_28%)]"
                >
                  {t}
                </span>
              ))}
            </div>

            <p className="mt-10">
              We built it for the daughter tracking her father's medications from another city. For the son arriving at the ER at 2 AM with nothing in his hand but a phone. For every family that has ever sat in a waiting room and realized, with a sinking feeling, that they don't remember what year the surgery was.
            </p>
          </section>

          {/* Closing — kicker */}
          <div className="mt-28 text-center">
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="w-10 h-px bg-primary/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="w-10 h-px bg-primary/50" />
            </div>
            <p className="font-serif text-[28px] sm:text-[38px] leading-[1.25] tracking-[-0.015em] text-[hsl(22_22%_10%)] max-w-[520px] mx-auto">
              Every patient deserves a doctor who already{" "}
              <em className="italic text-primary">knows their story.</em>
            </p>

            <div className="mt-14 inline-flex flex-col items-center">
              <p className="font-serif italic text-[26px] text-[hsl(22_22%_14%)]">— Megha</p>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[hsl(22_15%_50%)] mt-3">
                Founder · Vyana
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-14">
              <Button
                className="group h-11 px-6 text-[14px] rounded-full"
                onClick={() => navigate("/auth")}
              >
                Try Vyana
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                className="group h-11 px-6 text-[14px]"
                onClick={() => (window.location.href = "mailto:mbaid@wharton.upenn.edu")}
              >
                Write to me
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <footer
            className="mt-24 pt-6 border-t flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-[hsl(22_15%_55%)]"
            style={{ borderColor: "hsl(22 18% 55% / 0.3)" }}
          >
            <span>© 2025 Vyana</span>
            <span>For Indian families</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

const ChapterMarker = ({ num, title }: { num: string; title: string }) => (
  <div className="flex items-baseline gap-4 pb-4 border-b border-[hsl(22_18%_55%/0.3)]">
    <span className="font-mono text-[11px] tabular-nums tracking-wider text-primary">{num}</span>
    <span className="font-serif italic text-[15px] text-[hsl(22_18%_30%)]">{title}</span>
  </div>
);

export default WhyVyana;
