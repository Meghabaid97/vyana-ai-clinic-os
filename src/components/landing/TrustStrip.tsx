import { Shield, Lock, FileCheck, Heart, GraduationCap } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

const TrustStrip = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  const badges = [
    { icon: Lock, label: t("trust.b1.label"), sub: t("trust.b1.sub") },
    { icon: Shield, label: t("trust.b2.label"), sub: t("trust.b2.sub") },
    { icon: FileCheck, label: t("trust.b3.label"), sub: t("trust.b3.sub") },
    { icon: Heart, label: t("trust.b4.label"), sub: t("trust.b4.sub") },
    { icon: GraduationCap, label: t("trust.b5.label"), sub: t("trust.b5.sub") },
  ];

  return (
    <section id="trust" className="py-24 lg:py-32 bg-background border-t border-border">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`max-w-[640px] mb-14 transition-all duration-700 ${
            header.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-5">
            V &nbsp;·&nbsp; {t("trust.eyebrow")}
          </p>
          <h2 className="font-serif text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-foreground">
            {t("trust.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("trust.title.l2")}</em>
          </h2>
          <p className="mt-6 text-[15.5px] leading-[1.75] text-muted-foreground">
            {t("trust.sub")}
          </p>
        </div>

        <div
          ref={grid.ref}
          className={`grid grid-cols-2 md:grid-cols-5 gap-3 transition-all duration-700 delay-150 ${
            grid.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {badges.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-5 flex flex-col items-start gap-3 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[13.5px] font-medium text-foreground leading-tight">
                  {label}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] italic text-muted-foreground/80 max-w-[620px]">
          {t("trust.note")}
        </p>
      </div>
    </section>
  );
};

export default TrustStrip;
