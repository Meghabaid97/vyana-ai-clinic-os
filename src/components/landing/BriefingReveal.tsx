import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed scrollytelling section: a clinical briefing types itself out as
 * the user scrolls. Vitals populate one-by-one, a red flag pulses in, then
 * the "Share on WhatsApp" CTA slides up. Wedge made literal.
 */

type Row = {
  label: string;
  value: string;
  flag?: boolean;
  accent?: boolean;
};

const ROWS: Row[] = [
  { label: "Patient", value: "Asha B · 62F" },
  { label: "Conditions", value: "T2DM (8y) · HTN (12y) · CKD-2" },
  { label: "Current meds", value: "Metformin 500 BD · Telmisartan 40 OD" },
  { label: "HbA1c", value: "6.4 %", accent: true },
  { label: "Fasting glucose", value: "128 mg/dL" },
  { label: "eGFR", value: "78 mL/min" },
  { label: "BP (avg 14d)", value: "138 / 86", flag: true },
  { label: "Last visit", value: "Apr 12, 2026" },
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (n: number) => 1 - Math.pow(1 - clamp01(n), 3);

export default function BriefingReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0); // 0..1 across the sticky scroll

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Section is tall (≈ 220vh). Sticky child is 100vh.
      // progress = how far we've scrolled into the scrollable portion.
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };
    const tick = () => {
      onScroll();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Map progress to beats:
  // 0.00–0.10  intro (header fades in)
  // 0.10–0.70  rows reveal one by one
  // 0.70–0.85  red flag pulses
  // 0.85–1.00  WhatsApp CTA slides up
  const headerOp = easeOut(progress / 0.1);
  const rowsWindow = clamp01((progress - 0.1) / 0.6);
  const flagPulse = clamp01((progress - 0.7) / 0.15);
  const ctaSlide = clamp01((progress - 0.82) / 0.18);

  return (
    <section
      ref={sectionRef}
      aria-label="The briefing reveals itself"
      className="relative w-full"
      style={{ height: "220vh", background: "hsl(36 30% 96%)" }}
    >
      {/* Sticky stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        {/* Ambient warm wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 40%, hsl(14 62% 54% / 0.08), transparent 70%), radial-gradient(50% 40% at 80% 70%, hsl(38 80% 60% / 0.07), transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-10 items-center">
          {/* Left: headline + caption */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className="text-[11px] tracking-[0.28em] uppercase font-medium"
              style={{ color: "hsl(14 62% 54%)", opacity: headerOp }}
            >
              The briefing
            </div>
            <h2
              className="font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05]"
              style={{ color: "hsl(22 22% 14%)", opacity: headerOp }}
            >
              Watch your story
              <br />
              <em className="not-italic" style={{ color: "hsl(14 62% 45%)" }}>
                assemble itself.
              </em>
            </h2>
            <p
              className="text-[15px] leading-relaxed max-w-md"
              style={{ color: "hsl(22 14% 35%)", opacity: headerOp * 0.9 }}
            >
              Eight years of records become a one-page brief your doctor can read
              in thirty seconds. No re-explaining. No missed context.
            </p>

            {/* progress dots */}
            <div className="flex items-center gap-1.5 pt-2" style={{ opacity: headerOp }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((p, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: progress >= p ? 24 : 8,
                    background:
                      progress >= p ? "hsl(14 62% 54%)" : "hsl(30 18% 76%)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: phone mock */}
          <div className="lg:col-span-7 flex justify-center">
            <PhoneFrame>
              <div
                className="h-full flex flex-col relative"
                style={{ color: "hsl(22 22% 14%)" }}
              >
                {/* Header */}
                <div
                  className="px-5 pt-12 pb-3"
                  style={{ opacity: headerOp }}
                >
                  <div className="text-[10px] tracking-[0.22em] uppercase font-medium" style={{ color: "hsl(14 62% 54%)" }}>
                    For Dr. Krishnan
                  </div>
                  <div className="font-serif text-[20px] leading-tight mt-1">
                    Clinical briefing
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "hsl(22 14% 45%)" }}>
                    Generated · Apr 23, 2026 · 10:42
                  </div>
                </div>

                {/* Divider */}
                <div
                  className="mx-5 h-px"
                  style={{
                    background: "hsl(30 18% 86%)",
                    transform: `scaleX(${headerOp})`,
                    transformOrigin: "left",
                  }}
                />

                {/* Rows */}
                <div className="px-5 pt-3 flex-1 space-y-1 overflow-hidden">
                  {ROWS.map((r, i) => {
                    // Each row owns a slice of rowsWindow.
                    const slice = 1 / ROWS.length;
                    const localStart = i * slice;
                    const localEnd = localStart + slice * 0.7;
                    const local = clamp01(
                      (rowsWindow - localStart) / (localEnd - localStart)
                    );
                    const visible = rowsWindow > localStart;
                    const enter = easeOut(local);
                    const isFlagRow = !!r.flag;
                    const flagGlow =
                      isFlagRow && flagPulse > 0
                        ? 0.35 + 0.65 * Math.abs(Math.sin(flagPulse * Math.PI * 2.4))
                        : 0;

                    return (
                      <div
                        key={r.label}
                        className="flex items-center justify-between py-2 border-b"
                        style={{
                          borderColor: "hsl(30 18% 86%)",
                          opacity: visible ? enter : 0,
                          transform: `translateY(${(1 - enter) * 6}px)`,
                          background: isFlagRow
                            ? `hsl(14 62% 54% / ${flagGlow * 0.08})`
                            : "transparent",
                          borderRadius: isFlagRow ? 6 : 0,
                          paddingLeft: isFlagRow ? 8 : 0,
                          paddingRight: isFlagRow ? 8 : 0,
                          marginLeft: isFlagRow ? -8 : 0,
                          marginRight: isFlagRow ? -8 : 0,
                          transition: "background 200ms ease",
                        }}
                      >
                        <span className="text-[11px]" style={{ color: "hsl(22 14% 45%)" }}>
                          {r.label}
                        </span>
                        <span className="flex items-center gap-2">
                          {isFlagRow && (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{
                                background: "hsl(14 72% 52%)",
                                boxShadow: `0 0 ${4 + flagGlow * 10}px hsl(14 72% 52% / ${0.4 + flagGlow * 0.5})`,
                              }}
                            />
                          )}
                          <span
                            className={`text-[12px] font-medium ${r.accent ? "font-serif text-[14px]" : ""}`}
                            style={{
                              color: r.accent
                                ? "hsl(14 62% 45%)"
                                : isFlagRow
                                ? "hsl(14 72% 42%)"
                                : "hsl(22 22% 14%)",
                            }}
                          >
                            {r.value}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* WhatsApp CTA */}
                <div
                  className="px-3 pb-4 pt-2"
                  style={{
                    transform: `translateY(${(1 - ctaSlide) * 80}px)`,
                    opacity: ctaSlide,
                  }}
                >
                  <div
                    className="rounded-xl px-3 py-3 flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      background: "hsl(140 50% 38%)",
                      color: "white",
                      boxShadow:
                        "0 12px 24px -8px hsl(140 50% 25% / 0.4), 0 4px 8px -2px hsl(140 50% 25% / 0.2)",
                    }}
                  >
                    <span className="text-[14px]">💬</span>
                    <span className="text-[12px] font-medium">
                      Send on WhatsApp
                    </span>
                  </div>
                  <div
                    className="text-[10px] text-center mt-2"
                    style={{ color: "hsl(22 14% 45%)" }}
                  >
                    Encrypted link · expires in 24 h
                  </div>
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Local phone frame (kept self-contained so this section is portable). */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative"
      style={{
        width: 320,
        height: 660,
        filter:
          "drop-shadow(0 50px 80px hsl(20 15% 10% / 0.35)) drop-shadow(0 20px 30px hsl(20 15% 10% / 0.2))",
      }}
    >
      <div
        className="absolute inset-0 rounded-[44px] p-[10px]"
        style={{ background: "hsl(20 18% 8%)" }}
      >
        <div
          className="relative w-full h-full rounded-[36px] overflow-hidden"
          style={{ background: "hsl(36 30% 96%)" }}
        >
          {children}
        </div>
        <div
          className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[96px] h-[26px] rounded-full"
          style={{ background: "hsl(20 18% 8%)" }}
        />
      </div>
    </div>
  );
}
