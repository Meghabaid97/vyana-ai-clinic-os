import { Lock, Shield, FileCheck, EyeOff } from "lucide-react";

const items = [
  {
    icon: Lock,
    title: "End-to-end encrypted",
    sub: "AES-256 at rest, TLS 1.3 in transit. Only you hold the key.",
  },
  {
    icon: EyeOff,
    title: "Never sold. Never shared.",
    sub: "Your records are never sold to insurers, pharma, or advertisers.",
  },
  {
    icon: FileCheck,
    title: "DPDPA 2023 compliant",
    sub: "Built to India's Digital Personal Data Protection Act.",
  },
  {
    icon: Shield,
    title: "You control access",
    sub: "Share via time-limited links. Revoke anytime. Full audit log.",
  },
];

const TrustReassuranceStrip = () => {
  return (
    <section className="px-4 sm:px-5 pb-5 lg:px-0 lg:pb-0">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-border bg-muted/30">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary mb-1.5">
            Your data, your rules
          </p>
          <h3 className="text-[15px] lg:text-base font-bold text-foreground leading-tight">
            Private by design. Encrypted by default.
          </h3>
          <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
            Medical records are deeply personal. Here is exactly how we protect yours.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {items.map(({ icon: Icon, title, sub }, i) => (
            <div
              key={title}
              className={`p-4 flex items-start gap-3 ${i >= 2 ? "sm:border-t sm:border-border" : ""}`}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight">{title}</p>
                <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/20">
          <p className="text-[11px] italic text-muted-foreground leading-snug">
            We are clinicians and engineers building the system we wish our own families had. Your trust is the only product.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustReassuranceStrip;
