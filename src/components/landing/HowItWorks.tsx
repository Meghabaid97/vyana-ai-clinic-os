const steps = [
  {
    n: "01",
    title: "Capture, in seconds",
    body: "Snap any prescription, lab report or discharge summary. Vyana’s vision AI extracts vitals, medications and diagnoses — handwritten or printed, in five Indian languages.",
  },
  {
    n: "02",
    title: "Build a quiet memory",
    body: "Thirty-three clinical vitals plotted across years. HbA1c trends. BP patterns. Kidney function. The slow-moving signals doctors rarely get to see.",
  },
  {
    n: "03",
    title: "Walk in prepared",
    body: "Generate a one-page clinical briefing any doctor can read in thirty seconds. Share it on WhatsApp before the appointment. Never start from zero again.",
  },
];

import { useReveal } from "@/hooks/use-reveal";

const StepRow = ({ s, idx }: { s: typeof steps[number]; idx: number }) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal reveal-delay-${Math.min(idx + 1, 4)} ${visible ? "is-visible" : ""} grid md:grid-cols-12 gap-6 md:gap-12 items-start border-t border-border pt-10`}
    >
      <div className="md:col-span-2">
        <span className="font-serif italic text-5xl text-primary">{s.n}</span>
      </div>
      <div className="md:col-span-10 max-w-[640px]">
        <h3 className="font-serif text-2xl sm:text-3xl text-foreground mb-3 leading-tight">
          {s.title}
        </h3>
        <p className="text-[15px] text-muted-foreground leading-[1.75]">
          {s.body}
        </p>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const header = useReveal<HTMLDivElement>();
  return (
    <section id="how" className="py-24 lg:py-32">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div ref={header.ref} className={`reveal ${header.visible ? "is-visible" : ""} max-w-[640px] mb-16`}>
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-4">
            IV &nbsp;·&nbsp; How it works
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
            Three quiet steps.
            <br />
            <em className="italic text-primary font-normal">A lifetime of context.</em>
          </h2>
        </div>

        <div className="space-y-16">
          {steps.map((s, i) => (
            <StepRow key={s.n} s={s} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

