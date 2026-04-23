import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered animation hook.
 * Returns elapsed ms since the element entered the viewport.
 * Pauses cleanly off-screen, respects prefers-reduced-motion.
 */
function useDemoTimeline<T extends HTMLElement>(loopMs?: number) {
  const ref = useRef<T | null>(null);
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && startRef.current === null) {
          startRef.current = performance.now();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reducedRef.current) {
      // Show end-state immediately
      setT(loopMs ?? 6000);
      return;
    }
    let raf = 0;
    const tick = () => {
      if (visibleRef.current && startRef.current !== null) {
        const elapsed = performance.now() - startRef.current;
        setT(loopMs ? elapsed % loopMs : elapsed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loopMs]);

  return { ref, t };
}

/* ---------- Animated Phone Frame ---------- */
export const AnimatedPhone = ({
  children,
  rotate = 0,
  refProp,
}: {
  children: ReactNode;
  rotate?: number;
  refProp?: React.Ref<HTMLDivElement>;
}) => (
  <div
    ref={refProp}
    className="relative mx-auto"
    style={{
      width: 300,
      height: 620,
      transform: `rotate(${rotate}deg)`,
      filter:
        "drop-shadow(0 50px 80px rgba(20,15,10,0.45)) drop-shadow(0 20px 30px rgba(20,15,10,0.25))",
    }}
  >
    <div className="absolute inset-0 rounded-[42px] p-[10px]" style={{ background: "hsl(20 18% 8%)" }}>
      <div
        className="relative w-full h-full rounded-[34px] overflow-hidden"
        style={{ background: "hsl(36 30% 96%)" }}
      >
        {children}
      </div>
      <div
        className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[90px] h-[24px] rounded-full"
        style={{ background: "hsl(20 18% 8%)" }}
      />
    </div>
  </div>
);

/* easing helpers */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (n: number) => 1 - Math.pow(1 - clamp01(n), 3);

