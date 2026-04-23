import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

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
    <section id="problem" className="relative bg-surface-dark py-28 lg:py-36">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("problem.eyebrow")}
          </p>
          <h2 className="text-section text-surface-dark-foreground">
            {t("problem.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("problem.title.l2")}</em>
          </h2>
          <p className="mt-8 text-body text-surface-dark-muted max-w-[560px]">
            {t("problem.sub")}
          </p>
        </div>

        <div
          ref={grid.ref}
          className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={`reveal reveal-lg reveal-stagger-${i + 1} ${grid.visible ? "is-visible" : ""} rounded-2xl glass-card-dark p-8`}
            >
              <div className="font-serif text-[42px] leading-none text-primary tracking-[-0.02em]">
                {s.k}
              </div>
              <p className="mt-5 text-body text-surface-dark-muted">
                {s.v}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-[760px]">
          <p className="text-label text-surface-dark-muted/70 mb-4">
            {t("problem.consequences")}
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {consequences.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/15 px-4 py-2 text-caption text-surface-dark-foreground/85 bg-white/[0.03]"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="font-serif italic text-[20px] sm:text-[24px] leading-[1.5] text-surface-dark-foreground/90 max-w-[620px]">
            {t("problem.closer")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
