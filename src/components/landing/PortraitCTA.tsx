import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const PortraitCTA = () => {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [relation, setRelation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    // Light-touch: just show success. Real wiring can be added later.
    await new Promise((r) => setTimeout(r, 600));
    toast.success("You're on the waitlist. We'll be in touch.");
    setEmail("");
    setCity("");
    setRelation("");
    setSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[hsl(22_25%_8%)] py-32 lg:py-40"
    >
      {/* Warm gradient backdrop — no photo */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(14 62% 22%) 0%, hsl(22 30% 12%) 55%, hsl(22 25% 8%) 100%)",
          }}
        />
        {/* Subtle warm grain */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(hsl(36 40% 80% / 0.4) 0.6px, transparent 0.6px)",
            backgroundSize: "3px 3px",
          }}
        />
        {/* Top fade into previous section */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[hsl(36_30%_96%)] to-transparent" />
      </div>

      {/* Floating amber particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", left: "10%", delay: "0s", size: 1.5 },
          { top: "30%", left: "82%", delay: "1.3s", size: 2 },
          { top: "60%", left: "18%", delay: "2.4s", size: 1 },
          { top: "78%", left: "78%", delay: "0.6s", size: 1.5 },
          { top: "88%", left: "40%", delay: "3.0s", size: 2 },
          { top: "20%", left: "55%", delay: "1.8s", size: 1 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/70 animate-soft-float"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size * 4}px`,
              height: `${p.size * 4}px`,
              animationDelay: p.delay,
              filter: "blur(0.5px)",
              boxShadow: "0 0 12px hsl(14 62% 54% / 0.6)",
            }}
          />
        ))}
      </div>

      {/* Centered dark CTA card */}
      <div className="relative z-10 max-w-[640px] mx-auto px-6">
        <div
          className="rounded-2xl px-8 sm:px-12 py-12 sm:py-14 text-center backdrop-blur-sm border animate-fade-in"
          style={{
            background: "hsl(22 25% 10% / 0.92)",
            borderColor: "hsl(36 25% 70% / 0.18)",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.7)",
          }}
        >
          <p className="text-[11px] tracking-[0.35em] uppercase text-primary font-semibold mb-6">
            Try Vyana now
          </p>
          <h2 className="font-serif text-[36px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] text-white">
            Start your family's
            <br />
            <em className="italic text-primary font-normal">health story today.</em>
          </h2>
          <p className="mt-6 text-[15px] text-[hsl(36_25%_82%)] leading-relaxed max-w-[460px] mx-auto">
            Free to start. Built for every Indian family, whether you're managing
            a single prescription or a decade of hospital visits. The next
            emergency shouldn't begin with a blank page.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-3 text-left">
            <Input
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-[hsl(22_25%_14%/0.8)] border-[hsl(36_25%_70%/0.2)] text-white placeholder:text-[hsl(36_15%_55%)] focus-visible:ring-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Who you care for"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="h-12 bg-[hsl(22_25%_14%/0.8)] border-[hsl(36_25%_70%/0.2)] text-white placeholder:text-[hsl(36_15%_55%)] focus-visible:ring-primary"
              />
              <Input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 bg-[hsl(22_25%_14%/0.8)] border-[hsl(36_25%_70%/0.2)] text-white placeholder:text-[hsl(36_15%_55%)] focus-visible:ring-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="group w-full h-12 mt-2 rounded-lg text-[15px] bg-primary hover:bg-primary/90"
            >
              {submitting ? "Getting you in…" : "Try Vyana now"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>

          <p className="mt-6 text-[11px] tracking-[0.15em] uppercase text-[hsl(36_15%_55%)]">
            Built in Tirupur · Wharton · For Indian families
          </p>
        </div>
      </div>
    </section>
  );
};

export default PortraitCTA;
