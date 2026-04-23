import { useActiveSection } from "@/hooks/use-active-section";
import RxExtractArtifact from "./pillar-artifacts/RxExtractArtifact";
import TimelineArtifact from "./pillar-artifacts/TimelineArtifact";
import BriefingArtifact from "./pillar-artifacts/BriefingArtifact";
import VitalsChartArtifact from "./pillar-artifacts/VitalsChartArtifact";
import RiskFlagArtifact from "./pillar-artifacts/RiskFlagArtifact";

type Pillar = {
  eyebrow: string;
  title: string;
  body: string;
  Artifact: React.ComponentType;
};

const pillars: Pillar[] = [
  {
    eyebrow: "Powered by",
    title: "Vision AI extraction",
    body:
      "Snap any prescription, lab report or discharge summary. We pull vitals, meds and diagnoses, handwritten or printed, in five Indian languages.",
    Artifact: RxExtractArtifact,
  },
  {
    eyebrow: "Experience",
    title: "A quiet health story",
    body:
      "Years of scattered paper become one calm, longitudinal record your family can actually read.",
    Artifact: TimelineArtifact,
  },
  {
    eyebrow: "Outcome",
    title: "Doctors trust the briefing",
    body:
      "A one-page clinical summary any physician can read in thirty seconds. Shareable on WhatsApp before the appointment.",
    Artifact: BriefingArtifact,
  },
  {
    eyebrow: "Powered by",
    title: "33 vitals tracked",
    body:
      "HbA1c. BP. eGFR. The slow-moving signals doctors rarely get to see in a fifteen-minute consult, surfaced before they become irreversible.",
    Artifact: VitalsChartArtifact,
  },
  {
    eyebrow: "Experience",
    title: "Risk flags that listen",
    body:
      "ASCVD, ADA diabetes staging, KDIGO kidney scores. Computed from your real numbers, never speculation.",
    Artifact: RiskFlagArtifact,
  },
];

const StickyPillarReveal = () => {
  const { active, registerRef } = useActiveSection(pillars.length);

  return (
    <div className="relative">
      {/* Section header */}
      <div className="max-w-[760px] mx-auto px-6 lg:px-12 mb-16 lg:mb-24">
        <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
          The proof
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-[64px] leading-[1.05] tracking-[-0.02em] text-foreground">
          Five quiet systems,
          <br />
          <em className="italic text-primary font-normal">one connected story.</em>
        </h2>
        <p className="mt-5 text-body text-muted-foreground max-w-[560px]">
          Scroll. Each piece of Vyana shows you the artifact it produces, real,
          not a promise.
        </p>
      </div>

      {/* Desktop: sticky two-column */}
      <div className="hidden lg:block max-w-[1240px] mx-auto px-12">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-16">
          {/* Left: scrolling beats */}
          <div>
            {pillars.map((p, i) => (
              <section
                key={i}
                ref={registerRef(i)}
                className="min-h-[80vh] flex items-center"
              >
                <div
                  className={`transition-all duration-500 ${
                    active === i
                      ? "opacity-100 translate-y-0"
                      : "opacity-40 translate-y-1"
                  }`}
                >
                  <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold mb-4">
                    {String(i + 1).padStart(2, "0")} · {p.eyebrow}
                  </p>
                  <h3 className="font-serif text-[40px] leading-[1.1] tracking-[-0.01em] text-foreground mb-5">
                    {p.title}
                  </h3>
                  <p className="text-[17px] leading-[1.6] text-foreground/75 max-w-[460px]">
                    {p.body}
                  </p>
                </div>
              </section>
            ))}
          </div>

          {/* Right: sticky artifact frame */}
          <div className="relative">
            <div className="sticky top-1/2 -translate-y-1/2 h-[520px] flex items-center justify-center">
              {pillars.map((p, i) => {
                const Artifact = p.Artifact;
                return (
                  <div
                    key={i}
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                      active === i
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-2 pointer-events-none"
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

      {/* Mobile: stacked pairs */}
      <div className="lg:hidden max-w-[520px] mx-auto px-6 space-y-16">
        {pillars.map((p, i) => {
          const Artifact = p.Artifact;
          return (
            <div key={i} className="space-y-6">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold mb-3">
                  {String(i + 1).padStart(2, "0")} · {p.eyebrow}
                </p>
                <h3 className="font-serif text-[28px] leading-[1.15] text-foreground mb-3">
                  {p.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-foreground/75">
                  {p.body}
                </p>
              </div>
              <Artifact />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StickyPillarReveal;
