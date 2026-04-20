const TeamSection = () => {
  return (
    <section id="team" className="py-24 lg:py-32 bg-muted/40 border-y border-border">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="max-w-[640px] mb-14">
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-4">
            V &nbsp;·&nbsp; Built by
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
            A founder who
            <br />
            <em className="italic text-primary font-normal">lived this problem.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-4">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              The Founder
            </p>
            <h3 className="font-serif text-2xl text-foreground mb-2">Megha Baid</h3>
            <p className="text-[13px] text-muted-foreground italic">
              Wharton MBA · Healthcare & AI
            </p>
          </div>
          <div className="md:col-span-8 max-w-[640px] space-y-4 text-[15px] leading-[1.8] text-muted-foreground">
            <p>
              Megha is building Vyana out of Wharton, where she focuses on
              healthcare and applied AI. Before Wharton, she spent years in
              product and operations across consumer technology in India.
            </p>
            <p>
              Vyana began in Tirupur, Tamil Nadu in 2005 — when she lost both
              grandparents to medical emergencies that arrived at hospitals with
              no records, no history, and five minutes to explain a lifetime.
              Fifteen years later, she watched her father survive intestinal
              gangrene during COVID with the same gap. Vyana is the layer that
              would have changed both nights.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-10">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Affiliated with
          </p>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
            <span className="font-serif text-xl text-foreground/70">The Wharton School</span>
            <span className="text-border">·</span>
            <span className="font-serif text-xl text-foreground/70 italic">University of Pennsylvania</span>
            <span className="text-border">·</span>
            <span className="font-serif text-xl text-foreground/70">ABDM-aligned</span>
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground italic max-w-[600px]">
            Clinical advisors from Indian tertiary hospitals contributing to
            our risk engine and briefing protocols.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
