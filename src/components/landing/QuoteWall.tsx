import { useReveal } from "@/hooks/use-reveal";

type Quote = { body: string; attribution: string; context: string };

const quotes: Quote[] = [
  {
    body: "We had five minutes to explain everything. We didn't even know where to start.",
    attribution: "A daughter",
    context: "Chennai · about her mother's last admission",
  },
  {
    body: "Every new doctor sends us back for the same blood tests. We have a folder this thick. Nobody reads it.",
    attribution: "A son",
    context: "Bengaluru · caring for his diabetic father",
  },
  {
    body: "Appa's surgery was at 2 AM. I was holding three prescriptions and a CT scan from a hospital in another city.",
    attribution: "A founder",
    context: "Delhi · the night Vyana was born",
  },
];

const QuoteWall = () => {
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  return (
    <section
      id="voices"
      className="relative bg-background py-28 lg:py-36 border-t border-border/60"
    >
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[640px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            Voices
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-foreground">
            Every Indian family
            <br />
            <em className="italic text-primary font-normal">has a version of this story.</em>
          </h2>
        </div>

        <div
          ref={grid.ref}
          className={`reveal ${grid.visible ? "is-visible" : ""} grid md:grid-cols-3 gap-6 lg:gap-8`}
        >
          {quotes.map((q, i) => (
            <figure
              key={i}
              className={`reveal reveal-delay-${i + 1} ${grid.visible ? "is-visible" : ""} rounded-2xl border border-border bg-card p-8`}
            >
              <span
                aria-hidden
                className="block font-serif text-primary/60 leading-none mb-2 text-[56px]"
              >
                "
              </span>
              <blockquote className="font-serif text-[20px] sm:text-[22px] leading-[1.35] tracking-[-0.01em] text-foreground/90">
                {q.body}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="block w-6 h-px bg-primary/50" />
                <span className="text-[13px] text-foreground/70">
                  <span className="font-semibold text-foreground">{q.attribution}</span>
                  <span className="text-foreground/50"> · {q.context}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuoteWall;
