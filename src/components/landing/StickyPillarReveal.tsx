import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useActiveSection } from "@/hooks/use-active-section";
import {
  AnimatedUploadDemo,
  AnimatedExtractDemo,
  AnimatedShareDemo,
} from "./AnimatedPhoneDemos";
import RxExtractArtifact from "./pillar-artifacts/RxExtractArtifact";
import TimelineArtifact from "./pillar-artifacts/TimelineArtifact";
import BriefingArtifact from "./pillar-artifacts/BriefingArtifact";
import VitalsChartArtifact from "./pillar-artifacts/VitalsChartArtifact";
import RiskFlagArtifact from "./pillar-artifacts/RiskFlagArtifact";

type Beat = {
  chapter: "how" | "why";
  numeral: string;
  eyebrow: string;
  framework: string;
  citation: string;
  takeaway: string;
  Artifact: React.ComponentType;
  // Phone demos own their own backdrop, so the live-preview frame skips its
  // warm cream surface for those steps and lets the device float on dark.
  fullBleed?: boolean;
};

// The two old sections, "How it works" and "Outcome", are merged here.
// Beats 1-3 = the three mechanical steps with the existing phone demos.
// Beats 4-8 = the five evidence pillars with citation-style framing.
const beats: Beat[] = [
  {
    chapter: "how",
    numeral: "01",
    eyebrow: "How it works",
    framework: "Upload anything.",
    citation:
      "Snap a prescription. Drop a PDF. Forward a discharge summary. We read handwritten Hindi, printed Tamil, smudged Bengali. Five languages, every format.",
    takeaway: "One inbox for every piece of paper your family has ever collected.",
    Artifact: AnimatedUploadDemo,
    fullBleed: true,
  },
  {
    chapter: "how",
    numeral: "02",
    eyebrow: "How it works",
    framework: "AI extracts everything.",
    citation:
      "Vitals, diagnoses, medications, timelines. Thirty-three clinical signals plotted across years, so the slow patterns finally become visible.",
    takeaway: "Years of paper become structured, queryable medical truth in seconds.",
    Artifact: AnimatedExtractDemo,
    fullBleed: true,
  },
  {
    chapter: "how",
    numeral: "03",
    eyebrow: "How it works",
    framework: "Walk in prepared.",
    citation:
      "A one-page clinical briefing any doctor can read in thirty seconds. Conditions, medications, recent flags. Share on WhatsApp before the appointment.",
    takeaway: "Every appointment starts with context, not a blank page.",
    Artifact: AnimatedShareDemo,
    fullBleed: true,
  },
  {
    chapter: "why",
    numeral: "I",
    eyebrow: "Evidence",
    framework: "Vision-language extraction",
    citation:
      "OpenAI. (2024). GPT-4 with vision: System card. Multimodal models can extract structured clinical data from photographs of handwritten and printed documents at near-human accuracy.",
    takeaway:
      "Snap any prescription, lab report or discharge summary in five Indian languages. We pull vitals, meds and diagnoses, handwritten or printed.",
    Artifact: RxExtractArtifact,
  },
  {
    chapter: "why",
    numeral: "II",
    eyebrow: "Evidence",
    framework: "Longitudinal records",
    citation:
      "WHO. (2016). Framework on integrated, people-centred health services. Continuity of clinical information is the single strongest predictor of safe, appropriate care across visits.",
    takeaway:
      "Years of scattered paper become one calm, longitudinal record your family can actually read, not a folder of unrelated PDFs.",
    Artifact: TimelineArtifact,
  },
  {
    chapter: "why",
    numeral: "III",
    eyebrow: "Evidence",
    framework: "Information transfer",
    citation:
      "Stiell, A., et al. (2003). Prevalence of information gaps in the emergency department. CMAJ, 169(10). Information gaps occur in 32% of ER visits and are independently associated with longer stays and adverse events.",
    takeaway:
      "A one-page clinical briefing any physician can read in thirty seconds. Shareable on WhatsApp before the appointment.",
    Artifact: BriefingArtifact,
  },
  {
    chapter: "why",
    numeral: "IV",
    eyebrow: "Evidence",
    framework: "Trend surveillance",
    citation:
      "Lancet Diabetes & Endocrinology. (2020). Continuous risk-factor monitoring outperforms episodic measurement in detecting trajectory changes in HbA1c, BP and eGFR.",
    takeaway:
      "33 vitals tracked. The slow-moving signals doctors rarely get to see in a fifteen-minute consult, surfaced before they become irreversible.",
    Artifact: VitalsChartArtifact,
  },
  {
    chapter: "why",
    numeral: "V",
    eyebrow: "Evidence",
    framework: "Validated risk scoring",
    citation:
      "ACC/AHA Pooled Cohort Equations (2013); ADA Standards of Care (2024); KDIGO Guidelines (2024). Risk computed from a patient's actual numbers, not population averages, supports earlier intervention.",
    takeaway:
      "ASCVD, ADA diabetes staging, KDIGO kidney scores. Computed from your real readings, framed as discussion points, never speculation.",
    Artifact: RiskFlagArtifact,
  },
];

type DragState = {
  active: boolean;
  pointerId: number | null;
  startY: number;
  startScrollTop: number;
};

