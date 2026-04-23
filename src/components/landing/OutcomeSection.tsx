import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

const OutcomeSection = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const out = useReveal<HTMLDivElement>();
  const flips = useReveal<HTMLDivElement>();

  const outputs = [t("out.list1"), t("out.list2"), t("out.list3"), t("out.list4")];
  const outcomes = [
    { stop: t("out.flip1.stop"), gain: t("out.flip1.gain") },
    { stop: t("out.flip2.stop"), gain: t("out.flip2.gain") },
    { stop: t("out.flip3.stop"), gain: t("out.flip3.gain") },
  ];

  return (
    <section id="output" className="relative py-28 lg:py-36 bg-background">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12 space-y-24">
        <div>
          <div
            ref={header.ref}
            className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-12`}
          >
            <p className="font-serif italic text-[15px] text-primary/90 mb-5">
              {t("out.eyebrow")}
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-foreground">
              {t("out.title.l1")}
              <br />
              <em className="italic text-primary font-normal">{t("out.title.l2")}</em>
            </h2>
          </div>
          <div
            ref={out.ref}
            className={`reveal ${out.visible ? "is-visible" : ""} grid sm:grid-cols-2 gap-4 max-w-[820px]`}
          >
            {outputs.map((o, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} ${out.visible ? "is-visible" : ""} flex items-start gap-4 rounded-xl glass-card p-5`}
              >
                <span className="font-serif text-primary text-[22px] leading-none mt-0.5">·</span>
                <span className="text-[15px] leading-[1.55] text-foreground/90">{o}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={flips.ref}
          className={`reveal ${flips.visible ? "is-visible" : ""}`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("out.flips.eyebrow")}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {outcomes.map((o, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} ${flips.visible ? "is-visible" : ""} rounded-2xl glass-card p-7`}
              >
                <p className="text-[14px] text-foreground/45 line-through">
                  {o.stop}
                </p>
                <p className="mt-3 font-serif text-[26px] leading-[1.15] text-foreground tracking-[-0.01em]">
                  <em className="italic text-primary font-normal">{o.gain}</em>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OutcomeSection;
