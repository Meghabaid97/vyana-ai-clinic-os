// HbA1c trend, drawing in via stroke-dashoffset
const points = [
  { x: 0, y: 30 },
  { x: 50, y: 38 },
  { x: 100, y: 52 },
  { x: 150, y: 60 },
  { x: 200, y: 48 },
  { x: 250, y: 36 },
  { x: 300, y: 28 },
];

const path = points
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
  .join(" ");

const VitalsChartArtifact = () => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <div className="rounded-2xl bg-card border border-border/60 shadow-[0_30px_80px_-30px_hsl(22_25%_15%/0.35)] p-6">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
            HbA1c · 18 months
          </p>
          <span className="text-[11px] text-[hsl(155_45%_42%)] font-medium">
            ↓ trending down
          </span>
        </div>
        <p className="font-serif text-[28px] text-foreground tracking-[-0.01em]">
          6.8<span className="text-[16px] text-muted-foreground"> %</span>
        </p>

        <svg viewBox="0 0 300 80" className="w-full mt-4 overflow-visible">
          <defs>
            <linearGradient id="vital-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area */}
          <path
            d={`${path} L 300 80 L 0 80 Z`}
            fill="url(#vital-fill)"
            opacity="0"
            style={{ animation: "fade-in 0.6s 0.7s ease-out forwards" }}
          />
          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="600"
            strokeDashoffset="600"
            style={{ animation: "draw-line 1.4s 0.2s ease-out forwards" }}
          />
          {/* Latest dot */}
          <circle
            cx="300"
            cy="28"
            r="4"
            fill="hsl(var(--primary))"
            opacity="0"
            style={{ animation: "fade-in 0.4s 1.5s ease-out forwards" }}
          />
        </svg>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-border/40">
          {[
            { l: "BP", v: "126/78" },
            { l: "eGFR", v: "78" },
            { l: "LDL", v: "112" },
          ].map((s, i) => (
            <div
              key={i}
              className="opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
              style={{ animationDelay: `${1.6 + i * 0.12}s` }}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {s.l}
              </p>
              <p className="text-[14px] text-foreground font-medium mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default VitalsChartArtifact;
