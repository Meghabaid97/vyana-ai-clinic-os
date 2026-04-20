import { useReveal } from "@/hooks/use-reveal";
import bg from "@/assets/landing-constellation-bg.jpg";

type Node = {
  // % positions inside the constellation viewport
  x: number;
  y: number;
  kind: "powered" | "experience" | "outcome";
  eyebrow: string;
  title: string;
  body: string;
};

// 5 cards arranged like a star map, anchored to a central pivot.
const PIVOT = { x: 50, y: 52 };

const nodes: Node[] = [
  {
    x: 18, y: 38,
    kind: "powered",
    eyebrow: "Powered by",
    title: "Vision AI extraction",
    body: "Snap any prescription, lab report or discharge summary. We pull vitals, meds and diagnoses — handwritten or printed, in five Indian languages.",
  },
  {
    x: 32, y: 70,
    kind: "experience",
    eyebrow: "Experience",
    title: "A quiet health story",
    body: "Years of scattered paper become one calm, longitudinal record your family can actually read.",
  },
  {
    x: 60, y: 78,
    kind: "outcome",
    eyebrow: "Outcome",
    title: "Doctors trust the briefing",
    body: "A one-page clinical summary any physician can read in thirty seconds. Shareable on WhatsApp before the appointment.",
  },
  {
    x: 70, y: 38,
    kind: "powered",
    eyebrow: "Powered by",
    title: "33 vitals tracked",
    body: "HbA1c. BP. eGFR. The slow-moving signals doctors rarely get to see in a fifteen-minute consult, surfaced before they become irreversible.",
  },
  {
    x: 88, y: 22,
    kind: "experience",
    eyebrow: "Experience",
    title: "Risk flags that listen",
    body: "ASCVD, ADA diabetes staging, KDIGO kidney scores. Computed from your real numbers — never speculation.",
  },
];

const kindStyle = {
  powered:    { dot: "hsl(155 35% 55%)", label: "text-[hsl(155_45%_70%)]" },
  experience: { dot: "hsl(14 62% 60%)",  label: "text-[hsl(14_70%_72%)]"  },
  outcome:    { dot: "hsl(40 75% 60%)",  label: "text-[hsl(40_80%_72%)]"  },
} as const;

