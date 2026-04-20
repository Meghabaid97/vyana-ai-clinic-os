import { useReveal } from "@/hooks/use-reveal";

type Quote = {
  body: string;
  attribution: string;
  context: string;
};

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
  {
    body: "I just want one place where his whole story lives. So the next doctor doesn't start from zero again.",
    attribution: "A wife",
    context: "Mumbai · twelve years of cardiology visits",
  },
];

const QuoteWall = () => {
  const { ref: sectionRef, visible } = useReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      id="voices"
      className="relative py-32 lg:py-40 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(36 30% 96%) 0%, hsl(34 28% 93%) 100%)",
      }}
    >
      {/* Subtle paper grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(hsl(22 25% 20% / 0.18) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="relative max-w-[1100px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div
          className={`max-w-[640px] mb-20 lg:mb-28 transition-all duration-1000 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-semibold mb-5">
            Voices · Why this exists
          </p>
          <h2 className="font-serif text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-[-0.02em] text-foreground">
            Every Indian family
            <br />
            <em className="italic text-primary font-normal">
              has a version of this story.
            </em>
          </h2>
        </div>

        {/* Quote grid — asymmetric editorial layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-20 lg:gap-y-28">
          {quotes.map((q, i) => {
            // Editorial offsets — large, then medium, then large, then medium
            const layouts = [
              "md:col-span-7 md:col-start-1",
              "md:col-span-5 md:col-start-8 md:mt-20",
              "md:col-span-6 md:col-start-2",
              "md:col-span-5 md:col-start-8 md:mt-12",
            ];
            const sizes = [
              "text-[28px] sm:text-[36px] lg:text-[42px]",
              "text-[22px] sm:text-[26px] lg:text-[30px]",
              "text-[26px] sm:text-[32px] lg:text-[38px]",
              "text-[22px] sm:text-[26px] lg:text-[30px]",
            ];

            return (
              <QuoteBlock
                key={i}
                quote={q}
                index={i}
                layoutClass={layouts[i]}
                sizeClass={sizes[i]}
              />
            );
          })}
        </div>

        {/* Closing line */}
        <div className="mt-28 lg:mt-36 max-w-[560px] mx-auto text-center">
          <div className="w-12 h-px bg-primary/40 mx-auto mb-6" />
          <p className="font-serif italic text-[20px] sm:text-[24px] leading-[1.5] text-foreground/80">
            We are building Vyana so the next family
            <br className="hidden sm:block" />
            never has to start from zero.
          </p>
        </div>
      </div>
    </section>
  );
};

const QuoteBlock = ({
  quote,
  index,
  layoutClass,
  sizeClass,
}: {
  quote: Quote;
  index: number;
  layoutClass: string;
  sizeClass: string;
}) => {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <figure
      ref={ref}
      className={`${layoutClass} transition-all duration-1000 ease-out`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <span
        aria-hidden
        className="block font-serif text-primary/60 leading-none mb-2"
        style={{ fontSize: "clamp(56px, 7vw, 88px)" }}
      >
        “
      </span>
      <blockquote
        className={`font-serif ${sizeClass} leading-[1.25] tracking-[-0.01em] text-foreground/90`}
      >
        {quote.body}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="block w-6 h-px bg-primary/50" />
        <span className="text-[13px] tracking-[0.05em] text-foreground/70">
          <span className="font-semibold text-foreground">{quote.attribution}</span>
          <span className="text-foreground/50"> · {quote.context}</span>
        </span>
      </figcaption>
    </figure>
  );
};

export default QuoteWall;
