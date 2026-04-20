import { useReveal } from "@/hooks/use-reveal";
import { PhoneMock, MockStoryScreen, MockTrendsScreen, MockBriefingScreen } from "./PhoneMock";

type Step = {
  n: string;
  eyebrow: string;
  title: string;
  drop: string;
  body: string;
  mock: JSX.Element;
  rotate: number;
};

const steps: Step[] = [
  {
    n: "01",
    eyebrow: "Step One",
    title: "Capture, in seconds.",
    drop: "S",
    body: "nap any prescription, lab report or discharge summary. Vyana's vision AI extracts vitals, medications and diagnoses — handwritten or printed, in five Indian languages. Each scrap of paper becomes a quiet line in your family's ongoing health story.",
    mock: <MockStoryScreen />,
    rotate: -3,
  },
  {
    n: "02",
    eyebrow: "Step Two",
    title: "Build a quiet memory.",
    drop: "T",
    body: "hirty-three clinical vitals, plotted across years. HbA1c trends. BP patterns. Kidney function. The slow-moving signals doctors rarely get to see in a fifteen-minute consult, surfaced before they become irreversible.",
    mock: <MockTrendsScreen />,
    rotate: 2,
  },
  {
    n: "03",
    eyebrow: "Step Three",
    title: "Walk in prepared.",
    drop: "G",
    body: "enerate a one-page clinical briefing any doctor can read in thirty seconds. Conditions, medications, recent flags — written in the language hospitals already speak. Share it on WhatsApp before the appointment. Never start from zero again.",
    mock: <MockBriefingScreen />,
    rotate: -2,
  },
];

const StepChapter = ({ s, index }: { s: Step; index: number }) => {
  const text = useReveal<HTMLDivElement>();
  const phone = useReveal<HTMLDivElement>();
  const reverse = index % 2 === 1;

  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center min-h-[80vh] py-20 lg:py-28">
      {/* TEXT */}
      <div
        ref={text.ref}
        className={`reveal ${text.visible ? "is-visible" : ""} lg:col-span-7 ${
          reverse ? "lg:col-start-6 lg:row-start-1" : ""
        }`}
      >
        <div className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
          {s.eyebrow}
        </div>
        <h3 className="font-serif text-[40px] sm:text-[56px] lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-white">
          {s.title}
        </h3>
        <p className="mt-8 font-serif italic text-[19px] sm:text-[22px] leading-[1.55] text-[hsl(36_25%_88%)] max-w-[560px] relative pl-16">
          <span
            className="absolute left-0 top-[-8px] font-serif text-[80px] leading-[0.85] text-primary not-italic"
            aria-hidden
          >
            {s.drop}
          </span>
          {s.body}
        </p>
      </div>

      {/* PHONE */}
      <div
        ref={phone.ref}
        className={`reveal reveal-delay-2 ${phone.visible ? "is-visible" : ""} lg:col-span-5 ${
          reverse ? "lg:col-start-1 lg:row-start-1" : ""
        } flex justify-center`}
      >
        <PhoneMock rotate={s.rotate}>{s.mock}</PhoneMock>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const header = useReveal<HTMLDivElement>();

  return (
    <section id="how" className="relative overflow-hidden bg-[hsl(22_25%_10%)]">
      {/* Warm walnut backdrop with soft radial glow + grain */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Layered radial warmth — terracotta glows on walnut */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 20% 20%, hsl(14 62% 24% / 0.55), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, hsl(28 55% 22% / 0.5), transparent 60%), radial-gradient(ellipse 100% 60% at 50% 100%, hsl(14 50% 18% / 0.4), transparent 70%)",
          }}
        />
        {/* Subtle paper grain via SVG noise */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Top + bottom fades into adjacent sections */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(36_30%_96%)] to-transparent opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[hsl(36_30%_96%)] to-transparent opacity-30" />
      </div>

      {/* Floating amber particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "12%", left: "8%", delay: "0s", size: 2 },
          { top: "28%", left: "82%", delay: "1.5s", size: 1.5 },
          { top: "45%", left: "18%", delay: "3s", size: 1 },
          { top: "62%", left: "70%", delay: "0.8s", size: 2 },
          { top: "78%", left: "32%", delay: "2.2s", size: 1.5 },
          { top: "88%", left: "88%", delay: "4s", size: 1 },
          { top: "20%", left: "55%", delay: "2.8s", size: 1 },
          { top: "55%", left: "92%", delay: "1s", size: 1.5 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/70 animate-soft-float"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size * 4}px`,
              height: `${p.size * 4}px`,
              animationDelay: p.delay,
              filter: "blur(0.5px)",
              boxShadow: "0 0 12px hsl(14 62% 54% / 0.6)",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12 pt-28 pb-16">
        {/* Section header */}
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-8`}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
            IV &nbsp;·&nbsp; How it works
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[80px] leading-[1.0] tracking-[-0.02em] text-white">
            Three quiet steps.
            <br />
            <em className="italic text-primary font-normal">A lifetime of context.</em>
          </h2>
        </div>

        {/* Chapters */}
        <div className="divide-y divide-white/10">
          {steps.map((s, i) => (
            <StepChapter key={s.n} s={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