/* ============================================================
   STEP 1 — Upload anything
   Beats: 0.0s home → 0.6s tap → 1.2s sheet rises → 2.0s file lands
        → 2.8s scan line sweeps → 3.6s "Saved" toast → loop 6.5s
============================================================ */
export const AnimatedUploadDemo = () => {
  const { ref, t } = useDemoTimeline<HTMLDivElement>(6500);
  const s = t / 1000; // seconds

  const fingerOpacity = s > 0.4 && s < 1.4 ? 1 : 0;
  const fingerScale = s > 0.55 && s < 0.85 ? 0.85 : 1;
  const sheetY = s < 1.2 ? 100 : 100 - easeOut((s - 1.2) / 0.6) * 100;
  const fileY = s < 2.0 ? -40 : -40 + easeOut((s - 2.0) / 0.7) * 60;
  const fileOpacity = s < 2.0 ? 0 : easeOut((s - 2.0) / 0.4);
  const scanProgress = s < 2.8 ? 0 : clamp01((s - 2.8) / 0.7);
  const toastY = s < 3.6 ? 30 : 30 - easeOut((s - 3.6) / 0.4) * 30;
  const toastOpacity = s < 3.6 ? 0 : s < 5.5 ? 1 : Math.max(0, 1 - (s - 5.5) / 0.6);

  return (
    <AnimatedPhone refProp={ref} rotate={-3}>
      <div className="h-full flex flex-col relative" style={{ color: "hsl(22 22% 14%)" }}>
        {/* Status bar area */}
        <div className="px-5 pt-12 pb-3">
          <div className="text-[10px] tracking-[0.22em] uppercase text-[hsl(14_62%_54%)] font-medium">
            Records
          </div>
          <div className="font-serif text-[22px] leading-tight mt-1">Add a record</div>
        </div>

        {/* Empty state */}
        <div className="flex-1 px-5 flex flex-col items-center justify-center">
          <div
            className="w-32 h-40 rounded-xl border-2 border-dashed flex items-center justify-center mb-4"
            style={{ borderColor: "hsl(30 18% 76%)", background: "hsl(34 22% 94%)" }}
          >
            <div className="text-[28px] opacity-40">📄</div>
          </div>
          <div className="text-[11px] text-[hsl(22_14%_45%)] text-center leading-relaxed max-w-[180px]">
            Tap below to upload a prescription, lab report, or scan
          </div>
        </div>

        {/* Bottom button */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "hsl(30 18% 86%)" }}>
          <div
            className="rounded-full text-center text-[12px] font-medium py-2.5 text-white"
            style={{
              background: "hsl(14 62% 54%)",
              transform: `scale(${fingerScale})`,
              transition: "none",
            }}
          >
            + Upload record
          </div>
        </div>

        {/* Animated finger tap */}
        <div
          className="absolute pointer-events-none text-[28px]"
          style={{
            left: "50%",
            bottom: 22,
            transform: `translate(-50%, 0) scale(${fingerScale})`,
            opacity: fingerOpacity,
          }}
        >
          👆
        </div>

        {/* Sliding sheet (file picker) */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-t-3xl p-4 shadow-[0_-20px_40px_rgba(0,0,0,0.15)]"
          style={{
            background: "hsl(36 30% 99%)",
            transform: `translateY(${sheetY}%)`,
            height: "62%",
          }}
        >
          <div
            className="w-10 h-1 rounded-full mx-auto mb-4"
            style={{ background: "hsl(30 18% 76%)" }}
          />
          <div className="text-[11px] uppercase tracking-wider text-[hsl(22_14%_45%)] font-medium mb-3">
            Choose a file
          </div>

          {/* File item that drops in */}
          <div
            className="rounded-xl p-3 flex items-center gap-3 border"
            style={{
              borderColor: "hsl(30 18% 86%)",
              background: "hsl(34 22% 96%)",
              transform: `translateY(${fileY}px)`,
              opacity: fileOpacity,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="w-10 h-12 rounded flex items-center justify-center text-[16px]"
              style={{ background: "hsl(14 62% 54% / 0.12)" }}
            >
              📋
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">HbA1c_April.pdf</div>
              <div className="text-[10px] text-[hsl(22_14%_45%)]">218 KB · just now</div>
            </div>

            {/* Scan line sweep */}
            {scanProgress > 0 && scanProgress < 1 && (
              <div
                className="absolute left-0 right-0 h-[2px]"
                style={{
                  top: `${scanProgress * 100}%`,
                  background:
                    "linear-gradient(90deg, transparent, hsl(14 62% 54%), transparent)",
                  boxShadow: "0 0 12px hsl(14 62% 54% / 0.6)",
                }}
              />
            )}
            {scanProgress >= 1 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(95_35%_38%)] text-[14px]">
                ✓
              </div>
            )}
          </div>

          {/* Toast */}
          <div
            className="absolute left-4 right-4 bottom-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{
              background: "hsl(140 22% 32%)",
              color: "hsl(36 40% 95%)",
              transform: `translateY(${toastY}px)`,
              opacity: toastOpacity,
            }}
          >
            <span className="text-[12px]">✓</span>
            <span className="text-[11px] font-medium">Saved to your story</span>
          </div>
        </div>
      </div>
    </AnimatedPhone>
  );
};

