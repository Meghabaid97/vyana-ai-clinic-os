import { useReveal } from "@/hooks/use-reveal";

const pillars = [
  {
    n: "01",
    title: "Tracks conditions over time",
    body: "HbA1c, BP, kidney function, thyroid. The slow signals plotted across years, not visits.",
  },
  {
    n: "02",
    title: "Connects the dots",
    body: "Tests, medications and symptoms linked into one continuous graph, not scattered files.",
  },
  {
    n: "03",
    title: "Surfaces what changed",
    body: "Abnormal patterns and shifts highlighted before they become emergencies.",
  },
];

const WedgeSection = () => {
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  return (
    <section id="wedge" className="relative py-32 lg:py-40 bg-surface-dark">
      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[820px] mb-20`}
        >
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[80px] leading-[1.0] tracking-[-0.02em] text-surface-dark-foreground">
            Not a health records app.
            <br />
            <em className="italic text-primary font-normal">A clinical memory system.</em>
          </h2>
          <p className="mt-8 text-[18px] leading-[1.65] text-surface-dark-muted max-w-[620px]">
            Vyana doesn't just store files. It builds a continuous health
            graph, so doctors see your full story in seconds, not silos.
          </p>
        </div>

        <div
          ref={grid.ref}
          className={`reveal ${grid.visible ? "is-visible" : ""} grid md:grid-cols-3 gap-6 lg:gap-8`}
        >
          {pillars.map((p, i) => (
            <div
              key={p.n}
              className={`reveal reveal-delay-${i + 1} ${grid.visible ? "is-visible" : ""} rounded-2xl border border-white/10 bg-white/[0.03] p-8`}
            >
              <div className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-6">
                {p.n}
              </div>
              <h3 className="font-serif text-[26px] leading-[1.15] text-surface-dark-foreground tracking-[-0.01em]">
                {p.title}
              </h3>
              <p className="mt-4 text-[15px] leading-[1.65] text-surface-dark-muted">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WedgeSection;
