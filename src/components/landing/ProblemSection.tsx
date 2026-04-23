import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";
import { StatCard } from "@/components/landing/StatCard";

const ProblemSection = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  const stats = [
    { k: t("problem.stat1.k"), v: t("problem.stat1.v") },
    { k: t("problem.stat2.k"), v: t("problem.stat2.v") },
    { k: t("problem.stat3.k"), v: t("problem.stat3.v") },
  ];
  const consequences = [
    t("problem.tag.repeat"),
    t("problem.tag.miss"),
    t("problem.tag.delay"),
  ];

  return (
    <section id="problem" className="mood mood-blush from-cream to-cream relative py-28 lg:py-36">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("problem.eyebrow")}
          </p>
          <h2 className="text-section text-foreground">
            {t("problem.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("problem.title.l2")}</em>
          </h2>
          <p className="mt-8 text-body text-muted-foreground max-w-[560px]">
            {t("problem.sub")}
          </p>
        </div>

        <div
          ref={grid.ref}
          className="tilt-stage grid md:grid-cols-3 gap-6 lg:gap-8 mb-16"
        >
          {stats.map((s, i) => (
            <StatCard key={i} k={s.k} v={s.v} index={i} visible={grid.visible} />
          ))}
        </div>

        <div className="max-w-[760px]">
          <p className="text-label text-muted-foreground mb-4">
            {t("problem.consequences")}
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {consequences.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border px-4 py-2 text-caption text-foreground/80 bg-card/60"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="font-serif italic text-[20px] sm:text-[24px] leading-[1.5] text-foreground/85 max-w-[620px]">
            {t("problem.closer")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