/* ============================================================
   STEP 2 — AI extracts everything
   Beats: 0.0s file thumbnail → 0.5s "Reading…" pulse → 1.2s rows
        type in one by one → 4.5s "Added to trends" → loop 7s
============================================================ */
export const AnimatedExtractDemo = () => {
  const { ref, t } = useDemoTimeline<HTMLDivElement>(7000);
  const s = t / 1000;

  const rows = [
    { label: "Patient", value: "Asha B · 62F", delay: 1.2 },
    { label: "HbA1c", value: "6.4 %", delay: 1.7, accent: true },
    { label: "Fasting glucose", value: "128 mg/dL", delay: 2.2 },
    { label: "eGFR", value: "78 mL/min", delay: 2.7 },
    { label: "BP", value: "128 / 82", delay: 3.2 },
    { label: "Date", value: "Apr 12, 2026", delay: 3.7 },
  ];

  const pulseOn = s < 4.2;
  const trendsToastY = s < 4.6 ? 30 : 30 - easeOut((s - 4.6) / 0.4) * 30;
  const trendsToastOpacity = s < 4.6 ? 0 : s < 6.2 ? 1 : Math.max(0, 1 - (s - 6.2) / 0.6);

  return (
    <AnimatedPhone refProp={ref} rotate={2}>
      <div className="h-full flex flex-col relative" style={{ color: "hsl(22 22% 14%)" }}>
        <div className="px-5 pt-12 pb-3">
          <div className="text-[10px] tracking-[0.22em] uppercase text-[hsl(14_62%_54%)] font-medium flex items-center gap-2">
            Reading…
            {pulseOn && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: "hsl(14 62% 54%)",
                  opacity: 0.3 + 0.7 * Math.abs(Math.sin(s * 6)),
                }}
              />
            )}
          </div>
          <div className="font-serif text-[20px] leading-tight mt-1">HbA1c_April.pdf</div>
        </div>

        {/* Document thumbnail with scanning shimmer */}
        <div className="px-5 pb-3">
          <div
            className="relative h-[80px] rounded-xl overflow-hidden border"
            style={{ borderColor: "hsl(30 18% 86%)", background: "hsl(34 22% 94%)" }}
          >
            {/* fake doc lines */}
            <div className="absolute inset-0 p-3 space-y-1.5 opacity-50">
              {[60, 80, 50, 70, 45, 65].map((w, i) => (
                <div
                  key={i}
                  className="h-[3px] rounded"
                  style={{ width: `${w}%`, background: "hsl(22 14% 35%)" }}
                />
              ))}
            </div>
            {/* Scan beam */}
            {pulseOn && (
              <div
                className="absolute left-0 right-0 h-[24px]"
                style={{
                  top: `${(s * 60) % 100}%`,
                  background:
                    "linear-gradient(180deg, transparent, hsl(14 62% 54% / 0.18), transparent)",
                }}
              />
            )}
          </div>
        </div>

        {/* Extracted fields */}
        <div className="px-5 flex-1 space-y-1.5 overflow-hidden">
          <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-1">
            Extracted
          </div>
          {rows.map((r, i) => {
            const visible = s >= r.delay;
            const enter = clamp01((s - r.delay) / 0.35);
            return (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b"
                style={{
                  borderColor: "hsl(30 18% 86%)",
                  opacity: visible ? enter : 0,
                  transform: `translateX(${visible ? (1 - enter) * -8 : -8}px)`,
                }}
              >
                <span className="text-[11px] text-[hsl(22_14%_45%)]">{r.label}</span>
                <span
                  className={`text-[12px] font-medium ${r.accent ? "font-serif text-[13px]" : ""}`}
                  style={{ color: r.accent ? "hsl(14 62% 45%)" : "hsl(22 22% 14%)" }}
                >
                  {r.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Toast */}
        <div
          className="absolute left-4 right-4 bottom-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{
            background: "hsl(140 22% 32%)",
            color: "hsl(36 40% 95%)",
            transform: `translateY(${trendsToastY}px)`,
            opacity: trendsToastOpacity,
          }}
        >
          <span className="text-[12px]">📈</span>
          <span className="text-[11px] font-medium">Added to your trends</span>
        </div>
      </div>
    </AnimatedPhone>
  );
};

