import { useActiveSection } from "@/hooks/use-active-section";
import RxExtractArtifact from "./pillar-artifacts/RxExtractArtifact";
import TimelineArtifact from "./pillar-artifacts/TimelineArtifact";
import BriefingArtifact from "./pillar-artifacts/BriefingArtifact";
import VitalsChartArtifact from "./pillar-artifacts/VitalsChartArtifact";
import RiskFlagArtifact from "./pillar-artifacts/RiskFlagArtifact";

type Pillar = {
  numeral: string;
  framework: string;
  citation: string;
  takeaway: string;
  Artifact: React.ComponentType;
};

// Coraise-inspired structure: each beat reads like a peer-reviewed claim,
// not a marketing pillar. Framework name -> italic citation -> plain takeaway.
const pillars: Pillar[] = [
  {
    numeral: "I",
    framework: "Vision-language extraction",
    citation:
      "OpenAI. (2024). GPT-4 with vision: System card. Multimodal models can extract structured clinical data from photographs of handwritten and printed documents at near-human accuracy.",
    takeaway:
      "Snap any prescription, lab report or discharge summary in five Indian languages. We pull vitals, meds and diagnoses, handwritten or printed.",
    Artifact: RxExtractArtifact,
  },
  {
    numeral: "II",
    framework: "Longitudinal records",
    citation:
      "WHO. (2016). Framework on integrated, people-centred health services. Continuity of clinical information is the single strongest predictor of safe, appropriate care across visits.",
    takeaway:
      "Years of scattered paper become one calm, longitudinal record your family can actually read, not a folder of unrelated PDFs.",
    Artifact: TimelineArtifact,
  },
  {
    numeral: "III",
    framework: "Information transfer",
    citation:
      "Stiell, A., et al. (2003). Prevalence of information gaps in the emergency department. CMAJ, 169(10). Information gaps occur in 32% of ER visits and are independently associated with longer stays and adverse events.",
    takeaway:
      "A one-page clinical briefing any physician can read in thirty seconds. Shareable on WhatsApp before the appointment.",
    Artifact: BriefingArtifact,
  },
  {
    numeral: "IV",
    framework: "Trend surveillance",
    citation:
      "Lancet Diabetes & Endocrinology. (2020). Continuous risk-factor monitoring outperforms episodic measurement in detecting trajectory changes in HbA1c, BP and eGFR.",
    takeaway:
      "33 vitals tracked. The slow-moving signals doctors rarely get to see in a fifteen-minute consult, surfaced before they become irreversible.",
    Artifact: VitalsChartArtifact,
  },
  {
    numeral: "V",
    framework: "Validated risk scoring",
    citation:
      "ACC/AHA Pooled Cohort Equations (2013); ADA Standards of Care (2024); KDIGO Guidelines (2024). Risk computed from a patient's actual numbers, not population averages, supports earlier intervention.",
    takeaway:
      "ASCVD, ADA diabetes staging, KDIGO kidney scores. Computed from your real readings, framed as discussion points, never speculation.",
    Artifact: RiskFlagArtifact,
  },
];

