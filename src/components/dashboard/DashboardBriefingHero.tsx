import { useNavigate } from "react-router-dom";
import { Sparkles, Upload, Play, ArrowRight } from "lucide-react";

interface Props {
  hasRecords: boolean;
}

const DashboardBriefingHero = ({ hasRecords }: Props) => {
  const navigate = useNavigate();

  return (
    <section className="px-4 sm:px-5 pb-5">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
        <p className="text-[11px] font-medium tracking-widest uppercase text-primary mb-2">
          Seeing a doctor?
        </p>
        <h2 className="text-[20px] sm:text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-foreground">
          Get ready in <span className="text-primary">30 seconds.</span>
        </h2>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed max-w-[34ch]">
          Conditions, medications, recent changes — one screen any doctor can read instantly.
        </p>

        <button
          onClick={() => navigate("/app/briefing")}
          className="group mt-4 flex w-full items-center gap-3 rounded-xl bg-primary p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
        >
          <div className="h-10 w-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-primary-foreground leading-tight">
              Generate my doctor brief
            </p>
            <p className="text-[12px] text-primary-foreground/85 mt-0.5 leading-snug">
              {hasRecords ? "Built from your records" : "Try it with sample data"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/app/records")}
            className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors min-w-0"
          >
            <Upload className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[12px] font-medium text-foreground truncate">Upload a report</span>
          </button>
          <button
            onClick={() => navigate("/app/briefing?demo=1")}
            className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors min-w-0"
          >
            <Play className="h-4 w-4 text-primary fill-current shrink-0" />
            <span className="text-[12px] font-medium text-foreground truncate">Try sample data</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashboardBriefingHero;
