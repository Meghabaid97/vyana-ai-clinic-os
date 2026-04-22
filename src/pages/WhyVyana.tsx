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
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(window.scrollY / total, 1) : 0);

      const threshold = window.innerHeight * 0.35;
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

  // Editorial palette — a warmer, deeper paper than landing
  const paper = "hsl(34 32% 93%)";
  const ink = "hsl(22 24% 12%)";
  const inkSoft = "hsl(22 18% 26%)";
  const inkMuted = "hsl(22 12% 46%)";
  const rule = "hsl(22 18% 55% / 0.28)";

  return (
    <div
      className={inApp ? "" : "min-h-screen"}
      style={{ background: inApp ? undefined : paper, color: inApp ? undefined : ink }}
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

      {/* Paper grain */}
      {!inApp && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none opacity-[0.12] mix-blend-multiply z-0"
          style={{
            backgroundImage:
              "radial-gradient(hsl(22 25% 18% / 0.5) 0.4px, transparent 0.4px)",
            backgroundSize: "3px 3px",
          }}
        />
      )}

      {/* Top bar */}
      {!inApp && (
        <nav
          className="sticky top-0 z-50 backdrop-blur-md safe-area-top border-b"
          style={{ background: "hsl(34 32% 93% / 0.85)", borderColor: rule }}
        >
          <div className="max-w-[1180px] mx-auto px-6 lg:px-10 h-12 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-medium"
              style={{ color: inkSoft }}
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
            <div
              className="text-[10px] tracking-[0.32em] uppercase"
              style={{ color: inkMuted }}
            >
              A letter from the founder
            </div>
            <div
              className="hidden md:block text-[10px] tabular-nums tracking-wider"
              style={{ color: inkMuted }}
            >
              {String(Math.round(progress * 100)).padStart(2, "0")} / 100
            </div>
          </div>
        </nav>
      )}

      {/* HERO — tighter, with eyebrow + signature */}
      <section className="relative z-10">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div
            className="flex items-center gap-3 text-[10px] tracking-[0.32em] uppercase mb-10"
            style={{ color: inkMuted }}
          >
            <span>Tirupur · Tamil Nadu</span>
            <span className="h-px w-6" style={{ background: "hsl(22 18% 60% / 0.6)" }} />
            <span>An essay by Megha</span>
          </div>

          <h1
            className="font-serif tracking-[-0.035em] max-w-[16ch]"
            style={{
              color: ink,
              fontSize: "clamp(44px, 8.6vw, 116px)",
              lineHeight: 0.94,
            }}
          >
            We built Vyana because we{" "}
            <em className="italic font-normal text-primary">lost</em> people we loved.
          </h1>

          <div className="mt-12 flex items-start gap-6 max-w-[640px]">
            <div
              className="hidden sm:block shrink-0 w-12 h-px mt-4"
              style={{ background: "hsl(22 18% 40% / 0.5)" }}
            />
            <p
              className="font-serif italic"
              style={{
                color: inkSoft,
                fontSize: "clamp(16px, 1.6vw, 19px)",
                lineHeight: 1.6,
              }}
            >
              This is not a pitch. This is the reason a company exists. If you read
              nothing else on this site, read this.
            </p>
          </div>
        </div>
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="h-px" style={{ background: rule }} />
        </div>
      </section>

      {/* MAIN — sidebar TOC + narrow article */}
      <div
        ref={articleRef}
        className="relative z-10 max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-8 lg:gap-10 pt-16 sm:pt-20"
      >
        {/* Sticky index */}
        <aside className="hidden lg:block col-span-3">
          <div className="sticky top-24">
            <p
              className="text-[9px] tracking-[0.32em] uppercase font-semibold mb-5"
              style={{ color: inkMuted }}
            >
              Contents
            </p>
            <ul className="space-y-3">
              {chapters.map((c) => {
                const active = activeChapter === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => scrollToChapter(c.id)}
                      className="group flex items-center gap-3 text-left w-full transition-colors"
                      style={{ color: active ? ink : inkMuted }}
                    >
                      <span
                        className="font-mono text-[10px] tabular-nums tracking-wider w-5"
                        style={{ color: active ? "hsl(var(--primary))" : "hsl(22 12% 60%)" }}
                      >
                        {c.numeral}
                      </span>
                      <span
                        className={`text-[12.5px] leading-tight ${active ? "font-medium" : ""}`}
                      >
                        {c.short}
                      </span>
                      {active && (
                        <span className="ml-auto h-px w-5 bg-primary self-center" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div
              className="mt-10 pt-6 border-t text-[10px] leading-relaxed"
              style={{ borderColor: rule, color: inkMuted }}
            >
              <p className="tracking-wide">5 min read</p>
              <p className="mt-1 italic font-serif text-[12px]" style={{ color: inkSoft }}>
                Written in one sitting, in 2024.
              </p>
            </div>
          </div>
        </aside>

        {/* Article column */}
        <article
          className="col-span-12 lg:col-span-9 max-w-[640px]"
          style={{ fontSize: "18px", lineHeight: 1.78, color: inkSoft }}
        >
          {/* CHAPTER 1 */}
          <section id="ch-1" className="scroll-mt-24">
            <ChapterMarker num="01" title="Tirupur, 2005" rule={rule} ink={ink} muted={inkMuted} />

            <p
              className="mt-10"
              style={{
                // drop cap
              }}
            >
              <span
                className="font-serif italic float-left mr-3 mt-1"
                style={{
                  color: "hsl(var(--primary))",
                  fontSize: "82px",
                  lineHeight: "0.78",
                }}
              >
                I
              </span>
              was a child when I watched my grandmother die in the back of an ambulance.
            </p>

            <p className="mt-6">
              Tirupur is a small city in Tamil Nadu. The nearest hospital that could
              actually do anything was forty-five minutes away. So that's where the
              ambulance went, siren on, my grandfather holding her hand, my mother
              trying not to cry in front of me.
            </p>

            <p className="mt-6">
              When we got there, the doctor had five minutes. Five minutes to understand
              a woman whose body had been telling stories for seventy years. He asked
              questions. We didn't have answers. We didn't have her old reports. We
              didn't know which medications she was on that week. We didn't know what
              the cardiologist in Coimbatore had said three months ago.
            </p>

            <p className="mt-6">
              We were sent outside. The doors closed. The doctors said it was going
              fine.
            </p>

            <blockquote className="my-14 sm:my-16">
              <p
                className="font-serif tracking-[-0.02em]"
                style={{
                  color: ink,
                  fontSize: "clamp(34px, 4.6vw, 52px)",
                  lineHeight: 1.05,
                }}
              >
                It wasn't <em className="italic text-primary">going</em> fine.
              </p>
              <p
                className="mt-5 font-serif italic"
                style={{ color: inkSoft, fontSize: "19px", lineHeight: 1.55 }}
              >
                A year later, my grandfather. Same hospital. Same five minutes. Same
                questions nobody could answer.
              </p>
            </blockquote>

            <p>
              I was eleven. I remember thinking, very clearly, that the doctor wasn't a
              bad man. He was just guessing. He was guessing because we hadn't given him
              anything to know.
            </p>

            {/* Photo — framed, full column width */}
            <figure className="my-12 -mx-2 sm:mx-0">
              <div
                className="relative p-3 sm:p-4 shadow-[0_30px_60px_-30px_rgba(40,20,10,0.35)]"
                style={{ background: "hsl(36 30% 98%)" }}
              >
                <img
                  src={familyPhoto}
                  alt="My grandparents, Tirupur, around 2004"
                  loading="lazy"
                  className="block w-full h-auto grayscale contrast-[1.05] sepia-[0.18]"
                />
                <div
                  aria-hidden
                  className="absolute inset-3 sm:inset-4 pointer-events-none mix-blend-multiply opacity-25"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, hsl(22 22% 10% / 0.35) 100%)",
                  }}
                />
              </div>
              <figcaption
                className="mt-4 font-serif italic text-[13.5px] leading-relaxed pl-1"
                style={{ color: inkMuted }}
              >
                My grandparents. Tirupur, around 2004. The last photo we have of them
                together.
              </figcaption>
            </figure>
          </section>

          {/* CHAPTER 2 */}
          <section id="ch-2" className="scroll-mt-24 mt-20">
            <ChapterMarker num="02" title="COVID, 2020" rule={rule} ink={ink} muted={inkMuted} />

            <p className="mt-10">
              Fifteen years later. My father called me at 2 AM. He was holding his
              stomach and couldn't stand up.
            </p>

            <p className="mt-6">
              The doctors found gangrene. His intestines had stopped getting blood. They
              gave us twenty-four hours to decide whether to operate. None of us had
              ever heard the word before. None of us knew what we were agreeing to.
              There was no second opinion to get at 2 AM in a pandemic. There was just
              a phone, and my father in pain, and a decision.
            </p>

            <p
              className="mt-8 font-serif"
              style={{ color: ink, fontSize: "23px", lineHeight: 1.45 }}
            >
              I made the call. He survived.
            </p>

            <p className="mt-8">
              I want to be honest with you about what happened next. He survived the
              surgery. The recovery took almost a year. And in those quiet, terrified
              months, sitting next to him, I kept thinking the same thing on a loop:
            </p>

            <blockquote
              className="my-10 pl-6 border-l-2"
              style={{ borderColor: "hsl(var(--primary))" }}
            >
              <p
                className="font-serif italic"
                style={{
                  color: ink,
                  fontSize: "clamp(20px, 2.4vw, 26px)",
                  lineHeight: 1.4,
                }}
              >
                None of this had to be this hard. We had every record. They were just
                scattered across fifteen folders, three cities, and four pharmacies.
                Nobody, not one doctor, had ever seen all of it.
              </p>
            </blockquote>
          </section>

          {/* CHAPTER 3 */}
          <section id="ch-3" className="scroll-mt-24 mt-20">
            <ChapterMarker num="03" title="75 pages" rule={rule} ink={ink} muted={inkMuted} />

            <p className="mt-10">
              There is a quieter version of this story that every Indian family knows.
            </p>

            <p className="mt-6">
              You walk into a new doctor's office with a plastic folder. Inside:
              seventy-five pages of lab reports, prescriptions, discharge summaries,
              X-rays the wrong size to fit anywhere. The doctor flips through six of
              them. Then orders the same blood test you did last month, because she
              doesn't trust the previous lab.
            </p>

            <p className="mt-6">
              Every visit, the clock resets. Every doctor starts from zero. Your
              mother's HbA1c has been creeping up for two years and nobody has noticed
              because nobody is looking at the trend, only the latest number on a single
              page. Your father has been on three medications that quietly interact
              with each other since 2019.
            </p>

            {/* Stats — newspaper rule */}
            <div
              className="mt-12 mb-2 grid grid-cols-3 gap-5 sm:gap-8 border-t border-b py-7"
              style={{ borderColor: rule }}
            >
              {[
                { n: "75", l: "scattered pages, per family" },
                { n: "0", l: "longitudinal view of vitals" },
                { n: "5", l: "minutes to explain a life" },
              ].map((s) => (
                <div key={s.l}>
                  <div
                    className="font-serif tracking-[-0.04em]"
                    style={{
                      color: ink,
                      fontSize: "clamp(36px, 4.4vw, 52px)",
                      lineHeight: 1,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mt-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.14em] leading-snug"
                    style={{ color: inkMuted }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-10">
              Families burn money on repeated tests. They burn time in waiting rooms.
              They burn trust in a system that asks them, every single time, to remember
              everything perfectly while they are at their most frightened.
            </p>

            <p className="mt-6">
              And quietly, in the background, conditions get worse. Because nobody is
              looking at the whole picture over time. Nobody is the keeper of the story.
            </p>
          </section>
        </article>
      </div>

      {/* FULL-BLEED DARK SECTION */}
      <section
        className="relative mt-24 sm:mt-28 py-24 sm:py-32 overflow-hidden"
        style={{ background: "hsl(22 30% 7%)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(hsl(36 30% 90%) 0.5px, transparent 0.5px)",
            backgroundSize: "5px 5px",
          }}
        />
        {/* Decorative top hairline */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-32"
          style={{ background: "hsl(var(--primary) / 0.5)" }}
        />

        <div className="relative max-w-[1180px] mx-auto px-6 lg:px-10">
          <div className="max-w-[680px] mx-auto">
            <p className="text-[10px] tracking-[0.35em] uppercase text-primary font-semibold mb-8 text-center">
              Why this product exists
            </p>
            <p
              className="font-serif tracking-[-0.025em] text-white text-center"
              style={{
                fontSize: "clamp(28px, 4.4vw, 48px)",
                lineHeight: 1.1,
              }}
            >
              Vyana is not a market opportunity I noticed.
            </p>
            <p
              className="mt-4 font-serif italic tracking-[-0.02em] text-primary text-center"
              style={{
                fontSize: "clamp(22px, 3.4vw, 36px)",
                lineHeight: 1.2,
              }}
            >
              It is the thing that would have saved my grandparents.
            </p>

            <div
              className="mt-12 grid sm:grid-cols-3 gap-6 sm:gap-8 text-[14.5px] leading-[1.7]"
              style={{ color: "hsl(36 18% 78%)" }}
            >
              <p>
                The screen the doctor in that emergency room would have seen instead of
                our terrified faces.
              </p>
              <p>
                The trend line that would have caught my father's condition long before
                it became a 2 AM phone call.
              </p>
              <p>
                The one thing the family carries into every hospital room, in every
                language, on a phone that has barely any battery left.
              </p>
            </div>

            <div className="mt-14 pt-8 border-t border-white/10 text-center">
              <p
                className="font-serif italic text-white/90 max-w-[520px] mx-auto"
                style={{ fontSize: "19px", lineHeight: 1.55 }}
              >
                This product is personal. More personal than most founders will ever
                admit theirs is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4 + closing */}
      <div className="relative z-10 max-w-[1180px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-8 lg:gap-10 py-20 sm:py-28">
        <div className="hidden lg:block col-span-3" />
        <div
          className="col-span-12 lg:col-span-9 max-w-[640px]"
          style={{ fontSize: "18px", lineHeight: 1.78, color: inkSoft }}
        >
          <section id="ch-4" className="scroll-mt-24">
            <ChapterMarker num="04" title="What we built" rule={rule} ink={ink} muted={inkMuted} />

            <p className="mt-10">
              You take a photo of a prescription. Vyana reads it. It reads it in Tamil,
              in Hindi, in the doctor's terrible handwriting. It pulls out the
              medication, the dose, the diagnosis, the next test. It does this for
              every report you've ever received.
            </p>

            <p className="mt-6">
              And then, quietly, it keeps watching. Your HbA1c over four years, not
              four months. Your blood pressure on the days you remembered to log it.
              The medication your cardiologist added that your endocrinologist doesn't
              know about.
            </p>

            <p className="mt-6">
              At the next visit, you don't bring a folder. You hand the doctor your
              phone. One screen. Thirty seconds. They know everything they need to know
              to make a good decision.
            </p>

            <div className="flex flex-wrap gap-2 mt-10">
              {["Multilingual", "ABHA-linked", "ABDM compliant", "Built for families"].map(
                (t) => (
                  <span
                    key={t}
                    className="text-[11px] tracking-wide px-3 py-1 rounded-full border"
                    style={{ borderColor: "hsl(22 18% 55% / 0.4)", color: inkSoft }}
                  >
                    {t}
                  </span>
                )
              )}
            </div>

            <p className="mt-10">
              We built it for the daughter tracking her father's medications from
              another city. For the son arriving at the ER at 2 AM with nothing in his
              hand but a phone. For every family that has ever sat in a waiting room
              and realized, with a sinking feeling, that they don't remember what year
              the surgery was.
            </p>
          </section>

          {/* Closing kicker */}
          <div className="mt-20 text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-px bg-primary/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="w-10 h-px bg-primary/50" />
            </div>
            <p
              className="font-serif tracking-[-0.015em] max-w-[520px] mx-auto"
              style={{
                color: ink,
                fontSize: "clamp(24px, 3.2vw, 36px)",
                lineHeight: 1.2,
              }}
            >
              Every patient deserves a doctor who already{" "}
              <em className="italic text-primary">knows their story.</em>
            </p>

            <div className="mt-12 inline-flex flex-col items-center">
              <p
                className="font-serif italic"
                style={{ color: ink, fontSize: "24px" }}
              >
                — Megha
              </p>
              <p
                className="text-[10px] tracking-[0.3em] uppercase mt-2"
                style={{ color: inkMuted }}
              >
                Founder · Vyana
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-12">
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

          <footer
            className="mt-20 pt-6 border-t flex items-center justify-between text-[10px] tracking-[0.22em] uppercase"
            style={{ borderColor: rule, color: inkMuted }}
          >
            <span>© 2025 Vyana</span>
            <span>For Indian families</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

const ChapterMarker = ({
  num,
  title,
  rule,
  ink,
  muted,
}: {
  num: string;
  title: string;
  rule: string;
  ink: string;
  muted: string;
}) => (
  <div
    className="flex items-baseline gap-4 pb-3 border-b"
    style={{ borderColor: rule }}
  >
    <span className="font-mono text-[11px] tabular-nums tracking-wider text-primary">
      {num}
    </span>
    <span
      className="font-serif italic text-[14px]"
      style={{ color: muted }}
    >
      Chapter
    </span>
    <span
      className="font-serif text-[15px] ml-auto"
      style={{ color: ink }}
    >
      {title}
    </span>
  </div>
);

export default WhyVyana;