const StickyPillarReveal = () => {
  const { active, registerRef } = useActiveSection(pillars.length);

  return (
    <div className="relative py-24 lg:py-32">
      {/* Section header */}
      <div className="max-w-[860px] mx-auto px-6 lg:px-12 mb-20 lg:mb-28">
        <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
          IV &nbsp;·&nbsp; What you walk in with
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-[68px] leading-[1.05] tracking-[-0.02em] text-foreground">
          Five quiet systems,
          <br />
          <em className="italic text-primary font-normal">grounded in evidence.</em>
        </h2>
        <p className="mt-6 font-serif italic text-[18px] text-muted-foreground leading-relaxed max-w-[620px]">
          Each piece of Vyana sits on a published clinical framework. Scroll
          through to see what every system actually produces.
        </p>
      </div>

      {/* Desktop: pinned scrollytelling scene. The viewport stays locked while
          page scroll moves through invisible sentinels that switch the active
          citation + live preview. */}
      <div className="hidden lg:block max-w-[1280px] mx-auto px-12">
        <div
          className="relative"
          style={{
            height: `calc(100svh - 3.5rem + ${(pillars.length - 1) * 72}vh)`,
          }}
        >
          <div className="sticky top-14 h-[calc(100svh-3.5rem)] grid grid-cols-[minmax(0,1fr)_minmax(0,560px)] gap-20 items-center">
            {/* Left: active citation only, cross-fading as the section advances */}
            <div className="relative h-full flex items-center">
              {pillars.map((p, i) => (
                <article
                  key={i}
                  className={`absolute inset-y-0 left-0 max-w-[520px] flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                    active === i
                      ? "opacity-100 translate-y-0"
                      : active > i
                        ? "opacity-0 -translate-y-6 pointer-events-none"
                        : "opacity-0 translate-y-6 pointer-events-none"
                  }`}
                >
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="font-serif italic text-[15px] text-primary">
                      {p.numeral}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} / {pillars.length}
                    </span>
                  </div>

                  <h3 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em] text-foreground mb-6">
                    {p.framework}
                  </h3>

                  <p className="font-serif italic text-[14px] text-muted-foreground leading-[1.65] mb-6 pl-4 border-l-2 border-primary/30">
                    {p.citation}
                  </p>

                  <p className="text-[17px] leading-[1.6] text-foreground/85">
                    {p.takeaway}
                  </p>
                </article>
              ))}
            </div>

            {/* Right: locked live preview */}
            <div className="relative h-[600px]">
              <div className="relative h-full rounded-[28px] bg-gradient-to-br from-[hsl(36_30%_94%)] to-[hsl(36_25%_88%)] border border-border/40 shadow-[0_40px_100px_-40px_hsl(22_25%_15%/0.25)] overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "radial-gradient(hsl(22 25% 15%) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="absolute top-6 left-6 z-10">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/50 font-medium">
                    Live preview
                  </p>
                  <p
                    key={active}
                    className="font-serif text-[15px] text-foreground mt-1 animate-fade-in"
                  >
                    {pillars[active].framework}
                  </p>
                </div>

                <div className="absolute top-6 right-6 z-10 flex gap-1.5">
                  {pillars.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        active === i ? "w-6 bg-primary" : "w-1.5 bg-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 flex items-center justify-center px-8">
                  {pillars.map((p, i) => {
                    const Artifact = p.Artifact;
                    return (
                      <div
                        key={i}
                        className={`absolute inset-0 flex items-center justify-center px-8 transition-all duration-500 ${
                          active === i
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : active > i
                              ? "opacity-0 -translate-y-4 pointer-events-none"
                              : "opacity-0 translate-y-4 pointer-events-none"
                        }`}
                      >
                        <Artifact />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Invisible scroll markers drive the active step without pushing the
              stage down, so the scene appears immediately when the section starts. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 opacity-0" aria-hidden>
            {pillars.map((p, i) => (
              <div
                key={`sentinel-${i}`}
                ref={registerRef(i)}
                style={{ height: i === 0 ? "calc(100svh - 3.5rem)" : "72vh" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: stacked pairs */}
      <div className="lg:hidden max-w-[560px] mx-auto px-6 space-y-20">
        {pillars.map((p, i) => {
          const Artifact = p.Artifact;
          return (
            <div key={i} className="space-y-7">
              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-serif italic text-[14px] text-primary">
                    {p.numeral}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <h3 className="font-serif text-[26px] leading-[1.15] text-foreground mb-4">
                  {p.framework}
                </h3>
                <p className="font-serif italic text-[13px] text-muted-foreground leading-[1.65] mb-4 pl-3 border-l-2 border-primary/30">
                  {p.citation}
                </p>
                <p className="text-[15px] leading-[1.6] text-foreground/85">
                  {p.takeaway}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[hsl(36_30%_94%)] to-[hsl(36_25%_88%)] border border-border/40 p-6">
                <Artifact />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StickyPillarReveal;
