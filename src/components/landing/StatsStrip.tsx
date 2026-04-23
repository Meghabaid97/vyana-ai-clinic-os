import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";
import CountUp from "@/components/landing/CountUp";

/**
 * Living Stats Strip.
 * Three numbers that tick up the moment they enter view, each paired with a
 * tiny animated glyph: a heartbeat line for vitals, cycling script characters
 * for languages, and a clock arc filling for share links. Editorial pacing,
 * reduced-motion friendly (the glyphs hold a static end state).
 */

// --- Glyph: heartbeat line that draws + repeats once visible ---
const HeartbeatGlyph = ({ play }: { play: boolean }) => (
  <svg
    viewBox="0 0 80 28"
    className="w-20 h-7 text-primary"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M0 14 H18 L24 6 L32 22 L40 4 L48 20 L54 14 H80" />
    {play && (
      <circle r="2" fill="currentColor" stroke="none">
        <animateMotion
          dur="2.4s"
          repeatCount="indefinite"
          path="M0 14 H18 L24 6 L32 22 L40 4 L48 20 L54 14 H80"
        />
      </circle>
    )}
  </svg>
);

// --- Glyph: cycling script characters (one per supported language) ---
const SCRIPTS = ["A", "अ", "অ", "த", "త"]; // EN, HI, BN, TA, TE
const ScriptCycleGlyph = ({ play }: { play: boolean }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!play) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % SCRIPTS.length), 700);
    return () => clearInterval(id);
  }, [play]);
  return (
    <div className="w-20 h-7 flex items-center justify-start" aria-hidden>
      <span
        key={i}
        className="font-serif text-[26px] leading-none text-primary inline-block animate-fade-in tabular-nums"
      >
        {SCRIPTS[i]}
      </span>
    </div>
  );
};

// --- Glyph: clock arc filling once, then resting full ---
const ClockArcGlyph = ({ play }: { play: boolean }) => {
  // 24 segment radial dial; fill fraction = elapsed/total
  const r = 11;
  const c = 2 * Math.PI * r;
  const [frac, setFrac] = useState(0);
  useEffect(() => {
    if (!play) {
      setFrac(0);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setFrac(1);
      return;
    }
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setFrac(1 - Math.pow(1 - t, 5));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play]);
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7 text-primary" aria-hidden>
      <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - frac)}
        transform="rotate(-90 14 14)"
      />
      {/* hand */}
      <line
        x1="14"
        y1="14"
        x2="14"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        transform={`rotate(${frac * 360} 14 14)`}
      />
    </svg>
  );
};

const stats = [
  {
    value: "33",
    unit: "vitals tracked",
    body: "HbA1c, BP, eGFR and the slow signals a fifteen-minute consult cannot see.",
    Glyph: HeartbeatGlyph,
  },
  {
    value: "5",
    unit: "languages",
    body: "English, Hindi, Bengali, Tamil, Telugu. Read prescriptions in the script you trust.",
    Glyph: ScriptCycleGlyph,
  },
  {
    value: "24",
    unit: "hour share links",
    body: "Send your full record to any doctor. Access expires automatically, no apps required.",
    Glyph: ClockArcGlyph,
  },
];

const StatsStrip = () => {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="relative -mt-8 lg:-mt-12 z-20">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={ref}
          className={`reveal ${visible ? "is-visible" : ""} relative rounded-2xl backdrop-blur-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] overflow-hidden`}
          style={{ background: "hsl(20 18% 10% / 0.82)" }}
        >
          {/* Subtle editorial grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h40M0 0v40' stroke='%23f5ead8' stroke-width='0.5'/%3E%3C/svg%3E\")",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((s, i) => {
              const Glyph = s.Glyph;
              return (
                <div
                  key={i}
                  className={`px-8 py-10 sm:px-10 sm:py-12 reveal reveal-delay-${i + 1} ${visible ? "is-visible" : ""}`}
                >
                  <div className="mb-4">
                    <Glyph play={visible} />
                  </div>
                  <div className="font-serif text-[64px] sm:text-[76px] leading-none text-white tracking-[-0.02em] tabular-nums">
                    <CountUp value={s.value} start={visible} durationMs={1300 + i * 150} />
                  </div>
                  <div className="text-label text-primary mt-2">{s.unit}</div>
                  <p className="mt-5 text-caption text-[hsl(30_20%_82%)] max-w-[280px]">
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
