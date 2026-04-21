import { useReveal } from "@/hooks/use-reveal";

const outputs = [
  "A 1-screen medical summary",
  "Trends across time (BP, HbA1c, eGFR)",
  "Medication and diagnosis history",
  "Abnormal signals highlighted",
];

const outcomes = [
  { stop: "Stop repeating tests", gain: "Save money" },
  { stop: "Stop guessing history", gain: "Better care" },
  { stop: "Stop losing reports", gain: "Stay in control" },
];

const moments = [
  { h: "Emergency at 2 AM", b: "The ER doctor sees your full history before you finish signing in." },
  { h: "A new specialist visit", b: "No folder, no repeat tests. They open one screen and start." },
  { h: "Managing chronic conditions", b: "Trends across years, not snapshots from one visit." },
];

const OutcomeSection = () => {
  const header = useReveal<HTMLDivElement>();
  const out = useReveal<HTMLDivElement>();
  const flips = useReveal<HTMLDivElement>();
  const use = useReveal<HTMLDivElement>();
  const why = useReveal<HTMLDivElement>();

  return (
    <section id="output" className="relative bg-background py-28 lg:py-36">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12 space-y-28">
        {/* OUTPUT */}
        <div>
          <div
            ref={header.ref}
            className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-12`}
          >
            <p className="font-serif italic text-[15px] text-primary/90 mb-5">
              What you walk in with
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-foreground">
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
                className={`reveal reveal-delay-${i + 1} ${out.visible ? "is-visible" : ""} flex items-start gap-4 rounded-xl border border-border bg-card p-5`}
              >
                <span className="font-serif text-primary text-[22px] leading-none mt-0.5">·</span>
                <span className="text-[15px] leading-[1.55] text-foreground/85">{o}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OUTCOMES — stop / gain */}
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
                className={`reveal reveal-delay-${i + 1} ${flips.visible ? "is-visible" : ""} rounded-2xl border border-border bg-card p-7`}
              >
                <p className="text-[14px] text-foreground/55 line-through">
                  {o.stop}
                </p>
                <p className="mt-3 font-serif text-[26px] leading-[1.15] text-foreground tracking-[-0.01em]">
                  <em className="italic text-primary font-normal">{o.gain}</em>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* USE CASE */}
        <div
          ref={use.ref}
          className={`reveal ${use.visible ? "is-visible" : ""} max-w-[920px]`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            When it matters most
          </p>
          <h3 className="font-serif text-3xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.02em] text-foreground mb-12">
            Everything you need is
            <br />
            <em className="italic text-primary font-normal">already there.</em>
          </h3>
          <div className="space-y-6">
            {moments.map((m, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} ${use.visible ? "is-visible" : ""} grid grid-cols-12 gap-6 items-baseline border-b border-border pb-6`}
              >
                <div className="col-span-12 md:col-span-5 font-serif text-[22px] sm:text-[26px] leading-tight text-foreground tracking-[-0.01em]">
                  {m.h}
                </div>
                <div className="col-span-12 md:col-span-7 text-[15px] leading-[1.65] text-foreground/75">
                  {m.b}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WHY NOW */}
        <div
          ref={why.ref}
          className={`reveal ${why.visible ? "is-visible" : ""} max-w-[820px]`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            Why now
          </p>
          <h3 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
            Healthcare data is fragmented.
            <br />
            AI can finally structure it.
            <br />
            <em className="italic text-primary font-normal">Patients are still doing the work.</em>
          </h3>
          <p className="mt-8 text-[17px] leading-[1.65] text-foreground/75 max-w-[620px]">
            Over time, Vyana becomes a lifelong clinical memory: a foundation
            for better decisions, a system that learns from your health
            journey.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OutcomeSection;
