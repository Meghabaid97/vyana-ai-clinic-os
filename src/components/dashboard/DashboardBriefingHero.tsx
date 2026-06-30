import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Share2, Shield, ArrowRight, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  hasRecords: boolean;
}

/**
 * Bento-style hero — warm coral card with a white "Start visit mode" pill.
 * Inspired by the chosen v3 prototype direction.
 */
const DashboardBriefingHero = ({ hasRecords }: Props) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [staged, setStaged] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setStaged(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const stage = (delay: number): React.CSSProperties => ({
    opacity: staged ? 1 : 0,
    transform: staged ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 380ms ease-out ${delay}ms, transform 420ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
  });

  return (
    <section className="px-4 sm:px-5 pb-4 lg:px-0 lg:pb-0">
      <div
        className="relative overflow-hidden rounded-[2rem] p-6 lg:p-7 text-foreground shadow-[0_12px_32px_-18px_rgba(0,0,0,0.18)]"
        style={{ background: "hsl(var(--surface-mint))" }}
      >
        {/* soft glow accent */}
        <div className="pointer-events-none absolute -right-10 -bottom-12 h-44 w-44 rounded-full bg-white/40 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3" style={stage(0)}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-2.5 py-1 text-[10.5px] font-semibold tracking-wider uppercase text-foreground ring-1 ring-black/5">
              <Clock className="h-3 w-3" /> {t("briefingHero.eyebrow")}
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-foreground/70">
              <Sparkles className="h-3 w-3" />
              AI-organized
            </span>
          </div>

          <h2
            className="text-[24px] sm:text-[28px] lg:text-[34px] xl:text-[38px] font-extrabold leading-[1.05] tracking-[-0.025em]"
            style={stage(120)}
          >
            {t("briefingHero.title.l1")} {t("briefingHero.title.l2")}
          </h2>
          <p
            className="mt-2 text-[13px] lg:text-[14px] text-foreground/70 leading-snug max-w-[42ch] lg:max-w-[54ch]"
            style={stage(220)}
          >
            {t("briefingHero.body")}
          </p>

          {/* Primary CTA — butter yellow pill, matches reference */}
          <button
            onClick={() => navigate("/app/briefing")}
            style={{ ...stage(340), background: "hsl(var(--surface-butter))" }}
            className="group mt-5 inline-flex items-center gap-3 rounded-2xl text-foreground px-5 py-3 font-bold shadow-[0_4px_14px_-2px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <span className="inline-flex h-7 w-7 rounded-lg bg-foreground text-background items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[14px]">{t("briefingHero.cta.start")}</span>
              <span className="text-[11px] font-medium text-foreground/60">
                {hasRecords ? t("briefingHero.cta.fromRecords") : t("briefingHero.cta.fromSample")}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Secondary actions — white chips on mint */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate("/app/share")}
              style={stage(460)}
              className="flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-3 py-2.5 text-left hover:bg-white transition-colors min-w-0"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="text-[12.5px] font-medium truncate">Share with doctor</span>
            </button>
            <button
              onClick={() => navigate("/app/emergency-contacts")}
              style={stage(540)}
              className="flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-3 py-2.5 text-left hover:bg-white transition-colors min-w-0"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="text-[12.5px] font-medium truncate">Emergency access</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardBriefingHero;
