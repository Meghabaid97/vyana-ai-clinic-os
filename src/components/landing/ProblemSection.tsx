import { useReveal } from "@/hooks/use-reveal";

const stats = [
  { k: "75 pages", v: "of scattered reports across hospitals, clinics and labs." },
  { k: "5 minutes", v: "to explain a lifetime of history to a doctor who has never seen you." },
  { k: "0 context", v: "every new specialist starts from a blank page." },
];

const consequences = ["Repeated tests", "Missed patterns", "Delayed diagnoses"];

const ProblemSection = () => {
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  return (
    <section id="problem" className="relative bg-background py-28 lg:py-36 border-t border-border/60">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            The problem
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[72px] leading-[1.02] tracking-[-0.02em] text-foreground">
            Healthcare is broken in
            <br />
            <em className="italic text-primary font-normal">one simple way.</em>
          </h2>
          <p className="mt-8 text-[18px] leading-[1.65] text-foreground/75 max-w-[560px]">
            Every time you visit a new doctor, you start from scratch. Your
            history sits in folders, drawers and inboxes nobody reads.
          </p>
        </div>

        <div
          ref={grid.ref}
          className={`reveal ${grid.visible ? "is-visible" : ""} grid md:grid-cols-3 gap-6 lg:gap-8 mb-16`}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={`reveal reveal-delay-${i + 1} ${grid.visible ? "is-visible" : ""} rounded-2xl border border-border bg-card p-8`}
            >
              <div className="font-serif text-[42px] leading-none text-primary tracking-[-0.02em]">
                {s.k}
              </div>
              <p className="mt-5 text-[15px] leading-[1.65] text-foreground/75">
                {s.v}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-[760px]">
          <p className="text-[12px] tracking-[0.3em] uppercase text-foreground/55 mb-4">
            This leads to
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            {consequences.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border px-4 py-2 text-[14px] text-foreground/80 bg-card"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="font-serif italic text-[20px] sm:text-[24px] leading-[1.5] text-foreground/85 max-w-[620px]">
            This isn't a productivity problem. It's a life problem. In
            emergencies, families have minutes to explain years of history,
            and patients pay the price.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