const Constellation = () => {
  const header = useReveal<HTMLDivElement>();

  return (
    <section
      id="constellation"
      className="relative overflow-hidden bg-[hsl(22_25%_8%)]"
    >
      {/* Sepia oil-painting backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={bg}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1080}
          className="w-full h-full object-cover animate-ken-burns opacity-90"
        />
        <div className="absolute inset-0 bg-[hsl(22_25%_8%/0.78)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, hsl(22 25% 6% / 0.6) 100%)",
          }}
        />
        {/* Top + bottom fades into adjacent ivory sections */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[hsl(36_30%_96%)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[hsl(36_30%_96%)] to-transparent" />
      </div>

      {/* Starfield — dense field of tiny ivory specks like the reference */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => {
          // Deterministic pseudo-random so it doesn't reshuffle on re-render
          const seed = (i * 9301 + 49297) % 233280;
          const top = (seed % 100);
          const left = ((seed * 7) % 100);
          const size = ((seed % 3) + 1) * 0.6;
          const delay = (seed % 40) / 10;
          const isAmber = i % 7 === 0;
          return (
            <div
              key={i}
              className="absolute rounded-full animate-soft-float"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${size * 2}px`,
                height: `${size * 2}px`,
                background: isAmber ? "hsl(14 62% 60%)" : "hsl(36 30% 88%)",
                opacity: isAmber ? 0.85 : 0.55,
                animationDelay: `${delay}s`,
                boxShadow: isAmber
                  ? "0 0 8px hsl(14 62% 54% / 0.7)"
                  : "0 0 4px hsl(36 30% 90% / 0.4)",
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12 pt-28 pb-32">
        {/* Section header */}
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-20`}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
            V &nbsp;·&nbsp; What's inside
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[72px] leading-[1.0] tracking-[-0.02em] text-white">
            Five quiet systems,
            <br />
            <em className="italic text-primary font-normal">one connected story.</em>
          </h2>
          <p className="mt-6 font-serif italic text-[18px] text-[hsl(36_25%_85%)] leading-relaxed max-w-[560px]">
            Each piece of Vyana feeds the next. The constellation below is how
            your scattered paper becomes a doctor-ready record.
          </p>
        </div>

        {/* Constellation viewport */}
        <div className="relative w-full aspect-[16/10] hidden lg:block">
          {/* Connecting SVG lines — pivot in middle, branches to each card */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 625"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(14 62% 54%)" stopOpacity="0.1" />
                <stop offset="50%" stopColor="hsl(36 60% 70%)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="hsl(14 62% 54%)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {nodes.map((n, i) => (
              <line
                key={i}
                x1={(PIVOT.x / 100) * 1000}
                y1={(PIVOT.y / 100) * 625}
                x2={(n.x / 100) * 1000}
                y2={(n.y / 100) * 625}
                stroke="url(#line-grad)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
            ))}
            {/* central pivot dot */}
            <circle
              cx={(PIVOT.x / 100) * 1000}
              cy={(PIVOT.y / 100) * 625}
              r="6"
              fill="hsl(14 62% 60%)"
            />
            <circle
              cx={(PIVOT.x / 100) * 1000}
              cy={(PIVOT.y / 100) * 625}
              r="14"
              fill="hsl(14 62% 60%)"
              opacity="0.18"
            />
          </svg>

          {/* Star dots at each card endpoint */}
          {nodes.map((n, i) => {
            const k = kindStyle[n.kind];
            return (
              <span
                key={`dot-${i}`}
                className="absolute w-2.5 h-2.5 rounded-full animate-soft-float"
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  background: k.dot,
                  boxShadow: `0 0 14px ${k.dot}`,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            );
          })}

          {/* Floating cards */}
          {nodes.map((n, i) => {
            const k = kindStyle[n.kind];
            // Card placement offset from its dot — alternate so they don't sit on top of each other
            const xOffset = n.x < 50 ? "translate(-105%, -50%)" : "translate(5%, -50%)";
            return (
              <article
                key={`card-${i}`}
                className="absolute w-[260px] rounded-xl px-5 py-4 backdrop-blur-sm border animate-fade-in"
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  transform: xOffset,
                  background: "hsl(22 25% 10% / 0.85)",
                  borderColor: "hsl(36 25% 70% / 0.18)",
                  boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                <p className={`text-[10px] tracking-[0.25em] uppercase font-semibold mb-2 ${k.label}`}>
                  {n.eyebrow}
                </p>
                <h3 className="font-serif text-[18px] text-white leading-tight mb-2">
                  {n.title}
                </h3>
                <p className="text-[12.5px] text-[hsl(36_20%_78%)] leading-[1.55]">
                  {n.body}
                </p>
              </article>
            );
          })}
        </div>

        {/* Mobile: stacked cards (no constellation) */}
        <div className="lg:hidden space-y-4">
          {nodes.map((n, i) => {
            const k = kindStyle[n.kind];
            return (
              <article
                key={`m-${i}`}
                className="rounded-xl px-5 py-5 border"
                style={{
                  background: "hsl(22 25% 10% / 0.9)",
                  borderColor: "hsl(36 25% 70% / 0.2)",
                }}
              >
                <p className={`text-[10px] tracking-[0.25em] uppercase font-semibold mb-2 ${k.label}`}>
                  {n.eyebrow}
                </p>
                <h3 className="font-serif text-[19px] text-white leading-tight mb-2">
                  {n.title}
                </h3>
                <p className="text-[13.5px] text-[hsl(36_20%_80%)] leading-[1.6]">
                  {n.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Constellation;
