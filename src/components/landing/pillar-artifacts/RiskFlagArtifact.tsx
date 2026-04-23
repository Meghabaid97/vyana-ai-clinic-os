import { AlertTriangle } from "lucide-react";

const RiskFlagArtifact = () => {
  // ASCVD risk dial — 14% (moderate)
  const pct = 14;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 40); // scale: 0–40% range

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <div className="rounded-2xl bg-card border border-border/60 shadow-[0_30px_80px_-30px_hsl(22_25%_15%/0.35)] p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-5">
          Risk briefing
        </p>

        <div className="flex items-center gap-5">
          {/* Dial */}
          <div className="relative w-[120px] h-[120px] flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="6"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="hsl(40 75% 55%)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
                style={{
                  animation: "dial-fill 1.4s 0.3s cubic-bezier(0.2,0.7,0.2,1) forwards",
                  // @ts-expect-error custom CSS var
                  "--target-offset": offset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-[26px] text-foreground leading-none">
                {pct}%
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                ASCVD · 10y
              </span>
            </div>
          </div>

          {/* Flags */}
          <div className="flex-1 space-y-2.5">
            {[
              { tone: "amber", label: "BP variability", body: "Last 3 readings drifting" },
              { tone: "sage", label: "HbA1c", body: "Within target" },
              { tone: "amber", label: "LDL", body: "Borderline, recheck 3mo" },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-2 opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${0.6 + i * 0.18}s` }}
              >
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      f.tone === "amber"
                        ? "hsl(40 75% 55%)"
                        : "hsl(155 45% 45%)",
                    boxShadow:
                      f.tone === "amber"
                        ? "0 0 8px hsl(40 75% 55% / 0.6)"
                        : "0 0 8px hsl(155 45% 45% / 0.4)",
                  }}
                />
                <div>
                  <p className="text-[12px] text-foreground font-medium leading-tight">
                    {f.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-5 pt-4 border-t border-border/40 flex items-center gap-2 text-[11px] text-muted-foreground opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
          style={{ animationDelay: "1.3s" }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[hsl(40_75%_50%)]" />
          Discussion points for your next visit, never speculation.
        </div>
      </div>

      <style>{`
        @keyframes dial-fill {
          to { stroke-dashoffset: var(--target-offset); }
        }
      `}</style>
    </div>
  );
};

export default RiskFlagArtifact;
