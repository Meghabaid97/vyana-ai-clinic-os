import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Share2, Shield, ArrowRight, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  hasRecords: boolean;
}

const DashboardBriefingHero = ({ hasRecords }: Props) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [staged, setStaged] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setStaged(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Staggered "deal the deck" cadence — full reveal in ~600ms
  const stage = (delay: number): React.CSSProperties => ({
    opacity: staged ? 1 : 0,
    transform: staged ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 380ms ease-out ${delay}ms, transform 420ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  });

  return (
    <section className="px-4 sm:px-5 pb-4 lg:px-0 lg:pb-0">
      <div
        className="group/hero relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/8 to-background p-4 lg:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_-12px_hsl(var(--primary)/0.25)] transition-shadow duration-500 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_16px_48px_-12px_hsl(var(--primary)/0.35)]"
      >
        {/* Layered glows for depth */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 lg:h-80 lg:w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-48 w-48 lg:h-64 lg:w-64 rounded-full bg-primary/8 blur-3xl" />
        {/* Hairline shine on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/0 to-white/10 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-700" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2 lg:mb-3" style={stage(0)}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] lg:text-[11px] font-semibold tracking-wider uppercase text-primary ring-1 ring-primary/20">
              <Clock className="h-3 w-3" /> {t("briefingHero.eyebrow")}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary/70" />
              AI-organized
            </span>
          </div>

          <h2
            className="text-[22px] sm:text-[26px] lg:text-[34px] xl:text-[38px] font-extrabold leading-[1.05] tracking-[-0.025em] text-foreground"
            style={stage(120)}
          >
            {t("briefingHero.title.l1")}{" "}
            <span className="bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              {t("briefingHero.title.l2")}
            </span>
          </h2>
          <p
            className="mt-2 lg:mt-2.5 text-[13px] lg:text-[14px] text-muted-foreground leading-snug max-w-[40ch] lg:max-w-[54ch]"
            style={stage(220)}
          >
            {t("briefingHero.body")}
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => navigate("/app/briefing")}
            style={stage(340)}
            className="group relative mt-3 lg:mt-4 flex w-full items-center gap-3 lg:gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/90 p-3 lg:p-4 text-left shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.45)] transition-all duration-300 hover:shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden"
          >
            {/* Subtle shimmer sweep on hover */}
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
              <Stethoscope className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-primary-foreground" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-[15px] lg:text-[16px] font-semibold text-primary-foreground leading-tight">
                {t("briefingHero.cta.start")}
              </p>
              <p className="text-[11.5px] lg:text-[12.5px] text-primary-foreground/85 mt-0.5 leading-snug">
                {hasRecords ? t("briefingHero.cta.fromRecords") : t("briefingHero.cta.fromSample")}
              </p>
            </div>
            <div className="relative h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0 group-hover:bg-primary-foreground/25 transition-colors">
              <ArrowRight className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-primary-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Secondary path */}
          <div className="mt-2.5 grid grid-cols-2 gap-2 lg:gap-3">
            <button
              onClick={() => navigate("/app/share")}
              style={stage(460)}
              className="group/btn flex items-center gap-2 rounded-xl border border-border bg-card/70 backdrop-blur-sm px-3 py-2 lg:py-2.5 text-left hover:border-primary/40 hover:bg-card hover:-translate-y-0.5 transition-all duration-200 min-w-0"
            >
              <Share2 className="h-4 w-4 text-primary shrink-0 group-hover/btn:scale-110 transition-transform" />
              <span className="text-[12px] lg:text-[13px] font-medium text-foreground truncate">Share with doctor</span>
            </button>
            <button
              onClick={() => navigate("/app/emergency-contacts")}
              style={stage(540)}
              className="group/btn flex items-center gap-2 rounded-xl border border-border bg-card/70 backdrop-blur-sm px-3 py-2 lg:py-2.5 text-left hover:border-primary/40 hover:bg-card hover:-translate-y-0.5 transition-all duration-200 min-w-0"
            >
              <Shield className="h-4 w-4 text-primary shrink-0 group-hover/btn:scale-110 transition-transform" />
              <span className="text-[12px] lg:text-[13px] font-medium text-foreground truncate">Emergency access</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardBriefingHero;
