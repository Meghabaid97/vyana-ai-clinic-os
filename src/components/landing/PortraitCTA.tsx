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
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Welcome to Vyana. Let's get started.");
    setEmail("");
    setCity("");
    setRelation("");
    setSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="relative bg-background py-28 lg:py-36"
    >
      <div className="relative z-10 max-w-[640px] mx-auto px-6 text-center">
        <h2 className="font-serif text-[40px] sm:text-[60px] leading-[1.02] tracking-[-0.02em] text-foreground">
          Start your family's
          <br />
          <em className="italic text-primary font-normal">health memory today.</em>
        </h2>
        <p className="mt-6 text-[16px] text-foreground/70 leading-relaxed max-w-[480px] mx-auto">
          Free to start. Upload your first report in thirty seconds.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-3 text-left max-w-[480px] mx-auto">
          <Input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-card border-border focus-visible:ring-primary"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="Who you care for"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="h-12 bg-card border-border focus-visible:ring-primary"
            />
            <Input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 bg-card border-border focus-visible:ring-primary"
            />
          </div>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => (window.location.href = "/auth")}
            className="group w-full h-12 mt-2 rounded-lg text-[15px]"
          >
            Get started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-border flex flex-col items-center gap-1.5">
          <p className="text-[11px] tracking-[0.2em] uppercase text-foreground/55">
            With care,
          </p>
          <span
            aria-label="Megha, founder"
            className="text-[28px] sm:text-[32px] text-primary leading-none"
            style={{
              fontFamily: '"Homemade Apple", "Caveat", cursive',
              transform: "rotate(-3deg)",
              letterSpacing: "0.02em",
            }}
          >
            Megha
          </span>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/45 mt-1">
            Founder · Vyana
          </p>
        </div>
      </div>
    </section>
  );
};

export default PortraitCTA;
