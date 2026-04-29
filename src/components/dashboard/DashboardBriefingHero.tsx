import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Share2, Shield, ArrowRight, Clock } from "lucide-react";
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
    <section className="px-4 sm:px-5 pb-5 lg:px-0 lg:pb-0">
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-5 lg:p-7">
        {/* subtle decorative ring */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 lg:h-64 lg:w-64 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3" style={stage(0)}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] lg:text-[11px] font-semibold tracking-wider uppercase text-primary">
              <Clock className="h-3 w-3" /> {t("briefingHero.eyebrow")}
            </span>
          </div>

          <h2
            className="text-[24px] sm:text-[26px] lg:text-[36px] xl:text-[42px] font-extrabold leading-[1.05] tracking-[-0.02em] text-foreground"
            style={stage(120)}
          >
            {t("briefingHero.title.l1")} <span className="text-primary">{t("briefingHero.title.l2")}</span>
          </h2>
          <p
            className="mt-2 lg:mt-3 text-[13.5px] lg:text-[15px] text-muted-foreground leading-relaxed max-w-[36ch] lg:max-w-[52ch]"
            style={stage(220)}
          >
            {t("briefingHero.body")}
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => navigate("/app/briefing")}
            style={stage(340)}
            className="group mt-5 lg:mt-6 flex w-full items-center gap-3 rounded-2xl bg-primary p-4 lg:p-5 text-left shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="h-11 w-11 lg:h-13 lg:w-13 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15.5px] lg:text-[17px] font-semibold text-primary-foreground leading-tight">
                {t("briefingHero.cta.start")}
              </p>
              <p className="text-[12px] lg:text-[13px] text-primary-foreground/85 mt-0.5 leading-snug">
                {hasRecords ? t("briefingHero.cta.fromRecords") : t("briefingHero.cta.fromSample")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-primary-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Secondary path */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate("/app/share")}
              style={stage(460)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors min-w-0"
            >
              <Share2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[12px] font-medium text-foreground truncate">Share with doctor</span>
            </button>
            <button
              onClick={() => navigate("/app/emergency-contacts")}
              style={stage(540)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors min-w-0"
            >
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[12px] font-medium text-foreground truncate">Emergency access</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardBriefingHero;
