import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

const QuoteWall = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  const quotes = [
    { body: t("voices.q1.body"), attribution: t("voices.q1.who"), context: t("voices.q1.ctx") },
    { body: t("voices.q2.body"), attribution: t("voices.q2.who"), context: t("voices.q2.ctx") },
    { body: t("voices.q3.body"), attribution: t("voices.q3.who"), context: t("voices.q3.ctx") },
  ];

  return (
    <section
      id="voices"
      className="mood mood-cream from-blush to-sage relative py-28 lg:py-36"
    >
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[640px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("voices.eyebrow")}
          </p>
          <h2 className="text-section text-foreground">
            {t("voices.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("voices.title.l2")}</em>
          </h2>
        </div>

        <div
          ref={grid.ref}
          className={`reveal ${grid.visible ? "is-visible" : ""} grid md:grid-cols-3 gap-6 lg:gap-8`}
        >
          {quotes.map((q, i) => (
            <figure
              key={i}
              className={`reveal reveal-delay-${i + 1} ${grid.visible ? "is-visible" : ""} rounded-2xl glass-card p-8`}
            >
              <span
                aria-hidden
                className="block font-serif text-primary/60 leading-none mb-2 text-[56px]"
              >
                "
              </span>
              <blockquote className="font-serif text-[20px] sm:text-[22px] leading-[1.35] tracking-[-0.01em] text-foreground/90">
                {q.body}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="block w-6 h-px bg-primary/50" />
                <span className="text-caption text-foreground/70">
                  <span className="font-semibold text-foreground">{q.attribution}</span>
                  <span className="text-foreground/50"> · {q.context}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuoteWall;