/* ============================================================
   STEP 3 — Walk in prepared (briefing → WhatsApp share)
   Beats: 0.0s briefing visible → 0.8s "Send" tap → 1.6s WhatsApp
        sheet rises → 2.6s message bubble appears → 3.6s ✓✓ ticks
        → loop 7s
============================================================ */
export const AnimatedShareDemo = () => {
  const { ref, t } = useDemoTimeline<HTMLDivElement>(7000);
  const s = t / 1000;

  const tapScale = s > 0.5 && s < 0.9 ? 0.92 : 1;
  const fingerOp = s > 0.4 && s < 1.5 ? 1 : 0;
  const sheetY = s < 1.6 ? 100 : 100 - easeOut((s - 1.6) / 0.55) * 100;
  const bubbleOp = s < 2.6 ? 0 : easeOut((s - 2.6) / 0.4);
  const bubbleY = s < 2.6 ? 12 : 12 - easeOut((s - 2.6) / 0.4) * 12;
  const tick1 = s > 3.4 ? 1 : 0;
  const tick2 = s > 3.8 ? 1 : 0;

  return (
    <AnimatedPhone refProp={ref} rotate={-2}>
      <div className="h-full flex flex-col relative" style={{ color: "hsl(22 22% 14%)" }}>
        <div className="px-5 pt-12 pb-2">
          <div className="text-[10px] tracking-[0.22em] uppercase text-[hsl(14_62%_54%)] font-medium">
            For Dr. Krishnan
          </div>
          <div className="font-serif text-[18px] leading-tight mt-1">Clinical briefing</div>
          <div className="text-[10px] text-[hsl(22_14%_45%)] mt-0.5">
            Asha B · 62F · Apr 20, 2026
          </div>
        </div>

        <div className="flex-1 px-5 space-y-2 text-[10px] leading-[1.55] overflow-hidden">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-0.5">
              Active conditions
            </div>
            <div>T2DM (8y) · HTN (12y) · Stage 2 CKD</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-0.5">
              Current meds
            </div>
            <div>Metformin 500mg BD · Telmisartan 40mg OD</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-0.5">
              Recent flags
            </div>
            <div className="italic">HbA1c ↑ 5.9 → 6.4 (90d). BP variability noted.</div>
          </div>
        </div>

        {/* Send button */}
        <div className="px-3 pb-3 relative">
          <div
            className="rounded-xl px-3 py-2.5 flex items-center justify-center gap-2"
            style={{
              background: "hsl(140 50% 38%)",
              color: "white",
              transform: `scale(${tapScale})`,
            }}
          >
            <span className="text-[13px]">💬</span>
            <span className="text-[11px] font-medium">Send on WhatsApp</span>
          </div>
          <div
            className="absolute pointer-events-none text-[24px]"
            style={{
              left: "50%",
              bottom: 4,
              transform: "translate(-50%, 0)",
              opacity: fingerOp,
            }}
          >
            👆
          </div>
        </div>

        {/* WhatsApp sheet */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.18)] flex flex-col"
          style={{
            background: "hsl(120 8% 96%)",
            transform: `translateY(${sheetY}%)`,
            height: "70%",
          }}
        >
          {/* WA header */}
          <div
            className="px-4 py-3 flex items-center gap-2.5"
            style={{ background: "hsl(150 35% 28%)", color: "white" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
              style={{ background: "hsl(150 25% 18%)" }}
            >
              DK
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-tight">Dr. Krishnan</div>
              <div className="text-[9px] opacity-75">online</div>
            </div>
          </div>

          {/* Chat area */}
          <div
            className="flex-1 px-3 py-3 flex flex-col justify-end gap-1.5"
            style={{
              background:
                "hsl(40 40% 92%) repeating-linear-gradient(45deg, transparent 0 8px, hsl(40 35% 90%) 8px 9px)",
            }}
          >
            {/* Outgoing briefing message bubble */}
            <div className="flex justify-end">
              <div
                className="max-w-[85%] rounded-xl rounded-tr-sm px-3 py-2 text-[10px] leading-snug shadow-sm"
                style={{
                  background: "hsl(95 55% 88%)",
                  color: "hsl(22 22% 14%)",
                  opacity: bubbleOp,
                  transform: `translateY(${bubbleY}px)`,
                }}
              >
                <div className="font-semibold mb-1 text-[10px]">📋 Clinical briefing</div>
                <div className="text-[9px] opacity-85 leading-relaxed">
                  Asha B, 62F. T2DM/HTN/CKD-2. HbA1c ↑ 5.9 → 6.4. Current meds attached. Full
                  history: vyana.in/s/8x4k
                </div>
                <div className="flex items-center justify-end gap-1 mt-1.5">
                  <span className="text-[8px] text-[hsl(22_14%_45%)]">10:42</span>
                  <span
                    className="text-[10px] leading-none"
                    style={{
                      color: tick2 ? "hsl(200 80% 50%)" : "hsl(22 14% 55%)",
                      opacity: tick1,
                    }}
                  >
                    ✓✓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPhone>
  );
};
