import { MessageCircle, ShieldCheck } from "lucide-react";

const BriefingArtifact = () => {
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <div className="rounded-2xl bg-card border border-border/60 shadow-[0_30px_80px_-30px_hsl(22_25%_15%/0.35)] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border/40 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
              Clinical briefing
            </p>
            <p className="font-serif text-[16px] text-foreground mt-1">Lakshmi R., 58</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-[hsl(155_45%_45%)]" />
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-[12.5px] leading-[1.55]">
          {[
            { label: "Active", value: "T2DM (HbA1c 6.8), HTN controlled" },
            { label: "Meds", value: "Metformin 500 BID, Telmisartan 40 OD" },
            { label: "Recent", value: "eGFR 78 (stable), LDL 112" },
            { label: "Watch", value: "BP variability last 3 readings" },
          ].map((row, i) => (
            <div
              key={i}
              className="opacity-0 animate-[fade-in_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${0.2 + i * 0.15}s` }}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-0.5">
                {row.label}
              </p>
              <p className="text-foreground/90">{row.value}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp share button */}
        <div className="px-5 pb-5">
          <button
            type="button"
            className="w-full rounded-full bg-[hsl(142_70%_45%)] text-white text-[13px] font-medium py-2.5 flex items-center justify-center gap-2 opacity-0 animate-[fade-in_0.5s_ease-out_forwards]"
            style={{ animationDelay: "1.1s" }}
          >
            <MessageCircle className="w-4 h-4" />
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default BriefingArtifact;
