import { useNavigate } from "react-router-dom";
import { Stethoscope, Sparkles, Play, ArrowRight, Clock } from "lucide-react";

interface Props {
  hasRecords: boolean;
}

const DashboardBriefingHero = ({ hasRecords }: Props) => {
  const navigate = useNavigate();

  return (
    <section className="px-4 sm:px-5 pb-5">
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-5">
        {/* subtle decorative ring */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-primary">
              <Clock className="h-3 w-3" /> 30 seconds
            </span>
          </div>

          <h2 className="text-[24px] sm:text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-foreground">
            I have a <span className="text-primary">doctor visit.</span>
          </h2>
          <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed max-w-[36ch]">
            One scrollable sheet your doctor can read in under a minute. Conditions, what changed, medications, ready to share.
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => navigate("/app/visit")}
            className="group mt-5 flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="h-11 w-11 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15.5px] font-semibold text-primary-foreground leading-tight">
                Start visit mode
              </p>
              <p className="text-[12px] text-primary-foreground/85 mt-0.5 leading-snug">
                {hasRecords ? "Built from your records" : "Try it with sample data"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Secondary path */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate("/app/briefing")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors min-w-0"
            >
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[12px] font-medium text-foreground truncate">Full clinical brief</span>
            </button>
            <button
              onClick={() => navigate("/app/visit?demo=1")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors min-w-0"
            >
              <Play className="h-4 w-4 text-primary fill-current shrink-0" />
              <span className="text-[12px] font-medium text-foreground truncate">Try sample data</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardBriefingHero;
