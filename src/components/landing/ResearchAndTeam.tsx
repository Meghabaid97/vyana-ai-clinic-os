import backdrop from "@/assets/landing-howitworks-painting.jpg";
import whartonLogo from "@/assets/wharton-logo.png";

const citations = [
  {
    title: "Cardiovascular Risk",
    cite: "Goff, D. C., et al. (2014). 2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk. Circulation, 129(25_suppl_2), S49–S73.",
    line: "Vyana implements the Pooled Cohort ASCVD equations to estimate 10-year heart-attack and stroke risk from real patient vitals, never speculative inference.",
  },
  {
    title: "Diabetes Staging",
    cite: "American Diabetes Association. (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl. 1).",
    line: "HbA1c thresholds, prediabetes flags, and glycemic targets follow ADA 2024, the same standard used by every Indian endocrinology practice.",
  },
  {
    title: "Kidney Function",
    cite: "KDIGO. (2024). Clinical Practice Guideline for the Evaluation and Management of CKD. Kidney International, 105(4S).",
    line: "eGFR is computed via the 2021 CKD-EPI race-free equation, with KDIGO stage flags surfaced before they become irreversible.",
  },
  {
    title: "Drug Interactions",
    cite: "WHO Collaborating Centre for Drug Statistics Methodology. (2024). ATC/DDD Index. Geneva.",
    line: "Every medication is mapped to ATC codes and cross-checked for major interactions before any reminder, refill, or briefing leaves the app.",
  },
];

const ResearchAndTeam = () => {
  return (
    <section
      id="research"
      className="relative py-24 lg:py-36 overflow-hidden"
    >
      {/* Sepia photograph backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={backdrop}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1280}
          className="w-full h-full object-cover animate-ken-burns opacity-90"
        />
        {/* Deep walnut veil — slightly lighter than How It Works for distinction */}
        <div className="absolute inset-0 bg-[hsl(22_25%_12%/0.78)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, hsl(22 25% 8% / 0.5) 100%)",
          }}
        />
        {/* Top + bottom fades into adjacent ivory sections */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[hsl(36_30%_96%)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[hsl(36_30%_96%)] to-transparent" />
      </div>

      {/* Floating amber particles — same motif as How It Works */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", left: "12%", delay: "0s", size: 1.5 },
          { top: "32%", left: "78%", delay: "1.2s", size: 2 },
          { top: "55%", left: "22%", delay: "2.5s", size: 1 },
          { top: "70%", left: "85%", delay: "0.6s", size: 1.5 },
          { top: "82%", left: "40%", delay: "3.2s", size: 2 },
          { top: "25%", left: "50%", delay: "2s", size: 1 },
          { top: "60%", left: "60%", delay: "1.8s", size: 1.2 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/70 animate-soft-float"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size * 4}px`,
              height: `${p.size * 4}px`,
              animationDelay: p.delay,
              filter: "blur(0.5px)",
              boxShadow: "0 0 12px hsl(14 62% 54% / 0.6)",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="max-w-[640px] mb-14">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[hsl(30_30%_85%)] font-medium mb-4">
            III &nbsp;·&nbsp; The science
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.02em] text-white">
            Built on the same protocols
            <br />
            <em className="italic text-primary font-normal">your doctor already trusts.</em>
          </h2>
          <p className="mt-5 text-[15px] text-[hsl(30_25%_88%)] leading-relaxed max-w-[560px]">
            Every flag, score and warning in Vyana is a faithful implementation
            of a published clinical guideline. Not generative guesswork.
          </p>
        </div>

        {/* Two-column composition: cream citation cards | team strip */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          {/* LEFT: cream cards */}
          <div className="space-y-6">
            {citations.map((c, i) => (
              <article
                key={i}
                className="rounded-xl px-7 py-7 sm:px-9 sm:py-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(36 50% 92%) 0%, hsl(34 45% 84%) 100%)",
                }}
              >
                <h3 className="font-serif text-[22px] sm:text-[26px] text-[hsl(20_20%_18%)] leading-tight mb-3">
                  {c.title}
                </h3>
                <p className="font-serif italic text-[13px] text-[hsl(20_15%_30%)] leading-relaxed mb-4">
                  {c.cite}
                </p>
                <div className="h-px bg-[hsl(20_15%_30%/0.2)] mb-4" />
                <p className="font-serif italic text-[15px] text-[hsl(20_20%_22%)] leading-[1.7]">
                  {c.line}
                </p>
              </article>
            ))}
          </div>

          {/* RIGHT: built-by strip */}
          <div className="space-y-6 lg:pl-4">
            {/* Built by header card */}
            <div className="text-center lg:text-left">
              <h3 className="font-serif text-2xl sm:text-3xl text-white leading-tight">
                Built by founders from
              </h3>
            </div>

            {/* Logos row — Wharton on white pill */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[160px] rounded-lg bg-white px-6 py-5 flex items-center justify-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]">
                <img
                  src={whartonLogo}
                  alt="Wharton School, University of Pennsylvania"
                  className="h-16 w-auto object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-[160px] rounded-lg bg-white px-6 py-5 flex items-center justify-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]">
                <div className="text-center">
                  <div className="font-serif text-base text-[hsl(20_20%_18%)] tracking-wide leading-tight">
                    Clinical Advisors
                  </div>
                  <div className="text-[8px] tracking-[0.25em] uppercase text-[hsl(20_20%_45%)] mt-1.5">
                    AIIMS · Apollo · Tertiary care
                  </div>
                </div>
              </div>
            </div>

            {/* Founder dark cards */}
            <article
              className="rounded-xl px-7 py-7 sm:px-9 sm:py-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
              style={{ background: "hsl(20 18% 12% / 0.92)" }}
            >
              <h4 className="font-serif text-[22px] sm:text-[26px] text-white leading-tight mb-1">
                Megha Baid
              </h4>
              <p className="text-[13px] text-primary font-medium mb-4">
                The Founder
              </p>
              <p className="text-[14px] text-[hsl(30_15%_80%)] leading-[1.75]">
                Megha is pursuing her MBA at Wharton, focused on healthcare and
                applied AI. She lost both grandparents to medical emergencies
                in Tirupur where doctors had no clinical history, and later
                navigated her father's intestinal gangrene during COVID with
                the same gap. Vyana is the layer that would have changed both
                nights.
              </p>
            </article>

            <article
              className="rounded-xl px-7 py-7 sm:px-9 sm:py-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
              style={{ background: "hsl(20 18% 12% / 0.92)" }}
            >
              <h4 className="font-serif text-[22px] sm:text-[26px] text-white leading-tight mb-1">
                Clinical Advisory Board
              </h4>
              <p className="text-[13px] text-primary font-medium mb-4">
                The Trust
              </p>
              <p className="text-[14px] text-[hsl(30_15%_80%)] leading-[1.75]">
                Practising physicians from Indian tertiary hospitals contribute
                to our risk engine, briefing protocols, and the clinical safety
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
