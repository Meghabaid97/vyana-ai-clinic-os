import whartonLogo from "@/assets/wharton-logo.png";
import { useReveal } from "@/hooks/use-reveal";

const citations = [
  {
    title: "Cardiovascular Risk",
    cite: "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline. Circulation, 129(25_suppl_2).",
    line: "We implement the Pooled Cohort ASCVD equations on real patient vitals. Never speculative inference.",
  },
  {
    title: "Diabetes Staging",
    cite: "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    line: "HbA1c thresholds and glycemic targets follow ADA 2024, the standard every Indian endocrinology practice uses.",
  },
  {
    title: "Kidney Function",
    cite: "KDIGO. (2024). Clinical Practice Guideline for CKD. Kidney International, 105(4S).",
    line: "eGFR is computed via the 2021 CKD-EPI race-free equation, with KDIGO stage flags surfaced early.",
  },
  {
    title: "Drug Interactions",
    cite: "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index.",
    line: "Every medication is mapped to ATC codes and cross-checked for major interactions.",
  },
];

const ResearchAndTeam = () => {
  const header = useReveal<HTMLDivElement>();
  const left = useReveal<HTMLDivElement>();
  const right = useReveal<HTMLDivElement>();

  return (
    <section id="research" className="relative bg-surface-dark py-28 lg:py-36">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            The science
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-surface-dark-foreground">
            Built on the same protocols
            <br />
            <em className="italic text-primary font-normal">your doctor already trusts.</em>
          </h2>
          <p className="mt-6 text-[17px] text-surface-dark-muted leading-[1.65] max-w-[560px]">
            Every flag, score and warning in Vyana is a faithful implementation
            of a published clinical guideline. Not generative guesswork.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div
            ref={left.ref}
            className={`reveal ${left.visible ? "is-visible" : ""} space-y-5`}
          >
            {citations.map((c, i) => (
              <article
                key={i}
                className={`reveal reveal-delay-${i + 1} ${left.visible ? "is-visible" : ""} rounded-2xl border border-white/10 bg-white/[0.03] p-7`}
              >
                <h3 className="font-serif text-[22px] text-surface-dark-foreground leading-tight mb-2">
                  {c.title}
                </h3>
                <p className="font-serif italic text-[12.5px] text-surface-dark-muted/80 leading-relaxed mb-4">
                  {c.cite}
                </p>
                <p className="text-[14.5px] text-surface-dark-foreground/85 leading-[1.65]">
                  {c.line}
                </p>
              </article>
            ))}
          </div>

          <div
            ref={right.ref}
            className={`reveal ${right.visible ? "is-visible" : ""} space-y-5`}
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <p className="text-[11px] tracking-[0.3em] uppercase text-surface-dark-muted/80 mb-5">
                Built by founders from
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 rounded-lg bg-white flex items-center justify-center">
                  <img
                    src={whartonLogo}
                    alt="Wharton School, University of Pennsylvania"
                    className="max-h-16 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="h-24 rounded-lg bg-white flex items-center justify-center text-center px-4">
                  <div>
                    <div className="font-serif text-[15px] text-foreground leading-tight">
                      Clinical Advisors
                    </div>
                    <div className="text-[9px] tracking-[0.25em] uppercase text-foreground/55 mt-1.5">
                      AIIMS · Apollo · Tertiary care
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h4 className="font-serif text-[22px] text-surface-dark-foreground leading-tight mb-1">
                Megha Baid
              </h4>
              <p className="text-[13px] text-primary font-medium mb-4">
                Founder · CS Major · Ex-FAANG · Wharton MBA
              </p>
              <p className="text-[14.5px] text-surface-dark-muted leading-[1.7]">
                Megha is pursuing her MBA at Wharton, focused on healthcare and
                applied AI. She lost both grandparents to medical emergencies
                in Tirupur 2005 where doctors had no clinical history, and
                later navigated her father's intestinal gangrene during COVID
                with the same gap. Vyana is the layer that would have changed
                both nights.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h4 className="font-serif text-[22px] text-surface-dark-foreground leading-tight mb-1">
                Clinical Advisory Board
              </h4>
              <p className="text-[13px] text-primary font-medium mb-4">
                The trust
              </p>
              <p className="text-[14.5px] text-surface-dark-muted leading-[1.7]">
                Practising physicians from Indian tertiary hospitals contribute
                to our risk engine, briefing protocols and the clinical safety
                rules that govern every AI-generated insight in Vyana.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchAndTeam;
