import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

/**
 * Outcome section, sharpened.
 *
 * Wedge already proves *what Vyana is* (the clinical memory system + its
 * three pillars). This section now answers the only remaining question:
 * *what changes for you?* We dropped the 4-bullet deliverables list because
 * it duplicated the wedge pillars (trends, signals). What's left is the
 * stop -> gain flip: the emotional payoff in three beats.
 */
const OutcomeSection = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const flips = useReveal<HTMLDivElement>();

  const outcomes = [
    { stop: t("out.flip1.stop"), gain: t("out.flip1.gain") },
    { stop: t("out.flip2.stop"), gain: t("out.flip2.gain") },
    { stop: t("out.flip3.stop"), gain: t("out.flip3.gain") },
  ];

  return (
    <section id="output" className="relative py-28 lg:py-36 bg-background">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("out.eyebrow")}
          </p>
          <h2 className="text-section text-foreground">
            {t("out.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("out.title.l2")}</em>
          </h2>
        </div>

        <div
          ref={flips.ref}
          className={`reveal ${flips.visible ? "is-visible" : ""}`}
        >
          <div className="grid md:grid-cols-3 gap-6">
            {outcomes.map((o, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} ${flips.visible ? "is-visible" : ""} rounded-2xl glass-card p-7`}
              >
                <p className="text-caption text-foreground/45 line-through">
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
