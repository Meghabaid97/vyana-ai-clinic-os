import { Shield, Lock, FileCheck, Heart, GraduationCap } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const badges = [
  { icon: Lock, label: "End-to-end encrypted", sub: "AES-256 at rest" },
  { icon: Shield, label: "ABDM-aligned", sub: "India's national health stack" },
  { icon: FileCheck, label: "DPDPA 2023 compliant", sub: "Indian data law" },
  { icon: Heart, label: "Your data, your control", sub: "Delete anytime" },
  { icon: GraduationCap, label: "Built at Wharton", sub: "Healthcare & AI research" },
];

const TrustStrip = () => {
  const header = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();

  return (
    <section id="trust" className="py-24 lg:py-32 bg-background border-t border-border">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`max-w-[640px] mb-14 transition-all duration-700 ${
            header.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-5">
            V &nbsp;·&nbsp; Trust
          </p>
          <h2 className="font-serif text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-foreground">
            Your records belong to you.
            <br />
            <em className="italic text-primary font-normal">We never sell them. Ever.</em>
          </h2>
          <p className="mt-6 text-[15.5px] leading-[1.75] text-muted-foreground">
            Vyana is built on India's national health standards and protected by
            the same encryption banks use. You can export everything, share with
            any doctor, or delete it all in one tap.
          </p>
        </div>

        <div
          ref={grid.ref}
          className={`grid grid-cols-2 md:grid-cols-5 gap-3 transition-all duration-700 delay-150 ${
            grid.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {badges.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-5 flex flex-col items-start gap-3 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[13.5px] font-medium text-foreground leading-tight">
                  {label}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] italic text-muted-foreground/80 max-w-[620px]">
          A note on ABDM: Vyana follows India's Ayushman Bharat Digital Mission
          standards for health records and identity. Full sandbox certification
          is in progress.
        </p>
      </div>
    </section>
  );
};

export default TrustStrip;
