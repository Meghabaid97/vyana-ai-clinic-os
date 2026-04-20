import backdrop from "@/assets/landing-research-backdrop.jpg";

const citations = [
  {
    title: "Longitudinal Health Records",
    cite: "WHO. (2016). Framework on integrated, people-centred health services. World Health Organization.",
    line: "Continuity of clinical information is the single strongest predictor of safe, appropriate care across visits.",
  },
  {
    title: "Diagnostic Delays in India",
    cite: "Lancet Commission on Diagnostics. (2021). Transforming access to diagnostics. The Lancet, 398(10315).",
    line: "47% of the world's population has little or no access to diagnostics. Repeated tests are the norm, not the exception.",
  },
  {
    title: "ABDM & Federated Records",
    cite: "Ministry of Health & Family Welfare. (2020). Ayushman Bharat Digital Mission Strategy Overview.",
    line: "India's health stack envisions consent-based, patient-held records as the foundation of digital care.",
  },
  {
    title: "Family Caregiving Burden",
    cite: "Brinda, E. M., et al. (2014). Cost and burden of informal caregiving of dependent older people. BMC Health Services Research, 14, 207.",
    line: "Indian family caregivers carry 80%+ of chronic care coordination, often without any clinical record to anchor decisions.",
  },
];

const ResearchAndTeam = () => {
  return (
    <section
      id="research"
      className="relative py-24 lg:py-36 overflow-hidden"
    >
      {/* Painting backdrop */}
      <div className="absolute inset-0">
        <img
          src={backdrop}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1280}
          className="w-full h-full object-cover"
        />
        {/* Warm sepia veil to unify cards over backdrop */}
        <div className="absolute inset-0 bg-[hsl(30_25%_18%/0.55)]" />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="max-w-[640px] mb-14">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[hsl(30_30%_85%)] font-medium mb-4">
            III &nbsp;·&nbsp; The science
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.02em] text-white">
            Grounded in clinical
            <br />
            <em className="italic text-primary font-normal">and public-health research.</em>
          </h2>
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
                <div className="text-center">
                  <div className="font-serif text-xl text-[hsl(212_85%_25%)] tracking-wide leading-none">
                    Wharton
                  </div>
                  <div className="text-[8px] tracking-[0.25em] uppercase text-[hsl(212_85%_25%)] mt-1.5">
                    University of Pennsylvania
                  </div>
                </div>
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
