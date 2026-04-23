const beats = [
  { year: "2019", note: "First HbA1c flag" },
  { year: "2021", note: "Started Metformin" },
  { year: "2023", note: "BP under control" },
  { year: "2024", note: "Stable, every 6mo" },
];

const TimelineArtifact = () => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <div className="rounded-2xl bg-card border border-border/60 shadow-[0_30px_80px_-30px_hsl(22_25%_15%/0.35)] p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-5">
          Lakshmi · 5-year story
        </p>

        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          {beats.map((b, i) => (
            <div
              key={i}
              className="relative pb-5 last:pb-0 opacity-0 animate-[fade-in_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${0.2 + i * 0.22}s` }}
            >
              <span
                className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-card animate-[soft-pulse_2.6s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
              <p className="text-[11px] text-muted-foreground font-medium">{b.year}</p>
              <p className="text-[14px] text-foreground mt-0.5">{b.note}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes soft-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4); }
          50% { box-shadow: 0 0 0 8px hsl(var(--primary) / 0); }
        }
      `}</style>
    </div>
  );
};

export default TimelineArtifact;