const WHEEL_EPSILON = 1;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const StickyPillarReveal = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    active: false,
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const { active, registerRef } = useActiveSection(beats.length, scrollRootRef);
  const activeBeat = beats[active];

  useEffect(() => {
    const scene = sceneRef.current;
    const scroller = scrollRootRef.current;
    if (!scene || !scroller) return;

    const normalizeDelta = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * scroller.clientHeight * 0.9;
      return event.deltaY;
    };

    const onWheel = (event: WheelEvent) => {
      if (window.innerWidth < 1024) return;

      const deltaY = normalizeDelta(event);
      if (Math.abs(deltaY) < WHEEL_EPSILON) return;

      const rect = scene.getBoundingClientRect();
      const headerOffset = 56;
      const isSceneOnScreen = rect.top < window.innerHeight && rect.bottom > headerOffset;
      if (!isSceneOnScreen) return;

      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const currentScroll = scroller.scrollTop;
      const nextScroll = clamp(currentScroll + deltaY, 0, maxScroll);
      const didConsume = Math.abs(nextScroll - currentScroll) > WHEEL_EPSILON;

      if (!didConsume) return;

      event.preventDefault();
      event.stopPropagation();
      scroller.scrollTop = nextScroll;
    };

    scene.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scene.removeEventListener("wheel", onWheel);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024 || event.pointerType !== "mouse" || event.button !== 0) return;

    const scroller = scrollRootRef.current;
    if (!scroller) return;

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scroller.scrollTop,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scroller = scrollRootRef.current;
    const dragState = dragStateRef.current;
    if (!scroller || !dragState.active || dragState.pointerId !== event.pointerId) return;

    const deltaY = event.clientY - dragState.startY;
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = clamp(dragState.startScrollTop - deltaY, 0, maxScroll);
    event.preventDefault();
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = {
      active: false,
      pointerId: null,
      startY: 0,
      startScrollTop: 0,
    };

    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div id="how-and-why" className="relative py-16 lg:py-20">
      <div className="max-w-[860px] mx-auto px-6 lg:px-12 mb-10 lg:mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-4">
          III &nbsp;·&nbsp; How it works &amp; why it works
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-[56px] leading-[1.04] tracking-[-0.02em] text-foreground max-w-[780px]">
          Three quiet steps,
          <br />
          <em className="italic text-primary font-normal">five reasons it holds up.</em>
        </h2>
        <p className="mt-5 font-serif italic text-[16px] text-muted-foreground max-w-[560px]">
          Scroll through what Vyana does, then through the published evidence each
          step rests on. The right pane updates as you read.
        </p>
      </div>

      <div className="hidden lg:block max-w-[1280px] mx-auto px-12">
        <div
          ref={sceneRef}
          className="grid grid-cols-[minmax(0,1fr)_560px] gap-20 h-[calc(100svh-10rem)] min-h-[680px]"
        >
          <div className="flex flex-col min-h-0">
            <div
              ref={scrollRootRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={`relative flex-1 min-h-0 overflow-y-auto pr-8 overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                isDragging ? "cursor-grabbing select-none" : "cursor-grab"
              }`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10" />

              {beats.map((b, i) => {
                const showsChapterBreak = i > 0 && b.chapter !== beats[i - 1].chapter;
                return (
                  <section
                    key={i}
                    ref={registerRef(i)}
                    className="min-h-full flex items-center py-8"
                  >
                    <article
                      className={`max-w-[520px] transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                        active === i ? "opacity-100 translate-y-0" : "opacity-35 translate-y-1"
                      }`}
                      style={{ filter: active === i ? "blur(0)" : "blur(0.6px)" }}
                    >
                      {showsChapterBreak && (
                        <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
                          <span className="h-px w-10 bg-primary/50" />
                          Why it holds up
                        </div>
                      )}

                      <div className="flex items-baseline gap-3 mb-5">
                        <span className="font-serif italic text-[15px] text-primary">
                          {b.numeral}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                          {b.eyebrow}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")} / {beats.length}
                        </span>
                      </div>

                      <h3 className="font-serif text-[34px] leading-[1.08] tracking-[-0.01em] text-foreground mb-6">
                        {b.framework}
                      </h3>

                      <p className="font-serif italic text-[14px] text-muted-foreground leading-[1.65] mb-6 pl-4 border-l-2 border-primary/30">
                        {b.citation}
                      </p>

                      <p className="text-[17px] leading-[1.6] text-foreground/85">
                        {b.takeaway}
                      </p>
                    </article>
                  </section>
                );
              })}
            </div>
          </div>

          <div className="relative h-full overflow-hidden">
            <div
              className={`relative h-full rounded-[28px] border border-border/40 shadow-[0_40px_100px_-40px_hsl(22_25%_15%/0.25)] overflow-hidden transition-colors duration-500 ${
                activeBeat.fullBleed
                  ? "bg-[hsl(22_25%_10%)]"
                  : "bg-gradient-to-br from-[hsl(36_30%_94%)] to-[hsl(36_25%_88%)]"
              }`}
            >
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: "radial-gradient(hsl(22 25% 15%) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="absolute top-6 left-6 z-10 pointer-events-none">
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

              <div className="absolute top-6 right-6 z-10 flex gap-1.5 pointer-events-none">
                {pillars.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      active === i ? "w-6 bg-primary" : "w-1.5 bg-foreground/20"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none">
                {pillars.map((p, i) => {
                  const Artifact = p.Artifact;
                  return (
                    <div
                      key={i}
                      className={`absolute inset-0 flex items-center justify-center px-8 transition-all duration-500 ${
                        active === i
                          ? "opacity-100 translate-y-0"
                          : active > i
                            ? "opacity-0 -translate-y-4"
                            : "opacity-0 translate-y-4"
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
      </div>

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
