import { ReactNode } from "react";
import { useSpotlight } from "@/hooks/use-spotlight";

/**
 * Stylized iPhone-shaped frame with custom screen content.
 *
 * The base `rotate` is applied to an inner wrapper so the outer element can
 * own the `tilt-card` hover transform without fighting it. The outer also
 * wears `spotlight-card` so a soft coral glow tracks the cursor across the
 * phone shell on pointer-fine devices (no-op on touch).
 */
export const PhoneMock = ({
  children,
  rotate = 0,
}: {
  children: ReactNode;
  rotate?: number;
}) => {
  const spot = useSpotlight<HTMLDivElement>();
  return (
    <div
      ref={spot.ref}
      onPointerMove={spot.onPointerMove}
      onPointerLeave={spot.onPointerLeave}
      className="tilt-card spotlight-card relative mx-auto rounded-[42px]"
      style={{ width: 300, height: 620 }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotate}deg)`,
          filter:
            "drop-shadow(0 50px 80px rgba(20,15,10,0.45)) drop-shadow(0 20px 30px rgba(20,15,10,0.25))",
        }}
      >
        {/* Phone shell */}
        <div
          className="absolute inset-0 rounded-[42px] p-[10px]"
          style={{ background: "hsl(20 18% 8%)" }}
        >
          {/* Screen */}
          <div
            className="relative w-full h-full rounded-[34px] overflow-hidden"
            style={{ background: "hsl(36 30% 96%)" }}
          >
            {children}
          </div>
          {/* Notch */}
          <div
            className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[90px] h-[24px] rounded-full"
            style={{ background: "hsl(20 18% 8%)" }}
          />
        </div>
      </div>
    </div>
  );
};

/* ---------- Step 01, Capture / Health Story screen ---------- */
export const MockStoryScreen = () => (
  <div className="h-full flex flex-col" style={{ color: "hsl(22 22% 14%)" }}>
    <div className="px-5 pt-12 pb-3">
      <div className="text-[10px] tracking-[0.22em] uppercase text-[hsl(14_62%_54%)] font-medium">
        Your story
      </div>
      <div className="font-serif text-[22px] leading-tight mt-1">
        Dear Asha,
      </div>
    </div>
    <div className="flex-1 px-5 space-y-3 overflow-hidden">
      {[
        { d: "Apr 12", t: "Apollo · Cardiology", v: "BP 128 / 82" },
        { d: "Mar 03", t: "Lab · HbA1c", v: "6.4%" },
        { d: "Feb 18", t: "Discharge · Fortis", v: "Day 4" },
        { d: "Jan 22", t: "Rx · Metformin", v: "500mg" },
      ].map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2 border-b"
          style={{ borderColor: "hsl(30 18% 86%)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(14 62% 54%)" }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[hsl(22_14%_45%)]">
              {r.d}
            </div>
            <div className="text-[12px] font-medium truncate">{r.t}</div>
          </div>
          <div className="font-serif text-[13px] text-[hsl(14_62%_45%)]">{r.v}</div>
        </div>
      ))}
    </div>
    <div className="px-5 py-4 border-t" style={{ borderColor: "hsl(30 18% 86%)" }}>
      <div
        className="rounded-full text-center text-[12px] font-medium py-2.5 text-white"
        style={{ background: "hsl(14 62% 54%)" }}
      >
        + Add a memory
      </div>
    </div>
  </div>
);

/* ---------- Step 02, Trends / Risk dashboard ---------- */
export const MockTrendsScreen = () => (
  <div className="h-full flex flex-col" style={{ color: "hsl(22 22% 14%)" }}>
    <div className="px-5 pt-12 pb-3">
      <div className="text-[10px] tracking-[0.22em] uppercase text-[hsl(14_62%_54%)] font-medium">
        Health trends
      </div>
      <div className="font-serif text-[20px] leading-tight mt-1">
        HbA1c · 18 months
      </div>
    </div>
    {/* Chart */}
    <div className="px-5 pb-3">
      <div className="relative h-[140px] rounded-xl px-3 pt-3 pb-2"
        style={{ background: "hsl(34 22% 92%)" }}>
        <svg viewBox="0 0 240 110" className="w-full h-full">
          <defs>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(14 62% 54%)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(14 62% 54%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,80 C30,70 50,55 80,60 C110,65 130,30 165,35 C195,40 215,25 240,20 L240,110 L0,110 Z"
            fill="url(#grad)"
          />
          <path
            d="M0,80 C30,70 50,55 80,60 C110,65 130,30 165,35 C195,40 215,25 240,20"
            fill="none"
            stroke="hsl(14 62% 54%)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[[0,80],[80,60],[165,35],[240,20]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="3" fill="hsl(14 62% 54%)" />
          ))}
        </svg>
        <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[8px] uppercase tracking-wider text-[hsl(22_14%_45%)]">
          <span>Oct '23</span><span>Apr '24</span><span>Oct '24</span><span>Apr '25</span>
        </div>
      </div>
    </div>
    {/* Vitals strip */}
    <div className="px-5 grid grid-cols-3 gap-2 flex-1">
      {[
        { l: "BP", v: "128/82", c: "hsl(14 62% 54%)" },
        { l: "eGFR", v: "78", c: "hsl(95 35% 38%)" },
        { l: "LDL", v: "112", c: "hsl(38 75% 48%)" },
      ].map((t, i) => (
        <div key={i} className="rounded-lg p-2.5" style={{ background: "hsl(34 22% 92%)" }}>
          <div className="text-[9px] uppercase tracking-wider text-[hsl(22_14%_45%)]">{t.l}</div>
          <div className="font-serif text-[16px] mt-0.5" style={{ color: t.c }}>{t.v}</div>
        </div>
      ))}
    </div>
    <div className="px-5 py-3">
      <div className="text-[10px] text-[hsl(22_14%_45%)] italic leading-relaxed">
        ↑ HbA1c trending up since Jan. ADA staging suggests a conversation with your physician.
      </div>
    </div>
  </div>
);

/* ---------- Step 03, Clinical briefing card ---------- */
export const MockBriefingScreen = () => (
  <div className="h-full flex flex-col" style={{ color: "hsl(22 22% 14%)" }}>
    <div className="px-5 pt-12 pb-3">
      <div className="text-[10px] tracking-[0.22em] uppercase text-[hsl(14_62%_54%)] font-medium">
        For Dr. Krishnan
      </div>
      <div className="font-serif text-[20px] leading-tight mt-1">
        Clinical briefing
      </div>
      <div className="text-[10px] text-[hsl(22_14%_45%)] mt-1">
        Asha B · 62F · Apr 20, 2026
      </div>
    </div>

    <div className="flex-1 px-5 space-y-3 text-[11px] leading-[1.6] overflow-hidden">
      <div>
        <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-1">
          Active conditions
        </div>
        <div>T2DM (8y) · HTN (12y) · Stage 2 CKD</div>
      </div>
      <div>
        <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-1">
          Current meds
        </div>
        <div>Metformin 500mg BD · Telmisartan 40mg OD · Atorva 10mg HS</div>
      </div>
      <div>
        <div className="text-[9px] uppercase tracking-wider text-[hsl(14_62%_54%)] font-medium mb-1">
          Recent flags
        </div>
        <div className="italic">HbA1c ↑ 5.9 → 6.4 (90d). eGFR stable. BP variability noted.</div>
      </div>
    </div>

    <div className="px-5 py-3 mx-3 mb-3 rounded-xl flex items-center gap-2"
      style={{ background: "hsl(140 22% 32%)", color: "hsl(36 40% 95%)" }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
        style={{ background: "hsl(140 30% 22%)" }}>✓</div>
      <div className="text-[11px] font-medium">Send on WhatsApp</div>
    </div>
  </div>
);
