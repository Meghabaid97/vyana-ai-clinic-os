import { useReveal } from "@/hooks/use-reveal";

const outputs = [
  "A one-screen medical summary",
  "Trends across time (BP, HbA1c, eGFR)",
  "Medication and diagnosis history",
  "Abnormal signals highlighted",
];

const outcomes = [
  { stop: "Stop repeating tests", gain: "Save money" },
  { stop: "Stop guessing history", gain: "Better care" },
  { stop: "Stop losing reports", gain: "Stay in control" },
];

const OutcomeSection = () => {
  const header = useReveal<HTMLDivElement>();
  const out = useReveal<HTMLDivElement>();
  const flips = useReveal<HTMLDivElement>();

  return (
    <section id="output" className="relative py-28 lg:py-36 bg-[hsl(22_25%_10%)]">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12 space-y-24">
        <div>
          <div
            ref={header.ref}
            className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-12`}
          >
            <p className="font-serif italic text-[15px] text-primary/90 mb-5">
              What you walk in with
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-white">
              Your next appointment,
              <br />
              <em className="italic text-primary font-normal">already prepared.</em>
            </h2>
          </div>
          <div
            ref={out.ref}
            className={`reveal ${out.visible ? "is-visible" : ""} grid sm:grid-cols-2 gap-4 max-w-[820px]`}
          >
            {outputs.map((o, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} ${out.visible ? "is-visible" : ""} flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5`}
              >
                <span className="font-serif text-primary text-[22px] leading-none mt-0.5">·</span>
                <span className="text-[15px] leading-[1.55] text-[hsl(36_25%_88%)]">{o}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={flips.ref}
          className={`reveal ${flips.visible ? "is-visible" : ""}`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            What it actually does for you
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {outcomes.map((o, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} ${flips.visible ? "is-visible" : ""} rounded-2xl border border-white/10 bg-white/[0.03] p-7`}
              >
                <p className="text-[14px] text-[hsl(36_15%_60%)] line-through">
                  {o.stop}
                </p>
                <p className="mt-3 font-serif text-[26px] leading-[1.15] text-white tracking-[-0.01em]">
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
