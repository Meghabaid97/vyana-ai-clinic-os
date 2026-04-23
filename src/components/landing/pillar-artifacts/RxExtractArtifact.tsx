import { FileText, Sparkles } from "lucide-react";

const fields = [
  { label: "Patient", value: "Mrs. Lakshmi R." },
  { label: "Diagnosis", value: "T2DM, HTN" },
  { label: "Metformin", value: "500mg · 1-0-1" },
  { label: "Telmisartan", value: "40mg · 1-0-0" },
  { label: "Next visit", value: "6 weeks" },
];

const RxExtractArtifact = () => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <div className="rounded-2xl bg-card border border-border/60 shadow-[0_30px_80px_-30px_hsl(22_25%_15%/0.35)] overflow-hidden">
        {/* "Photo" header */}
        <div className="relative h-32 bg-gradient-to-br from-[hsl(36_25%_88%)] to-[hsl(36_20%_78%)] border-b border-border/40">
          <div className="absolute inset-3 rounded-lg bg-[hsl(36_30%_94%)]/80 backdrop-blur-sm flex items-center justify-center">
            <FileText className="w-8 h-8 text-foreground/40" strokeWidth={1.2} />
            <span className="ml-2 font-serif italic text-[13px] text-foreground/55">
              prescription_img.jpg
            </span>
          </div>
          {/* Scan line */}
          <div className="absolute inset-x-3 h-[2px] bg-primary/70 shadow-[0_0_12px_hsl(var(--primary)/0.6)] animate-[scan_2.4s_ease-in-out_infinite]" />
        </div>

        {/* Extracted fields */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
            <Sparkles className="w-3 h-3" />
            Extracted
          </div>
          {fields.map((f, i) => (
            <div
              key={i}
              className="flex justify-between items-baseline opacity-0 animate-[fade-in_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${0.3 + i * 0.18}s` }}
            >
              <span className="text-[12px] text-muted-foreground">{f.label}</span>
              <span className="text-[13px] font-medium text-foreground">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 12px; opacity: 0.9; }
          50% { top: calc(100% - 14px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default RxExtractArtifact;
